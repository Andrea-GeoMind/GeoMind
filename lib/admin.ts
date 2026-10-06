import 'server-only'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSubscriptionByUserId } from '@/lib/db/queries/subscriptions'
import { isActiveAdmin } from '@/lib/plans'

export interface AdminUser {
  id: string
  email: string
}

/**
 * Garde des pages et actions internes. Lit la session (cookies) puis le plan
 * en base — jamais un état client. Un non-admin reçoit une 404 : l'existence
 * de ces pages n'a pas à être révélée.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const subscription = await getSubscriptionByUserId(user.id)
  if (!isActiveAdmin(subscription)) notFound()

  return { id: user.id, email: user.email ?? '' }
}
