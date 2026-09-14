// Interface commune aux moteurs IA interrogés lors d'une analyse GEO.

/**
 * Source de vérité UNIQUE de la liste des moteurs.
 *
 * Tout le reste en dérive : le type, le nombre affiché dans l'interface, les
 * dénominateurs de progression et de scoring, les colonnes du tableau croisé.
 * Ajouter ou retirer un moteur ici suffit — aucun « 4 » n'est écrit en dur
 * ailleurs dans le code.
 *
 * Ce fichier ne contient que des types et des constantes (aucun import de
 * `env`), il reste donc importable depuis un composant client.
 */
export const IA_ENGINE_NAMES = ['chatgpt', 'claude', 'gemini', 'perplexity'] as const

export type IAEngineName = (typeof IA_ENGINE_NAMES)[number]

/** Nombre de moteurs interrogés — à utiliser partout plutôt qu'un littéral. */
export const ENGINE_COUNT = IA_ENGINE_NAMES.length

export interface IASource {
  url: string
  title: string | null
  domain: string
}

export interface IAResponse {
  engine: IAEngineName
  prompt: string
  answer: string
  sources: IASource[]
  /** true si les sources sont absentes ou le format inattendu */
  partial_response: boolean
  tokens_input: number
  tokens_output: number
  cost_usd: number
  raw?: unknown
}

export interface IAEngine {
  readonly name: IAEngineName
  query(prompt: string): Promise<IAResponse>
}
