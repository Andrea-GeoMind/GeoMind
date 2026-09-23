import { describe, it, expect } from 'vitest'
import { checkNoindexOnKeyPages } from '@/lib/analysis/technical/rules/noindex-on-key-pages'
import {
  extractMetaRobots,
  parseXRobotsTag,
  hasNoindex,
} from '@/lib/crawl/robots-directives'

const INPUT = { pages: [], siteUrl: 'https://x.fr' }

/**
 * Régression du 2026-09-23. La règle `noindex_on_key_pages`, de sévérité
 * majeure, a signalé deux sites réels qui ne portent aucun noindex :
 * `lembellie-lyon.com` et `l-atelier-du-square.eatbu.com`. Vérifié en HTTP
 * brut, en en-têtes de réponse et dans un navigateur — zéro meta robots.
 * Firecrawl, lui, renvoyait « noindex ».
 */
describe('la règle n’affirme rien sur le seul champ robots de Firecrawl', () => {
  it('se tait quand Firecrawl annonce noindex et que le HTML brut le dément', async () => {
    // Le cas exact de lembellie-lyon.com.
    const page = {
      url: 'https://www.lembellie-lyon.com/',
      metadata: { robots: 'noindex', robotsHtml: [], xRobotsTag: null },
    }
    expect(await checkNoindexOnKeyPages(page, INPUT)).toBeNull()
  })

  it('se tait sur le tableau de doublons que renvoie une page d’obstacle', async () => {
    // Firecrawl a renvoyé ["noindex","noindex"] sur une variante eatbu.
    const page = {
      url: 'https://exemple.fr/',
      metadata: { robots: ['noindex', 'noindex'], robotsHtml: [], xRobotsTag: null },
    }
    expect(await checkNoindexOnKeyPages(page, INPUT)).toBeNull()
  })

  it('se tait quand aucune source de recoupement n’est disponible', async () => {
    // Page crawlée avant que `robotsHtml` et `xRobotsTag` existent : on ne
    // sait pas, et « je ne sais pas » ne vaut pas « c’est un défaut ».
    const page = { url: 'https://exemple.fr/', metadata: { robots: 'noindex' } }
    expect(await checkNoindexOnKeyPages(page, INPUT)).toBeNull()
  })

  it('signale quand le HTML brut le confirme', async () => {
    const page = { url: 'https://exemple.fr/', metadata: { robotsHtml: ['noindex, follow'] } }
    expect((await checkNoindexOnKeyPages(page, INPUT))?.severity).toBe('major')
  })

  it('signale quand seul l’en-tête X-Robots-Tag le porte', async () => {
    // Directive invisible dans le HTML : c’est tout l’intérêt de la sonde.
    const page = {
      url: 'https://exemple.fr/services',
      metadata: { robotsHtml: [], xRobotsTag: 'noindex' },
    }
    expect((await checkNoindexOnKeyPages(page, INPUT))?.ruleKey).toBe('noindex_on_key_pages')
  })
})

describe('pages légitimement en noindex', () => {
  const noindexed = (url: string) => ({ url, metadata: { robotsHtml: ['noindex'] } })

  it('ne reproche pas son noindex à une page cookies ou légale', async () => {
    // `/cookies` de lembellie porte « follow, noindex, noarchive » : normal.
    for (const url of [
      'https://x.fr/cookies',
      'https://x.fr/gestion-des-cookies',
      'https://x.fr/mentions-legales',
      'https://x.fr/politique-de-confidentialite',
      'https://x.fr/confidentialite/',
      'https://x.fr/cgv',
      'https://x.fr/cgu',
      'https://x.fr/privacy-policy',
    ]) {
      expect(await checkNoindexOnKeyPages(noindexed(url), INPUT)).toBeNull()
    }
  })

  it('n’évalue pas un sitemap ni un flux comme une page clé', async () => {
    // `X-Robots-Tag: noindex, follow` sur un sitemap suit la recommandation
    // de Google. C’était remonté en défaut majeur.
    for (const url of [
      'https://x.fr/sitemap.xml',
      'https://x.fr/sitemap',
      'https://x.fr/feed.rss',
      'https://x.fr/plaquette.pdf',
      'https://x.fr/llms.txt',
    ]) {
      expect(await checkNoindexOnKeyPages(noindexed(url), INPUT)).toBeNull()
    }
  })

  it('garde les pages de connexion et de compte exclues', async () => {
    for (const url of ['https://x.fr/login', 'https://x.fr/panier', 'https://x.fr/mon-compte']) {
      expect(await checkNoindexOnKeyPages(noindexed(url), INPUT)).toBeNull()
    }
  })
})

