import { NextRequest } from "next/server";
import { withAuth, apiSuccess, handleApiError } from "@/lib/api-auth";

type Period = "3m" | "6m" | "12m" | "all";

interface PaymentHistoryRow {
  id: string;
  amount: number;
  created_at: string;
  milestones: {
    id: string;
    project_id: string;
    projects: {
      id: string;
      name: string;
      currency: string;
      organizations: { id: string; name: string; user_id: string };
    };
  };
}

interface TimeEntryRow {
  hours: number | null;
  units: number | null;
  paid_amount: number;
}

interface MilestoneRow {
  id: string;
  amount: number;
  paid_amount: number;
  type: string;
  hourly_rate: number | null;
  unit_rate?: number | null;
  time_entries: TimeEntryRow[];
}

interface ProjectRow {
  id: string;
  name: string;
  currency: string;
  milestones: MilestoneRow[];
  organizations: { id: string; user_id: string };
}

interface InvoiceItemRow {
  amount: number;
}

interface InvoiceRow {
  id: string;
  status: string;
  due_date: string | null;
  currency: string;
  items: InvoiceItemRow[];
  projects: {
    id: string;
    organizations: { id: string; user_id: string };
  };
}

function getDateRange(period: Period): string | null {
  if (period === "all") return null;
  const now = new Date();
  const months = period === "3m" ? 3 : period === "6m" ? 6 : 12;
  now.setMonth(now.getMonth() - months);
  return now.toISOString();
}

/**
 * GET /api/v1/dashboard/charts?period=12m
 * Returns chart data for the revenue dashboard
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async ({ user, supabase }) => {
    try {
      const { searchParams } = new URL(request.url);
      const period = (searchParams.get("period") || "12m") as Period;
      if (!["3m", "6m", "12m", "all"].includes(period)) {
        return apiSuccess({ error: "Invalid period" });
      }

      const startDate = getDateRange(period);

      // Fetch all data in parallel
      const [
        paymentHistoryResult,
        projectsResult,
        invoicesResult,
      ] = await Promise.all([
        // Payment history with milestone -> project -> organization join
        supabase
          .from("payment_history")
          .select(`
            id, amount, created_at,
            milestones!inner(
              id, project_id,
              projects!inner(
                id, name, currency,
                organizations!inner(id, name, user_id)
              )
            )
          `)
          .eq("milestones.projects.organizations.user_id", user.id),

        // Projects with milestones for outstanding calculation
        supabase
          .from("projects")
          .select(`
            id, name, currency,
            milestones(id, amount, paid_amount, type, hourly_rate, time_entries(hours, units, paid_amount)),
            organizations!inner(id, user_id)
          `)
          .eq("organizations.user_id", user.id),

        // Invoices for cash flow forecast
        supabase
          .from("invoices")
          .select(`
            id, status, due_date, currency,
            items(amount),
            projects!inner(
              id,
              organizations!inner(id, user_id)
            )
          `)
          .eq("projects.organizations.user_id", user.id)
          .in("status", ["sent", "overdue"]),
      ]);

      // ---- 1. Revenue by Month ----
      const revenueByMonth: Array<{ month: string; currency: string; amount: number }> = [];
      const monthMap = new Map<string, number>();

      if (paymentHistoryResult.data) {
        for (const entry of paymentHistoryResult.data as unknown as PaymentHistoryRow[]) {
          const createdAt = new Date(entry.created_at);
          if (startDate && createdAt < new Date(startDate)) continue;

          const milestone = entry.milestones;
          const project = milestone?.projects;
          const currency = project?.currency || "USD";
          const month = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;
          const key = `${month}:${currency}`;

          monthMap.set(key, (monthMap.get(key) || 0) + (entry.amount || 0));
        }
      }

      for (const [key, amount] of monthMap) {
        const [month, currency] = key.split(":");
        revenueByMonth.push({ month, currency, amount: Math.round(amount * 100) / 100 });
      }
      revenueByMonth.sort((a, b) => a.month.localeCompare(b.month));

      // ---- 2. Revenue by Organization ----
      const revenueByOrganization: Array<{ name: string; amount: number; currency: string }> = [];
      const orgMap = new Map<string, number>();

      if (paymentHistoryResult.data) {
        for (const entry of paymentHistoryResult.data as unknown as PaymentHistoryRow[]) {
          const createdAt = new Date(entry.created_at);
          if (startDate && createdAt < new Date(startDate)) continue;

          const milestone = entry.milestones;
          const project = milestone?.projects;
          const org = project?.organizations;
          const currency = project?.currency || "USD";
          const orgName = org?.name || "Unknown";
          const key = `${orgName}:${currency}`;

          orgMap.set(key, (orgMap.get(key) || 0) + (entry.amount || 0));
        }
      }

      for (const [key, amount] of orgMap) {
        const [name, currency] = key.split(":");
        revenueByOrganization.push({ name, amount: Math.round(amount * 100) / 100, currency });
      }
      revenueByOrganization.sort((a, b) => b.amount - a.amount);

      // ---- 3. Outstanding by Project ----
      const outstandingByProject: Array<{ name: string; paid: number; remaining: number; currency: string }> = [];

      if (projectsResult.data) {
        for (const project of projectsResult.data as unknown as ProjectRow[]) {
          const currency = project.currency || "USD";
          let totalPaid = 0;
          let totalAmount = 0;

          for (const milestone of project.milestones || []) {
            if (milestone.type === "fixed") {
              totalAmount += milestone.amount || 0;
              totalPaid += milestone.paid_amount || 0;
            } else {
              // hourly or per_unit: sum from time_entries
              const entries = milestone.time_entries || [];
              for (const entry of entries) {
                const entryAmount = milestone.type === "hourly"
                  ? (entry.hours || 0) * (milestone.hourly_rate || 0)
                  : (entry.units || 0) * (milestone.unit_rate || 0);
                totalAmount += entryAmount;
                totalPaid += entry.paid_amount || 0;
              }
            }
          }

          const remaining = totalAmount - totalPaid;
          if (remaining > 0) {
            outstandingByProject.push({
              name: project.name,
              paid: Math.round(totalPaid * 100) / 100,
              remaining: Math.round(remaining * 100) / 100,
              currency,
            });
          }
        }
      }

      // Sort by remaining desc and take top 5
      outstandingByProject.sort((a, b) => b.remaining - a.remaining);
      const topOutstanding = outstandingByProject.slice(0, 5);

      // ---- 4. Cash Flow Forecast ----
      const cashFlowForecast: Array<{ date: string; expected: number; currency: string }> = [];
      const forecastMap = new Map<string, number>();

      if (invoicesResult.data) {
        for (const invoice of invoicesResult.data as unknown as InvoiceRow[]) {
          if (!invoice.due_date) continue;
          const currency = invoice.currency || "USD";
          const total = (invoice.items || []).reduce((sum: number, item: InvoiceItemRow) => sum + (item.amount || 0), 0);
          const key = `${invoice.due_date}:${currency}`;
          forecastMap.set(key, (forecastMap.get(key) || 0) + total);
        }
      }

      for (const [key, expected] of forecastMap) {
        const [date, currency] = key.split(":");
        cashFlowForecast.push({ date, expected: Math.round(expected * 100) / 100, currency });
      }
      cashFlowForecast.sort((a, b) => a.date.localeCompare(b.date));

      return apiSuccess({
        revenueByMonth,
        revenueByOrganization,
        outstandingByProject: topOutstanding,
        cashFlowForecast,
      });
    } catch (error) {
      return handleApiError(error, "dashboard/charts");
    }
  });
}
