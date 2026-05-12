import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { siteMetadata } from '@/lib/db/schema'

export type SiteMetadataUpsert = {
  siteId: string
  description: string
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

export async function deleteSiteMetadata(siteId: string) {
  await db.delete(siteMetadata).where(eq(siteMetadata.siteId, siteId))
}
