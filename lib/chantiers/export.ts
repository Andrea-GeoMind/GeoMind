import type {
  chantierAnswers,
  chantierEstablishments,
  chantierFiles,
  chantiers,
} from '@/lib/db/schema'
import { chantierFields, establishmentFields, getField, type FieldDef, type FieldSection } from '@/lib/chantiers/fields'
import { computeCompleteness } from '@/lib/chantiers/completeness'
import { formatAnswer } from '@/lib/chantiers/format'
import { formatFileSize } from '@/lib/chantiers/files'
import { chantierDisplayState, formatChantierDateTime } from '@/lib/chantiers/status'

/**
 * Export Markdown d'un chantier : toutes les réponses, les accords et la
 * liste des fichiers, lisible tel quel et rangé dans le dossier de chantier.
 * Pur : le même état donne toujours le même fichier (à l'heure d'export près).
 */

export interface ExportInput {
  chantier: typeof chantiers.$inferSelect
  establishments: (typeof chantierEstablishments.$inferSelect)[]
  answers: (typeof chantierAnswers.$inferSelect)[]
  files: (typeof chantierFiles.$inferSelect)[]
  now: Date
}

const SECTION_TITLES: Record<FieldSection, string> = {
  access: 'Accès',
  info: 'Informations',
  files: 'Fichiers',
  decisions: 'Décisions',
}
const SECTIONS: readonly FieldSection[] = ['access', 'info', 'files', 'decisions']
const KIND_LABELS = { venue: 'lieu de réception', rental: 'loueur' } as const

/**
 * Texte venu d'une saisie (réponse, nom de fichier, nom d'établissement) :
 * rendu inerte en Markdown. Ni HTML (`<img onerror>`, `<script>`), ni image
 * distante (pixel de suivi chargé à l'ouverture), ni lien (`javascript:`),
 * ni titre ou tableau parasite. Audit du 07/10/2026.
 */
export function mdText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/([\\`*_{}\[\]()#+!|~])/g, '\\$1')
}

/** Une valeur sur plusieurs lignes reste lisible sous sa puce. */
function indent(text: string): string {
  return text.split('\n').join('\n  ')
}

/** Cellule de tableau : texte inerte, sur une seule ligne. */
function cell(text: string): string {
  return mdText(text).replace(/\n/g, ' ')
}

export function exportFileName(clientName: string, now: Date): string {
  const slug = clientName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  return `chantier-${slug || 'export'}-${parisDate(now)}.md`
}

/** Date du jour à Paris, AAAA-MM-JJ : un export fait à 1 h du matin porte la bonne date. */
function parisDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function buildChantierMarkdown(input: ExportInput): string {
  const { chantier, establishments, answers, files, now } = input
  const value = (estId: string | null, key: string) =>
    answers.find((a) => a.establishmentId === estId && a.fieldKey === key)?.value

  const completeness = computeCompleteness({
    chantierOptions: chantier.options,
    establishments: establishments.map((e) => ({ id: e.id, name: e.name, kind: e.kind, options: e.options })),
    answers,
    files,
  })
  const isBlocking = (estId: string | null, key: string) =>
    completeness.blocking.some((b) => b.establishmentId === estId && b.fieldKey === key)

  const lines: string[] = []
  const push = (...l: string[]) => lines.push(...l)

  push(
    `# Chantier ${mdText(chantier.clientName)}`,
    '',
    `- Exporté le ${formatChantierDateTime(now)}`,
    `- État : ${chantierDisplayState(chantier, now).label}`,
    `- Avancement : ${completeness.percent} % (${completeness.filledRequiredCount}/${completeness.requiredCount} champs obligatoires)`,
    chantier.submittedAt ? `- « J’ai terminé » le ${formatChantierDateTime(chantier.submittedAt)}` : '- « J’ai terminé » : pas encore',
    `- Établissements : ${establishments.map((e) => mdText(e.name)).join(', ')}`,
    ''
  )

  if (completeness.alerts.length > 0) {
    push('## Demandes d’aide', '')
    for (const a of completeness.alerts) push(`- ${a.label}${a.establishmentName ? ` (${mdText(a.establishmentName)})` : ''}`)
    push('')
  }

  if (completeness.blocking.length > 0) {
    push('## Bloquants restants', '')
    for (const b of completeness.blocking) push(`- ${b.label}${b.establishmentName ? ` (${mdText(b.establishmentName)})` : ''}`)
    push('')
  }

  const fieldLine = (field: FieldDef, estId: string | null, options = {}) => {
    if (field.type === 'file') {
      const own = files.filter((f) => f.fieldKey === field.key && f.establishmentId === estId && f.status === 'ready')
      return `- **${field.label}** : ${own.length ? own.map((f) => mdText(f.originalName)).join(', ') : 'aucun fichier'}`
    }
    const shown = formatAnswer(field, value(estId, field.key), options)
    const flag = isBlocking(estId, field.key) ? ' ⚠ bloquant' : ''
    return `- **${field.label}**${flag} : ${shown ? indent(mdText(shown)) : '_vide_'}`
  }

  const chantierLevel = chantierFields(chantier.options)
  if (chantierLevel.length > 0) {
    push('## Pour l’ensemble du chantier', '')
    for (const section of SECTIONS) {
      const own = chantierLevel.filter((f) => f.section === section)
      if (own.length === 0) continue
      push(`### ${SECTION_TITLES[section]}`, '', ...own.map((f) => fieldLine(f, null)), '')
    }
  }

  for (const e of establishments) {
    push(`## ${mdText(e.name)}`, '', `${KIND_LABELS[e.kind]}${e.website ? ` · ${mdText(e.website)}` : ''}`, '')
    const fields = establishmentFields(e.kind, e.options)
    for (const section of SECTIONS) {
      const own = fields.filter((f) => f.section === section)
      if (own.length === 0) continue
      push(`### ${SECTION_TITLES[section]}`, '', ...own.map((f) => fieldLine(f, e.id, e.options)), '')
    }
  }

  push('## Accords', '')
  const agreements = chantierLevel.filter((f) => f.type === 'agreement' || f.type === 'attestation')
  for (const f of agreements) {
    const shown = formatAnswer(f, value(null, f.key))
    push(`- **${f.label}** : ${shown ? mdText(shown) : '_pas encore donné_'}`)
  }
  push('')

  push('## Fichiers', '')
  const live = files.filter((f) => f.status !== 'deleted')
  if (live.length === 0) {
    push('_Aucun fichier conservé._', '')
  } else {
    const names = new Map(establishments.map((e) => [e.id, e.name]))
    push('| Fichier | Emplacement | Établissement | Taille | Déposé le | État |', '|---|---|---|---|---|---|')
    for (const f of live) {
      push(
        `| ${cell(f.originalName)} | ${cell(getField(f.fieldKey)?.label ?? f.fieldKey)} | ${cell(
          f.establishmentId ? names.get(f.establishmentId) ?? '' : 'chantier'
        )} | ${formatFileSize(f.sizeBytes)} | ${formatChantierDateTime(f.createdAt)} | ${
          f.status === 'ready' ? (f.expiresAt ? `suppression prévue le ${formatChantierDateTime(f.expiresAt)}` : 'conservé') : 'envoi en cours'
        } |`
      )
    }
    push('')
  }
  const gone = files.filter((f) => f.status === 'deleted')
  if (gone.length > 0) {
    push(`_${gone.length} fichier(s) supprimé(s) du stockage (purge, expiration, refus ou suppression par le client)._`, '')
  }

  return lines.join('\n')
}
