import { describe, it, expect } from 'vitest'
import {
  EMPTY_CHANTIER_FORM,
  chantierInputSchema,
  formToChantierInput,
  parseAddressLines,
  type ChantierFormValues,
} from '@/lib/chantiers/validation'

const valid = {
  clientName: 'Home Sweet Event',
  contactEmail: '',
  geomindAddress: 'andrea.schwertz2008@gmail.com',
  extraFields: ['hse.liste_maries'],
  establishments: [
    {
      name: 'Mas de Florette',
      kind: 'venue',
      website: 'https://masdeflorette.com',
      addressOptions: ['La Verrerie, 84220 Lioux'],
      extraFields: [],
    },
  ],
}

const issues = (input: unknown) =>
  chantierInputSchema.safeParse(input).error?.issues.map((i) => `${i.path.join('.')}: ${i.message}`) ?? []

describe('chantierInputSchema', () => {
  it('accepte un chantier complet', () => {
    expect(issues(valid)).toEqual([])
  })

  it('nom du client et au moins un établissement obligatoires', () => {
    expect(issues({ ...valid, clientName: '  ' })).toEqual(['clientName: Nom du client requis'])
    expect(issues({ ...valid, establishments: [] })).toEqual(['establishments: Au moins un établissement'])
  })

  it('adresse GeoMind obligatoire et valide', () => {
    expect(issues({ ...valid, geomindAddress: 'pas-un-email' })).toEqual(['geomindAddress: E-mail invalide'])
  })

  it('site en http(s) ou vide', () => {
    const withSite = (website: string) => ({ ...valid, establishments: [{ ...valid.establishments[0], website }] })
    expect(issues(withSite(''))).toEqual([])
    expect(issues(withSite('javascript:alert(1)'))).toHaveLength(1)
  })

  it('refuse un extra inconnu ou au mauvais niveau', () => {
    expect(issues({ ...valid, extraFields: ['hse.liste_marie'] })).toEqual(['extraFields: Champ inconnu : hse.liste_marie'])
    expect(
      issues({
        ...valid,
        establishments: [{ ...valid.establishments[0], extraFields: ['hse.liste_maries'] }],
      })
    ).toEqual(['establishments.0.extraFields: Champ inconnu : hse.liste_maries'])
  })

  it('refuse deux établissements du même nom et une adresse proposée deux fois', () => {
    const e = valid.establishments[0]
    expect(issues({ ...valid, establishments: [e, { ...e, name: 'mas de florette' }] })).toEqual([
      'establishments.1.name: Nom en double',
    ])
    expect(
      issues({ ...valid, establishments: [{ ...e, addressOptions: ['1 rue A', '1 rue A'] }] })
    ).toEqual(['establishments.0.addressOptions: Adresse proposée en double'])
  })
})

describe('formulaire', () => {
  it('une adresse par ligne, lignes vides ignorées', () => {
    expect(parseAddressLines('  1 rue A \r\n\n2 rue B\n   ')).toEqual(['1 rue A', '2 rue B'])
  })

  it('le formulaire vide propose l’adresse GeoMind par défaut', () => {
    expect(EMPTY_CHANTIER_FORM.geomindAddress).toBe('andrea.schwertz2008@gmail.com')
  })

  it('formToChantierInput produit une entrée valide', () => {
    const form: ChantierFormValues = {
      clientName: 'Oravis',
      contactEmail: ' ',
      geomindAddress: 'andrea.schwertz2008@gmail.com',
      extraFields: ['oravis.fiche_entrepot'],
      establishments: [
        { name: 'Oravis', kind: 'rental', website: 'https://oravis.com ', addressText: '1679 route du Thor\n703 route du Thor', extraFields: [] },
      ],
    }
    const parsed = chantierInputSchema.parse(formToChantierInput(form))
    expect(parsed.contactEmail).toBe('')
    expect(parsed.establishments[0]?.website).toBe('https://oravis.com')
    expect(parsed.establishments[0]?.addressOptions).toEqual(['1679 route du Thor', '703 route du Thor'])
  })
})
