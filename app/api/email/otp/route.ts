import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/send";
import { otpEmail } from "@/lib/email/templates";

export async function POST(request: Request) {
  try {
    const { email, fullName, code, purpose } = await request.json();

    if (!email || !fullName || !code || !purpose) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { subject, html, text } = otpEmail({ fullName, code, purpose });
    const result = await sendEmail({ to: email, subject, html, text });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error("OTP email error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 },
    );
  }
}
