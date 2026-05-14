import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('posthog-node', () => {
  const capture = vi.fn()
  const flush = vi.fn().mockResolvedValue(undefined)
  const PostHog = vi.fn().mockImplementation(() => ({ capture, flush }))
  return { PostHog }
})

vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_POSTHOG_KEY: 'phc_test',
    NEXT_PUBLIC_POSTHOG_HOST: 'https://eu.posthog.com',
  },
}))

describe('trackEvent', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('calls capture with the userId and event name', async () => {
    const { trackEvent } = await import('@/lib/posthog')
    const { PostHog } = await import('posthog-node')

    trackEvent('user-123', 'signup', { plan: 'free' })

    const instance = (PostHog as ReturnType<typeof vi.fn>).mock.results[0].value

    expect(instance.capture).toHaveBeenCalledWith(
      expect.objectContaining({
        distinctId: 'user-123',
        event: 'signup',
        properties: expect.objectContaining({ plan: 'free' }),
      })
    )
  })
})
