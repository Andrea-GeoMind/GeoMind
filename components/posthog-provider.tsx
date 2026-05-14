'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect, type ReactNode } from 'react'

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? ''
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.posthog.com'

function init() {
  if (!POSTHOG_KEY || posthog.__loaded) return
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: true,
    persistence: 'localStorage',
    autocapture: false,
    loaded: (ph) => {
      if (process.env.NODE_ENV === 'development') ph.opt_out_capturing()
    },
  })
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (consent === 'all') init()

    const handler = (e: Event) => {
      if ((e as CustomEvent<string>).detail === 'all') init()
      if ((e as CustomEvent<string>).detail === 'essential') posthog.opt_out_capturing()
    }
    window.addEventListener('cookie-consent', handler)
    return () => window.removeEventListener('cookie-consent', handler)
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
