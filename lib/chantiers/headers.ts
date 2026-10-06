/**
 * En-têtes de toutes les réponses de /chantier/* (next.config.mjs et route
 * d'entrée) : jamais indexé, jamais mis en cache, jamais de Referer.
 */
export const CHANTIER_PRIVATE_HEADERS = [
  { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Cache-Control', value: 'private, no-store' },
] as const
