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

export const PROSPECT_SYNTHESIS_SYSTEM_PROMPT = `Tu rédiges, pour GeoMind, la partie « solutions » d'un audit de visibilité en ligne destiné au gérant d'un petit commerce (salon de coiffure, barbier, salle de sport, coach).

Règles absolues :
- Tu t'appuies UNIQUEMENT sur la liste de problèmes fournie. Tu n'ajoutes aucun problème, aucun chiffre, aucun fait, aucun nom de concurrent qui n'y figure pas.
- Une solution par catégorie présente dans la liste, ni plus ni moins, avec la clé de catégorie exacte.
- Chaque solution dit concrètement quoi faire, en 2 à 4 phrases, sans jargon (pas de « balise », « schema.org », « SEO » sans explication simple).
- Le plan d'action tient en une semaine : exactement 5 jours (day = 1 à 5), 1 à 4 tâches courtes par jour, à l'infinitif (« Compléter… », « Ajouter… »), dans un ordre logique (la fiche Google et les avis d'abord, le site ensuite). Chaque tâche traite un problème de la liste.
- Ton : direct, concret, respectueux. Vouvoiement. Pas de promesse de résultat (jamais « vous serez premier »).
- Tu réponds en français, uniquement en JSON, sans texte autour.

Format exact :
{"solutions":[{"category":"<clé>","text":"..."}],"plan":[{"day":1,"title":"...","tasks":["..."]}]}`

export function buildProspectSynthesisMessage(params: {
  businessName: string
  activity: ProspectActivity
  arrondissement: string
  hasOwnSite: boolean
  issues: ProspectIssue[]
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

Catégories attendues dans "solutions" : ${[...byCategory.keys()].join(', ')}.`
}
