import type { RuleInput, ContentIssue } from '../types'

// Matches definitional sentences like "X est un/une...", "X se définit...", "X désigne..."
const DEFINITION_PATTERN =
  /\b(est une?|sont des?|se définit|se définissent|désigne|désignent|correspond à|s'agit d[e'])\b/i

function hasDefinitionContent(markdown: string | null | undefined): boolean {
  if (!markdown) return false
  return DEFINITION_PATTERN.test(markdown)
}

export async function checkNoDefinitionPatterns({
  pages,
}: RuleInput): Promise<ContentIssue | null> {
  if (pages.length === 0) return null

  const contentPages = pages.filter(
    (p) => (p.statusCode === 200 || p.statusCode == null) && p.markdown
  )
  if (contentPages.length === 0) return null

  const hasDefinitions = contentPages.some((p) => hasDefinitionContent(p.markdown))
  if (hasDefinitions) return null

  return {
    ruleKey: 'no_definition_patterns',
    category: 'structure',
    title: 'Aucun contenu définitionnel',
    description: `Votre site ne semble pas contenir de phrases définitionnelles ("X est un...", "X désigne..."). Ce style rédactionnel est très extractable par les IAs pour définir des concepts dans leurs réponses.`,
    sampleUrls: [],
    penalty: 5,
  }
}
