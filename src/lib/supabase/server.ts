// src/lib/supabase/server.ts
// Server-side Supabase client for the Next.js App Router (RSC / route handlers).
// Reads + writes the auth session via cookies(), so server components and
// server actions share the same anonymous/authenticated session as the browser.
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll can be called from a Server Component where cookies are
            // read-only. The session is still refreshed on the next request.
          }
        },
      },
    }
  )
}
