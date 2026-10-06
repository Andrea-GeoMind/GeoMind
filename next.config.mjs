import withSerwist from '@serwist/next'
import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  serverExternalPackages: ['@mendable/firecrawl-js', 'undici', 'postgres'],
  // Espace client de chantier : jamais indexé, jamais en cache, jamais de
  // Referer. Mêmes valeurs que lib/chantiers/headers.ts (route d'entrée).
  async headers() {
    return [
      {
        source: '/chantier/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Cache-Control', value: 'private, no-store' },
        ],
      },
    ]
  },
}

const withSerwistConfig = withSerwist({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})

export default withSentryConfig(withSerwistConfig(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: true,
})
