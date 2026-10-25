import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Creates a Supabase client that authenticates using a Bearer token
 * from the Authorization header. Used for mobile API requests.
 */
export async function createMobileClient(request: Request) {
  const authHeader = request.headers.get("Authorization")
  const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null

  const client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      },
    }
  )

  return client
}

/**
 * Creates a hybrid client that tries Bearer token first, then falls back to cookies.
 * Use this in routes that serve BOTH web (cookie-based) and mobile (Bearer token).
 */
export async function createHybridClient(request: Request) {
  const authHeader = request.headers.get("Authorization")
  const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null

  if (accessToken) {
    return createMobileClient(request)
  }

  // Fall back to cookie-based auth for web requests
  const { createClient } = await import("@/lib/supabase/server")
  return createClient()
}
