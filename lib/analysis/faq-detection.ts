/**
 * lib/analysis/faq-detection.ts
 *
 * Détection unique du contenu FAQ, partagée par les règles Technique et
 * Contenu et par les opportunités.
 *
 * Avant, deux détections indépendantes se contredisaient devant le client :
 * la règle contenu comptait les titres interrogatifs cumulés sur le site,
 * la règle technique acceptait en plus les questions en gras, les lignes
 * « Q : » et une URL contenant /faq. Un site pouvait donc lire « Aucun contenu
 * FAQ détecté » sur une carte et « Votre FAQ schema est en place » sur la
 * suivante.
 */

export interface FaqDetectablePage {
  url: string
  markdown?: string | null
  metadata?: { h1?: string | string[] | null; h2?: string[] | null } | null
}

/** Nombre de marqueurs Q/R sur une même page à partir duquel c'est une FAQ. */
const MIN_MARKERS_PER_PAGE = 3

/** Nombre de titres interrogatifs, cumulés sur le site, valant contenu FAQ. */
const MIN_QUESTION_HEADINGS_SITE = 3

/** Titres interrogatifs d'une page : markdown + titres remontés par le crawl. */
export function countQuestionHeadings(page: FaqDetectablePage): number {
  let count = 0

  if (page.markdown) {
    count += (page.markdown.match(/^#{1,4}\s.*\?\s*$/gm) ?? []).length
  }

  const metadata = page.metadata
  if (metadata) {
    const h1s = Array.isArray(metadata.h1) ? metadata.h1 : metadata.h1 ? [metadata.h1] : []
    const h2s = metadata.h2 ?? []
    count += [...h1s, ...h2s].filter((h) => h.trim().endsWith('?')).length
  }

  return count
}

/**
 * Cette page est-elle une page FAQ ? Quatre marqueurs, tous des formats
 * réellement rencontrés : titres interrogatifs, questions en gras, lignes
 * « Q : » explicites, ou URL dédiée.
 */
export function isFaqPage(page: FaqDetectablePage): boolean {
  const markdown = page.markdown ?? ''

  if (countQuestionHeadings(page) >= MIN_MARKERS_PER_PAGE) return true

  const boldQuestions = markdown.match(/\*\*[^*\n]+\?\s*\*\*/g) ?? []
  if (boldQuestions.length >= MIN_MARKERS_PER_PAGE) return true

  const qaLines = markdown.match(/^>?\s*(?:Q|Question)\s*[:.]/gim) ?? []
  if (qaLines.length >= MIN_MARKERS_PER_PAGE) return true

  try {
    return /\/faq(?:\/|$|\.)/i.test(new URL(page.url).pathname)
  } catch {
    return false
  }
}

/** Les pages du site reconnues comme FAQ. */
export function faqPages<T extends FaqDetectablePage>(pages: T[]): T[] {
  return pages.filter(isFaqPage)
}

/**
 * Le site a-t-il du contenu FAQ, explicite ou implicite ?
 *
 * Vrai dès qu'une page est reconnue comme FAQ, ou que les titres interrogatifs
 * cumulés atteignent le seuil : un site peut répondre à des questions sans
 * page « FAQ » dédiée, en disséminant des titres interrogatifs.
 */
export function hasFaqContent(pages: FaqDetectablePage[]): boolean {
  if (pages.some(isFaqPage)) return true
  const total = pages.reduce((sum, p) => sum + countQuestionHeadings(p), 0)
  return total >= MIN_QUESTION_HEADINGS_SITE
}
