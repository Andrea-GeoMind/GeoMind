import { describe, it, expect } from 'vitest'
import { buildCoachSystemPrompt, type CoachContext } from '@/lib/ai/prompts/coach'

const baseCtx: CoachContext = {
  siteName: 'Cabinet Durand',
  siteUrl: 'https://cabinet-durand.fr',
  siteDescription: 'Cabinet de conseil en gestion patrimoniale',
  globalScore: 42,
  authorityScore: 15,
  technicalScore: 75,
  contentScore: 55,
  topTechnicalIssues: [
    { title: 'Balise title absente', penalty: 15 },
    { title: 'Schema.org Organization manquant', penalty: 10 },
  ],
  topContentIssues: [
    { title: 'Contenu trop court sur les pages clés', penalty: 20 },
  ],
  priorityPillar: 'authority',
}

describe('buildCoachSystemPrompt', () => {
  it('contient le nom et l\'URL du site', () => {
    const prompt = buildCoachSystemPrompt(baseCtx)
    expect(prompt).toContain('Cabinet Durand')
    expect(prompt).toContain('https://cabinet-durand.fr')
  })

  it('contient les 4 scores avec labels de maturité', () => {
    const prompt = buildCoachSystemPrompt(baseCtx)
    expect(prompt).toContain('42/100')
    expect(prompt).toContain('15/100')
    expect(prompt).toContain('75/100')
    expect(prompt).toContain('55/100')
    expect(prompt).toContain('En progression')
    expect(prompt).toContain('Débutant')
    expect(prompt).toContain('Avancé')
  })

  it('contient les issues techniques', () => {
    const prompt = buildCoachSystemPrompt(baseCtx)
    expect(prompt).toContain('Balise title absente')
    expect(prompt).toContain('-15 pts')
  })

  it('contient les issues contenu', () => {
    const prompt = buildCoachSystemPrompt(baseCtx)
    expect(prompt).toContain('Contenu trop court sur les pages clés')
    expect(prompt).toContain('-20 pts')
  })

  it('mentionne le pilier prioritaire', () => {
    const prompt = buildCoachSystemPrompt(baseCtx)
    expect(prompt).toContain('Autorité IA')
  })

  it('contient les règles de comportement en français', () => {
    const prompt = buildCoachSystemPrompt(baseCtx)
    expect(prompt).toContain('TOUJOURS en français')
  })

  it('gère le cas sans analyse (tous scores null)', () => {
    const ctxNoAnalysis: CoachContext = {
      ...baseCtx,
      globalScore: null,
      authorityScore: null,
      technicalScore: null,
      contentScore: null,
      topTechnicalIssues: [],
      topContentIssues: [],
      priorityPillar: null,
    }
    const prompt = buildCoachSystemPrompt(ctxNoAnalysis)
    expect(prompt).toContain('Aucune analyse disponible')
    expect(prompt).not.toContain('null')
  })

  it('n\'inclut pas de section issues si aucune issue', () => {
    const ctxNoIssues: CoachContext = { ...baseCtx, topTechnicalIssues: [], topContentIssues: [] }
    const prompt = buildCoachSystemPrompt(ctxNoIssues)
    expect(prompt).not.toContain('Principaux problèmes techniques')
    expect(prompt).not.toContain('Principaux problèmes de contenu')
  })
})
