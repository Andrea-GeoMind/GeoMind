import { z } from 'zod'
import { invalidExtraFields } from '@/lib/chantiers/fields'
import { DEFAULT_GEOMIND_ADDRESS } from '@/lib/chantiers/copy'

/**
 * Création d'un chantier : schéma unique pour le formulaire du tableau de
 * bord, la Server Action et le script de création. Pur (aucun accès base),
 * importable côté client.
 */

const httpUrl = z.url({ protocol: /^https?$/, message: 'Adresse invalide (https://…)' }).max(500)

export const establishmentInputSchema = z.object({
  name: z.string().trim().min(1, 'Nom requis').max(120),
  kind: z.enum(['venue', 'rental']),
  website: z.union([z.literal(''), httpUrl]),
  addressOptions: z.array(z.string().trim().min(1).max(300)).max(10),
  extraFields: z.array(z.string()).max(20),
})

export const chantierInputSchema = z
  .object({
    clientName: z.string().trim().min(1, 'Nom du client requis').max(120),
    contactEmail: z.union([z.literal(''), z.email('E-mail invalide').max(254)]),
    geomindAddress: z.email('E-mail invalide').max(254),
    alertEmail: z.email('E-mail invalide').max(254),
    extraFields: z.array(z.string()).max(20),
    establishments: z.array(establishmentInputSchema).min(1, 'Au moins un établissement').max(20),
  })
  .superRefine((value, ctx) => {
    for (const key of invalidExtraFields(value.extraFields, 'chantier')) {
      ctx.addIssue({ code: 'custom', path: ['extraFields'], message: `Champ inconnu : ${key}` })
    }
    const names = new Set<string>()
    value.establishments.forEach((e, i) => {
      const lower = e.name.toLowerCase()
      if (names.has(lower)) {
        ctx.addIssue({ code: 'custom', path: ['establishments', i, 'name'], message: 'Nom en double' })
      }
      names.add(lower)
      for (const key of invalidExtraFields(e.extraFields, 'establishment')) {
        ctx.addIssue({
          code: 'custom',
          path: ['establishments', i, 'extraFields'],
          message: `Champ inconnu : ${key}`,
        })
      }
      if (new Set(e.addressOptions).size !== e.addressOptions.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['establishments', i, 'addressOptions'],
          message: 'Adresse proposée en double',
        })
      }
    })
  })

export type ChantierInput = z.infer<typeof chantierInputSchema>

// ─── Formulaire ───────────────────────────────────────────────────────────────
// Les adresses proposées se saisissent une par ligne : le formulaire garde un
// texte, converti en liste avant validation finale.

export const chantierFormSchema = z.object({
  clientName: z.string(),
  contactEmail: z.string(),
  geomindAddress: z.string(),
  alertEmail: z.string(),
  extraFields: z.array(z.string()),
  establishments: z
    .array(
      z.object({
        name: z.string(),
        kind: z.enum(['venue', 'rental']),
        website: z.string(),
        addressText: z.string(),
        extraFields: z.array(z.string()),
      })
    )
    .min(1, 'Au moins un établissement'),
})

export type ChantierFormValues = z.infer<typeof chantierFormSchema>

export const EMPTY_ESTABLISHMENT: ChantierFormValues['establishments'][number] = {
  name: '',
  kind: 'venue',
  website: '',
  addressText: '',
  extraFields: [],
}

export const EMPTY_CHANTIER_FORM: ChantierFormValues = {
  clientName: '',
  contactEmail: '',
  geomindAddress: DEFAULT_GEOMIND_ADDRESS,
  alertEmail: DEFAULT_GEOMIND_ADDRESS,
  extraFields: [],
  establishments: [EMPTY_ESTABLISHMENT],
}

/** Une adresse par ligne, lignes vides ignorées. */
export function parseAddressLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
}

export function formToChantierInput(form: ChantierFormValues): unknown {
  return {
    clientName: form.clientName,
    contactEmail: form.contactEmail.trim(),
    geomindAddress: form.geomindAddress.trim(),
    alertEmail: form.alertEmail.trim(),
    extraFields: form.extraFields,
    establishments: form.establishments.map((e) => ({
      name: e.name,
      kind: e.kind,
      website: e.website.trim(),
      addressOptions: parseAddressLines(e.addressText),
      extraFields: e.extraFields,
    })),
  }
}
