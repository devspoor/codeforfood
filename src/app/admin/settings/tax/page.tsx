"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { Select } from "@/components/ui/Select";

interface QuarterlyData {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  total: number;
}

interface CurrencyData {
  currency: string;
  income: QuarterlyData;
  expenses: QuarterlyData;
  profit: QuarterlyData;
}

interface OrgIncome {
  name: string;
  currency: string;
  income: number;
}

interface TaxSummary {
  year: number;
  currencies: CurrencyData[];
  byOrganization: OrgIncome[];
}

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

function formatAmount(amount: number, currency: string): string {
  return formatCurrency(amount, currency);
}

function generateCSV(data: TaxSummary): string {
  const lines: string[] = [];
  lines.push(`Tax Summary - ${data.year}`);
  lines.push("");

  for (const c of data.currencies) {
    lines.push(`Currency: ${c.currency}`);
    lines.push(",Q1,Q2,Q3,Q4,Total");
    lines.push(`Income,${c.income.q1},${c.income.q2},${c.income.q3},${c.income.q4},${c.income.total}`);
    lines.push(`Expenses,${c.expenses.q1},${c.expenses.q2},${c.expenses.q3},${c.expenses.q4},${c.expenses.total}`);
    lines.push(`Net Profit,${c.profit.q1},${c.profit.q2},${c.profit.q3},${c.profit.q4},${c.profit.total}`);
    lines.push("");
  }

  lines.push("Income by Client");
  lines.push("Organization,Currency,Income");
  for (const org of data.byOrganization) {
    lines.push(`"${org.name}",${org.currency},${org.income}`);
  }

  return lines.join("\n");
}

export default function TaxSummaryPage() {
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<TaxSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (selectedYear: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/dashboard/tax-summary?year=${selectedYear}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(year);
  }, [year, fetchData]);

  function handleExportCSV() {
    if (!data) return;
    const csv = generateCSV(data);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tax-summary-${data.year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const isEmpty = !loading && data && data.currencies.length === 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/settings" className="text-sm text-muted hover:text-foreground transition-colors">
            &larr; Back to Settings
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mt-1">Tax Summary</h1>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={String(year)}
            onChange={(v) => setYear(parseInt(v, 10))}
            options={YEARS.map((y) => ({ value: String(y), label: String(y) }))}
          />
          {data && data.currencies.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="bg-accent text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <p className="text-muted text-sm">Loading...</p>
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <p className="text-muted text-sm">No financial data for {year}</p>
        </div>
      )}

      {/* Data */}
      {!loading && data && data.currencies.length > 0 && (
        <>
          {/* Quarterly breakdown per currency */}
          {data.currencies.map((c) => (
            <section key={c.currency} className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">{c.currency}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 text-muted font-medium w-32"></th>
                      <th className="text-right py-2 px-4 text-muted font-medium">Q1</th>
                      <th className="text-right py-2 px-4 text-muted font-medium">Q2</th>
                      <th className="text-right py-2 px-4 text-muted font-medium">Q3</th>
                      <th className="text-right py-2 px-4 text-muted font-medium">Q4</th>
                      <th className="text-right py-2 pl-4 text-muted font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/50">
                      <td className="py-3 pr-4 text-foreground font-medium">Income</td>
                      <td className="py-3 px-4 text-right font-mono text-success">{formatAmount(c.income.q1, c.currency)}</td>
                      <td className="py-3 px-4 text-right font-mono text-success">{formatAmount(c.income.q2, c.currency)}</td>
                      <td className="py-3 px-4 text-right font-mono text-success">{formatAmount(c.income.q3, c.currency)}</td>
                      <td className="py-3 px-4 text-right font-mono text-success">{formatAmount(c.income.q4, c.currency)}</td>
                      <td className="py-3 pl-4 text-right font-mono text-success font-semibold">{formatAmount(c.income.total, c.currency)}</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 pr-4 text-foreground font-medium">Expenses</td>
                      <td className="py-3 px-4 text-right font-mono text-danger">{formatAmount(c.expenses.q1, c.currency)}</td>
                      <td className="py-3 px-4 text-right font-mono text-danger">{formatAmount(c.expenses.q2, c.currency)}</td>
                      <td className="py-3 px-4 text-right font-mono text-danger">{formatAmount(c.expenses.q3, c.currency)}</td>
                      <td className="py-3 px-4 text-right font-mono text-danger">{formatAmount(c.expenses.q4, c.currency)}</td>
                      <td className="py-3 pl-4 text-right font-mono text-danger font-semibold">{formatAmount(c.expenses.total, c.currency)}</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 text-foreground font-bold">Net Profit</td>
                      <td className="py-3 px-4 text-right font-mono text-accent font-bold">{formatAmount(c.profit.q1, c.currency)}</td>
                      <td className="py-3 px-4 text-right font-mono text-accent font-bold">{formatAmount(c.profit.q2, c.currency)}</td>
                      <td className="py-3 px-4 text-right font-mono text-accent font-bold">{formatAmount(c.profit.q3, c.currency)}</td>
                      <td className="py-3 px-4 text-right font-mono text-accent font-bold">{formatAmount(c.profit.q4, c.currency)}</td>
                      <td className="py-3 pl-4 text-right font-mono text-accent font-bold">{formatAmount(c.profit.total, c.currency)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          ))}

          {/* Income by Client */}
          {data.byOrganization.length > 0 && (
            <section className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Income by Client</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 text-muted font-medium">Organization</th>
                      <th className="text-right py-2 pl-4 text-muted font-medium">Total Income</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byOrganization.map((org, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-b-0">
                        <td className="py-3 pr-4 text-foreground">{org.name}</td>
                        <td className="py-3 pl-4 text-right font-mono text-success">{formatAmount(org.income, org.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
