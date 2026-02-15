import { createBotClient } from "@/lib/supabase/server";
import { normalizeProjectData } from "@/lib/db/normalize";
import type { TelegramUser, TelegramChatBinding, Project } from "@/lib/types";

const PROJECT_SELECT_QUERY = "*, milestones(*, time_entries(*), payment_history(*)), comments(*), attachments(*), operating_expenses(*)";
import { randomUUID } from "crypto";

// ============================================
// Telegram Users
// ============================================

export async function getTelegramUserByTelegramId(telegramId: number): Promise<TelegramUser | null> {
  const supabase = createBotClient();

  const { data } = await supabase
    .from("telegram_users")
    .select("*")
    .eq("telegram_id", telegramId)
    .single();

  return data;
}

export async function getTelegramUserByUserId(userId: string): Promise<TelegramUser | null> {
  const supabase = createBotClient();

  const { data } = await supabase
    .from("telegram_users")
    .select("*")
    .eq("user_id", userId)
    .single();

  return data;
}

export async function getTelegramUserByLinkToken(token: string): Promise<TelegramUser | null> {
  const supabase = createBotClient();

  const { data } = await supabase
    .from("telegram_users")
    .select("*")
    .eq("link_token", token)
    .gt("link_token_expires_at", new Date().toISOString())
    .single();

  return data;
}

export async function linkTelegramAccount(
  token: string,
  telegramId: number,
  telegramUsername?: string
): Promise<TelegramUser | null> {
  const supabase = createBotClient();

  // Find pending link by token (bypass RLS for bot operations)
  const { data: pending } = await supabase
    .from("telegram_users")
    .select("*")
    .eq("link_token", token)
    .gt("link_token_expires_at", new Date().toISOString())
    .single();

  if (!pending) return null;

  // Update with telegram info and clear token
  const { data, error } = await supabase
    .from("telegram_users")
    .update({
      telegram_id: telegramId,
      telegram_username: telegramUsername,
      linked_at: new Date().toISOString(),
      link_token: null,
      link_token_expires_at: null,
    })
    .eq("id", pending.id)
    .select()
    .single();

  if (error) {
    console.error("Error linking telegram account:", error.message);
    return null;
  }

  return data;
}

export async function unlinkTelegramAccount(userId: string): Promise<boolean> {
  const supabase = createBotClient();

  const { error } = await supabase
    .from("telegram_users")
    .delete()
    .eq("user_id", userId);

  return !error;
}

// ============================================
// Chat Bindings
// ============================================

export async function getChatBinding(
  chatId: number,
  threadId?: number
): Promise<(TelegramChatBinding & { project: Project }) | null> {
  const supabase = createBotClient();

  let query = supabase
    .from("telegram_chat_bindings")
    .select("*, project:projects(*, organizations(user_id))")
    .eq("chat_id", chatId);

  if (threadId) {
    query = query.eq("thread_id", threadId);
  } else {
    query = query.is("thread_id", null);
  }

  const { data } = await query.single();

  return data;
}

