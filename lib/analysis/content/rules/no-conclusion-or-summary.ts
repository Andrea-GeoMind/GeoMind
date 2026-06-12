import type { FirecrawlPage, RuleInput, ContentIssue } from '../types'

/** Seuil de longueur (en mots) à partir duquel une conclusion est attendue. */
const MIN_WORDS_FOR_CONCLUSION = 800
/** Taille de la section finale inspectée quand la page n'a pas de titres. */
const TAIL_WORD_COUNT = 200

// Appliqué sur du texte normalisé (minuscules, sans accents) — \b ne gère pas
// les caractères accentués en JavaScript
const CONCLUSION_PATTERN = /\b(conclusion|resume|en bref|a retenir|pour resumer)\b/

/** Normalise : minuscules, accents supprimés. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/** Renvoie la dernière section : du dernier titre à la fin, ou les derniers mots. */
function lastSection(markdown: string): string {
  const lines = markdown.split('\n')
  let lastHeadingIndex = -1
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (/^#{1,6}\s+\S/.test(lines[i])) {
      lastHeadingIndex = i
      break
    }
  }
  if (lastHeadingIndex !== -1) {
    return lines.slice(lastHeadingIndex).join('\n')
  }
  const words = markdown.trim().split(/\s+/)
  return words.slice(Math.max(0, words.length - TAIL_WORD_COUNT)).join(' ')
}

/**
 * Règle PAGE — page longue sans conclusion ni résumé.
 * Une section "En bref" ou "Conclusion" condense la réponse : c'est exactement
 * le format que les IA reprennent quand elles synthétisent une page longue.
 */
export async function checkNoConclusionOrSummary(
  page: FirecrawlPage,
  _input: RuleInput
): Promise<ContentIssue | null> {
  if (page.statusCode != null && page.statusCode !== 200) return null
  if (!page.markdown) return null

  if (countWords(page.markdown) <= MIN_WORDS_FOR_CONCLUSION) return null
  if (CONCLUSION_PATTERN.test(normalize(lastSection(page.markdown)))) return null

  return {
    ruleKey: 'no_conclusion_or_summary',
    category: 'structure',
    title: 'Page longue sans conclusion ni résumé',
    description: `Cette page dépasse ${MIN_WORDS_FOR_CONCLUSION} mots mais ne se termine ni par une conclusion ni par un résumé. Une section "En bref" ou "À retenir" condense votre réponse : c'est le passage que les IA reprennent le plus volontiers en citation.`,
    sampleUrls: [page.url],
    severity: 'opportunity',
    effort: 2,
    impact: 1,
  }
}
