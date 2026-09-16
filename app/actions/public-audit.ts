'use server'

import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { publicAudits } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'

/**
 * Capture d'email en fin d'audit express.
 *
 * Le visiteur laisse son email pour recevoir le rapport : on l'enregistre sur
 * SA ligne d'audit (identifiée par claim_token, jamais partagée entre deux
 * visiteurs), puis Supabase envoie un lien magique qui crée le compte et ouvre
 * la session en un clic. Le retour passe par /claim/<token>, qui crée le site
 * et rattache l'audit.
 *
 * RGPD : finalité unique (envoyer le rapport et ouvrir l'accès au compte),
 * affichée sous le champ. Aucune case marketing, aucune autre exploitation.
 * L'email est effacé avec le compte (ON DELETE CASCADE, règle métier 7).
 */

const ClaimSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  claimToken: z.string().uuid(),
})

export interface ClaimAuditResult {
  error?: string
  sent?: boolean
}

export async function claimExpressAudit(
  email: string,
  claimToken: string
): Promise<ClaimAuditResult> {
  const parsed = ClaimSchema.safeParse({ email, claimToken })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Adresse email invalide' }
  }

  const [audit] = await db
    .select({ id: publicAudits.id, claimedByUserId: publicAudits.claimedByUserId })
    .from(publicAudits)
    .where(eq(publicAudits.claimToken, parsed.data.claimToken))
    .limit(1)

  if (!audit) {
    return { error: 'Audit introuvable — relancez-le depuis la page d’accueil.' }
  }
  if (audit.claimedByUserId) {
    return { error: 'Cet audit est déjà rattaché à un compte. Connectez-vous pour le retrouver.' }
  }

  await db
    .update(publicAudits)
    .set({ email: parsed.data.email })
    .where(eq(publicAudits.id, audit.id))

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/claim/${parsed.data.claimToken}`,
    },
  })

  if (error) {
    console.error('[public-audit] envoi du lien magique impossible:', error)
    return { error: 'Envoi impossible pour le moment. Réessayez dans un instant.' }
  }

  return { sent: true }
}
