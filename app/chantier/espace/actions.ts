'use server'

import { z } from 'zod'
import { requireChantierAccess, logChantierAccess, type DeniedState } from '@/lib/chantiers/access'
import { validateFieldSave, validateFileTarget, type SaveError } from '@/lib/chantiers/save'
import {
  loadChantierLevelAnswers,
  markChantierSubmitted,
  saveChantierAnswer,
} from '@/lib/db/queries/chantier-answers'
import {
  confirmChantierUpload,
  deleteChantierFile,
  startChantierUpload,
} from '@/lib/chantiers/file-service'
import type { ChantierFileView, UploadError } from '@/lib/chantiers/files'
import { captureChantierFailure } from '@/lib/monitoring'
import { recordChantierActivity } from '@/lib/chantiers/activity'

/**
 * Actions de l'espace client. Règle (tests/unit/chantiers/client-actions-gate.test.ts) :
 * chacune commence par requireChantierAccess(), qui revérifie le lien (cookie)
 * et applique la limite de débit, et s'arrête si l'accès est refusé.
 */

export type SaveFieldResult =
  | { ok: true; value: unknown }
  | { ok: false; error: 'access'; state: DeniedState }
  | { ok: false; error: SaveError | 'server' }

const SaveRequestSchema = z.object({
  establishmentId: z.uuid().nullable(),
  fieldKey: z.string().min(1).max(100),
  value: z.unknown(),
})

export async function saveChantierFieldAction(request: unknown): Promise<SaveFieldResult> {
  const access = await requireChantierAccess('save')
  if (!access.ok) return { ok: false, error: 'access', state: access.state }

  const req = SaveRequestSchema.safeParse(request)
  if (!req.success) return { ok: false, error: 'invalid_value' }

  const validated = validateFieldSave(
    {
      chantierOptions: access.chantier.options,
      establishments: access.establishments.map((e) => ({ id: e.id, kind: e.kind, options: e.options })),
    },
    req.data
  )
  if (!validated.ok) return validated

  try {
    const value = await saveChantierAnswer({
      chantierId: access.chantier.id,
      establishmentId: validated.establishmentId,
      field: validated.field,
      input: validated.input,
      actor: 'client',
      ipTruncated: access.ipTruncated,
    })
    await recordChantierActivity(access.chantier.id)
    return { ok: true, value }
  } catch (err) {
    captureChantierFailure('save_field', err, {
      chantierId: access.chantier.id,
      fieldKey: validated.field.key,
    })
    return { ok: false, error: 'server' }
  }
}

export type SubmitResult =
  | { ok: true; submittedAt: string }
  | { ok: false; error: 'access'; state: DeniedState }
  | { ok: false; error: 'server' }

/** « J'ai terminé » : signalé en tête de l'e-mail groupé suivant. */
export async function submitChantierAction(): Promise<SubmitResult> {
  const access = await requireChantierAccess('submit')
  if (!access.ok) return { ok: false, error: 'access', state: access.state }

  try {
    const submittedAt = await markChantierSubmitted(access.chantier.id)
    await logChantierAccess(access.chantier.id, 'submit', access.ipTruncated)
    await recordChantierActivity(access.chantier.id)
    return { ok: true, submittedAt: submittedAt.toISOString() }
  } catch (err) {
    captureChantierFailure('submit', err, { chantierId: access.chantier.id })
    return { ok: false, error: 'server' }
  }
}

// ─── Fichiers ─────────────────────────────────────────────────────────────────
// Le fichier ne transite pas par le serveur : le navigateur l'envoie au bucket
// privé avec l'adresse signée de requestFileUploadAction, puis le serveur le
// relit et le vérifie dans confirmFileUploadAction.

export type FileActionResult<T> =
  | ({ ok: true } & T)
  | { ok: false; error: 'access'; state: DeniedState }
  | { ok: false; error: UploadError | 'invalid_target' | 'server' }

const UploadRequestSchema = z.object({
  establishmentId: z.uuid().nullable(),
  fieldKey: z.string().min(1).max(100),
  fileName: z.string().min(1).max(500),
  sizeBytes: z.number().int().nonnegative(),
})

export async function requestFileUploadAction(
  request: unknown
): Promise<FileActionResult<{ fileId: string; signedUrl: string; contentType: string }>> {
  const access = await requireChantierAccess('upload')
  if (!access.ok) return { ok: false, error: 'access', state: access.state }

  const req = UploadRequestSchema.safeParse(request)
  if (!req.success) return { ok: false, error: 'invalid_target' }

  const target = validateFileTarget(
    {
      chantierOptions: access.chantier.options,
      establishments: access.establishments.map((e) => ({ id: e.id, kind: e.kind, options: e.options })),
    },
    req.data
  )
  if (!target.ok) return { ok: false, error: 'invalid_target' }

  try {
    return await startChantierUpload({
      chantierId: access.chantier.id,
      establishmentId: target.establishmentId,
      field: target.field,
      fileName: req.data.fileName,
      sizeBytes: req.data.sizeBytes,
      chantierAnswers: await loadChantierLevelAnswers(access.chantier.id),
    })
  } catch (err) {
    captureChantierFailure('upload_start', err, { chantierId: access.chantier.id })
    return { ok: false, error: 'server' }
  }
}

export async function confirmFileUploadAction(
  fileId: unknown
): Promise<FileActionResult<{ file: ChantierFileView }>> {
  const access = await requireChantierAccess('upload')
  if (!access.ok) return { ok: false, error: 'access', state: access.state }

  const id = z.uuid().safeParse(fileId)
  if (!id.success) return { ok: false, error: 'not_received' }

  try {
    const result = await confirmChantierUpload({ chantierId: access.chantier.id, fileId: id.data })
    if (result.ok) {
      await logChantierAccess(access.chantier.id, 'upload', access.ipTruncated)
      await recordChantierActivity(access.chantier.id)
    }
    return result
  } catch (err) {
    captureChantierFailure('upload_confirm', err, { chantierId: access.chantier.id })
    return { ok: false, error: 'server' }
  }
}

export async function deleteChantierFileAction(fileId: unknown): Promise<FileActionResult<object>> {
  const access = await requireChantierAccess('save')
  if (!access.ok) return { ok: false, error: 'access', state: access.state }

  const id = z.uuid().safeParse(fileId)
  if (!id.success) return { ok: false, error: 'not_received' }

  try {
    const deleted = await deleteChantierFile(access.chantier.id, id.data, 'client')
    return deleted ? { ok: true } : { ok: false, error: 'not_received' }
  } catch (err) {
    captureChantierFailure('file_delete', err, { chantierId: access.chantier.id })
    return { ok: false, error: 'server' }
  }
}
