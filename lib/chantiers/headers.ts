/**
 * En-têtes de toutes les réponses de /chantier/* (next.config.mjs et route
 * d'entrée) : jamais indexé, jamais mis en cache, jamais de Referer, jamais
 * dans un cadre.
 */
export const CHANTIER_PRIVATE_HEADERS = [
  { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Cache-Control', value: 'private, no-store' },
  // Jamais affiché dans un cadre d'un autre site (audit du 07/10/2026)
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
] as const
