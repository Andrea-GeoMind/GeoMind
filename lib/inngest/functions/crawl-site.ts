import { inngest } from '@/lib/inngest/client'
import { crawlSite } from '@/lib/crawl/firecrawl'

const DEFAULT_MAX_PAGES = 20

export const crawlSiteFunction = inngest.createFunction(
  { id: 'crawl-site', triggers: [{ event: 'site/crawl.requested' }] },
  async ({ event, step }) => {
    const { siteId, maxPages = DEFAULT_MAX_PAGES } = event.data as {
      siteId: string
      userId: string
      maxPages?: number
    }

    const result = await step.run('crawl-firecrawl', () =>
      crawlSite({ siteId, maxPages })
    )

    return result
  }
)
