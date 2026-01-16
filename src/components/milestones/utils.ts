import type { Milestone, TimeEntry } from "@/lib/types";
import { calculateAmount, sumCurrency, calculatePercent, roundCurrency } from "@/lib/format";

/**
 * Calculate payment percentage for a milestone
 */
export function getPaymentPercent(m: Milestone): number {
  if (m.type === "hourly") {
    const entries = m.time_entries || [];
    const hours = entries.reduce((sum, e) => sum + Number(e.hours || 0), 0);
    const total = calculateAmount(Number(m.hourly_rate || 0), hours);
    const paid = sumCurrency(entries.map(e => Number(e.paid_amount || 0)));
    return calculatePercent(paid, total);
  }
  if (m.type === "per_unit") {
    const entries = m.time_entries || [];
    const units = entries.reduce((sum, e) => sum + Number(e.units || 0), 0);
    const total = calculateAmount(Number(m.unit_rate || 0), units);
    const paid = sumCurrency(entries.map(e => Number(e.paid_amount || 0)));
    return calculatePercent(paid, total);
  }
  const paid = Number(m.paid_amount || 0);
  return calculatePercent(paid, Number(m.amount));
}

/**
 * Calculate total amount for a milestone (with proper rounding)
 */
export function getMilestoneTotal(m: Milestone): number {
  if (m.type === "hourly") {
    const hours = (m.time_entries || []).reduce((sum, e) => sum + Number(e.hours || 0), 0);
    return calculateAmount(Number(m.hourly_rate || 0), hours);
  }
  if (m.type === "per_unit") {
    const units = (m.time_entries || []).reduce((sum, e) => sum + Number(e.units || 0), 0);
    return calculateAmount(Number(m.unit_rate || 0), units);
  }
  return roundCurrency(Number(m.amount));
}

/**
 * Get total logged hours for a milestone
 */
export function getTotalHours(m: Milestone): number {
  return (m.time_entries || []).reduce((sum, e) => sum + Number(e.hours || 0), 0);
}

/**
 * Get total logged units for a milestone
 */
export function getTotalUnits(m: Milestone): number {
  return (m.time_entries || []).reduce((sum, e) => sum + Number(e.units || 0), 0);
}

/**
 * Get paid amount for a milestone (with proper rounding)
 */
export function getPaidAmount(m: Milestone): number {
  if (m.type === "hourly" || m.type === "per_unit") {
    return sumCurrency((m.time_entries || []).map(e => Number(e.paid_amount || 0)));
  }
  return roundCurrency(Number(m.paid_amount || 0));
}

/**
 * Get remaining amount for a time entry (with proper rounding)
 */
export function getEntryRemaining(entry: TimeEntry, rate: number): number {
  const total = calculateAmount(rate, entry.hours || entry.units || 0);
  return roundCurrency(total - Number(entry.paid_amount || 0));
}
