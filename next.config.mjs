import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  outputFileTracingRoot: path.join(__dirname, '../'),
  serverExternalPackages: ['@mendable/firecrawl-js', 'undici', 'postgres'],
}

export default nextConfig
