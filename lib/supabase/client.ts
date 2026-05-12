'use client'

import { createBrowserClient } from '@supabase/ssr'

// Used in 'use client' components.
// NEXT_PUBLIC_ vars are inlined at build time — no server-only env import needed.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
