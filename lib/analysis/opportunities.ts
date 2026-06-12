/**
 * lib/analysis/opportunities.ts
 *
 * Garantie produit §18.6 : tout audit affiche au moins 3 opportunités par
 * onglet, même sur un site parfait. Émetteurs conditionnels (déclenchés quand
 * un check passe) + pool statique en complément. Aucun appel LLM — pur.
 */

import type { TechnicalIssue } from '@/lib/analysis/technical/types'
import type { ContentIssue } from '@/lib/analysis/content/types'

export const MIN_OPPORTUNITIES = 3

// ─── Émetteurs conditionnels techniques ───────────────────────────────────────
// Déclenchés quand la règle de base passe (l'issue correspondante est absente).

const TECHNICAL_CONDITIONAL: Array<{ whenRulePasses: string; issue: TechnicalIssue }> = [
  {
    whenRulePasses: 'schema_org_faq',
    issue: {
      ruleKey: 'opportunity_howto_schema',
      category: 'schema_org',
      title: 'Passez au niveau supérieur : HowTo schema',
      description:
        'Votre FAQ schema est en place — bravo. Prochaine étape : ajoutez un HowTo schema sur vos pages guide ou tutoriel. Les IA adorent citer des étapes structurées.',
      sampleUrls: [],
      severity: 'opportunity',
      effort: 2,
      impact: 2,
    },
  },
  {
    whenRulePasses: 'llms_txt_missing',
    issue: {
      ruleKey: 'opportunity_llms_full_txt',
      category: 'accessibility',
      title: 'Passez au llms-full.txt',
      description:
        'Votre llms.txt existe déjà. La version étendue llms-full.txt donne aux IA le contenu complet de vos pages clés en un seul fichier — encore plus de chances d\'être compris et cité.',
      sampleUrls: [],
      severity: 'opportunity',
      effort: 1,
      impact: 2,
    },
  },
]

// ─── Pool statique technique ──────────────────────────────────────────────────

const TECHNICAL_POOL: TechnicalIssue[] = [
  {
    ruleKey: 'opportunity_speakable_schema',
    category: 'schema_org',
    title: 'Balisez vos passages citables (Speakable)',
    description:
      'Le schema Speakable indique aux IA quels passages de vos pages sont conçus pour être cités tels quels. Idéal pour vos définitions et réponses courtes.',
    sampleUrls: [],
    severity: 'opportunity',
    effort: 2,
    impact: 1,
  },
  {
    ruleKey: 'opportunity_dedicated_landing_pages',
    category: 'structure',
    title: 'Une page dédiée par question clé',
    description:
      'Les IA citent plus volontiers une page qui répond précisément à une question qu\'une page générique. Créez une page dédiée pour chacune de vos 3 questions clients les plus fréquentes.',
    sampleUrls: [],
    severity: 'opportunity',
    effort: 3,
    impact: 3,
  },
  {
    ruleKey: 'opportunity_monitor_ai_crawlers',
    category: 'accessibility',
    title: 'Suivez les passages des crawlers IA',
    description:
      'GPTBot, ClaudeBot, PerplexityBot visitent-ils votre site ? Vérifiez vos logs serveur ou votre outil d\'analytics : leur fréquence de passage est un signal direct de votre visibilité IA.',
    sampleUrls: [],
    severity: 'opportunity',
    effort: 2,
    impact: 1,
  },
  {
    ruleKey: 'opportunity_structured_data_testing',
    category: 'schema_org',
    title: 'Validez vos données structurées régulièrement',
    description:
      'Un schema cassé est invisible pour les IA. Prenez l\'habitude de valider vos données structurées après chaque mise à jour du site (validator.schema.org).',
    sampleUrls: [],
    severity: 'opportunity',
    effort: 1,
    impact: 1,
  },
]

// ─── Émetteurs conditionnels contenu ──────────────────────────────────────────

