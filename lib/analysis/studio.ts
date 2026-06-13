/**
 * lib/analysis/studio.ts
 *
 * Studio de correctifs (PLAN item 26) — le différenciateur de GeoMind : ne pas
 * seulement diagnostiquer, mais livrer le fichier corrigé prêt à coller.
 *
 * Toutes les fonctions ici sont PURES et DÉTERMINISTES (aucun appel LLM, aucun
 * accès DB) : elles transforment les données réelles du site (nom, description,
 * mots-clés, URL, pays/langue) en artefacts structurellement valides. Testables
 * unitairement, idempotentes. Pas de violation de la règle « pas de LLM en
 * route/action » : le Studio se rend instantanément côté serveur.
 */

export interface StudioSite {
  name: string
  url: string
  language: string
  country: string
  description: string | null
  keywords: string[]
  email?: string | null
}

export type CmsKind = 'wordpress' | 'wix' | 'shopify' | 'webflow' | 'squarespace' | 'unknown'

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Origine https normalisée (sans chemin, sans www en double). */
export function siteOrigin(rawUrl: string): string {
  try {
    const u = new URL(rawUrl.includes('://') ? rawUrl : `https://${rawUrl}`)
    return `https://${u.hostname}`
  } catch {
    return `https://${rawUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '')}`
  }
}

/** Échappe une chaîne pour insertion sûre dans du JSON-LD (déjà géré par JSON.stringify). */
function jsonLd(obj: unknown): string {
  return JSON.stringify(obj, null, 2)
}

// ─── Détection CMS (depuis le tag generator des métadonnées Firecrawl) ────────

export function detectCms(metaGenerator: string | null | undefined, html?: string): CmsKind {
  const hay = `${metaGenerator ?? ''} ${html ?? ''}`.toLowerCase()
  if (/wordpress|wp-content|wp-json/.test(hay)) return 'wordpress'
  if (/shopify|cdn\.shopify/.test(hay)) return 'shopify'
  if (/wix\.com|wixsite/.test(hay)) return 'wix'
  if (/webflow/.test(hay)) return 'webflow'
  if (/squarespace/.test(hay)) return 'squarespace'
  return 'unknown'
}

// ─── Générateurs de fichiers ──────────────────────────────────────────────────

export function buildLlmsTxt(site: StudioSite): string {
  const origin = siteOrigin(site.url)
  const lines = [
    `# ${site.name}`,
    '',
    `> ${site.description?.trim() || `${site.name} — décrivez ici votre activité en une à deux phrases : ce que vous proposez, pour qui, et où.`}`,
    '',
    '## Pages principales',
    '',
    `- [Accueil](${origin}/)`,
  ]
  if (site.keywords.length > 0) {
    lines.push('', '## Mots-clés', '', site.keywords.slice(0, 12).join(', '))
  }
  lines.push('', '## Contact', '')
  if (site.email) lines.push(`- Email : ${site.email}`)
  lines.push(`- Site : ${origin}`)
  lines.push('')
  return lines.join('\n')
}

export function buildRobotsTxt(site: StudioSite): string {
  const origin = siteOrigin(site.url)
  // Autorise explicitement les crawlers IA + le reste, et déclare le sitemap.
  return [
    '# Généré par GeoMind — autorise les robots des moteurs de réponses IA',
    'User-agent: *',
    'Allow: /',
    '',
    'User-agent: GPTBot',
    'Allow: /',
    '',
    'User-agent: OAI-SearchBot',
    'Allow: /',
    '',
    'User-agent: ChatGPT-User',
    'Allow: /',
    '',
    'User-agent: ClaudeBot',
    'Allow: /',
    '',
    'User-agent: PerplexityBot',
    'Allow: /',
    '',
    'User-agent: Google-Extended',
    'Allow: /',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n')
}

export function buildOrganizationJsonLd(site: StudioSite): string {
  const origin = siteOrigin(site.url)
  const org: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    url: origin,
    description:
      site.description?.trim() || `${site.name} — complétez cette description de votre activité.`,
  }
  if (site.email) org.email = site.email
  if (site.country) org.areaServed = site.country
  return jsonLd(org)
}

export function buildLocalBusinessJsonLd(site: StudioSite): string {
  const origin = siteOrigin(site.url)
  return jsonLd({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: site.name,
    url: origin,
    description:
      site.description?.trim() || `${site.name} — complétez cette description de votre activité.`,
    // Champs à compléter par le client — laissés en placeholders explicites
    address: {
      '@type': 'PostalAddress',
      streetAddress: '— votre adresse —',
      addressLocality: '— votre ville —',
      postalCode: '— code postal —',
      addressCountry: site.country || 'FR',
    },
    telephone: '— votre téléphone —',
    openingHours: '— ex : Mo-Fr 09:00-18:00 —',
    ...(site.email ? { email: site.email } : {}),
  })
}

