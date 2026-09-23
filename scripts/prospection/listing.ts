/**
 * Détection des « sites » qui n'en sont pas : fiches sur une plateforme tierce.
 *
 * Google Places renvoie parfois comme `websiteUri` une page de réservation ou
 * un profil social : `planity.com/alex-barber-...`, `instagram.com/lupo_lyon`.
 * C'est différent d'un sous-domaine de plateforme (`x.wixsite.com`), où la
 * page appartient encore à l'entreprise : ici la page appartient à la
 * plateforme, et l'auditer reviendrait à noter le site de Planity ou
 * d'Instagram, pas celui du commerce.
 *
 * On les écarte de l'audit, mais on les compte : commercialement ce sont de
 * très bons prospects — ils n'ont pas de site du tout — simplement la chaîne
 * n'a rien à mesurer chez eux.
 */

const LISTING_HOSTS = [
  // Réservation / prise de rendez-vous
  'planity.com',
  'treatwell.fr',
  'doctolib.fr',
  'thefork.fr',
  'lafourchette.com',
  'resy.com',
  'zenchef.com',
  'guestonline.fr',
  'opentable.fr',
  'wecasa.fr',
  'kiute.fr',
  'flexy.fr',
  // Réseaux sociaux et pages-liens
  'instagram.com',
  'facebook.com',
  'fb.com',
  'linktr.ee',
  'linkedin.com',
  'tiktok.com',
  'x.com',
  'twitter.com',
  'youtube.com',
  // Annuaires et avis
  'tripadvisor.fr',
  'tripadvisor.com',
  'pagesjaunes.fr',
  'yelp.fr',
  'petitfute.com',
  'thefork.com',
  'houzz.fr',
  'malt.fr',
  // Billetterie / réservation de créneaux
  'gymlib.com',
  'urbansportsclub.com',
  'classpass.com',
]

/**
 * Nom de la plateforme quand l'URL pointe une fiche tierce, sinon null.
 * Contrairement à `platformSubdomain`, le domaine nu compte aussi : c'est la
 * plateforme elle-même qui héberge la fiche.
 */
export function listingPlatform(website: string | null): string | null {
  if (!website) return null
  let host: string
  try {
    host = new URL(website).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
  for (const h of LISTING_HOSTS) {
    if (host === h || host.endsWith(`.${h}`)) return h
  }
  return null
}
