'use server'

import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { publicAudits } from '@/lib/db/schema'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAuditMagicLinkEmail } from '@/lib/email/templates/audit-magic-link'
import { env } from '@/lib/env'

/**
 * Capture d'email en fin d'audit express.
 *
 * Le visiteur laisse son email pour recevoir le rapport : on l'enregistre sur
 * SA ligne d'audit (identifiée par claim_token, jamais partagée entre deux
 * visiteurs), puis on lui envoie un lien magique qui crée le compte et ouvre
 * la session en un clic. Le retour passe par /claim/<token>, qui crée le site,
 * rattache l'audit et lance l'analyse.
 *
 * L'email part par Resend et non par Supabase Auth : son objet porte le domaine
 * audité, ce que les templates Supabase ne permettent pas (objet fixe, sans
 * variable par envoi). `generateLink` produit le lien sans déclencher l'email
 * par défaut, et crée l'utilisateur s'il n'existe pas encore.
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
    .select({
      id: publicAudits.id,
      domain: publicAudits.domain,
      score: publicAudits.score,
      claimedByUserId: publicAudits.claimedByUserId,
    })
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

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: parsed.data.email,
  })

  // Les deux étapes suivantes échouaient sous le même message générique, ce qui
  // a rendu illisible une clé Resend révoquée : on les distingue dans les logs.
  const hashedToken = data?.properties?.hashed_token
  if (error || !hashedToken) {
    console.error(
      '[public-audit] génération du lien magique impossible —',
      error ? `${error.status ?? ''} ${error.message}` : 'réponse sans hashed_token'
    )
    return { error: 'Envoi impossible pour le moment. Réessayez dans un instant.' }
  }

  // On n'utilise PAS `properties.action_link` : il pointe vers /auth/v1/verify,
  // qui fonctionne en flux implicite et renvoie les jetons dans le fragment de
  // l'URL (#access_token=…). Un fragment n'atteint jamais le serveur, donc le
  // callback ne voyait aucun code et renvoyait sur /login?error=auth-callback
  // alors que l'authentification venait de réussir.
  //
  // On fabrique le lien vers notre route /auth/confirm, qui vérifie le
  // token_hash côté serveur. Effet de bord utile : `next` voyage dans notre
  // propre URL, il ne dépend plus du `redirect_to` de Supabase.
  //
  // Le type de vérification vient de la réponse : Supabase répond `signup`
  // quand le compte vient d'être créé, `magiclink` quand il existait déjà.
  const verificationType = data?.properties?.verification_type ?? 'magiclink'
  const actionLink =
    `${env.NEXT_PUBLIC_SITE_URL}/auth/confirm` +
    `?token_hash=${encodeURIComponent(hashedToken)}` +
    `&type=${encodeURIComponent(verificationType)}` +
    `&next=${encodeURIComponent(`/claim/${parsed.data.claimToken}`)}`

  const sent = await sendAuditMagicLinkEmail({
    to: parsed.data.email,
    domain: audit.domain,
    actionLink,
    score: audit.score,
  })
  if (!sent) {
    // `sendEmail` a déjà loggé le détail Resend et alerté Sentry.
    console.error(
      `[public-audit] lien magique généré mais email non parti (domaine ${audit.domain})`
    )
    return { error: 'Envoi impossible pour le moment. Réessayez dans un instant.' }
  }

  return { sent: true }
}
