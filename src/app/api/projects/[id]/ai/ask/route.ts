import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyProjectOwnership, getProjectById, getProjectSummary, getTaskBoardData } from "@/lib/db";
import { isAiEnabled } from "@/lib/0g/broker";
import { askAboutProject } from "@/lib/0g/ai";
import type { ProjectContext } from "@/lib/0g/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAiEnabled()) {
    return NextResponse.json({ error: "AI features are not configured" }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ownership = await verifyProjectOwnership(id, user);
  if (!ownership) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const project = await getProjectById(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  try {
    const { question } = await request.json();

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    if (question.length > 2000) {
      return NextResponse.json({ error: "Question too long (max 2000 chars)" }, { status: 400 });
    }

    const summary = getProjectSummary(project);
    const taskBoardData = await getTaskBoardData(id);
    const columns = taskBoardData.columns;

    const context: ProjectContext = {
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
      tasks: taskBoardData.tasks
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

    const answer = await askAboutProject(question.trim(), context);

    return NextResponse.json({ answer });
  } catch (err) {
    console.error("AI ask failed:", err);
    return NextResponse.json(
      { error: "Failed to get answer. Please try again." },
      { status: 500 }
    );
  }
}
