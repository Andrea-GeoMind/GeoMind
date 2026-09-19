/**
 * Détection des sites hébergés sur un sous-domaine de plateforme.
 *
 * `clair-et-vert-72ae40.webflow.io`, `jozmavie.myportfolio.com` : l'entreprise
 * n'a pas de nom de domaine à elle. Ce ne sont pas des exclusions mais des
 * prospects prioritaires — la visibilité y est structurellement faible, et le
 * premier conseil à donner est évident et peu coûteux à suivre.
 *
 * On ne retient que le cas du SOUS-DOMAINE partagé : un site sur son propre
 * domaine construit avec Webflow ou Wix n'a pas ce problème.
 */

const PLATFORM_SUFFIXES = [
  'webflow.io',
  'myportfolio.com',
  'wixsite.com',
  'wix.com',
  'squarespace.com',
  'weebly.com',
  'jimdosite.com',
  'jimdo.com',
  'business.site', // Google Sites d'établissement
  'wordpress.com',
  'blogspot.com',
  'blogspot.fr',
  'netlify.app',
  'vercel.app',
  'github.io',
  'pages.dev',
  'e-monsite.com',
  'sitew.com',
  'site123.me',
  'strikingly.com',
  'odoo.com',
  'shopify.com',
  'myshopify.com',
  'systeme.io',
  'mozello.com',
  'webnode.fr',
  'webnode.com',
  'over-blog.com',
  'free.fr',
  'pagesperso-orange.fr',
  'wixstudio.com',
]

/**
 * Nom de la plateforme si le site vit sur un sous-domaine partagé, sinon null.
 * Un domaine propre renvoie null, même s'il est construit avec la plateforme.
 */
export function platformSubdomain(website: string | null): string | null {
  if (!website) return null
  let host: string
  try {
    host = new URL(website).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }

  for (const suffix of PLATFORM_SUFFIXES) {
    // Le suffixe seul (sans sous-domaine) est le site de la plateforme
    // elle-même, pas celui d'un client : on l'ignore.
    if (host.endsWith(`.${suffix}`)) return suffix
  }
  return null
}
