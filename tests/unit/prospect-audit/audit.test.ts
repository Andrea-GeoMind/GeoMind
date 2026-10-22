import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/env', () => ({ env: { OPENROUTER_API_KEY: 'sk-or-test', FIRECRAWL_API_KEY: 'fc-test' } }))
// Les règles du site ont leurs propres tests ; ici, seules leur absence et leur branchement comptent.
vi.mock('@/lib/analysis/technical', () => ({ evaluateTechnicalRules: vi.fn() }))
vi.mock('@/lib/analysis/content', () => ({ evaluateContentRules: vi.fn() }))
vi.mock('@/lib/crawl/page-probe', () => ({ probePages: vi.fn() }))

import type { IAEngine, IAResponse } from '@/lib/ai/connectors/base'
import { arrondissementOrdinal, buildProspectQuestions } from '@/lib/ai/prompts/prospect-audit'
import { isPromptNeutral } from '@/lib/analysis/neutrality'
import { AuditBudget, BudgetExceededError } from '@/lib/prospect-audit/budget'
import { activityForSector } from '@/lib/prospect-audit/activity'
import { choosePagesToRead } from '@/lib/prospect-audit/crawl'
import {
  aiIssues,
  computePlaceScore,
  computeProspectScores,
  placeIssues,
  placeScoreBreakdown,
  ruleIssues,
  sortIssues,
} from '@/lib/prospect-audit/issues'
import { runProspectAudit, AuditAbortedError } from '@/lib/prospect-audit/run'
import { buildSynthesisSchema } from '@/lib/prospect-audit/synthesis'
import { generateAuditToken, hashAuditToken, isAuditExpired, isWellFormedAuditToken } from '@/lib/prospect-audit/token'
import { comparisonRows, groupIssues, issueCountLabel } from '@/lib/prospect-audit/view'
import type { AnswerCell, ProspectEngine, ProspectInput } from '@/lib/prospect-audit/types'

const BARBER: ProspectInput = {
  placeId: 'p1',
  name: 'Best barber',
  address: '98 Montée de la Grande-Côte, 69001 Lyon',
  rating: 5,
  reviewCount: 17,
  photoCount: 4,
  hasHours: true,
  website: null,
  listing: null,
  activity: 'barbier',
  arrondissement: 'Lyon 1er',
  sectorMedianReviews: 710,
  placesCollectedAt: '2026-10-19',
  competitor: {
    placeId: 'c1',
    name: 'Casa Barbershop Lyon',
    address: '14 Rue Romarin, 69001 Lyon',
    rating: 4.8,
    reviewCount: 961,
    photoCount: 10,
    hasHours: true,
    website: 'https://casa-barbershop-lyon.com/',
    listing: null,
    distanceM: 290,
    scope: null,
  },
}

describe('questions', () => {
  it('5 questions, une par intention, au format du ticket', () => {
    const qs = buildProspectQuestions('barbier', 'Lyon 1er')
    expect(qs.map((q) => q.intent)).toEqual(['recommandation', 'meilleur', 'prix', 'specialite', 'proximite'])
    expect(qs[0]!.text).toBe('Quel barbier me conseilles-tu à Lyon 1er ?')
    expect(qs[4]!.text).toContain('dans le 1er arrondissement de Lyon')
  })

  it('accorde au féminin', () => {
    const qs = buildProspectQuestions('salle de sport', 'Lyon 2e')
    expect(qs[1]!.text).toBe('Quelle est la meilleure salle de sport de Lyon 2e ?')
    expect(qs[4]!.text).toMatch(/laquelle choisir/)
  })

  it('ne nomme jamais le commerce (règle §6)', () => {
    for (const q of buildProspectQuestions('coach sportif', 'Lyon 1er')) {
      expect(isPromptNeutral(q.text, 'https://atlas-training.fr/', 'ATLAS Training')).toBe(true)
    }
  })

  it('lit l’arrondissement', () => {
    expect(arrondissementOrdinal('Lyon 1er')).toBe('1er')
    expect(arrondissementOrdinal('Villeurbanne')).toBeNull()
  })

  it('le métier d’un « fitness » dépend du nom', () => {
    expect(activityForSector('fitness', 'ATLAS Training - Coaching sportif à Lyon')).toBe('coach sportif')
    expect(activityForSector('fitness', 'Basic-Fit')).toBe('salle de sport')
  })
})

