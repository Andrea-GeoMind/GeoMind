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

import { toCsv, sortByScore, summarise, averageScore } from '@/scripts/prospection/csv'
import { topIssues } from '@/scripts/prospection/issues'
import type { Prospect } from '@/scripts/prospection/types'

const p = (over: Partial<Prospect>): Prospect => ({
  name: 'X', category: 'menuisier', phone: null, address: null, website: 'https://x.fr',
  reviewCount: 50, rating: 4.5, sourceId: 'x', email: null,
  expressScore: null, technicalScore: null, contentScore: null, topIssues: [], ...over,
})

describe('sortie CSV', () => {
  it('trie les plus faibles d’abord — ce sont les meilleurs prospects', () => {
    const rows = sortByScore([
      p({ name: 'fort', technicalScore: 90, contentScore: 90 }),
      p({ name: 'faible', technicalScore: 40, contentScore: 30 }),
      p({ name: 'moyen', technicalScore: 65, contentScore: 65 }),
    ])
    expect(rows.map((r) => r.name)).toEqual(['faible', 'moyen', 'fort'])
  })

  it('renvoie les audits en échec en fin de liste', () => {
    const rows = sortByScore([
      p({ name: 'echec', error: 'site injoignable' }),
      p({ name: 'faible', technicalScore: 40, contentScore: 40 }),
    ])
    expect(rows.map((r) => r.name)).toEqual(['faible', 'echec'])
  })

  it('échappe les champs contenant le séparateur ou des guillemets', () => {
    const csv = toCsv([p({ name: 'Durand; Fils', topIssues: ['Il dit "non"'] })])
    expect(csv).toContain('"Durand; Fils"')
    expect(csv).toContain('"Il dit ""non"""')
  })

  it('commence par un BOM — sans lui Excel FR casse les accents', () => {
    expect(toCsv([])).toMatch(/^﻿/)
  })

  it('compte les paliers sur la moyenne technique+contenu', () => {
    const s = summarise([
      p({ technicalScore: 80, contentScore: 80 }),
      p({ technicalScore: 65, contentScore: 65 }),
      p({ technicalScore: 55, contentScore: 55 }),
      p({ technicalScore: 40, contentScore: 40 }),
      p({ error: 'échec' }),
    ])
    expect(s).toMatchObject({ total: 5, audited: 4, failed: 1, under70: 3, under60: 2, under50: 1 })
  })

  it('ignore un pilier manquant dans la moyenne', () => {
    expect(averageScore(p({ technicalScore: 60, contentScore: null }))).toBe(60)
    expect(averageScore(p({}))).toBeNull()
  })
})

describe('sélection des 3 problèmes', () => {
  const issue = (o: Record<string, unknown>) =>
    ({ ruleKey: 'r', category: 'c', title: 'T', description: '', sampleUrls: [],
       severity: 'minor', effort: 2, impact: 2, ...o }) as never

  it('classe les majeurs avant les mineurs', () => {
    const out = topIssues(
      [issue({ ruleKey: 'title-missing', severity: 'minor' }),
       issue({ ruleKey: 'robots-txt-block-all', severity: 'major' })],
      []
    )
    expect(out[0]).toBe('Le site interdit l’accès aux robots des IA')
  })

  it('écarte les opportunités — ce ne sont pas des problèmes', () => {
    const out = topIssues([issue({ ruleKey: 'llms-txt-missing', severity: 'opportunity' })], [])
    expect(out).toHaveLength(0)
  })

  it('ne répète pas deux fois la même règle', () => {
    const out = topIssues(
      [issue({ ruleKey: 'h1-missing', severity: 'major' }),
       issue({ ruleKey: 'h1-missing', severity: 'major' })],
      []
    )
    expect(out).toHaveLength(1)
  })

  it('retombe sur le titre produit pour une règle non reformulée', () => {
    const out = topIssues([issue({ ruleKey: 'regle-inconnue', severity: 'major', title: 'Titre produit' })], [])
    expect(out[0]).toBe('Titre produit')
  })
})
