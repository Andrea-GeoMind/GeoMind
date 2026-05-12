'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { updateSiteDescription, updateSiteKeywords } from '@/lib/db/queries/site-metadata'
import { insertCompetitor, deleteCompetitorById } from '@/lib/db/queries/competitors'
import { insertPrompt, deletePromptById } from '@/lib/db/queries/prompts'
import { isPromptNeutral } from '@/lib/analysis/neutrality'

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function requireSiteOwner(siteId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const site = await getSiteById(siteId)
  if (!site || site.userId !== user.id) return null
  return site
}

// ─── Description ─────────────────────────────────────────────────────────────

const descriptionSchema = z.string().trim().min(5, 'Description trop courte.').max(1000)

export async function updateDescriptionAction(
  siteId: string,
  description: string
): Promise<{ error?: string }> {
  const site = await requireSiteOwner(siteId)
  if (!site) return { error: 'Site introuvable.' }

  const parsed = descriptionSchema.safeParse(description)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  await updateSiteDescription(siteId, parsed.data)
  revalidatePath(`/sites/${siteId}/discovery`)
  return {}
}

// ─── Keywords ─────────────────────────────────────────────────────────────────

const keywordsSchema = z.array(z.string().trim().min(1)).max(30)

export async function updateKeywordsAction(
  siteId: string,
  keywords: string[]
): Promise<{ error?: string }> {
  const site = await requireSiteOwner(siteId)
  if (!site) return { error: 'Site introuvable.' }

  const parsed = keywordsSchema.safeParse(keywords)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  await updateSiteKeywords(siteId, parsed.data)
  revalidatePath(`/sites/${siteId}/discovery`)
  return {}
}

// ─── Competitors ──────────────────────────────────────────────────────────────

const competitorSchema = z.object({
  url: z.string().url('URL invalide. Ex : https://concurrent.com'),
  name: z.string().trim().max(100).nullable(),
})

export async function addCompetitorAction(
  siteId: string,
  url: string,
  name: string | null
): Promise<{ data?: { id: string; url: string; name: string | null }; error?: string }> {
  const site = await requireSiteOwner(siteId)
  if (!site) return { error: 'Site introuvable.' }

  const parsed = competitorSchema.safeParse({ url: url.trim(), name })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const row = await insertCompetitor({ siteId, url: parsed.data.url, name: parsed.data.name }).catch(
    () => null
  )
  if (!row) return { error: 'Impossible d\'ajouter ce concurrent (URL déjà présente ?).' }

  revalidatePath(`/sites/${siteId}/discovery`)
  return { data: { id: row.id, url: row.url, name: row.name } }
}

export async function deleteCompetitorAction(
  siteId: string,
  competitorId: string
): Promise<{ error?: string }> {
  const site = await requireSiteOwner(siteId)
  if (!site) return { error: 'Site introuvable.' }

  await deleteCompetitorById(competitorId, siteId)
  revalidatePath(`/sites/${siteId}/discovery`)
  return {}
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

const promptTextSchema = z.string().trim().min(10, 'Le prompt doit faire au moins 10 caractères.')

export async function addPromptAction(
  siteId: string,
  text: string
): Promise<{ data?: { id: string; text: string; isNeutral: boolean }; error?: string }> {
  const site = await requireSiteOwner(siteId)
  if (!site) return { error: 'Site introuvable.' }

  const parsed = promptTextSchema.safeParse(text)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const neutral = isPromptNeutral(parsed.data, site.url, site.name)
  const row = await insertPrompt({ siteId, text: parsed.data, isNeutral: neutral })
  revalidatePath(`/sites/${siteId}/discovery`)
  return { data: { id: row.id, text: row.text, isNeutral: row.isNeutral } }
}

export async function deletePromptAction(
  siteId: string,
  promptId: string
): Promise<{ error?: string }> {
  const site = await requireSiteOwner(siteId)
  if (!site) return { error: 'Site introuvable.' }

  await deletePromptById(promptId, siteId)
  revalidatePath(`/sites/${siteId}/discovery`)
  return {}
}
