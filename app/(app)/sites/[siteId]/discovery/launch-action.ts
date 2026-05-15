'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { inngest } from '@/lib/inngest/client'
import { trackEvent } from '@/lib/posthog'

export async function launchDiscoveryAction(
  siteId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const site = await getSiteById(siteId)
  if (!site || site.userId !== user.id) return { error: 'Site introuvable.' }

  trackEvent(user.id, 'discovery_started', { siteId })

  try {
    await inngest.send({
      name: 'site.crawl.requested',
      data: { siteId: site.id, userId: user.id },
    })
  } catch (err) {
    console.error('[Inngest] Failed to send crawl event:', err)
    return {
      error: 'Une erreur est survenue lors du lancement de la découverte. Veuillez réessayer.',
    }
  }

  return {}
}
