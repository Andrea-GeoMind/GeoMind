import { describe, it, expect } from 'vitest'
import {
  CHANTIER_QUOTA_BYTES,
  MAX_FILE_BYTES,
  detectBinaryType,
  fileExpiryFor,
  looksLikeCsv,
  safeOriginalName,
  storagePathFor,
  usedBytes,
  validateUploadRequest,
  verifyUploadedFile,
} from '@/lib/chantiers/files'
import { IMAGE_OR_PDF, IMAGES_ONLY, getField } from '@/lib/chantiers/fields'

const bytes = (...parts: (number[] | string)[]) =>
  new Uint8Array(parts.flatMap((p) => (typeof p === 'string' ? [...Buffer.from(p, 'latin1')] : p)))

const JPEG = bytes([0xff, 0xd8, 0xff, 0xe0, 0, 0x10], 'JFIF')
const PNG = bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d], 'IHDR')
const WEBP = bytes('RIFF', [0x24, 0, 0, 0], 'WEBPVP8 ')
const HEIC = bytes([0, 0, 0, 0x18], 'ftypheic', [0, 0, 0, 0], 'mif1heic')
const AVIF = bytes([0, 0, 0, 0x1c], 'ftypavif', [0, 0, 0, 0], 'avifmif1')
const PDF = bytes('%PDF-1.7\n%\xe2\xe3\xcf\xd3\n')
const SVG = bytes('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')
const HTML = bytes('<!doctype html><html><body>hi</body></html>')
const CSV = bytes('nom;email;date\nDupont;dupont@example.fr;2025-06-14\n')
const CSV_BOM_1252 = bytes([0xef, 0xbb, 0xbf], 'Nom;Email\nB\xe9atrice;b@example.fr\r\n')
const ZIP = bytes([0x50, 0x4b, 0x03, 0x04, 0x14, 0, 0, 0, 0x08, 0])
const EXE = bytes('MZ', [0x90, 0, 0x03, 0, 0, 0, 0x04, 0])

describe('detectBinaryType', () => {
  it.each([
    ['JPEG', JPEG, 'image/jpeg'],
    ['PNG', PNG, 'image/png'],
    ['WebP', WEBP, 'image/webp'],
    ['HEIC', HEIC, 'image/heic'],
    ['PDF', PDF, 'application/pdf'],
    ['PDF précédé d’octets parasites', bytes([0x0a, 0x0a], '%PDF-1.4'), 'application/pdf'],
    ['AVIF (non accepté)', AVIF, null],
    ['SVG', SVG, null],
    ['HTML', HTML, null],
    ['ZIP', ZIP, null],
    ['exécutable Windows', EXE, null],
    ['vide', new Uint8Array(), null],
  ])('%s', (_, head, expected) => {
    expect(detectBinaryType(head)).toBe(expected)
  })
})

describe('looksLikeCsv', () => {
  it('reconnaît un CSV UTF-8 et un CSV Excel (BOM, accents, CRLF)', () => {
    expect(looksLikeCsv(CSV)).toBe(true)
    expect(looksLikeCsv(CSV_BOM_1252)).toBe(true)
  })

  it('refuse le balisage, le binaire et le vide', () => {
    expect(looksLikeCsv(SVG)).toBe(false)
    expect(looksLikeCsv(HTML)).toBe(false)
    expect(looksLikeCsv(bytes('  \n<script>alert(1)</script>'))).toBe(false)
    expect(looksLikeCsv(ZIP)).toBe(false)
    expect(looksLikeCsv(JPEG)).toBe(false)
    expect(looksLikeCsv(new Uint8Array())).toBe(false)
  })
})

describe('validateUploadRequest', () => {
  const ok = { sizeBytes: 1_000_000, accept: IMAGE_OR_PDF, usedBytes: 0 }

  it.each(['photo.jpg', 'photo.JPEG', 'plan.png', 'img.webp', 'IMG_4093.HEIC', 'img.heif', 'plaquette.pdf'])(
    '%s accepté',
    (fileName) => {
      expect(validateUploadRequest({ ...ok, fileName }).ok).toBe(true)
    }
  )

  it('déduit le type attendu de l’extension', () => {
    expect(validateUploadRequest({ ...ok, fileName: 'IMG_4093.HEIC' })).toEqual({
      ok: true,
      expectedType: 'image/heic',
    })
  })

  it('SVG refusé avec un message dédié', () => {
    expect(validateUploadRequest({ ...ok, fileName: 'logo.svg' })).toEqual({ ok: false, error: 'svg_refused' })
    expect(validateUploadRequest({ ...ok, fileName: 'logo.SVGZ' })).toEqual({ ok: false, error: 'svg_refused' })
  })

  it.each(['logo.ai', 'logo.eps', 'doc.docx', 'archive.zip', 'sans-extension', 'photo.jpg.exe', 'liste.csv'])(
    '%s refusé ici',
    (fileName) => {
      expect(validateUploadRequest({ ...ok, fileName })).toEqual({ ok: false, error: 'type_not_accepted' })
    }
  )

  it('PDF refusé dans les photos', () => {
    expect(validateUploadRequest({ ...ok, accept: IMAGES_ONLY, fileName: 'a.pdf' }).ok).toBe(false)
  })

  it('CSV accepté pour la liste des mariés', () => {
    const f = getField('hse.liste_maries')
    if (f?.type !== 'file') throw new Error('champ attendu')
    expect(validateUploadRequest({ ...ok, accept: f.accept, fileName: 'maries.csv' }).ok).toBe(true)
  })

  it('20 Mo pile acceptés, un octet de plus refusé', () => {
    expect(validateUploadRequest({ ...ok, fileName: 'a.jpg', sizeBytes: MAX_FILE_BYTES }).ok).toBe(true)
    expect(validateUploadRequest({ ...ok, fileName: 'a.jpg', sizeBytes: MAX_FILE_BYTES + 1 })).toEqual({
      ok: false,
      error: 'too_large',
    })
  })

  it('fichier vide refusé', () => {
    expect(validateUploadRequest({ ...ok, fileName: 'a.jpg', sizeBytes: 0 })).toEqual({ ok: false, error: 'empty' })
  })

  it('plafond de 300 Mo par chantier', () => {
    expect(
      validateUploadRequest({ ...ok, fileName: 'a.jpg', usedBytes: CHANTIER_QUOTA_BYTES - 1_000_000 }).ok
    ).toBe(true)
    expect(
      validateUploadRequest({ ...ok, fileName: 'a.jpg', usedBytes: CHANTIER_QUOTA_BYTES - 999_999 })
    ).toEqual({ ok: false, error: 'quota_exceeded' })
  })
})

