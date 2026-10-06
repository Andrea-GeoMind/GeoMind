import { describe, it, expect } from 'vitest'
import { validateFieldSave, type SaveContext } from '@/lib/chantiers/save'

const ctx: SaveContext = {
  chantierOptions: { extraFields: ['hse.liste_maries'] },
  establishments: [
    { id: '11111111-1111-4111-8111-111111111111', kind: 'venue', options: { addressOptions: ['1 rue A'] } },
    {
      id: '22222222-2222-4222-8222-222222222222',
      kind: 'venue',
      options: { addressOptions: ['2 rue B'], extraFields: ['hameau.figaro_reference'] },
    },
  ],
}
const E1 = ctx.establishments[0]!.id
const E2 = ctx.establishments[1]!.id

describe('validateFieldSave', () => {
  it('accepte une saisie valide et renvoie la valeur nettoyée', () => {
    const r = validateFieldSave(ctx, { establishmentId: E1, fieldKey: 'venue.plan_b_pluie', value: '  Chapiteau ' })
    expect(r).toMatchObject({ ok: true, establishmentId: E1, input: 'Chapiteau' })
  })

  it.each([
    [{ establishmentId: E1, fieldKey: 'venue.inexistant', value: 1 }, 'unknown_field'],
    [{ establishmentId: E1, fieldKey: 'files.photos', value: 'x' }, 'file_field'],
    [{ establishmentId: null, fieldKey: 'venue.chambres', value: 3 }, 'wrong_scope'],
    [{ establishmentId: E1, fieldKey: 'decision.etude_de_cas', value: { choice: 'yes', comment: '' } }, 'wrong_scope'],
    [{ establishmentId: '33333333-3333-4333-8333-333333333333', fieldKey: 'venue.chambres', value: 3 }, 'unknown_establishment'],
    [{ establishmentId: E1, fieldKey: 'rental.convives_max', value: 100 }, 'not_enabled'],
    [{ establishmentId: E1, fieldKey: 'hameau.figaro_reference', value: { date: '', title: 'x', url: '' } }, 'not_enabled'],
    [{ establishmentId: null, fieldKey: 'oravis.fiche_entrepot', value: { choice: 'claim', comment: '' } }, 'not_enabled'],
    [{ establishmentId: E1, fieldKey: 'venue.chambres', value: -2 }, 'invalid_value'],
    [{ establishmentId: E1, fieldKey: 'access.gbp', value: 'absent' }, 'invalid_value'],
    [{ establishmentId: E1, fieldKey: 'decision.adresse', value: { choice: '2 rue B', otherText: '', comment: '' } }, 'invalid_value'],
  ])('%j → %s', (req, error) => {
    expect(validateFieldSave(ctx, req)).toEqual({ ok: false, error })
  })

  it('les adresses proposées sont celles de l’établissement visé', () => {
    const r = validateFieldSave(ctx, {
      establishmentId: E2,
      fieldKey: 'decision.adresse',
      value: { choice: '2 rue B', otherText: '', comment: '' },
    })
    expect(r.ok).toBe(true)
  })

  it('un extra activé sur un établissement est accepté là seulement', () => {
    const v = { date: '2025-06-12', title: 'Les plus beaux lieux', url: '' }
    expect(validateFieldSave(ctx, { establishmentId: E2, fieldKey: 'hameau.figaro_reference', value: v }).ok).toBe(true)
  })

  it('une signature envoyée par le navigateur est retirée de la saisie', () => {
    const r = validateFieldSave(ctx, {
      establishmentId: null,
      fieldKey: 'decision.avis',
      value: { choice: 'yes', comment: '', signerName: 'X', signature: { signedAt: '2020-01-01' } },
    })
    expect(r.ok && r.input).toEqual({ choice: 'yes', comment: '', signerName: 'X' })
  })
})
