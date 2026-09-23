/**
 * Email transactionnel : lien de connexion sans mot de passe.
 *
 * Nécessaire parce que le tunnel d'audit public crée des comptes SANS mot de
 * passe (`auth.admin.generateLink`). Revenu le lendemain, ce client trouvait un
 * formulaire email + mot de passe pour un mot de passe qu'il n'avait jamais
 * choisi ; le seul détour praticable était « Mot de passe oublié ? », ce qui
 * n'a aucun sens quand il n'y en a jamais eu.
 *
 * Envoyé par Resend et non par Supabase Auth, pour la même raison que
 * `audit-magic-link` : le lien pointe vers notre route `/auth/confirm`, qui
 * vérifie le jeton côté serveur. Le lien par défaut de Supabase passe par
 * `/auth/v1/verify` en flux implicite et renvoie les jetons dans le fragment
 * d'URL, que le serveur ne voit jamais.
 */

import { sendEmail } from '@/lib/email/send'

export async function sendSignInLinkEmail({
  to,
  actionLink,
}: {
  to: string
  actionLink: string
}): Promise<boolean> {
  return sendEmail('sign-in-link', {
    to,
    subject: 'Votre lien de connexion GeoMind',
    html: signInLinkHtml({ actionLink }),
  })
}

export function signInLinkHtml({ actionLink }: { actionLink: string }): string {
  return `
<div style="font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #0f172a;">
  <p style="font-size: 18px; font-weight: 700; margin: 0 0 16px;">GeoMind</p>
  <h1 style="font-size: 22px; font-weight: 800; margin: 0 0 12px;">Votre lien de connexion</h1>
  <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
    Cliquez ci-dessous pour ouvrir votre espace GeoMind. Aucun mot de passe n'est nécessaire.
  </p>
  <a href="${actionLink}"
     style="display: inline-block; background: linear-gradient(to right, #4F46E5, #7C3AED); color: #ffffff; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
    Me connecter
  </a>
  <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 24px 0 0;">
    Ce lien est valable une heure et ne fonctionne qu'une fois. Si vous n'avez pas demandé à
    vous connecter, ignorez ce message : votre compte reste inchangé.
  </p>
</div>`
}
