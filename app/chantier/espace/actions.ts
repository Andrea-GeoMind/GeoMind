'use server'

import { z } from 'zod'
import { requireChantierAccess, logChantierAccess, type DeniedState } from '@/lib/chantiers/access'
import { validateFieldSave, type SaveError } from '@/lib/chantiers/save'
import { markChantierSubmitted, saveChantierAnswer } from '@/lib/db/queries/chantier-answers'
import { captureChantierFailure } from '@/lib/monitoring'

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

/** « J'ai terminé ». Le mail à GeoMind arrive en S2.7 (fonction Inngest). */
export async function submitChantierAction(): Promise<SubmitResult> {
  const access = await requireChantierAccess('submit')
  if (!access.ok) return { ok: false, error: 'access', state: access.state }

  try {
    const submittedAt = await markChantierSubmitted(access.chantier.id)
    await logChantierAccess(access.chantier.id, 'submit', access.ipTruncated)
    return { ok: true, submittedAt: submittedAt.toISOString() }
  } catch (err) {
    captureChantierFailure('submit', err, { chantierId: access.chantier.id })
    return { ok: false, error: 'server' }
  }
}
