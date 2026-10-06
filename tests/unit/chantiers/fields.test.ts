import { describe, it, expect } from 'vitest'
import {
  ADDRESS_OTHER,
  FIELD_CATALOG,
  chantierFields,
  establishmentFields,
  getField,
  inputSchemaFor,
  invalidExtraFields,
  isFilled,
  needsHelp,
  toStoredValue,
  type FieldDef,
} from '@/lib/chantiers/fields'

const field = (key: string): FieldDef => {
  const f = getField(key)
  if (!f) throw new Error(`champ ${key} absent du catalogue`)
  return f
}
const keys = (fields: FieldDef[]) => fields.map((f) => f.key)

describe('catalogue', () => {
  it('clés uniques', () => {
    const all = FIELD_CATALOG.map((f) => f.key)
    expect(new Set(all).size).toBe(all.length)
  })

  it('les champs bloquants sont exactement : accès fiche Google et WordPress, adresse, robots', () => {
    const blocking = FIELD_CATALOG.filter((f) => f.blocking).map((f) => f.key).sort()
    expect(blocking).toEqual(['access.gbp', 'access.wordpress', 'decision.adresse', 'decision.robots_ia'])
  })

  it('un champ bloquant est toujours obligatoire, et propre à chaque établissement', () => {
    for (const f of FIELD_CATALOG.filter((f) => f.blocking)) {
      expect(f.required, f.key).toBe(true)
      expect(f.scope, f.key).toBe('establishment')
    }
  })

  it('aucun champ ne demande de mot de passe', () => {
    for (const f of FIELD_CATALOG) {
      expect(`${f.key} ${f.label}`.toLowerCase(), f.key).not.toMatch(/password|mot de passe|identifiant/)
    }
  })

  it('les décisions ont un texte explicatif', () => {
    for (const f of FIELD_CATALOG) {
      if (f.type === 'decision' || f.type === 'address' || f.type === 'agreement') {
        expect(f.explanation.length, f.key).toBeGreaterThan(40)
      }
    }
  })

  it('aucun champ fichier n’accepte le SVG', () => {
    for (const f of FIELD_CATALOG) {
      if (f.type === 'file') expect(f.accept as readonly string[], f.key).not.toContain('image/svg+xml')
    }
  })
})

describe('champs par établissement', () => {
  it('lieu de réception : champs du lieu, pas ceux du loueur', () => {
    const k = keys(establishmentFields('venue', {}))
    expect(k).toEqual(
      expect.arrayContaining([
        'venue.capacite_assise',
        'venue.capacite_debout',
        'venue.chambres',
        'venue.gites',
        'venue.couchages',
        'venue.piscine',
        'venue.salle',
        'venue.plan_b_pluie',
        'venue.formule',
        'venue.prix_basse_saison',
        'venue.prix_haute_saison',
        'venue.seminaire',
        'venue.prestataires',
        'common.partenaires',
        'access.gbp',
        'decision.adresse',
        'files.photos',
      ])
    )
    expect(k.some((x) => x.startsWith('rental.'))).toBe(false)
  })

  it('loueur : zones, prestations, convives, FAQ, partenaires — sans prestataires', () => {
    const k = keys(establishmentFields('rental', {}))
    expect(k).toEqual(
      expect.arrayContaining([
        'rental.zones_livraison',
        'rental.prestations',
        'rental.convives_max',
        'rental.faq',
        'common.partenaires',
      ])
    )
    expect(k.some((x) => x.startsWith('venue.'))).toBe(false)
  })

  it('les extras n’apparaissent que s’ils sont activés', () => {
    expect(keys(establishmentFields('venue', {}))).not.toContain('hameau.figaro_reference')
    const hameau = keys(
      establishmentFields('venue', { extraFields: ['hameau.figaro_reference', 'hameau.figaro_file'] })
    )
    expect(hameau).toContain('hameau.figaro_reference')
    expect(hameau).toContain('hameau.figaro_file')
  })

  it('champs du chantier entier', () => {
    expect(keys(chantierFields({}))).toEqual(
      expect.arrayContaining(['access.webmaster', 'decision.etude_de_cas', 'decision.avis'])
    )
    expect(keys(chantierFields({}))).not.toContain('oravis.fiche_entrepot')
    expect(keys(chantierFields({ extraFields: ['oravis.fiche_entrepot'] }))).toContain(
      'oravis.fiche_entrepot'
    )
  })

  it('invalidExtraFields repère les fautes de frappe et les mauvais niveaux', () => {
    expect(invalidExtraFields(['hse.liste_maries'], 'chantier')).toEqual([])
    expect(invalidExtraFields(['hse.liste_marie'], 'chantier')).toEqual(['hse.liste_marie'])
    expect(invalidExtraFields(['hameau.figaro_reference'], 'chantier')).toEqual(['hameau.figaro_reference'])
    // Un champ commun n'est pas un extra
    expect(invalidExtraFields(['venue.piscine'], 'establishment')).toEqual(['venue.piscine'])
  })
})

