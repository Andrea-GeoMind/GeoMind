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

/** Adresses à ignorer : fournisseurs, exemples, images mal découpées. */
const NOISE = [
  'example.', 'sentry.io', 'wixpress.com', 'godaddy', 'squarespace',
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.css', '.js',
  'protected', 'javascript', 'u003e', 'domain.com', 'votredomaine',
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
export function extractEmails(html: string, siteHost?: string): string[] {
  const found = new Set<string>()

  for (const m of html.matchAll(/mailto:([^"'?>\s]+)/gi)) {
    const e = decodeURIComponent(m[1]).trim().toLowerCase()
    if (e.includes('@') && !isNoise(e)) found.add(e)
  }
  for (const m of html.matchAll(EMAIL_RE)) {
    const e = m[0].trim().toLowerCase()
    if (!isNoise(e)) found.add(e)
  }

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
