import type { RuleInput, ContentIssue } from '../types'
import { hasFaqContent } from '@/lib/analysis/faq-detection'

/**
 * Règle SITE — aucun contenu FAQ (explicite ou implicite).
 *
 * La détection vit dans lib/analysis/faq-detection.ts, partagée avec la règle
 * technique `schema_org_faq` et avec les opportunités : les trois se
 * contredisaient devant le client.
 */
export async function checkNoFaqContent({
  pages,
  crawlTruncated,
}: RuleInput): Promise<ContentIssue | null> {
  // Constat d'existence : une seule page non crawlée suffirait à le démentir.
  // Sur un crawl plafonné, il décrirait la couverture du crawl, pas le site.
  if (crawlTruncated) return null
  if (pages.length === 0) return null

  if (hasFaqContent(pages)) return null

  return {
    ruleKey: 'no_faq_content',
    category: 'structure',
    title: 'Aucun contenu FAQ détecté',
    description: `Votre site ne contient ni page FAQ ni titres formulés en questions. Or ChatGPT et Perplexity répondent à des questions : un contenu structuré en questions-réponses est le format le plus facile à reprendre tel quel dans leurs réponses.`,
    sampleUrls: [],
    severity: 'moderate',
    effort: 2,
    impact: 3,
  }
}