export async function createChatBinding(data: {
  chatId: number;
  threadId?: number;
  projectId: string;
  boundBy: string;
  accessMode: "owner_only" | "all";
}): Promise<TelegramChatBinding | null> {
  const supabase = createBotClient();

  // Delete existing binding if any
  let deleteQuery = supabase
    .from("telegram_chat_bindings")
    .delete()
    .eq("chat_id", data.chatId);

  if (data.threadId) {
    deleteQuery = deleteQuery.eq("thread_id", data.threadId);
  } else {
    deleteQuery = deleteQuery.is("thread_id", null);
  }

  await deleteQuery;

  const { data: binding, error } = await supabase
    .from("telegram_chat_bindings")
    .insert({
      chat_id: data.chatId,
      thread_id: data.threadId ?? null,
      project_id: data.projectId,
      bound_by: data.boundBy,
      access_mode: data.accessMode,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating chat binding:", error.message);
    return null;
  }

  return binding;
}

export async function deleteChatBinding(chatId: number, threadId?: number): Promise<boolean> {
  const supabase = createBotClient();

  let query = supabase
    .from("telegram_chat_bindings")
    .delete()
    .eq("chat_id", chatId);

  if (threadId) {
    query = query.eq("thread_id", threadId);
  } else {
    query = query.is("thread_id", null);
  }

  const { error } = await query;

  return !error;
}

// ============================================
// Project Access Helpers
// ============================================

export async function getProjectByHashWithOwner(hash: string): Promise<(Project & { organizations: { user_id: string } }) | null> {
  const supabase = createBotClient();

  const { data } = await supabase
    .from("projects")
    .select("*, organizations!inner(user_id)")
    .eq("hash", hash)
    .single();

  return data;
}

export async function verifyTelegramProjectOwnership(
  telegramId: number,
  projectId: string
): Promise<boolean> {
  const supabase = createBotClient();

  // Get telegram user
  const telegramUser = await getTelegramUserByTelegramId(telegramId);
  if (!telegramUser) return false;

  // Check if user owns the project
  const { data } = await supabase
    .from("projects")
    .select("id, organizations!inner(user_id)")
    .eq("id", projectId)
    .eq("organizations.user_id", telegramUser.user_id)
    .single();

  return !!data;
}

export async function canUseBotInChat(
  telegramId: number,
  chatId: number,
  threadId?: number
): Promise<{ allowed: boolean; binding?: TelegramChatBinding & { project: Project } }> {
  const binding = await getChatBinding(chatId, threadId);
  if (!binding) {
    return { allowed: false };
  }

  // If access_mode is 'all', anyone can use
  if (binding.access_mode === "all") {
    return { allowed: true, binding };
  }

  // If 'owner_only', check if this telegram user is the owner
  const telegramUser = await getTelegramUserByTelegramId(telegramId);
  if (!telegramUser) {
    return { allowed: false, binding };
  }

  // Check if telegram user owns the project
  const isOwner = await verifyTelegramProjectOwnership(telegramId, binding.project_id);

  return { allowed: isOwner, binding };
}

// ============================================
// Link Token Generation (for web UI)
// ============================================

export async function createOrUpdateLinkToken(userId: string): Promise<{ token: string; expiresAt: Date } | null> {
  const supabase = createBotClient();
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Upsert telegram_users record
  const { error } = await supabase
    .from("telegram_users")
    .upsert({
      user_id: userId,
      telegram_id: 0, // Placeholder, will be updated when linked
      link_token: token,
      link_token_expires_at: expiresAt.toISOString(),
    }, {
      onConflict: "user_id",
    });

  if (error) {
    console.error("Error creating link token:", error.message);
    return null;
  }

  return { token, expiresAt };
}

// ============================================
// Bot Task Operations (bypasses RLS)
// ============================================

export async function botAddTask(projectId: string, columnId: string, data: {
  title: string;
  priority?: "low" | "medium" | "high" | "urgent";
}): Promise<{ id: string; title: string } | null> {
  const supabase = createBotClient();

  // Get max position in column
  const { data: existing } = await supabase
    .from("tasks")
    .select("position")
    .eq("column_id", columnId)
    .eq("is_archived", false)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      column_id: columnId,
      title: data.title,
      priority: data.priority || "low",
      position: nextPosition,
    })
    .select("id, title")
    .single();

  if (error) {
    console.error("Error creating task:", error.message);
    return null;
  }

  return task;
}

export async function botGetTaskColumns(projectId: string): Promise<{ id: string; name: string; is_done_column: boolean }[]> {
  const supabase = createBotClient();

  const { data } = await supabase
    .from("task_columns")
    .select("id, name, is_done_column")
    .eq("project_id", projectId)
    .order("position");

  return data || [];
}

export async function botGetProjectById(projectId: string): Promise<Project | null> {
  const supabase = createBotClient();

  const { data } = await supabase
    .from("projects")
    .select(PROJECT_SELECT_QUERY)
    .eq("id", projectId)
    .single();

  if (!data) return null;

  return normalizeProjectData(data);
}

export async function botGetTaskBoardData(projectId: string): Promise<{
  columns: { id: string; name: string; is_done_column: boolean }[];
  tasks: { id: string; title: string; column_id: string; priority: string; deadline: string | null }[];
}> {
  const supabase = createBotClient();

  const { data: columns } = await supabase
    .from("task_columns")
    .select("id, name, is_done_column")
    .eq("project_id", projectId)
    .order("position");

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, column_id, priority, deadline")
    .eq("project_id", projectId)
    .eq("is_archived", false)
    .order("position");

  return {
    columns: columns || [],
    tasks: tasks || [],
  };
}

export async function botGetPaymentMethods(projectId: string): Promise<{
  id: string;
  label: string;
  value: string;
  type: string;
}[]> {
  const supabase = createBotClient();

  // First get the organization_id from the project
  const { data: project } = await supabase
    .from("projects")
    .select("organization_id")
    .eq("id", projectId)
    .single();

  if (!project) return [];

  // Then get payment methods from the organization
  const { data: methods } = await supabase
    .from("payment_methods")
    .select("id, label, value, type")
    .eq("organization_id", project.organization_id)
    .order("created_at");

  return methods || [];
}
