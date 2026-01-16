import { NextRequest, NextResponse } from "next/server";
import { withAuth, apiSuccess, apiError, apiNotFound } from "@/lib/api-auth";
import { getPaymentHistory, getMilestoneById, recordPaymentAtomically } from "@/lib/api-db";
import { createHash } from "crypto";

type Params = { params: Promise<{ id: string }> };

// Idempotency key header name (standard convention)
const IDEMPOTENCY_KEY_HEADER = "idempotency-key";

/**
 * Create a short hash of the request body for idempotency key
 * This ensures that different payloads with the same idempotency key are rejected
 */
function hashBody(body: string): string {
  return createHash("sha256").update(body).digest("hex").substring(0, 16);
}

/**
 * GET /api/v1/milestones/[id]/payment-history
 * Get payment history for milestone
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    const milestone = await getMilestoneById(supabase, user.id, id);
    if (!milestone) {
      return apiNotFound("Milestone");
    }

    const history = await getPaymentHistory(supabase, user.id, id);
    return apiSuccess(history);
  });
}

/**
 * POST /api/v1/milestones/[id]/payment-history
 * Add payment history entry and update milestone paid_amount atomically
 * Uses atomic function to prevent race conditions
 * Supports Idempotency-Key header to prevent duplicate payments on network retries
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    try {
      // Read body as text first (can only be read once)
      const bodyText = await request.text();
      const bodyHash = hashBody(bodyText);

      // Check for idempotency key
      const idempotencyKey = request.headers.get(IDEMPOTENCY_KEY_HEADER);

      if (idempotencyKey) {
        // Validate key format (should be a reasonable string, not too long)
        if (typeof idempotencyKey !== "string" || idempotencyKey.length > 255) {
          return apiError("Invalid Idempotency-Key format");
        }

        // Include body hash in the key to ensure identical payloads
        // This prevents returning cached response for different amounts
        const fullKey = `payment:${id}:${idempotencyKey}:${bodyHash}`;

        // Check if this exact key+payload combination was already used
        const { data: existing } = await supabase.rpc("check_idempotency_key", {
          p_key: fullKey,
          p_user_id: user.id,
        });

        if (existing?.exists) {
          // Return cached response with indication it's a replay
          const response = NextResponse.json(existing.response, { status: existing.response.status || 201 });
          response.headers.set("Idempotent-Replayed", "true");
          return response;
        }
      }

      // Parse body as JSON
      let amount: number;
      let note: string | undefined;
      try {
        const parsed = JSON.parse(bodyText);
        amount = parsed.amount;
        note = parsed.note;
      } catch {
        return apiError("Invalid JSON in request body");
      }

      if (amount === undefined || typeof amount !== "number") {
        return apiError("Amount is required and must be a number");
      }

      if (!Number.isFinite(amount) || amount === 0) {
        return apiError("Amount must be a non-zero finite number");
      }

      // Validate amount is positive (negative amounts should use explicit refund endpoint)
      if (amount < 0) {
        return apiError("Amount must be positive. Use refund endpoint for reversals.");
      }

      // Validate note length if provided
      if (note !== undefined && typeof note === "string" && note.length > 5000) {
        return apiError("Note is too long (max 5000 characters)");
      }

      // Use atomic function to add payment and update milestone in single transaction
      // This prevents race conditions where multiple payments could cause incorrect totals
      const result = await recordPaymentAtomically(supabase, user.id, id, { amount, note });
      if (!result) {
        return apiNotFound("Milestone not found or payment failed");
      }

      const responseData = { success: true, data: result.entry };

      // Store idempotency key if provided (with body hash)
      if (idempotencyKey) {
        const fullKey = `payment:${id}:${idempotencyKey}:${bodyHash}`;
        await supabase.rpc("store_idempotency_key", {
          p_key: fullKey,
          p_user_id: user.id,
          p_response: { ...responseData, status: 201 },
        });
      }

      return apiSuccess(result.entry, 201);
    } catch {
      return apiError("Invalid request");
    }
  });
}

/**
 * PATCH /api/v1/milestones/[id]/payment-history
 * Record payment - adds to payment history and updates milestone paid_amount atomically
 * Uses sum of all payment history entries to avoid race conditions
 * Used by iOS app - returns updated milestone
 * Supports Idempotency-Key header to prevent duplicate payments on network retries
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    try {
      // Read body as text first (can only be read once)
      const bodyText = await request.text();
      const bodyHash = hashBody(bodyText);

      // Check for idempotency key
      const idempotencyKey = request.headers.get(IDEMPOTENCY_KEY_HEADER);

      if (idempotencyKey) {
        // Validate key format
        if (typeof idempotencyKey !== "string" || idempotencyKey.length > 255) {
          return apiError("Invalid Idempotency-Key format");
        }

        // Include body hash in the key to ensure identical payloads
        const fullKey = `payment_patch:${id}:${idempotencyKey}:${bodyHash}`;

        // Check if this exact key+payload combination was already used
        const { data: existing } = await supabase.rpc("check_idempotency_key", {
          p_key: fullKey,
          p_user_id: user.id,
        });

        if (existing?.exists) {
          // Return cached response with indication it's a replay
          const response = NextResponse.json(existing.response, { status: existing.response.status || 200 });
          response.headers.set("Idempotent-Replayed", "true");
          return response;
        }
      }

      // Parse body as JSON
      let amount: number;
      let note: string | undefined;
      try {
        const parsed = JSON.parse(bodyText);
        amount = parsed.amount;
        note = parsed.note;
      } catch {
        return apiError("Invalid JSON in request body");
      }

      if (amount === undefined || typeof amount !== "number") {
        return apiError("Amount is required and must be a number");
      }

      if (!Number.isFinite(amount) || amount === 0) {
        return apiError("Amount must be a non-zero finite number");
      }

      // Validate amount is positive (negative amounts should use explicit refund endpoint)
      if (amount < 0) {
        return apiError("Amount must be positive. Use refund endpoint for reversals.");
      }

      // Validate note length if provided
      if (note !== undefined && typeof note === "string" && note.length > 5000) {
        return apiError("Note is too long (max 5000 characters)");
      }

      // Record payment atomically (adds to history + recalculates paid_amount)
      const result = await recordPaymentAtomically(supabase, user.id, id, { amount, note });

      if (!result) {
        return apiNotFound("Milestone not found or payment failed");
      }

      const responseData = { success: true, data: result.milestone };

      // Store idempotency key if provided (with body hash)
      if (idempotencyKey) {
        const fullKey = `payment_patch:${id}:${idempotencyKey}:${bodyHash}`;
        await supabase.rpc("store_idempotency_key", {
          p_key: fullKey,
          p_user_id: user.id,
          p_response: { ...responseData, status: 200 },
        });
      }

      return apiSuccess(result.milestone);
    } catch {
      return apiError("Invalid request");
    }
  });
}
