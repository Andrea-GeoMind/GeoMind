/**
 * lib/analysis/action-fixes.ts
 *
 * Fait le pont entre les points faibles du Plan d'action (identifiés par leur
 * `ruleKey`) et les correctifs prêts à coller générés par le Studio
 * (`lib/analysis/studio.ts`). C'est la fusion « Studio → Plan d'action » : au
 * lieu d'un onglet séparé listant des fichiers génériques, chaque problème
 * détecté affiche directement son correctif.
 *
 * Toutes les règles n'ont pas de correctif générable (ex. « contenu trop court »
 * se corrige à la main) : seules celles présentes dans RULE_TO_FIX reçoivent un
 * bloc de code. Fonctions pures, testables.
 */

import {
  buildStudioFixes,
  cmsInstructions,
  CMS_LABELS,
  type StudioSite,
  type CmsKind,
  type FaqEntry,
} from '@/lib/analysis/studio'

/**
 * Associe une règle GEO (ruleKey émis par les analyses technique/contenu) à la
 * clé du correctif Studio qui la résout. Les règles absentes gardent un guidage
 * manuel (pas de code généré).
 */
export const RULE_TO_FIX: Record<string, string> = {
  // Fichiers racine
  llms_txt_missing: 'llms-txt',
  robots_txt_block_all: 'robots-txt',
  robots_txt_block_ai_bots: 'robots-txt',
  sitemap_missing: 'robots-txt',
  // Données structurées
  schema_org_organization: 'schema-organization',
  schema_org_faq: 'schema-faq',
  no_faq_content: 'schema-faq',
  // Titre / meta de la page d'accueil
  title_missing_or_short: 'home-meta',
  meta_description_missing: 'home-meta',
  meta_description_too_short: 'home-meta',
  duplicate_meta_descriptions: 'home-meta',
}

/** Correctif sérialisable attaché à une action (sûr à passer à un composant client). */
export interface ActionFix {
  label: string
  what: string
  placement: string
  format: 'txt' | 'html' | 'meta'
  filename?: string
  content: string
  /** Instruction d'installation pré-calculée pour la plateforme détectée. */
  cmsInstruction: string
  cmsLabel: string
}

/**
 * Construit la table `ruleKey → ActionFix` pour un site donné. On génère tous les
 * correctifs une fois, puis on n'expose que ceux reliés à une règle.
 */
export function buildActionFixesByRule(
  site: StudioSite,
  faq: FaqEntry[],
  cms: CmsKind
): Record<string, ActionFix> {
  const fixesByKey = new Map(buildStudioFixes(site, faq).map((f) => [f.key, f]))
  const result: Record<string, ActionFix> = {}

  for (const [ruleKey, fixKey] of Object.entries(RULE_TO_FIX)) {
    const fix = fixesByKey.get(fixKey)
    if (!fix) continue
    result[ruleKey] = {
      label: fix.label,
      what: fix.what,
      placement: fix.placement,
      format: fix.format,
      filename: fix.filename,
      content: fix.content,
      cmsInstruction: cmsInstructions(cms, fix),
      cmsLabel: CMS_LABELS[cms],
    }
  }
  return result
}