describe('accès : libellés, aides et alertes', () => {
  const access = FIELD_CATALOG.filter((f) => f.type === 'access')

  it('les libellés demandés', () => {
    const gbp = field('access.gbp')
    const wp = field('access.wordpress')
    if (gbp.type !== 'access' || wp.type !== 'access') throw new Error('type attendu')
    expect(gbp.alternative).toEqual({ value: 'unsure', label: 'Je ne sais pas comment faire', resolves: false, alert: true })
    expect(wp.alternative).toEqual({ value: 'absent', label: 'Mon site n’est pas sur WordPress', resolves: true, alert: false })
  })

  it('chaque aide de la section Accès affiche [ADRESSE]', () => {
    expect(access.length).toBe(5)
    for (const f of access) expect(f.help, f.key).toContain('[ADRESSE]')
  })

  it('« je ne sais pas comment faire » déclenche une alerte ; les autres réponses non', () => {
    expect(needsHelp(field('access.gbp'), 'unsure')).toBe(true)
    expect(needsHelp(field('access.gbp'), 'given')).toBe(false)
    expect(needsHelp(field('access.gbp'), null)).toBe(false)
    expect(needsHelp(field('access.wordpress'), 'absent')).toBe(false)
    expect(needsHelp(field('venue.chambres'), 'unsure')).toBe(false)
  })
})

describe('liste des mariés (données personnelles)', () => {
  const f = field('hse.liste_maries')

  it('CSV ou PDF, téléchargeable par GeoMind seulement, supprimée à 30 jours, avec mention RGPD', () => {
    expect(f.type).toBe('file')
    if (f.type !== 'file') return
    expect(f.category).toBe('personal_data')
    expect([...f.accept].sort()).toEqual(['application/pdf', 'text/csv'])
    expect(f.ownerOnlyDownload).toBe(true)
    expect(f.retentionDays).toBe(30)
    expect(f.notice).toMatch(/[Dd]onnées personnelles/)
    expect(f.notice).toMatch(/Home Sweet Event est responsable du traitement/)
    expect(f.notice).toMatch(/GeoMind agit en sous-traitant/)
    expect(f.notice).toMatch(/seule démarche d’avis/)
    expect(f.notice).toMatch(/supprimée automatiquement 30 jours après le dépôt/)
    expect(f.notice).toMatch(/se désinscrire/)
  })
})