describe('problèmes déterministes', () => {
  it('fiche sans site, peu d’avis, peu de photos', () => {
    const keys = placeIssues(BARBER).map((i) => i.key)
    expect(keys).toEqual(['avis.nombre', 'photos.nombre', 'site.absent'])
    const avis = placeIssues(BARBER)[0]!
    expect(avis.title).toBe('17 avis Google seulement')
    expect(avis.detail).toBe(
      'La médiane des barbiers du 1er est de 710 ; Casa Barbershop Lyon, à 290 m, en a 961.'
    )
  })

  it('lien de plateforme = pas de site à soi ; horaires et note en retard', () => {
    const issues = placeIssues({
      ...BARBER,
      website: 'https://www.planity.com/x',
      listing: 'planity.com',
      hasHours: false,
      rating: 4.1,
      photoCount: 10,
      reviewCount: 2000,
    })
    expect(issues.map((i) => i.key)).toEqual(['fiche.horaires', 'avis.note', 'site.plateforme'])
    expect(issues.find((i) => i.key === 'site.plateforme')!.detail).toContain('Planity')
  })

  it('une règle de page sur plusieurs pages ne compte qu’une fois', () => {
    const out = ruleIssues(
      'technique',
      [
        { ruleKey: 'canonical_missing', title: 'URL canonique manquante', description: 'Une phrase. Une autre.', pageUrl: 'a' },
        { ruleKey: 'canonical_missing', title: 'URL canonique manquante', description: 'Une phrase.', pageUrl: 'b' },
        { ruleKey: 'llms_txt', title: 'Fichier llms.txt absent', description: 'Rien.', pageUrl: null },
      ],
      5
    )
    expect(out).toHaveLength(2)
    expect(out[0]!.title).toBe('URL canonique manquante (2 pages sur 5)')
    expect(out[0]!.detail).toBe('Une phrase.')
  })

  it('absence dans les IA, par moteur, réponses échouées exclues', () => {
    const cell = (engine: ProspectEngine, cited: boolean, status: 'ok' | 'failed' = 'ok'): AnswerCell => ({
      question: 0, engine, status, cited, position: null, competitors: [],
    })
    const issues = aiIssues([
      cell('chatgpt', false), cell('chatgpt', false),
      cell('gemini', true), cell('gemini', false),
      cell('claude', true), cell('claude', false, 'failed'),
    ])
    expect(issues.map((i) => [i.key, i.title])).toEqual([
      ['ia.chatgpt', 'Absent des réponses de ChatGPT'],
      ['ia.gemini', 'Absent de 1 réponses sur 2 de Gemini'],
    ])
  })

  it('tri par catégorie de la page', () => {
    const sorted = sortIssues([
      { key: 'ia.x', category: 'ia', title: 't', detail: '' },
      { key: 'site.x', category: 'site', title: 't', detail: '' },
      { key: 'avis.x', category: 'avis', title: 't', detail: '' },
    ])
    expect(sorted.map((i) => i.category)).toEqual(['avis', 'site', 'ia'])
    expect(groupIssues(sorted).map((g) => g.label)).toEqual(['Avis', 'Site web', 'Présence dans les IA'])
    expect(issueCountLabel(3)).toBe('3 problèmes détectés sur votre présence en ligne')
  })
})

describe('notes', () => {
  const cells = (cited: number, total: number): AnswerCell[] =>
    Array.from({ length: total }, (_, i) => ({
      question: i, engine: 'chatgpt', status: 'ok', cited: i < cited, position: null, competitors: [],
    }))
  const WITH_SITE = { ...BARBER, website: 'https://best-barber.fr/' }

  it('note Fiche Google : barème détaillé (Best barber)', () => {
    const lines = placeScoreBreakdown(BARBER)
    expect(lines.map((l) => [l.key, l.points])).toEqual([
      ['reviews', 0.7], ['photos', 8], ['hours', 15], ['site', 0], ['rating', 20],
    ])
    expect(computePlaceScore(BARBER)).toBe(44)
  })

  it('lien de plateforme : une partie des points du site ; note 4/5 = la moitié', () => {
    const lines = placeScoreBreakdown({ ...BARBER, website: 'https://www.planity.com/x', listing: 'planity.com', rating: 4 })
    expect(lines.find((l) => l.key === 'site')!.points).toBe(5)
    expect(lines.find((l) => l.key === 'rating')!.points).toBe(10)
  })

  it('sans site : pas de note globale', () => {
    expect(computeProspectScores(cells(3, 15), null, null, BARBER)).toEqual({
      global: null, authority: 20, place: 44, technical: null, content: null,
    })
  })

  it('avec site : moyenne des quatre piliers', () => {
    const place = computePlaceScore(WITH_SITE)
    expect(place).toBe(59)
    expect(computeProspectScores(cells(0, 15), 80, 70, WITH_SITE)).toEqual({
      global: Math.round((0 + 59 + 80 + 70) / 4), authority: 0, place: 59, technical: 80, content: 70,
    })
  })

  it('site illisible : moyenne des piliers mesurés', () => {
    expect(computeProspectScores(cells(0, 15), null, null, WITH_SITE)!.global).toBe(30)
  })

  it('aucune réponse : pas de note', () => {
    expect(computeProspectScores([], 80, 70, BARBER)).toBeNull()
  })
})

