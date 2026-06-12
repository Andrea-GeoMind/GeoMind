/**
 * lib/ai/coach-suggestions.ts
 *
 * Chips de questions suggérées sous l'input de GEO (§16.6) — 3 max,
 * contextuelles selon la page courante et l'état du site. Fonction pure,
 * importable côté client.
 */

export type CoachPage =
  | 'overview'
  | 'technical'
  | 'content'
  | 'authority'
  | 'publishers'
  | 'coach'
  | 'floating'

export interface CoachSiteState {
  hasAnalysis: boolean
  globalScore: number | null
  /** Points faibles (hors opportunités) de l'onglet courant, si pertinent */
  issueCount: number
  /** Le site est-il cité au moins une fois par les IA ? null = inconnu */
  cited: boolean | null
}

export function getSuggestions(page: CoachPage, state: CoachSiteState): string[] {
  if (!state.hasAnalysis) {
    return ["Comment fonctionne l'analyse ?", "C'est quoi le GEO exactement ?"]
  }

  switch (page) {
    case 'overview':
    case 'coach':
      if (state.globalScore !== null && state.globalScore < 40) {
        return [
          'Pourquoi mon score est si bas ?',
          "C'est quoi mon point faible n°1 ?",
          'Par quoi je commence ?',
        ]
      }
      return [
        'Comment passer au niveau supérieur ?',
        'Explique-moi mes 3 notes',
        'Je vise quel score ?',
      ]

    case 'technical':
    case 'content':
      if (state.issueCount > 0) {
        return [
          'Par quoi je commence ?',
          "Explique-moi l'issue la plus grave",
          'Combien de temps pour tout corriger ?',
        ]
      }
      return ['Comment garder ce niveau ?', "Qu'est-ce que je peux encore améliorer ?"]

    case 'authority':
      if (state.cited === false) {
        return ['Pourquoi les IA ne me citent pas ?', 'Comment me faire citer ?']
      }
      return [
        'Pourquoi ChatGPT me cite et pas Gemini ?',
        'Comment être cité plus souvent ?',
      ]

    case 'publishers':
      return ["C'est quoi un publisher ?", 'Lequel contacter en premier ?']

    case 'floating':
      return [
        'Comment améliorer ma visibilité IA ?',
        'Explique-moi mes notes',
        "C'est quoi le GEO exactement ?",
      ]
  }
}
