'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { setActionStatus, type ActionSource } from '@/lib/db/queries/action-states'

/** Marque une action « corrigée » ou la repasse « à faire » (PLAN item 16). */
export async function setActionStatusAction(params: {
  siteId: string
  ruleKey: string
  pageUrl: string
  source: ActionSource
  status: 'todo' | 'done'
}): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Ownership explicite (règle CLAUDE.md n°11)
  const site = await getSiteById(params.siteId)
  if (!site || site.userId !== user.id) {
    return { error: 'Site introuvable.' }
  }

  try {
    await setActionStatus(params)
  } catch {
    return { error: 'Impossible d’enregistrer. Réessayez.' }
  }

  revalidatePath(`/sites/${params.siteId}/action-plan`)
}
