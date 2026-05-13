import type { TechnicalIssue, RuleInput } from '../types'

export async function checkLlmsTxtMissing({ siteUrl }: RuleInput): Promise<TechnicalIssue | null> {
  const llmsUrl = `${new URL(siteUrl).origin}/llms.txt`
  try {
    const res = await fetch(llmsUrl, { signal: AbortSignal.timeout(5000) })
    if (res.ok) return null
    return {
      ruleKey: 'llms_txt_missing',
      category: 'accessibility',
      title: 'Fichier llms.txt absent',
      description:
        "Votre site n'a pas de fichier llms.txt. Ce fichier (standard émergent) indique aux LLMs comment interagir avec votre contenu et peut inclure un résumé optimisé pour les IAs.",
      sampleUrls: [llmsUrl],
      penalty: 10,
    }
  } catch {
    return null
  }
}
