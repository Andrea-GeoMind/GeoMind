/**
 * lib/analysis/local.ts
 *
 * Onglet Local (PLAN item 32) — pour les commerces et artisans : génère des
 * questions géolocalisées que leurs clients posent réellement aux IA, et une
 * checklist de présence locale (les sources que les IA citent pour le local).
 *
 * Fonctions PURES et déterministes — aucun appel LLM, aucun accès DB. La ville
 * et l'activité viennent des données du site (déjà collectées à la découverte).
 */

export interface LocalContext {
  /** Activité courte (1er mot-clé ou description tronquée) */
  activity: string
  /** Ville détectée (ou null si inconnue) */
  city: string | null
  siteName: string
}

/**
 * Extrait une ville d'un texte (description / mots-clés). Heuristique simple :
 * cherche « à <Ville> », « <Ville> (CP) », ou un mot-clé contenant une grande
 * ville française. Retourne null si rien de fiable.
 */
const FRENCH_CITIES = [
  'paris', 'marseille', 'lyon', 'toulouse', 'nice', 'nantes', 'montpellier',
  'strasbourg', 'bordeaux', 'lille', 'rennes', 'reims', 'le havre',
  'saint-étienne', 'toulon', 'grenoble', 'dijon', 'angers', 'nîmes',
  'villeurbanne', 'clermont-ferrand', 'le mans', 'aix-en-provence', 'brest',
  'tours', 'amiens', 'limoges', 'annecy', 'perpignan', 'metz', 'besançon',
  'orléans', 'rouen', 'mulhouse', 'caen', 'nancy', 'avignon',
]

export function detectCity(texts: string[]): string | null {
  const hay = texts.join(' ').toLowerCase()

  // 1) Motif « à <Ville> » ou « de <Ville> » suivi d'une majuscule dans l'original
  for (const raw of texts) {
    const m = raw.match(/\b(?:à|a|de|sur)\s+([A-ZÉÈ][a-zà-ÿ'’-]+(?:[ -][A-ZÉÈ][a-zà-ÿ'’-]+)?)/)
    if (m && m[1] && m[1].length > 2) {
      const cand = m[1].toLowerCase()
      if (FRENCH_CITIES.includes(cand)) return capitalizeCity(m[1])
    }
  }
  // 2) Une grande ville apparaît telle quelle
  for (const city of FRENCH_CITIES) {
    if (new RegExp(`\\b${city.replace(/[-]/g, '[- ]')}\\b`).test(hay)) {
      return capitalizeCity(city)
    }
  }
  return null
}

function capitalizeCity(s: string): string {
  return s
    .split(/([ -])/)
    .map((part) => (part === ' ' || part === '-' ? part : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()))
    .join('')
}

/**
 * Retire la ville de l'activité quand elle y figure déjà.
 *
 * Les mots-clés de découverte sont souvent géolocalisés (« chirurgien-dentiste
 * Lyon ») ; injectés tels quels dans un gabarit qui ajoute « à Lyon », ils
 * produisaient « chirurgien-dentiste Lyon à Lyon ».
 */
export function stripCityFromActivity(activity: string, city: string | null): string {
  if (!city) return activity.trim()
  const escaped = city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[-\s]/g, '[-\\s]')
  // La ville, précédée au besoin d'une préposition. On exige un début de chaîne
  // ou une espace devant la préposition : `\b` ne fonctionne pas devant « à »,
  // dont l'accent n'est pas un caractère de mot.
  const cleaned = activity
    .replace(new RegExp(`(?:^|\\s)(?:(?:à|au|aux|a|de|du|des|sur|en)\\s+)?${escaped}\\b`, 'gi'), ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .replace(/^[,\-–—]+|[,\-–—]+$/g, '')
    .trim()
  return cleaned.length > 0 ? cleaned : activity.trim()
}

/**
 * Génère des questions géolocalisées que des clients poseraient à une IA.
 * Si la ville est inconnue, on produit des modèles avec « [votre ville] » à
 * compléter — toujours utile, jamais bloquant.
 *
 * Aucun gabarit ne met l'activité au pluriel : un suffixe « s » posé sur un
 * nom composé donnait « chirurgien-dentiste Lyons ». Les tournures ci-dessous
 * restent naturelles avec l'activité au singulier, quelle qu'elle soit.
 */
export function buildLocalPrompts(ctx: LocalContext): string[] {
  const place = ctx.city ?? '[votre ville]'
  const a = stripCityFromActivity(ctx.activity, ctx.city) || 'prestataire'
  return [
    `Quel est le meilleur ${a} à ${place} ?`,
    `${a} à ${place} : lequel recommandes-tu et pourquoi ?`,
    `Je cherche un ${a} fiable près de ${place}, des suggestions ?`,
    `Y a-t-il un ${a} ouvert le week-end à ${place} ?`,
    `Quels professionnels recommandes-tu pour « ${a} » à ${place} ? Donne leurs sites web.`,
  ]
}

export interface LocalChecklistItem {
  key: string
  label: string
  /** Pourquoi c'est important pour la visibilité IA locale */
  why: string
  /** Action concrète */
  action: string
}

/**
 * Checklist de présence locale — les signaux que les IA recoupent pour répondre
 * aux requêtes locales. Indépendante du site (conseils universels), mais
 * personnalisée avec le nom et la ville quand on les connaît.
 */
export function buildLocalChecklist(ctx: LocalContext): LocalChecklistItem[] {
  const place = ctx.city ?? 'votre ville'
  return [
    {
      key: 'google-business',
      label: 'Fiche Google Business Profile complète',
      why: 'C’est la première source que les IA recoupent pour le local (horaires, avis, adresse).',
      action: `Créez/complétez votre fiche Google Business pour « ${ctx.siteName} » : catégorie, horaires, photos, téléphone, et répondez aux avis.`,
    },
    {
      key: 'reviews',
      label: 'Avis clients récents et nombreux',
      why: 'Les IA citent volontiers les établissements avec des avis détaillés et récents.',
      action: 'Demandez systématiquement un avis Google après chaque prestation — visez la régularité plus que le volume.',
    },
    {
      key: 'directories',
      label: 'Annuaires locaux et sectoriels',
      why: 'PagesJaunes, annuaires de votre métier et de votre ville sont des sources que les IA connaissent.',
      action: `Inscrivez « ${ctx.siteName} » sur PagesJaunes et 2-3 annuaires de votre secteur à ${place}.`,
    },
    {
      key: 'schema-localbusiness',
      label: 'Données structurées LocalBusiness sur le site',
      why: 'Elles donnent aux IA votre adresse, vos horaires et votre téléphone dans un format sûr.',
      action: 'Ajoutez le bloc LocalBusiness (adresse, horaires, téléphone) dans le <head> de votre page d’accueil — si ces données structurées manquent, le correctif prêt à coller apparaît dans votre Plan d’action.',
    },
    {
      key: 'nap-consistency',
      label: 'Nom, adresse, téléphone identiques partout',
      why: 'Une info incohérente entre votre site, Google et les annuaires brouille les IA (et peut créer des hallucinations).',
      action: 'Vérifiez que votre nom, adresse et téléphone sont écrits exactement pareil sur toutes vos fiches.',
    },
    {
      key: 'local-content',
      label: 'Contenu mentionnant votre zone',
      why: 'Une page qui parle de votre ville/quartier aide les IA à vous rattacher au local.',
      action: `Ajoutez une page ou un paragraphe « ${ctx.activity} à ${place} » décrivant votre zone d’intervention.`,
    },
  ]
}
