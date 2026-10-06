import type {
  chantierAnswerRevisions,
  chantierAnswers,
  chantierEstablishments,
  chantierFiles,
  chantiers,
} from '@/lib/db/schema'
import { computeCompleteness } from '@/lib/chantiers/completeness'
import { getField } from '@/lib/chantiers/fields'
import { formatAnswer } from '@/lib/chantiers/format'
import { formatChantierDate, formatChantierDateTime } from '@/lib/chantiers/status'

/**
 * E-mails d'alerte envoyés à GeoMind (jamais au client).
 *
 * Règles, vérifiées par tests/unit/chantiers/notifications.test.ts :
 *   - les noms des champs et des fichiers, jamais les valeurs saisies ;
 *   - rien de la liste des mariés, pas même son nom de fichier ;
 *   - jamais le lien du client, seulement l'adresse de la vue GeoMind ;
 *   - texte simple : une version texte, et une version HTML minimale.
 */

export interface EmailContent {
  subject: string
  text: string
  html: string
}

type Chantier = typeof chantiers.$inferSelect
type Establishment = typeof chantierEstablishments.$inferSelect
type Answer = typeof chantierAnswers.$inferSelect
type Revision = typeof chantierAnswerRevisions.$inferSelect
type FileRow = typeof chantierFiles.$inferSelect

export interface DigestInput {
  chantier: Chantier
  establishments: Establishment[]
  /** Toutes les réponses actuelles (demandes d'aide, accords) */
  answers: Answer[]
  /** Toutes les lignes de fichiers du chantier (avancement) */
  files: FileRow[]
  /** Révisions du client dont la dernière saisie tombe dans la fenêtre */
  revisions: Revision[]
  /** Fenêtre de l'e-mail : (since, until] */
  since: Date | null
  until: Date
  dashboardUrl: string
}

const inWindow = (date: Date | null | undefined, since: Date | null, until: Date) =>
  !!date && date.getTime() <= until.getTime() && (!since || date.getTime() > since.getTime())

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** HTML minimal : le texte tel quel, liens cliquables, aucune mise en page. */
function toHtml(text: string): string {
  const body = escapeHtml(text)
    .replace(/(https:\/\/[^\s<]+)/g, '<a href="$1">$1</a>')
    .split('\n')
    .join('<br>\n')
  return `<div style="font-family: sans-serif; font-size: 14px; line-height: 1.5;">${body}</div>`
}

const FOOTER =
  'Alerte automatique GeoMind. Les valeurs saisies ne figurent jamais dans ces e-mails : consultez-les dans le tableau de bord.'

function section(title: string, lines: string[]): string[] {
  return lines.length === 0 ? [] : ['', `${title} (${lines.length})`, ...lines.map((l) => `- ${l}`)]
}

/**
 * E-mail groupé d'une vague d'activité. Renvoie null s'il n'y a rien de neuf
 * (une vague déclenchée par une saisie aussitôt annulée, par exemple).
 */
