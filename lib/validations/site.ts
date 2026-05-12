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

export type SiteInput = z.infer<typeof siteSchema>
