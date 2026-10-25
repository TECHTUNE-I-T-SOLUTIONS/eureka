import { createHybridClient } from "@/lib/supabase/mobile-server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const reference = body.reference

    if (!reference) {
      return NextResponse.json({ error: "Transaction reference is required" }, { status: 400 })
    }

    return await verifyAndActivateSubscription(reference, request)
  } catch (error) {
    console.error("Payment verification POST error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get("reference") || searchParams.get("trxref")

    if (!reference) {
      return NextResponse.json({ error: "Transaction reference is required" }, { status: 400 })
    }

    return await verifyAndActivateSubscription(reference, request)
  } catch (error) {
    console.error("Payment verification GET error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

async function verifyAndActivateSubscription(reference: string, request: Request) {
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY

  if (!paystackSecretKey) {
    return NextResponse.json({ error: "Paystack secret key is not configured." }, { status: 500 })
  }

  // 1. Verify transaction with Paystack API
  const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`,
      "Content-Type": "application/json",
    },
  })

  const paystackData = await paystackResponse.json()

  if (!paystackResponse.ok || !paystackData.status || paystackData.data.status !== "success") {
    return NextResponse.json(
      {
        error: paystackData.message || "Payment verification failed or transaction was not successful",
        details: paystackData.data,
      },
      { status: 400 }
    )
  }

  const metadata = paystackData.data.metadata || {}
  const plan = metadata.plan || "pro"

  // Try to get authenticated user (supports both web cookies and mobile Bearer token)
  const supabase = await createHybridClient(request)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Resolve target user: auth user → metadata.user_id (UUID) → lookup by email
  let targetUserId = user?.id || metadata.user_id

  if (!targetUserId && metadata.email) {
    // Lookup user by email via admin client
    const adminClient = createAdminClient()
    const { data: usersData } = await adminClient.auth.admin.listUsers()
    const foundUser = usersData?.users?.find((u) => u.email === metadata.email)
    if (foundUser) {
      targetUserId = foundUser.id
    }
  }

  if (!targetUserId) {
    return NextResponse.json(
      { error: "Could not identify user associated with this payment transaction" },
      { status: 400 }
    )
  }

  // 2. Update user subscription tier in database using Admin Client
  const adminSupabase = createAdminClient()
  const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: subscription, error: subError } = await adminSupabase
    .from("subscriptions")
    .upsert(
      {
        user_id: targetUserId,
        plan: plan,
        status: "active",
        paystack_reference: reference,
        plan_code: paystackData.data.plan_code || plan,
        current_period_end: currentPeriodEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single()

  if (subError) {
    console.error("Error upserting subscription:", subError)
    return NextResponse.json({ error: "Payment verified but failed to update subscription in DB" }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: `Successfully upgraded to ${plan.toUpperCase()} plan!`,
    plan,
    subscription,
  })
}
