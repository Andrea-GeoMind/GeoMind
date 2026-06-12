import { describe, it, expect } from 'vitest'
import { computeIssuesScore, type ScorableIssue } from '@/lib/analysis/scoring'
import { selectPagesForAnalysis } from '@/lib/analysis/page-selection'
import {
  completeTechnicalOpportunities,
  completeContentOpportunities,
  MIN_OPPORTUNITIES,
} from '@/lib/analysis/opportunities'
import { SEVERITY_PENALTIES, penaltyForSeverity, isQuickWin } from '@/lib/analysis/geo-rules'

// ─── Sévérités (§18.3) ────────────────────────────────────────────────────────

describe('SEVERITY_PENALTIES', () => {
  it('major 12 / moderate 6 / minor 3 / opportunity 0', () => {
    expect(SEVERITY_PENALTIES.major).toBe(12)
    expect(SEVERITY_PENALTIES.moderate).toBe(6)
    expect(SEVERITY_PENALTIES.minor).toBe(3)
    expect(SEVERITY_PENALTIES.opportunity).toBe(0)
    expect(penaltyForSeverity('major')).toBe(12)
  })
})

describe('isQuickWin', () => {
  it('effort 1 + impact ≥ 2 = quick win', () => {
    expect(isQuickWin({ effort: 1, impact: 2, severity: 'minor' })).toBe(true)
    expect(isQuickWin({ effort: 1, impact: 3, severity: 'major' })).toBe(true)
  })

  it("une opportunité n'est jamais un quick win", () => {
    expect(isQuickWin({ effort: 1, impact: 3, severity: 'opportunity' })).toBe(false)
  })

  it('effort 2 ou impact 1 = pas un quick win', () => {
    expect(isQuickWin({ effort: 2, impact: 3, severity: 'minor' })).toBe(false)
    expect(isQuickWin({ effort: 1, impact: 1, severity: 'minor' })).toBe(false)
  })
})

// ─── computeIssuesScore (§18.3) ───────────────────────────────────────────────

function issue(partial: Partial<ScorableIssue> & { ruleKey: string }): ScorableIssue {
  return { category: 'structure', penalty: 6, pageUrl: null, ...partial }
}

describe('computeIssuesScore', () => {
  it('aucune issue → 100', () => {
    expect(computeIssuesScore([], 1)).toBe(100)
  })

  it('les opportunités (pénalité 0) ne pèsent pas', () => {
    expect(computeIssuesScore([issue({ ruleKey: 'opp', penalty: 0 })], 1)).toBe(100)
  })

  it('issues site : pénalité pleine', () => {
    const issues = [
      issue({ ruleKey: 'a', penalty: 12 }),
      issue({ ruleKey: 'b', penalty: 6, category: 'schema_org' }),
    ]
    expect(computeIssuesScore(issues, 1)).toBe(100 - 12 - 6)
  })

  it('issues page : proportionnelles au ratio de pages affectées', () => {
    // règle 12 pts sur 5 pages dont 1 affectée → ceil(12 × 1/5) = 3
    const issues = [issue({ ruleKey: 'r', penalty: 12, pageUrl: 'https://a.fr/x' })]
    expect(computeIssuesScore(issues, 5)).toBe(100 - 3)
  })

  it('issues page : toutes les pages affectées = pénalité pleine', () => {
    const issues = [1, 2, 3].map((n) =>
      issue({ ruleKey: 'r', penalty: 12, pageUrl: `https://a.fr/${n}` })
    )
    expect(computeIssuesScore(issues, 3)).toBe(100 - 12)
  })

  it('plafond de 30 points par catégorie', () => {
    const issues = [
      issue({ ruleKey: 'a', penalty: 12 }),
      issue({ ruleKey: 'b', penalty: 12 }),
      issue({ ruleKey: 'c', penalty: 12 }),
      issue({ ruleKey: 'd', penalty: 12 }),
    ] // 48 points dans une seule catégorie → plafonné à 30
    expect(computeIssuesScore(issues, 1)).toBe(70)
  })

  it('le plafond est par catégorie, pas global', () => {
    const issues = [
      ...['a', 'b', 'c', 'd'].map((k) => issue({ ruleKey: k, penalty: 12, category: 'structure' })),
      ...['e', 'f', 'g', 'h'].map((k) => issue({ ruleKey: k, penalty: 12, category: 'schema_org' })),
    ]
    expect(computeIssuesScore(issues, 1)).toBe(100 - 30 - 30)
  })

  it('déterministe : mêmes inputs → même score', () => {
    const issues = [
      issue({ ruleKey: 'a', penalty: 6 }),
      issue({ ruleKey: 'b', penalty: 12, pageUrl: 'https://a.fr/x' }),
    ]
    expect(computeIssuesScore(issues, 4)).toBe(computeIssuesScore(issues, 4))
  })

  it('jamais négatif', () => {
    const issues = Array.from({ length: 20 }, (_, i) =>
      issue({ ruleKey: `r${i}`, penalty: 12, category: `cat${i}` })
    )
    expect(computeIssuesScore(issues, 1)).toBe(0)
  })
})

