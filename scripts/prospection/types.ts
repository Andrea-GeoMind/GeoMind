/**
 * Prospection — types partagés.
 *
 * Chaîne volontairement sans aucun appel LLM : Google Places pour la source,
 * l'audit express (11 vérifications HTTP) et le moteur de 57 règles via
 * Firecrawl. Les piliers Autorité et Réputation, qui interrogent les moteurs
 * IA, sont exclus — ce sont eux qui coûtent des crédits OpenRouter.
 */

/** Entreprise telle que la source la renvoie, avant filtrage. */
export interface Business {
  name: string
  category: string
  phone: string | null
  address: string | null
  website: string | null
  reviewCount: number | null
  rating: number | null
  /** Identifiant de la source, pour déduplication. */
  sourceId: string
}

/** Entreprise auditée, prête pour le CSV. */
export interface Prospect extends Business {
  email: string | null
  expressScore: number | null
  technicalScore: number | null
  contentScore: number | null
  /** Les 3 points faibles les plus graves, formulés pour le client. */
  topIssues: string[]
  /** Renseigné quand l'audit n'a pas pu aboutir. */
  error?: string
}

/** Une source d'entreprises — enfichable, pour ne pas dépendre d'un fournisseur. */
export interface BusinessSource {
  readonly name: string
  search(category: string, area: string, limit: number): Promise<Business[]>
}

export interface ProspectionFilters {
  minReviews: number
  maxReviews: number
  /** Une entreprise sans site n'a rien à auditer. */
  requireWebsite: boolean
}

export const DEFAULT_FILTERS: ProspectionFilters = {
  minReviews: 20,
  maxReviews: 250,
  requireWebsite: true,
}
