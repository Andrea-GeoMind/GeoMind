import { describe, it, expect, vi } from 'vitest'

// Les templates importent `sendEmail`, qui instancie Resend et valide tout
// l'environnement au chargement. On ne teste ici que la génération du HTML.
vi.mock('@/lib/email/send', () => ({ sendEmail: vi.fn() }))

import { auditMagicLinkHtml } from '@/lib/email/templates/audit-magic-link'
import { lowCreditsEmailHtml } from '@/lib/email/templates/low-credits'
import { signInLinkHtml } from '@/lib/email/templates/sign-in-link'

/**
 * Les emails partent chez des TPE/PME françaises : aucun ne doit repartir en
 * anglais par inadvertance, et le lien magique doit porter le domaine audité.
 */

const ENGLISH_GIVEAWAYS =
  /\b(Confirm Your|Sign ?up|Reset your password|Click here|Follow this link|Welcome to|Your account)\b/i

describe('audit-magic-link', () => {
  const html = auditMagicLinkHtml({
    domain: 'moncabinet.fr',
    actionLink: 'https://geomind.fr/auth/callback?token=abc',
    score: 91,
  })

  it('porte le domaine audité et la note technique', () => {
    expect(html).toContain('moncabinet.fr')
    expect(html).toContain('91/100')
  })

  it('intègre le lien d’action tel quel', () => {
    expect(html).toContain('href="https://geomind.fr/auth/callback?token=abc"')
  })

  it('reste en français et renvoie à la politique de confidentialité', () => {
    expect(html).not.toMatch(ENGLISH_GIVEAWAYS)
    expect(html).toContain('/legal/privacy')
  })

  it('annonce la péremption du lien — un lien magique n’est pas permanent', () => {
    expect(html).toMatch(/valable une heure/i)
  })
})

describe('emails transactionnels existants', () => {
  it('low-credits ne contient pas d’anglais résiduel', () => {
    expect(lowCreditsEmailHtml({ remaining: 120, allowance: 1000 })).not.toMatch(ENGLISH_GIVEAWAYS)
  })
})


/**
 * Régression du 23/09/2026 : la page de connexion n'offrait que
 * email + mot de passe, alors que le tunnel d'audit public crée des comptes
 * sans mot de passe. Ces clients n'avaient aucune porte d'entrée sensée.
 */
describe('sign-in-link', () => {
  const html = signInLinkHtml({
    actionLink: 'https://geomind.fr/auth/confirm?token_hash=abc&type=magiclink',
  })

  it('porte le lien fourni', () => {
    expect(html).toContain('https://geomind.fr/auth/confirm?token_hash=abc&type=magiclink')
  })

  it('annonce la durée de validité et l’usage unique', () => {
    expect(html).toMatch(/valable une heure/)
    expect(html).toMatch(/ne fonctionne qu'une fois/)
  })

  it('dit quoi faire quand la demande ne vient pas du destinataire', () => {
    expect(html).toMatch(/ignorez ce message/)
  })

  it('reste en français', () => {
    expect(html).not.toMatch(ENGLISH_GIVEAWAYS)
  })
})
