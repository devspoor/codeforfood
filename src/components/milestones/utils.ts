import type { Milestone, TimeEntry } from "@/lib/types";

/**
 * Calculate payment percentage for a milestone
 */
export function getPaymentPercent(m: Milestone): number {
  if (m.type === "hourly") {
    const entries = m.time_entries || [];
    const hours = entries.reduce((sum, e) => sum + Number(e.hours || 0), 0);
    const total = hours * Number(m.hourly_rate || 0);
    const paid = entries.reduce((sum, e) => sum + Number(e.paid_amount || 0), 0);
    return total > 0 ? Math.round((paid / total) * 100) : 0;
  }
  if (m.type === "per_unit") {
    const entries = m.time_entries || [];
    const units = entries.reduce((sum, e) => sum + Number(e.units || 0), 0);
    const total = units * Number(m.unit_rate || 0);
    const paid = entries.reduce((sum, e) => sum + Number(e.paid_amount || 0), 0);
    return total > 0 ? Math.round((paid / total) * 100) : 0;
  }
  const paid = m.paid_amount || 0;
  return m.amount > 0 ? Math.round((paid / m.amount) * 100) : 0;
}

/**
 * Calculate total amount for a milestone
 */
export function getMilestoneTotal(m: Milestone): number {
  if (m.type === "hourly") {
    const hours = (m.time_entries || []).reduce((sum, e) => sum + Number(e.hours || 0), 0);
    return hours * Number(m.hourly_rate || 0);
  }
  if (m.type === "per_unit") {
    const units = (m.time_entries || []).reduce((sum, e) => sum + Number(e.units || 0), 0);
    return units * Number(m.unit_rate || 0);
  }
  return m.amount;
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
 * Get paid amount for a milestone
 */
export function getPaidAmount(m: Milestone): number {
  if (m.type === "hourly" || m.type === "per_unit") {
    return (m.time_entries || []).reduce((sum, e) => sum + Number(e.paid_amount || 0), 0);
  }
  return m.paid_amount || 0;
}

/**
 * Get remaining amount for a time entry
 */
export function getEntryRemaining(entry: TimeEntry, rate: number): number {
  const total = (entry.hours || entry.units || 0) * rate;
  return total - (entry.paid_amount || 0);
}
