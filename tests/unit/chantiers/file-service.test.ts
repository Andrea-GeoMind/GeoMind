import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  PENDING_UPLOAD_TTL_MS,
  acceptAttribute,
  formatFileSize,
  isAbandonedUpload,
  storagePathFor,
} from '@/lib/chantiers/files'
import { IMAGE_OR_PDF } from '@/lib/chantiers/fields'
import { validateFileTarget, type SaveContext } from '@/lib/chantiers/save'

/**
 * Règles de S2.5 : nom de stockage aléatoire, aucun affichage de fichier,
 * téléchargement en pièce jointe, dépôts abandonnés nettoyés, suppression
 * effective du stockage (pas seulement de la base).
 */

const service = readFileSync('lib/chantiers/file-service.ts', 'utf8')
const storage = readFileSync('lib/chantiers/storage-admin.ts', 'utf8')

describe('dépôts abandonnés', () => {
  const now = new Date('2026-10-06T12:00:00Z')
  const at = (ms: number) => new Date(now.getTime() - ms)

  it('un dépôt en attente depuis 2 h est abandonné, pas avant', () => {
    expect(isAbandonedUpload({ status: 'pending', createdAt: at(PENDING_UPLOAD_TTL_MS) }, now)).toBe(true)
    expect(isAbandonedUpload({ status: 'pending', createdAt: at(PENDING_UPLOAD_TTL_MS - 1000) }, now)).toBe(false)
  })

  it('un fichier vérifié n’est jamais considéré abandonné', () => {
    expect(isAbandonedUpload({ status: 'ready', createdAt: at(10 * PENDING_UPLOAD_TTL_MS) }, now)).toBe(false)
  })

  it('le délai suit la validité de l’adresse d’envoi signée (2 h)', () => {
    expect(PENDING_UPLOAD_TTL_MS).toBe(2 * 60 * 60 * 1000)
  })
})

