import type { ProjectStatus } from "@/lib/types";

export interface GeneratedMilestone {
  title: string;
  description: string;
  type: "fixed" | "hourly" | "per_unit";
  amount: number;
  estimated_hours?: number;
  due_date_offset_days?: number;
}

export interface ProjectContext {
  name: string;
  description?: string;
  status: ProjectStatus;
  currency: string;
  milestones: Array<{
    title: string;
    type: string;
    amount: number;
    paid_amount: number;
    is_paid: boolean;
    due_date?: string;
  }>;
  tasks: Array<{
    title: string;
    column: string;
    priority: string;
    deadline?: string;
  }>;
  summary: {
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    percentPaid: number;
  };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
