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
 * Directives constatées par NOTRE propre lecture, avec un user-agent de
 * navigateur : `robotsSelf` (head du document) et l'en-tête `X-Robots-Tag`.
 *
 * Le champ `robots` de Firecrawl n'est pas consulté, et `robotsHtml` — extrait
 * du `rawHtml` de Firecrawl — ne l'est plus non plus : les deux viennent de la
 * même requête, donc se recouper l'un l'autre ne prouve rien. C'est ce qui a
 * laissé passer le faux positif de `lembellie-lyon.com` le 24/09.
 *
 * `null` signifie « page jamais sondée » : la règle se tait plutôt que de
 * deviner.
 */
function observedDirectives(metadata: Record<string, unknown> | null | undefined): string[] | null {
  if (!metadata) return null

  const fromSelf = metadata.robotsSelf
  const selfKnown = Array.isArray(fromSelf)
  const selfDirectives = selfKnown ? fromSelf.filter((d): d is string => typeof d === 'string') : []

  // `null` = sondée, pas d'en-tête. `undefined` = jamais sondée.
  const rawHeader = metadata.xRobotsTag
  const headerKnown = typeof rawHeader === 'string' || rawHeader === null
  const headerDirectives = typeof rawHeader === 'string' ? parseXRobotsTag(rawHeader) : []

  if (!selfKnown && !headerKnown) return null
  return [...selfDirectives, ...headerDirectives]
}

/** Robot d'IA à qui le site réserve une consigne, relevé par la sonde. */
function robotsForBot(
  metadata: Record<string, unknown> | null | undefined
): { bot: string } | null {
  const value = metadata?.robotsForBot
  if (!value || typeof value !== 'object') return null
  const bot = (value as { bot?: unknown }).bot
  return typeof bot === 'string' && bot !== '' ? { bot } : null
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

  if (hasNoindex(directives)) {
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

  // Rien pour un navigateur, mais le site réserve une consigne à un robot
  // précis. C'est un constat différent, et on le nomme : « noindex » sans
  // préciser à qui laisserait croire à une erreur de configuration générale.
  const forBot = robotsForBot(page.metadata)
  if (forBot) {
    return {
      ruleKey: 'noindex_on_key_pages',
      category: 'accessibility',
      title: `Votre site sert une consigne noindex à ${forBot.bot}`,
      description:
        `Un navigateur reçoit cette page normalement, mais lorsqu'elle est demandée avec le ` +
        `user-agent de ${forBot.bot}, le site renvoie une directive noindex. Ce robot ne ` +
        `l'indexera donc jamais, et le moteur de réponse qu'il alimente ne pourra pas vous ` +
        `citer depuis cette page. C'est en général le fait d'un pare-feu applicatif ou d'un ` +
        `module anti-robots : vérifiez auprès de votre hébergeur que les robots d'IA sont ` +
        `autorisés.`,
      sampleUrls: [page.url],
      severity: 'major',
      effort: 1,
      impact: 3,
    }
  }

  return null
}
