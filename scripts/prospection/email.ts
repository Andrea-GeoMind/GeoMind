import { politeFetch } from './polite-fetch'

/**
 * Extraction de l'email de contact depuis le site du prospect.
 *
 * Priorité aux adresses nominatives (prenom.nom@, p.nom@) sur les génériques
 * (contact@, info@) : une adresse nominative atteint une personne, pas une
 * boîte partagée que personne ne relève.
 *
 * RGPD : ces adresses sont des données personnelles, même professionnelles.
 * La prospection B2B par email est licite en France sur la base de l'intérêt
 * légitime, à trois conditions — objet en rapport avec la fonction du
 * destinataire, identité de l'expéditeur claire, et désinscription simple dès
 * le premier message. À prévoir dans le modèle d'email, pas ici.
 */

/** Pages où une adresse se trouve, par ordre de probabilité. */
const CANDIDATE_PATHS = [
  '/contact',
  '/contactez-nous',
  '/nous-contacter',
  '/mentions-legales',
  '/mentions',
  '/a-propos',
]

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

/**
 * Décode les entités HTML avant extraction.
 *
 * `Volets Services` avait produit
 * `volets26services@gmail.com\\&quot;&gt;volets26services@gmail.com&lt;/a&gt;…` :
 * le mailto était encodé dans un attribut, et la regex avalait le balisage
 * échappé qui suivait.
 */
export function decodeEntities(html: string): string {
  return html
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}

/** Une adresse ne contient ni balise, ni antislash, ni espace. */
function isWellFormed(email: string): boolean {
  if (email.length > 60) return false
  if (/[<>"'\\\s]/.test(email)) return false
  // Un TLD plausible : 2 à 12 lettres.
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,12}$/i.test(email)
}

/** Adresses à ignorer : fournisseurs, exemples, images mal découpées. */
const NOISE = [
  'example.', 'sentry.io', 'wixpress.com', 'godaddy', 'squarespace',
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.css', '.js',
  'protected', 'javascript', 'u003e', 'domain.com', 'votredomaine',
  // Textes d'exemple laissés dans les gabarits — « Marie Landoin » avait
  // livré utilisateur@domaine.com, qui n'existe pas.
  'domaine.com', 'utilisateur@', 'exemple.', 'nom@', 'email@', 'adresse@',
  'monemail', 'votremail', 'votre-email', 'yourname', 'youremail',
  'wordpress.com', 'sentry-next', 'noreply@', 'no-reply@',
]

const GENERIC_LOCAL = [
  'contact', 'info', 'infos', 'hello', 'bonjour', 'accueil', 'secretariat',
  'commercial', 'devis', 'admin', 'webmaster', 'rgpd', 'dpo',
]

function isNoise(email: string): boolean {
  const e = email.toLowerCase()
  return NOISE.some((n) => e.includes(n))
}

/** Une adresse nominative contient un séparateur, ou n'est pas un mot générique. */
export function isNominative(email: string): boolean {
  const local = email.split('@')[0]?.toLowerCase() ?? ''
  if (GENERIC_LOCAL.includes(local)) return false
  if (/[._-]/.test(local)) return true
  return local.length > 2 && !GENERIC_LOCAL.some((g) => local.startsWith(g))
}

/** Emails trouvés dans une page, mailto: d'abord (les plus fiables). */
export function extractEmails(rawHtml: string, siteHost?: string): string[] {
  const html = decodeEntities(rawHtml)
  const found = new Set<string>()

  const add = (candidate: string) => {
    const e = candidate.trim().toLowerCase().replace(/[.,;:)]+$/, '')
    if (e.includes('@') && isWellFormed(e) && !isNoise(e)) found.add(e)
  }

  for (const m of html.matchAll(/mailto:([^"'?><\s]+)/gi)) {
    try {
      add(decodeURIComponent(m[1]))
    } catch {
      add(m[1])
    }
  }
  for (const m of html.matchAll(EMAIL_RE)) add(m[0])

  const list = [...found]
  if (!siteHost) return list

  // Une adresse du même domaine que le site vaut mieux qu'un gmail trouvé
  // au détour d'un pied de page.
  const root = siteHost.replace(/^www\./, '')
  return list.sort((a, b) => {
    const am = a.endsWith(`@${root}`) ? 0 : 1
    const bm = b.endsWith(`@${root}`) ? 0 : 1
    if (am !== bm) return am - bm
    return Number(!isNominative(a)) - Number(!isNominative(b))
  })
}

/** Meilleure adresse : nominative du domaine > générique du domaine > autre. */
export function pickBest(emails: string[], siteHost?: string): string | null {
  if (emails.length === 0) return null
  const root = siteHost?.replace(/^www\./, '')
  const sameDomain = root ? emails.filter((e) => e.endsWith(`@${root}`)) : []
  const pool = sameDomain.length > 0 ? sameDomain : emails
  return pool.find(isNominative) ?? pool[0] ?? null
}

/**
 * Parcourt l'accueil puis les pages candidates jusqu'à trouver une adresse
 * nominative. S'arrête dès qu'elle en tient une : inutile de solliciter
 * davantage un site de tiers.
 */
export async function findContactEmail(websiteUrl: string): Promise<string | null> {
  let host: string
  let origin: string
  try {
    const u = new URL(websiteUrl)
    host = u.hostname
    origin = u.origin
  } catch {
    return null
  }

  const seen: string[] = []

  for (const path of ['/', ...CANDIDATE_PATHS]) {
    const res = await politeFetch(`${origin}${path}`)
    if (!res.ok || !res.html) continue

    const emails = extractEmails(res.html, host)
    seen.push(...emails)

    const best = pickBest(emails, host)
    if (best && isNominative(best)) return best
  }

  return pickBest([...new Set(seen)], host)
}
