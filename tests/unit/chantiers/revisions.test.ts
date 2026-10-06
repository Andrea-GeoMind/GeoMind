import { describe, it, expect } from 'vitest'
import { planRevision, sameValue, stableStringify, type LastRevision } from '@/lib/chantiers/revisions'

const T0 = new Date('2026-10-06T10:00:00Z')
const at = (minutes: number) => new Date(T0.getTime() + minutes * 60_000)
const last = (overrides: Partial<LastRevision> = {}): LastRevision => ({
  id: 'r1',
  actor: 'client',
  oldValue: null,
  updatedAt: T0,
  ...overrides,
})

describe('stableStringify / sameValue', () => {
  it('ignore l’ordre des clés', () => {
    expect(stableStringify({ b: 1, a: [1, { d: 2, c: 3 }] })).toBe(stableStringify({ a: [1, { c: 3, d: 2 }], b: 1 }))
  })

  it('distingue les valeurs proches', () => {
    expect(sameValue(0, null)).toBe(false)
    expect(sameValue('', null)).toBe(false)
    expect(sameValue([1, 2], [2, 1])).toBe(false)
    expect(sameValue(undefined, null)).toBe(false)
  })
})

describe('planRevision', () => {
  it('valeur inchangée → rien', () => {
    expect(planRevision({ last: null, actor: 'client', previousValue: 'a', nextValue: 'a', now: T0 })).toEqual({
      action: 'skip',
    })
  })

  it('première saisie → nouvelle révision depuis null', () => {
    expect(planRevision({ last: null, actor: 'client', previousValue: undefined, nextValue: 'Ch', now: T0 })).toEqual(
      { action: 'insert', oldValue: null, newValue: 'Ch' }
    )
  })

  it('saisies rapprochées du même auteur → fusion', () => {
    expect(
      planRevision({ last: last(), actor: 'client', previousValue: 'Ch', nextValue: 'Chapiteau', now: at(9) })
    ).toEqual({ action: 'merge', id: 'r1', newValue: 'Chapiteau' })
  })

  it('après 10 minutes de pause → nouvelle révision', () => {
    expect(
      planRevision({ last: last(), actor: 'client', previousValue: 'Chapiteau', nextValue: 'Salle', now: at(10) })
    ).toEqual({ action: 'insert', oldValue: 'Chapiteau', newValue: 'Salle' })
  })

  it('un autre auteur → nouvelle révision, même dans la fenêtre', () => {
    expect(
      planRevision({ last: last(), actor: 'geomind', previousValue: 'Chapiteau', nextValue: 'Salle', now: at(1) })
    ).toEqual({ action: 'insert', oldValue: 'Chapiteau', newValue: 'Salle' })
  })

  it('revenir à la valeur de départ dans la fenêtre → la révision disparaît', () => {
    expect(
      planRevision({
        last: last({ oldValue: { choice: 'yes', comment: '' } }),
        actor: 'client',
        previousValue: { choice: 'no', comment: '' },
        nextValue: { comment: '', choice: 'yes' },
        now: at(2),
      })
    ).toEqual({ action: 'discard', id: 'r1' })
  })
})
