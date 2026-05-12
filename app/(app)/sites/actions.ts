'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { canAddSite } from '@/lib/quotas'
import { siteSchema, createSite, getSiteById, deleteSite } from '@/lib/db/queries/sites'

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

  await createSite({ userId: user.id, ...parsed.data })
  revalidatePath('/dashboard')
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
