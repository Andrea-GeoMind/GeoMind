import type { AcceptedFileType, FieldDef } from '@/lib/chantiers/fields'

/**
 * Règles des fichiers déposés dans l'espace client.
 *
 * Le fichier ne passe pas par le serveur (Vercel refuse les corps de plus de
 * 4,5 Mo) : le navigateur l'envoie directement à Supabase Storage avec une
 * adresse signée. Deux contrôles encadrent cet envoi :
 *   1. avant : nom, extension, taille annoncée, espace restant (validateUploadRequest) ;
 *   2. après : le serveur relit les premiers octets et la taille réelle de
 *      l'objet stocké (verifyUploadedFile). Un fichier dont le contenu ne
 *      correspond pas est supprimé.
 * Le bucket applique en plus sa propre limite de 20 Mo et sa liste de types
 * (drizzle/0023_chantiers.sql) — les valeurs doivent rester alignées.
 */

export const MAX_FILE_BYTES = 20 * 1024 * 1024
export const CHANTIER_QUOTA_BYTES = 300 * 1024 * 1024
/** Octets relus pour reconnaître le type réel */
export const SIGNATURE_BYTES = 4096

const EXTENSION_TYPES: Record<string, AcceptedFileType> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heic',
  pdf: 'application/pdf',
  csv: 'text/csv',
}

export type UploadError =
  | 'svg_refused'
  | 'type_not_accepted'
  | 'empty'
  | 'too_large'
  | 'quota_exceeded'
  | 'content_mismatch'
  | 'attestation_required'
  | 'not_received'

export const UPLOAD_ERROR_MESSAGES: Record<UploadError, string> = {
  svg_refused:
    'Les fichiers SVG ne sont pas acceptés, car ils peuvent contenir du code. Exportez votre logo en PDF ou en PNG.',
  type_not_accepted: 'Ce type de fichier n’est pas accepté ici.',
  empty: 'Ce fichier est vide.',
  too_large: 'Ce fichier dépasse 20 Mo.',
  quota_exceeded:
    'L’espace de ce chantier est plein (300 Mo). Écrivez-nous : nous libérerons de la place.',
  content_mismatch:
    'Le contenu de ce fichier ne correspond pas à son type. Il n’a pas été conservé.',
  attestation_required:
    'Cochez d’abord la case sur les droits des photos, juste au-dessus.',
  not_received: 'Le fichier n’est pas arrivé jusqu’à nous. Réessayez.',
}

export const ACCEPTED_TYPE_LABELS: Record<AcceptedFileType, string> = {
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'image/heic': 'HEIC',
  'application/pdf': 'PDF',
  'text/csv': 'CSV',
}

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  return dot === -1 ? '' : fileName.slice(dot + 1).toLowerCase()
}

type UploadCheck = { ok: true; expectedType: AcceptedFileType } | { ok: false; error: UploadError }

/**
 * Contrôle avant d'émettre l'adresse d'envoi. Le type annoncé par le
 * navigateur n'est pas fiable (souvent vide pour les HEIC) : on se fie à
 * l'extension ici, et au contenu réel après l'envoi.
 */
export function validateUploadRequest(params: {
  fileName: string
  sizeBytes: number
  accept: readonly AcceptedFileType[]
  usedBytes: number
}): UploadCheck {
  const ext = extensionOf(params.fileName)
  if (ext === 'svg' || ext === 'svgz') return { ok: false, error: 'svg_refused' }

  const expectedType = EXTENSION_TYPES[ext]
  if (!expectedType || !params.accept.includes(expectedType)) {
    return { ok: false, error: 'type_not_accepted' }
  }
  if (params.sizeBytes <= 0) return { ok: false, error: 'empty' }
  if (params.sizeBytes > MAX_FILE_BYTES) return { ok: false, error: 'too_large' }
  if (params.usedBytes + params.sizeBytes > CHANTIER_QUOTA_BYTES) {
    return { ok: false, error: 'quota_exceeded' }
  }
  return { ok: true, expectedType }
}

function startsWith(bytes: Uint8Array, signature: readonly number[], offset = 0): boolean {
  return signature.every((b, i) => bytes[offset + i] === b)
}

function ascii(bytes: Uint8Array, from: number, to: number): string {
  return String.fromCharCode(...bytes.subarray(from, to))
}

/** Marques ISO-BMFF des images HEIF/HEIC (photos d'iPhone) */
const HEIF_BRANDS = new Set(['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1'])

