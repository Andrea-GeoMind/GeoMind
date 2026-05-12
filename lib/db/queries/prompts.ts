import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { prompts } from '@/lib/db/schema'

export type PromptInsert = {
  siteId: string
  text: string
  isNeutral: boolean
}

// Remplace tous les prompts du site (delete + insert).
export async function replacePrompts(siteId: string, items: PromptInsert[]) {
  await db.delete(prompts).where(eq(prompts.siteId, siteId))
  if (items.length === 0) return []
  return db.insert(prompts).values(items).returning()
}

export async function insertPrompt(data: PromptInsert) {
  const [row] = await db.insert(prompts).values(data).returning()
  return row
}

export async function deletePromptById(id: string, siteId: string) {
  await db.delete(prompts).where(and(eq(prompts.id, id), eq(prompts.siteId, siteId)))
}

export async function getPromptsBySiteId(siteId: string) {
  return db.select().from(prompts).where(eq(prompts.siteId, siteId))
}
