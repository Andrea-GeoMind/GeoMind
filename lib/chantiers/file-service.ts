import 'server-only'
import { randomUUID } from 'crypto'
import { and, eq, inArray, isNotNull, lte, ne } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { chantierFiles, chantiers } from '@/lib/db/schema'
import { getField, missingAttestation, type FieldDef } from '@/lib/chantiers/fields'
import {
  CHANTIER_QUOTA_BYTES,
  PENDING_UPLOAD_TTL_MS,
  SIGNATURE_BYTES,
  fileExpiryFor,
  safeOriginalName,
  storagePathFor,
  usedBytes,
  validateUploadRequest,
  verifyUploadedFile,
  type ChantierFileView,
  type UploadError,
} from '@/lib/chantiers/files'
import {
  createDownloadUrl,
  createSignedUpload,
  readObjectHead,
  removeObjects,
} from '@/lib/chantiers/storage-admin'

/**
 * Fichiers de l'espace chantier : la base (chantier_files) et le stockage
 * (bucket privé) évoluent toujours ensemble. Un fichier « supprimé » l'est
 * des deux côtés : l'objet est retiré du bucket, la ligne garde la trace
 * (nom, taille, date, raison) sans plus pointer vers aucun contenu.
 *
 * L'appelant a vérifié l'accès (lien du client ou admin propriétaire) ; chaque
 * fonction filtre en plus par chantier.
 */

type FileField = Extract<FieldDef, { type: 'file' }>
type FileRow = typeof chantierFiles.$inferSelect

export type { ChantierFileView }

export type DeletedReason = 'client' | 'replaced' | 'purge' | 'expired' | 'rejected' | 'abandoned' | 'missing'

function toView(row: FileRow): ChantierFileView {
  return {
    id: row.id,
    establishmentId: row.establishmentId,
    fieldKey: row.fieldKey,
    originalName: row.originalName,
    sizeBytes: row.sizeBytes,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt?.toISOString() ?? null,
  }
}

/** Retire les objets du bucket puis marque les lignes supprimées. */
async function deleteRows(rows: FileRow[], reason: DeletedReason, now: Date): Promise<void> {
  if (rows.length === 0) return
  await removeObjects(rows.map((r) => r.storagePath))
  await db
    .update(chantierFiles)
    .set({ status: 'deleted', deletedReason: reason, deletedAt: now })
    .where(inArray(chantierFiles.id, rows.map((r) => r.id)))
}

/** Fichiers vivants d'un chantier (en attente compris : ils comptent dans les 300 Mo). */
export async function listLiveFiles(chantierId: string): Promise<FileRow[]> {
  return db
    .select()
    .from(chantierFiles)
    .where(and(eq(chantierFiles.chantierId, chantierId), ne(chantierFiles.status, 'deleted')))
    .orderBy(chantierFiles.createdAt)
}

export async function listFilesForClient(chantierId: string): Promise<ChantierFileView[]> {
  return (await listLiveFiles(chantierId)).map(toView)
}

/**
 * Dépôts commencés mais jamais confirmés depuis plus de 2 h (onglet fermé
 * pendant l'envoi…) : l'objet éventuellement arrivé est retiré, la ligne ne
 * compte plus dans l'espace occupé. Un chantier, ou tous.
 */
export async function cleanupAbandonedUploads(
  scope: { chantierId?: string },
  now: Date = new Date()
): Promise<number> {
  const cutoff = new Date(now.getTime() - PENDING_UPLOAD_TTL_MS)
  const rows = await db
    .select()
    .from(chantierFiles)
    .where(
      and(
        eq(chantierFiles.status, 'pending'),
        lte(chantierFiles.createdAt, cutoff),
        scope.chantierId ? eq(chantierFiles.chantierId, scope.chantierId) : undefined
      )
    )
  await deleteRows(rows, 'abandoned', now)
  return rows.length
}

/** Fichiers arrivés à leur date de suppression (liste des mariés : dépôt + 30 jours). */
export async function deleteExpiredFiles(now: Date = new Date()): Promise<number> {
  const rows = await db
    .select()
    .from(chantierFiles)
    .where(
      and(
        ne(chantierFiles.status, 'deleted'),
        isNotNull(chantierFiles.expiresAt),
        lte(chantierFiles.expiresAt, now)
      )
    )
  await deleteRows(rows, 'expired', now)
  return rows.length
}

export type StartUploadResult =
  | { ok: true; fileId: string; signedUrl: string; contentType: string }
  | { ok: false; error: UploadError }

/** Étape 1 : contrôles, ligne « en attente », adresse d'envoi signée. */
export async function startChantierUpload(params: {
  chantierId: string
  establishmentId: string | null
  field: FileField
  fileName: string
  sizeBytes: number
  chantierAnswers: ReadonlyMap<string, unknown>
  now?: Date
}): Promise<StartUploadResult> {
  const now = params.now ?? new Date()
  await cleanupAbandonedUploads({ chantierId: params.chantierId }, now)

  if (missingAttestation(params.field, params.chantierAnswers)) {
    return { ok: false, error: 'attestation_required' }
  }

  const live = await listLiveFiles(params.chantierId)
  const check = validateUploadRequest({
    fileName: params.fileName,
    sizeBytes: params.sizeBytes,
    accept: params.field.accept,
    usedBytes: usedBytes(live),
  })
  if (!check.ok) return check

  const fileId = randomUUID()
  const storagePath = storagePathFor(params.chantierId, fileId)
  await db.insert(chantierFiles).values({
    id: fileId,
    chantierId: params.chantierId,
    establishmentId: params.establishmentId,
    fieldKey: params.field.key,
    category: params.field.category,
    storagePath,
    originalName: safeOriginalName(params.fileName),
    mimeType: check.expectedType,
    sizeBytes: params.sizeBytes,
    status: 'pending',
    createdAt: now,
  })

  try {
    const { signedUrl } = await createSignedUpload(storagePath)
    return { ok: true, fileId, signedUrl, contentType: check.expectedType }
  } catch (err) {
    await db.delete(chantierFiles).where(eq(chantierFiles.id, fileId))
    throw err
  }
}

