/**
 * Email transactionnel : alerte "crédits bientôt épuisés" (cahier-des-charges §17.6).
 * Envoyé une seule fois par cycle quand le solde mensuel passe sous 20 %.
 */

import { resend } from '@/lib/email/client'
import { env } from '@/lib/env'

interface LowCreditsEmailInput {
  to: string
  remaining: number
  allowance: number
}

export async function sendLowCreditsEmail({
  to,
  remaining,
  allowance,
}: LowCreditsEmailInput): Promise<void> {
  await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: 'GeoMind — vos crédits sont bientôt épuisés',
    html: lowCreditsEmailHtml({ remaining, allowance }),
  })
}

export function lowCreditsEmailHtml({
  remaining,
  allowance,
}: {
  remaining: number
  allowance: number
}): string {
  const pct = Math.round((remaining / allowance) * 100)
  return `
<div style="font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #0f172a;">
  <p style="font-size: 18px; font-weight: 700; margin: 0 0 16px;">GeoMind</p>
  <h1 style="font-size: 22px; font-weight: 800; margin: 0 0 12px;">Vos crédits sont bientôt épuisés</h1>
  <p style="font-size: 15px; line-height: 1.6; margin: 0 0 8px;">
    Il vous reste <strong>${remaining} crédits</strong> sur les ${allowance} de votre cycle en cours (${pct}&nbsp;%).
  </p>
  <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
    Pour continuer à lancer des analyses et discuter avec votre coach IA, rechargez des crédits ou passez à un plan supérieur.
  </p>
  <a href="https://geomind.fr/settings/billing"
     style="display: inline-block; background: linear-gradient(to right, #4F46E5, #7C3AED); color: #ffffff; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
    Recharger mes crédits
  </a>
  <p style="font-size: 12px; color: #64748b; margin: 32px 0 0;">
    Vous recevez cet email car votre solde de crédits GeoMind est passé sous 20&nbsp;% de votre allocation mensuelle.
  </p>
</div>`.trim()
}
