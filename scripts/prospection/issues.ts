import type { TechnicalIssue } from '@/lib/analysis/technical/types'
import type { ContentIssue } from '@/lib/analysis/content/types'

/**
 * Sélection des 3 points faibles les plus graves, formulés pour le prospect.
 *
 * Les titres du produit s'adressent à un utilisateur déjà installé, qui a lu
 * l'interface. Un dirigeant qui reçoit un email froid n'a pas ce contexte :
 * « llms.txt absent » ne lui dit rien. On reformule sans jargon, et on garde
 * le titre d'origine quand il est déjà clair.
 */

type AnyIssue = (TechnicalIssue | ContentIssue) & { severity: string }

/** Ordre de gravité décroissant. */
const SEVERITY_RANK: Record<string, number> = {
  major: 0,
  moderate: 1,
  minor: 2,
  opportunity: 3,
}

/**
 * Reformulations par règle. Toute règle absente retombe sur son titre produit,
 * qui reste compréhensible dans la majorité des cas.
 */
const CLIENT_WORDING: Record<string, string> = {
  'robots-txt-block-all': 'Le site interdit l’accès aux robots des IA',
  'noindex-detected': 'Des pages sont configurées pour ne jamais être trouvées',
  'https-missing': 'Le site n’est pas en HTTPS',
  'sitemap-missing': 'Aucun plan du site : des pages passent inaperçues',
  'llms-txt-missing': 'Aucune présentation du site destinée aux IA',
  'schema-org-missing': 'Aucune fiche d’identité lisible par les machines',
  'schema-org-organization': 'L’entreprise n’est identifiée nulle part pour les IA',
  'schema-org-faq': 'Aucune question-réponse balisée pour les IA',
  'title-missing': 'Des pages sans titre',
  'meta-description-missing': 'Des pages sans résumé affiché dans les résultats',
  'h1-missing': 'Des pages sans titre principal',
  'thin-content': 'Des pages trop courtes pour être citées',
  'no-structured-lists': 'Le contenu n’est pas structuré en listes exploitables',
  'freshness-missing': 'Aucune date : les IA ignorent si le contenu est à jour',
  'contact-info-missing': 'Coordonnées absentes ou incomplètes',
  'faq-missing': 'Aucune page de questions fréquentes',
  'open-graph-missing': 'Aucun aperçu quand le site est partagé',
  'lang-missing': 'La langue du site n’est pas déclarée',
}

export function topIssues(
  technical: TechnicalIssue[],
  content: ContentIssue[],
  count = 3
): string[] {
  const all = [...technical, ...content] as AnyIssue[]

  const sorted = all
    // Les opportunités ne sont pas des problèmes : elles ne pénalisent pas.
    .filter((i) => i.severity !== 'opportunity')
    .sort((a, b) => {
      const s = (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9)
      if (s !== 0) return s
      // À gravité égale, le plus fort impact d'abord.
      return (b.impact ?? 0) - (a.impact ?? 0)
    })

  const seen = new Set<string>()
  const out: string[] = []
  for (const issue of sorted) {
    if (seen.has(issue.ruleKey)) continue
    seen.add(issue.ruleKey)
    out.push(CLIENT_WORDING[issue.ruleKey] ?? issue.title)
    if (out.length === count) break
  }
  return out
}