export interface FaqEntry {
  question: string
  answer: string
}

export function buildFaqJsonLd(entries: FaqEntry[]): string {
  return jsonLd({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries
      .filter((e) => e.question.trim() && e.answer.trim())
      .map((e) => ({
        '@type': 'Question',
        name: e.question.trim(),
        acceptedAnswer: { '@type': 'Answer', text: e.answer.trim() },
      })),
  })
}

/** FAQ de départ amorcée depuis les mots-clés — le client remplace les réponses. */
export function seedFaqEntries(site: StudioSite): FaqEntry[] {
  const topic = site.keywords[0] ?? site.name
  return [
    {
      question: `Que propose ${site.name} ?`,
      answer: site.description?.trim() || 'Décrivez ici votre offre en 2-3 phrases concrètes.',
    },
    {
      question: `Combien coûte ${topic} ?`,
      answer: 'Donnez une fourchette de prix ou un point de départ — les IA reprennent le concret.',
    },
    {
      question: `Comment vous contacter ?`,
      answer: site.email
        ? `Par email à ${site.email}, ou via le formulaire de contact du site.`
        : 'Indiquez ici votre email, téléphone ou formulaire de contact.',
    },
  ]
}

export interface MetaSuggestion {
  title: string
  description: string
}

/** Title (≤60 car.) + meta description (≤155 car.) suggérés pour la page d'accueil. */
export function buildHomeMeta(site: StudioSite): MetaSuggestion {
  const base = site.description?.trim() ?? ''
  const kw = site.keywords.slice(0, 3).join(', ')
  const title = `${site.name}${kw ? ` — ${site.keywords[0]}` : ''}`.slice(0, 60)
  const description = (
    base || `${site.name}${kw ? ` : ${kw}.` : '.'} Découvrez nos services et contactez-nous.`
  ).slice(0, 155)
  return { title, description }
}

// ─── Catalogue des correctifs disponibles ─────────────────────────────────────

export type FixFormat = 'txt' | 'html' | 'meta'

export interface StudioFix {
  key: string
  label: string
  /** Ce que ça corrige, en une phrase de patron */
  what: string
  /** Où ça se place */
  placement: string
  format: FixFormat
  /** Nom de fichier suggéré au téléchargement (pour format txt) */
  filename?: string
  content: string
}

/** Construit le `<script type="application/ld+json">` prêt à coller. */
function wrapJsonLdForHtml(json: string): string {
  return `<script type="application/ld+json">\n${json}\n</script>`
}

/** Produit tous les correctifs générables pour un site. */
export function buildStudioFixes(site: StudioSite, faq: FaqEntry[]): StudioFix[] {
  const meta = buildHomeMeta(site)
  return [
    {
      key: 'llms-txt',
      label: 'Fichier llms.txt',
      what: 'Présente votre site aux IA (qui vous êtes, vos pages clés).',
      placement: 'À placer à la racine du site : votresite.fr/llms.txt',
      format: 'txt',
      filename: 'llms.txt',
      content: buildLlmsTxt(site),
    },
    {
      key: 'robots-txt',
      label: 'Fichier robots.txt',
      what: 'Autorise explicitement les robots des IA (GPTBot, ClaudeBot…) et déclare votre sitemap.',
      placement: 'À placer à la racine du site : votresite.fr/robots.txt',
      format: 'txt',
      filename: 'robots.txt',
      content: buildRobotsTxt(site),
    },
    {
      key: 'schema-organization',
      label: 'Données structurées — Organisation',
      what: "Donne aux IA une fiche d'identité claire de votre entreprise.",
      placement: 'À coller dans le <head> de votre page d’accueil.',
      format: 'html',
      content: wrapJsonLdForHtml(buildOrganizationJsonLd(site)),
    },
    {
      key: 'schema-localbusiness',
      label: 'Données structurées — Établissement local',
      what: 'Idéal pour un commerce/artisan : adresse, horaires, téléphone lisibles par les IA.',
      placement: 'À coller dans le <head> de votre page d’accueil (complétez adresse/horaires).',
      format: 'html',
      content: wrapJsonLdForHtml(buildLocalBusinessJsonLd(site)),
    },
    {
      key: 'schema-faq',
      label: 'Données structurées — FAQ',
      what: 'Vos questions/réponses dans un format que les IA reprennent volontiers.',
      placement: 'À coller dans le <head> de la page contenant votre FAQ.',
      format: 'html',
      content: wrapJsonLdForHtml(buildFaqJsonLd(faq)),
    },
    {
      key: 'home-meta',
      label: 'Titre et description de la page d’accueil',
      what: 'Le titre et le résumé que moteurs et IA affichent pour vous présenter.',
      placement: 'À renseigner dans les réglages SEO de votre page d’accueil.',
      format: 'meta',
      content: `Titre (balise title) :\n${meta.title}\n\nMeta description :\n${meta.description}`,
    },
  ]
}