describe('stockage', () => {
  it('nom de stockage aléatoire : identifiant tiré au hasard, jamais le nom d’origine', () => {
    expect(service).toMatch(/const fileId = randomUUID\(\)/)
    expect(service).toMatch(/const storagePath = storagePathFor\(params\.chantierId, fileId\)/)
    expect(storagePathFor('c', 'f')).toBe('c/f')
    expect(service).not.toMatch(/storagePathFor\([^)]*fileName/)
  })

  it('le nom d’origine est nettoyé avant d’être enregistré', () => {
    expect(service).toMatch(/originalName: safeOriginalName\(params\.fileName\)/)
  })

  it('toute suppression retire d’abord l’objet du stockage', () => {
    const body = service.slice(service.indexOf('async function deleteRows'), service.indexOf('/** Fichiers vivants'))
    expect(body.indexOf('removeObjects(')).toBeGreaterThan(-1)
    expect(body.indexOf('removeObjects(')).toBeLessThan(body.indexOf('.update(chantierFiles)'))
    // Aucune autre façon de passer un fichier à « deleted »
    expect(service.match(/status: 'deleted'/g)).toHaveLength(1)
  })

  it('téléchargement : adresse signée courte, en pièce jointe', () => {
    expect(storage).toMatch(/const DOWNLOAD_URL_TTL_SECONDS = 60\b/)
    expect(storage).toMatch(/createSignedUrl\(path, DOWNLOAD_URL_TTL_SECONDS, \{\s*download: downloadName,/)
  })

  it('le téléchargement vérifie le propriétaire du chantier et le statut du fichier', () => {
    const body = service.slice(service.indexOf('export async function fileDownloadUrlForOwner'))
    expect(body).toMatch(/eq\(chantiers\.ownerId, ownerId\)/)
    expect(body).toMatch(/eq\(chantierFiles\.status, 'ready'\)/)
  })

  it('le contenu est vérifié après l’envoi, l’objet non conforme est retiré', () => {
    expect(service).toMatch(/readObjectHead\(row\.storagePath, SIGNATURE_BYTES\)/)
    expect(service).toMatch(/verifyUploadedFile\(/)
    expect(service).toMatch(/await deleteRows\(\[row\], 'rejected', now\)/)
  })
})

describe('aucun fichier affiché dans une page', () => {
  it('l’espace client ne demande jamais d’adresse de lecture', () => {
    for (const f of [
      'components/features/chantier-space/file-field.tsx',
      'components/features/chantier-space/chantier-space.tsx',
      'app/chantier/espace/actions.ts',
      'app/chantier/espace/page.tsx',
    ]) {
      const src = readFileSync(f, 'utf8')
      expect(src, f).not.toMatch(/createDownloadUrl|createSignedUrl|fileDownloadUrlForOwner|<(img|iframe|embed|object)\s/)
    }
  })

  it('la vue GeoMind ne fait que télécharger', () => {
    const page = readFileSync('app/(app)/dashboard/chantiers/[id]/page.tsx', 'utf8')
    expect(page).not.toMatch(/<(img|iframe|embed|object)\s|next\/image/)
    expect(readFileSync('components/features/chantiers/file-download-button.tsx', 'utf8')).toMatch(
      /window\.location\.assign\(result\.url\)/
    )
  })
})

describe('tâche planifiée d’entretien', () => {
  const fn = readFileSync('lib/inngest/functions/chantier-files-maintenance.ts', 'utf8')

  it('tourne toutes les heures et peut être lancée à la demande', () => {
    expect(fn).toMatch(/\{ cron: '20 \* \* \* \*' \}/)
    expect(fn).toMatch(/\{ event: 'chantier\.files\.maintenance\.requested' \}/)
  })

  it('nettoie les dépôts abandonnés et supprime les fichiers expirés', () => {
    expect(fn).toMatch(/cleanupAbandonedUploads\(\{\}\)/)
    expect(fn).toMatch(/deleteExpiredFiles\(\)/)
  })
})

describe('utilitaires d’affichage', () => {
  it('accept : extensions et types', () => {
    expect(acceptAttribute(IMAGE_OR_PDF)).toBe(
      '.jpg,.jpeg,image/jpeg,.png,image/png,.webp,image/webp,.heic,.heif,image/heic,.pdf,application/pdf'
    )
  })

  it.each([
    [500, '1 Ko'],
    [820 * 1024, '820 Ko'],
    [3.4 * 1024 * 1024, '3,4 Mo'],
    [20 * 1024 * 1024, '20 Mo'],
  ])('formatFileSize(%d) → %s', (bytes, expected) => {
    expect(formatFileSize(bytes).replace(/ | /g, ' ')).toBe(expected)
  })
})

describe('validateFileTarget', () => {
  const ctx: SaveContext = {
    chantierOptions: { extraFields: ['hse.liste_maries'] },
    establishments: [{ id: '11111111-1111-4111-8111-111111111111', kind: 'venue', options: {} }],
  }
  const E1 = ctx.establishments[0]!.id

  it('accepte un emplacement de fichier de l’établissement', () => {
    expect(validateFileTarget(ctx, { establishmentId: E1, fieldKey: 'files.photos' })).toMatchObject({ ok: true })
  })

  it('accepte la liste des mariés au niveau du chantier', () => {
    const r = validateFileTarget(ctx, { establishmentId: null, fieldKey: 'hse.liste_maries' })
    expect(r.ok && r.field.category).toBe('personal_data')
  })

  it.each([
    [{ establishmentId: E1, fieldKey: 'venue.chambres' }, 'not_file_field'],
    [{ establishmentId: null, fieldKey: 'files.photos' }, 'wrong_scope'],
    [{ establishmentId: E1, fieldKey: 'hse.liste_maries' }, 'wrong_scope'],
    [{ establishmentId: E1, fieldKey: 'hameau.figaro_file' }, 'not_enabled'],
    [{ establishmentId: '22222222-2222-4222-8222-222222222222', fieldKey: 'files.logo' }, 'unknown_establishment'],
    [{ establishmentId: E1, fieldKey: 'files.inconnu' }, 'unknown_field'],
  ])('%j → %s', (req, error) => {
    expect(validateFileTarget(ctx, req)).toEqual({ ok: false, error })
  })
})
