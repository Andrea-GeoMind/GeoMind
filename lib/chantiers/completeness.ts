import type { ChantierEstablishmentOptions, ChantierOptions } from '@/lib/db/schema'
import {
  chantierFields,
  establishmentFields,
  isFilled,
  type EstablishmentKind,
  type FieldDef,
  type FieldSection,
} from '@/lib/chantiers/fields'

/**
 * Récapitulatif de l'espace client : ce qui est rempli, ce qui manque, et ce
 * qui bloque le démarrage du chantier. Fonction pure — le même état donne
 * toujours le même récapitulatif, côté client comme côté GeoMind.
 */

export interface CompletenessInput {
  chantierOptions: ChantierOptions
  establishments: {
    id: string
    name: string
    kind: EstablishmentKind
    options: ChantierEstablishmentOptions
  }[]
  answers: { establishmentId: string | null; fieldKey: string; value: unknown }[]
  files: { establishmentId: string | null; fieldKey: string; status: 'pending' | 'ready' | 'deleted' }[]
}

export interface CompletenessItem {
  fieldKey: string
  label: string
  section: FieldSection
  establishmentId: string | null
  establishmentName: string | null
  required: boolean
  blocking: boolean
  filled: boolean
}

export interface Completeness {
  items: CompletenessItem[]
  /** Champs obligatoires non remplis (bloquants compris) */
  missing: CompletenessItem[]
  /** Champs sans lesquels GeoMind ne peut pas démarrer */
  blocking: CompletenessItem[]
  requiredCount: number
  filledRequiredCount: number
  /** Avancement sur les champs obligatoires, arrondi, 0 à 100 */
  percent: number
  canStart: boolean
  bySection: Record<FieldSection, { required: number; filled: number }>
}

const SECTIONS: readonly FieldSection[] = ['access', 'info', 'files', 'decisions']

function slot(establishmentId: string | null, fieldKey: string): string {
  return `${establishmentId ?? '-'}|${fieldKey}`
}

export function computeCompleteness(input: CompletenessInput): Completeness {
  const answers = new Map(input.answers.map((a) => [slot(a.establishmentId, a.fieldKey), a.value]))
  const readyFiles = new Set(
    input.files.filter((f) => f.status === 'ready').map((f) => slot(f.establishmentId, f.fieldKey))
  )

  const evaluate = (
    field: FieldDef,
    establishment: CompletenessInput['establishments'][number] | null
  ): CompletenessItem => {
    const key = slot(establishment?.id ?? null, field.key)
    const filled =
      field.type === 'file'
        ? readyFiles.has(key)
        : isFilled(field, answers.get(key), establishment?.options ?? {})
    return {
      fieldKey: field.key,
      label: field.label,
      section: field.section,
      establishmentId: establishment?.id ?? null,
      establishmentName: establishment?.name ?? null,
      required: field.required,
      blocking: field.blocking === true,
      filled,
    }
  }

  const items: CompletenessItem[] = [
    ...chantierFields(input.chantierOptions).map((f) => evaluate(f, null)),
    ...input.establishments.flatMap((e) =>
      establishmentFields(e.kind, e.options).map((f) => evaluate(f, e))
    ),
  ]

  const required = items.filter((i) => i.required)
  const missing = required.filter((i) => !i.filled)
  const blocking = items.filter((i) => i.blocking && !i.filled)
  const filledRequiredCount = required.length - missing.length

  const bySection = Object.fromEntries(
    SECTIONS.map((s) => {
      const inSection = required.filter((i) => i.section === s)
      return [s, { required: inSection.length, filled: inSection.filter((i) => i.filled).length }]
    })
  ) as Completeness['bySection']

  return {
    items,
    missing,
    blocking,
    requiredCount: required.length,
    filledRequiredCount,
    percent: required.length === 0 ? 100 : Math.round((filledRequiredCount / required.length) * 100),
    canStart: blocking.length === 0,
    bySection,
  }
}
