import type { ChantierAssistantContext, ChantierAssistantGuide } from '@/lib/ai/prompts/chantier-assistant'
import { fillCopy } from '@/lib/chantiers/copy'
import {
  chantierFields,
  establishmentFields,
  getField,
  type EstablishmentKind,
  type FieldDef,
} from '@/lib/chantiers/fields'
import type { ChantierEstablishmentOptions, ChantierOptions } from '@/lib/db/schema'

/**
 * Assistant de l'espace client (« Besoin d'aide ? Demander à GEO »).
 * Partie pure : quelles étapes y ont droit, quelles questions partent au
 * modèle, ce qu'il reçoit, et le budget quotidien. La route
 * (app/chantier/assistant/route.ts) ne fait qu'appliquer ces règles.
 *
 * Objectif : chaque appel au modèle sert une vraie question, sans plafond qui
 * couperait une aide légitime. Les questions vides, trop courtes, répétées ou
 * déjà posées ne coûtent rien.
 */

export const ASSISTANT = {
  /** Mistral Small 3.2 via OpenRouter : le moins cher des modèles testés qui répond bien en français */
  model: 'mistralai/mistral-small-3.2-24b-instruct',
  minQuestionChars: 3,
  maxQuestionChars: 1_000,
  /**
   * Échanges précédents renvoyés au modèle. 2 échanges (4 messages) plus la
   * nouvelle question : 5 messages, sous la limite de 6.
   */
  historyExchanges: 2,
  /** ~300 mots en français ≈ 450 jetons ; marge pour finir la phrase */
  maxOutputTokens: 600,
  temperature: 0.3,
  timeoutMs: 45_000,
} as const

/** Conservation des échanges (questions et réponses) */
export const ASSISTANT_RETENTION_DAYS = 30

/**
 * Budget quotidien, tous chantiers confondus, en euros. OpenRouter facture en
 * dollars : on compte 1 $ = 1 €, ce qui surestime la dépense (le dollar vaut
 * moins que l'euro) et déclenche alerte et arrêt un peu plus tôt.
 */
export const ASSISTANT_BUDGET = {
  alertEur: 1,
  stopEur: 3,
} as const

/**
 * Chemin officiel de chaque outil, tiré de son aide officielle (relue le
 * 08/10/2026), avec son lien. Le modèle s'y tient : il n'ajoute ni ne renomme
 * aucune étape. [ADRESSE] est remplacée par l'adresse GeoMind du chantier.
 *
 * Noms d'interface : uniquement ceux d'une source officielle. Fiche Google :
 * rôle « Gestionnaire » (aide officielle : Owner / Manager ; la page
 * française, traduite par IA, dit « Administrateur »).
 */
export type OfficialGuide = ChantierAssistantGuide

export const OFFICIAL_GUIDES: Readonly<Record<string, OfficialGuide>> = {
  'access.gbp': {
    url: 'https://support.google.com/business/answer/3403100?hl=fr',
    steps: [
      'Sur un ordinateur, ouvrez business.google.com, connecté avec le compte Google qui gère la fiche.',
      'Menu « Plus », puis « Paramètres de la fiche ».',
      '« Personnes et accès ».',
      'Icône d’ajout d’utilisateur (en haut à gauche).',
      'Adresse e-mail : [ADRESSE].',
      'Rôle : « Gestionnaire ».',
      '« Inviter ».',
    ],
    note: 'Sur téléphone, les menus peuvent être différents : le plus simple est de passer par un ordinateur.',
  },
  'access.search_console': {
    url: 'https://support.google.com/webmasters/answer/7687615?hl=fr',
    steps: [
      'Ouvrez la propriété de votre site dans Search Console (search.google.com/search-console).',
      '« Paramètres », puis « Utilisateurs et autorisations ». Cette page n’apparaît que pour un propriétaire de la propriété.',
      '« Ajouter un utilisateur ».',
      'Adresse e-mail : [ADRESSE].',
      'Autorisation : « Total » (l’aide de Google l’appelle « Utilisateur avec accès complet »).',
      'Enregistrez (« Ajouter »).',
    ],
  },
  'access.analytics': {
    url: 'https://support.google.com/analytics/answer/9305788?hl=fr',
    steps: [
      'Dans Google Analytics (analytics.google.com), ouvrez « Administration ».',
      'Sous « Propriété », cliquez sur « Gestion des accès ».',
      'Cliquez sur « + », puis sur « Ajouter des utilisateurs ».',
      'Adresse e-mail : [ADRESSE].',
      'Cochez « Informer les nouveaux utilisateurs par e-mail ».',
      'Rôle : « Lecteur ».',
      '« Ajouter ».',
    ],
  },
  'access.wordpress': {
    url: 'https://wordpress.org/documentation/article/users-add-new-screen/',
    steps: [
      'Dans l’administration de votre site WordPress, menu « Comptes » (« Users » en anglais), puis « Ajouter » (« Add New User »).',
      'Identifiant : geomind.',
      'E-mail : [ADRESSE].',
      'Laissez le mot de passe proposé par WordPress : vous n’avez pas à nous le transmettre.',
      'Cochez la case qui envoie un e-mail au nouveau compte : c’est notre invitation.',
      'Rôle : « Administrateur ».',
      'Bouton d’ajout du compte (« Add New User » en anglais).',
    ],
    note: 'La documentation officielle de WordPress est en anglais : selon la version et la langue du site, les noms peuvent différer un peu.',
  },
}

