import { env } from '@/lib/env'

/**
 * Sonde de la configuration Resend.
 *
 * Raison d'être : la clé Resend de production est restée révoquée sans que
 * personne ne le voie. `sendEmail` n'échoue jamais bruyamment — un email raté
 * ne doit pas faire tomber l'analyse qui l'a déclenché — si bien que les cinq
 * emails transactionnels et le lien magique de l'audit express partaient dans
 * le vide. Le symptôme n'est apparu que quand un utilisateur a signalé ne rien
 * recevoir.
 *
 * On appelle `GET /domains` : la requête valide la clé ET l'état du domaine
 * d'envoi, sans expédier le moindre email.
 */
export interface EmailHealth {
  ok: boolean
  /** Le domaine d'envoi de EMAIL_FROM est vérifié chez Resend. */
  domainVerified: boolean
  error?: string
}

export async function probeEmailDelivery(): Promise<EmailHealth> {
  const sendingDomain = env.EMAIL_FROM.split('@')[1]?.toLowerCase()

  try {
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` },
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return {
        ok: false,
        domainVerified: false,
        error: `Resend a refusé la clé (HTTP ${res.status})${body ? ` : ${body.slice(0, 200)}` : ''}`,
      }
    }

    const json = (await res.json()) as { data?: { name?: string; status?: string }[] }
    const domain = json.data?.find((d) => d.name?.toLowerCase() === sendingDomain)

    if (!domain) {
      return {
        ok: false,
        domainVerified: false,
        error: `Le domaine d'envoi ${sendingDomain} (EMAIL_FROM) n'est pas déclaré chez Resend.`,
      }
    }
    if (domain.status !== 'verified') {
      return {
        ok: false,
        domainVerified: false,
        error: `Le domaine ${sendingDomain} n'est pas vérifié chez Resend (statut : ${domain.status}).`,
      }
    }

    return { ok: true, domainVerified: true }
  } catch (err) {
    return {
      ok: false,
      domainVerified: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