describe('validation des saisies', () => {
  it('fiche Google : « c’est fait » ou « je ne sais pas comment faire », pas « je n’ai pas cet outil »', () => {
    const s = inputSchemaFor(field('access.gbp'))!
    expect(s.safeParse('given').success).toBe(true)
    expect(s.safeParse('unsure').success).toBe(true)
    expect(s.safeParse(null).success).toBe(true)
    expect(s.safeParse('absent').success).toBe(false)
    expect(s.safeParse('motdepasse123').success).toBe(false)
  })

  it('WordPress : « c’est fait » ou « mon site n’est pas sur WordPress »', () => {
    const s = inputSchemaFor(field('access.wordpress'))!
    expect(s.safeParse('given').success).toBe(true)
    expect(s.safeParse('absent').success).toBe(true)
    expect(s.safeParse('unsure').success).toBe(false)
  })

  it('entiers positifs bornés', () => {
    const s = inputSchemaFor(field('venue.capacite_assise'))!
    expect(s.safeParse(180).success).toBe(true)
    expect(s.safeParse(0).success).toBe(true)
    expect(s.safeParse(-1).success).toBe(false)
    expect(s.safeParse(12.5).success).toBe(false)
    expect(s.safeParse('180').success).toBe(false)
  })

  it('texte tronqué aux bords et borné', () => {
    const s = inputSchemaFor(field('venue.plan_b_pluie'))!
    expect(s.parse('  Chapiteau  ')).toBe('Chapiteau')
    expect(s.safeParse('x'.repeat(2001)).success).toBe(false)
  })

  it('adresse : uniquement les propositions ou « autre »', () => {
    const opts = { addressOptions: ['1 rue A, 84000 Avignon'] }
    const s = inputSchemaFor(field('decision.adresse'), opts)!
    expect(s.safeParse({ choice: '1 rue A, 84000 Avignon', otherText: '', comment: '' }).success).toBe(true)
    expect(s.safeParse({ choice: ADDRESS_OTHER, otherText: '2 rue B', comment: '' }).success).toBe(true)
    expect(s.safeParse({ choice: '3 rue inventée', otherText: '', comment: '' }).success).toBe(false)
  })

  it('décision Oravis : revendiquer ou signaler', () => {
    const s = inputSchemaFor(field('oravis.fiche_entrepot'))!
    expect(s.safeParse({ choice: 'claim', comment: '' }).success).toBe(true)
    expect(s.safeParse({ choice: 'duplicate', comment: '' }).success).toBe(true)
    expect(s.safeParse({ choice: 'yes', comment: '' }).success).toBe(false)
  })

  it('référence du Figaro : date ISO et lien http(s)', () => {
    const s = inputSchemaFor(field('hameau.figaro_reference'))!
    expect(
      s.safeParse({ date: '2025-06-12', title: 'Les plus beaux lieux', url: 'https://www.lefigaro.fr/x' })
        .success
    ).toBe(true)
    expect(s.safeParse({ date: '12/06/2025', title: 't', url: '' }).success).toBe(false)
    expect(s.safeParse({ date: '', title: 't', url: 'javascript:alert(1)' }).success).toBe(false)
  })

  it('contact : e-mail valide ou vide', () => {
    const s = inputSchemaFor(field('access.webmaster'))!
    expect(s.safeParse({ name: 'Agence', email: '', phone: '06' }).success).toBe(true)
    expect(s.safeParse({ name: 'Agence', email: 'pas-un-email', phone: '' }).success).toBe(false)
  })

  it('prestataires : catégorie connue', () => {
    const s = inputSchemaFor(field('venue.prestataires'))!
    const item = { name: 'Studio X', website: '', contact: '' }
    expect(s.safeParse([{ ...item, category: 'photographe' }]).success).toBe(true)
    expect(s.safeParse([{ ...item, category: 'fleuriste' }]).success).toBe(false)
  })

  it('les champs fichier n’ont pas de saisie', () => {
    expect(inputSchemaFor(field('files.photos'))).toBeNull()
  })
})

describe('isFilled', () => {
  it.each([
    ['access.gbp', 'given', true],
    ['access.gbp', 'unsure', false],
    ['access.gbp', 'absent', false],
    ['access.gbp', null, false],
    ['access.wordpress', 'absent', true],
    ['access.search_console', 'absent', true],
    ['venue.chambres', 0, true],
    ['venue.chambres', null, false],
    ['venue.plan_b_pluie', '', false],
    ['venue.plan_b_pluie', 'Salle couverte', true],
    ['venue.piscine', { value: false, detail: '' }, true],
    ['venue.piscine', { value: null, detail: 'peut-être' }, false],
    ['rental.zones_livraison', [], false],
    ['rental.zones_livraison', [''], false],
    ['rental.zones_livraison', ['Vaucluse'], true],
    ['rental.faq', [{ question: 'Livrez-vous ?', answer: '' }], false],
    ['rental.faq', [{ question: 'Livrez-vous ?', answer: 'Oui' }], true],
    ['access.webmaster', { name: 'Agence', email: '', phone: '' }, false],
    ['access.webmaster', { name: 'Agence', email: 'a@b.fr', phone: '' }, true],
    ['hameau.figaro_reference', { date: '', title: 'Titre', url: '' }, false],
    ['hameau.figaro_reference', { date: '2025-06-12', title: 'Titre', url: '' }, true],
    ['decision.robots_ia', { choice: null, comment: '' }, false],
    ['decision.robots_ia', { choice: 'no', comment: '' }, true],
  ] as const)('%s = %j → %s', (key, value, expected) => {
    expect(isFilled(field(key), value)).toBe(expected)
  })

  it('valeur absente ou devenue invalide → non rempli, sans erreur', () => {
    expect(isFilled(field('venue.chambres'), undefined)).toBe(false)
    expect(isFilled(field('venue.chambres'), 'douze')).toBe(false)
  })

  it('adresse « autre » sans texte → non remplie', () => {
    const f = field('decision.adresse')
    const opts = { addressOptions: ['1 rue A'] }
    expect(isFilled(f, { choice: ADDRESS_OTHER, otherText: '', comment: '' }, opts)).toBe(false)
    expect(isFilled(f, { choice: ADDRESS_OTHER, otherText: '2 rue B', comment: '' }, opts)).toBe(true)
    expect(isFilled(f, { choice: '1 rue A', otherText: '', comment: '' }, opts)).toBe(true)
  })

  it('adresse retirée des propositions depuis → non remplie', () => {
    const f = field('decision.adresse')
    expect(isFilled(f, { choice: '1 rue A', otherText: '', comment: '' }, { addressOptions: ['9 rue Z'] })).toBe(
      false
    )
  })
})