const KIND_FOR_PROMPT: Record<EstablishmentKind, string> = {
  venue: 'un lieu de réception de mariages',
  rental: 'un loueur de matériel de réception',
}

/**
 * Étapes qui ont le bouton : toutes celles qui ont une aide, sauf les données
 * personnelles (liste des mariés) — on n'invite pas le client à coller des
 * noms de mariés dans une conversation avec un modèle.
 */
export function hasAssistant(field: FieldDef): boolean {
  if (!field.help) return false
  return !(field.type === 'file' && field.category === 'personal_data')
}

export interface AssistantEstablishment {
  id: string
  kind: EstablishmentKind
  options: ChantierEstablishmentOptions
}

export type AssistantTarget =
  | { ok: true; field: FieldDef; establishment: AssistantEstablishment | null }
  | { ok: false }

/**
 * L'étape existe-t-elle dans CE chantier, à cet endroit ? Même règle que
 * l'enregistrement d'un champ : un établissement d'un autre chantier, une
 * étape absente du catalogue ou non activée sont refusés.
 */
export function resolveAssistantTarget(input: {
  chantierOptions: ChantierOptions
  establishments: readonly AssistantEstablishment[]
  establishmentId: string | null
  fieldKey: string
}): AssistantTarget {
  const { establishmentId, fieldKey } = input
  if (establishmentId === null) {
    const field = chantierFields(input.chantierOptions).find((f) => f.key === fieldKey)
    return field && hasAssistant(field) ? { ok: true, field, establishment: null } : { ok: false }
  }
  const establishment = input.establishments.find((e) => e.id === establishmentId)
  if (!establishment) return { ok: false }
  const field = establishmentFields(establishment.kind, establishment.options).find((f) => f.key === fieldKey)
  return field && hasAssistant(field) ? { ok: true, field, establishment } : { ok: false }
}

/** Clé du cache et du contrôle « même question » : casse, espaces, ponctuation finale. */
export function questionKey(question: string): string {
  return question
    .normalize('NFKC')
    .toLocaleLowerCase('fr')
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/[\s?!.…,;:]+$/u, '')
    .trim()
}

export type QuestionVerdict =
  | { ok: true; question: string; key: string }
  | { ok: false; reason: 'too_short' | 'too_long' | 'repeat' }

/** Rejets qui ne coûtent rien : vide, trop court, trop long, identique au précédent. */
export function checkQuestion(raw: string, previousQuestion: string | null): QuestionVerdict {
  const question = raw.trim()
  const key = questionKey(question)
  if (key.length < ASSISTANT.minQuestionChars) return { ok: false, reason: 'too_short' }
  if (question.length > ASSISTANT.maxQuestionChars) return { ok: false, reason: 'too_long' }
  if (previousQuestion !== null && questionKey(previousQuestion) === key) return { ok: false, reason: 'repeat' }
  return { ok: true, question, key }
}

