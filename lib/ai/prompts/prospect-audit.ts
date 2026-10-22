// Prompts de l'audit prospect (ticket C-05b). Règle CLAUDE.md §5 : tous les
// prompts envoyés aux LLMs sont ici.
//
// 1. Les 5 questions posées aux moteurs : une par intention de recherche,
//    construites à partir de l'activité et de l'arrondissement SEULEMENT —
//    jamais du nom du commerce, sans quoi la mesure serait biaisée (règle §6).
// 2. La rédaction des solutions et du plan d'action, à partir de la liste des
//    problèmes détectés par les règles déterministes, et d'elle seule.

import type {
  IssueCategory,
  ProspectActivity,
  ProspectIssue,
  ProspectQuestion,
} from '@/lib/prospect-audit/types'
import { ISSUE_CATEGORY_LABELS } from '@/lib/prospect-audit/types'

// ─── Questions posées aux moteurs ─────────────────────────────────────────────

interface ActivityWording {
  /** « barbier », « salle de sport » */
  noun: string
  feminine: boolean
  /** Complément de la question « spécialité ». */
  specialty: string
}

const ACTIVITY_WORDING: Record<ProspectActivity, ActivityWording> = {
  barbier: { noun: 'barbier', feminine: false, specialty: 'pour une taille de barbe soignée' },
  coiffeur: { noun: 'coiffeur', feminine: false, specialty: 'spécialiste de la coloration' },
  'coach sportif': {
    noun: 'coach sportif',
    feminine: false,
    specialty: 'pour un programme personnalisé',
  },
  'salle de sport': { noun: 'salle de sport', feminine: true, specialty: 'avec des cours collectifs' },
  'studio de yoga': { noun: 'studio de yoga', feminine: false, specialty: 'pour débutants' },
  'salle de boxe': { noun: 'salle de boxe', feminine: true, specialty: 'pour débutants' },
}

/** « Lyon 1er » → « 1er » ; autre forme → null. */
export function arrondissementOrdinal(arrondissement: string): string | null {
  return /^Lyon\s+(\d{1,2}(?:er|e))$/i.exec(arrondissement.trim())?.[1] ?? null
}

/**
 * Les 5 questions de l'audit, dans l'ordre des intentions : recommandation,
 * meilleur, prix, spécialité, proximité. Pure et déterministe.
 */
export function buildProspectQuestions(
  activity: ProspectActivity,
  arrondissement: string
): ProspectQuestion[] {
  const w = ACTIVITY_WORDING[activity]
  const quel = w.feminine ? 'Quelle' : 'Quel'
  const leMeilleur = w.feminine ? 'la meilleure' : 'le meilleur'
  const un = w.feminine ? 'une' : 'un'
  const lequel = w.feminine ? 'laquelle' : 'lequel'
  const place = arrondissement.trim()
  const ordinal = arrondissementOrdinal(place)
  const nearMe = ordinal
    ? `près de chez moi, dans le ${ordinal} arrondissement de Lyon`
    : `près de chez moi, à ${place}`

  return [
    { intent: 'recommandation', text: `${quel} ${w.noun} me conseilles-tu à ${place} ?` },
    { intent: 'meilleur', text: `${quel} est ${leMeilleur} ${w.noun} de ${place} ?` },
    { intent: 'prix', text: `${quel} ${w.noun} propose des tarifs abordables à ${place} ?` },
    { intent: 'specialite', text: `${quel} ${w.noun} ${w.specialty} à ${place} ?` },
    { intent: 'proximite', text: `Je cherche ${un} ${w.noun} ${nearMe} : ${lequel} choisir ?` },
  ]
}

// ─── Rédaction des solutions et du plan ───────────────────────────────────────