const CONTENT_CONDITIONAL: Array<{ whenRulePasses: string; issue: ContentIssue }> = [
  {
    whenRulePasses: 'content_not_fresh',
    issue: {
      ruleKey: 'opportunity_publishing_cadence',
      category: 'coverage',
      title: 'Institutionnalisez votre cadence de publication',
      description:
        'Votre contenu est frais — c\'est un vrai atout. Les IA favorisent les sources vivantes : fixez une cadence régulière (même 1 article/mois) pour entretenir ce signal.',
      sampleUrls: [],
      severity: 'opportunity',
      effort: 3,
      impact: 2,
    },
  },
  {
    whenRulePasses: 'no_faq_content',
    issue: {
      ruleKey: 'opportunity_expand_faq',
      category: 'coverage',
      title: 'Enrichissez votre FAQ avec les questions réelles',
      description:
        'Vous avez déjà du contenu FAQ. Alimentez-le avec les vraies questions de vos clients (emails, appels) : ce sont exactement celles que les internautes posent aux IA.',
      sampleUrls: [],
      severity: 'opportunity',
      effort: 2,
      impact: 3,
    },
  },
]

// ─── Pool statique contenu ────────────────────────────────────────────────────

const CONTENT_POOL: ContentIssue[] = [
  {
    ruleKey: 'opportunity_glossary_page',
    category: 'coverage',
    title: 'Créez un glossaire de votre domaine',
    description:
      'Une page glossaire avec des définitions courtes et nettes de votre jargon métier est une mine de citations pour les IA — elles cherchent des définitions fiables à reprendre.',
    sampleUrls: [],
    severity: 'opportunity',
    effort: 2,
    impact: 2,
  },
  {
    ruleKey: 'opportunity_case_studies',
    category: 'coverage',
    title: 'Publiez des études de cas chiffrées',
    description:
      'Les IA citent les contenus qui contiennent des résultats concrets (« +45 % de trafic en 6 mois »). Une étude de cas chiffrée est un aimant à citations.',
    sampleUrls: [],
    severity: 'opportunity',
    effort: 3,
    impact: 3,
  },
  {
    ruleKey: 'opportunity_comparison_content',
    category: 'coverage',
    title: 'Créez du contenu comparatif',
    description:
      'Les questions « quel est le meilleur X ? » sont parmi les plus posées aux IA. Une page comparatif honnête (vous y compris) vous positionne comme source de référence.',
    sampleUrls: [],
    severity: 'opportunity',
    effort: 3,
    impact: 3,
  },
  {
    ruleKey: 'opportunity_answer_first_writing',
    category: 'readability',
    title: 'Adoptez l\'écriture « réponse d\'abord »',
    description:
      'Commencez chaque page par la réponse à la question qu\'elle traite, puis développez. Les IA extraient les premiers paragraphes : donnez-leur la réponse toute prête.',
    sampleUrls: [],
    severity: 'opportunity',
    effort: 2,
    impact: 2,
  },
]

// ─── Complétion ───────────────────────────────────────────────────────────────

function complete<T extends { ruleKey: string; severity: string }>(
  detected: T[],
  conditional: Array<{ whenRulePasses: string; issue: T }>,
  pool: T[]
): T[] {
  const detectedKeys = new Set(detected.map((i) => i.ruleKey))
  const opportunities: T[] = []

  // 1. Émetteurs conditionnels : la règle de base passe → l'opportunité s'active
  for (const { whenRulePasses, issue } of conditional) {
    if (!detectedKeys.has(whenRulePasses) && !detectedKeys.has(issue.ruleKey)) {
      opportunities.push(issue)
    }
  }

  // 2. Complément depuis le pool statique jusqu'à la garantie MIN_OPPORTUNITIES
  const existingOpportunities = detected.filter((i) => i.severity === 'opportunity').length
  for (const issue of pool) {
    if (existingOpportunities + opportunities.length >= MIN_OPPORTUNITIES) break
    if (!detectedKeys.has(issue.ruleKey)) {
      opportunities.push(issue)
    }
  }

  return opportunities
}

/** Complète les issues techniques détectées pour garantir ≥ 3 opportunités. */
export function completeTechnicalOpportunities(detected: TechnicalIssue[]): TechnicalIssue[] {
  return complete(detected, TECHNICAL_CONDITIONAL, TECHNICAL_POOL)
}

/** Complète les issues contenu détectées pour garantir ≥ 3 opportunités. */
export function completeContentOpportunities(detected: ContentIssue[]): ContentIssue[] {
  return complete(detected, CONTENT_CONDITIONAL, CONTENT_POOL)
}
