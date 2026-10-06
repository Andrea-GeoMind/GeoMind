import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildChantierMarkdown, exportFileName, type ExportInput } from '@/lib/chantiers/export'

const T = new Date('2026-10-06T18:00:00Z')
const C = 'c0000000-0000-4000-8000-000000000000'
const E = 'e0000000-0000-4000-8000-000000000000'

const input: ExportInput = {
  now: T,
  chantier: {
    id: C, ownerId: 'o', clientName: 'Home Sweet Event', contactEmail: null, status: 'open',
    options: { extraFields: ['hse.liste_maries'] }, tokenHash: 'h', tokenExpiresAt: new Date('2026-12-05T12:00:00Z'),
    tokenRevokedAt: null, submittedAt: null, activityNotifiedThrough: null, expiryReminderSentAt: null, createdAt: T, updatedAt: T,
  },
  establishments: [
    { id: E, chantierId: C, kind: 'venue', name: 'Mas de Florette', website: 'https://masdeflorette.com', position: 0, options: { addressOptions: ['La Verrerie, 84220 Lioux'] }, createdAt: T },
  ],
  answers: [
    { id: '1', chantierId: C, establishmentId: E, fieldKey: 'access.gbp', value: 'unsure', updatedBy: 'client', updatedAt: T },
    { id: '2', chantierId: C, establishmentId: E, fieldKey: 'venue.plan_b_pluie', value: 'Salle voûtée | 120 places\nchauffée', updatedBy: 'client', updatedAt: T },
    { id: '3', chantierId: C, establishmentId: null, fieldKey: 'decision.avis', value: { choice: 'yes', comment: '', signerName: 'Fabrice M.', signature: { textVersion: 'avis-2026-10', signedAt: '2026-10-06T18:20:37.000Z', ipTruncated: '88.184.85.0' } }, updatedBy: 'client', updatedAt: T },
  ],
  files: [
    { id: 'f1', chantierId: C, establishmentId: E, fieldKey: 'files.photos', category: 'photo', storagePath: `${C}/f1`, originalName: 'terrasse | soir.jpg', mimeType: 'image/jpeg', sizeBytes: 3_500_000, status: 'ready', expiresAt: null, deletedReason: null, deletedAt: null, createdAt: T },
    { id: 'f2', chantierId: C, establishmentId: null, fieldKey: 'hse.liste_maries', category: 'personal_data', storagePath: `${C}/f2`, originalName: 'maries.csv', mimeType: 'text/csv', sizeBytes: 900, status: 'ready', expiresAt: new Date('2026-11-05T18:00:00Z'), deletedReason: null, deletedAt: null, createdAt: T },
    { id: 'f3', chantierId: C, establishmentId: E, fieldKey: 'files.logo', category: 'logo', storagePath: `${C}/f3`, originalName: 'ancien.png', mimeType: 'image/png', sizeBytes: 10, status: 'deleted', expiresAt: null, deletedReason: 'purge', deletedAt: T, createdAt: T },
  ],
}

