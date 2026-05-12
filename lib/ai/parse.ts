import type { IASource } from '@/lib/ai/connectors/base'

// ─── Utilitaire domaine ────────────────────────────────────────────────────────

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

// ─── Parsers par format ────────────────────────────────────────────────────────

/**
 * Format OpenAI / OpenRouter : annotations url_citation dans le message.
 * Utilisé par ChatGPT search-preview et Claude web_search via OpenRouter.
 */
export function parseOpenRouterAnnotations(raw: unknown): IASource[] {
  if (!raw || typeof raw !== 'object') return []
  const r = raw as Record<string, unknown>
  const choices = r['choices']
  if (!Array.isArray(choices) || choices.length === 0) return []

  const message = (choices[0] as Record<string, unknown>)['message']
  if (!message || typeof message !== 'object') return []

  const annotations = (message as Record<string, unknown>)['annotations']
  if (!Array.isArray(annotations)) return []

  const sources: IASource[] = []
  for (const annotation of annotations) {
    if (!annotation || typeof annotation !== 'object') continue
    const a = annotation as Record<string, unknown>
    if (a['type'] !== 'url_citation') continue
    const citation = a['url_citation'] as Record<string, unknown> | undefined
    if (!citation?.['url'] || typeof citation['url'] !== 'string') continue
    sources.push({
      url: citation['url'],
      title: typeof citation['title'] === 'string' ? citation['title'] : null,
      domain: extractDomain(citation['url']),
    })
  }
  return sources
}

/**
 * Format Perplexity : tableau `citations` à la racine de la réponse.
 */
export function parsePerplexityCitations(raw: unknown): IASource[] {
  if (!raw || typeof raw !== 'object') return []
  const r = raw as Record<string, unknown>
  const citations = r['citations']
  if (!Array.isArray(citations)) return []

  return citations.flatMap((c) => {
    if (typeof c !== 'string') return []
    return [{ url: c, title: null, domain: extractDomain(c) }]
  })
}

/**
 * Fallback : extrait les URLs des liens Markdown [title](url) et des URLs nues
 * dans le texte de la réponse.
 */
export function parseMarkdownLinks(text: string): IASource[] {
  const sources: IASource[] = []
  const seen = new Set<string>()

  // Liens Markdown [title](url)
  const mdLinkRe = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g
  let m: RegExpExecArray | null
  while ((m = mdLinkRe.exec(text)) !== null) {
    const url = m[2]
    if (!seen.has(url)) {
      seen.add(url)
      sources.push({ url, title: m[1], domain: extractDomain(url) })
    }
  }

  // URLs nues (non déjà capturées)
  const urlRe = /https?:\/\/[^\s"'<>)]+/g
  while ((m = urlRe.exec(text)) !== null) {
    const url = m[0].replace(/[.,;:!?]+$/, '')
    if (!seen.has(url)) {
      seen.add(url)
      sources.push({ url, title: null, domain: extractDomain(url) })
    }
  }

  return sources
}

// ─── Extracteur de texte de réponse ───────────────────────────────────────────

export function extractAnswerText(raw: unknown): string {
  if (!raw || typeof raw !== 'object') return ''
  const r = raw as Record<string, unknown>
  const choices = r['choices']
  if (!Array.isArray(choices) || choices.length === 0) return ''
  const message = (choices[0] as Record<string, unknown>)['message']
  if (!message || typeof message !== 'object') return ''
  const content = (message as Record<string, unknown>)['content']
  return typeof content === 'string' ? content : ''
}

// ─── Extracteur de tokens ─────────────────────────────────────────────────────

export function extractTokenUsage(raw: unknown): { input: number; output: number } {
  if (!raw || typeof raw !== 'object') return { input: 0, output: 0 }
  const r = raw as Record<string, unknown>
  const usage = r['usage']
  if (!usage || typeof usage !== 'object') return { input: 0, output: 0 }
  const u = usage as Record<string, unknown>
  return {
    input: typeof u['prompt_tokens'] === 'number' ? u['prompt_tokens'] : 0,
    output: typeof u['completion_tokens'] === 'number' ? u['completion_tokens'] : 0,
  }
}

// ─── Parseur principal ─────────────────────────────────────────────────────────

export type ParseEngine = 'chatgpt' | 'claude' | 'gemini' | 'perplexity'

export function parseSources(
  raw: unknown,
  engine: ParseEngine
): { sources: IASource[]; partial_response: boolean } {
  let sources: IASource[] = []

  if (engine === 'perplexity') {
    sources = parsePerplexityCitations(raw)
  } else {
    // ChatGPT, Claude, Gemini via OpenRouter
    sources = parseOpenRouterAnnotations(raw)
  }

  // Fallback : extraire les liens depuis le texte si aucune source structurée
  if (sources.length === 0) {
    const text = extractAnswerText(raw)
    if (text) sources = parseMarkdownLinks(text)
  }

  return {
    sources,
    partial_response: sources.length === 0,
  }
}