export const QUESTION_ERRORS: Record<'too_short' | 'too_long' | 'repeat' | 'invalid', string> = {
  too_short: 'Écrivez votre question en quelques mots.',
  too_long: `Votre message dépasse ${ASSISTANT.maxQuestionChars.toLocaleString('fr-FR')} caractères : raccourcissez-le.`,
  repeat: 'Vous venez de poser cette question : la réponse est juste au-dessus.',
  invalid: 'Cette étape n’a pas d’assistant.',
}

/**
 * Le client n'a pas l'outil : on ne lui demande jamais de le créer. Il coche
 * la case prévue, et GeoMind s'en occupe. Null : l'étape n'est pas un outil.
 */
export function noToolAdviceFor(field: FieldDef): string | null {
  if (field.type !== 'access') return null
  if (field.alternative.alert || field.alternative.value === 'absent') {
    return `cochez « ${field.alternative.label} » juste sous cette étape : nous nous en occupons.`
  }
  return null
}

/** Conduite à tenir quand le client bloque, selon l'étape. */
export function stuckAdviceFor(field: FieldDef, geomindAddress: string): string {
  if (field.type === 'access') {
    if (field.alternative.alert) {
      return `cochez « ${field.alternative.label} » juste sous cette étape : nous sommes prévenus et nous vous aidons.`
    }
    if (/je ne sais pas/i.test(field.alternative.label) && field.key !== 'access.hosting') {
      return `cochez « ${field.alternative.label} » juste sous cette étape : nous nous en occupons.`
    }
  }
  return `passez à la suite et écrivez-nous à ${geomindAddress} : nous vous aiderons.`
}

/** Réponse quand le budget du jour est épuisé (3 € tous chantiers confondus). */
export function unavailableMessage(field: FieldDef, geomindAddress: string): string {
  if (field.type === 'access' && field.alternative.alert) {
    return `L’assistant n’est plus disponible aujourd’hui : cochez « ${field.alternative.label} », nous vous aidons.`
  }
  return `L’assistant n’est plus disponible aujourd’hui : ${stuckAdviceFor(field, geomindAddress)}`
}

function guideFor(fieldKey: string, geomindAddress: string): OfficialGuide | null {
  const guide = OFFICIAL_GUIDES[fieldKey]
  if (!guide) return null
  return { ...guide, steps: guide.steps.map((step) => fillCopy(step, { '[ADRESSE]': geomindAddress })) }
}

export function buildAssistantContext(
  field: FieldDef,
  kind: EstablishmentKind | null,
  geomindAddress: string
): ChantierAssistantContext {
  return {
    fieldLabel: field.label,
    fieldHelp: fillCopy(field.help ?? '', { '[ADRESSE]': geomindAddress }),
    establishmentKind: kind ? KIND_FOR_PROMPT[kind] : 'un lieu de réception de mariages ou un loueur de matériel de réception',
    geomindAddress,
    officialGuide: guideFor(field.key, geomindAddress),
    noToolAdvice: noToolAdviceFor(field),
    stuckAdvice: stuckAdviceFor(field, geomindAddress),
  }
}

export interface PastExchange {
  question: string
  answer: string
}

export type ModelMessage = { role: 'system' | 'user' | 'assistant'; content: string }

/**
 * Messages envoyés au modèle : le prompt système, les derniers échanges de
 * cette étape (du plus ancien au plus récent), la nouvelle question.
 */
export function buildModelMessages(system: string, history: readonly PastExchange[], question: string): ModelMessage[] {
  const recent = history.slice(-ASSISTANT.historyExchanges)
  return [
    { role: 'system', content: system },
    ...recent.flatMap((e): ModelMessage[] => [
      { role: 'user', content: e.question },
      { role: 'assistant', content: e.answer },
    ]),
    { role: 'user', content: question },
  ]
}

export type BudgetState = 'ok' | 'stopped'

export function budgetState(spentUsdToday: number): BudgetState {
  return spentUsdToday >= ASSISTANT_BUDGET.stopEur ? 'stopped' : 'ok'
}

/** Seuil franchi par cet échange (alerte à 1 €, arrêt à 3 €), pour n'alerter qu'une fois. */
export function crossedThreshold(before: number, after: number): 'alert' | 'stop' | null {
  if (before < ASSISTANT_BUDGET.stopEur && after >= ASSISTANT_BUDGET.stopEur) return 'stop'
  if (before < ASSISTANT_BUDGET.alertEur && after >= ASSISTANT_BUDGET.alertEur) return 'alert'
  return null
}