/** Type binaire reconnu sur les premiers octets, ou null. */
export function detectBinaryType(head: Uint8Array): Exclude<AcceptedFileType, 'text/csv'> | null {
  if (startsWith(head, [0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'
  if (head.length >= 12 && ascii(head, 0, 4) === 'RIFF' && ascii(head, 8, 12) === 'WEBP') {
    return 'image/webp'
  }
  if (head.length >= 12 && ascii(head, 4, 8) === 'ftyp' && HEIF_BRANDS.has(ascii(head, 8, 12))) {
    return 'image/heic'
  }
  // La norme PDF tolère des octets avant l'en-tête, dans les 1 024 premiers
  if (ascii(head, 0, Math.min(head.length, 1024)).includes('%PDF-')) return 'application/pdf'
  return null
}

/**
 * Un CSV n'a pas de signature : on vérifie que c'est du texte. Pas d'octet
 * nul, presque uniquement des caractères imprimables (les octets ≥ 0x80 de
 * l'UTF-8 ou du Windows-1252 sont admis), et pas de balisage en tête (HTML,
 * SVG ou XML déguisé en .csv).
 */
export function looksLikeCsv(head: Uint8Array): boolean {
  if (head.length === 0) return false
  let control = 0
  for (const b of head) {
    if (b === 0) return false
    const isWhitespace = b === 0x09 || b === 0x0a || b === 0x0d
    if (!isWhitespace && (b < 0x20 || b === 0x7f)) control++
  }
  if (control / head.length > 0.01) return false

  const start = new TextDecoder('utf-8', { fatal: false })
    .decode(head.subarray(0, 256))
    .replace(/^﻿/, '')
    .trimStart()
  return !start.startsWith('<')
}

/** Contrôle après l'envoi, sur l'objet réellement stocké. */
export function verifyUploadedFile(params: {
  head: Uint8Array
  actualSize: number
  accept: readonly AcceptedFileType[]
}): { ok: true; detectedType: AcceptedFileType } | { ok: false; error: UploadError } {
  if (params.actualSize <= 0) return { ok: false, error: 'empty' }
  if (params.actualSize > MAX_FILE_BYTES) return { ok: false, error: 'too_large' }

  const binary = detectBinaryType(params.head)
  const detected: AcceptedFileType | null =
    binary ?? (params.accept.includes('text/csv') && looksLikeCsv(params.head) ? 'text/csv' : null)

  if (!detected || !params.accept.includes(detected)) return { ok: false, error: 'content_mismatch' }
  return { ok: true, detectedType: detected }
}

/** Espace occupé : fichiers en attente (taille annoncée) et conservés. */
export function usedBytes(files: readonly { sizeBytes: number; status: string }[]): number {
  return files.filter((f) => f.status !== 'deleted').reduce((sum, f) => sum + f.sizeBytes, 0)
}

/**
 * Nom d'origine nettoyé, pour l'affichage et le téléchargement : sans chemin,
 * sans caractère de contrôle, 150 caractères au plus en gardant l'extension.
 */
export function safeOriginalName(name: string): string {
  const base = (name.split(/[\\/]/).pop() ?? '')
    .replace(/[\u0000-\u001f\u007f"]/g, '')
    .trim()
  if (!base) return 'fichier'
  if (base.length <= 150) return base
  const ext = extensionOf(base)
  const keep = ext ? 150 - ext.length - 1 : 150
  return ext ? `${base.slice(0, keep)}.${ext}` : base.slice(0, keep)
}

/** Chemin dans le bucket : jamais le nom d'origine. */
export function storagePathFor(chantierId: string, fileId: string): string {
  return `${chantierId}/${fileId}`
}

/** Date de suppression automatique, si le champ en prévoit une. */
export function fileExpiryFor(field: FieldDef, uploadedAt: Date): Date | null {
  if (field.type !== 'file' || !field.retentionDays) return null
  return new Date(uploadedAt.getTime() + field.retentionDays * 24 * 60 * 60 * 1000)
}

/** Bucket privé des espaces chantier (drizzle/0023_chantiers.sql). */
export const CHANTIER_BUCKET = 'chantier-files'

/**
 * Durée de vie d'un dépôt commencé mais jamais confirmé. L'adresse d'envoi
 * signée par Supabase vaut 2 h : passé ce délai, plus rien ne peut arriver,
 * le dépôt est abandonné et nettoyé (il ne compte plus dans les 300 Mo).
 */
export const PENDING_UPLOAD_TTL_MS = 2 * 60 * 60 * 1000

export function isAbandonedUpload(
  file: { status: string; createdAt: Date },
  now: Date
): boolean {
  return file.status === 'pending' && now.getTime() - file.createdAt.getTime() >= PENDING_UPLOAD_TTL_MS
}

const TYPE_EXTENSIONS: Record<AcceptedFileType, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic', '.heif'],
  'application/pdf': ['.pdf'],
  'text/csv': ['.csv'],
}

/** Valeur de l'attribut accept du sélecteur de fichiers. */
export function acceptAttribute(accept: readonly AcceptedFileType[]): string {
  return accept.flatMap((t) => [...TYPE_EXTENSIONS[t], t]).join(',')
}

/** Taille lisible : « 3,4 Mo », « 820 Ko ». */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`
  }
  return `${Math.max(1, Math.round(bytes / 1024))} Ko`
}

/** Fichier tel que le voit l'espace client : jamais de chemin de stockage. */
export interface ChantierFileView {
  id: string
  establishmentId: string | null
  fieldKey: string
  originalName: string
  sizeBytes: number
  status: 'pending' | 'ready' | 'deleted'
  createdAt: string
  expiresAt: string | null
}
