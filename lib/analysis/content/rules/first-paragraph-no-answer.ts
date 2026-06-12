import type { FirecrawlPage, RuleInput, ContentIssue } from '../types'

/** Longueur minimale du premier paragraphe (en mots). */
const MIN_FIRST_PARAGRAPH_WORDS = 25
/** Longueur minimale d'un mot "significatif". */
const MIN_SIGNIFICANT_WORD_LENGTH = 5

/** Stopwords français courants (mots > 4 lettres uniquement). */
const FRENCH_STOPWORDS = new Set([
  'alors',
  'aussi',
  'autre',
  'autres',
  'avant',
  'avoir',
  'cette',
  'celle',
  'celles',
  'chaque',
  'comme',
  'comment',
  'dans',
  'depuis',
  'donc',
  'elles',
  'encore',
  'entre',
  'était',
  'faire',
  'leurs',
  'lorsque',
  'même',
  'moins',
  'notre',
  'parce',
  'pendant',
  'peuvent',
  'pourquoi',
  'quand',
  'quelle',
  'quelles',
  'quels',
  'sans',
  'selon',
  'sont',
  'toujours',
  'toute',
  'toutes',
  'votre',
  'vous',
])

function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function significantWords(text: string): Set<string> {
  const words = text
    .split(/\s+/)
    .map(normalizeWord)
    .filter((w) => w.length >= MIN_SIGNIFICANT_WORD_LENGTH && !FRENCH_STOPWORDS.has(w))
  return new Set(words)
}

interface H1AndParagraph {
  h1: string
  paragraph: string
}

/** Extrait le H1 markdown et le premier paragraphe de texte qui le suit. */
function extractH1AndFirstParagraph(markdown: string): H1AndParagraph | null {
  const lines = markdown.split('\n')
  const h1Index = lines.findIndex((l) => /^#\s+\S/.test(l))
  if (h1Index === -1) return null

  const h1 = lines[h1Index].replace(/^#\s+/, '').trim()
  const paragraphLines: string[] = []

  for (let i = h1Index + 1; i < lines.length; i += 1) {
    const line = lines[i].trim()
    if (line.length === 0) {
      if (paragraphLines.length > 0) break
      continue
    }
    // On s'arrête au prochain titre ; on ignore listes, images et citations
    if (/^#{1,6}\s/.test(line)) break
    if (/^[-*]\s|^\d+\.\s|^!\[|^>/.test(line)) continue
    paragraphLines.push(line)
  }

  if (paragraphLines.length === 0) return null
  return { h1, paragraph: paragraphLines.join(' ') }
}

/**
 * Règle PAGE — le premier paragraphe ne répond pas au titre.
 * Pyramide inversée : les IA extraient la réponse des premiers paragraphes.
 * Un premier paragraphe court ou hors sujet par rapport au H1 réduit fortement
 * les chances que ChatGPT ou Perplexity reprennent la page en citation.
 */
export async function checkFirstParagraphNoAnswer(
  page: FirecrawlPage,
  _input: RuleInput
): Promise<ContentIssue | null> {
  if (page.statusCode != null && page.statusCode !== 200) return null
  if (!page.markdown) return null

  const extracted = extractH1AndFirstParagraph(page.markdown)
  if (!extracted) return null

  const paragraphWordCount = extracted.paragraph.split(/\s+/).filter(Boolean).length
  const tooShort = paragraphWordCount < MIN_FIRST_PARAGRAPH_WORDS

  const h1Words = significantWords(extracted.h1)
  const paragraphWords = significantWords(extracted.paragraph)
  const sharesWord =
    h1Words.size === 0 || [...h1Words].some((w) => paragraphWords.has(w))

  if (!tooShort && sharesWord) return null

  return {
    ruleKey: 'first_paragraph_no_answer',
    category: 'readability',
    title: 'Le premier paragraphe ne répond pas au titre',
    description: `Le premier paragraphe de cette page est trop court ou ne reprend aucun mot clé de son titre. Les IA extraient la réponse des premiers paragraphes (pyramide inversée) : répondez à la question du titre dès les premières lignes.`,
    sampleUrls: [page.url],
    severity: 'moderate',
    effort: 2,
    impact: 3,
  }
}
