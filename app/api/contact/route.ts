import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json()

    // Validate input
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    // Here you would typically:
    // 1. Send an email to support@eureka.study
    // 2. Store the message in a database
    // 3. Create a ticket in your support system

    // For now, we'll just validate and return success
    // In production, implement actual email sending

    return NextResponse.json(
      { success: true, message: "Your message has been received" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Contact form error:", error)
    return NextResponse.json(
      { error: "Failed to process your request" },
      { status: 500 }
    )
  }
}
