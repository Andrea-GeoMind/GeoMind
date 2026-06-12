'use server'

import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { db } from '@/lib/db/client'
import { profiles, sites } from '@/lib/db/schema'

/** Active/désactive les alertes email de visibilité (PLAN item 13). */
export async function setEmailNotificationsAction(
  enabled: boolean
): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  try {
    await db
      .update(profiles)
      .set({ emailNotifications: enabled, updatedAt: new Date() })
      .where(eq(profiles.id, user.id))
  } catch {
    return { error: 'Impossible d’enregistrer la préférence. Réessayez.' }
  }
}

export async function deleteAccountAction(): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Delete all sites (cascades to analyses, metadata, competitors, prompts…)
  await db.delete(sites).where(eq(sites.userId, user.id))

  // Delete the auth user via service role (bypasses RLS)
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return { error: error.message }

  await supabase.auth.signOut()
  redirect('/login')
}
