import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { sites } from '@/lib/db/schema'
import { type SiteInput } from '@/lib/validations/site'

export { siteSchema, type SiteInput } from '@/lib/validations/site'

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function createSite(data: SiteInput & { userId: string }) {
  const [site] = await db.insert(sites).values(data).returning()
  return site
}

export async function getSitesByUserId(userId: string) {
  return db.select().from(sites).where(eq(sites.userId, userId)).orderBy(sites.createdAt)
}

export async function getSiteById(id: string) {
  const [site] = await db.select().from(sites).where(eq(sites.id, id))
  return site ?? null
}

export async function deleteSite(id: string) {
  await db.delete(sites).where(eq(sites.id, id))
}
