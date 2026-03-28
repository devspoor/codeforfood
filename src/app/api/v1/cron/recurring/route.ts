import { NextRequest, NextResponse } from "next/server";
import { createBotClient } from "@/lib/supabase/server";

function getNextDate(currentDate: string, interval: string): string {
  const date = new Date(currentDate);
  switch (interval) {
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    case "quarterly":
      date.setMonth(date.getMonth() + 3);
      break;
  }
  return date.toISOString().split("T")[0];
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createBotClient();
  const today = new Date().toISOString().split("T")[0];

  // Fetch recurring milestones that are due
  const { data: milestones, error } = await supabase
    .from("milestones")
    .select("*")
    .eq("is_recurring", true)
    .lte("recurrence_next_date", today);

  if (error) {
    console.error("Failed to fetch recurring milestones:", error);
    return NextResponse.json({ error: "Failed to fetch recurring milestones" }, { status: 500 });
  }

  let processed = 0;
  let created = 0;
  let skipped = 0;

  for (const milestone of milestones || []) {
    processed++;

    // Check if end date has passed
    if (milestone.recurrence_end_date && milestone.recurrence_end_date < today) {
      // Disable recurrence
      await supabase
        .from("milestones")
        .update({ is_recurring: false })
        .eq("id", milestone.id);
      skipped++;
      continue;
    }

    // Get max order for the project
    const { data: existing } = await supabase
      .from("milestones")
      .select("order")
      .eq("project_id", milestone.project_id)
      .order("order", { ascending: false })
      .limit(1);

    const nextOrder = existing && existing.length > 0 ? existing[0].order + 1 : 0;

    // Clone the milestone as a non-recurring instance
    const cloneData: Record<string, unknown> = {
      project_id: milestone.project_id,
      title: milestone.title,
      description: milestone.description,
      type: milestone.type,
      amount: milestone.type === "fixed" ? milestone.amount : 0,
      hourly_rate: milestone.hourly_rate,
      estimated_hours: milestone.estimated_hours,
      hours_limit: milestone.hours_limit,
      unit_rate: milestone.unit_rate,
      unit_label: milestone.unit_label,
      estimated_units: milestone.estimated_units,
      units_limit: milestone.units_limit,
      due_date: milestone.recurrence_next_date,
      order: nextOrder,
      paid_amount: 0,
      is_paid: false,
      is_recurring: false,
      recurring_parent_id: milestone.id,
    };

    const { error: insertError } = await supabase
      .from("milestones")
      .insert(cloneData);

    if (insertError) {
      console.error("Failed to clone milestone:", insertError);
      skipped++;
      continue;
    }

    // Update original's recurrence_next_date
    const nextDate = getNextDate(milestone.recurrence_next_date, milestone.recurrence_interval);
    await supabase
      .from("milestones")
      .update({ recurrence_next_date: nextDate })
      .eq("id", milestone.id);

    created++;
  }

  return NextResponse.json({ processed, created, skipped });
}
