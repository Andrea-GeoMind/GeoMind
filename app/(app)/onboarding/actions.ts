'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canAddSite } from '@/lib/quotas'
import { createSite } from '@/lib/db/queries/sites'
import { onboardingSiteSchema } from '@/lib/validations/site'
import { inngest } from '@/lib/inngest/client'

export async function createSiteOnboardingAction(
  formData: FormData
): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = onboardingSiteSchema.safeParse({
    name: formData.get('name'),
    url: formData.get('url'),
    language: formData.get('language') || 'fr',
    country: formData.get('country') || 'FR',
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const allowed = await canAddSite(user.id)
  if (!allowed)
    return {
      error: 'Limite de sites atteinte pour votre plan. Passez au plan supérieur.',
    }

  const site = await createSite({ userId: user.id, ...parsed.data })

  await inngest.send([
    {
      name: 'site/crawl.requested',
      data: { siteId: site.id, userId: user.id },
    },
    {
      name: 'site/discovery.requested',
      data: { siteId: site.id, userId: user.id },
    },
  ])

  redirect('/onboarding?step=3')
}
