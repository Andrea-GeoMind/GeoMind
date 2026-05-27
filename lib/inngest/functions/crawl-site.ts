import { inngest } from '@/lib/inngest/client'
import { scrapeForDiscovery } from '@/lib/crawl/firecrawl'

// Pour la découverte, 5 pages suffisent et scrapeForDiscovery est beaucoup
// plus rapide que crawl() (map + scrape direct vs job async + polling).
const DEFAULT_MAX_PAGES = 5

export const crawlSiteFunction = inngest.createFunction(
  { id: 'crawl-site', triggers: [{ event: 'site.crawl.requested' }] },
  async ({ event, step }) => {
    const { siteId, userId, maxPages = DEFAULT_MAX_PAGES } = event.data as {
      siteId: string
      userId: string
      maxPages?: number
    }

    const result = await step.run('crawl-firecrawl', () =>
      scrapeForDiscovery({ siteId, maxPages })
    )

    await step.sendEvent('trigger-discovery', {
      name: 'site.discovery.requested',
      data: { siteId, userId },
    })

    return result
  }
)
