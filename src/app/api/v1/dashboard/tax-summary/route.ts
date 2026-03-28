import { NextRequest } from "next/server";
import { withAuth, apiSuccess, handleApiError } from "@/lib/api-auth";

interface PaymentRow {
  amount: number;
  created_at: string;
  milestones: {
    projects: {
      currency: string;
      organizations: { name: string };
    };
  };
}

interface ExpenseRow {
  amount: number;
  date: string;
  projects: {
    currency: string;
  };
}

function getQuarter(month: number): "q1" | "q2" | "q3" | "q4" {
  if (month < 3) return "q1";
  if (month < 6) return "q2";
  if (month < 9) return "q3";
  return "q4";
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

function emptyQuarters() {
  return { q1: 0, q2: 0, q3: 0, q4: 0, total: 0 };
}

/**
 * GET /api/v1/dashboard/tax-summary?year=2026
 * Returns quarterly income, expenses, and profit grouped by currency
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async ({ user, supabase }) => {
    try {
      const { searchParams } = new URL(request.url);
      const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10);

      if (isNaN(year) || year < 2000 || year > 2100) {
        return apiSuccess({ error: "Invalid year" });
      }

      const yearStart = `${year}-01-01T00:00:00.000Z`;
      const yearEnd = `${year + 1}-01-01T00:00:00.000Z`;

      // Fetch payment history and operating expenses in parallel
      const [paymentsResult, expensesResult] = await Promise.all([
        supabase
          .from("payment_history")
          .select(`
            amount, created_at,
            milestones!inner(
              projects!inner(
                currency,
                organizations!inner(name, user_id)
              )
            )
          `)
          .eq("milestones.projects.organizations.user_id", user.id)
          .gte("created_at", yearStart)
          .lt("created_at", yearEnd),

        supabase
          .from("operating_expenses")
          .select(`
            amount, date,
            projects!inner(
              currency,
              organizations!inner(user_id)
            )
          `)
          .eq("projects.organizations.user_id", user.id)
          .gte("date", `${year}-01-01`)
          .lt("date", `${year + 1}-01-01`),
      ]);

      // Group income by currency and quarter
      const incomeMap = new Map<string, { q1: number; q2: number; q3: number; q4: number; total: number }>();
      // Group income by organization
      const orgMap = new Map<string, number>();

      if (paymentsResult.data) {
        for (const row of paymentsResult.data as unknown as PaymentRow[]) {
          const currency = row.milestones?.projects?.currency || "USD";
          const orgName = row.milestones?.projects?.organizations?.name || "Unknown";
          const date = new Date(row.created_at);
          const q = getQuarter(date.getMonth());
          const amount = row.amount || 0;

          if (!incomeMap.has(currency)) incomeMap.set(currency, emptyQuarters());
          const inc = incomeMap.get(currency)!;
          inc[q] += amount;
          inc.total += amount;

          const orgKey = `${orgName}::${currency}`;
          orgMap.set(orgKey, (orgMap.get(orgKey) || 0) + amount);
        }
      }

      // Group expenses by currency and quarter
      const expenseMap = new Map<string, { q1: number; q2: number; q3: number; q4: number; total: number }>();

      if (expensesResult.data) {
        for (const row of expensesResult.data as unknown as ExpenseRow[]) {
          const currency = row.projects?.currency || "USD";
          const date = new Date(row.date);
          const q = getQuarter(date.getMonth());
          const amount = row.amount || 0;

          if (!expenseMap.has(currency)) expenseMap.set(currency, emptyQuarters());
          const exp = expenseMap.get(currency)!;
          exp[q] += amount;
          exp.total += amount;
        }
      }

      // Collect all currencies
      const allCurrencies = new Set([...incomeMap.keys(), ...expenseMap.keys()]);

      const currencies = Array.from(allCurrencies).map((currency) => {
        const income = incomeMap.get(currency) || emptyQuarters();
        const expenses = expenseMap.get(currency) || emptyQuarters();

        return {
          currency,
          income: {
            q1: round2(income.q1),
            q2: round2(income.q2),
            q3: round2(income.q3),
            q4: round2(income.q4),
            total: round2(income.total),
          },
          expenses: {
            q1: round2(expenses.q1),
            q2: round2(expenses.q2),
            q3: round2(expenses.q3),
            q4: round2(expenses.q4),
            total: round2(expenses.total),
          },
          profit: {
            q1: round2(income.q1 - expenses.q1),
            q2: round2(income.q2 - expenses.q2),
            q3: round2(income.q3 - expenses.q3),
            q4: round2(income.q4 - expenses.q4),
            total: round2(income.total - expenses.total),
          },
        };
      });

      const byOrganization = Array.from(orgMap.entries()).map(([key, income]) => {
        const [name, currency] = key.split("::");
        return { name, currency, income: round2(income) };
      });
      byOrganization.sort((a, b) => b.income - a.income);

      return apiSuccess({ year, currencies, byOrganization });
    } catch (error) {
      return handleApiError(error, "dashboard/tax-summary");
    }
  });
}