// ─── Instructions d'installation par CMS ──────────────────────────────────────

export function cmsInstructions(cms: CmsKind, fix: StudioFix): string {
  const isFile = fix.format === 'txt'
  const isHead = fix.format === 'html'
  const isMeta = fix.format === 'meta'

  switch (cms) {
    case 'wordpress':
      if (isFile)
        return `WordPress : installez l’extension gratuite « WP File Manager », ou via votre hébergeur (FTP / gestionnaire de fichiers), déposez ce fichier à la racine de votre site (au même niveau que wp-config.php).`
      if (isHead)
        return `WordPress : avec Yoast SEO ou Rank Math, collez ce code dans une section « code header », ou utilisez l’extension « Insert Headers and Footers » (zone Header).`
      if (isMeta)
        return `WordPress : dans Yoast SEO ou Rank Math, éditez votre page d’accueil → champs « Titre SEO » et « Méta description ».`
      break
    case 'shopify':
      if (isFile)
        return `Shopify : robots.txt et llms.txt s’éditent via le fichier robots.txt.liquid (Boutique en ligne → Thèmes → Modifier le code) ; collez-y le contenu.`
      if (isHead)
        return `Shopify : Boutique en ligne → Thèmes → Modifier le code → theme.liquid, collez ce code juste avant </head>.`
      if (isMeta)
        return `Shopify : Boutique en ligne → Préférences → Titre et méta-description de la page d’accueil.`
      break
    case 'wix':
      if (isFile)
        return `Wix : le robots.txt s’édite dans Paramètres → SEO → Avancé → robots.txt. Pour llms.txt, Wix ne permet pas toujours les fichiers racine — contactez le support ou utilisez un domaine géré.`
      if (isHead)
        return `Wix : Paramètres → Avancé → Code personnalisé → Ajouter du code dans le <head>, collez ce code.`
      if (isMeta)
        return `Wix : éditeur → SEO de la page d’accueil → Titre et description.`
      break
    case 'webflow':
      if (isFile)
        return `Webflow : Project Settings → SEO pour le robots.txt. Le llms.txt nécessite un hébergement permettant les fichiers racine.`
      if (isHead)
        return `Webflow : Project Settings → Custom Code → Head Code, collez ce code.`
      if (isMeta)
        return `Webflow : Page Settings de l’accueil → SEO Title & Meta Description.`
      break
    case 'squarespace':
      if (isHead)
        return `Squarespace : Paramètres → Avancé → Injection de code → En-tête, collez ce code.`
      if (isMeta)
        return `Squarespace : éditeur de la page d’accueil → SEO → Titre et description.`
      if (isFile)
        return `Squarespace ne permet pas d’ajouter de fichiers racine personnalisés (llms.txt, robots.txt) — cette correction n’est pas applicable sur cette plateforme.`
      break
    default:
      if (isFile)
        return `Déposez ce fichier à la racine de votre site (même niveau que la page d’accueil), via votre hébergeur (FTP ou gestionnaire de fichiers). En cas de doute, transférez-le à votre webmaster.`
      if (isHead)
        return `Collez ce code dans le <head> de votre page (juste avant </head>). Si vous ne savez pas où, envoyez-le à votre webmaster avec la mention « à placer dans le head ».`
      if (isMeta)
        return `Renseignez ces deux textes dans les réglages SEO de votre page d’accueil (titre et méta-description).`
  }
  return `Transférez ce contenu à votre webmaster en précisant : « ${fix.placement} »`
}

export const CMS_LABELS: Record<CmsKind, string> = {
  wordpress: 'WordPress',
  shopify: 'Shopify',
  wix: 'Wix',
  webflow: 'Webflow',
  squarespace: 'Squarespace',
  unknown: 'Autre / je ne sais pas',
}
