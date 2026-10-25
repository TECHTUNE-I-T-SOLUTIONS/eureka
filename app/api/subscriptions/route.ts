import { createHybridClient } from "@/lib/supabase/mobile-server"
import { NextResponse } from "next/server"
import { PLAN_LIMITS } from "@/lib/usage-guard"

export async function GET(request: Request) {
  try {
    const supabase = await createHybridClient(request)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()

    const plan = (sub?.plan as "free" | "pro" | "premium") || "free"
    const limit = PLAN_LIMITS[plan] ?? 2

    // Get usage stats
    const { data: usage } = await supabase
      .from("note_usage")
      .select("*")
      .eq("user_id", user.id)

    return NextResponse.json({
      plan,
      status: sub?.status || "active",
      limit,
      subscription: sub || null,
      usage: usage || [],
    })
  } catch (error) {
    console.error("Subscription GET error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
