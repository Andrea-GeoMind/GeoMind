/**
 * Garde-fous de dépense Firecrawl.
 *
 * Trois plafonds distincts, qu'on ne veut pas confondre :
 *  - le budget explicite de la série (`--credit-budget`) ;
 *  - le solde réel du compte ;
 *  - la réserve gardée pour les analyses clientes.
 *
 * Le troisième est le seul qui ne regarde pas la série : même quand le solde
 * suffit, démarcher avec les crédits qui feront tourner une analyse payée est
 * un mauvais arbitrage.
 */

/**
 * Crédits gardés pour la production.
 *
 * Une analyse complète consomme jusqu'à 20 crédits (crawl plafonné à 20
 * pages), une découverte environ 6 (1 `map` + 5 `scrape`). 150 couvrent donc
 * largement une journée chargée.
 */
export const PRODUCTION_RESERVE = 150

export interface BudgetInput {
  /** Crédits que la série s'apprête à dépenser. */
  estimated: number
  /** Plafond demandé en ligne de commande. */
  creditBudget: number
  /** Solde du compte, ou null quand l'API n'a pas répondu. */
  remaining: number | null
  ignoreReserve?: boolean
  reserve?: number
}

/** Motif de refus, ou null quand la série peut démarrer. */
export function budgetRefusal({
  estimated,
  creditBudget,
  remaining,
  ignoreReserve = false,
  reserve = PRODUCTION_RESERVE,
}: BudgetInput): string | null {
  if (estimated > creditBudget) {
    return (
      `${estimated} crédits dépasseraient le plafond de ${creditBudget}. ` +
      `Réduisez --limit ou --max-pages.`
    )
  }
  // Solde inconnu : on ne bloque pas sur une information qu'on n'a pas, le
  // plafond explicite reste en vigueur.
  if (remaining === null) return null

  if (estimated > remaining) {
    return `solde insuffisant (${remaining} crédits pour ${estimated} nécessaires).`
  }
  if (!ignoreReserve && remaining - estimated < reserve) {
    return (
      `il resterait ${remaining - estimated} crédits après cette série, sous la ` +
      `réserve de production de ${reserve}. Une analyse complète en consomme ` +
      `jusqu'à 20, une découverte environ 6 : ces crédits-là sont pour les ` +
      `clients. Attendez le renouvellement du quota, ou forcez avec ` +
      `--ignore-reserve en connaissance de cause.`
    )
  }
  return null
}
