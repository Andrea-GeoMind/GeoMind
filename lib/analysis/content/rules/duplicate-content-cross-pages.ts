import type { RuleInput, ContentIssue } from '../types'

/** Taille des shingles (n-grammes de mots) pour la similarité Jaccard. */
const SHINGLE_SIZE = 5
/** Seuil de similarité au-delà duquel deux pages sont jugées dupliquées. */
const SIMILARITY_THRESHOLD = 0.6
/** Nombre minimal de shingles pour qu'une page soit comparable. */
const MIN_SHINGLES = 5

function buildShingles(markdown: string): Set<string> {
  const words = markdown
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)

  const shingles = new Set<string>()
  for (let i = 0; i + SHINGLE_SIZE <= words.length; i += 1) {
    shingles.add(words.slice(i, i + SHINGLE_SIZE).join(' '))
  }
  return shingles
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let intersection = 0
  for (const shingle of a) {
    if (b.has(shingle)) intersection += 1
  }
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

/**
 * Règle SITE — contenu dupliqué entre pages.
 * Similarité Jaccard sur shingles de 5 mots : deux pages quasi identiques
 * diluent le signal — les IA ne savent pas laquelle citer comme référence.
 */
export async function checkDuplicateContentCrossPages({
  pages,
}: RuleInput): Promise<ContentIssue | null> {
  const contentPages = pages.filter(
    (p) => (p.statusCode === 200 || p.statusCode == null) && p.markdown
  )
  if (contentPages.length < 2) return null

  const shingleSets = contentPages.map((p) => ({
    url: p.url,
    shingles: buildShingles(p.markdown ?? ''),
  }))

  const duplicateUrls: string[] = []
  for (let i = 0; i < shingleSets.length; i += 1) {
    for (let j = i + 1; j < shingleSets.length; j += 1) {
      const a = shingleSets[i]
      const b = shingleSets[j]
      if (a.shingles.size < MIN_SHINGLES || b.shingles.size < MIN_SHINGLES) continue
      if (jaccard(a.shingles, b.shingles) > SIMILARITY_THRESHOLD) {
        if (!duplicateUrls.includes(a.url)) duplicateUrls.push(a.url)
        if (!duplicateUrls.includes(b.url)) duplicateUrls.push(b.url)
      }
    }
  }

  if (duplicateUrls.length === 0) return null

  return {
    ruleKey: 'duplicate_content_cross_pages',
    category: 'structure',
    title: 'Contenu dupliqué entre plusieurs pages',
    description: `Au moins deux pages de votre site partagent un contenu quasi identique. Les IA ne savent pas laquelle citer comme référence, ce qui dilue vos chances d'apparaître dans leurs réponses : fusionnez ou différenciez ces pages.`,
    sampleUrls: duplicateUrls.slice(0, 5),
    severity: 'moderate',
    effort: 3,
    impact: 2,
  }
}
