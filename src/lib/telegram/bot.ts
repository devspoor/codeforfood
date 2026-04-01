import { Bot, InlineKeyboard, Context } from "grammy";
import { createBotClient } from "@/lib/supabase/server";
import { getSubscriptionAdmin, isSubscriptionActive } from "@/lib/paddle/subscriptions";
import {
  getTelegramUserByTelegramId,
  linkTelegramAccount,
  getChatBinding,
  createChatBinding,
  deleteChatBinding,
  getProjectByHashWithOwner,
  canUseBotInChat,
  botAddTask,
  botGetTaskColumns,
  botGetProjectById,
  botGetTaskBoardData,
  botGetPaymentMethods,
} from "./db";
import {
  formatMoneyMessage,
  formatTasksMessage,
  formatStatusMessage,
  formatLinkMessage,
  formatDeadlineMessage,
} from "./format";
import type { TelegramChatBinding, Project } from "@/lib/types";
import { isAiEnabled } from "@/lib/0g/broker";
import { askAboutProject, generateSummary } from "@/lib/0g/ai";
import type { ProjectContext } from "@/lib/0g/types";
import { getProjectSummary } from "@/lib/db";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.warn("TELEGRAM_BOT_TOKEN is not set - bot will not work");
}

export const bot = token ? new Bot(token) : null;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://codeforfood.app";

