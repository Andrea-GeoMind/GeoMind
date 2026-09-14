import { resend } from '@/lib/email/client'
import { env } from '@/lib/env'
import { captureEmailFailure } from '@/lib/monitoring'

/**
 * Envoi d'un email transactionnel avec remontée d'erreur.
 *
 * Le SDK Resend ne lève pas : il renvoie `{ data, error }`. Un `await
 * resend.emails.send(...)` sans vérification avale donc silencieusement
 * quota dépassé, domaine non vérifié ou adresse invalide. Ce helper vérifie
 * les deux chemins (erreur renvoyée et exception réseau), alerte Sentry, et
 * ne relance jamais : un email raté ne doit pas faire échouer l'analyse qui
 * l'a déclenché.
 *
 * @returns true si l'email est parti.
 */
export async function sendEmail(
  template: string,
  params: { to: string; subject: string; html: string; siteId?: string }
): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
    })

    if (error) {
      console.error(`[email/${template}] Resend a refusé l'envoi :`, error.message)
      captureEmailFailure(template, error, { to: params.to, siteId: params.siteId })
      return false
    }
    return true
  } catch (err) {
    console.error(`[email/${template}] échec réseau :`, err)
    captureEmailFailure(template, err, { to: params.to, siteId: params.siteId })
    return false
  }
}