describe('budget', () => {
  it('refuse l’appel qui ferait dépasser le plafond, réserve comprise', () => {
    const b = new AuditBudget(0.2, 0.01)
    b.record('a', 0.17)
    expect(() => b.assertRoom('b', 0.025)).toThrow(BudgetExceededError)
    expect(() => b.assertRoom('b', 0.019)).not.toThrow()
    expect(() => b.assertRoom('rédaction', 0.01, { usesReserve: true })).not.toThrow()
  })

  it('arrête après un appel facturé au-delà du plafond', () => {
    const b = new AuditBudget(0.2, 0)
    b.record('a', 0.15)
    expect(() => b.record('b', 0.06)).toThrow(/dépassé/)
  })
})

describe('schéma de la rédaction', () => {
  const plan = [1, 2, 3, 4, 5].map((day) => ({ day, title: `Jour ${day}`, tasks: ['Je fais une chose utile'] }))
  const sol = (category: string) => ({ category, text: 'Je corrige ce point dans la prestation, concrètement.' })

  it('exige une solution par catégorie présente, ni plus ni moins', () => {
    const schema = buildSynthesisSchema(['avis', 'site', 'avis'])
    expect(schema.safeParse({ solutions: [sol('avis'), sol('site')], plan }).success).toBe(true)
    expect(schema.safeParse({ solutions: [sol('avis')], plan }).success).toBe(false)
    expect(schema.safeParse({ solutions: [sol('avis'), sol('site'), sol('ia')], plan }).success).toBe(false)
  })

  it('exige les jours 1 à 5 dans l’ordre', () => {
    const schema = buildSynthesisSchema(['avis'])
    const shuffled = [plan[1], plan[0], plan[2], plan[3], plan[4]]
    expect(schema.safeParse({ solutions: [sol('avis')], plan: shuffled }).success).toBe(false)
  })
})

describe('choix des pages lues', () => {
  it('accueil, contact, tarifs, prestations, puis les plus courtes', () => {
    const home = 'https://atlas-training.fr/'
    const pages = choosePagesToRead(
      home,
      [
        'https://atlas-training.fr/blog/article-tres-long-sur-le-sport',
        'https://atlas-training.fr/mentions-legales',
        'https://atlas-training.fr/tarifs',
        'https://atlas-training.fr/contact',
        'https://atlas-training.fr/coaching-individuel',
        'https://autre-site.fr/contact',
        'https://atlas-training.fr/sitemap.xml',
      ],
      5
    )
    expect(pages).toEqual([
      home,
      'https://atlas-training.fr/contact',
      'https://atlas-training.fr/tarifs',
      'https://atlas-training.fr/coaching-individuel',
      'https://atlas-training.fr/mentions-legales',
    ])
  })
})

describe('lien', () => {
  it('43 caractères, empreinte SHA-256, expiration', () => {
    const { token, hash } = generateAuditToken()
    expect(isWellFormedAuditToken(token)).toBe(true)
    expect(hashAuditToken(token)).toBe(hash)
    expect(isWellFormedAuditToken('../../etc')).toBe(false)
    expect(isAuditExpired('2026-01-01T00:00:00.000Z', new Date('2026-01-02'))).toBe(true)
    expect(isAuditExpired('2026-03-01T00:00:00.000Z', new Date('2026-01-02'))).toBe(false)
  })
})

describe('comparaison de fiche', () => {
  it('signale les retards du commerce seulement', () => {
    const rows = comparisonRows(BARBER, BARBER.competitor!)
    expect(rows.filter((r) => r.late).map((r) => r.label)).toEqual(["Nombre d'avis", 'Photos', 'Site web'])
    expect(rows.find((r) => r.label === 'Photos')!.theirs).toBe('10+')
  })
})

// ─── Orchestration, moteurs simulés ───────────────────────────────────────────

function fakeEngine(name: ProspectEngine, answer: (prompt: string) => string, cost = 0.01): IAEngine {
  return {
    name,
    query: vi.fn(async (prompt: string): Promise<IAResponse> => ({
      engine: name,
      prompt,
      answer: answer(prompt),
      sources: [],
      partial_response: false,
      tokens_input: 1,
      tokens_output: 1,
      cost_usd: cost,
    })),
  }
}

