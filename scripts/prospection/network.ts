/**
 * Détection d'un réseau multi-établissements par la page d'accueil.
 *
 * Les listes de noms et les motifs d'URL ne rattrapent que les réseaux connus
 * ou mal déguisés. Le dry-run du 23/09 a laissé passer trois enseignes que
 * rien dans leur nom ne trahissait — « Rituel Sport Club », « Now Lyon »,
 * « Club Pilates Lyon Foch » — alors que leur page d'accueil annonce
 * « Nos salles », « Nos clubs », « Nos espaces ».
 *
 * Ce contrôle est gratuit : une requête HTTP par candidat, via `politeFetch`
 * (robots.txt respecté, délai par hôte). Il tourne après la sélection et
 * avant toute dépense Firecrawl.
 */

import { politeFetch } from './polite-fetch'

/**
 * Marqueurs de navigation propres à un réseau. Le possessif est ce qui
 * distingue « Nos salles » (l'enseigne en a plusieurs) de « la salle »
 * (l'établissement parle de lui-même).
 */
const NETWORK_MARKERS = [
  /\bnos\s+(salles|clubs|espaces|studios|centres|agences|boutiques|adresses|ateliers|instituts|magasins|restaurants|caves|salons)\b/i,
  /\btoutes\s+nos\s+(salles|clubs|espaces|studios|adresses|boutiques)\b/i,
  /\bnos\s+points?\s+de\s+vente\b/i,
  /\b(trouve[rz]?|choisi(?:r|ssez))\s+(ta|ton|votre|un)\s+(salle|club|studio|espace|centre)\b/i,
  /\b\d{1,3}\s+(salles|clubs|espaces|studios|centres|boutiques)\s+(en France|à travers|partout|dans)\b/i,
  /\bdevenir\s+franchis[ée]\b/i,
  /\bnotre\s+r[ée]seau\s+de\s+(salles|clubs|studios|espaces|boutiques)\b/i,
]

export interface NetworkVerdict {
  isNetwork: boolean
  /** Extrait qui a déclenché la détection — pour pouvoir juger sur pièces. */
  evidence?: string
}

/** Applique les marqueurs à un HTML déjà récupéré. */
export function detectNetworkMarkers(html: string): NetworkVerdict {
  // Le texte visible suffit : on retire scripts et styles pour éviter de
  // déclencher sur du JSON de configuration ou des noms de classes CSS.
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')

  for (const re of NETWORK_MARKERS) {
    const m = re.exec(text)
    if (m) return { isNetwork: true, evidence: m[0].trim() }
  }
  return { isNetwork: false }
}

/**
 * Vérifie l'URL donnée, puis la racine du domaine quand elle diffère.
 *
 * Places renvoie souvent une page interne : `beauvallon.com/villa-florentine/
 * restaurants-bar` ne dit rien, alors que `beauvallon.com` est la vitrine d'un
 * groupe hôtelier. C'est la racine qui porte les marqueurs de réseau.
 *
 * Un site injoignable renvoie `false` : on ne prête pas à une entreprise un
 * défaut qu'on n'a pas constaté — l'audit qui suit dira s'il est joignable.
 */
export async function isNetworkSite(website: string | null): Promise<NetworkVerdict> {
  if (!website) return { isNetwork: false }

  let origin: string | null = null
  try {
    const u = new URL(website)
    if (u.pathname !== '/' || u.search) origin = u.origin
  } catch {
    return { isNetwork: false }
  }

  for (const url of [website, origin].filter((u): u is string => Boolean(u))) {
    const res = await politeFetch(url)
    if (!res.ok || !res.html) continue
    const verdict = detectNetworkMarkers(res.html)
    if (verdict.isNetwork) return verdict
  }
  return { isNetwork: false }
}
