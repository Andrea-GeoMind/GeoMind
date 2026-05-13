import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { crawlSiteFunction } from '@/lib/inngest/functions/crawl-site'
import { runDiscoveryFunction } from '@/lib/inngest/functions/run-discovery'
import { runAuthorityAnalysisFunction } from '@/lib/inngest/functions/run-authority-analysis'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [crawlSiteFunction, runDiscoveryFunction, runAuthorityAnalysisFunction],
})