const synthesize = vi.fn(async ({ issues }: { issues: { category: string }[] }) => ({
  solutions: [...new Set(issues.map((i) => i.category))].map((category) => ({
    category: category as 'avis',
    text: 'Je corrige ce point dans la prestation, concrètement.',
  })),
  plan: [1, 2, 3, 4, 5].map((day) => ({ day, title: `Jour ${day}`, tasks: ['Je fais une chose utile'] })),
  costUsd: 0.005,
}))

describe('runProspectAudit', () => {
  it('15 appels un par un, citations, notes, problèmes et document valide', async () => {
    const chatgpt = fakeEngine('chatgpt', () => '1. **Best Barber**\n2. **Casa Barbershop Lyon**')
    const gemini = fakeEngine('gemini', () => '1. **Casa Barbershop Lyon**\n2. **Industrie Barbers**')
    const claude = fakeEngine('claude', () => '- **Industrie Barbers**')
    const { document, budget } = await runProspectAudit(BARBER, {
      engines: { chatgpt, gemini, claude },
      pages: null,
      synthesize,
      now: new Date('2026-10-20T10:00:00Z'),
    })
    expect(chatgpt.query).toHaveBeenCalledTimes(5)
    expect(vi.mocked(chatgpt.query).mock.calls[0]![0]).toContain('IMPORTANT')
    expect(document.answers).toHaveLength(15)
    expect(document.scores).toEqual({ global: null, authority: 33, place: 44, technical: null, content: null })
    expect(document.issues.filter((i) => i.category === 'ia').map((i) => i.key)).toEqual(['ia.gemini', 'ia.claude'])
    expect(document.citedInstead[0]).toEqual({ name: 'Casa Barbershop Lyon', answers: 10 })
    expect(document.expiresAt).toBe('2026-12-19T10:00:00.000Z')
    expect(budget.spentUsd).toBeCloseTo(15 * 0.01 + 0.005, 6)
  })

  it('s’arrête avant de dépasser 0,20 $', async () => {
    const pricey = (n: ProspectEngine) => fakeEngine(n, () => 'rien', 0.03)
    await expect(
      runProspectAudit(BARBER, {
        engines: { chatgpt: pricey('chatgpt'), gemini: pricey('gemini'), claude: pricey('claude') },
        pages: null,
        synthesize,
      })
    ).rejects.toThrow(BudgetExceededError)
  })

  it('abandonne au-delà de 3 appels sans réponse', async () => {
    const broken: IAEngine = { name: 'chatgpt', query: vi.fn(async () => { throw new Error('error 400: refus') }) }
    await expect(
      runProspectAudit(BARBER, {
        engines: { chatgpt: broken, gemini: { ...broken, name: 'gemini' }, claude: { ...broken, name: 'claude' } },
        pages: null,
        synthesize,
        retryDelayMs: 0,
      })
    ).rejects.toThrow(AuditAbortedError)
  })

  it('site illisible : un problème « site inaccessible », notes du site non mesurées', async () => {
    const engine = (n: ProspectEngine) => fakeEngine(n, () => 'rien')
    const { document } = await runProspectAudit(
      { ...BARBER, website: 'https://best-barber.fr/' },
      { engines: { chatgpt: engine('chatgpt'), gemini: engine('gemini'), claude: engine('claude') }, pages: [], synthesize }
    )
    expect(document.issues.map((i) => i.key)).toContain('site.inaccessible')
    expect(document.scores.technical).toBeNull()
  })
})

describe('rédaction : aucun chiffre inventé', () => {
  it('repère les chiffres absents de la liste, accepte ceux qui y sont', async () => {
    const { inventedNumbers, buildSynthesisSchema } = await import('@/lib/prospect-audit/synthesis')
    const source = '13 avis Google seulement — la médiane est de 92 ; Crossfit des Pentes en a 95. Répond en 4.9s.'
    expect(inventedNumbers(['Vous avez 13 avis, contre 95 ; le site répond en 4,9 s.'], source)).toEqual([])
    expect(inventedNumbers(['Vos concurrents en ont 80 à 95. Visez 50 avis dans les 3 mois.'], source)).toEqual(['80', '50'])
    const plan = [1, 2, 3, 4, 5].map((day) => ({ day, title: `Jour ${day}`, tasks: ['Je fais une chose utile'] }))
    const schema = buildSynthesisSchema(['avis'], source)
    expect(schema.safeParse({ solutions: [{ category: 'avis', text: 'Je vous aide à viser 50 avis dans les mois qui viennent.' }], plan }).success).toBe(false)
    expect(schema.safeParse({ solutions: [{ category: 'avis', text: 'Vous avez 13 avis : je mets en place un QR code au comptoir.' }], plan }).success).toBe(true)
  })
})

