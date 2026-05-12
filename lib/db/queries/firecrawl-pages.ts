import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { firecrawlPages } from '@/lib/db/schema'

export type FirecrawlPageInsert = {
  siteId: string
  url: string
  markdown: string | null
  metadata: Record<string, unknown> | null
  statusCode: number | null
}

export async function upsertFirecrawlPages(pages: FirecrawlPageInsert[]) {
  if (pages.length === 0) return []
  return db
    .insert(firecrawlPages)
    .values(pages)
    .onConflictDoUpdate({
      target: [firecrawlPages.siteId, firecrawlPages.url],
      set: {
        markdown: firecrawlPages.markdown,
        metadata: firecrawlPages.metadata,
        statusCode: firecrawlPages.statusCode,
        crawledAt: new Date(),
      },
    })
    .returning()
}

export async function getFirecrawlPagesBySiteId(siteId: string) {
  return db.select().from(firecrawlPages).where(eq(firecrawlPages.siteId, siteId))
}

export async function deleteFirecrawlPagesBySiteId(siteId: string) {
  await db.delete(firecrawlPages).where(eq(firecrawlPages.siteId, siteId))
}
