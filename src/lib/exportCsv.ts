import type { Milestone } from "./types";
import { calculateAmount, roundCurrency } from "./format";

function escapeCSV(value: string | number | undefined): string {
  if (value === undefined || value === null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportMilestonesToCSV(milestones: Milestone[], filename: string) {
  const headers = [
    "Milestone",
    "Type",
    "Date",
    "Hours",
    "Units",
    "Description",
    "Rate",
    "Entry Amount",
    "Entry Paid",
    "Milestone Total",
    "Milestone Paid",
  ];

  const rows: string[][] = [];

  const sorted = [...milestones].sort((a, b) => a.order - b.order);

  for (const m of sorted) {
    const entries = m.time_entries || [];
    const isHourly = m.type === "hourly";
    const isPerUnit = m.type === "per_unit";

    const rate = isHourly ? Number(m.hourly_rate || 0) : isPerUnit ? Number(m.unit_rate || 0) : 0;

    let milestoneTotal: number;
    let milestonePaid: number;

    if (isHourly) {
      const totalHours = entries.reduce((s, e) => s + Number(e.hours || 0), 0);
      milestoneTotal = calculateAmount(rate, totalHours);
      milestonePaid = entries.reduce((s, e) => s + Number(e.paid_amount || 0), 0);
    } else if (isPerUnit) {
      const totalUnits = entries.reduce((s, e) => s + Number(e.units || 0), 0);
      milestoneTotal = calculateAmount(rate, totalUnits);
      milestonePaid = entries.reduce((s, e) => s + Number(e.paid_amount || 0), 0);
    } else {
      milestoneTotal = roundCurrency(Number(m.amount));
      milestonePaid = roundCurrency(Number(m.paid_amount || 0));
    }

    if ((isHourly || isPerUnit) && entries.length > 0) {
      for (const entry of entries) {
        const qty = isHourly ? Number(entry.hours || 0) : Number(entry.units || 0);
        const entryAmount = calculateAmount(rate, qty);
        rows.push([
          escapeCSV(m.title),
          escapeCSV(m.type),
          escapeCSV(entry.date),
          escapeCSV(isHourly ? qty : ""),
          escapeCSV(isPerUnit ? qty : ""),
          escapeCSV(entry.description),
          escapeCSV(rate),
          escapeCSV(roundCurrency(entryAmount)),
          escapeCSV(roundCurrency(Number(entry.paid_amount || 0))),
          escapeCSV(roundCurrency(milestoneTotal)),
          escapeCSV(roundCurrency(milestonePaid)),
        ]);
      }
    } else {
      rows.push([
        escapeCSV(m.title),
        escapeCSV(m.type),
        "",
        "",
        "",
        escapeCSV(m.description),
        escapeCSV(rate || ""),
        escapeCSV(roundCurrency(milestoneTotal)),
        escapeCSV(roundCurrency(milestonePaid)),
        escapeCSV(roundCurrency(milestoneTotal)),
        escapeCSV(roundCurrency(milestonePaid)),
      ]);
    }
  }

  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
