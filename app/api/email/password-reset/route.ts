import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/send";
import { passwordResetEmail } from "@/lib/email/templates";

export async function POST(request: Request) {
  try {
    const { email, fullName, resetUrl, expiresAt } = await request.json();

    if (!email || !fullName || !resetUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { subject, html, text } = passwordResetEmail({ fullName, email, resetUrl, expiresAt });
    const result = await sendEmail({ to: email, subject, html, text });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error("Password reset email error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 },
    );
  }
}