describe('verifyUploadedFile', () => {
  it('accepte un contenu conforme et renvoie le type détecté', () => {
    expect(verifyUploadedFile({ head: JPEG, actualSize: 5000, accept: IMAGES_ONLY })).toEqual({
      ok: true,
      detectedType: 'image/jpeg',
    })
  })

  it('un PNG nommé .jpg reste accepté sous son vrai type', () => {
    expect(verifyUploadedFile({ head: PNG, actualSize: 5000, accept: IMAGES_ONLY })).toEqual({
      ok: true,
      detectedType: 'image/png',
    })
  })

  it.each([
    ['SVG renommé en .png', SVG],
    ['HTML renommé en .jpg', HTML],
    ['ZIP renommé en .pdf', ZIP],
    ['exécutable renommé en .heic', EXE],
  ])('%s → rejeté', (_, head) => {
    expect(verifyUploadedFile({ head, actualSize: 5000, accept: IMAGE_OR_PDF })).toEqual({
      ok: false,
      error: 'content_mismatch',
    })
  })

  it('un PDF déposé dans les photos est rejeté', () => {
    expect(verifyUploadedFile({ head: PDF, actualSize: 5000, accept: IMAGES_ONLY }).ok).toBe(false)
  })

  it('du texte n’est reconnu comme CSV que là où le CSV est accepté', () => {
    expect(verifyUploadedFile({ head: CSV, actualSize: 50, accept: IMAGE_OR_PDF }).ok).toBe(false)
    expect(verifyUploadedFile({ head: CSV, actualSize: 50, accept: ['text/csv', 'application/pdf'] })).toEqual({
      ok: true,
      detectedType: 'text/csv',
    })
  })

  it('la taille réelle compte, pas la taille annoncée', () => {
    expect(verifyUploadedFile({ head: JPEG, actualSize: MAX_FILE_BYTES + 1, accept: IMAGES_ONLY })).toEqual({
      ok: false,
      error: 'too_large',
    })
    expect(verifyUploadedFile({ head: JPEG, actualSize: 0, accept: IMAGES_ONLY })).toEqual({
      ok: false,
      error: 'empty',
    })
  })
})

describe('utilitaires', () => {
  it('usedBytes ignore les fichiers supprimés', () => {
    expect(
      usedBytes([
        { sizeBytes: 100, status: 'ready' },
        { sizeBytes: 50, status: 'pending' },
        { sizeBytes: 1000, status: 'deleted' },
      ])
    ).toBe(150)
  })

  it.each([
    ['C:\\Users\\x\\photo.jpg', 'photo.jpg'],
    ['../../etc/passwd', 'passwd'],
    ['a"b\u0000c.pdf', 'abc.pdf'],
    ['   ', 'fichier'],
  ])('safeOriginalName(%j) → %j', (input, expected) => {
    expect(safeOriginalName(input)).toBe(expected)
  })

  it('safeOriginalName raccourcit en gardant l’extension', () => {
    const name = safeOriginalName(`${'a'.repeat(300)}.jpeg`)
    expect(name).toHaveLength(150)
    expect(name.endsWith('.jpeg')).toBe(true)
  })

  it('le chemin de stockage ne contient jamais le nom d’origine', () => {
    expect(storagePathFor('c1', 'f1')).toBe('c1/f1')
  })

  it('liste des mariés supprimée 30 jours après le dépôt ; les photos jamais', () => {
    const at = new Date('2026-10-06T10:00:00Z')
    expect(fileExpiryFor(getField('hse.liste_maries')!, at)?.toISOString()).toBe('2026-11-05T10:00:00.000Z')
    expect(fileExpiryFor(getField('files.photos')!, at)).toBeNull()
  })
})
