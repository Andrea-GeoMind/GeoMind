import { describe, it, expect } from 'vitest'
import { computeCompleteness, type CompletenessInput } from '@/lib/chantiers/completeness'
import { CHANTIER_SEEDS } from '@/lib/chantiers/seed-data'

const venue = { id: 'e1', name: 'Mas de Florette', kind: 'venue' as const, options: { addressOptions: ['La Verrerie, 84220 Lioux'] } }
const rental = { id: 'e2', name: 'Oravis', kind: 'rental' as const, options: { addressOptions: ['1679 route du Thor'] } }

const base = (overrides: Partial<CompletenessInput> = {}): CompletenessInput => ({
  chantierOptions: {},
  establishments: [venue],
  answers: [],
  files: [],
  ...overrides,
})

const answer = (establishmentId: string | null, fieldKey: string, value: unknown) => ({
  establishmentId,
  fieldKey,
  value,
})

describe('computeCompleteness', () => {
  it('chantier vide : rien de rempli, les 4 bloquants manquent par établissement', () => {
    const c = computeCompleteness(base())
    expect(c.filledRequiredCount).toBe(0)
    expect(c.percent).toBe(0)
    expect(c.canStart).toBe(false)
    expect(c.blocking.map((i) => i.fieldKey).sort()).toEqual([
      'access.gbp',
      'access.wordpress',
      'decision.adresse',
      'decision.robots_ia',
    ])
  })

  it('les bloquants sont comptés pour chaque établissement', () => {
    const c = computeCompleteness(base({ establishments: [venue, rental] }))
    expect(c.blocking).toHaveLength(8)
    expect(new Set(c.blocking.map((i) => i.establishmentName))).toEqual(new Set(['Mas de Florette', 'Oravis']))
  })

  it('les 4 bloquants remplis suffisent à démarrer, même si le reste manque', () => {
    const c = computeCompleteness(
      base({
        answers: [
          answer('e1', 'access.gbp', 'given'),
          answer('e1', 'access.wordpress', 'absent'),
          answer('e1', 'decision.adresse', { choice: 'La Verrerie, 84220 Lioux', otherText: '', comment: '' }),
          answer('e1', 'decision.robots_ia', { choice: 'yes', comment: '' }),
        ],
      })
    )
    expect(c.canStart).toBe(true)
    expect(c.blocking).toEqual([])
    expect(c.missing.length).toBeGreaterThan(0)
    expect(c.missing.every((i) => !i.blocking)).toBe(true)
  })

  it('fiche Google « je ne sais pas comment faire » : reste bloquante et lève une alerte', () => {
    const c = computeCompleteness(base({ answers: [answer('e1', 'access.gbp', 'unsure')] }))
    expect(c.blocking.map((i) => i.fieldKey)).toContain('access.gbp')
    expect(c.canStart).toBe(false)
    expect(c.alerts).toHaveLength(1)
    expect(c.alerts[0]).toMatchObject({ fieldKey: 'access.gbp', establishmentName: 'Mas de Florette' })
  })

  it('« mon site n’est pas sur WordPress » lève le blocage, sans alerte', () => {
    const c = computeCompleteness(base({ answers: [answer('e1', 'access.wordpress', 'absent')] }))
    expect(c.blocking.map((i) => i.fieldKey)).not.toContain('access.wordpress')
    expect(c.alerts).toEqual([])
  })

  it('une réponse d’un autre établissement ne compte pas', () => {
    const c = computeCompleteness(
      base({ establishments: [venue, rental], answers: [answer('e2', 'access.gbp', 'given')] })
    )
    const gbp = c.items.filter((i) => i.fieldKey === 'access.gbp')
    expect(gbp.find((i) => i.establishmentId === 'e2')?.filled).toBe(true)
    expect(gbp.find((i) => i.establishmentId === 'e1')?.filled).toBe(false)
  })

  it('un fichier compte une fois vérifié, pas en attente ni supprimé', () => {
    const photos = (status: 'pending' | 'ready' | 'deleted') =>
      computeCompleteness(base({ files: [{ establishmentId: 'e1', fieldKey: 'files.photos', status }] }))
        .items.find((i) => i.fieldKey === 'files.photos')?.filled
    expect(photos('pending')).toBe(false)
    expect(photos('deleted')).toBe(false)
    expect(photos('ready')).toBe(true)
  })

  it('les champs facultatifs ne pèsent pas dans l’avancement', () => {
    const without = computeCompleteness(base())
    const withOptional = computeCompleteness(
      base({ answers: [answer('e1', 'common.partenaires', [{ name: 'X', website: '', contact: '' }])] })
    )
    expect(withOptional.percent).toBe(without.percent)
    expect(withOptional.items.find((i) => i.fieldKey === 'common.partenaires')?.filled).toBe(true)
  })

  it('les réponses à des champs inconnus du catalogue sont ignorées', () => {
    const c = computeCompleteness(base({ answers: [answer('e1', 'venue.ancien_champ', 'x')] }))
    expect(c.items.some((i) => i.fieldKey === 'venue.ancien_champ')).toBe(false)
  })

  it('avancement par section cohérent avec le total', () => {
    const c = computeCompleteness(base({ establishments: [venue, rental] }))
    const sum = Object.values(c.bySection).reduce((s, x) => s + x.required, 0)
    expect(sum).toBe(c.requiredCount)
  })

  it('tout rempli → 100 %', () => {
    const c0 = computeCompleteness(base({ establishments: [rental] }))
    const values: Record<string, unknown> = {
      'access.gbp': 'given',
      'access.wordpress': 'given',
      'access.search_console': 'absent',
      'access.analytics': 'given',
      'access.hosting': 'given',
      'rental.zones_livraison': ['Vaucluse'],
      'rental.prestations': [{ label: 'Chaise Napoléon', price: '3 €' }],
      'rental.convives_max': 400,
      'rental.faq': [{ question: 'Livrez-vous ?', answer: 'Oui' }],
      'decision.adresse': { choice: '1679 route du Thor', otherText: '', comment: '' },
      'decision.robots_ia': { choice: 'yes', comment: '' },
      'decision.etude_de_cas': { choice: 'no', comment: '' },
      'decision.avis': { choice: 'no', comment: '', signerName: '', signature: null },
      'files.photos_rights': {
        accepted: true,
        signature: { textVersion: 'photos-2026-10', signedAt: '2026-10-06T10:00:00.000Z', ipTruncated: '1.1.1.0' },
      },
    }
    const answers = c0.items
      .filter((i) => i.required && values[i.fieldKey] !== undefined)
      .map((i) => answer(i.establishmentId, i.fieldKey, values[i.fieldKey]))
    const files = [
      { establishmentId: 'e2', fieldKey: 'files.logo', status: 'ready' as const },
      { establishmentId: 'e2', fieldKey: 'files.photos', status: 'ready' as const },
    ]
    const c = computeCompleteness(base({ establishments: [rental], answers, files }))
    expect(c.missing.map((i) => i.fieldKey)).toEqual([])
    expect(c.percent).toBe(100)
    expect(c.canStart).toBe(true)
  })

  it('chantiers réels : Oravis et Home Sweet Event se calculent sans erreur', () => {
    for (const seed of CHANTIER_SEEDS) {
      const c = computeCompleteness({
        chantierOptions: seed.options,
        establishments: seed.establishments.map((e, i) => ({ id: `e${i}`, ...e })),
        answers: [],
        files: [],
      })
      expect(c.blocking).toHaveLength(seed.establishments.length * 4)
    }
  })
})