/** Minuit à Paris du jour de `now` : début de la journée budgétaire. */
export function parisDayStart(now: Date): Date {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(now)
  const [y, m, d] = day.split('-').map(Number) as [number, number, number]
  const utcMidnight = Date.UTC(y, m - 1, d)
  // Paris est à UTC+1 ou UTC+2 : minuit à Paris tombe 1 ou 2 h avant minuit UTC
  for (const offsetHours of [2, 1]) {
    const candidate = new Date(utcMidnight - offsetHours * 3_600_000)
    const time = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(candidate)
    const sameDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(candidate) === day
    if (sameDay && time === '00:00') return candidate
  }
  return new Date(utcMidnight)
}

/** Coût d'un appel d'après les jetons, si OpenRouter ne renvoie pas `usage.cost`. */
export function estimateCostUsd(tokensIn: number, tokensOut: number): number {
  // Mistral Small 3.2 : 0,094 $ / M en entrée, 0,25 $ / M en sortie (octobre 2026), arrondi au-dessus
  return (tokensIn * 0.1 + tokensOut * 0.3) / 1_000_000
}

/** Vue d'un échange côté client (aucun coût, aucun modèle). */
export interface AssistantExchangeView {
  id: string
  question: string
  answer: string
}

/** Seuls domaines dont l'assistant peut afficher un lien cliquable : l'aide et les outils officiels. */
const LINK_HOSTS = new Set([
  'support.google.com',
  'wordpress.org',
  'business.google.com',
  'search.google.com',
  'analytics.google.com',
])

function allowedLink(raw: string): string | null {
  try {
    const url = new URL(raw)
    return url.protocol === 'https:' && LINK_HOSTS.has(url.hostname) ? url.toString() : null
  } catch {
    return null
  }
}

/**
 * Réponse prête à afficher : les liens vers l'aide et les outils officiels
 * (Google, WordPress) deviennent cliquables, tous les autres restent du texte. Un
 * modèle détourné ne peut donc pas glisser un lien de hameçonnage cliquable.
 */
export function prepareAnswerForDisplay(answer: string): string {
  return answer.replace(
    /\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)|(https?:\/\/[^\s<>()[\]]+)/g,
    (match: string, text: string | undefined, mdUrl: string | undefined, bare: string | undefined) => {
      if (mdUrl !== undefined) {
        const ok = allowedLink(mdUrl)
        return ok ? `[${text}](${ok})` : `${text}`
      }
      const trimmed = (bare ?? match).replace(/[.,;:!?»”'"]+$/u, '')
      const tail = (bare ?? match).slice(trimmed.length)
      const ok = allowedLink(trimmed)
      return ok ? `[${trimmed}](${ok})${tail}` : match
    }
  )
}

export interface AssistantQuestionGroup<T> {
  establishmentId: string | null
  fieldKey: string
  /** Nom de l'étape (la clé si elle a disparu du catalogue) */
  label: string
  establishmentName: string | null
  exchanges: T[]
}

/**
 * Questions regroupées par étape et par établissement, dans l'ordre de la
 * première question (vue GeoMind, e-mail groupé).
 */
export function groupAssistantQuestions<T extends { establishmentId: string | null; fieldKey: string }>(
  exchanges: readonly T[],
  establishmentNames: ReadonlyMap<string, string>
): AssistantQuestionGroup<T>[] {
  const groups = new Map<string, AssistantQuestionGroup<T>>()
  for (const e of exchanges) {
    const key = `${e.establishmentId ?? '-'}|${e.fieldKey}`
    let group = groups.get(key)
    if (!group) {
      group = {
        establishmentId: e.establishmentId,
        fieldKey: e.fieldKey,
        label: getField(e.fieldKey)?.label ?? e.fieldKey,
        establishmentName: e.establishmentId ? (establishmentNames.get(e.establishmentId) ?? null) : null,
        exchanges: [],
      }
      groups.set(key, group)
    }
    group.exchanges.push(e)
  }
  return [...groups.values()]
}
