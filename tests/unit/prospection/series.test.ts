import { describe, it, expect } from 'vitest'
import { getSeries, SERIES } from '@/scripts/prospection/series'
import { listingPlatform } from '@/scripts/prospection/listing'
import { detectNetworkMarkers } from '@/scripts/prospection/network'
import { isFranchise } from '@/scripts/prospection/franchises'
import { platformSubdomain } from '@/scripts/prospection/platform'
import { budgetRefusal } from '@/scripts/prospection/budget'

describe('séries de prospection', () => {
  it('expose les deux séries et refuse une clé inconnue', () => {
    expect(getSeries('artisans').categories).toContain('plombier chauffagiste')
    expect(getSeries('commerces').categories).toContain('institut de beauté')
    expect(() => getSeries('boulangers')).toThrow(/Série inconnue/)
  })

  it('ne garde le filtre dépannage que pour les métiers du bâtiment', () => {
    // « 24h », « SOS » et « urgence » sont des signaux justes pour un plombier
    // et faux pour une salle de sport ouverte 24h/24.
    expect(SERIES.artisans.excludeEmergency).toBe(true)
    expect(SERIES.commerces.excludeEmergency).toBe(false)
  })

  it('couvre les cinq familles demandées pour la série commerces', () => {
    const c = SERIES.commerces.categories.join(' ')
    expect(c).toMatch(/coworking/)
    expect(c).toMatch(/sport|crossfit/)
    expect(c).toMatch(/yoga|pilates/)
    expect(c).toMatch(/barbier|beauté/)
    expect(c).toMatch(/cave|épicerie/)
    expect(c).toMatch(/bistrot|restaurant/)
  })
})

describe('fiches de plateforme tierce', () => {
  it('écarte une fiche de réservation ou un profil social', () => {
    expect(listingPlatform('https://www.planity.com/alex-barber-69002-lyon')).toBe('planity.com')
    expect(listingPlatform('https://www.instagram.com/lupo_lyon')).toBe('instagram.com')
    expect(listingPlatform('https://www.facebook.com/caves-de-perrache')).toBe('facebook.com')
  })

  it('laisse passer un site propre', () => {
    expect(listingPlatform('https://yogakorner.fr/')).toBeNull()
    expect(listingPlatform(null)).toBeNull()
  })

  it('se distingue du sous-domaine de plateforme, qui reste un prospect', () => {
    // Sur `x.wixsite.com` la page appartient encore à l'entreprise : on la
    // garde et on la priorise. Sur `planity.com/x` elle appartient à Planity.
    expect(platformSubdomain('https://boulangerie.wixsite.com/pain')).toBe('wixsite.com')
    expect(listingPlatform('https://boulangerie.wixsite.com/pain')).toBeNull()
    expect(platformSubdomain('https://l-atelier-du-square.eatbu.com/')).toBe('eatbu.com')
  })
})

describe('détection d’un réseau par la page d’accueil', () => {
  it('reconnaît les libellés de navigation multi-établissements', () => {
    // Relevés au dry-run du 23/09 : ces cinq enseignes ne se trahissaient ni
    // par leur nom ni par leur URL.
    for (const html of [
      '<nav><a href="/salles">Nos salles</a></nav>',
      '<ul><li>Nos adresses</li></ul>',
      '<a>Nos ateliers</a>',
      '<a>nos centres</a>',
      '<a>Nos instituts</a>',
      '<a>Nos salons</a>',
    ]) {
      expect(detectNetworkMarkers(html).isNetwork).toBe(true)
    }
  })

  it('rend l’extrait qui a déclenché la détection', () => {
    expect(detectNetworkMarkers('<p>Découvrez Nos clubs</p>').evidence).toBe('Nos clubs')
  })

  it('ne déclenche pas sur un établissement qui parle de lui-même', () => {
    expect(detectNetworkMarkers('<p>Notre salle de 300 m² au cœur de Lyon.</p>').isNetwork).toBe(
      false
    )
    expect(detectNetworkMarkers('<p>La cave est ouverte du mardi au samedi.</p>').isNetwork).toBe(
      false
    )
  })

  it('ignore scripts et styles, pour ne pas lire du JSON de configuration', () => {
    const html = '<script>var menu = "Nos salles"</script><p>Bienvenue</p>'
    expect(detectNetworkMarkers(html).isNetwork).toBe(false)
  })
})

describe('franchises des secteurs commerce', () => {
  it('écarte les enseignes nationales sur le nom', () => {
    expect(isFranchise('Basic-Fit Lyon Part-Dieu', null)).toBe(true)
    expect(isFranchise('Club Pilates Lyon Foch', null)).toBe(true)
    expect(isFranchise('Yves Rocher Bellecour', null)).toBe(true)
    expect(isFranchise('Del Arte Confluence', null)).toBe(true)
  })

  it('écarte un sous-domaine d’enseigne', () => {
    expect(
      isFranchise('Institut de la Presqu’Île', 'https://institut-presquile-lyon.guinot.com/')
    ).toBe(true)
  })

  it('écarte une page de salon dans un site de chaîne', () => {
    expect(isFranchise('DÉSIRÉ Lyon Foch', 'https://www.desire-barbershop.com/salons/lyon-6-foch')).toBe(
      true
    )
  })

  it('laisse passer les indépendants du secteur', () => {
    expect(isFranchise('Yoga Korner', 'https://yogakorner.fr/')).toBe(false)
    expect(isFranchise('Epicerie Madame', 'http://www.epiceriemadame.fr/')).toBe(false)
    expect(isFranchise('Crossfit des Pentes', 'http://www.crossfitdespentes.fr/')).toBe(false)
    // « Chez Nicolas » ne doit pas être pris pour la chaîne Nicolas.
    expect(isFranchise('Cave Chez Nicolas', 'https://cave-chez-nicolas.fr/')).toBe(false)
  })
})

describe('réserve de crédits Firecrawl', () => {
  it('refuse une série qui descendrait sous la réserve de production', () => {
    // Le cas du 23/09 : solde 240, série à 150 → il resterait 90, sous 150.
    const refus = budgetRefusal({ estimated: 150, creditBudget: 150, remaining: 240 })
    expect(refus).toMatch(/réserve de production/)
    expect(refus).toMatch(/90 crédits/)
  })

  it('laisse passer quand la réserve reste couverte', () => {
    expect(budgetRefusal({ estimated: 150, creditBudget: 150, remaining: 400 })).toBeNull()
  })

  it('accepte tout juste à la limite', () => {
    expect(budgetRefusal({ estimated: 50, creditBudget: 50, remaining: 200 })).toBeNull()
    expect(budgetRefusal({ estimated: 51, creditBudget: 60, remaining: 200 })).not.toBeNull()
  })

  it('garde le plafond explicite prioritaire sur le reste', () => {
    expect(budgetRefusal({ estimated: 200, creditBudget: 150, remaining: 10_000 })).toMatch(
      /plafond de 150/
    )
  })

  it('signale un solde insuffisant avant de parler de réserve', () => {
    expect(budgetRefusal({ estimated: 150, creditBudget: 150, remaining: 40 })).toMatch(
      /solde insuffisant/
    )
  })

  it('ne bloque pas sur un solde inconnu, le plafond explicite suffit', () => {
    expect(budgetRefusal({ estimated: 150, creditBudget: 150, remaining: null })).toBeNull()
  })

  it('peut être levée sciemment', () => {
    expect(
      budgetRefusal({ estimated: 150, creditBudget: 150, remaining: 240, ignoreReserve: true })
    ).toBeNull()
  })
})
