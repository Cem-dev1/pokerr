// src/lib/supabase/client.ts
// Browser-side Supabase client (anon/publishable key).
// Env is read LAZILY inside createClient(): merely importing this module must
// never throw. A throw at module-eval time would break the production build
// (e.g. on Vercel) when NEXT_PUBLIC_SUPABASE_* aren't present at build time.
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      'Supabase ortam değişkenleri eksik. Vercel/env içinde ' +
        'NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı olmalı.'
    )
  }
  return createBrowserClient(url, key)
}
