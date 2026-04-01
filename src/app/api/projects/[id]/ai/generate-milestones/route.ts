import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyProjectOwnership } from "@/lib/db";
import { isAiEnabled } from "@/lib/0g/broker";
import { generateMilestones } from "@/lib/0g/ai";

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
    const { description } = await request.json();

    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    if (description.length > 10000) {
      return NextResponse.json({ error: "Description too long (max 10000 chars)" }, { status: 400 });
    }

    const milestones = await generateMilestones(
      description.trim(),
      project.currency || "USD"
    );

    return NextResponse.json({ milestones });
  } catch (err) {
    console.error("AI milestone generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate milestones. Please try again." },
      { status: 500 }
    );
  }
}
