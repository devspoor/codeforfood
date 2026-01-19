export interface PaymentMethod {
  id: string;
  organization_id: string;
  label: string;
  value: string;
  type: "crypto" | "bank" | "other";
  created_at: string;
}

export interface TimeEntry {
  id: string;
  milestone_id: string;
  date: string;
  hours?: number;
  units?: number;
  description?: string;
  paid_amount: number;
  created_at: string;
}

export interface PaymentHistoryEntry {
  id: string;
  milestone_id: string;
  amount: number;
  note?: string;
  created_at: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  type: "fixed" | "hourly" | "per_unit";
  // Fixed milestone fields
  amount: number;
  paid_amount: number;
  is_paid: boolean;
  paid_at?: string;
  // Hourly milestone fields
  hourly_rate?: number;
  estimated_hours?: number;
  hours_limit?: number;
  // Per-unit milestone fields
  unit_rate?: number;
  unit_label?: string;
  estimated_units?: number;
  units_limit?: number;
  // Entries (used by both hourly and per_unit)
  time_entries?: TimeEntry[];
  payment_history?: PaymentHistoryEntry[];
  order: number;
  created_at: string;
}

export interface Comment {
  id: string;
  project_id: string;
  milestone_id?: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  project_id: string;
  milestone_id?: string;
  label: string;
  url: string;
  type: "figma" | "github" | "demo" | "document" | "link";
  created_at: string;
}

export interface OperatingExpense {
  id: string;
  project_id: string;
  name: string;
  amount: number;
  date: string;
  description?: string;
  created_at: string;
}

export type ProjectStatus = "in_progress" | "awaiting_payment" | "completed" | "on_hold";

export interface Project {
  id: string;
  organization_id: string;
  hash: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  hide_amounts: boolean;
  hide_paid: boolean;
  show_payment_history: boolean;
  show_expenses: boolean;
  public_password_hash?: string | null;
  milestones?: Milestone[];
  comments?: Comment[];
  attachments?: Attachment[];
  operating_expenses?: OperatingExpense[];
  secure_note_encrypted?: string | null;
  secure_note_password_hash?: string | null;
  tasks_board_public?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SecureNoteEncrypted {
  salt: string;
  iv: string;
  ciphertext: string;
}

export interface Organization {
  id: string;
  user_id: string;
  hash: string;
  name: string;
  description?: string;
  payment_methods?: PaymentMethod[];
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// Computed types for display
export interface ProjectSummary {
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paidMilestones: number;
  totalMilestones: number;
  percentPaid: number;
  // Hourly stats
  totalHours: number;
  hourlyAmount: number;
  // Per-unit stats
  totalUnits: number;
  unitAmount: number;
  // Operating expenses
  totalExpenses: number;
}

export interface OrganizationWithProjects extends Organization {
  projects: (Project & { summary: ProjectSummary })[];
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
}

// Pagination types
export interface PaginationParams {
  limit?: number;  // default: 50
  offset?: number; // default: 0
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Task board types
export type TaskPriority = "low" | "medium" | "high";

export interface TaskColumn {
  id: string;
  project_id: string;
  name: string;
  position: number;
  is_system: boolean;
  is_done_column: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  milestone_id?: string | null;
  column_id: string;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  deadline?: string | null;
  position: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskBoardData {
  columns: TaskColumn[];
  tasks: Task[];
}
