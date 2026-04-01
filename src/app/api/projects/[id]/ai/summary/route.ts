import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyProjectOwnership, getProjectSummary } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { isAiEnabled } from "@/lib/0g/broker";
import { generateSummary } from "@/lib/0g/ai";
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
  const project = await verifyProjectOwnership(id, user);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  try {
    const summary = getProjectSummary(project);

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
      tasks: [],
      summary: {
        totalAmount: summary.totalAmount,
        paidAmount: summary.paidAmount,
        remainingAmount: summary.remainingAmount,
        percentPaid: summary.percentPaid,
      },
    };

    const aiSummary = await generateSummary(context);
    const generatedAt = new Date().toISOString();

    const supabase = await createClient();
    const { error } = await supabase
      .from("projects")
      .update({
        ai_summary: aiSummary,
        ai_summary_generated_at: generatedAt,
      })
      .eq("id", id);

    if (error) {
      console.error("Failed to save AI summary:", error.message);
      return NextResponse.json({ error: "Failed to save summary" }, { status: 500 });
    }

    return NextResponse.json({ summary: aiSummary, generated_at: generatedAt });
  } catch (err) {
    console.error("AI summary generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate summary. Please try again." },
      { status: 500 }
    );
  }
}