describe('seule l’URL racine sans paramètre est la page d’accueil', () => {
  it('ignore une variante de langue en query string', async () => {
    // `/?lang=en` a un pathname `/`, donc profondeur 0 : elle passait pour
    // l’accueil. Les constructeurs de sites désindexent ces variantes exprès.
    const page = {
      url: 'https://l-atelier-du-square.eatbu.com/?lang=en',
      metadata: { robotsHtml: ['noindex'] },
    }
    expect(await checkNoindexOnKeyPages(page, INPUT)).toBeNull()
  })

  it('ignore toute URL paramétrée, y compris au premier niveau', async () => {
    for (const url of [
      'https://x.fr/?lang=de',
      'https://x.fr/?utm_source=gmb',
      'https://x.fr/services?filtre=2',
    ]) {
      expect(await checkNoindexOnKeyPages({ url, metadata: { robotsHtml: ['noindex'] } }, INPUT))
        .toBeNull()
    }
  })

  it('signale toujours la racine nue et le premier niveau', async () => {
    for (const url of ['https://x.fr/', 'https://x.fr', 'https://x.fr/a-propos']) {
      expect(
        await checkNoindexOnKeyPages({ url, metadata: { robotsHtml: ['noindex'] } }, INPUT)
      ).not.toBeNull()
    }
  })
})

describe('extraction des directives', () => {
  it('lit les meta robots quel que soit l’ordre des attributs et les guillemets', () => {
    expect(extractMetaRobots('<meta name="robots" content="noindex, nofollow">')).toEqual([
      'noindex, nofollow',
    ])
    expect(extractMetaRobots("<meta content='noindex' name='robots' />")).toEqual(['noindex'])
    expect(extractMetaRobots('<meta name=robots content=noindex>')).toEqual(['noindex'])
  })

  it('retient aussi les agents d’indexation nommés', () => {
    const html = '<meta name="googlebot" content="noindex"><meta name="GPTBot" content="noindex">'
    expect(extractMetaRobots(html)).toEqual(['noindex', 'noindex'])
  })

  it('ignore les autres balises meta', () => {
    const html = '<meta name="viewport" content="width=device-width"><meta name="author" content="noindex">'
    expect(extractMetaRobots(html)).toEqual([])
  })

  it('distingue « pas de HTML » de « pas de directive »', () => {
    expect(extractMetaRobots(null)).toBeNull()
    expect(extractMetaRobots('')).toBeNull()
    expect(extractMetaRobots('<html><head></head></html>')).toEqual([])
  })

  it('parse l’en-tête X-Robots-Tag, avec ou sans agent', () => {
    expect(parseXRobotsTag('noindex, follow')).toEqual(['noindex', 'follow'])
    expect(parseXRobotsTag('googlebot: noindex')).toEqual(['noindex'])
    expect(parseXRobotsTag(null)).toEqual([])
    // Une date n’est pas un agent : la directive reste entière.
    expect(parseXRobotsTag('unavailable_after: 2026-01-01')).toEqual([
      'unavailable_after: 2026-01-01',
    ])
  })

  it('reconnaît noindex et none, pas index', () => {
    expect(hasNoindex(['index, follow'])).toBe(false)
    expect(hasNoindex(['follow, noindex, noarchive'])).toBe(true)
    expect(hasNoindex(['none'])).toBe(true)
    expect(hasNoindex([])).toBe(false)
    expect(hasNoindex(null)).toBe(false)
  })
})
