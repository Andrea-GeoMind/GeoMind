import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { siteMetadata } from '@/lib/db/schema'

export type SiteMetadataUpsert = {
  siteId: string
  description: string | null
  keywords: string[]
}

export async function upsertSiteMetadata(data: SiteMetadataUpsert) {
  const [row] = await db
    .insert(siteMetadata)
    .values(data)
    .onConflictDoUpdate({
      target: siteMetadata.siteId,
      set: {
        description: data.description,
        keywords: data.keywords,
        updatedAt: new Date(),
      },
    })
    .returning()
  return row
}

export async function getSiteMetadataBySiteId(siteId: string) {
  const [row] = await db.select().from(siteMetadata).where(eq(siteMetadata.siteId, siteId))
  return row ?? null
}

export async function updateSiteDescription(siteId: string, description: string) {
  const [row] = await db
    .update(siteMetadata)
    .set({ description, updatedAt: new Date() })
    .where(eq(siteMetadata.siteId, siteId))
    .returning()
  return row ?? null
}

export async function updateSiteKeywords(siteId: string, keywords: string[]) {
  const [row] = await db
    .update(siteMetadata)
    .set({ keywords, updatedAt: new Date() })
    .where(eq(siteMetadata.siteId, siteId))
    .returning()
  return row ?? null
}

export async function deleteSiteMetadata(siteId: string) {
  await db.delete(siteMetadata).where(eq(siteMetadata.siteId, siteId))
}
