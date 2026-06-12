/**
 * Emails transactionnels d'alertes de visibilité (PLAN item 13).
 * Trois moments de vérité : la première citation (célébration), la disparition
 * des réponses IA (urgence actionnable), l'analyse terminée (retour produit).
 * Envoyés uniquement si profiles.email_notifications = true.
 */

import { resend } from '@/lib/email/client'
import { env } from '@/lib/env'

const FOOTER = (reason: string) => `
  <p style="font-size: 12px; color: #64748b; margin: 32px 0 0;">
    ${reason} Vous pouvez désactiver ces alertes dans
    <a href="https://geomind.fr/settings/account" style="color: #64748b;">vos paramètres</a>.
  </p>`

function wrap(content: string): string {
  return `
<div style="font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #0f172a;">
  <p style="font-size: 18px; font-weight: 700; margin: 0 0 16px;">GeoMind</p>
  ${content}
</div>`.trim()
}

const CTA = (href: string, label: string) => `
  <a href="${href}"
     style="display: inline-block; background: linear-gradient(to right, #4F46E5, #7C3AED); color: #ffffff; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
    ${label}
  </a>`

// ─── Première citation ─────────────────────────────────────────────────────────

export async function sendFirstCitationEmail(params: {
  to: string
  siteName: string
  siteId: string
}): Promise<void> {
  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: params.to,
    subject: `🎉 ${params.siteName} vient d'être cité par une IA`,
    html: wrap(`
  <h1 style="font-size: 22px; font-weight: 800; margin: 0 0 12px;">Votre site vient d'être cité !</h1>
  <p style="font-size: 15px; line-height: 1.6; margin: 0 0 8px;">
    Bonne nouvelle : lors de notre dernière vérification automatique,
    <strong>${params.siteName}</strong> est apparu dans les réponses des moteurs IA.
    C'est la première fois que nous le détectons — vos efforts paient.
  </p>
  <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
    Découvrez quelle question et quel moteur vous ont cité, et comment transformer
    cette première citation en habitude.
  </p>
  ${CTA(`https://geomind.fr/sites/${params.siteId}/authority`, 'Voir mes citations')}
  ${FOOTER('Vous recevez cet email car GeoMind surveille la visibilité IA de votre site.')}
`),
  })
}

// ─── Disparition des réponses ──────────────────────────────────────────────────

export async function sendVisibilityDropEmail(params: {
  to: string
  siteName: string
  siteId: string
  previousRate: number
}): Promise<void> {
  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: params.to,
    subject: `⚠️ ${params.siteName} a disparu des réponses IA cette semaine`,
    html: wrap(`
  <h1 style="font-size: 22px; font-weight: 800; margin: 0 0 12px;">Baisse de visibilité détectée</h1>
  <p style="font-size: 15px; line-height: 1.6; margin: 0 0 8px;">
    Lors de notre dernière vérification automatique, <strong>${params.siteName}</strong>
    n'est apparu dans aucune réponse des moteurs IA, alors que votre taux de citation
    des 30 derniers jours était de <strong>${params.previousRate}&nbsp;%</strong>.
  </p>
  <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
    Les réponses des IA varient naturellement — une mesure isolée n'est pas une
    catastrophe. Mais c'est le bon moment pour vérifier votre tendance et vos
    actions en attente.
  </p>
  ${CTA(`https://geomind.fr/sites/${params.siteId}/overview`, 'Vérifier ma tendance')}
  ${FOOTER('Vous recevez cet email car GeoMind surveille la visibilité IA de votre site.')}
`),
  })
}

// ─── Analyse terminée ──────────────────────────────────────────────────────────

export async function sendAnalysisCompleteEmail(params: {
  to: string
  siteName: string
  siteId: string
  globalScore: number | null
}): Promise<void> {
  const scoreLine =
    params.globalScore !== null
      ? `Votre note GEO globale : <strong>${params.globalScore}/100</strong>.`
      : 'Vos résultats sont prêts.'
  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: params.to,
    subject: `Votre analyse GEO de ${params.siteName} est prête`,
    html: wrap(`
  <h1 style="font-size: 22px; font-weight: 800; margin: 0 0 12px;">Analyse terminée ✅</h1>
  <p style="font-size: 15px; line-height: 1.6; margin: 0 0 8px;">
    L'audit de <strong>${params.siteName}</strong> est terminé. ${scoreLine}
  </p>
  <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
    Consultez vos points faibles et le plan d'action recommandé — commencez par
    les corrections rapides à fort impact.
  </p>
  ${CTA(`https://geomind.fr/sites/${params.siteId}/overview`, 'Voir mes résultats')}
  ${FOOTER('Vous recevez cet email car vous avez lancé une analyse sur GeoMind.')}
`),
  })
}