// ─── selectPagesForAnalysis (§18.2) ───────────────────────────────────────────

const page = (url: string, len = 100) => ({ url, markdown: 'x'.repeat(len) })

describe('selectPagesForAnalysis', () => {
  it('limite 0 (plan Gratuit) → aucune page', () => {
    expect(selectPagesForAnalysis([page('https://a.fr/')], 0)).toEqual([])
  })

  it("la page d'accueil est toujours incluse en premier", () => {
    const pages = [page('https://a.fr/blog/post'), page('https://a.fr/'), page('https://a.fr/tarifs')]
    const selected = selectPagesForAnalysis(pages, 2)
    expect(selected[0].url).toBe('https://a.fr/')
  })

  it('respecte la limite', () => {
    const pages = Array.from({ length: 20 }, (_, i) => page(`https://a.fr/p${i}`))
    expect(selectPagesForAnalysis(pages, 5)).toHaveLength(5)
  })

  it('déterministe : mêmes pages → même sélection', () => {
    const pages = [
      page('https://a.fr/'),
      page('https://a.fr/blog/a', 500),
      page('https://a.fr/blog/b', 300),
      page('https://a.fr/services/x', 400),
    ]
    const s1 = selectPagesForAnalysis(pages, 3).map((p) => p.url)
    const s2 = selectPagesForAnalysis([...pages].reverse(), 3).map((p) => p.url)
    expect(s1).toEqual(s2)
  })

  it('diversité : round-robin entre les sections du site', () => {
    const pages = [
      page('https://a.fr/'),
      page('https://a.fr/blog/a', 900),
      page('https://a.fr/blog/b', 800),
      page('https://a.fr/blog/c', 700),
      page('https://a.fr/services/x', 100),
    ]
    const selected = selectPagesForAnalysis(pages, 3).map((p) => p.url)
    // accueil + 1 blog + 1 services (pas 2 blogs avant la section services)
    expect(selected).toContain('https://a.fr/services/x')
  })

  it('dédoublonne les variantes trailing-slash', () => {
    const pages = [page('https://a.fr/tarifs'), page('https://a.fr/tarifs/')]
    expect(selectPagesForAnalysis(pages, 5)).toHaveLength(1)
  })
})

// ─── Opportunités (§18.6) ─────────────────────────────────────────────────────

describe('completeTechnicalOpportunities', () => {
  it('site parfait (0 issue) → au moins MIN_OPPORTUNITIES opportunités', () => {
    const opportunities = completeTechnicalOpportunities([])
    expect(opportunities.length).toBeGreaterThanOrEqual(MIN_OPPORTUNITIES)
    expect(opportunities.every((o) => o.severity === 'opportunity')).toBe(true)
  })

  it("l'émetteur conditionnel llms-full ne s'active que si llms.txt passe", () => {
    const withIssue = completeTechnicalOpportunities([
      {
        ruleKey: 'llms_txt_missing',
        category: 'accessibility',
        title: 'x',
        description: 'x',
        sampleUrls: [],
        severity: 'minor',
        effort: 1,
        impact: 2,
      },
    ])
    expect(withIssue.some((o) => o.ruleKey === 'opportunity_llms_full_txt')).toBe(false)

    const withoutIssue = completeTechnicalOpportunities([])
    expect(withoutIssue.some((o) => o.ruleKey === 'opportunity_llms_full_txt')).toBe(true)
  })
})

describe('completeContentOpportunities', () => {
  it('site parfait → au moins MIN_OPPORTUNITIES opportunités', () => {
    const opportunities = completeContentOpportunities([])
    expect(opportunities.length).toBeGreaterThanOrEqual(MIN_OPPORTUNITIES)
  })

  it('jamais de doublon avec une opportunité déjà détectée', () => {
    const opportunities = completeContentOpportunities([])
    const keys = opportunities.map((o) => o.ruleKey)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
