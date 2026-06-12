'use server'

import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/client'
import { sites } from '@/lib/db/schema'
import { getSiteById } from '@/lib/db/queries/sites'
import { clearCoachData } from '@/lib/db/queries/coach'

/**
 * Marque l'intro de GEO comme vue (§16.5.D) — l'auto-ouverture post-première
 * analyse ne se produit qu'une seule fois par site.
 */
export async function markCoachIntroSeenAction(siteId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const site = await getSiteById(siteId)
  if (!site || site.userId !== user.id) return

  await db
    .update(sites)
    .set({ coachIntroSeen: true, updatedAt: new Date() })
    .where(eq(sites.id, siteId))
}

/**
 * RGPD §16.8 : « Effacer la mémoire de GEO » — supprime les messages
 * et le résumé mémoire du site.
 */
export async function clearCoachMemoryAction(
  siteId: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const site = await getSiteById(siteId)
  if (!site || site.userId !== user.id) return { error: 'Site introuvable.' }

  try {
    await clearCoachData(user.id, siteId)
    return { ok: true }
  } catch (err) {
    console.error('[clearCoachMemoryAction] error:', err)
    return { error: 'Une erreur est survenue. Veuillez réessayer.' }
  }
}
