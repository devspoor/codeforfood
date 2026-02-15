import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/db";
import { getTelegramUserByUserId, unlinkTelegramAccount, createOrUpdateLinkToken } from "@/lib/telegram/db";

// GET - Get telegram connection status
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const telegramUser = await getTelegramUserByUserId(user.id);

  return NextResponse.json({
    connected: !!telegramUser && telegramUser.telegram_id !== 0,
    username: telegramUser?.telegram_username,
    linkedAt: telegramUser?.linked_at,
  });
}

// POST - Generate link token
export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await createOrUpdateLinkToken(user.id);

  if (!result) {
    return NextResponse.json({ error: "Failed to create link" }, { status: 500 });
  }

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "codeforfood_bot";
  const deepLink = `https://t.me/${botUsername}?start=${result.token}`;

  return NextResponse.json({
    deepLink,
    expiresAt: result.expiresAt.toISOString(),
  });
}

// DELETE - Unlink telegram
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const success = await unlinkTelegramAccount(user.id);

  if (success) {
    return NextResponse.json({ ok: true });
  } else {
    return NextResponse.json({ error: "Failed to unlink" }, { status: 500 });
  }
}
