import path from 'path'
import { fileURLToPath } from 'url'
import withSerwist from '@serwist/next'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  outputFileTracingRoot: path.join(__dirname, '../'),
  serverExternalPackages: ['@mendable/firecrawl-js', 'undici', 'postgres'],
}

const withSerwistConfig = withSerwist({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})

export default withSerwistConfig(nextConfig)
