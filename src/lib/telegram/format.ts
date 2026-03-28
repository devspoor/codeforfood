import type { Project } from "@/lib/types";
import { getProjectSummary } from "@/lib/db";
import { formatCurrency } from "@/lib/format";

// Simplified types for bot operations
type SimpleColumn = { id: string; name: string; is_done_column: boolean };
type SimpleTask = { id: string; title: string; column_id: string; deadline?: string | null; is_archived?: boolean };

export function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

export function formatMoney(amount: number, currency: string = "USD"): string {
  return formatCurrency(amount, currency);
}

export function formatMoneyMessage(project: Project): string {
  const summary = getProjectSummary(project);
  const milestones = project.milestones || [];
  const currency = project.currency || "USD";

  let msg = `💰 *${escapeMarkdown(project.name)}* — Finances\n\n`;

  msg += `Total budget: ${formatMoney(summary.totalAmount, currency)}\n`;
  msg += `├ Paid: ${formatMoney(summary.paidAmount, currency)} \\(${summary.percentPaid}%\\)\n`;
  msg += `└ Remaining: ${formatMoney(summary.remainingAmount, currency)}\n\n`;

  if (milestones.length > 0) {
    msg += `📋 Milestones:\n`;

    for (const m of milestones) {
      const icon = m.is_paid ? "✅" : "⏳";

      if (m.type === "fixed" || !m.type) {
        const status = m.is_paid
          ? "\\(paid\\)"
          : `\\(${formatMoney(m.paid_amount, currency)} of ${formatMoney(m.amount, currency)}\\)`;
        msg += `${icon} ${escapeMarkdown(m.title)} — ${formatMoney(m.amount, currency)} ${status}\n`;
      } else if (m.type === "hourly") {
        const entries = m.time_entries || [];
        const hours = entries.reduce((sum, e) => sum + Number(e.hours || 0), 0);
        const amount = hours * Number(m.hourly_rate || 0);
        const paid = entries.reduce((sum, e) => sum + Number(e.paid_amount || 0), 0);
        msg += `${icon} ${escapeMarkdown(m.title)} \\(hourly\\) — ${formatMoney(paid, currency)} of ${formatMoney(amount, currency)}\n`;
        msg += `   └ ${hours}h logged, rate ${formatMoney(Number(m.hourly_rate || 0), currency)}/h\n`;
      } else if (m.type === "per_unit") {
        const entries = m.time_entries || [];
        const units = entries.reduce((sum, e) => sum + Number(e.units || 0), 0);
        const amount = units * Number(m.unit_rate || 0);
        const paid = entries.reduce((sum, e) => sum + Number(e.paid_amount || 0), 0);
        const label = m.unit_label || "units";
        msg += `${icon} ${escapeMarkdown(m.title)} \\(per ${escapeMarkdown(label)}\\) — ${formatMoney(paid, currency)} of ${formatMoney(amount, currency)}\n`;
        msg += `   └ ${units} ${escapeMarkdown(label)}, rate ${formatMoney(Number(m.unit_rate || 0), currency)}/${escapeMarkdown(label)}\n`;
      }
    }
  }

  if (summary.totalExpenses > 0) {
    msg += `\n💸 Expenses: ${formatMoney(summary.totalExpenses, currency)}`;
  }

  return msg;
}

export function formatTasksMessage(project: Project, columns: SimpleColumn[], tasks: SimpleTask[]): string {
  let msg = `📋 *${escapeMarkdown(project.name)}* — Tasks\n\n`;

  for (const column of columns) {
    const columnTasks = tasks.filter(t => t.column_id === column.id && !t.is_archived);

    const icon = column.is_done_column ? "✅" : "📌";
    msg += `${icon} *${escapeMarkdown(column.name)}* \\(${columnTasks.length}\\):\n`;

    if (columnTasks.length === 0) {
      msg += `   _empty_\n`;
    } else {
      for (const task of columnTasks) {
        msg += `• ${escapeMarkdown(task.title)}\n`;
      }
    }
    msg += `\n`;
  }

  return msg;
}

export function formatStatusMessage(project: Project, taskCount?: { total: number; done: number }): string {
  const summary = getProjectSummary(project);

  let msg = `📊 *${escapeMarkdown(project.name)}*\n\n`;

  const statusLabels: Record<string, string> = {
    in_progress: "In Progress",
    awaiting_payment: "Awaiting Payment",
    completed: "Completed",
    on_hold: "On Hold",
  };

  msg += `Status: ${statusLabels[project.status] || project.status}\n`;
  const currency = project.currency || "USD";
  msg += `Budget: ${formatMoney(summary.paidAmount, currency)} / ${formatMoney(summary.totalAmount, currency)} \\(${summary.percentPaid}%\\)\n`;

  if (taskCount) {
    msg += `Tasks: ${taskCount.done}/${taskCount.total} done`;
  }

  return msg;
}

export function formatLinkMessage(project: Project, baseUrl: string): string {
  const url = `${baseUrl}/p/${project.hash}`;
  return `🔗 *${escapeMarkdown(project.name)}*\n${escapeMarkdown(url)}`;
}

export function formatDeadlineMessage(project: Project, tasks: SimpleTask[]): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const tasksWithDeadline = tasks
    .filter(t => t.deadline && !t.is_archived)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

  const tasksNoDeadline = tasks.filter(t => !t.deadline && !t.is_archived);

  let msg = `⏰ *${escapeMarkdown(project.name)}* — Upcoming Deadlines\n\n`;

  if (tasksWithDeadline.length === 0) {
    msg += `No tasks with deadlines\n`;
  } else {
    for (const task of tasksWithDeadline) {
      const deadline = new Date(task.deadline!);
      const isOverdue = deadline < now;
      const isTomorrow = deadline <= tomorrow;
      const isThisWeek = deadline <= nextWeek;

      const icon = isOverdue || isTomorrow ? "🔴" : isThisWeek ? "🟡" : "⚪";
      const dateStr = deadline.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      msg += `${icon} ${escapeMarkdown(dateStr)}: ${escapeMarkdown(task.title)}\n`;
    }
  }

  if (tasksNoDeadline.length > 0) {
    msg += `\nNo deadline \\(${tasksNoDeadline.length} tasks\\)`;
  }

  return msg;
}
