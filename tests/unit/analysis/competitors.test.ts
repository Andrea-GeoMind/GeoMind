import { describe, it, expect } from 'vitest'
import { normalizeDomain, analyzeCompetitors } from '@/lib/analysis/competitors'
import type { AuthorityResultRow } from '@/lib/analysis/authority-table'
import type { IAEngineName } from '@/lib/ai/connectors/base'

describe('normalizeDomain', () => {
  it('réduit à un domaine canonique', () => {
    expect(normalizeDomain('https://www.Exemple.fr/page?x=1')).toBe('exemple.fr')
    expect(normalizeDomain('EXEMPLE.FR')).toBe('exemple.fr')
    expect(normalizeDomain('http://sous.exemple.fr/')).toBe('sous.exemple.fr')
  })
})

// Helper de fabrication d'une réponse d'autorité
function row(
  engine: IAEngineName,
  domains: string[],
  promptIsNeutral = true
): AuthorityResultRow {
  return {
    id: `${engine}-${domains.join('-')}`,
    engine,
    answer: '',
    promptIsNeutral,
    partialResponse: false,
    sources: domains.map((d, i) => ({
      id: `${d}-${i}`,
      url: `https://${d}/page`,
      title: null,
      domain: d,
      isClientDomain: d === 'monsite.fr',
    })),
    prompt: { id: 'p', text: 'q', isNeutral: promptIsNeutral },
  }
}

describe('analyzeCompetitors', () => {
  const declared = [{ url: 'https://concurrent-a.fr', name: 'Concurrent A' }]

  it('calcule la part de voix et le rang du client', () => {
    const results = [
      row('chatgpt', ['concurrent-a.fr', 'monsite.fr']),
      row('claude', ['concurrent-a.fr', 'autre.fr']),
      row('gemini', ['concurrent-a.fr']),
      row('perplexity', ['monsite.fr']),
    ]
    const a = analyzeCompetitors(results, 'https://monsite.fr', declared)

    expect(a.totalResponses).toBe(4)
    // Concurrent A cité 3 fois sur 4 → 75%
    const compA = a.standings.find((s) => s.domain === 'concurrent-a.fr')!
    expect(compA.shareOfVoice).toBe(75)
    expect(compA.kind).toBe('declared')
    // Client cité 2 fois → 50%, rang 2
    expect(a.clientStanding?.shareOfVoice).toBe(50)
    expect(a.clientRank).toBe(2)
  })

  it('inclut toujours le client et les concurrents déclarés même non cités', () => {
    const results = [row('chatgpt', ['autre.fr'])]
    const a = analyzeCompetitors(results, 'https://monsite.fr', declared)
    expect(a.standings.some((s) => s.kind === 'client')).toBe(true)
    expect(a.standings.some((s) => s.domain === 'concurrent-a.fr')).toBe(true)
    expect(a.clientRank).toBeNull() // jamais cité
    expect(a.clientStanding?.shareOfVoice).toBe(0)
  })

  it('remonte les domaines découverts triés par citations', () => {
    const results = [
      row('chatgpt', ['decouvert-x.fr']),
      row('claude', ['decouvert-x.fr']),
      row('gemini', ['decouvert-y.fr']),
    ]
    const a = analyzeCompetitors(results, 'https://monsite.fr', [])
    const x = a.standings.find((s) => s.domain === 'decouvert-x.fr')!
    const y = a.standings.find((s) => s.domain === 'decouvert-y.fr')!
    expect(x.kind).toBe('discovered')
    expect(x.citedResponses).toBe(2)
    expect(y.citedResponses).toBe(1)
    // x avant y dans le classement
    expect(a.standings.indexOf(x)).toBeLessThan(a.standings.indexOf(y))
  })

  it('ne compte qu’une citation par réponse même si le domaine apparaît plusieurs fois', () => {
    const results = [row('chatgpt', ['concurrent-a.fr', 'concurrent-a.fr'])]
    const a = analyzeCompetitors(results, 'https://monsite.fr', declared)
    expect(a.standings.find((s) => s.domain === 'concurrent-a.fr')!.citedResponses).toBe(1)
  })

  it('ignore les réponses sur prompts non neutres', () => {
    const results = [
      row('chatgpt', ['concurrent-a.fr'], true),
      row('claude', ['concurrent-a.fr'], false), // ignorée
    ]
    const a = analyzeCompetitors(results, 'https://monsite.fr', declared)
    expect(a.totalResponses).toBe(1)
  })
})
