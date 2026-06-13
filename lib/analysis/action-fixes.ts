/**
 * lib/analysis/action-fixes.ts
 *
 * Fait le pont entre les points faibles du Plan d'action (identifiés par leur
 * `ruleKey`) et les correctifs prêts à coller. Deux sources :
 *
 *  1. Les fichiers générés depuis les données du site (`lib/analysis/studio.ts`)
 *     — llms.txt, robots.txt, données structurées, meta de la page d'accueil.
 *  2. Des templates de code statiques (`buildRuleSnippets`) pour les règles dont
 *     le correctif est un motif HTML simple à coller (H1, viewport, lang,
 *     canonical, Open Graph, alt d'image…).
 *
 * C'est la fusion « Studio → Plan d'action / fiches » : au lieu d'un onglet
 * séparé, chaque problème détecté affiche directement son correctif. Les règles
 * absentes des deux sources gardent un guidage manuel. Fonctions pures.
 */

import {
  buildStudioFixes,
  cmsInstructions,
  CMS_LABELS,
  siteOrigin,
  type StudioSite,
  type CmsKind,
  type FaqEntry,
  type StudioFix,
} from '@/lib/analysis/studio'

/**
 * Associe une règle GEO (ruleKey émis par les analyses technique/contenu) à la
 * clé du fichier généré par le Studio qui la résout.
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
  /** Instruction d'installation (CMS-spécifique pour les fichiers générés, générique pour les snippets). */
  cmsInstruction: string
  /** Plateforme détectée — vide pour les snippets génériques. */
  cmsLabel: string
}

/**
 * Templates de code statiques pour les règles dont le correctif est un motif
 * HTML simple. Le contenu dépend de la page (le texte du H1, l'alt d'une image),
 * donc on fournit le motif avec un placeholder explicite à adapter.
 */
function buildRuleSnippets(site: StudioSite): Record<string, ActionFix> {
  const origin = siteOrigin(site.url)

  const snippet = (
    label: string,
    what: string,
    instruction: string,
    content: string
  ): ActionFix => ({
    label,
    what,
    placement: instruction,
    format: 'html',
    content,
    cmsInstruction: instruction,
    cmsLabel: '',
  })

  return {
    h1_missing_or_duplicate: snippet(
      'Balise H1 de la page',
      'Un seul <h1> par page, décrivant clairement son sujet.',
      'Dans le corps de la page, tout en haut du contenu principal — un seul par page.',
      '<h1>Titre principal décrivant le sujet de la page</h1>'
    ),
    html_lang_missing: snippet(
      'Langue de la page',
      'Déclare la langue pour que les IA interprètent correctement votre contenu.',
      'Sur la balise <html> ouvrante de votre page (souvent dans le template de votre thème).',
      '<html lang="fr">'
    ),
    mobile_viewport_missing: snippet(
      'Balise viewport (mobile)',
      'Indique que la page s’adapte au mobile.',
      'Dans le <head> de votre page.',
      '<meta name="viewport" content="width=device-width, initial-scale=1">'
    ),
    canonical_missing: snippet(
      'URL canonique',
      'Évite le contenu dupliqué en désignant l’URL de référence de la page.',
      'Dans le <head>, avec l’URL exacte de la page.',
      `<link rel="canonical" href="${origin}/cette-page" />`
    ),
    open_graph_missing: snippet(
      'Balises Open Graph',
      'Titre, description et image repris quand votre page est partagée ou citée.',
      'Dans le <head> de votre page.',
      [
        '<meta property="og:title" content="Titre de votre page" />',
        '<meta property="og:description" content="Description courte et claire de la page" />',
        '<meta property="og:type" content="website" />',
        `<meta property="og:url" content="${origin}/cette-page" />`,
        `<meta property="og:image" content="${origin}/image-apercu.jpg" />`,
      ].join('\n')
    ),
    twitter_card_missing: snippet(
      'Balises Twitter Card',
      'Aperçu enrichi de votre page sur X/Twitter et certains agrégateurs.',
      'Dans le <head> de votre page.',
      [
        '<meta name="twitter:card" content="summary_large_image" />',
        '<meta name="twitter:title" content="Titre de votre page" />',
        '<meta name="twitter:description" content="Description courte et claire de la page" />',
        `<meta name="twitter:image" content="${origin}/image-apercu.jpg" />`,
      ].join('\n')
    ),
    images_without_alt: snippet(
      'Texte alternatif des images',
      'Décrit chaque image pour les IA (et l’accessibilité).',
      'Ajoutez un attribut alt descriptif à chaque image (champ « texte alternatif » dans votre éditeur).',
      '<img src="/chemin/vers/image.jpg" alt="Description précise et concise de l’image" />'
    ),
  }
}

/**
 * Construit la table `ruleKey → ActionFix` pour un site donné, en fusionnant les
 * fichiers générés (prioritaires) et les templates statiques.
 */
export function buildActionFixesByRule(
  site: StudioSite,
  faq: FaqEntry[],
  cms: CmsKind
): Record<string, ActionFix> {
  const fixesByKey = new Map(buildStudioFixes(site, faq).map((f) => [f.key, f]))
  const result: Record<string, ActionFix> = {}

  const toActionFix = (fix: StudioFix): ActionFix => ({
    label: fix.label,
    what: fix.what,
    placement: fix.placement,
    format: fix.format,
    filename: fix.filename,
    content: fix.content,
    cmsInstruction: cmsInstructions(cms, fix),
    cmsLabel: CMS_LABELS[cms],
  })

  // 1. Fichiers générés depuis les données du site (instructions CMS-spécifiques)
  for (const [ruleKey, fixKey] of Object.entries(RULE_TO_FIX)) {
    const fix = fixesByKey.get(fixKey)
    if (fix) result[ruleKey] = toActionFix(fix)
  }

  // 2. Templates statiques — sans écraser un fichier généré déjà présent
  const snippets = buildRuleSnippets(site)
  for (const [ruleKey, fix] of Object.entries(snippets)) {
    if (!result[ruleKey]) result[ruleKey] = fix
  }

  return result
}
