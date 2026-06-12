import type { MetadataRoute } from 'next'

/**
 * robots.txt — règle GEO élémentaire que GeoMind audite chez ses clients.
 * Les crawlers IA (GPTBot, ClaudeBot, PerplexityBot, Google-Extended…) sont
 * explicitement autorisés sur les pages publiques ; l'app authentifiée et
 * l'API sont exclues.
 */
export default function robots(): MetadataRoute.Robots {
  const disallow = ['/dashboard', '/sites/', '/settings/', '/onboarding', '/api/', '/auth/']

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      // Crawlers IA — autorisés explicitement (signal d'intention clair)
      { userAgent: 'GPTBot', allow: '/', disallow },
      { userAgent: 'OAI-SearchBot', allow: '/', disallow },
      { userAgent: 'ChatGPT-User', allow: '/', disallow },
      { userAgent: 'ClaudeBot', allow: '/', disallow },
      { userAgent: 'Claude-Web', allow: '/', disallow },
      { userAgent: 'PerplexityBot', allow: '/', disallow },
      { userAgent: 'Google-Extended', allow: '/', disallow },
    ],
    sitemap: 'https://geomind.fr/sitemap.xml',
  }
}
