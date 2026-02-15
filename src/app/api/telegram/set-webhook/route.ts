import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Only allow with secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.TELEGRAM_WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: "Bot token not configured" }, { status: 500 });
  }

  try {
    // Set webhook via Telegram API directly
    const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
        allowed_updates: ["message", "callback_query", "inline_query", "chosen_inline_result"],
      }),
    });

    const result = await response.json();

    if (result.ok) {
      return NextResponse.json({ ok: true, url, result });
    } else {
      return NextResponse.json({ error: result.description }, { status: 400 });
    }
  } catch (error) {
    console.error("Error setting webhook:", error);
    return NextResponse.json({ error: "Failed to set webhook" }, { status: 500 });
  }
}

// GET to check current webhook status
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.TELEGRAM_WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: "Bot token not configured" }, { status: 500 });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error getting webhook info:", error);
    return NextResponse.json({ error: "Failed to get webhook info" }, { status: 500 });
  }
}
