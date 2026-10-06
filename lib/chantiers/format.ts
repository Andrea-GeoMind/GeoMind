import type { ChantierEstablishmentOptions } from '@/lib/db/schema'
import { ADDRESS_OTHER, PROVIDER_CATEGORIES, type FieldDef } from '@/lib/chantiers/fields'
import { formatChantierDateTime } from '@/lib/chantiers/status'

/**
 * Mise en forme des réponses pour la vue GeoMind et l'export Markdown.
 * Pure et défensive : une valeur mal formée (catalogue modifié depuis) est
 * rendue telle quelle plutôt que de casser la page.
 *
 * Renvoie null quand il n'y a rien à montrer (« vide »).
 */

type Rec = Record<string, unknown>

const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const join = (parts: string[], sep = ' · ') => parts.filter(Boolean).join(sep)
const withComment = (main: string, comment: unknown) =>
  str(comment) ? `${main}\nCommentaire : ${str(comment)}` : main

function signatureLine(signature: unknown): string {
  if (!isRec(signature)) return ''
  const at = typeof signature.signedAt === 'string' ? new Date(signature.signedAt) : null
  const when = at && !Number.isNaN(at.getTime()) ? `le ${formatChantierDateTime(at)}` : ''
  return join(
    [when, str(signature.textVersion) && `texte ${str(signature.textVersion)}`, str(signature.ipTruncated) && `IP ${str(signature.ipTruncated)}`],
    ', '
  )
}

export function formatAnswer(
  field: FieldDef,
  value: unknown,
  establishmentOptions: ChantierEstablishmentOptions = {}
): string | null {
  if (value === undefined || value === null) return null

  switch (field.type) {
    case 'access':
      if (value === 'given') return 'C’est fait'
      if (value === field.alternative.value) return field.alternative.label
      return null

    case 'text':
      return str(value) || null

    case 'integer':
      return typeof value === 'number' ? join([value.toLocaleString('fr-FR'), field.unit ?? ''], ' ') : null

    case 'euros':
      return typeof value === 'number' ? `${value.toLocaleString('fr-FR')} €` : null

    case 'yesNoDetail': {
      if (!isRec(value)) return null
      const yn = value.value === true ? 'Oui' : value.value === false ? 'Non' : ''
      return join([yn, str(value.detail)], ' — ') || null
    }

    case 'list': {
      const items = arr(value).map(str).filter(Boolean)
      return items.length ? items.map((i) => `• ${i}`).join('\n') : null
    }

    case 'priceList': {
      const items = arr(value)
        .filter(isRec)
        .map((i) => join([str(i.label), str(i.price)], ' : '))
        .filter(Boolean)
      return items.length ? items.map((i) => `• ${i}`).join('\n') : null
    }

    case 'faq': {
      const items = arr(value)
        .filter(isRec)
        .filter((i) => str(i.question) || str(i.answer))
        .map((i) => `• ${str(i.question)}\n  ${str(i.answer)}`)
      return items.length ? items.join('\n') : null
    }

    case 'contact':
      return isRec(value) ? join([str(value.name), str(value.email), str(value.phone)]) || null : null

    case 'contacts': {
      const labels = new Map<string, string>(PROVIDER_CATEGORIES.map((c) => [c.id, c.label]))
      const items = arr(value)
        .filter(isRec)
        .map((i) => {
          const who = join([str(i.name), str(i.website), str(i.contact)])
          const cat = str(i.category) ? labels.get(str(i.category)) ?? str(i.category) : ''
          return who ? join([cat, who], ' — ') : ''
        })
        .filter(Boolean)
      return items.length ? items.map((i) => `• ${i}`).join('\n') : null
    }

    case 'reference':
      return isRec(value) ? join([str(value.date), str(value.title), str(value.url)]) || null : null

    case 'decision': {
      if (!isRec(value)) return null
      const option = field.options.find((o) => o.id === value.choice)
      if (!option) return str(value.comment) ? `Sans choix\nCommentaire : ${str(value.comment)}` : null
      return withComment(option.label, value.comment)
    }

    case 'address': {
      if (!isRec(value) || typeof value.choice !== 'string') {
        return isRec(value) && str(value.comment) ? `Sans choix\nCommentaire : ${str(value.comment)}` : null
      }
      const chosen =
        value.choice === ADDRESS_OTHER
          ? `Autre adresse : ${str(value.otherText) || '(non précisée)'}`
          : value.choice
      const proposed = establishmentOptions.addressOptions?.includes(value.choice) ?? false
      return withComment(
        value.choice === ADDRESS_OTHER || proposed ? chosen : `${chosen} (ne figure plus dans les propositions)`,
        value.comment
      )
    }

    case 'agreement': {
      if (!isRec(value)) return null
      let main: string
      if (value.choice === 'yes') {
        main = value.signature
          ? `Oui — accord donné par ${str(value.signerName)} ${signatureLine(value.signature)}`
          : `Oui, mais pas encore signé (nom manquant)`
      } else if (value.choice === 'no') {
        main = 'Non'
      } else {
        return str(value.comment) ? `Sans choix\nCommentaire : ${str(value.comment)}` : null
      }
      return withComment(main, value.comment)
    }

    case 'attestation':
      if (!isRec(value)) return null
      if (value.accepted === true && value.signature) return `Confirmé ${signatureLine(value.signature)}`
      return value.accepted === false ? 'Non confirmé (case décochée)' : null

    case 'file':
      return null
  }
}

// ─── Journal des accès ────────────────────────────────────────────────────────

export const ACCESS_EVENTS: Record<string, { label: string; ok: boolean }> = {
  link_issued: { label: 'Lien émis par GeoMind', ok: true },
  link_revoked: { label: 'Lien révoqué par GeoMind', ok: true },
  chantier_closed: { label: 'Chantier clos par GeoMind', ok: true },
  chantier_reopened: { label: 'Chantier rouvert par GeoMind', ok: true },
  link_opened: { label: 'Lien ouvert', ok: true },
  view: { label: 'Espace consulté', ok: true },
  upload: { label: 'Fichier déposé', ok: true },
  submit: { label: '« J’ai terminé »', ok: true },
  expired_token: { label: 'Refusé : lien expiré', ok: false },
  revoked_token: { label: 'Refusé : lien révoqué', ok: false },
  closed_token: { label: 'Refusé : chantier clos', ok: false },
  unknown_token: { label: 'Refusé : lien inconnu', ok: false },
  rate_limited: { label: 'Refusé : trop de requêtes', ok: false },
}

export function accessEvent(event: string): { label: string; ok: boolean } {
  return ACCESS_EVENTS[event] ?? { label: event, ok: true }
}
