import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { LOCAL_VISIBILITY_SERVICE } from '@/lib/plans'
import sitemap from '@/app/sitemap'

/**
 * Offre de service « Visibilité locale » (étape S1).
 *
 * Le texte de la page est celui fourni par Andrea, à la lettre. Ces tests
 * vérifient qu'il n'a pas dérivé, que les prix ne viennent que de
 * `lib/plans.ts`, et qu'aucune promesse de place dans les IA n'a été ajoutée.
 */
const lire = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const PAGE = lire('app/(marketing)/visibilite-locale/page.tsx')
const PAGE_URL = 'https://geomind.fr/visibilite-locale'

describe('texte de la page, à la lettre', () => {
  // Phrases sans prix : elles doivent figurer telles quelles dans la source.
  const PHRASES = [
    'Plus de clients qui vous trouvent, sur Google et dans les IA',
    "Aujourd'hui, vos clients vous cherchent sur Google Maps, et de plus en plus en demandant à ChatGPT.",
    "Je m'occupe de ces trois points en une semaine.",
    'Votre fiche Google, corrigée et complète : la bonne catégorie principale, une description claire, vos horaires, vos prestations, des photos.',
    '(Pages Jaunes, Houzz, Doctolib, Studiomaps...)',
    "Si je n'ai pas accès à votre site, je vous fournis les textes prêts à coller.",
    'un QR code et un message type à envoyer après chaque prestation',
    'Comment on mesure',
    'Ce que je ne promets pas',
    'Personne ne peut garantir une place dans les réponses de ChatGPT ou en tête de Google.',
    'Je garantis les travaux ; les résultats, on les mesure ensemble.',
    'Dois-je vous donner mon mot de passe ?',
    "Non. Vous m'ajoutez comme gestionnaire de votre fiche Google, et vous pouvez me retirer quand vous voulez.",
    "Je n'ai pas de site.",
    'Pourquoi payer à la livraison ?',
    'Parce que vous devez voir le travail avant de le payer.',
    'Réserver un appel de 10 minutes',
  ]
  for (const phrase of PHRASES) {
    it(`contient « ${phrase.slice(0, 50)}… »`, () => {
      // Le JSX coupe les longues lignes : on compare espaces normalisés.
      const norm = (s: string) => s.replace(/&apos;/g, "'").replace(/\s+/g, ' ')
      expect(norm(PAGE)).toContain(norm(phrase))
    })
  }

  it('n’emploie que des apostrophes droites, comme le texte fourni', () => {
    expect(PAGE).not.toMatch(/’/)
  })
})

describe('prix', () => {
  it('300 € une fois, suivi à 49 €/mois — depuis lib/plans.ts', () => {
    expect(LOCAL_VISIBILITY_SERVICE).toEqual({ price: 300, followUpMonthly: 49 })
  })

  it('l’accord est « payés » partout, encart compris', () => {
    // On paie 300 euros : le participe s'accorde au pluriel.
    const pricing = lire('app/(marketing)/pricing/page.tsx')
    expect(PAGE).toMatch(/payés à la livraison/)
    expect(pricing).toMatch(/payés à la livraison/)
    expect(PAGE + pricing).not.toMatch(/payé à la livraison/)
  })

  it('aucun prix écrit en dur dans la page ni dans l’encart', () => {
    expect(PAGE).not.toMatch(/\b300\b/)
    expect(PAGE).not.toMatch(/\b49\b/)
    const pricing = lire('app/(marketing)/pricing/page.tsx')
    expect(pricing).toMatch(/LOCAL_VISIBILITY_SERVICE\.price/)
    expect(pricing).toMatch(/LOCAL_VISIBILITY_SERVICE\.followUpMonthly/)
  })
})

describe('balisage Schema.org', () => {
  /** Bloc d'une offre, de son `'@id'` à la fin de son objet. */
  const offre = (ancre: string) => {
    const debut = PAGE.indexOf(`'@id': \`\${PAGE_URL}#${ancre}\``)
    expect(debut).toBeGreaterThan(-1)
    const fin = PAGE.indexOf("url: PAGE_URL,", debut)
    return PAGE.slice(debut, fin)
  }

  it('déclare un Service avec deux offres en euros', () => {
    expect(PAGE).toMatch(/'@type': 'Service'/)
    expect(PAGE.match(/'@type': 'Offer'/g) ?? []).toHaveLength(2)
    expect(PAGE.match(/priceCurrency: 'EUR'/g)?.length).toBeGreaterThanOrEqual(2)
  })

  it('la prestation est un paiement unique, sans périodicité', () => {
    const p = offre('offer')
    expect(p).toMatch(/price: String\(price\)/)
    expect(p).not.toMatch(/billingDuration|UnitPriceSpecification/)
  })

  it('le suivi est facturé au mois', () => {
    const s = offre('suivi')
    expect(s).toMatch(/price: String\(followUpMonthly\)/)
    expect(s).toMatch(/'@type': 'UnitPriceSpecification'/)
    expect(s).toMatch(/billingDuration: 'P1M'/)
  })

  it('déclare une FAQPage', () => {
    expect(PAGE).toMatch(/'@type': 'FAQPage'/)
  })
})

describe('aucune promesse de place', () => {
  it('ne promet ni position ni citation', () => {
    for (const interdit of [
      /vous serez cité/i,
      /garanti(e|t)? (d.être|une place|votre place)/i,
      /en première position/i,
      /top \d/i,
      /numéro 1/i,
    ]) {
      expect(PAGE).not.toMatch(interdit)
    }
  })
})

describe('accès à la page', () => {
  it('figure au sitemap avec la priorité 0.8', () => {
    const entree = sitemap().find((e) => e.url === 'https://geomind.fr/visibilite-locale')
    expect(entree?.priority).toBe(0.8)
  })

  it('est liée depuis l’accueil, le pied de page et les tarifs', () => {
    expect(lire('app/(marketing)/page.tsx')).toMatch(/href="\/visibilite-locale"/)
    expect(lire('components/features/marketing/footer.tsx')).toMatch(
      /href="\/visibilite-locale"/
    )
    expect(lire('app/(marketing)/pricing/page.tsx')).toMatch(/href="\/visibilite-locale"/)
  })

  it('le bouton de réservation ouvre l’agenda dans un nouvel onglet', () => {
    expect(PAGE).toMatch(/calendar\.google\.com\/calendar\/appointments\/schedules\//)
    expect(PAGE).toMatch(/rel="noopener noreferrer"/)
  })
})
