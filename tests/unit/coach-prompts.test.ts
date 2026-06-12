import { describe, it, expect } from 'vitest'
import { buildCoachSystemPrompt, type CoachContext } from '@/lib/ai/prompts/coach'
import { getSuggestions } from '@/lib/ai/coach-suggestions'

const baseCtx: CoachContext = {
  siteName: 'Cabinet Durand',
  siteUrl: 'https://cabinet-durand.fr',
  siteDescription: 'Cabinet de conseil en gestion patrimoniale',
  language: 'fr',
  keywords: ['gestion patrimoine', 'conseil financier'],
  competitors: ['concurrent-a.fr', 'concurrent-b.fr'],
  globalScore: 42,
  authorityScore: 15,
  technicalScore: 75,
  contentScore: 55,
  topIssues: [
    { title: 'Balise title absente', severity: 'moderate', category: 'metadata' },
    { title: 'Schema.org Organization manquant', severity: 'moderate', category: 'schema_org' },
  ],
  priorityPillar: 'authority',
  lastAnalysisAt: new Date('2026-06-10T10:00:00Z'),
  comparison: null,
  memorySummary: null,
  focusedIssue: null,
}

describe('buildCoachSystemPrompt (GEO v2)', () => {
  it("contient l'identité GEO et le nom du site", () => {
    const prompt = buildCoachSystemPrompt(baseCtx)
    expect(prompt).toContain('Tu es GEO')
    expect(prompt).toContain('Cabinet Durand')
    expect(prompt).toContain('https://cabinet-durand.fr')
  })

  it('contient les scores et le pilier prioritaire', () => {
    const prompt = buildCoachSystemPrompt(baseCtx)
    expect(prompt).toContain('42/100')
    expect(prompt).toContain('Autorité 15/100')
    expect(prompt).toContain('Autorité IA')
  })

  it('délimite les données du site (anti prompt-injection §16.4)', () => {
    const prompt = buildCoachSystemPrompt(baseCtx)
    expect(prompt).toContain('<donnees_site>')
    expect(prompt).toContain('</donnees_site>')
    const dataStart = prompt.indexOf('<donnees_site>')
    expect(prompt.indexOf('Cabinet Durand')).toBeGreaterThan(dataStart)
  })

  it('inclut mots-clés et concurrents', () => {
    const prompt = buildCoachSystemPrompt(baseCtx)
    expect(prompt).toContain('gestion patrimoine')
    expect(prompt).toContain('concurrent-a.fr')
  })

  it('inclut les top issues détectées', () => {
    const prompt = buildCoachSystemPrompt(baseCtx)
    expect(prompt).toContain('Balise title absente')
  })

  it("sans analyse : invite à lancer l'analyse sans inventer de scores", () => {
    const prompt = buildCoachSystemPrompt({
      ...baseCtx,
      globalScore: null,
      authorityScore: null,
      technicalScore: null,
      contentScore: null,
      topIssues: [],
      priorityPillar: null,
      lastAnalysisAt: null,
    })
    expect(prompt).toContain('Aucune analyse disponible')
    expect(prompt).not.toContain('/100 (')
  })

  it('comparaison N vs N-1 : injecte les progrès et la consigne de célébration', () => {
    const prompt = buildCoachSystemPrompt({
      ...baseCtx,
      comparison: {
        resolvedIssueTitles: ['Fichier llms.txt absent'],
        newIssueTitles: [],
        globalDelta: 12,
        technicalDelta: 17,
        contentDelta: 5,
        authorityDelta: 8,
        methodologyChanged: false,
      },
    })
    expect(prompt).toContain('Fichier llms.txt absent')
    expect(prompt).toContain('+12')
    expect(prompt).toContain('célébrant les progrès')
  })

  it('méthodologie changée : avertit GEO de relativiser les deltas', () => {
    const prompt = buildCoachSystemPrompt({
      ...baseCtx,
      comparison: {
        resolvedIssueTitles: [],
        newIssueTitles: ['Canonical absente'],
        globalDelta: -8,
        technicalDelta: -10,
        contentDelta: -5,
        authorityDelta: 0,
        methodologyChanged: true,
      },
    })
    expect(prompt).toContain('méthodologie')
  })

  it('mémoire : injectée quand présente', () => {
    const prompt = buildCoachSystemPrompt({
      ...baseCtx,
      memorySummary: 'Problèmes abordés : canonical. Préférences : utilise WordPress.',
    })
    expect(prompt).toContain('utilise WordPress')
  })

  it('issue focalisée (« Demander à GEO ») : démarre directement dessus', () => {
    const prompt = buildCoachSystemPrompt({
      ...baseCtx,
      focusedIssue: {
        title: 'Fichier llms.txt absent',
        description: 'Votre site n’a pas de fichier llms.txt.',
      },
    })
    expect(prompt).toContain('Demander à GEO')
    expect(prompt).toContain('Fichier llms.txt absent')
    expect(prompt).toContain('Démarre DIRECTEMENT')
  })

  it('contient les règles de comportement strictes', () => {
    const prompt = buildCoachSystemPrompt(baseCtx)
    expect(prompt).toContain('HORS-SUJET')
    expect(prompt).toContain("JAMAIS D'INVENTION")
    expect(prompt).toContain('400 crédits')
  })
})

describe('getSuggestions (§16.6)', () => {
  const withIssues = { hasAnalysis: true, globalScore: 35, issueCount: 6, cited: false }

  it('max 3 chips, jamais vide', () => {
    const pages = ['overview', 'technical', 'content', 'authority', 'publishers', 'coach', 'floating'] as const
    for (const page of pages) {
      const chips = getSuggestions(page, withIssues)
      expect(chips.length).toBeGreaterThan(0)
      expect(chips.length).toBeLessThanOrEqual(3)
    }
  })

  it('pas encore d\'analyse → chips pédagogiques', () => {
    const chips = getSuggestions('overview', {
      hasAnalysis: false,
      globalScore: null,
      issueCount: 0,
      cited: null,
    })
    expect(chips).toContain("Comment fonctionne l'analyse ?")
  })

  it('onglet technique avec issues → chips orientées action', () => {
    const chips = getSuggestions('technical', withIssues)
    expect(chips).toContain('Par quoi je commence ?')
  })

  it('autorité jamais cité → chips dédiées', () => {
    const chips = getSuggestions('authority', withIssues)
    expect(chips).toContain('Pourquoi les IA ne me citent pas ?')
  })

  it('score élevé → chips de progression', () => {
    const chips = getSuggestions('overview', {
      hasAnalysis: true,
      globalScore: 75,
      issueCount: 0,
      cited: true,
    })
    expect(chips).toContain('Comment passer au niveau supérieur ?')
  })
})
