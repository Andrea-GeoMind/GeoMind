import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  ASSISTANT,
  ASSISTANT_BUDGET,
  ASSISTANT_RETENTION_DAYS,
  budgetState,
  buildAssistantContext,
  buildModelMessages,
  checkQuestion,
  crossedThreshold,
  groupAssistantQuestions,
  hasAssistant,
  parisDayStart,
  prepareAnswerForDisplay,
  questionKey,
  resolveAssistantTarget,
  stuckAdviceFor,
  unavailableMessage,
} from '@/lib/chantiers/assistant'
import { FIELD_CATALOG, getField } from '@/lib/chantiers/fields'
import { buildChantierAssistantPrompt } from '@/lib/ai/prompts/chantier-assistant'
import { CHANTIER_RATE_LIMITS } from '@/lib/chantiers/rate-limits'

const ADDRESS = 'andrea.schwertz2008@gmail.com'
const E1 = '11111111-1111-4111-8111-111111111111'
const E2 = '22222222-2222-4222-8222-222222222222'
const establishments = [
  { id: E1, kind: 'venue' as const, options: { extraFields: ['hameau.figaro_reference'] } },
  { id: E2, kind: 'rental' as const, options: {} },
]
const target = (establishmentId: string | null, fieldKey: string, chantierOptions = {}) =>
  resolveAssistantTarget({ chantierOptions, establishments, establishmentId, fieldKey })

describe('étapes qui ont l’assistant', () => {
  it('toute étape avec une aide, sauf la liste des mariés', () => {
    expect(hasAssistant(getField('access.gbp')!)).toBe(true)
    expect(hasAssistant(getField('files.photos')!)).toBe(true)
    expect(hasAssistant(getField('hse.liste_maries')!)).toBe(false)
    for (const f of FIELD_CATALOG.filter((f) => !f.help)) expect(hasAssistant(f), f.key).toBe(false)
  })

  it('l’étape doit exister dans CE chantier, à cet endroit', () => {
    expect(target(E1, 'access.gbp').ok).toBe(true)
    expect(target(E1, 'hameau.figaro_reference').ok).toBe(true)
    // Extra non activé sur cet établissement
    expect(target(E2, 'hameau.figaro_reference').ok).toBe(false)
    // Champ de lieu demandé sur un loueur
    expect(target(E2, 'venue.unique').ok).toBe(false)
    // Établissement d'un autre chantier
    expect(target('33333333-3333-4333-8333-333333333333', 'access.gbp').ok).toBe(false)
    // Champ du chantier entier, sans établissement
    expect(target(null, 'access.webmaster').ok).toBe(true)
    expect(target(null, 'access.gbp').ok).toBe(false)
    // Liste des mariés activée : toujours sans assistant
    expect(target(null, 'hse.liste_maries', { extraFields: ['hse.liste_maries'] }).ok).toBe(false)
    expect(target(E1, 'inconnu').ok).toBe(false)
  })
})

describe('questions rejetées sans appel', () => {
  it('vide ou moins de 3 caractères', () => {
    for (const q of ['', '   ', 'ok', '?!', ' a ?']) expect(checkQuestion(q, null)).toEqual({ ok: false, reason: 'too_short' })
    expect(checkQuestion('aide', null).ok).toBe(true)
  })

  it('plus de 1 000 caractères (5 000 refusés)', () => {
    expect(checkQuestion('a'.repeat(1000), null).ok).toBe(true)
    expect(checkQuestion('a'.repeat(1001), null)).toEqual({ ok: false, reason: 'too_long' })
    expect(checkQuestion('a'.repeat(5000), null)).toEqual({ ok: false, reason: 'too_long' })
  })

  it('identique à la précédente, à la casse, aux espaces et à la ponctuation près', () => {
    const prev = 'Où est le menu Paramètres ?'
    expect(checkQuestion('où est le menu  paramètres', prev)).toEqual({ ok: false, reason: 'repeat' })
    expect(checkQuestion('Où est le menu Paramètres ???', prev)).toEqual({ ok: false, reason: 'repeat' })
    expect(checkQuestion('Où est le menu Personnes ?', prev).ok).toBe(true)
  })

  it('clé du cache stable', () => {
    expect(questionKey('  Je ne TROUVE pas…  ')).toBe('je ne trouve pas')
    expect(questionKey('C’est où ?')).toBe(questionKey("c'est où"))
  })
})

