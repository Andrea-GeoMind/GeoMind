import { eq } from 'drizzle-orm'
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

export async function getPromptsBySiteId(siteId: string) {
  return db.select().from(prompts).where(eq(prompts.siteId, siteId))
}
