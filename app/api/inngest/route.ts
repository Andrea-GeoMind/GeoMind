import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { crawlSiteFunction } from '@/lib/inngest/functions/crawl-site'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [crawlSiteFunction],
})
