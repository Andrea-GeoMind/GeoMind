/**
 * lib/analysis/glossary.ts
 *
 * Glossaire de vulgarisation (PLAN item 18) : chaque terme technique qui
 * apparaît dans un titre d'issue reçoit une explication d'une phrase, en
 * français courant, du point de vue d'un patron de TPE.
 * Fonction pure : explainJargon(texte) → explication du premier terme reconnu.
 */

interface GlossaryEntry {
  /** Termes qui déclenchent l'explication (testés en minuscules) */
  terms: string[]
  explanation: string
}

const GLOSSARY: GlossaryEntry[] = [
  {
    terms: ['canonical'],
    explanation:
      'La balise canonical dit aux moteurs : « la version officielle de cette page, c\'est celle-ci » — sans elle, les IA peuvent se perdre entre des doublons.',
  },
  {
    terms: ['llms.txt'],
    explanation:
      'Le llms.txt est un petit fichier qui se présente aux IA à l\'entrée de votre site : qui vous êtes, quoi lire en priorité.',
  },
  {
    terms: ['robots.txt'],
    explanation:
      'Le robots.txt est le portier de votre site : il dit aux robots (dont ceux des IA) ce qu\'ils ont le droit de visiter.',
  },
  {
    terms: ['sitemap'],
    explanation:
      'Le sitemap est le plan de votre site : il aide les moteurs et les IA à trouver toutes vos pages sans en oublier.',
  },
  {
    terms: ['schema.org', 'json-ld', 'données structurées'],
    explanation:
      'Les données structurées (Schema.org) sont des étiquettes invisibles qui présentent vos infos (activité, avis, FAQ, horaires) dans un format que les IA comprennent à coup sûr.',
  },
  {
    terms: ['h1', 'hiérarchie de titres'],
    explanation:
      'Les titres H1, H2, H3 sont la table des matières de votre page : s\'ils sont absents ou désordonnés, les IA comprennent mal de quoi elle parle.',
  },
  {
    terms: ['meta description'],
    explanation:
      'La meta description est le petit résumé de la page affiché dans les résultats de recherche — et repris par les IA pour vous présenter.',
  },
  {
    terms: ['balise title'],
    explanation:
      'La balise title est le titre de l\'onglet du navigateur : c\'est souvent la première chose qu\'un moteur ou une IA lit sur votre page.',
  },
  {
    terms: ['open graph'],
    explanation:
      'Les balises Open Graph contrôlent l\'aperçu (image, titre) quand votre page est partagée sur les réseaux ou citée par une IA.',
  },
  {
    terms: ['twitter card'],
    explanation:
      'La Twitter Card définit l\'aperçu de votre page quand elle est partagée sur X/Twitter.',
  },
  {
    terms: ['alt'],
    explanation:
      'Le texte alt décrit une image en mots : indispensable aux malvoyants — et aux IA, qui ne « voient » pas vos images.',
  },
  {
    terms: ['viewport'],
    explanation:
      'La balise viewport indique que votre site s\'adapte aux écrans de téléphone — sans elle, il est considéré comme non-mobile.',
  },
  {
    terms: ['breadcrumb', 'fil d\'ariane'],
    explanation:
      'Le fil d\'Ariane (breadcrumb) montre où on se trouve dans le site (Accueil > Services > Plomberie) — il aide les IA à comprendre votre structure.',
  },
  {
    terms: ['noindex', 'no-index'],
    explanation:
      'La balise noindex demande aux moteurs de NE PAS référencer une page — si elle traîne sur une page importante, vous êtes invisible volontairement.',
  },
  {
    terms: ['https'],
    explanation:
      'Le HTTPS (cadenas) chiffre la connexion : sans lui, navigateurs, moteurs et IA considèrent votre site comme non sûr.',
  },
  {
    terms: ['hreflang', 'attribut lang', 'langue de la page'],
    explanation:
      'L\'attribut de langue dit aux IA en quelle langue est votre page — sans lui, elles peuvent vous classer dans la mauvaise langue.',
  },
]

/**
 * Retourne l'explication du premier terme technique reconnu dans le texte,
 * ou null si aucun jargon connu n'est détecté.
 */
export function explainJargon(text: string): string | null {
  const lower = text.toLowerCase()
  for (const entry of GLOSSARY) {
    if (entry.terms.some((t) => lower.includes(t))) return entry.explanation
  }
  return null
}
