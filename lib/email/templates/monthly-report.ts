/**
 * Rapport mensuel de visibilité (PLAN item 15) — le produit vient à
 * l'utilisateur. Une synthèse par email : score, tendance, 3 actions.
 * Volontairement simple : un patron doit tout comprendre en 20 secondes.
 */

import { resend } from '@/lib/email/client'
import { env } from '@/lib/env'

export interface MonthlySiteReport {
  siteId: string
  siteName: string
  globalScore: number | null
  /** Taux de citation 30 derniers jours (%) */
  rollingRate: number | null
  /** Taux de citation des 30 jours précédents (%) */
  previousRate: number | null
  /** Titres des 3 actions les plus impactantes encore ouvertes */
  topActions: string[]
}

function trendLine(rollingRate: number | null, previousRate: number | null): string {
  if (rollingRate === null) return ''
  if (previousRate === null) {
    return `<p style="font-size: 14px; margin: 4px 0;">Taux de citation IA : <strong>${rollingRate}%</strong></p>`
  }
  const delta = rollingRate - previousRate
  const arrow = delta > 2 ? '📈' : delta < -2 ? '📉' : '➡️'
  const deltaText = delta === 0 ? 'stable' : `${delta > 0 ? '+' : ''}${delta} pts vs le mois dernier`
  return `<p style="font-size: 14px; margin: 4px 0;">Taux de citation IA : <strong>${rollingRate}%</strong> ${arrow} <span style="color:#64748b;">(${deltaText})</span></p>`
}

function siteBlock(site: MonthlySiteReport): string {
  const actions =
    site.topActions.length > 0
      ? `<p style="font-size: 13px; margin: 10px 0 4px; font-weight: 600;">Vos 3 actions du mois :</p>
         <ol style="font-size: 13px; line-height: 1.7; margin: 0; padding-left: 20px;">
           ${site.topActions.map((a) => `<li>${a}</li>`).join('')}
         </ol>`
      : `<p style="font-size: 13px; margin: 10px 0 0; color: #16a34a;">Aucun point faible majeur en attente — continuez comme ça.</p>`

  return `
  <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin: 0 0 16px;">
    <p style="font-size: 16px; font-weight: 700; margin: 0 0 6px;">${site.siteName}</p>
    ${site.globalScore !== null ? `<p style="font-size: 14px; margin: 4px 0;">Note GEO : <strong>${site.globalScore}/100</strong></p>` : ''}
    ${trendLine(site.rollingRate, site.previousRate)}
    ${actions}
    <a href="https://geomind.fr/sites/${site.siteId}/trends"
       style="display: inline-block; margin-top: 12px; font-size: 13px; font-weight: 600; color: #4F46E5; text-decoration: none;">
      Voir la tendance complète →
    </a>
  </div>`
}

export async function sendMonthlyReportEmail(params: {
  to: string
  sites: MonthlySiteReport[]
}): Promise<void> {
  const month = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: params.to,
    subject: `Votre visibilité IA — rapport de ${month}`,
    html: `
<div style="font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #0f172a;">
  <p style="font-size: 18px; font-weight: 700; margin: 0 0 16px;">GeoMind</p>
  <h1 style="font-size: 22px; font-weight: 800; margin: 0 0 6px;">Votre rapport mensuel</h1>
  <p style="font-size: 14px; color: #64748b; margin: 0 0 24px;">
    Où en est votre visibilité dans ChatGPT, Perplexity, Gemini et Claude — et quoi faire ce mois-ci.
  </p>
  ${params.sites.map(siteBlock).join('')}
  <p style="font-size: 12px; color: #64748b; margin: 24px 0 0;">
    Vous recevez ce rapport chaque mois car la surveillance GeoMind est active sur vos sites.
    Désactivable dans <a href="https://geomind.fr/settings/account" style="color: #64748b;">vos paramètres</a>.
  </p>
</div>`.trim(),
  })
}