describe('export Markdown', () => {
  const md = buildChantierMarkdown(input)

  it('titre, état et avancement', () => {
    expect(md.startsWith('# Chantier Home Sweet Event\n')).toBe(true)
    expect(md).toMatch(/- État : En cours · lien valable jusqu’au 5 décembre 2026/)
    expect(md).toMatch(/- Avancement : \d+ %/)
  })

  it('demandes d’aide et bloquants en tête', () => {
    expect(md).toMatch(/## Demandes d’aide\n\n- Fiche Google : GeoMind ajouté comme gestionnaire \(Mas de Florette\)/)
    expect(md.indexOf('## Bloquants restants')).toBeLessThan(md.indexOf('## Mas de Florette'))
  })

  it('chaque champ, par établissement puis par section, vide signalé', () => {
    expect(md).toMatch(/## Mas de Florette\n\nlieu de réception · https:\/\/masdeflorette\.com/)
    expect(md).toMatch(/### Informations[\s\S]*- \*\*Capacité en repas assis\*\* : _vide_/)
    expect(md).toMatch(/- \*\*Fiche Google : GeoMind ajouté comme gestionnaire\*\* ⚠ bloquant : Je ne sais pas comment faire/)
  })

  it('les valeurs sur plusieurs lignes restent sous leur puce', () => {
    expect(md).toMatch(/- \*\*Plan B en cas de pluie\*\* : Salle voûtée \\\| 120 places\n  chauffée/)
  })

  it('accords avec nom, date et heure', () => {
    const accords = md.slice(md.indexOf('\n## Accords'), md.indexOf('\n## Fichiers'))
    expect(accords).toMatch(/- \*\*Démarche d’avis\*\* : Oui — accord donné par Fabrice M\. le 6 octobre 2026 à 20:20, texte avis-2026-10, IP 88\.184\.85\.0/)
    expect(accords).toMatch(/- \*\*Droits sur les photos\*\* : _pas encore donné_/)
  })

  it('liste des fichiers, sans les fichiers supprimés, tableau protégé', () => {
    expect(md).toMatch(/\| terrasse \\\| soir\.jpg \| Photos \| Mas de Florette \| 3,3 Mo \|/)
    expect(md).toMatch(/\| maries\.csv \| Liste des mariés des deux dernières saisons \| chantier \|.*suppression prévue le 5 novembre 2026/)
    expect(md).not.toMatch(/ancien\.png/)
    expect(md).toMatch(/1 fichier\(s\) supprimé\(s\) du stockage/)
  })

  it('aucun chemin de stockage ni jeton dans l’export', () => {
    expect(md).not.toMatch(new RegExp(`${C}/`))
    expect(md).not.toMatch(/token|tokenHash/)
  })

  it('nom de fichier sans accents ni espaces', () => {
    expect(exportFileName('Home Sweet Event', T)).toBe('chantier-home-sweet-event-2026-10-06.md')
    expect(exportFileName('Hameau de l’Esperelle', T)).toBe('chantier-hameau-de-l-esperelle-2026-10-06.md')
  })
})

describe('injection dans l’export (audit du 07/10/2026)', () => {
  const hostile = buildChantierMarkdown({
    ...input,
    establishments: [{ ...input.establishments[0]!, name: 'Mas <b>gras</b>' }],
    answers: [
      ...input.answers,
      {
        id: '9', chantierId: C, establishmentId: E, fieldKey: 'venue.unique', updatedBy: 'client', updatedAt: T,
        value: "<script>alert('xss')</script> ![suivi](https://evil.example/pixel.png) [clic](javascript:alert(1)) # titre",
      },
    ],
    files: [{ ...input.files[0]!, originalName: '<svg onload=alert(3)>[x](javascript:alert(4)).pdf' }],
  })

  it('aucune balise HTML ne survit', () => {
    expect(hostile).not.toMatch(/<script|<img|<svg|<b>/)
    expect(hostile).toContain('&lt;script&gt;')
  })

  it('ni image distante, ni lien : la syntaxe Markdown est neutralisée', () => {
    expect(hostile).not.toMatch(/!\[suivi\]\(/)
    expect(hostile).not.toMatch(/\]\(javascript:/)
    expect(hostile).toContain('!\\[suivi\\]\\(https://evil.example/pixel.png\\)')
  })

  it('un # saisi ne crée pas de titre', () => {
    expect(hostile).toContain('\\# titre')
  })
})

describe('vue GeoMind en lecture seule', () => {
  it('ni la page ni les actions admin n’écrivent de réponse', () => {
    for (const f of ['app/(app)/dashboard/chantiers/[id]/page.tsx', 'app/(app)/dashboard/chantiers/actions.ts']) {
      const src = readFileSync(f, 'utf8')
      expect(src, f).not.toMatch(/saveChantierAnswer|saveChantierFieldAction|chantierAnswers|toStoredValue|FieldControl/)
    }
  })
})