describe('rédaction : première personne, aucun outil', () => {
  it('rejette le mode d’emploi et les noms d’outils', async () => {
    const { synthesisStyleProblems } = await import('@/lib/prospect-audit/synthesis')
    expect(synthesisStyleProblems([{ text: 'Je crée une page à votre nom, reliée à votre fiche Google.' }], ['Je complète la fiche'])).toEqual([])
    const problems = synthesisStyleProblems(
      [{ text: 'Créez une simple page avec Wix ou Google Sites.' }],
      ['Choisir une plateforme simple', "J'ajoute les photos"]
    )
    expect(problems).toHaveLength(3)
    expect(problems[0]).toContain('Wix')
  })
})

describe('feuille A4 : présence, concurrents, le plus urgent', () => {
  const issue = (key: string, category: 'site' | 'technique' | 'avis' | 'ia' | 'photos' | 'fiche') => ({
    key, category, title: 'Titre', detail: '',
  })
  const answers: AnswerCell[] = [
    { question: 0, engine: 'chatgpt', status: 'ok', cited: false, position: null, competitors: [] },
  ]

  it('présence toujours en fraction', async () => {
    const { presenceFraction } = await import('@/lib/prospect-audit/view')
    expect(presenceFraction({ cited: 0, answered: 15 })).toBe('0 / 15')
  })

  it('les 3 plus cités à votre place', async () => {
    const { topCitedInstead } = await import('@/lib/prospect-audit/view')
    const citedInstead = [4, 3, 2, 1].map((n) => ({ name: `A${n}`, answers: n }))
    expect(topCitedInstead({ citedInstead })).toEqual(['A4', 'A3', 'A2'])
  })

  it('le noindex passe avant tout, sans jargon', async () => {
    const { mostUrgent } = await import('@/lib/prospect-audit/view')
    const doc = {
      prospect: { ...BARBER, website: 'https://atlas-training.fr/' },
      answers,
      issues: [issue('avis.nombre', 'avis'), issue('technique.noindex_on_key_pages', 'technique'), issue('ia.chatgpt', 'ia')],
    }
    expect(mostUrgent(doc)).toBe("votre site demande à Google de ne pas l'afficher.")
  })

  it('pas de site, puis avis, puis absence dans les IA', async () => {
    const { mostUrgent } = await import('@/lib/prospect-audit/view')
    expect(mostUrgent({ prospect: BARBER, answers, issues: [issue('avis.nombre', 'avis'), issue('site.absent', 'site')] })).toBe(
      "vous n'avez pas de site : les IA n'ont rien à lire sur vous."
    )
    expect(mostUrgent({ prospect: BARBER, answers, issues: [issue('photos.nombre', 'photos'), issue('avis.nombre', 'avis')] })).toBe(
      'vous avez 17 avis Google, quand la médiane du quartier est de 710.'
    )
    expect(mostUrgent({ prospect: BARBER, answers, issues: [issue('ia.claude', 'ia')] })).toBe(
      'aucune IA ne vous cite quand un client demande conseil.'
    )
    expect(mostUrgent({ prospect: BARBER, answers, issues: [] })).toBeNull()
  })
})

describe('rédaction : interdits du 22/10', () => {
  it('photos professionnelles, serveur, promesses de résultat', async () => {
    const { synthesisStyleProblems } = await import('@/lib/prospect-audit/synthesis')
    const ok = [
      { text: 'Je complète votre fiche avec les photos que vous me transmettez.' },
      { text: 'Je vous indique quoi demander à votre hébergeur pour accélérer le site.' },
      { text: "Je complète 2 à 3 annuaires pour vous donner toutes les chances d'apparaître." },
    ]
    expect(synthesisStyleProblems(ok, ['Je complète la fiche'])).toEqual([])
    const bad = (text: string) => synthesisStyleProblems([{ text }], ['Je fais'])
    expect(bad('Je complète votre fiche avec des photos professionnelles.')).toHaveLength(1)
    expect(bad('Je réduis le temps de réponse du serveur.')).toHaveLength(1)
    expect(bad('Je mets en cohérence vos informations pour que les IA vous recommandent.')).toHaveLength(1)
    expect(bad('Je vérifie que ChatGPT et Gemini vous trouvent désormais.')).toHaveLength(1)
  })
})
