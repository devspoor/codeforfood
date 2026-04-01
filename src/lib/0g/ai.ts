import { getCompletion, getJsonCompletion } from "./broker";
import type { GeneratedMilestone, ProjectContext } from "./types";

const MAX_CONTEXT_LENGTH = 4000;

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "\n[truncated]";
}

function serializeContext(context: ProjectContext): string {
  const parts: string[] = [];

  parts.push(`Project: ${context.name}`);
  parts.push(`Status: ${context.status}`);
  parts.push(`Currency: ${context.currency}`);
  if (context.description) {
    parts.push(`Description: ${context.description}`);
  }

  parts.push(`\nFinancials: Total ${context.summary.totalAmount} ${context.currency}, Paid ${context.summary.paidAmount}, Remaining ${context.summary.remainingAmount} (${context.summary.percentPaid}% paid)`);

  if (context.milestones.length > 0) {
    parts.push("\nMilestones:");
    for (const m of context.milestones) {
      const status = m.is_paid ? "PAID" : `${m.paid_amount}/${m.amount} paid`;
      const due = m.due_date ? `, due ${m.due_date}` : "";
      parts.push(`- ${m.title} (${m.type}, ${status}${due})`);
    }
  }

  if (context.tasks.length > 0) {
    parts.push("\nTasks:");
    for (const t of context.tasks) {
      const deadline = t.deadline ? `, deadline ${t.deadline}` : "";
      parts.push(`- [${t.column}] ${t.title} (${t.priority}${deadline})`);
    }
  }

  return truncateText(parts.join("\n"), MAX_CONTEXT_LENGTH);
}

export async function generateMilestones(
  description: string,
  currency: string
): Promise<GeneratedMilestone[]> {
  const systemPrompt = `You are a project management expert. Given a project description, break it down into billing milestones.

Rules:
- Return a JSON object with a "milestones" array
- Each milestone has: title (string), description (string), type ("fixed"), amount (number in ${currency})
- Create 3-8 milestones depending on project complexity
- Amounts should be reasonable estimates for software development work
- First milestone should be a deposit/upfront payment (20-30% of total)
- Last milestone should be final delivery/launch
- Include clear deliverables in each description

Example response:
{"milestones": [{"title": "Project Setup & Deposit", "description": "Initial setup, architecture planning, repository configuration", "type": "fixed", "amount": 2000}]}`;

  const result = await getJsonCompletion<{ milestones: GeneratedMilestone[] }>([
    { role: "system", content: systemPrompt },
    { role: "user", content: truncateText(description, MAX_CONTEXT_LENGTH) },
  ]);

  if (!result.milestones || !Array.isArray(result.milestones)) {
    throw new Error("Invalid response: missing milestones array");
  }

  const validTypes = ["fixed", "hourly", "per_unit"];
  for (const m of result.milestones) {
    if (!m.title || typeof m.title !== "string") {
      throw new Error("Invalid milestone: missing title");
    }
    if (!validTypes.includes(m.type)) {
      m.type = "fixed";
    }
    if (typeof m.amount !== "number" || m.amount < 0) {
      m.amount = 0;
    }
  }

  return result.milestones;
}

export async function askAboutProject(
  question: string,
  context: ProjectContext
): Promise<string> {
  const serialized = serializeContext(context);

  const systemPrompt = `You are an assistant for the project "${context.name}". You have access to the project's current data below. Answer the user's question concisely and helpfully. Use the same language as the question. If the data doesn't contain enough information to answer, say so.

Project Data:
${serialized}`;

  const answer = await getCompletion([
    { role: "system", content: systemPrompt },
    { role: "user", content: question },
  ]);

  return answer;
}

export async function generateSummary(
  context: ProjectContext
): Promise<string> {
  const serialized = serializeContext(context);

  const systemPrompt = `You are a project reporting assistant. Generate a concise project status report based on the data below. Write in English. Use markdown formatting.

Include these sections:
- **Status** — current project state in one sentence
- **Financial Overview** — total budget, paid, remaining, percentage
- **Progress** — what's done, what's in progress, what's upcoming
- **Risks** — any overdue items, budget concerns, or blockers (if none, say "No risks identified")

Keep the total report under 300 words.

Project Data:
${serialized}`;

  const summary = await getCompletion([
    { role: "system", content: systemPrompt },
    { role: "user", content: "Generate the project status report." },
  ]);

  return summary;
}
