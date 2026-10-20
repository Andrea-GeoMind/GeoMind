/**
 * Garde-fou de dépense d'un audit prospect (ticket C-05b).
 *
 * Chaque appel est précédé d'un contrôle : si la dépense déjà faite, plus le
 * coût habituel de l'appel suivant, plus la réserve de la rédaction finale,
 * dépasse le plafond, l'audit s'arrête AVANT d'appeler. Après chaque appel, le
 * coût réellement facturé par OpenRouter est ajouté ; un dépassement arrête
 * aussi l'audit. Pure : aucune E/S.
 */

import type { ProspectEngine } from '@/lib/prospect-audit/types'

/** Plafond par audit fixé par Andrea le 20/10/2026. */
export const AUDIT_CAP_USD = 0.2

/**
 * Coût habituel d'une réponse, mesuré sur les 400 dernières réponses en base
 * (septembre-octobre 2026, mode forcé, recherche web comprise), arrondi au-dessus.
 */
export const TYPICAL_CALL_COST_USD: Record<ProspectEngine, number> = {
  chatgpt: 0.009,
  gemini: 0.011,
  claude: 0.019,
}

/** Rédaction des solutions et du plan (Haiku, sortie plafonnée). */
export const SYNTHESIS_RESERVE_USD = 0.01

export class BudgetExceededError extends Error {
  constructor(
    message: string,
    readonly spentUsd: number
  ) {
    super(message)
    this.name = 'BudgetExceededError'
  }
}

export interface SpendLine {
  label: string
  costUsd: number
}

export class AuditBudget {
  readonly lines: SpendLine[] = []

  constructor(
    readonly capUsd: number = AUDIT_CAP_USD,
    /** Réserve gardée pour la rédaction, tant qu'elle n'a pas eu lieu. */
    private reserveUsd: number = SYNTHESIS_RESERVE_USD
  ) {}

  get spentUsd(): number {
    return this.lines.reduce((sum, l) => sum + l.costUsd, 0)
  }

  /** Lève si l'appel suivant risque de faire passer l'audit au-dessus du plafond. */
  assertRoom(label: string, estimateUsd: number, { usesReserve = false } = {}): void {
    const reserve = usesReserve ? 0 : this.reserveUsd
    const projected = this.spentUsd + estimateUsd + reserve
    if (projected > this.capUsd + 1e-9) {
      throw new BudgetExceededError(
        `Plafond de ${this.capUsd.toFixed(2)} $ atteint avant « ${label} » : ` +
          `${this.spentUsd.toFixed(4)} $ dépensés, ~${estimateUsd.toFixed(3)} $ pour l'appel` +
          (reserve > 0 ? ` et ${reserve.toFixed(3)} $ réservés à la rédaction.` : '.'),
        this.spentUsd
      )
    }
  }

  /** Enregistre le coût facturé ; lève si le plafond est dépassé. */
  record(label: string, costUsd: number, { releasesReserve = false } = {}): void {
    this.lines.push({ label, costUsd: Math.max(0, costUsd) })
    if (releasesReserve) this.reserveUsd = 0
    if (this.spentUsd > this.capUsd + 1e-9) {
      throw new BudgetExceededError(
        `Plafond de ${this.capUsd.toFixed(2)} $ dépassé après « ${label} » : ${this.spentUsd.toFixed(4)} $.`,
        this.spentUsd
      )
    }
  }
}