describe('accord écrit (démarche d’avis)', () => {
  const f = field('decision.avis')
  const ctx = { now: new Date('2026-10-06T10:00:00Z'), ipTruncated: '203.0.113.0' }

  it('un oui avec un nom est horodaté côté serveur', () => {
    const stored = toStoredValue(f, { choice: 'yes', comment: '', signerName: 'Fabrice M.' }, ctx)
    expect(stored).toEqual({
      choice: 'yes',
      comment: '',
      signerName: 'Fabrice M.',
      signature: { textVersion: 'avis-2026-10', signedAt: '2026-10-06T10:00:00.000Z', ipTruncated: '203.0.113.0' },
    })
    expect(isFilled(f, stored)).toBe(true)
  })

  it('un oui sans nom n’est pas un accord', () => {
    const stored = toStoredValue(f, { choice: 'yes', comment: '', signerName: '' }, ctx)
    expect(stored).toMatchObject({ signature: null })
    expect(isFilled(f, stored)).toBe(false)
  })

  it('un non est une réponse complète, sans signature', () => {
    const stored = toStoredValue(f, { choice: 'no', comment: 'Pas cette année', signerName: '' }, ctx)
    expect(stored).toMatchObject({ choice: 'no', signature: null })
    expect(isFilled(f, stored)).toBe(true)
  })

  it('modifier le commentaire garde la signature d’origine', () => {
    const first = toStoredValue(f, { choice: 'yes', comment: '', signerName: 'Fabrice M.' }, ctx)
    const later = toStoredValue(
      f,
      { choice: 'yes', comment: 'Précision', signerName: 'Fabrice M.' },
      { now: new Date('2026-10-08T09:00:00Z'), ipTruncated: '198.51.100.0', previous: first }
    )
    expect(later).toMatchObject({
      comment: 'Précision',
      signature: { signedAt: '2026-10-06T10:00:00.000Z', ipTruncated: '203.0.113.0' },
    })
  })

  it('changer de signataire signe à nouveau', () => {
    const first = toStoredValue(f, { choice: 'yes', comment: '', signerName: 'Fabrice M.' }, ctx)
    const later = toStoredValue(
      f,
      { choice: 'yes', comment: '', signerName: 'Claire M.' },
      { now: new Date('2026-10-08T09:00:00Z'), ipTruncated: '198.51.100.0', previous: first }
    )
    expect(later).toMatchObject({ signature: { signedAt: '2026-10-08T09:00:00.000Z' } })
  })

  it('le client ne peut pas fabriquer sa propre signature', () => {
    const forged = { choice: 'yes', comment: '', signerName: 'X', signature: { textVersion: 'v0', signedAt: '2020-01-01', ipTruncated: '1.1.1.0' } }
    const stored = toStoredValue(f, forged, ctx) as { signature: { signedAt: string } }
    expect(stored.signature.signedAt).toBe('2026-10-06T10:00:00.000Z')
  })

  it('les autres champs sont enregistrés tels quels', () => {
    expect(toStoredValue(field('venue.chambres'), 4, ctx)).toBe(4)
  })
})
