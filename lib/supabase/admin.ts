import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

// Bypasses RLS — Inngest background jobs ONLY.
// Always verify user ownership explicitly in code before any cross-user mutation.
export function createAdminClient() {
  return createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
