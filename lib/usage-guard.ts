import { SupabaseClient } from "@supabase/supabase-js"
import crypto from "crypto"

export interface UsageGuardResult {
  allowed: boolean
  plan: "free" | "pro" | "premium"
  limit: number
  currentCount: number
  error?: string
}

export const PLAN_LIMITS = {
  free: 2,
  pro: 10,
  premium: Infinity,
}

/**
 * Utility to calculate content hash for duplicate note detection
 */
export function calculateContentHash(text: string): string {
  return crypto.createHash("sha256").update(text.trim()).digest("hex")
}

/**
 * Server-Side Usage Guard to enforce note request limits by tier & content hash
 */
export async function checkAndUpdateNoteUsage(
  supabase: SupabaseClient,
  userId: string,
  noteId?: string | null,
  rawContent?: string | null
): Promise<UsageGuardResult> {
  try {
    // 1. Fetch user subscription status
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle()

    const plan = ((sub?.plan as "free" | "pro" | "premium") || "free")
    const limit = PLAN_LIMITS[plan] ?? 2

    // Unlimited access for Premium tier
    if (plan === "premium" || limit === Infinity) {
      if (noteId || rawContent) {
        await recordUsage(supabase, userId, noteId, rawContent)
      }
      return { allowed: true, plan, limit: Infinity, currentCount: 0 }
    }

    if (!noteId && !rawContent) {
      // General question without note context
      return { allowed: true, plan, limit, currentCount: 0 }
    }

    // 2. Determine content hash
    let contentHash = rawContent ? calculateContentHash(rawContent) : ""
    let resolvedNoteId = noteId || null

    if (noteId && !contentHash) {
      const { data: note } = await supabase
        .from("notes")
        .select("raw_text, title")
        .eq("id", noteId)
        .maybeSingle()

      if (note?.raw_text) {
        contentHash = calculateContentHash(note.raw_text)
      }
    }

    // 3. Find existing usage record by note_id OR duplicate content_hash
    let existingUsage: any = null

    if (resolvedNoteId) {
      const { data } = await supabase
        .from("note_usage")
        .select("*")
        .eq("user_id", userId)
        .eq("note_id", resolvedNoteId)
        .maybeSingle()
      existingUsage = data
    }

    if (!existingUsage && contentHash) {
      const { data } = await supabase
        .from("note_usage")
        .select("*")
        .eq("user_id", userId)
        .eq("content_hash", contentHash)
        .maybeSingle()
      existingUsage = data
    }

    const currentCount = existingUsage ? existingUsage.request_count : 0

    // 4. Enforce Tier Limit
    if (currentCount >= limit) {
      return {
        allowed: false,
        plan,
        limit,
        currentCount,
        error: `Request limit reached for this study note (${currentCount}/${limit} requests used on ${plan.toUpperCase()} plan). Upgrade your plan to unlock more requests!`,
      }
    }

    // 5. Increment Usage Record
    if (existingUsage) {
      await supabase
        .from("note_usage")
        .update({
          request_count: existingUsage.request_count + 1,
          updated_at: new Date().toISOString(),
          ...(resolvedNoteId ? { note_id: resolvedNoteId } : {}),
          ...(contentHash ? { content_hash: contentHash } : {}),
        })
        .eq("id", existingUsage.id)
    } else {
      await supabase.from("note_usage").insert({
        user_id: userId,
        note_id: resolvedNoteId,
        content_hash: contentHash || null,
        request_count: 1,
      })
    }

    return {
      allowed: true,
      plan,
      limit,
      currentCount: currentCount + 1,
    }
  } catch (err) {
    console.error("Error in checkAndUpdateNoteUsage:", err)
    // Fallback: allow on error to prevent blocking users on DB glitches
    return { allowed: true, plan: "free", limit: 2, currentCount: 0 }
  }
}

async function recordUsage(
  supabase: SupabaseClient,
  userId: string,
  noteId?: string | null,
  rawContent?: string | null
) {
  try {
    let contentHash = rawContent ? calculateContentHash(rawContent) : null

    if (noteId) {
      const { data: existing } = await supabase
        .from("note_usage")
        .select("id, request_count")
        .eq("user_id", userId)
        .eq("note_id", noteId)
        .maybeSingle()

      if (existing) {
        await supabase
          .from("note_usage")
          .update({ request_count: existing.request_count + 1, updated_at: new Date().toISOString() })
          .eq("id", existing.id)
        return
      }
    }

    await supabase.from("note_usage").insert({
      user_id: userId,
      note_id: noteId || null,
      content_hash: contentHash,
      request_count: 1,
    })
  } catch (err) {
    console.error("Error recording usage:", err)
  }
}