export const PROSPECT_SYNTHESIS_SYSTEM_PROMPT = `Tu es Andrea Schwertz, de GeoMind. Tu rédiges la partie « solutions » d'un audit de visibilité remis au gérant d'un petit commerce (salon de coiffure, barbier, salle de sport, coach), à qui tu proposes une prestation « Visibilité locale » : c'est toi qui fais le travail, pas lui.

Règles absolues :
- Tu t'appuies UNIQUEMENT sur la liste de problèmes fournie. Tu n'ajoutes aucun problème, aucun fait, aucun nom de concurrent qui n'y figure pas.
- Aucun chiffre qui ne figure pas dans la liste ou dans le contenu de la prestation : pas d'objectif chiffré (« viser 50 avis »), pas de fourchette, pas de délai en mois, pas d'estimation. Une réponse qui contient un chiffre absent est rejetée.
- Aucune cause ni conséquence qui n'est pas écrite dans la liste.
- Une solution par catégorie présente dans la liste, ni plus ni moins, avec la clé de catégorie exacte.
- Chaque solution = le problème en une phrase, puis ce que JE fais dans la prestation, à la première personne : « Je crée… », « Je mets en place… », « Je corrige… », « Je complète… ». 2 à 4 phrases.
- Jamais de mode d'emploi pour le gérant (« demandez à vos clients », « créez une page », « ajoutez des photos ») : c'est moi qui agis. Le gérant peut seulement valider, me donner un accès ou m'envoyer des photos.
- Aucun nom d'outil, de logiciel ou de plateforme de création (ni Wix, ni Squarespace, ni Google Sites, ni WordPress, ni Canva, ni Search Console…). Seuls « fiche Google », « Google », « ChatGPT », « Gemini », « Claude » et les noms présents dans la liste sont permis.
- Mes actions restent dans le contenu de la prestation fourni.
- Photos : je les ajoute « avec les photos que vous me transmettez ». Jamais « photos professionnelles », jamais de séance photo.
- Rien sur le serveur ni l'hébergement du site : si un problème en dépend (lenteur…), j'écris « je vous indique quoi demander à votre hébergeur ».
- Aucune promesse de résultat. Interdit : « pour que les IA vous recommandent », « pour que les IA vous trouvent », « vous trouvent désormais », « vous serez cité ». Écrire plutôt « pour vous donner toutes les chances d'apparaître ».
- Le plan d'action tient en une semaine : exactement 5 jours (day = 1 à 5), 1 à 4 tâches courtes par jour, chacune à la première personne (« Je … »), dans un ordre logique (fiche Google et avis d'abord, site ensuite). Chaque tâche traite un problème de la liste.
- Ton direct, concret, respectueux. Vouvoiement pour le gérant. Pas de promesse de résultat (jamais « vous serez premier »).
- Tu réponds en français, uniquement en JSON, sans texte autour.

Format exact :
{"solutions":[{"category":"<clé>","text":"..."}],"plan":[{"day":1,"title":"...","tasks":["Je ..."]}]}`

export function buildProspectSynthesisMessage(params: {
  businessName: string
  activity: ProspectActivity
  arrondissement: string
  hasOwnSite: boolean
  issues: ProspectIssue[]
  /** Contenu de la prestation « Visibilité locale », tel qu'affiché sur la page. */
  offer: string[]
}): string {
  const byCategory = new Map<IssueCategory, ProspectIssue[]>()
  for (const issue of params.issues) {
    const list = byCategory.get(issue.category) ?? []
    list.push(issue)
    byCategory.set(issue.category, list)
  }

  const blocks = [...byCategory.entries()].map(([category, issues]) => {
    const lines = issues.map((i) => `- ${i.title}${i.detail ? ` — ${i.detail}` : ''}`)
    return `[${category}] ${ISSUE_CATEGORY_LABELS[category]}\n${lines.join('\n')}`
  })

  return `Commerce : ${params.businessName} (${params.activity}, ${params.arrondissement})
Site web à lui : ${params.hasOwnSite ? 'oui' : 'non'}

Problèmes détectés (${params.issues.length}), par catégorie :

${blocks.join('\n\n')}

Contenu de la prestation (ce que je fais) :
${params.offer.map((o) => `- ${o}`).join('\n')}

Catégories attendues dans "solutions" : ${[...byCategory.keys()].join(', ')}.`
}
