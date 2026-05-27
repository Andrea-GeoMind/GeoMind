'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { canAddSite } from '@/lib/quotas'
import { siteSchema, createSite, getSiteById, deleteSite } from '@/lib/db/queries/sites'
import { trackEvent } from '@/lib/posthog'
import { inngest } from '@/lib/inngest/client'

export async function createSiteAction(
  formData: FormData
): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = siteSchema.safeParse({
    name: formData.get('name'),
    url: formData.get('url'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const allowed = await canAddSite(user.id)
  if (!allowed)
    return {
      error: 'Limite de sites atteinte pour votre plan. Passez au plan supérieur.',
    }

  const site = await createSite({ userId: user.id, ...parsed.data })
  trackEvent(user.id, 'site_created', { url: parsed.data.url })

  // Déclencher le crawl + découverte, puis rediriger vers la modale d'onboarding
  // 5 pages suffisent pour la découverte initiale.
  try {
    await inngest.send({
      name: 'site.crawl.requested',
      data: { siteId: site.id, userId: user.id, maxPages: 5 },
    })
  } catch {
    // Si le bus est injoignable, le crawl reste en pending — l'utilisateur
    // peut le relancer depuis la page de découverte.
  }

  redirect(`/onboarding?siteId=${site.id}&step=3`)
}

export async function deleteSiteAction(
  siteId: string
): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const site = await getSiteById(siteId)
  if (!site || site.userId !== user.id) return { error: 'Site introuvable.' }

  await deleteSite(siteId)
  revalidatePath('/dashboard')
}
