import { z } from 'zod'
import { normalizePublicUrl } from '@/lib/analysis/express-audit'

/**
 * URL d'un site : on accepte ce qu'un client tape réellement — « geomind.fr »,
 * « www.geomind.fr », « https://geomind.fr/contact » — et on normalise en
 * https + racine avant d'enregistrer.
 *
 * La normalisation est celle de l'audit express (`normalizePublicUrl`), qui
 * porte déjà la garde anti-SSRF : schémas http(s) uniquement, hôtes privés,
 * localhost, IP littérales et ports exotiques rejetés. Une seule
 * implémentation pour les deux surfaces — avant, l'audit express acceptait le
 * domaine nu et le formulaire d'ajout de site exigeait le protocole.
 */
const siteUrl = z
  .string()
  .min(1, 'Adresse requise')
  .transform((value, ctx) => {
    const normalized = normalizePublicUrl(value)
    if (!normalized) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Adresse invalide — exemple : monentreprise.fr',
      })
      return z.NEVER
    }
    return normalized.toString()
  })

export const siteSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100, 'Nom trop long (100 car. max)'),
  url: siteUrl,
})

export const onboardingSiteSchema = siteSchema.extend({
  language: z.string().length(2, 'Code langue sur 2 caractères (ex: fr)').default('fr'),
  country: z.string().length(2, 'Code pays sur 2 caractères (ex: FR)').default('FR'),
})

export type SiteInput = z.infer<typeof siteSchema>
export type OnboardingSiteInput = z.infer<typeof onboardingSiteSchema>
