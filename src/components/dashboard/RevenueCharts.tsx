"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

type Period = "3m" | "6m" | "12m" | "all";

interface ChartData {
  revenueByMonth: Array<{ month: string; currency: string; amount: number }>;
  revenueByOrganization: Array<{ name: string; amount: number; currency: string }>;
  outstandingByProject: Array<{ name: string; paid: number; remaining: number; currency: string }>;
  cashFlowForecast: Array<{ date: string; expected: number; currency: string }>;
}

const PERIODS: { value: Period; label: string }[] = [
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "12m", label: "12M" },
  { value: "all", label: "All" },
];

const PIE_COLORS = ["#facc15", "#22c55e", "#3b82f6", "#a855f7", "#ef4444", "#f97316"];

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "#171717",
    border: "1px solid #262626",
    borderRadius: "8px",
    color: "#e5e5e5",
  },
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-[280px] flex items-center justify-center">
      <div className="space-y-3 w-full">
        <div className="h-4 bg-border/50 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-border/50 rounded animate-pulse w-1/2" />
        <div className="h-4 bg-border/50 rounded animate-pulse w-5/6" />
        <div className="h-4 bg-border/50 rounded animate-pulse w-2/3" />
        <div className="h-4 bg-border/50 rounded animate-pulse w-3/5" />
      </div>
    </div>
  );
}

function NoData() {
  return (
    <div className="h-[280px] flex items-center justify-center text-muted text-sm">
      No data for this period
    </div>
  );
}

export function RevenueCharts() {
  const [period, setPeriod] = useState<Period>("12m");
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function fetchData() {
      try {
        const res = await fetch(`/api/v1/dashboard/charts?period=${period}`);
        if (res.ok && !cancelled) {
          const json = await res.json();
          setData(json);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [period]);

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <svg className="size-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          Revenue Analytics
        </h2>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                period === p.value
                  ? "bg-accent text-background"
                  : "bg-card text-muted hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Revenue by Month */}
        <ChartCard title="Revenue by Month">
          {loading ? (
            <ChartSkeleton />
          ) : !data?.revenueByMonth?.length ? (
            <NoData />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#737373", fontSize: 12 }}
                  axisLine={{ stroke: "#262626" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#737373", fontSize: 12 }}
                  axisLine={{ stroke: "#262626" }}
                  tickLine={false}
                />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="amount" fill="#facc15" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Chart 2: Revenue by Organization */}
        <ChartCard title="Revenue by Organization">
          {loading ? (
            <ChartSkeleton />
          ) : !data?.revenueByOrganization?.length ? (
            <NoData />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.revenueByOrganization}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="amount"
                  nameKey="name"
                  paddingAngle={2}
                >
                  {data.revenueByOrganization.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...TOOLTIP_STYLE} />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: "#737373" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Chart 3: Outstanding by Project */}
        <ChartCard title="Outstanding by Project">
          {loading ? (
            <ChartSkeleton />
          ) : !data?.outstandingByProject?.length ? (
            <NoData />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.outstandingByProject} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis
                  type="number"
                  tick={{ fill: "#737373", fontSize: 12 }}
                  axisLine={{ stroke: "#262626" }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#737373", fontSize: 12 }}
                  axisLine={{ stroke: "#262626" }}
                  tickLine={false}
                  width={120}
                />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="paid" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                <Bar dataKey="remaining" stackId="a" fill="#facc15" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Chart 4: Cash Flow Forecast */}
        <ChartCard title="Cash Flow Forecast">
          {loading ? (
            <ChartSkeleton />
          ) : !data?.cashFlowForecast?.length ? (
            <NoData />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.cashFlowForecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#737373", fontSize: 12 }}
                  axisLine={{ stroke: "#262626" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#737373", fontSize: 12 }}
                  axisLine={{ stroke: "#262626" }}
                  tickLine={false}
                />
                <Tooltip {...TOOLTIP_STYLE} />
                <Line
                  type="monotone"
                  dataKey="expected"
                  stroke="#facc15"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: "#facc15", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
