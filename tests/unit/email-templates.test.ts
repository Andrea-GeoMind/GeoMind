import { describe, it, expect, vi } from 'vitest'

// Les templates importent `sendEmail`, qui instancie Resend et valide tout
// l'environnement au chargement. On ne teste ici que la génération du HTML.
vi.mock('@/lib/email/send', () => ({ sendEmail: vi.fn() }))

import { auditMagicLinkHtml } from '@/lib/email/templates/audit-magic-link'
import { lowCreditsEmailHtml } from '@/lib/email/templates/low-credits'

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
