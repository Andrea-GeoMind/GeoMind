/**
 * Email transactionnel : lien d'accès au rapport d'audit express.
 *
 * Envoyé par Resend et non par Supabase Auth : l'objet doit porter le domaine
 * audité (« Votre audit de monsite.fr »), ce que les templates Supabase ne
 * savent pas faire — leur objet est fixe et n'accepte pas de variable par
 * envoi. Le lien lui-même vient de `auth.admin.generateLink`, qui produit le
 * lien magique sans déclencher l'email par défaut.
 */

import { sendEmail } from '@/lib/email/send'

interface AuditMagicLinkInput {
  to: string
  domain: string
  actionLink: string
  /** Note technique de l'audit express, affichée pour rappeler le contexte. */
  score: number
}

export async function sendAuditMagicLinkEmail({
  to,
  domain,
  actionLink,
  score,
}: AuditMagicLinkInput): Promise<boolean> {
  return sendEmail('audit-magic-link', {
    to,
    subject: `Votre audit de ${domain} — accédez au rapport`,
    html: auditMagicLinkHtml({ domain, actionLink, score }),
  })
}

export function auditMagicLinkHtml({
  domain,
  actionLink,
  score,
}: {
  domain: string
  actionLink: string
  score: number
}): string {
  return `
<div style="font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #0f172a;">
  <p style="font-size: 18px; font-weight: 700; margin: 0 0 16px;">GeoMind</p>
  <h1 style="font-size: 22px; font-weight: 800; margin: 0 0 12px;">Votre audit de ${domain}</h1>
  <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
    Vos vérifications techniques donnent <strong>${score}/100</strong>. C'est un tiers du sujet :
    il reste à savoir si les IA vous citent, qui est cité à votre place, et ce qu'elles disent
    de vous.
  </p>
  <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
    Ouvrez votre rapport ci-dessous. Votre compte est créé en un clic, sans mot de passe, et
    l'analyse de ${domain} démarre automatiquement.
  </p>
  <a href="${actionLink}"
     style="display: inline-block; background: linear-gradient(to right, #4F46E5, #7C3AED); color: #ffffff; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
    Ouvrir mon rapport
  </a>
  <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 24px 0 0;">
    Ce lien est valable une heure et ne fonctionne qu'une fois. Si vous n'êtes pas à l'origine
    de cette demande, ignorez ce message : aucun compte ne sera activé.
  </p>
  <p style="font-size: 12px; line-height: 1.6; color: #94a3b8; margin: 24px 0 0; border-top: 1px solid #e2e8f0; padding-top: 16px;">
    GeoMind — visibilité dans les moteurs de réponses IA.<br />
    Votre adresse sert uniquement à vous envoyer ce lien et votre rapport.
    <a href="https://geomind.fr/legal/privacy" style="color: #64748b;">Politique de confidentialité</a>
  </p>
</div>`.trim()
}
