import { resend } from "./client";
import React from "react";

interface SendEmailParams {
  to: string;
  subject: string;
  react: React.ReactElement;
  from?: string;
}

export async function sendEmail({ to, subject, react, from }: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY || !resend) {
    console.warn("Email not sent (no RESEND_API_KEY):", subject, "to:", to);
    return { success: false, error: "Email not configured" };
  }

  try {
    const { error } = await resend.emails.send({
      from: from || `codeforfood <noreply@${process.env.EMAIL_DOMAIN || "codeforfood.app"}>`,
      to,
      subject,
      react,
    });

    if (error) {
      console.error("Failed to send email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Email send error:", message);
    return { success: false, error: message };
  }
}