if (bot) {
  // /start command - handles deep link auth
  bot.command("start", async (ctx) => {
    const linkToken = ctx.match;

    if (linkToken) {
      // Deep link auth flow
      const linked = await linkTelegramAccount(
        linkToken,
        ctx.from!.id,
        ctx.from!.username
      );

      if (linked) {
        await ctx.reply(
          "✅ Successfully connected to your codeforfood account\\!\n\n" +
          "You can now use /connect in group chats to link projects\\.",
          { parse_mode: "MarkdownV2" }
        );
      } else {
        await ctx.reply("❌ Invalid or expired link. Please generate a new one from codeforfood settings.");
      }
    } else {
      // Regular start
      await ctx.reply(
        "👋 Welcome to codeforfood Bot!\n\n" +
        "To get started:\n" +
        "1. Link your account at codeforfood → Settings → Connect Telegram\n" +
        "2. Add me to a group chat\n" +
        "3. Use /connect <project_hash> to link a project\n\n" +
        "Commands:\n" +
        "/money - Financial summary\n" +
        "/tasks - Task list\n" +
        "/status - Project status\n" +
        "/link - Public project URL\n" +
        "/addtask <title> - Create a task\n" +
        "/deadline - Upcoming deadlines\n" +
        "/disconnect - Unlink project"
      );
    }
  });

  // /connect command
  bot.command("connect", async (ctx) => {
    const hash = ctx.match?.trim();

    if (!hash) {
      await ctx.reply("Usage: /connect <project_hash>\n\nFind your project hash in codeforfood project settings.");
      return;
    }

    // Check if user is linked
    const telegramUser = await getTelegramUserByTelegramId(ctx.from!.id);
    if (!telegramUser || telegramUser.telegram_id === 0) {
      await ctx.reply("❌ Please link your codeforfood account first.\nGo to codeforfood → Settings → Connect Telegram");
      return;
    }

    // Find project
    const project = await getProjectByHashWithOwner(hash);
    if (!project) {
      await ctx.reply("❌ Project not found. Check the hash and try again.");
      return;
    }

    // Check ownership
    if (project.organizations.user_id !== telegramUser.user_id) {
      await ctx.reply("❌ You don't own this project.");
      return;
    }

    // Ask for access mode
    const keyboard = new InlineKeyboard()
      .text("Only me", `access:owner_only:${project.id}`)
      .text("Everyone in chat", `access:all:${project.id}`);

    await ctx.reply(
      `Connect *${project.name.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&")}* to this chat?\n\nWho can use bot commands here?`,
      {
        parse_mode: "MarkdownV2",
        reply_markup: keyboard,
      }
    );
  });

  // Handle access mode callback
  bot.callbackQuery(/^access:(owner_only|all):(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery.data.match(/^access:(owner_only|all):(.+)$/);
    if (!match) return;

    const [, accessMode, projectId] = match;
    const telegramUser = await getTelegramUserByTelegramId(ctx.from!.id);

    if (!telegramUser) {
      await ctx.answerCallbackQuery({ text: "Please link your account first" });
      return;
    }

    const project = await botGetProjectById(projectId);
    if (!project) {
      await ctx.answerCallbackQuery({ text: "Project not found" });
      return;
    }

    const binding = await createChatBinding({
      chatId: ctx.chat!.id,
      threadId: ctx.callbackQuery.message?.message_thread_id,
      projectId,
      boundBy: telegramUser.id,
      accessMode: accessMode as "owner_only" | "all",
    });

    if (binding) {
      const accessLabel = accessMode === "all" ? "Everyone in chat" : "Only you";
      const projectName = project.name.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
      await ctx.editMessageText(
        `✅ Connected to *${projectName}*\n\n` +
        `Commands: /money /tasks /status /link /addtask /deadline\n` +
        `Access: ${accessLabel}`,
        { parse_mode: "MarkdownV2" }
      );
    } else {
      await ctx.answerCallbackQuery({ text: "Failed to connect" });
    }
  });

  // /disconnect command
  bot.command("disconnect", async (ctx) => {
    const chatId = ctx.chat.id;
    const threadId = ctx.message?.message_thread_id;

    const binding = await getChatBinding(chatId, threadId);
    if (!binding) {
      await ctx.reply("❌ No project connected to this chat.");
      return;
    }

    const deleted = await deleteChatBinding(chatId, threadId);

    if (deleted) {
      await ctx.reply("✅ Project disconnected from this chat.");
    } else {
      await ctx.reply("❌ Failed to disconnect project.");
    }
  });

  // Helper to get binding and check access
  async function getBindingWithAccess(ctx: Context): Promise<(TelegramChatBinding & { project: Project }) | null> {
    const chatId = ctx.chat!.id;
    // message_thread_id is available on messages in forum topics
    const message = ctx.message as { message_thread_id?: number } | undefined;
    const threadId = message?.message_thread_id;
    const telegramId = ctx.from!.id;

    const { allowed, binding } = await canUseBotInChat(telegramId, chatId, threadId);

    if (!binding) {
      await ctx.reply("❌ No project connected. Use /connect <hash> first.");
      return null;
    }

    if (!allowed) {
      await ctx.reply("❌ You don't have permission to use commands in this chat.");
      return null;
    }

    // Check project owner's subscription
    const supabase = createBotClient();
    const { data: org } = await supabase
      .from("organizations")
      .select("user_id")
      .eq("id", binding.project.organization_id)
      .single();

    if (org) {
      const subscription = await getSubscriptionAdmin(org.user_id);
      if (!subscription || !isSubscriptionActive(subscription.status)) {
        await ctx.reply("❌ Subscription required to use the bot.\n\nPlease subscribe at codeforfood settings.");
        return null;
      }
    }

    return binding;
  }

  // Helper to build AI project context
  async function buildProjectContext(projectId: string): Promise<ProjectContext | null> {
    const project = await botGetProjectById(projectId);
    if (!project) return null;

    const { columns, tasks } = await botGetTaskBoardData(projectId);
    const summary = getProjectSummary(project);

    return {
      name: project.name,
      description: project.description,
      status: project.status,
      currency: project.currency || "USD",
      milestones: (project.milestones || []).map((m) => ({
        title: m.title,
        type: m.type,
        amount: m.amount,
        paid_amount: m.paid_amount,
        is_paid: m.is_paid,
        due_date: m.due_date,
      })),
      tasks: tasks
        .filter((t) => !t.is_archived)
        .map((t) => ({
          title: t.title,
          column: columns.find((c) => c.id === t.column_id)?.name || "Unknown",
          priority: t.priority,
          deadline: t.deadline || undefined,
        })),
      summary: {
        totalAmount: summary.totalAmount,
        paidAmount: summary.paidAmount,
        remainingAmount: summary.remainingAmount,
        percentPaid: summary.percentPaid,
      },
    };
  }

  // /money command
  bot.command("money", async (ctx) => {
    const binding = await getBindingWithAccess(ctx);
    if (!binding) return;

    const project = await botGetProjectById(binding.project_id);
    if (!project) {
      await ctx.reply("❌ Project not found.");
      return;
    }

    try {
      const message = formatMoneyMessage(project);
      await ctx.reply(message, { parse_mode: "MarkdownV2" });
    } catch (e) {
      console.error("Error formatting money message:", e);
      await ctx.reply("❌ Failed to format message.");
    }
  });

  // /tasks command
  bot.command("tasks", async (ctx) => {
    const binding = await getBindingWithAccess(ctx);
    if (!binding) return;

    const project = await botGetProjectById(binding.project_id);
    if (!project) {
      await ctx.reply("❌ Project not found.");
      return;
    }

    try {
      const { columns, tasks } = await botGetTaskBoardData(binding.project_id);
      const message = formatTasksMessage(project, columns, tasks);
      await ctx.reply(message, { parse_mode: "MarkdownV2" });
    } catch (e) {
      console.error("Error formatting tasks message:", e);
      await ctx.reply("❌ Failed to format message.");
    }
  });

  // /status command
  bot.command("status", async (ctx) => {
    const binding = await getBindingWithAccess(ctx);
    if (!binding) return;

    const project = await botGetProjectById(binding.project_id);
    if (!project) {
      await ctx.reply("❌ Project not found.");
      return;
    }

    try {
      const { tasks } = await botGetTaskBoardData(binding.project_id);
      const { columns } = await botGetTaskBoardData(binding.project_id);
      const doneColumn = columns.find(c => c.is_done_column);
      const doneTasks = doneColumn ? tasks.filter(t => t.column_id === doneColumn.id).length : 0;

      const message = formatStatusMessage(project, {
        total: tasks.length,
        done: doneTasks,
      });
      await ctx.reply(message, { parse_mode: "MarkdownV2" });
    } catch (e) {
      console.error("Error formatting status message:", e);
      await ctx.reply("❌ Failed to format message.");
    }
  });

  // /link command
  bot.command("link", async (ctx) => {
    const binding = await getBindingWithAccess(ctx);
    if (!binding) return;

    const project = await botGetProjectById(binding.project_id);
    if (!project) {
      await ctx.reply("❌ Project not found.");
      return;
    }

    try {
      const message = formatLinkMessage(project, BASE_URL);
      await ctx.reply(message, { parse_mode: "MarkdownV2" });
    } catch (e) {
      console.error("Error formatting link message:", e);
      await ctx.reply(`🔗 ${project.name}\n${BASE_URL}/p/${project.hash}`);
    }
  });

  // /addtask command
  bot.command("addtask", async (ctx) => {
    const binding = await getBindingWithAccess(ctx);
    if (!binding) return;

    const title = ctx.match?.trim();
    if (!title) {
      await ctx.reply("Usage: /addtask <task title>");
      return;
    }

    // Get first column (To Do)
    const columns = await botGetTaskColumns(binding.project_id);
    const todoColumn = columns.find(c => c.name === "To Do") || columns[0];

    if (!todoColumn) {
      await ctx.reply("❌ No columns found in project.");
      return;
    }

    const task = await botAddTask(binding.project_id, todoColumn.id, {
      title,
      priority: "low",
    });

    if (task) {
      await ctx.reply(`✅ Task created in *To Do*\n"${title.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&")}"`, { parse_mode: "MarkdownV2" });
    } else {
      await ctx.reply("❌ Failed to create task.");
    }
  });

  // /deadline command
  bot.command("deadline", async (ctx) => {
    const binding = await getBindingWithAccess(ctx);
    if (!binding) return;

    const project = await botGetProjectById(binding.project_id);
    if (!project) {
      await ctx.reply("❌ Project not found.");
      return;
    }

    try {
      const { tasks } = await botGetTaskBoardData(binding.project_id);
      const message = formatDeadlineMessage(project, tasks);
      await ctx.reply(message, { parse_mode: "MarkdownV2" });
    } catch (e) {
      console.error("Error formatting deadline message:", e);
      await ctx.reply("❌ Failed to format message.");
    }
  });

  // /ask command — AI-powered project Q&A
  bot.command("ask", async (ctx) => {
    if (!isAiEnabled()) {
      await ctx.reply("AI features are not configured.");
      return;
    }

    const binding = await getBindingWithAccess(ctx);
    if (!binding) return;

    const question = ctx.match?.trim();
    if (!question) {
      await ctx.reply("Usage: /ask <your question>\n\nExample: /ask how much is left to pay?");
      return;
    }

    await ctx.reply("Thinking...");

    try {
      const context = await buildProjectContext(binding.project_id);
      if (!context) {
        await ctx.reply("Failed to load project data.");
        return;
      }

      const answer = await askAboutProject(question, context);
      await ctx.reply(answer.slice(0, 4096));
    } catch (e) {
      console.error("AI ask error:", e);
      await ctx.reply("AI is temporarily unavailable. Please try again later.");
    }
  });

  // /summary command — AI-generated project report
  bot.command("summary", async (ctx) => {
    if (!isAiEnabled()) {
      await ctx.reply("AI features are not configured.");
      return;
    }

    const binding = await getBindingWithAccess(ctx);
    if (!binding) return;

    await ctx.reply("Generating summary...");

    try {
      const context = await buildProjectContext(binding.project_id);
      if (!context) {
        await ctx.reply("Failed to load project data.");
        return;
      }

      const summary = await generateSummary(context);
      await ctx.reply(summary.slice(0, 4096));
    } catch (e) {
      console.error("AI summary error:", e);
      await ctx.reply("AI is temporarily unavailable. Please try again later.");
    }
  });

  // /payment command
  bot.command("payment", async (ctx) => {
    const binding = await getBindingWithAccess(ctx);
    if (!binding) return;

    const project = await botGetProjectById(binding.project_id);
    if (!project) {
      await ctx.reply("❌ Project not found.");
      return;
    }

    const methods = await botGetPaymentMethods(binding.project_id);

    if (methods.length === 0) {
      await ctx.reply("❌ No payment methods configured for this project.");
      return;
    }

    // Format as text with copyable code blocks
    const escapeMarkdown = (text: string) => text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
    const projectName = escapeMarkdown(project.name);

    let msg = `💰 *Payment Methods*\n${projectName}\n\n`;
    msg += "_Tap on address to copy_\n\n";

    methods.forEach((m) => {
      const icon = m.type === "crypto" ? "₿" : m.type === "bank" ? "🏦" : "💳";
      msg += `${icon} *${escapeMarkdown(m.label)}*\n`;
      msg += `\`${m.value}\`\n\n`;
    });

    await ctx.reply(msg.trim(), { parse_mode: "MarkdownV2" });
  });

  // /buttons command - command menu for pinning
  bot.command("buttons", async (ctx) => {
    const binding = await getBindingWithAccess(ctx);
    if (!binding) return;

    const project = await botGetProjectById(binding.project_id);
    if (!project) {
      await ctx.reply("❌ Project not found.");
      return;
    }

    const keyboard = new InlineKeyboard()
      .text("💰 Money", "cmd:money")
      .text("📋 Tasks", "cmd:tasks")
      .row()
      .text("📊 Status", "cmd:status")
      .text("⏰ Deadlines", "cmd:deadline")
      .row()
      .text("💳 Payment", "cmd:payment")
      .text("🔗 Link", "cmd:link")
      .row()
      .text("🤖 Ask AI", "cmd:ask")
      .text("📝 Summary", "cmd:summary")
      .row()
      .text("❓ Help", "cmd:help");

    const projectName = project.name.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
    await ctx.reply(
      `🤖 *codeforfood*\n${projectName}\n\n📌 Pin this message for quick access`,
      { parse_mode: "MarkdownV2", reply_markup: keyboard }
    );
  });

  // Handle command button callbacks
  bot.callbackQuery(/^cmd:(.+)$/, async (ctx) => {
    const match = ctx.callbackQuery.data.match(/^cmd:(.+)$/);
    if (!match) return;

    const cmd = match[1];
    const chatId = ctx.chat!.id;
    const message = ctx.callbackQuery.message as { message_thread_id?: number } | undefined;
    const threadId = message?.message_thread_id;
    const telegramId = ctx.from!.id;

    const { allowed, binding } = await canUseBotInChat(telegramId, chatId, threadId);

    if (!binding) {
      await ctx.answerCallbackQuery({ text: "No project connected" });
      return;
    }

    if (!allowed) {
      await ctx.answerCallbackQuery({ text: "No permission" });
      return;
    }

    // Check project owner's subscription
    const supabase = createBotClient();
    const { data: org } = await supabase
      .from("organizations")
      .select("user_id")
      .eq("id", binding.project.organization_id)
      .single();

    if (org) {
      const subscription = await getSubscriptionAdmin(org.user_id);
      if (!subscription || !isSubscriptionActive(subscription.status)) {
        await ctx.answerCallbackQuery({ text: "Subscription required" });
        return;
      }
    }

    const project = await botGetProjectById(binding.project_id);
    if (!project) {
      await ctx.answerCallbackQuery({ text: "Project not found" });
      return;
    }

    await ctx.answerCallbackQuery();

    try {
      switch (cmd) {
        case "money": {
          const msg = formatMoneyMessage(project);
          await ctx.reply(msg, { parse_mode: "MarkdownV2" });
          break;
        }
        case "tasks": {
          const { columns, tasks } = await botGetTaskBoardData(binding.project_id);
          const msg = formatTasksMessage(project, columns, tasks);
          await ctx.reply(msg, { parse_mode: "MarkdownV2" });
          break;
        }
        case "status": {
          const { columns, tasks } = await botGetTaskBoardData(binding.project_id);
          const doneColumn = columns.find(c => c.is_done_column);
          const doneTasks = doneColumn ? tasks.filter(t => t.column_id === doneColumn.id).length : 0;
          const msg = formatStatusMessage(project, { total: tasks.length, done: doneTasks });
          await ctx.reply(msg, { parse_mode: "MarkdownV2" });
          break;
        }
        case "deadline": {
          const { tasks } = await botGetTaskBoardData(binding.project_id);
          const msg = formatDeadlineMessage(project, tasks);
          await ctx.reply(msg, { parse_mode: "MarkdownV2" });
          break;
        }
        case "payment": {
          const methods = await botGetPaymentMethods(binding.project_id);
          if (methods.length === 0) {
            await ctx.reply("❌ No payment methods configured.");
            return;
          }
          const escapeMarkdown = (text: string) => text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
          const projectName = escapeMarkdown(project.name);
          let pmMsg = `💰 *Payment Methods*\n${projectName}\n\n`;
          pmMsg += "_Tap on address to copy_\n\n";
          methods.forEach((m) => {
            const icon = m.type === "crypto" ? "₿" : m.type === "bank" ? "🏦" : "💳";
            pmMsg += `${icon} *${escapeMarkdown(m.label)}*\n`;
            pmMsg += `\`${m.value}\`\n\n`;
          });
          await ctx.reply(pmMsg.trim(), { parse_mode: "MarkdownV2" });
          break;
        }
        case "link": {
          const msg = formatLinkMessage(project, BASE_URL);
          await ctx.reply(msg, { parse_mode: "MarkdownV2" });
          break;
        }
        case "ask": {
          await ctx.reply("Use /ask followed by your question.\n\nExample: /ask how much is left to pay?");
          break;
        }
        case "summary": {
          if (!isAiEnabled()) {
            await ctx.reply("AI features are not configured.");
            break;
          }
          await ctx.reply("Generating summary...");
          try {
            const pctx = await buildProjectContext(binding.project_id);
            if (!pctx) {
              await ctx.reply("Failed to load project data.");
              break;
            }
            const summaryText = await generateSummary(pctx);
            await ctx.reply(summaryText.slice(0, 4096));
          } catch (e) {
            console.error("AI summary button error:", e);
            await ctx.reply("AI is temporarily unavailable.");
          }
          break;
        }
        case "help": {
          await ctx.reply(
            "📚 *codeforfood Bot*\n\n" +
            "*Commands:*\n" +
            "`/money` — Financial summary\n" +
            "`/tasks` — All tasks by column\n" +
            "`/status` — Project status\n" +
            "`/deadline` — Upcoming deadlines\n" +
            "`/payment` — Payment methods\n" +
            "`/link` — Public page URL\n" +
            "`/ask <question>` — Ask AI about project\n" +
            "`/summary` — AI project report\n" +
            "`/addtask <title>` — Create task\n" +
            "`/buttons` — Command menu",
            { parse_mode: "MarkdownV2" }
          );
          break;
        }
      }
    } catch (e) {
      console.error("Error handling command button:", e);
      await ctx.reply("❌ Failed to execute command.");
    }
  });

  // /help command
  bot.command("help", async (ctx) => {
    await ctx.reply(
      "📚 *codeforfood Bot*\n\n" +
      "*Setup:*\n" +
      "`/connect abc123` — Connect project to this chat\n" +
      "`/disconnect` — Disconnect project\n\n" +
      "*Info commands:*\n" +
      "`/money` — Financial summary \\(budget, paid, remaining\\)\n" +
      "`/tasks` — All tasks by column\n" +
      "`/status` — Project status overview\n" +
      "`/link` — Public page URL\n" +
      "`/deadline` — Tasks with upcoming deadlines\n" +
      "`/payment` — Payment methods \\(tap to copy\\)\n" +
      "`/ask <question>` — Ask AI about your project\n" +
      "`/summary` — AI\\-generated project report\n\n" +
      "*Actions:*\n" +
      "`/addtask Fix login bug` — Create new task\n" +
      "`/buttons` — Command menu \\(pin for quick access\\)\n\n" +
      "*Inline mode:*\n" +
      "Type `@codeforfood\\_bot task name` in any chat to mark a task as done",
      { parse_mode: "MarkdownV2" }
    );
  });

  // Inline mode for marking tasks as done
  bot.on("inline_query", async (ctx) => {
    const query = ctx.inlineQuery.query.toLowerCase();
    const telegramId = ctx.from.id;

    // Get user's telegram account
    const telegramUser = await getTelegramUserByTelegramId(telegramId);
    if (!telegramUser || telegramUser.telegram_id === 0) {
      await ctx.answerInlineQuery([], { cache_time: 5 });
      return;
    }

    try {
      const supabase = createBotClient();

      // Get all projects bound by this user
      const { data: bindings } = await supabase
        .from("telegram_chat_bindings")
        .select("project_id")
        .eq("bound_by", telegramUser.id);

      if (!bindings || bindings.length === 0) {
        await ctx.answerInlineQuery([], { cache_time: 5 });
        return;
      }

      // Get tasks from all bound projects (not in done columns)
      const projectIds = bindings.map(b => b.project_id);
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*, task_columns!inner(is_done_column, name), projects!inner(name)")
        .in("project_id", projectIds)
        .eq("is_archived", false)
        .eq("task_columns.is_done_column", false);

      if (!tasks || tasks.length === 0) {
        await ctx.answerInlineQuery([], { cache_time: 5 });
        return;
      }

      // Filter by query
      const filtered = tasks
        .filter(t => t.title.toLowerCase().includes(query))
        .slice(0, 10);

      // Type for the joined query result
      interface TaskWithJoins {
        id: string;
        title: string;
        projects: { name: string };
        task_columns: { name: string };
      }

      const results = filtered.map(task => {
        const t = task as unknown as TaskWithJoins;
        return {
          type: "article" as const,
          id: t.id,
          title: t.title,
          description: `${t.projects.name} • ${t.task_columns.name}`,
          input_message_content: {
            message_text: `✅ Completed: "${t.title}"`,
          },
        };
      });

      await ctx.answerInlineQuery(results, { cache_time: 10 });
    } catch (e) {
      console.error("Inline query error:", e);
      await ctx.answerInlineQuery([], { cache_time: 5 });
    }
  });

  // Handle chosen inline result (mark task as done)
  bot.on("chosen_inline_result", async (ctx) => {
    const taskId = ctx.chosenInlineResult.result_id;
    console.log("Chosen inline result - marking task as done:", taskId);

    try {
      const supabase = createBotClient();

      // Get the task's project
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .select("project_id")
        .eq("id", taskId)
        .single();

      if (taskError) {
        console.error("Error fetching task:", taskError.message);
        return;
      }
      if (!task) {
        console.error("Task not found:", taskId);
        return;
      }

      // Get the done column for this project
      const { data: doneColumn, error: colError } = await supabase
        .from("task_columns")
        .select("id")
        .eq("project_id", task.project_id)
        .eq("is_done_column", true)
        .single();

      if (colError) {
        console.error("Error fetching done column:", colError.message);
        return;
      }
      if (!doneColumn) {
        console.error("Done column not found for project:", task.project_id);
        return;
      }

      // Move task to done
      const { error: updateError } = await supabase
        .from("tasks")
        .update({
          column_id: doneColumn.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", taskId);

      if (updateError) {
        console.error("Error updating task:", updateError.message);
      } else {
        console.log("Task marked as done:", taskId);
      }
    } catch (e) {
      console.error("Error marking task as done:", e);
    }
  });

  // Error handler
  bot.catch((err) => {
    console.error("Bot error:", err);
  });
}

// Track if bot has been initialized
let botInitialized = false;

// Export handler for webhook
export async function handleUpdate(update: unknown): Promise<void> {
  if (bot) {
    // Initialize bot on first request (required for webhook mode)
    if (!botInitialized) {
      await bot.init();
      botInitialized = true;
    }
    // Grammy's handleUpdate expects Update type from @grammyjs/types
    // We receive raw JSON from webhook, which matches the Update structure
    await bot.handleUpdate(update as Parameters<typeof bot.handleUpdate>[0]);
  }
}
