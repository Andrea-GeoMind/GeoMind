// Interface commune pour les 4 moteurs IA interrogés lors d'une analyse GEO.

export type IAEngineName = 'chatgpt' | 'claude' | 'gemini' | 'perplexity'

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
