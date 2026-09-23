/**
 * lib/analysis/prompt-changes.ts
 *
 * Les questions de test ont-elles changé entre deux analyses ?
 *
 * Le score d'autorité est le taux de citation mesuré sur un jeu de questions
 * précis. Si ce jeu change, les deux notes ne mesurent plus la même chose :
 * afficher « +12 pts » compare deux grandeurs différentes et raconte une
 * progression qui n'a pas eu lieu.
 *
 * Signal utilisé : la date de création des questions actuelles, comparée à la
 * date de l'analyse précédente. Une question créée après cette analyse prouve
 * que le jeu a changé depuis.
 *
 * ── Ce que ce signal ne voit pas ────────────────────────────────────────────
 *
 * La SUPPRESSION d'une question passe inaperçue. `authority_results.prompt_id`
 * est déclaré `onDelete: cascade` : supprimer une question efface aussi les
 * réponses qu'elle avait produites, dans toutes les analyses passées. La
 * preuve du changement disparaît donc en même temps que le changement.
 *
 * Le correctif propre est de figer le jeu de questions sur l'analyse au moment
 * où elle tourne (colonne dédiée sur `analyses`), ce qui demande une migration.
 * En attendant, on détecte les ajouts et les redécouvertes, et on préfère ne
 * rien affirmer plutôt qu'afficher une comparaison fausse.
 */

/** Une question de test, réduite à ce qui sert ici. */
export interface PromptTimestamp {
  createdAt: Date
}

/**
 * Vrai si au moins une question actuelle a été créée après l'analyse de
 * référence — le jeu de questions a donc changé depuis.
 *
 * Fonction pure. `previousAnalysisAt` null (pas d'analyse précédente) →
 * false : il n'y a rien à comparer, donc rien à invalider.
 */
export function promptsChangedSince(
  previousAnalysisAt: Date | null,
  prompts: PromptTimestamp[]
): boolean {
  if (previousAnalysisAt === null) return false
  return prompts.some((p) => p.createdAt.getTime() > previousAnalysisAt.getTime())
}