describe('ce que reçoit le modèle', () => {
  const gbp = getField('access.gbp')!

  it('l’étape, son aide avec l’adresse, le type d’établissement, le lien officiel', () => {
    const ctx = buildAssistantContext(gbp, 'venue', ADDRESS)
    expect(Object.keys(ctx).sort()).toEqual(
      ['establishmentKind', 'fieldHelp', 'fieldLabel', 'geomindAddress', 'officialHelpUrl', 'stuckAdvice'].sort()
    )
    expect(ctx.fieldHelp).toContain(ADDRESS)
    expect(ctx.fieldHelp).not.toContain('[ADRESSE]')
    expect(ctx.officialHelpUrl).toBe('https://support.google.com/business/answer/3403100?hl=fr')
    expect(ctx.establishmentKind).toMatch(/lieu de réception/)
    expect(buildAssistantContext(getField('access.hosting')!, 'rental', ADDRESS).officialHelpUrl).toBeNull()
  })

  it('les consignes : une seule étape, aucun mot de passe, pas de menus inventés, « Je ne sais pas comment faire »', () => {
    const prompt = buildChantierAssistantPrompt(buildAssistantContext(gbp, 'venue', ADDRESS))
    expect(prompt).toContain('Fiche Google : GeoMind ajouté comme administrateur')
    expect(prompt).toMatch(/Tu ne parles que de cette étape/)
    expect(prompt).toMatch(/mot de passe, de code de validation/)
    expect(prompt).toMatch(/capture d'écran/)
    expect(prompt).toMatch(/N'invente pas de menus/)
    expect(prompt).toMatch(/l'interface peut varier/)
    expect(prompt).toContain('cochez « Je ne sais pas comment faire »')
    expect(prompt).toMatch(/d'autres chantiers/)
    expect(prompt).toMatch(/300 mots au plus/)
  })

  it('au plus 6 messages : système, 2 derniers échanges, la question', () => {
    const history = [1, 2, 3, 4].map((n) => ({ question: `q${n}`, answer: `r${n}` }))
    const msgs = buildModelMessages('SYS', history, 'nouvelle')
    expect(msgs.map((m) => m.content)).toEqual(['SYS', 'q3', 'r3', 'q4', 'r4', 'nouvelle'])
    expect(msgs.filter((m) => m.role !== 'system').length).toBeLessThanOrEqual(6)
    expect(ASSISTANT.maxOutputTokens).toBeLessThanOrEqual(600)
  })

  it('modèle éco, 30 questions par heure et par chantier, 30 jours de conservation', () => {
    expect(ASSISTANT.model).toBe('mistralai/mistral-small-3.2-24b-instruct')
    expect(CHANTIER_RATE_LIMITS.assistant).toEqual({ limit: 30, windowSeconds: 3600 })
    expect(ASSISTANT_RETENTION_DAYS).toBe(30)
  })
})

describe('client bloqué, budget épuisé', () => {
  it('fiche Google : cocher « Je ne sais pas comment faire »', () => {
    expect(unavailableMessage(getField('access.gbp')!, ADDRESS)).toBe(
      'L’assistant n’est plus disponible aujourd’hui : cochez « Je ne sais pas comment faire », nous vous aidons.'
    )
  })

  it('les autres étapes renvoient vers la case adaptée ou vers l’adresse', () => {
    expect(stuckAdviceFor(getField('access.search_console')!, ADDRESS)).toContain('Je n’ai pas cet outil ou je ne sais pas')
    expect(stuckAdviceFor(getField('access.wordpress')!, ADDRESS)).toContain(ADDRESS)
    expect(stuckAdviceFor(getField('venue.unique')!, ADDRESS)).toContain(ADDRESS)
  })

  it('alerte à 1 €, arrêt à 3 €, une fois chacun', () => {
    expect(ASSISTANT_BUDGET).toEqual({ alertEur: 1, stopEur: 3 })
    expect(budgetState(2.99)).toBe('ok')
    expect(budgetState(3)).toBe('stopped')
    expect(crossedThreshold(0.999, 1.0001)).toBe('alert')
    expect(crossedThreshold(1.2, 1.3)).toBeNull()
    expect(crossedThreshold(2.9999, 3.0001)).toBe('stop')
    expect(crossedThreshold(0.5, 3.5)).toBe('stop')
  })

  it('journée budgétaire : minuit à Paris, été comme hiver', () => {
    expect(parisDayStart(new Date('2026-10-08T15:00:00Z')).toISOString()).toBe('2026-10-07T22:00:00.000Z')
    expect(parisDayStart(new Date('2026-10-07T22:30:00Z')).toISOString()).toBe('2026-10-07T22:00:00.000Z')
    expect(parisDayStart(new Date('2026-12-15T23:30:00Z')).toISOString()).toBe('2026-12-15T23:00:00.000Z')
    expect(parisDayStart(new Date('2026-12-15T22:30:00Z')).toISOString()).toBe('2026-12-14T23:00:00.000Z')
  })
})

describe('affichage des réponses', () => {
  it('seuls les liens d’aide officiels sont cliquables', () => {
    const out = prepareAnswerForDisplay(
      'Voir https://support.google.com/business/answer/3403100?hl=fr. Ou [ici](https://evil.example/login) et https://evil.example/x'
    )
    expect(out).toContain('[https://support.google.com/business/answer/3403100?hl=fr](https://support.google.com/business/answer/3403100?hl=fr).')
    expect(out).toContain('Ou ici et https://evil.example/x')
    expect(out).not.toContain('](https://evil')
    expect(prepareAnswerForDisplay('[aide](https://wordpress.org/documentation/)')).toBe('[aide](https://wordpress.org/documentation/)')
    expect(prepareAnswerForDisplay('[faux](http://support.google.com/x)')).toBe('faux')
  })
})

describe('regroupement par étape (vue GeoMind, e-mail)', () => {
  it('par établissement et par champ, dans l’ordre', () => {
    const groups = groupAssistantQuestions(
      [
        { establishmentId: E1, fieldKey: 'access.gbp' },
        { establishmentId: E2, fieldKey: 'access.gbp' },
        { establishmentId: E1, fieldKey: 'access.gbp' },
      ],
      new Map([[E1, 'Mas'], [E2, 'Loueur']])
    )
    expect(groups.map((g) => [g.establishmentName, g.label, g.exchanges.length])).toEqual([
      ['Mas', 'Fiche Google : GeoMind ajouté comme administrateur', 2],
      ['Loueur', 'Fiche Google : GeoMind ajouté comme administrateur', 1],
    ])
  })
})

describe('route de l’assistant', () => {
  const route = readFileSync('app/chantier/assistant/route.ts', 'utf8')
  const callAt = route.indexOf('await fetch(OPENROUTER_URL')

  it('tout ce qui ne coûte rien passe avant l’appel au modèle', () => {
    for (const check of ['resolveAssistantTarget(', 'checkQuestion(', 'findCachedAnswer(', "budgetState(spentBefore) === 'stopped'"]) {
      const at = route.indexOf(check)
      expect(at, check).toBeGreaterThan(0)
      expect(at, check).toBeLessThan(callAt)
    }
  })

  it('clé séparée, sinon la clé existante', () => {
    expect(route).toMatch(/env\.OPENROUTER_CHANTIER_KEY \?\? env\.OPENROUTER_API_KEY/)
  })

  it('ni PostHog, ni contenu dans Sentry', () => {
    for (const f of [route, readFileSync('components/features/chantier-space/field-assistant.tsx', 'utf8')]) {
      expect(f).not.toMatch(/from 'posthog|usePostHog|captureCoachEvent/)
    }
    expect(readFileSync('components/features/chantier-space/field-assistant.tsx', 'utf8')).toMatch(/analytics=\{false\}/)
    for (const m of route.matchAll(/captureChantierFailure\([^)]*\{([^}]*)\}\)/g)) {
      expect(m[1]).not.toMatch(/question|answer|messages|system/)
    }
  })

  it('les échanges de plus de 30 jours sont supprimés par l’entretien horaire', () => {
    const fn = readFileSync('lib/inngest/functions/chantier-files-maintenance.ts', 'utf8')
    expect(fn).toMatch(/deleteAssistantExchangesBefore\(new Date\(Date\.now\(\) - ASSISTANT_RETENTION_DAYS \* 86_400_000\)\)/)
  })

  it('la table est purement serveur : RLS sans policy, aucun droit client', () => {
    const sql = readFileSync('drizzle/0027_chantier_assistant.sql', 'utf8')
    expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/)
    expect(sql).not.toMatch(/CREATE POLICY/)
    expect(sql).toMatch(/REVOKE ALL ON public\.chantier_assistant_exchanges FROM anon, authenticated/)
    expect(sql).toMatch(/REFERENCES public\.chantiers\("id"\) ON DELETE CASCADE/)
  })
})