export function buildActivityDigest(input: DigestInput): EmailContent | null {
  const { chantier, establishments, answers, files, revisions, since, until } = input
  const names = new Map(establishments.map((e) => [e.id, e.name]))
  const options = new Map(establishments.map((e) => [e.id, e.options]))
  const where = (estId: string | null) => (estId ? ` — ${names.get(estId) ?? ''}` : '')

  const submitted = inWindow(chantier.submittedAt, since, until)

  const completeness = computeCompleteness({
    chantierOptions: chantier.options,
    establishments: establishments.map((e) => ({ id: e.id, name: e.name, kind: e.kind, options: e.options })),
    answers,
    files,
  })
  const help = completeness.alerts.map((a) => `${a.label}${where(a.establishmentId)}`)

  // Champs : une ligne par champ, « rempli » s'il était vide avant la vague
  const bySlot = new Map<string, Revision[]>()
  for (const r of revisions) {
    if (r.actor !== 'client' || !inWindow(r.updatedAt, since, until)) continue
    const field = getField(r.fieldKey)
    if (!field || field.type === 'agreement' || field.type === 'attestation') continue
    const key = `${r.establishmentId ?? '-'}|${r.fieldKey}`
    bySlot.set(key, [...(bySlot.get(key) ?? []), r])
  }
  const filled: string[] = []
  const changed: string[] = []
  for (const list of bySlot.values()) {
    const first = list.reduce((a, b) => (a.createdAt <= b.createdAt ? a : b))
    const field = getField(first.fieldKey)!
    const wasEmpty = formatAnswer(field, first.oldValue, options.get(first.establishmentId ?? '') ?? {}) === null
    ;(wasEmpty ? filled : changed).push(`${field.label}${where(first.establishmentId)}`)
  }

  // Fichiers reçus : nom affiché, sauf les données personnelles
  const received = files
    .filter((f) => f.status === 'ready' && inWindow(f.createdAt, since, until))
    .map((f) => {
      const label = getField(f.fieldKey)?.label ?? f.fieldKey
      return f.category === 'personal_data'
        ? `${label} : fichier reçu (données personnelles, conservé 30 jours)`
        : `${f.originalName} — ${label}${where(f.establishmentId)}`
    })

  // Accords signés pendant la vague : le nom de l'accord, pas le signataire
  const signed = answers
    .filter((a) => {
      const field = getField(a.fieldKey)
      if (!field || (field.type !== 'agreement' && field.type !== 'attestation')) return false
      const value = a.value as { signature?: { signedAt?: string } | null } | null
      const at = value?.signature?.signedAt ? new Date(value.signature.signedAt) : null
      return inWindow(at, since, until)
    })
    .map((a) => getField(a.fieldKey)!.label)

  const subjectParts = [
    submitted && '« J’ai terminé »',
    help.length > 0 && plural(help.length, 'demande d’aide', 'demandes d’aide'),
    filled.length > 0 && plural(filled.length, 'champ rempli', 'champs remplis'),
    changed.length > 0 && plural(changed.length, 'champ modifié', 'champs modifiés'),
    received.length > 0 && plural(received.length, 'fichier reçu', 'fichiers reçus'),
    signed.length > 0 && plural(signed.length, 'accord signé', 'accords signés'),
  ].filter((p): p is string => typeof p === 'string')

  const hasNews = submitted || filled.length + changed.length + received.length + signed.length > 0
  if (!hasNews) return null

  const lines = [
    `Chantier ${chantier.clientName} : activité ${
      since ? `du ${formatChantierDateTime(since)} au ${formatChantierDateTime(until)}` : `jusqu’au ${formatChantierDateTime(until)}`
    }.`,
    ...(submitted && chantier.submittedAt
      ? ['', `Le client a cliqué sur « J’ai terminé » le ${formatChantierDateTime(chantier.submittedAt)}.`]
      : []),
    ...section('Demandes d’aide en attente', help),
    ...section('Champs remplis', filled),
    ...section('Champs modifiés', changed),
    ...section('Fichiers reçus', received),
    ...section('Accords signés', signed),
    '',
    `Avancement : ${completeness.percent} %, ${plural(completeness.blocking.length, 'élément bloquant', 'éléments bloquants')}.`,
    '',
    `Voir le chantier : ${input.dashboardUrl}`,
    '',
    '--',
    FOOTER,
  ]
  const text = lines.join('\n')
  return { subject: `[${chantier.clientName}] ${subjectParts.join(', ')}`, text, html: toHtml(text) }
}

export const EXPIRY_REMINDER_DAYS = 7

/** Alerte « le lien expire bientôt » quand le client n'a pas terminé. */
export function buildExpiryReminder(input: {
  chantier: Chantier
  establishments: Establishment[]
  answers: Answer[]
  files: FileRow[]
  now: Date
  dashboardUrl: string
}): EmailContent | null {
  const { chantier, now } = input
  if (!chantier.tokenExpiresAt || chantier.submittedAt) return null

  const days = Math.max(0, Math.ceil((chantier.tokenExpiresAt.getTime() - now.getTime()) / 86_400_000))
  const completeness = computeCompleteness({
    chantierOptions: chantier.options,
    establishments: input.establishments.map((e) => ({ id: e.id, name: e.name, kind: e.kind, options: e.options })),
    answers: input.answers,
    files: input.files,
  })

  const text = [
    `Le lien de l’espace client du chantier ${chantier.clientName} expire le ${formatChantierDate(chantier.tokenExpiresAt)} (dans ${plural(days, 'jour', 'jours')}).`,
    'Le client n’a pas encore cliqué sur « J’ai terminé ».',
    '',
    `Avancement : ${completeness.percent} %, ${plural(completeness.blocking.length, 'élément bloquant', 'éléments bloquants')}${
      completeness.alerts.length > 0 ? `, ${plural(completeness.alerts.length, 'demande d’aide', 'demandes d’aide')} en attente` : ''
    }.`,
    '',
    'Pour lui laisser plus de temps, régénérez le lien depuis le tableau de bord puis envoyez-lui le nouveau : l’ancien cessera de fonctionner, ses réponses restent.',
    '',
    `Voir le chantier : ${input.dashboardUrl}`,
    '',
    '--',
    FOOTER,
  ].join('\n')

  return {
    subject: `[${chantier.clientName}] Le lien expire dans ${plural(days, 'jour', 'jours')}, chantier non terminé`,
    text,
    html: toHtml(text),
  }
}
