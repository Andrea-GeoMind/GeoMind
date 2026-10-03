import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Les pages publiques ne promettent que ce que la production fait.
 *
 * Relevé le 2026-10-03 : l'accueil, la page Tarifs et deux articles
 * annonçaient une surveillance hebdomadaire avec alertes email. En base, aucune
 * mesure de surveillance n'a jamais existé — crons non enregistrés chez Inngest
 * de juin à septembre, puis `MONITORING_PAUSED` depuis le 19/09.
 *
 * Ce test casse volontairement le jour où la surveillance sera lancée : il
 * faudra alors le réécrire, en connaissance de cause, plutôt que de laisser
 * revenir la promesse par accident.
 */
const lire = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')

const PAGES = [
  'app/(marketing)/page.tsx',
  'app/(marketing)/blog/geo-ecommerce/page.tsx',
  'app/(marketing)/blog/apparaitre-dans-gemini/page.tsx',
]

describe('aucune promesse de surveillance active', () => {
  for (const page of PAGES) {
    it(`${page} ne promet ni veille ni alerte`, () => {
      const src = lire(page)
      expect(src).not.toMatch(/vous alerte/)
      expect(src).not.toMatch(/vous prévient quand/)
      expect(src).not.toMatch(/re-?vérifie votre visibilité chaque semaine/)
      expect(src).not.toMatch(/recevez une alerte/)
      expect(src).not.toMatch(/score GEO en temps réel/)
    })
  }

  it('le plan Gratuit n’annonce plus de surveillance', () => {
    const src = lire('components/features/marketing/pricing-plans.tsx')
    expect(src).not.toMatch(/Surveillance mensuelle/)
  })

  it('le tableau des tarifs ne coche pas la surveillance pour le Gratuit', () => {
    const src = lire('app/(marketing)/pricing/page.tsx')
    expect(src).not.toMatch(/values=\{\['mensuelle'/)
  })

  it('l’accueil dit que la surveillance arrivera avec les plans payants', () => {
    expect(lire('app/(marketing)/page.tsx')).toMatch(
      /La surveillance automatique, avec alertes email, arrivera avec les plans payants/
    )
  })
})

describe('la maquette de l’accueil est un exemple déclaré', () => {
  const src = lire('app/(marketing)/page.tsx')

  it('affiche un domaine fictif, pas geomind.fr', () => {
    // Elle affichait « geomind.fr », 72/100, Autorité 68 : un faux score
    // présenté comme celui de GeoMind, dont l'Autorité réelle était à 0.
    expect(src).toMatch(/EXAMPLE_DOMAIN = 'boulangerie-exemple\.fr'/)
    expect(src).not.toMatch(/^\s*geomind\.fr\s*$/m)
  })

  it('porte l’étiquette « Exemple » aux deux endroits', () => {
    expect(src.match(/<ExampleBadge\b/g) ?? []).toHaveLength(2)
  })
})

