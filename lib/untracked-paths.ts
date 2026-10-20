/**
 * Pages ouvertes par un lien secret (espace chantier, audit prospect) : aucune
 * mesure d'audience, donc rien à consentir. Le lien d'un audit est dans son
 * adresse : il n'a rien à faire dans PostHog.
 */
const UNTRACKED_PREFIXES = ['/chantier', '/audit/'] as const

export function isUntrackedPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return UNTRACKED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}
