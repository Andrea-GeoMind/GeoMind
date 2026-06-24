import { count, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { firecrawlPages } from '@/lib/db/schema'
import { dedupeFirecrawlPages, type FirecrawlPageInsert } from '@/lib/crawl/pages'

// Re-export pour compat des imports existants (firecrawl.ts, etc.)
export { dedupeFirecrawlPages, type FirecrawlPageInsert }

export async function upsertFirecrawlPages(pages: FirecrawlPageInsert[]) {
  const deduped = dedupeFirecrawlPages(pages)
  if (deduped.length === 0) return []
  return db
    .insert(firecrawlPages)
    .values(deduped)
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

/** Nombre de pages crawlées pour un site — transparence d'échantillonnage. */
export async function countFirecrawlPagesBySiteId(siteId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(firecrawlPages)
    .where(eq(firecrawlPages.siteId, siteId))
  return row?.value ?? 0
}

export async function deleteFirecrawlPagesBySiteId(siteId: string) {
  await db.delete(firecrawlPages).where(eq(firecrawlPages.siteId, siteId))
}

/**
 * Retourne la date du dernier crawl pour un site (la plus récente de toutes les pages).
 * Retourne null si aucune page n'a encore été crawlée.
 */
export async function getLastCrawledAt(siteId: string): Promise<Date | null> {
  const [row] = await db
    .select({ crawledAt: firecrawlPages.crawledAt })
    .from(firecrawlPages)
    .where(eq(firecrawlPages.siteId, siteId))
    .orderBy(desc(firecrawlPages.crawledAt))
    .limit(1)
  return row?.crawledAt ?? null
}
