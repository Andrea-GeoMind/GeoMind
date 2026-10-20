/**
 * Audit prospect (ticket C-05b) — schémas des données d'entrée et du document
 * publié sur /audit/[token].
 *
 * Fichier sans dépendance d'E/S : importable par la page, le script et les
 * tests. Le document publié ne contient QUE des données publiques du commerce
 * (fiche Google relevée, site public, réponses des IA résumées) : ni coût, ni
 * texte brut des réponses, ni coordonnées autres que l'adresse.
 */

import { z } from 'zod'

/** Moteurs interrogés par l'audit prospect, dans l'ordre d'affichage. */
export const PROSPECT_ENGINES = ['chatgpt', 'gemini', 'claude'] as const
export type ProspectEngine = (typeof PROSPECT_ENGINES)[number]

export const ENGINE_LABELS: Record<ProspectEngine, string> = {
  chatgpt: 'ChatGPT',
  gemini: 'Gemini',
  claude: 'Claude',
}

/**
 * Activité telle qu'un client la chercherait. Le secteur Places « fitness »
 * recouvre une salle et un coach : la question doit nommer le bon métier.
 */
export const PROSPECT_ACTIVITIES = [
  'barbier',
  'coiffeur',
  'coach sportif',
  'salle de sport',
  'studio de yoga',
  'salle de boxe',
] as const
export type ProspectActivity = (typeof PROSPECT_ACTIVITIES)[number]

export const QUESTION_INTENTS = ['recommandation', 'meilleur', 'prix', 'specialite', 'proximite'] as const
export type QuestionIntent = (typeof QUESTION_INTENTS)[number]

export const INTENT_LABELS: Record<QuestionIntent, string> = {
  recommandation: 'Recommandation',
  meilleur: 'Le meilleur',
  prix: 'Prix',
  specialite: 'Spécialité',
  proximite: 'Proximité',
}

/** Données publiques d'une fiche Google, relevées par l'API Places. */
export const PlaceSnapshotSchema = z.object({
  placeId: z.string().min(1),
  name: z.string().min(1),
  address: z.string().min(1),
  rating: z.number().min(0).max(5).nullable(),
  reviewCount: z.number().int().min(0),
  /** L'API Places plafonne à 10 : 10 veut dire « 10 ou plus ». */
  photoCount: z.number().int().min(0).max(10),
  hasHours: z.boolean(),
  /** Lien « site web » de la fiche, tel quel (peut être Planity, Instagram…). */
  website: z.string().url().nullable(),
  /** Domaine de plateforme quand le lien n'est pas un site à soi. */
  listing: z.string().nullable(),
})
export type PlaceSnapshot = z.infer<typeof PlaceSnapshotSchema>

export const CompetitorSnapshotSchema = PlaceSnapshotSchema.extend({
  distanceM: z.number().int().min(0),
  /** Précision quand le concurrent n'est pas du même secteur exact. */
  scope: z.string().nullable(),
})
export type CompetitorSnapshot = z.infer<typeof CompetitorSnapshotSchema>

export const ProspectInputSchema = PlaceSnapshotSchema.extend({
  activity: z.enum(PROSPECT_ACTIVITIES),
  /** « Lyon 1er », « Lyon 2e »… */
  arrondissement: z.string().min(1),
  /** Médiane des avis du même secteur dans le quartier ou l'arrondissement. */
  sectorMedianReviews: z.number().min(0),
  /** Date du relevé Places (AAAA-MM-JJ). */
  placesCollectedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  competitor: CompetitorSnapshotSchema.nullable(),
})
export type ProspectInput = z.infer<typeof ProspectInputSchema>

export const ProspectQuestionSchema = z.object({
  intent: z.enum(QUESTION_INTENTS),
  text: z.string().min(10),
})
export type ProspectQuestion = z.infer<typeof ProspectQuestionSchema>

export const AnswerCellSchema = z.object({
  question: z.number().int().min(0),
  engine: z.enum(PROSPECT_ENGINES),
  /** `failed` : aucune réponse après reprise — exclu des dénominateurs. */
  status: z.enum(['ok', 'failed']),
  cited: z.boolean(),
  /** Rang dans la liste de la réponse ; null si cité hors liste ou non cité. */
  position: z.number().int().min(1).nullable(),
  /** Acteurs nommés dans la réponse à la place du commerce, dans l'ordre. */
  competitors: z.array(z.string()).max(15),
})
export type AnswerCell = z.infer<typeof AnswerCellSchema>

export const ISSUE_CATEGORIES = ['fiche', 'avis', 'photos', 'site', 'technique', 'contenu', 'ia'] as const
export type IssueCategory = (typeof ISSUE_CATEGORIES)[number]

export const ISSUE_CATEGORY_LABELS: Record<IssueCategory, string> = {
  fiche: 'Fiche Google',
  avis: 'Avis',
  photos: 'Photos',
  site: 'Site web',
  technique: 'Technique du site',
  contenu: 'Contenu du site',
  ia: 'Présence dans les IA',
}

export const ProspectIssueSchema = z.object({
  key: z.string().min(1),
  category: z.enum(ISSUE_CATEGORIES),
  title: z.string().min(1),
  detail: z.string(),
})
export type ProspectIssue = z.infer<typeof ProspectIssueSchema>

export const SolutionSchema = z.object({
  category: z.enum(ISSUE_CATEGORIES),
  text: z.string().min(20).max(900),
})

export const PlanDaySchema = z.object({
  day: z.number().int().min(1).max(5),
  title: z.string().min(3).max(80),
  tasks: z.array(z.string().min(5).max(220)).min(1).max(4),
})

export const ScoresSchema = z.object({
  global: z.number().int().min(0).max(100),
  authority: z.number().int().min(0).max(100),
  technical: z.number().int().min(0).max(100).nullable(),
  content: z.number().int().min(0).max(100).nullable(),
})
export type ProspectScores = z.infer<typeof ScoresSchema>

export const AUDIT_DOCUMENT_VERSION = 1

export const AuditDocumentSchema = z.object({
  version: z.literal(AUDIT_DOCUMENT_VERSION),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  prospect: ProspectInputSchema,
  questions: z.array(ProspectQuestionSchema).length(QUESTION_INTENTS.length),
  answers: z.array(AnswerCellSchema),
  scores: ScoresSchema,
  site: z.object({
    /** Site propre analysé (pas un lien de plateforme). */
    analysed: z.boolean(),
    url: z.string().url().nullable(),
    pagesAnalysed: z.number().int().min(0),
  }),
  issues: z.array(ProspectIssueSchema),
  /** Acteurs les plus cités à la place du commerce, toutes réponses confondues. */
  citedInstead: z.array(z.object({ name: z.string(), answers: z.number().int().min(1) })).max(10),
  solutions: z.array(SolutionSchema),
  plan: z.array(PlanDaySchema).length(5),
})
export type AuditDocument = z.infer<typeof AuditDocumentSchema>
