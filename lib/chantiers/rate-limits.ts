import type { RateLimitRule } from '@/lib/rate-limit'

/**
 * Plafonds de l'espace client de chantier. Larges pour un usage réel (un
 * client qui remplit tout d'une traite enregistre quelques centaines de
 * champs), serrés pour un robot qui essaie des liens au hasard.
 */
export const CHANTIER_RATE_LIMITS = {
  /** Liens inconnus, expirés ou révoqués, par IP tronquée */
  badToken: { limit: 10, windowSeconds: 60 * 60 },
  /** Pages vues, par IP tronquée */
  view: { limit: 60, windowSeconds: 10 * 60 },
  /** Enregistrements de champs, par chantier */
  save: { limit: 300, windowSeconds: 10 * 60 },
  /**
   * Fichiers : demande d'adresse d'envoi puis confirmation, par chantier.
   * Deux appels par fichier : 300 par heure couvrent 150 photos d'un coup.
   */
  upload: { limit: 300, windowSeconds: 60 * 60 },
  /**
   * Questions à l'assistant, par chantier. Anti-abus seulement : un humain
   * qui lit les réponses n'en pose pas 30 en une heure.
   */
  assistant: { limit: 30, windowSeconds: 60 * 60 },
  /** « J'ai terminé », par chantier */
  submit: { limit: 5, windowSeconds: 60 * 60 },
} as const satisfies Record<string, RateLimitRule>

export type ChantierRateLimitName = keyof typeof CHANTIER_RATE_LIMITS
