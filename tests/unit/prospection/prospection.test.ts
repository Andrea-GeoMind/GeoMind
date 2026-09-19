import { describe, it, expect } from 'vitest'
import { isFranchise, detectSharedDomains } from '@/scripts/prospection/franchises'
import { extractEmails, pickBest, isNominative } from '@/scripts/prospection/email'
import { parseDisallow, isAllowed } from '@/scripts/prospection/polite-fetch'

describe('exclusion des franchises', () => {
  it('écarte les réseaux connus, quelle que soit la casse ou les accents', () => {
    expect(isFranchise("SoCoo'c Lyon Est", null)).toBe(true)
    expect(isFranchise('Cuisines Schmidt Villeurbanne', null)).toBe(true)
    expect(isFranchise('AvivA Cuisines', null)).toBe(true)
    expect(isFranchise('Dentego Part-Dieu', null)).toBe(true)
  })

  it('écarte sur le domaine de tête de réseau', () => {
    expect(isFranchise('Cuisines du Rhône', 'https://www.socooc.fr/lyon')).toBe(true)
    expect(isFranchise('Atelier Bois', 'https://atelier-bois-lyon.fr')).toBe(false)
  })

  it('laisse passer un indépendant', () => {
    expect(isFranchise('Menuiserie Durand & Fils', 'https://menuiserie-durand.fr')).toBe(false)
  })

  it('repère un réseau non listé par le partage de domaine', () => {
    const shared = detectSharedDomains([
      'https://reseau-x.fr/lyon1', 'https://reseau-x.fr/lyon2',
      'https://reseau-x.fr/lyon3', 'https://independant.fr',
    ])
    expect(shared.has('reseau-x.fr')).toBe(true)
    expect(shared.has('independant.fr')).toBe(false)
  })
})

describe('extraction d’email', () => {
  it('préfère une adresse nominative à une générique', () => {
    const html = '<a href="mailto:contact@cabinet.fr">nous écrire</a> ou marie.dupont@cabinet.fr'
    expect(pickBest(extractEmails(html, 'cabinet.fr'), 'cabinet.fr')).toBe('marie.dupont@cabinet.fr')
  })

  it('préfère le domaine du site à une adresse externe', () => {
    const html = 'jean@gmail.com et contact@menuiserie.fr'
    expect(pickBest(extractEmails(html, 'menuiserie.fr'), 'menuiserie.fr')).toBe('contact@menuiserie.fr')
  })

  it('ignore le bruit : images, prestataires, noreply', () => {
    const html = 'logo@2x.png sentry@sentry.io noreply@site.fr vrai.contact@site.fr'
    const found = extractEmails(html, 'site.fr')
    expect(found).toContain('vrai.contact@site.fr')
    expect(found.join()).not.toContain('sentry.io')
    expect(found.join()).not.toContain('.png')
    expect(found.join()).not.toContain('noreply@')
  })

  it('classe correctement nominatif et générique', () => {
    expect(isNominative('marie.dupont@x.fr')).toBe(true)
    expect(isNominative('p-martin@x.fr')).toBe(true)
    expect(isNominative('contact@x.fr')).toBe(false)
    expect(isNominative('devis@x.fr')).toBe(false)
  })

  it('renvoie null quand il n’y a rien', () => {
    expect(pickBest([], 'x.fr')).toBeNull()
  })
})

describe('respect de robots.txt', () => {
  it('retient les règles du groupe * et celles qui nous visent', () => {
    const txt = `User-agent: *\nDisallow: /admin\nDisallow: /wp-admin\n\nUser-agent: GeoMindBot\nDisallow: /prive`
    const rules = parseDisallow(txt)
    expect(rules).toContain('/admin')
    expect(rules).toContain('/prive')
  })

  it('ignore les règles visant un autre robot', () => {
    const txt = `User-agent: SemrushBot\nDisallow: /\n\nUser-agent: *\nDisallow: /tmp`
    const rules = parseDisallow(txt)
    expect(rules).toEqual(['/tmp'])
    expect(isAllowed('/contact', rules)).toBe(true)
  })

  it('un site fermé à tous bloque tout', () => {
    const rules = parseDisallow('User-agent: *\nDisallow: /')
    expect(isAllowed('/contact', rules)).toBe(false)
  })

  it('robots.txt vide n’interdit rien — défaut du standard', () => {
    expect(isAllowed('/contact', parseDisallow(''))).toBe(true)
  })
})
