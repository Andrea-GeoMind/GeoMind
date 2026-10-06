import type { ChantierEstablishmentOptions, ChantierOptions } from '@/lib/db/schema'
import {
  chantierFields,
  establishmentFields,
  getField,
  inputSchemaFor,
  type EstablishmentKind,
  type FieldDef,
} from '@/lib/chantiers/fields'

/**
 * Validation d'une saisie du client avant enregistrement. Pure : tout ce
 * qu'elle sait vient du chantier chargé côté serveur, jamais du navigateur
 * (le navigateur n'envoie que l'établissement, la clé et la valeur).
 */

export type SaveError =
  | 'unknown_field'
  | 'file_field'
  | 'wrong_scope'
  | 'unknown_establishment'
  | 'not_enabled'
  | 'invalid_value'

export interface SaveRequest {
  establishmentId: string | null
  fieldKey: string
  value: unknown
}

export interface SaveContext {
  chantierOptions: ChantierOptions
  establishments: { id: string; kind: EstablishmentKind; options: ChantierEstablishmentOptions }[]
}

export type ValidatedSave =
  | { ok: true; field: FieldDef; establishmentId: string | null; input: unknown }
  | { ok: false; error: SaveError }

export function validateFieldSave(ctx: SaveContext, req: SaveRequest): ValidatedSave {
  const field = getField(req.fieldKey)
  if (!field) return { ok: false, error: 'unknown_field' }
  // Les fichiers passent par leur propre circuit (adresse signée + vérification)
  if (field.type === 'file') return { ok: false, error: 'file_field' }

  if (field.scope === 'chantier') {
    if (req.establishmentId !== null) return { ok: false, error: 'wrong_scope' }
    if (!chantierFields(ctx.chantierOptions).some((f) => f.key === field.key)) {
      return { ok: false, error: 'not_enabled' }
    }
    const parsed = inputSchemaFor(field)?.safeParse(req.value)
    if (!parsed?.success) return { ok: false, error: 'invalid_value' }
    return { ok: true, field, establishmentId: null, input: parsed.data }
  }

  if (req.establishmentId === null) return { ok: false, error: 'wrong_scope' }
  const establishment = ctx.establishments.find((e) => e.id === req.establishmentId)
  if (!establishment) return { ok: false, error: 'unknown_establishment' }
  if (!establishmentFields(establishment.kind, establishment.options).some((f) => f.key === field.key)) {
    return { ok: false, error: 'not_enabled' }
  }
  const parsed = inputSchemaFor(field, establishment.options)?.safeParse(req.value)
  if (!parsed?.success) return { ok: false, error: 'invalid_value' }
  return { ok: true, field, establishmentId: establishment.id, input: parsed.data }
}
