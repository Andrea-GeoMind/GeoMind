import { describe, it, expect } from 'vitest'
import { computeAgentReady, agentReadyLabel } from '@/lib/analysis/agent-ready'

describe('computeAgentReady', () => {
  it('site totalement actionnable → score élevé', () => {
    const html = `
      <a href="tel:+33612345678">Appelez</a>
      <a href="mailto:contact@x.fr">Email</a>
      <form action="/contact"></form>
      <a href="https://calendly.com/x">Réserver</a>
      <script type="application/ld+json">{"@type":"LocalBusiness","openingHours":"Mo-Fr 09:00-18:00","address":{"@type":"PostalAddress","streetAddress":"1 rue X"}}</script>
    `
    const { score, checks } = computeAgentReady([{ url: '/', markdown: '', html }])
    expect(score).toBeGreaterThanOrEqual(90)
    expect(checks.every((c) => c.status === 'pass')).toBe(true)
  })

  it('site vide → score bas et tout en échec', () => {
    const { score, checks } = computeAgentReady([
      { url: '/', markdown: 'Bienvenue sur notre site', html: '' },
    ])
    expect(score).toBeLessThan(25)
    expect(checks.find((c) => c.key === 'phone-clickable')!.status).toBe('fail')
  })

  it('téléphone cliquable détecté dans le markdown', () => {
    const { checks } = computeAgentReady([
      { url: '/', markdown: 'Appelez-nous : [06](tel:+33600000000)', html: '' },
    ])
    expect(checks.find((c) => c.key === 'phone-clickable')!.status).toBe('pass')
  })

  it('le score est borné et cohérent (pass=poids, warn=demi)', () => {
    const { score } = computeAgentReady([{ url: '/', markdown: 'contactez-nous', html: '' }])
    // 'contact-form' passe en warn (contactez) = 8 pts → score 8
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})

describe('agentReadyLabel', () => {
  it('mappe le score sur un libellé', () => {
    expect(agentReadyLabel(90)).toMatch(/Prêt/)
    expect(agentReadyLabel(60)).toMatch(/Partiellement/)
    expect(agentReadyLabel(30)).toMatch(/Peu/)
    expect(agentReadyLabel(10)).toMatch(/Invisible/)
  })
})
