import { z } from 'zod'

export const siteSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100, 'Nom trop long (100 car. max)'),
  url: z
    .string()
    .url('URL invalide — ex: https://exemple.fr')
    .refine((u) => /^https?:\/\//.test(u), {
      message: "Seuls les protocoles http:// et https:// sont autorisés",
    }),
})

export const onboardingSiteSchema = siteSchema.extend({
  language: z.string().length(2, 'Code langue sur 2 caractères (ex: fr)').default('fr'),
  country: z.string().length(2, 'Code pays sur 2 caractères (ex: FR)').default('FR'),
})

export type SiteInput = z.infer<typeof siteSchema>
export type OnboardingSiteInput = z.infer<typeof onboardingSiteSchema>
