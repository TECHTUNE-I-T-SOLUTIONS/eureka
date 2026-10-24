import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { plan, email: providedEmail, callback_url } = await request.json()

    if (!plan || !["pro", "premium"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan specified. Choose 'pro' or 'premium'." }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user && !providedEmail) {
      return NextResponse.json({ error: "Unauthorized. Please log in or provide email." }, { status: 401 })
    }

    const email = user?.email || providedEmail

    // Plan pricing in kobo (1 NGN = 100 Kobo)
    // Pro: NGN 5,000 -> 500,000 kobo
    // Premium: NGN 15,000 -> 1,500,000 kobo
    const amount = plan === "pro" ? 500000 : 1500000

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY

    if (!paystackSecretKey) {
      return NextResponse.json({ error: "Paystack secret key is not configured." }, { status: 500 })
    }

    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount,
        callback_url: callback_url || `${process.env.NEXT_PUBLIC_APP_URL || "https://eureka.vercel.app"}/subscription/callback`,
        metadata: {
          user_id: user?.id || null,
          plan,
          email,
        },
      }),
    })

    const data = await paystackResponse.json()

    if (!paystackResponse.ok || !data.status) {
      return NextResponse.json(
        { error: data.message || "Failed to initialize Paystack transaction" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      status: true,
      message: "Transaction initialized successfully",
      data: {
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
        reference: data.data.reference,
        plan,
        amount,
      },
    })
  } catch (error) {
    console.error("Paystack initialization error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
