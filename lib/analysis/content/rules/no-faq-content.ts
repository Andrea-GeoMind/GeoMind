import type { RuleInput, ContentIssue } from '../types'

const MIN_QUESTION_HEADINGS = 3

function hasFaqContent(markdown: string | null | undefined): boolean {
  if (!markdown) return false
  const questionHeadings = markdown.match(/^#{1,4}\s.+\?/gm) ?? []
  return questionHeadings.length >= MIN_QUESTION_HEADINGS
}

export async function checkNoFaqContent({ pages }: RuleInput): Promise<ContentIssue | null> {
  if (pages.length === 0) return null

  const hasFaq = pages.some((p) => hasFaqContent(p.markdown))
  if (hasFaq) return null

  return {
    ruleKey: 'no_faq_content',
    category: 'structure',
    title: 'Aucun contenu FAQ détecté',
    description: `Votre site ne contient pas de pages au format FAQ (questions-réponses). Ce format est particulièrement apprécié des moteurs IA pour construire des réponses directes à la longue traîne.`,
    sampleUrls: [],
    penalty: 7,
  }
}
