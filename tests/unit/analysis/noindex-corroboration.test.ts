import { describe, it, expect } from 'vitest'
import { checkNoindexOnKeyPages } from '@/lib/analysis/technical/rules/noindex-on-key-pages'
import {
  extractMetaRobots,
  mainHead,
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
      metadata: { robots: 'noindex', robotsSelf: [], xRobotsTag: null },
    }
    expect(await checkNoindexOnKeyPages(page, INPUT)).toBeNull()
  })

  it('se tait sur le tableau de doublons que renvoie une page d’obstacle', async () => {
    // Firecrawl a renvoyé ["noindex","noindex"] sur une variante eatbu.
    const page = {
      url: 'https://exemple.fr/',
      metadata: { robots: ['noindex', 'noindex'], robotsSelf: [], xRobotsTag: null },
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
    const page = { url: 'https://exemple.fr/', metadata: { robotsSelf: ['noindex, follow'] } }
    expect((await checkNoindexOnKeyPages(page, INPUT))?.severity).toBe('major')
  })

  it('signale quand seul l’en-tête X-Robots-Tag le porte', async () => {
    // Directive invisible dans le HTML : c’est tout l’intérêt de la sonde.
    const page = {
      url: 'https://exemple.fr/services',
      metadata: { robotsSelf: [], xRobotsTag: 'noindex' },
    }
    expect((await checkNoindexOnKeyPages(page, INPUT))?.ruleKey).toBe('noindex_on_key_pages')
  })
})

describe('pages légitimement en noindex', () => {
  const noindexed = (url: string) => ({ url, metadata: { robotsSelf: ['noindex'] } })

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
      metadata: { robotsSelf: ['noindex'] },
    }
    expect(await checkNoindexOnKeyPages(page, INPUT)).toBeNull()
  })

  it('ignore toute URL paramétrée, y compris au premier niveau', async () => {
    for (const url of [
      'https://x.fr/?lang=de',
      'https://x.fr/?utm_source=gmb',
      'https://x.fr/services?filtre=2',
    ]) {
      expect(await checkNoindexOnKeyPages({ url, metadata: { robotsSelf: ['noindex'] } }, INPUT))
        .toBeNull()
    }
  })

  it('signale toujours la racine nue et le premier niveau', async () => {
    for (const url of ['https://x.fr/', 'https://x.fr', 'https://x.fr/a-propos']) {
      expect(
        await checkNoindexOnKeyPages({ url, metadata: { robotsSelf: ['noindex'] } }, INPUT)
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

/**
 * Régression du 24/09/2026 — le faux positif de `lembellie-lyon.com`.
 *
 * Le `noindex` rapporté par Firecrawl appartenait à l'iframe utilitaire
 * d'AddToAny. Firecrawl exécute le JavaScript et aplatit les iframes dans le
 * HTML parent (`data-original-tag="iframe"`), si bien que le head d'un
 * document tiers se retrouve au milieu du corps de la page.
 */
describe('un meta robots hors du head du document ne compte pas', () => {
  // Reproduit la structure exacte relevée sur lembellie-lyon.com.
  const pageAvecAddToAny = `<!DOCTYPE html><html lang="fr"><head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <title>L'Embellie - Centre de Beauté</title>
    </head><body>
      <div id="a2a_sm_ifr" title="AddToAny Utility Frame" data-original-tag="iframe">
        <!DOCTYPE html><html><head><title>A2A</title>
        <meta name="robots" content="noindex"></head></html>
      </div>
      <h1>Institut de beauté à Lyon</h1>
    </body></html>`

  it('ignore le meta robots d’un widget tiers aplati dans le corps', () => {
    expect(extractMetaRobots(pageAvecAddToAny)).toEqual([])
    expect(hasNoindex(extractMetaRobots(pageAvecAddToAny))).toBe(false)
  })

  it('lit toujours celui du head du document principal', () => {
    const html = `<html><head><meta name="robots" content="noindex"></head><body>x</body></html>`
    expect(extractMetaRobots(html)).toEqual(['noindex'])
  })

  it('ne se laisse pas avoir par un head tiers placé avant le vrai', () => {
    // Le head du document principal est le premier : on s'arrête à sa fermeture.
    const html = `<html><head><title>Vrai</title></head><body>
      <div data-original-tag="iframe"><head><meta name="robots" content="noindex"></head></div>
    </body></html>`
    expect(hasNoindex(extractMetaRobots(html))).toBe(false)
  })

  it('renvoie une liste vide quand le document n’a pas de head', () => {
    expect(extractMetaRobots('<div>pas de head</div>')).toEqual([])
  })

  it('isole bien la tête du document principal', () => {
    const html = '<html><head><title>Vrai</title></head><body><head>faux</head></body></html>'
    expect(mainHead(html)).toContain('<title>Vrai</title>')
    expect(mainHead(html)).not.toContain('faux')
    // Fragment sans head : tout ce qui précède le body fait office de tête.
    expect(mainHead('<meta name="robots" content="noindex"><body>x</body>')).toContain('robots')
  })
})

describe('la règle ne se fie qu’à notre propre lecture', () => {
  it('se tait quand seul Firecrawl voit le noindex', async () => {
    // `robotsHtml` vient du rawHtml de Firecrawl : même requête que `robots`,
    // donc pas une source indépendante. La sonde, elle, n'a rien vu.
    const page = {
      url: 'https://www.lembellie-lyon.com/',
      metadata: {
        robots: 'noindex',
        robotsHtml: ['noindex'],
        robotsSelf: [],
        xRobotsTag: null,
        robotsForBot: null,
      },
    }
    expect(await checkNoindexOnKeyPages(page, INPUT)).toBeNull()
  })

  it('nomme le robot quand le site lui réserve la consigne', async () => {
    const page = {
      url: 'https://exemple.fr/',
      metadata: {
        robotsSelf: [],
        xRobotsTag: null,
        robotsForBot: { bot: 'GPTBot', directives: ['noindex'] },
      },
    }
    const issue = await checkNoindexOnKeyPages(page, INPUT)
    expect(issue?.title).toBe('Votre site sert une consigne noindex à GPTBot')
    expect(issue?.severity).toBe('major')
    // Le message doit dire que le navigateur, lui, reçoit la page normalement.
    expect(issue?.description).toMatch(/navigateur reçoit cette page normalement/)
  })

  it('préfère le constat général quand le navigateur le voit aussi', async () => {
    const page = {
      url: 'https://exemple.fr/',
      metadata: {
        robotsSelf: ['noindex'],
        robotsForBot: { bot: 'GPTBot', directives: ['noindex'] },
      },
    }
    expect((await checkNoindexOnKeyPages(page, INPUT))?.title).toBe('Page clé en noindex')
  })

  it('ignore un robotsForBot mal formé', async () => {
    // Donnée persistée : elle peut être incomplète ou d'une version antérieure.
    for (const forBot of [{}, { bot: '' }, { bot: 42 }, 'GPTBot'] as unknown[]) {
      const page = {
        url: 'https://exemple.fr/',
        metadata: { robotsSelf: [], robotsForBot: forBot } as Record<string, unknown>,
      }
      expect(await checkNoindexOnKeyPages(page, INPUT)).toBeNull()
    }
  })
})
