/**
 * lib/analysis/page-selection.ts
 *
 * Sélection des pages pour l'analyse page par page (cahier-des-charges §18.2).
 * Pure et déterministe : la page d'accueil est toujours incluse, puis les pages
 * sont choisies par profondeur croissante, longueur de contenu décroissante,
 * avec diversité de sections (round-robin sur le premier segment d'URL).
 */

function pathInfo(url: string): { path: string; depth: number; firstSegment: string } {
  try {
    const path = new URL(url).pathname.replace(/\/+$/, '') || '/'
    const segments = path.split('/').filter(Boolean)
    return { path, depth: segments.length, firstSegment: segments[0] ?? '' }
  } catch {
    return { path: url, depth: 99, firstSegment: '' }
  }
}

interface SelectablePage {
  url: string
  markdown?: string | null
}

/**
 * Pages non éditoriales : elles ne sont pas censées répondre à une question de
 * client, donc les règles de contenu n'ont rien à y dire. Les analyser
 * produisait des constats absurdes — « le premier paragraphe ne répond pas à
 * la question » sur /login, « mots-clés absents des titres » sur les CGV — qui
 * polluaient le plan d'action et décrédibilisaient les vrais constats.
 *
 * On raisonne sur le premier segment d'URL et sur quelques chemins exacts,
 * jamais sur une sous-chaîne : /panier doit sortir, /panier-solaire est une
 * page produit légitime.
 */
const NON_EDITORIAL_SEGMENTS = new Set([
  // Authentification et compte
  'login',
  'signin',
  'signup',
  'register',
  'inscription',
  'connexion',
  'logout',
  'deconnexion',
  'mot-de-passe-oublie',
  'reset-password',
  'compte',
  'account',
  'mon-compte',
  'profil',
  'profile',
  'dashboard',
  'tableau-de-bord',
  // Juridique et mentions
  'legal',
  'mentions-legales',
  'mentions',
  'cgv',
  'cgu',
  'conditions-generales',
  'politique-de-confidentialite',
  'confidentialite',
  'privacy',
  'cookies',
  'terms',
  // Tunnel d'achat
  'panier',
  'cart',
  'checkout',
  'commande',
  'paiement',
  'payment',
  'merci',
  'thank-you',
  'confirmation',
  // Utilitaires
  'recherche',
  'search',
  'sitemap',
  'plan-du-site',
  '404',
  'erreur',
])

/** Chemins exacts non éditoriaux, hors segmentation. */
const NON_EDITORIAL_PATHS = new Set(['/robots.txt', '/sitemap.xml', '/llms.txt'])

/**
 * Une page est-elle éditoriale, c'est-à-dire susceptible de répondre à une
 * question que se pose un client ? La page d'accueil l'est toujours.
 */
export function isEditorialPage(url: string): boolean {
  const { path, firstSegment } = pathInfo(url)
  if (path === '/') return true
  if (NON_EDITORIAL_PATHS.has(path.toLowerCase())) return false
  return !NON_EDITORIAL_SEGMENTS.has(firstSegment.toLowerCase())
}

export function selectPagesForAnalysis<T extends SelectablePage>(pages: T[], limit: number): T[] {
  if (!Number.isFinite(limit) || limit <= 0 || pages.length === 0) return []

  // Les pages non éditoriales sont écartées avant toute sélection : les règles
  // de contenu n'ont rien de pertinent à dire sur /login ou les CGV.
  const editorial = pages.filter((p) => isEditorialPage(p.url))
  if (editorial.length === 0) return []

  // Dédoublonnage par URL (le crawl peut contenir des doublons trailing-slash)
  const seen = new Set<string>()
  const unique = editorial.filter((p) => {
    const key = pathInfo(p.url).path
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const home = unique.find((p) => pathInfo(p.url).depth === 0)
  const rest = unique.filter((p) => p !== home)

  // Tri : profondeur croissante → contenu le plus riche → URL (déterminisme)
  const sorted = [...rest].sort((a, b) => {
    const ia = pathInfo(a.url)
    const ib = pathInfo(b.url)
    if (ia.depth !== ib.depth) return ia.depth - ib.depth
    const la = a.markdown?.length ?? 0
    const lb = b.markdown?.length ?? 0
    if (la !== lb) return lb - la
    return a.url.localeCompare(b.url)
  })

  // Diversité de sections : round-robin sur le premier segment d'URL
  const groups = new Map<string, T[]>()
  const groupOrder: string[] = []
  for (const page of sorted) {
    const segment = pathInfo(page.url).firstSegment
    if (!groups.has(segment)) {
      groups.set(segment, [])
      groupOrder.push(segment)
    }
    groups.get(segment)!.push(page)
  }

  const selected: T[] = home ? [home] : []
  let added = true
  while (selected.length < limit && added) {
    added = false
    for (const segment of groupOrder) {
      if (selected.length >= limit) break
      const next = groups.get(segment)!.shift()
      if (next) {
        selected.push(next)
        added = true
      }
    }
  }

  return selected.slice(0, limit)
}
