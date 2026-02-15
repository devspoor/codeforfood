import { NextRequest, NextResponse } from "next/server";
import { handleUpdate } from "@/lib/telegram/bot";

export async function POST(req: NextRequest) {
  // Verify webhook secret
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    console.warn("Invalid webhook secret");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const update = await req.json();
    await handleUpdate(update);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    // Always return 200 to Telegram to prevent retries
    return NextResponse.json({ ok: true });
  }
}

// Telegram sends GET for webhook validation
export async function GET() {
  return NextResponse.json({ ok: true });
}
