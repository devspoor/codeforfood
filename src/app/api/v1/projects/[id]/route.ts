import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiNotFound, apiError, handleApiError } from "@/lib/api-auth";
import { getProjectById, updateProject, deleteProject, getProjectSummary } from "@/lib/api-db";

// Validate boolean field - must be undefined, null, or actual boolean
function validateBoolean(value: unknown, fieldName: string): { valid: boolean; error?: string } {
  if (value === undefined || value === null) {
    return { valid: true };
  }
  if (typeof value !== "boolean") {
    return { valid: false, error: `${fieldName} must be a boolean` };
  }
  return { valid: true };
}

// Valid project statuses
const VALID_STATUSES = ["in_progress", "awaiting_payment", "completed", "on_hold"] as const;

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/projects/[id]
 * Get project by ID with all details
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    const project = await getProjectById(supabase, user.id, id);
    if (!project) {
      return apiNotFound("Project");
    }

    return apiSuccess({
      ...project,
      summary: getProjectSummary(project),
    });
  });
}

/**
 * PATCH /api/v1/projects/[id]
 * Update project
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    try {
      const { name, description, status, hide_amounts, hide_paid, show_payment_history, show_expenses } = await request.json();

      // Validate status if provided
      if (status !== undefined && status !== null) {
        if (typeof status !== "string" || !VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
          return apiError(`Status must be one of: ${VALID_STATUSES.join(", ")}`);
        }
      }

      // Validate boolean fields
      const hideAmountsValidation = validateBoolean(hide_amounts, "hide_amounts");
      if (!hideAmountsValidation.valid) return apiError(hideAmountsValidation.error!);

      const hidePaidValidation = validateBoolean(hide_paid, "hide_paid");
      if (!hidePaidValidation.valid) return apiError(hidePaidValidation.error!);

      const showPaymentHistoryValidation = validateBoolean(show_payment_history, "show_payment_history");
      if (!showPaymentHistoryValidation.valid) return apiError(showPaymentHistoryValidation.error!);

      const showExpensesValidation = validateBoolean(show_expenses, "show_expenses");
      if (!showExpensesValidation.valid) return apiError(showExpensesValidation.error!);

      // Validate name length if provided
      if (name !== undefined && typeof name === "string" && name.length > 500) {
        return apiError("Name must be 500 characters or less");
      }

      const project = await updateProject(supabase, user.id, id, {
        name,
        description,
        status,
        hide_amounts,
        hide_paid,
        show_payment_history,
        show_expenses,
      });

      if (!project) {
        return apiNotFound("Project");
      }

      return apiSuccess(project);
    } catch (error) {
      return handleApiError(error, "PATCH /api/v1/projects/[id]");
    }
  });
}

/**
 * DELETE /api/v1/projects/[id]
 * Delete project
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async ({ user, supabase }) => {
    const deleted = await deleteProject(supabase, user.id, id);
    if (!deleted) {
      return apiNotFound("Project");
    }

    return apiSuccess({ success: true });
  });
}
