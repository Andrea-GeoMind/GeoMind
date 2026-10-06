import { describe, it, expect } from 'vitest'
import { CHANTIER_SEEDS } from '@/lib/chantiers/seed-data'
import { invalidExtraFields } from '@/lib/chantiers/fields'

const byName = (name: string) => {
  const seed = CHANTIER_SEEDS.find((s) => s.clientName === name)
  if (!seed) throw new Error(`chantier ${name} absent`)
  return seed
}

describe('chantiers de départ', () => {
  it('Oravis : 2 loueurs, oravis.com et carrousel-location.com, 4 adresses proposées chacun', () => {
    const oravis = byName('Oravis')
    expect(oravis.establishments.map((e) => [e.name, e.kind, e.website])).toEqual([
      ['Oravis', 'rental', 'https://oravis.com'],
      ['Location de carrousel', 'rental', 'https://carrousel-location.com'],
    ])
    for (const e of oravis.establishments) expect(e.options.addressOptions).toHaveLength(4)
    expect(oravis.options.extraFields).toEqual(['oravis.fiche_entrepot'])
  })

  it('Home Sweet Event : 4 lieux de réception, liste des mariés activée', () => {
    const hse = byName('Home Sweet Event')
    expect(hse.establishments.map((e) => e.name)).toEqual([
      'Bastide des Barattes',
      'Mas de Florette',
      'Clos du Tuilier',
      'Hameau de l’Esperelle',
    ])
    expect(hse.establishments.every((e) => e.kind === 'venue')).toBe(true)
    expect(hse.options.extraFields).toEqual(['hse.liste_maries'])
  })

  it('Hameau : 2 adresses proposées et l’article du Figaro ; les 3 autres domaines : 1 adresse', () => {
    const hse = byName('Home Sweet Event')
    for (const e of hse.establishments) {
      const hameau = e.name.startsWith('Hameau')
      expect(e.options.addressOptions, e.name).toHaveLength(hameau ? 2 : 1)
      expect(e.options.extraFields ?? [], e.name).toEqual(
        hameau ? ['hameau.figaro_reference', 'hameau.figaro_file'] : []
      )
    }
  })

  it('tous les extras existent au bon niveau', () => {
    for (const seed of CHANTIER_SEEDS) {
      expect(invalidExtraFields(seed.options.extraFields ?? [], 'chantier')).toEqual([])
      for (const e of seed.establishments) {
        expect(invalidExtraFields(e.options.extraFields ?? [], 'establishment')).toEqual([])
      }
    }
  })

  it('aucune adresse proposée en double', () => {
    for (const seed of CHANTIER_SEEDS) {
      for (const e of seed.establishments) {
        const list = e.options.addressOptions ?? []
        expect(new Set(list).size, e.name).toBe(list.length)
      }
    }
  })
})
