import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { competitors } from '@/lib/db/schema'

export type CompetitorInsert = {
  siteId: string
  url: string
  name: string | null
}

// Remplace tous les concurrents du site (delete + insert).
export async function replaceCompetitors(siteId: string, items: CompetitorInsert[]) {
  await db.delete(competitors).where(eq(competitors.siteId, siteId))
  if (items.length === 0) return []
  return db.insert(competitors).values(items).returning()
}

export async function insertCompetitor(data: CompetitorInsert) {
  const [row] = await db.insert(competitors).values(data).returning()
  return row
}

export async function deleteCompetitorById(id: string, siteId: string) {
  await db.delete(competitors).where(and(eq(competitors.id, id), eq(competitors.siteId, siteId)))
}

export async function getCompetitorsBySiteId(siteId: string) {
  return db.select().from(competitors).where(eq(competitors.siteId, siteId))
}
