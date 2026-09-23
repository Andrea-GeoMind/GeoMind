import type { TechnicalPageRuleFn } from '../types'
import { hasNoindex, parseXRobotsTag } from '@/lib/crawl/robots-directives'
import { urlDepth } from './_metadata-helpers'

/**
 * Pages fonctionnelles ou légales qu'on met en noindex volontairement, et à
 * juste titre : les signaler reviendrait à demander au client de défaire une
 * bonne pratique.
 *
 * Les pages légales et cookies ont été ajoutées le 2026-09-23 : `/cookies` de
 * `lembellie-lyon.com` porte `follow, noindex, noarchive`, ce qui est normal,
 * et la règle en faisait un défaut majeur.
 */
const FUNCTIONAL_PATH_PATTERN =
  /^\/(login|signin|sign-in|signup|sign-up|register|connexion|inscription|se-connecter|mot-de-passe|reset-password|deconnexion|logout|panier|cart|checkout|commande|compte|account|mon-compte|dashboard|tableau-de-bord|admin|merci|thank-you|recherche|search|cookies?|gestion-des-cookies|preferences-cookies|politique-de-cookies|mentions|mentions-legales|legal|privacy|privacy-policy|confidentialite|politique-de-confidentialite|cgv|cgu|conditions-generales|conditions-d-utilisation|plan-du-site|sitemap|desabonnement|unsubscribe)(\/|$)/i

/**
 * Ressources qui ne sont pas des pages : un `sitemap.xml` servi en
 * `X-Robots-Tag: noindex, follow` suit la recommandation de Google, et un
 * flux ou un PDF n'a pas vocation à être « la page clé » d'un site.
 */
const NON_PAGE_EXTENSION = /\.(xml|txt|json|rss|atom|pdf|csv)$/i

function isExcludedPath(url: string): boolean {
  try {
    const { pathname } = new URL(url)
    return FUNCTIONAL_PATH_PATTERN.test(pathname) || NON_PAGE_EXTENSION.test(pathname)
  } catch {
    return false
  }
}

/**
 * Une URL paramétrée n'est pas la page clé, c'est une variante.
 *
 * `l-atelier-du-square.eatbu.com/?lang=en` a un pathname `/`, donc une
 * profondeur de 0 : elle passait pour la page d'accueil. Or les constructeurs
 * de sites mettent leurs variantes de langue en noindex exprès, pour éviter le
 * contenu dupliqué — la page française, elle, est parfaitement indexable.
 */
function isParameterised(url: string): boolean {
  try {
    return new URL(url).search !== ''
  } catch {
    return false
  }
}

/**
 * Directives d'indexation effectivement constatées sur la page.
 *
 * Le champ `robots` de Firecrawl n'est volontairement pas consulté : le
 * 2026-09-23 il annonçait `noindex` sur deux sites qui n'en portent aucun,
 * vérification faite en HTTP brut, en en-têtes et dans un navigateur. On ne
 * retient que ce qu'on a extrait soi-même du HTML brut (`robotsHtml`) et
 * l'en-tête `X-Robots-Tag` relevé par la sonde.
 *
 * `null` signifie « aucune des deux sources n'est disponible » : la page est
 * antérieure à ces relevés, et la règle se tait plutôt que de deviner.
 */
function observedDirectives(metadata: Record<string, unknown> | null | undefined): string[] | null {
  if (!metadata) return null

  const fromHtml = metadata.robotsHtml
  const htmlKnown = Array.isArray(fromHtml)
  const htmlDirectives = htmlKnown ? fromHtml.filter((d): d is string => typeof d === 'string') : []

  // `null` = sondée, pas d'en-tête. `undefined` = jamais sondée.
  const rawHeader = metadata.xRobotsTag
  const headerKnown = typeof rawHeader === 'string' || rawHeader === null
  const headerDirectives = typeof rawHeader === 'string' ? parseXRobotsTag(rawHeader) : []

  if (!htmlKnown && !headerKnown) return null
  return [...htmlDirectives, ...headerDirectives]
}

/**
 * Scope page : une page stratégique (accueil ou niveau 1) porte une directive
 * noindex — les IA ne l'indexeront jamais.
 */
export const checkNoindexOnKeyPages: TechnicalPageRuleFn = async (page) => {
  if (urlDepth(page.url) > 1) return null
  if (isParameterised(page.url)) return null
  if (isExcludedPath(page.url)) return null

  const directives = observedDirectives(page.metadata)
  if (directives === null) return null
  if (!hasNoindex(directives)) return null

  return {
    ruleKey: 'noindex_on_key_pages',
    category: 'accessibility',
    title: 'Page clé en noindex',
    description:
      "Cette page stratégique (accueil ou premier niveau) porte une directive noindex : vous demandez explicitement aux moteurs — y compris ceux qui alimentent ChatGPT et Perplexity — de ne jamais l'indexer. Elle ne sera donc jamais citée, retirez cette directive si ce n'est pas voulu.",
    sampleUrls: [page.url],
    severity: 'major',
    effort: 1,
    impact: 3,
  }
}
