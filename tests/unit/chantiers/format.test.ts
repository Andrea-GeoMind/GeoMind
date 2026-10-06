import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { ADDRESS_OTHER, getField, type FieldDef } from '@/lib/chantiers/fields'
import { accessEvent, formatAnswer } from '@/lib/chantiers/format'

const field = (key: string): FieldDef => getField(key)!
const sig = { textVersion: 'avis-2026-10', signedAt: '2026-10-06T18:20:37.000Z', ipTruncated: '88.184.85.0' }

describe('formatAnswer', () => {
  it.each([
    ['access.gbp', 'given', 'C’est fait'],
    ['access.gbp', 'unsure', 'Je ne sais pas comment faire'],
    ['access.wordpress', 'absent', 'Mon site n’est pas sur WordPress'],
    ['venue.chambres', 6, '6 chambres'],
    ['venue.capacite_assise', 1200, '1 200 invités'],
    ['venue.prix_haute_saison', 4500, '4 500 €'],
    ['venue.piscine', { value: true, detail: '12 × 5 m' }, 'Oui — 12 × 5 m'],
    ['venue.piscine', { value: false, detail: '' }, 'Non'],
    ['rental.zones_livraison', ['Vaucluse', '', 'Bouches-du-Rhône'], '• Vaucluse\n• Bouches-du-Rhône'],
    ['rental.prestations', [{ label: 'Chaise Napoléon', price: '3 €' }], '• Chaise Napoléon : 3 €'],
    ['rental.faq', [{ question: 'Livrez-vous ?', answer: 'Oui' }], '• Livrez-vous ?\n  Oui'],
    ['access.webmaster', { name: 'Agence X', email: 'a@x.fr', phone: '' }, 'Agence X · a@x.fr'],
    ['venue.prestataires', [{ category: 'dj', name: 'DJ Test', website: '', contact: '06' }], '• DJ — DJ Test · 06'],
    ['hameau.figaro_reference', { date: '2025-06-12', title: 'Les beaux lieux', url: '' }, '2025-06-12 · Les beaux lieux'],
    ['decision.robots_ia', { choice: 'yes', comment: 'OK' }, 'Oui, autoriser les robots des IA\nCommentaire : OK'],
    ['oravis.fiche_entrepot', { choice: 'claim', comment: '' }, 'Je la revendique, puis vous la faites supprimer'],
  ] as const)('%s = %j', (key, value, expected) => {
    expect(formatAnswer(field(key), value)?.replace(/ | /g, ' ')).toBe(expected)
  })

  it.each([
    ['access.gbp', null],
    ['venue.plan_b_pluie', ''],
    ['rental.zones_livraison', []],
    ['decision.robots_ia', { choice: null, comment: '' }],
    ['venue.chambres', undefined],
  ] as const)('%s = %j → vide', (key, value) => {
    expect(formatAnswer(field(key), value)).toBeNull()
  })

  it('adresse proposée, autre adresse, adresse retirée des propositions', () => {
    const f = field('decision.adresse')
    const opts = { addressOptions: ['1 rue A'] }
    expect(formatAnswer(f, { choice: '1 rue A', otherText: '', comment: '' }, opts)).toBe('1 rue A')
    expect(formatAnswer(f, { choice: ADDRESS_OTHER, otherText: '2 rue B', comment: '' }, opts)).toBe('Autre adresse : 2 rue B')
    expect(formatAnswer(f, { choice: '9 rue Z', otherText: '', comment: '' }, opts)).toBe(
      '9 rue Z (ne figure plus dans les propositions)'
    )
  })

  it('accord d’avis : nom, date et heure de Paris, version du texte, IP', () => {
    const v = { choice: 'yes', comment: '', signerName: 'Fabrice M.', signature: sig }
    expect(formatAnswer(field('decision.avis'), v)).toBe(
      'Oui — accord donné par Fabrice M. le 6 octobre 2026 à 20:20, texte avis-2026-10, IP 88.184.85.0'
    )
    expect(formatAnswer(field('decision.avis'), { ...v, signature: null })).toBe('Oui, mais pas encore signé (nom manquant)')
    expect(formatAnswer(field('decision.avis'), { choice: 'no', comment: 'Plus tard', signerName: '', signature: null })).toBe(
      'Non\nCommentaire : Plus tard'
    )
  })

  it('droits sur les photos : date et heure de la confirmation', () => {
    const f = field('files.photos_rights')
    expect(formatAnswer(f, { accepted: true, signature: { ...sig, textVersion: 'photos-2026-10' } })).toBe(
      'Confirmé le 6 octobre 2026 à 20:20, texte photos-2026-10, IP 88.184.85.0'
    )
    expect(formatAnswer(f, { accepted: false, signature: null })).toBe('Non confirmé (case décochée)')
  })

  it('une valeur mal formée ne casse pas l’affichage', () => {
    expect(formatAnswer(field('venue.piscine'), 'n’importe quoi')).toBeNull()
    expect(formatAnswer(field('rental.faq'), { pas: 'un tableau' })).toBeNull()
  })
})

describe('journal des accès', () => {
  it('chaque événement écrit dans le code a un libellé', () => {
    const sources = ['lib/chantiers/access.ts', 'lib/db/queries/chantiers.ts', 'app/chantier/espace/actions.ts', 'app/chantier/espace/page.tsx', 'app/chantier/[token]/route.ts']
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n')
    const literal = [...sources.matchAll(/event: '(\w+)'|logChantierAccess\([^,]+, '(\w+)'/g)].map((m) => m[1] ?? m[2])
    const tokenStates = ['unknown', 'expired', 'revoked', 'closed'].map((s) => `${s}_token`)
    for (const ev of [...literal, ...tokenStates, 'rate_limited']) {
      expect(accessEvent(ev!).label, ev).not.toBe(ev)
    }
  })

  it('les refus sont signalés comme tels', () => {
    expect(accessEvent('revoked_token').ok).toBe(false)
    expect(accessEvent('view').ok).toBe(true)
  })
})
