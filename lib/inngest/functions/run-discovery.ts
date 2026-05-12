import { inngest } from '@/lib/inngest/client'
import { runDiscovery } from '@/lib/analysis/discovery'

export const runDiscoveryFunction = inngest.createFunction(
  { id: 'run-discovery', triggers: [{ event: 'site.discovery.requested' }] },
  async ({ event, step }) => {
    const { siteId } = event.data as { siteId: string; userId: string }

    const result = await step.run('run-discovery', () => runDiscovery(siteId))

    return result
  }
)