export type ConfirmUploadResult =
  | { ok: true; file: ChantierFileView }
  | { ok: false; error: UploadError }

/**
 * Étape 2 : le navigateur dit avoir fini. Le serveur relit l'objet stocké —
 * taille réelle et premiers octets — et ne garde le fichier que si son
 * contenu correspond à un type accepté. Sinon l'objet est retiré du bucket.
 */
export async function confirmChantierUpload(params: {
  chantierId: string
  fileId: string
  now?: Date
}): Promise<ConfirmUploadResult> {
  const now = params.now ?? new Date()
  const [row] = await db
    .select()
    .from(chantierFiles)
    .where(
      and(
        eq(chantierFiles.id, params.fileId),
        eq(chantierFiles.chantierId, params.chantierId),
        eq(chantierFiles.status, 'pending')
      )
    )
  if (!row) return { ok: false, error: 'not_received' }

  const field = getField(row.fieldKey)
  if (!field || field.type !== 'file') {
    await deleteRows([row], 'rejected', now)
    return { ok: false, error: 'type_not_accepted' }
  }

  const stored = await readObjectHead(row.storagePath, SIGNATURE_BYTES)
  if (!stored) {
    await deleteRows([row], 'missing', now)
    return { ok: false, error: 'not_received' }
  }

  const verdict = verifyUploadedFile({ head: stored.head, actualSize: stored.totalSize, accept: field.accept })
  if (!verdict.ok) {
    await deleteRows([row], 'rejected', now)
    return verdict
  }

  // L'espace se recalcule avec la taille réelle, pas celle annoncée
  const others = (await listLiveFiles(params.chantierId)).filter((f) => f.id !== row.id)
  if (usedBytes(others) + stored.totalSize > CHANTIER_QUOTA_BYTES) {
    await deleteRows([row], 'rejected', now)
    return { ok: false, error: 'quota_exceeded' }
  }

  const [ready] = await db
    .update(chantierFiles)
    .set({
      status: 'ready',
      mimeType: verdict.detectedType,
      sizeBytes: stored.totalSize,
      expiresAt: fileExpiryFor(field, now),
    })
    .where(eq(chantierFiles.id, row.id))
    .returning()

  // Emplacement à fichier unique : le nouveau remplace l'ancien
  if (!field.multiple) {
    await deleteRows(
      others.filter(
        (f) =>
          f.status === 'ready' && f.fieldKey === row.fieldKey && f.establishmentId === row.establishmentId
      ),
      'replaced',
      now
    )
  }

  return { ok: true, file: toView(ready!) }
}

/** Suppression d'un fichier par le client (ou GeoMind). */
export async function deleteChantierFile(
  chantierId: string,
  fileId: string,
  reason: DeletedReason,
  now: Date = new Date()
): Promise<boolean> {
  const rows = await db
    .select()
    .from(chantierFiles)
    .where(
      and(
        eq(chantierFiles.id, fileId),
        eq(chantierFiles.chantierId, chantierId),
        ne(chantierFiles.status, 'deleted')
      )
    )
  await deleteRows(rows, reason, now)
  return rows.length > 0
}

/** « Purger les fichiers » : tout le contenu quitte le stockage, les réponses restent. */
export async function purgeChantierFiles(
  ownerId: string,
  chantierId: string,
  now: Date = new Date()
): Promise<{ count: number; bytes: number } | null> {
  const [owned] = await db
    .select({ id: chantiers.id })
    .from(chantiers)
    .where(and(eq(chantiers.id, chantierId), eq(chantiers.ownerId, ownerId)))
  if (!owned) return null
  const rows = await listLiveFiles(chantierId)
  await deleteRows(rows, 'purge', now)
  return { count: rows.length, bytes: usedBytes(rows) }
}

/** Adresse de téléchargement (60 s, en pièce jointe) pour le propriétaire du chantier. */
export async function fileDownloadUrlForOwner(ownerId: string, fileId: string): Promise<string | null> {
  const [row] = await db
    .select({ storagePath: chantierFiles.storagePath, originalName: chantierFiles.originalName })
    .from(chantierFiles)
    .innerJoin(chantiers, eq(chantiers.id, chantierFiles.chantierId))
    .where(
      and(
        eq(chantierFiles.id, fileId),
        eq(chantiers.ownerId, ownerId),
        eq(chantierFiles.status, 'ready')
      )
    )
  if (!row) return null
  return createDownloadUrl(row.storagePath, row.originalName)
}

/** Fichiers d'un chantier pour la vue GeoMind (supprimés compris, pour la trace). */
export async function listFilesForOwner(ownerId: string, chantierId: string): Promise<FileRow[] | null> {
  const [owned] = await db
    .select({ id: chantiers.id })
    .from(chantiers)
    .where(and(eq(chantiers.id, chantierId), eq(chantiers.ownerId, ownerId)))
  if (!owned) return null
  return db
    .select()
    .from(chantierFiles)
    .where(eq(chantierFiles.chantierId, chantierId))
    .orderBy(chantierFiles.createdAt)
}
