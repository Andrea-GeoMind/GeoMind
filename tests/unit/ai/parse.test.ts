import { describe, it, expect } from 'vitest'
import {
  extractDomain,
  parseOpenRouterAnnotations,
  parsePerplexityCitations,
  parseMarkdownLinks,
  extractAnswerText,
  extractTokenUsage,
  parseSources,
} from '@/lib/ai/parse'

// ─── extractDomain ─────────────────────────────────────────────────────────────

describe('extractDomain', () => {
  it('extrait le domaine sans www', () => {
    expect(extractDomain('https://www.example.com/path')).toBe('example.com')
  })

  it('extrait le domaine avec sous-domaine non www', () => {
    expect(extractDomain('https://blog.example.com/article')).toBe('blog.example.com')
  })

  it('retourne l url brute si invalide', () => {
    expect(extractDomain('not-a-url')).toBe('not-a-url')
  })
})

// ─── parseOpenRouterAnnotations ────────────────────────────────────────────────

describe('parseOpenRouterAnnotations', () => {
  it('parse les annotations url_citation correctement', () => {
    const raw = {
      choices: [
        {
          message: {
            content: 'La réponse',
            annotations: [
              {
                type: 'url_citation',
                url_citation: {
                  url: 'https://example.com/page',
                  title: 'Example Page',
                  start_index: 0,
                  end_index: 5,
                },
              },
            ],
          },
        },
      ],
    }
    const sources = parseOpenRouterAnnotations(raw)
    expect(sources).toHaveLength(1)
    expect(sources[0]).toMatchObject({
      url: 'https://example.com/page',
      title: 'Example Page',
      domain: 'example.com',
    })
  })

  it('ignore les annotations non url_citation', () => {
    const raw = {
      choices: [
        {
          message: {
            content: 'texte',
            annotations: [{ type: 'other_type', data: {} }],
          },
        },
      ],
    }
    expect(parseOpenRouterAnnotations(raw)).toHaveLength(0)
  })

  it('retourne tableau vide si pas d annotations', () => {
    const raw = {
      choices: [{ message: { content: 'texte' } }],
    }
    expect(parseOpenRouterAnnotations(raw)).toHaveLength(0)
  })

  it('retourne tableau vide sur entrée invalide', () => {
    expect(parseOpenRouterAnnotations(null)).toHaveLength(0)
    expect(parseOpenRouterAnnotations(undefined)).toHaveLength(0)
    expect(parseOpenRouterAnnotations({})).toHaveLength(0)
  })
})

// ─── parsePerplexityCitations ─────────────────────────────────────────────────

describe('parsePerplexityCitations', () => {
  it('parse le tableau citations', () => {
    const raw = {
      choices: [{ message: { content: 'réponse' } }],
      citations: ['https://source1.com', 'https://source2.fr/article'],
    }
    const sources = parsePerplexityCitations(raw)
    expect(sources).toHaveLength(2)
    expect(sources[0]).toMatchObject({ url: 'https://source1.com', domain: 'source1.com' })
    expect(sources[1].domain).toBe('source2.fr')
  })

  it('retourne tableau vide si pas de citations', () => {
    expect(parsePerplexityCitations({ choices: [] })).toHaveLength(0)
  })

  it('ignore les entrées non-string dans citations', () => {
    const raw = { citations: ['https://ok.com', 42, null, 'https://ok2.com'] }
    const sources = parsePerplexityCitations(raw)
    expect(sources).toHaveLength(2)
  })
})

// ─── parseMarkdownLinks ───────────────────────────────────────────────────────

describe('parseMarkdownLinks', () => {
  it('extrait les liens markdown', () => {
    const text = 'Voir [Wikipedia](https://fr.wikipedia.org/wiki/Test) et [MDN](https://developer.mozilla.org).'
    const sources = parseMarkdownLinks(text)
    expect(sources).toHaveLength(2)
    expect(sources[0]).toMatchObject({ url: 'https://fr.wikipedia.org/wiki/Test', title: 'Wikipedia' })
    expect(sources[1].domain).toBe('developer.mozilla.org')
  })

  it('extrait les URLs nues', () => {
    const text = 'Consulter https://example.com/article pour plus d info.'
    const sources = parseMarkdownLinks(text)
    expect(sources).toHaveLength(1)
    expect(sources[0].url).toBe('https://example.com/article')
    expect(sources[0].title).toBeNull()
  })

  it('déduplique les URLs', () => {
    const text = '[Lien](https://example.com) et encore https://example.com ici'
    const sources = parseMarkdownLinks(text)
    expect(sources).toHaveLength(1)
  })

  it('retourne tableau vide sur texte sans lien', () => {
    expect(parseMarkdownLinks('Texte sans URL')).toHaveLength(0)
  })
})

// ─── extractAnswerText ────────────────────────────────────────────────────────

describe('extractAnswerText', () => {
  it('extrait le texte du premier choix', () => {
    const raw = { choices: [{ message: { content: 'Réponse de l IA' } }] }
    expect(extractAnswerText(raw)).toBe('Réponse de l IA')
  })

  it('retourne chaîne vide si structure invalide', () => {
    expect(extractAnswerText({})).toBe('')
    expect(extractAnswerText(null)).toBe('')
    expect(extractAnswerText({ choices: [] })).toBe('')
  })
})

// ─── extractTokenUsage ────────────────────────────────────────────────────────

describe('extractTokenUsage', () => {
  it('extrait les tokens depuis usage', () => {
    const raw = { usage: { prompt_tokens: 150, completion_tokens: 300 } }
    expect(extractTokenUsage(raw)).toEqual({ input: 150, output: 300 })
  })

  it('retourne zéros si usage absent', () => {
    expect(extractTokenUsage({})).toEqual({ input: 0, output: 0 })
  })
})

// ─── parseSources (intégration) ───────────────────────────────────────────────

describe('parseSources', () => {
  it('perplexity : utilise le parser citations', () => {
    const raw = {
      choices: [{ message: { content: 'texte' } }],
      citations: ['https://source.com'],
    }
    const result = parseSources(raw, 'perplexity')
    expect(result.sources).toHaveLength(1)
    expect(result.partial_response).toBe(false)
  })

  it('chatgpt : utilise les annotations OpenRouter', () => {
    const raw = {
      choices: [
        {
          message: {
            content: 'texte',
            annotations: [
              { type: 'url_citation', url_citation: { url: 'https://ref.com', title: 'Ref' } },
            ],
          },
        },
      ],
    }
    const result = parseSources(raw, 'chatgpt')
    expect(result.sources).toHaveLength(1)
    expect(result.partial_response).toBe(false)
  })

  it('retourne partial_response=true si aucune source', () => {
    const raw = { choices: [{ message: { content: 'texte sans URL' } }] }
    const result = parseSources(raw, 'chatgpt')
    expect(result.partial_response).toBe(true)
    expect(result.sources).toHaveLength(0)
  })

  it('fallback sur markdown links si pas d annotations', () => {
    const raw = {
      choices: [
        {
          message: {
            content: 'Voir [Wikipedia](https://fr.wikipedia.org) pour plus de détails.',
          },
        },
      ],
    }
    const result = parseSources(raw, 'gemini')
    expect(result.sources).toHaveLength(1)
    expect(result.partial_response).toBe(false)
  })
})
