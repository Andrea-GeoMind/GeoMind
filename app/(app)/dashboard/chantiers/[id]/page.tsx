import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertTriangle, ArrowLeft, Ban, LifeBuoy, Lock, LockKeyhole, PenLine } from 'lucide-react'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin'
import { loadChantierDetail, type ChantierDetail } from '@/lib/db/queries/chantiers'
import { computeCompleteness } from '@/lib/chantiers/completeness'
import {
  chantierFields,
  establishmentFields,
  getField,
  type FieldDef,
  type FieldSection,
} from '@/lib/chantiers/fields'
import { accessEvent, formatAnswer } from '@/lib/chantiers/format'
import { CHANTIER_QUOTA_BYTES, formatFileSize, usedBytes } from '@/lib/chantiers/files'
import { chantierDisplayState, formatChantierDate, formatChantierDateTime } from '@/lib/chantiers/status'
import { cn } from '@/lib/utils'
import ConfirmActionButton from '@/components/features/chantiers/confirm-action-button'
import ExportButton from '@/components/features/chantiers/export-button'
import FileDownloadButton from '@/components/features/chantiers/file-download-button'
import LinkIssuer from '@/components/features/chantiers/link-issuer'
import PurgeFilesButton from '@/components/features/chantiers/purge-files-button'
import { closeChantierAction, revokeChantierLinkAction } from '@/app/(app)/dashboard/chantiers/actions'

export const metadata: Metadata = {
  title: 'Chantier',
  robots: { index: false, follow: false },
}

const SECTIONS: { id: FieldSection; title: string }[] = [
  { id: 'access', title: 'Accès' },
  { id: 'info', title: 'Informations' },
  { id: 'files', title: 'Fichiers' },
  { id: 'decisions', title: 'Décisions' },
]

const DELETED_REASON: Record<string, string> = {
  client: 'supprimé par le client',
  replaced: 'remplacé',
  purge: 'purgé',
  expired: 'expiré',
  rejected: 'refusé (contenu non conforme)',
  abandoned: 'dépôt abandonné',
  missing: 'jamais reçu',
}

type Revision = ChantierDetail['revisions'][number]

/**
 * Vue GeoMind d'un chantier, en lecture seule : GeoMind ne modifie jamais les
 * réponses du client ici. Seules actions : lien (émettre, régénérer, révoquer),
 * clôture, téléchargement et purge des fichiers, export Markdown.
 */
export default async function ChantierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  const { id } = await params
  if (!z.uuid().safeParse(id).success) notFound()

  const detail = await loadChantierDetail(admin.id, id)
  if (!detail) notFound()

  const { chantier, establishments, answers, revisions, files, accessLogs } = detail
  const now = new Date()
  const state = chantierDisplayState(chantier, now)
  const completeness = computeCompleteness({
    chantierOptions: chantier.options,
    establishments: establishments.map((e) => ({ id: e.id, name: e.name, kind: e.kind, options: e.options })),
    answers,
    files,
  })
  const names = new Map(establishments.map((e) => [e.id, e.name]))
  const live = files.filter((f) => f.status !== 'deleted')
  const hasActiveLink = !!chantier.tokenHash && !chantier.tokenRevokedAt && chantier.status !== 'closed'
  const chantierLevel = chantierFields(chantier.options)
  const agreements = chantierLevel.filter((f) => f.type === 'agreement' || f.type === 'attestation')

  const answerOf = (estId: string | null, key: string) =>
    answers.find((a) => a.establishmentId === estId && a.fieldKey === key)
  const revisionsOf = (estId: string | null, key: string) =>
    revisions.filter((r) => r.establishmentId === estId && r.fieldKey === key)
  const isBlocking = (estId: string | null, key: string) =>
    completeness.blocking.some((b) => b.establishmentId === estId && b.fieldKey === key)

  const fieldRow = (field: FieldDef, estId: string | null, options = {}) => {
    if (field.type === 'file') {
      const own = files.filter((f) => f.fieldKey === field.key && f.establishmentId === estId && f.status === 'ready')
      return (
        <FieldRow key={field.key} label={field.label} blocking={false} empty={own.length === 0}>
          {own.length === 0 ? 'vide' : own.map((f) => f.originalName).join(', ')}
        </FieldRow>
      )
    }
    const answer = answerOf(estId, field.key)
    const shown = formatAnswer(field, answer?.value, options)
    return (
      <FieldRow
        key={field.key}
        label={field.label}
        blocking={isBlocking(estId, field.key)}
        empty={!shown}
        updatedAt={answer?.updatedAt}
        history={revisionsOf(estId, field.key)}
        field={field}
        options={options}
      >
        {shown ?? 'vide'}
      </FieldRow>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 sm:p-8">
      <div>
        <Link
          href="/dashboard/chantiers"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Chantiers
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight">{chantier.clientName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{establishments.map((e) => e.name).join(' · ')}</p>
            <p className="mt-1 text-sm">
              {completeness.percent} % rempli · {completeness.filledRequiredCount}/{completeness.requiredCount}{' '}
              champs obligatoires
              {chantier.submittedAt && ` · « J’ai terminé » le ${formatChantierDateTime(chantier.submittedAt)}`}
            </p>
          </div>
          <ExportButton chantierId={chantier.id} />
        </div>
      </div>

      {completeness.alerts.length > 0 && (
        <section className="rounded-2xl border border-rose-300 bg-rose-50 p-5 dark:border-rose-500/40 dark:bg-rose-500/10">
          <h2 className="flex items-center gap-2 font-bold text-rose-900 dark:text-rose-100">
            <LifeBuoy className="h-4 w-4" />
            Demandes d’aide ({completeness.alerts.length})
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-rose-900 dark:text-rose-100">
            {completeness.alerts.map((a) => (
              <li key={`${a.establishmentId}|${a.fieldKey}`}>
                {a.label}
                {a.establishmentName && <span className="text-rose-700 dark:text-rose-300"> · {a.establishmentName}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3 rounded-2xl border bg-card p-5">
        <h2 className="flex items-center gap-2 font-bold">
          <LockKeyhole className="h-4 w-4" />
          Lien du client
        </h2>
        <p className="text-sm text-muted-foreground">
          {state.label}
          {chantier.tokenRevokedAt && ` · révoqué le ${formatChantierDateTime(chantier.tokenRevokedAt)}`}. Le lien
          n’est affiché qu’une fois, à l’émission.
        </p>
        <div className="flex flex-wrap items-start gap-2">
          {chantier.status !== 'closed' && (
            <LinkIssuer chantierId={chantier.id} regenerate={chantier.status !== 'draft'} />
          )}
          {hasActiveLink && (
            <ConfirmActionButton
              label="Révoquer le lien"
              icon={<Ban />}
              title="Révoquer le lien ?"
              description="Le client ne pourra plus ouvrir son espace : il verra « Lien désactivé ». Ses réponses et ses fichiers sont conservés. Vous pourrez émettre un nouveau lien ensuite."
              confirmLabel="Révoquer"
              action={revokeChantierLinkAction.bind(null, chantier.id)}
            />
          )}
          {chantier.status !== 'closed' && (
            <ConfirmActionButton
              label="Fermer le chantier"
              icon={<Lock />}
              title="Fermer le chantier ?"
              description="L’espace du client se ferme (« Espace fermé ») et aucun lien ne pourra plus être émis. Les réponses et les fichiers restent consultables ici. Cette action ne s’annule pas depuis cette page."
              confirmLabel="Fermer le chantier"
              action={closeChantierAction.bind(null, chantier.id)}
            />
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="flex items-center gap-2 font-bold">
            <PenLine className="h-4 w-4" />
            Accords
          </h2>
          <dl className="mt-3 space-y-3 text-sm">
            {agreements.map((f) => (
              <div key={f.key}>
                <dt className="font-medium">{f.label}</dt>
                <dd className="whitespace-pre-line text-muted-foreground">
                  {formatAnswer(f, answerOf(null, f.key)?.value) ?? 'pas encore donné'}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="flex items-center gap-2 font-bold">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Bloquants ({completeness.blocking.length})
          </h2>
          {completeness.blocking.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Rien ne bloque le démarrage.</p>
          ) : (
            <ul className="mt-3 space-y-1 text-sm">
              {completeness.blocking.map((b) => (
                <li key={`${b.establishmentId}|${b.fieldKey}`}>
                  {b.label}
                  {b.establishmentName && <span className="text-muted-foreground"> · {b.establishmentName}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">Réponses</h2>

        {chantierLevel.length > 0 && (
          <Block title="Pour l’ensemble du chantier">
            {SECTIONS.map((s) => {
              const own = chantierLevel.filter((f) => f.section === s.id)
              return own.length > 0 && <SectionRows key={s.id} title={s.title}>{own.map((f) => fieldRow(f, null))}</SectionRows>
            })}
          </Block>
        )}

        {establishments.map((e) => {
          const fields = establishmentFields(e.kind, e.options)
          return (
            <Block
              key={e.id}
              title={e.name}
              subtitle={`${e.kind === 'venue' ? 'Lieu de réception' : 'Loueur'}${e.website ? ` · ${e.website}` : ''}`}
            >
              {SECTIONS.map((s) => {
                const own = fields.filter((f) => f.section === s.id)
                return (
                  own.length > 0 && (
                    <SectionRows key={s.id} title={s.title}>
                      {own.map((f) => fieldRow(f, e.id, e.options))}
                    </SectionRows>
                  )
                )
              })}
            </Block>
          )
        })}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Fichiers</h2>
            <p className="text-sm text-muted-foreground">
              {live.filter((f) => f.status === 'ready').length} fichier(s) · {formatFileSize(usedBytes(live))} utilisés sur{' '}
              {formatFileSize(CHANTIER_QUOTA_BYTES)}
            </p>
          </div>
          <PurgeFilesButton chantierId={chantier.id} fileCount={live.length} totalBytes={usedBytes(live)} />
        </div>
        {files.length === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Aucun fichier déposé.
          </p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {files.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0 space-y-0.5">
                  <p
                    className={cn(
                      'truncate text-sm',
                      f.status === 'deleted' ? 'text-muted-foreground line-through' : 'font-medium'
                    )}
                  >
                    {f.originalName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getField(f.fieldKey)?.label ?? f.fieldKey}
                    {f.establishmentId && ` · ${names.get(f.establishmentId) ?? ''}`} · {formatFileSize(f.sizeBytes)} ·{' '}
                    {f.mimeType} · déposé le {formatChantierDateTime(f.createdAt)}
                  </p>
                  {f.category === 'personal_data' && f.status !== 'deleted' && f.expiresAt && (
                    <p className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300">
                      <Lock className="h-3 w-3" />
                      Données personnelles, supprimé automatiquement le {formatChantierDate(f.expiresAt)}
                    </p>
                  )}
                  {f.status === 'deleted' && (
                    <p className="text-xs text-muted-foreground">
                      {DELETED_REASON[f.deletedReason ?? ''] ?? 'supprimé'}
                      {f.deletedAt && ` le ${formatChantierDateTime(f.deletedAt)}`}
                    </p>
                  )}
                  {f.status === 'pending' && <p className="text-xs text-muted-foreground">envoi en cours ou interrompu</p>}
                </div>
                {f.status === 'ready' && <FileDownloadButton fileId={f.id} />}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Journal des accès</h2>
        {accessLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun accès enregistré.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">IP tronquée</th>
                  <th className="px-4 py-2 font-medium">Résultat</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {accessLogs.map((l) => {
                  const ev = accessEvent(l.event)
                  return (
                    <tr key={l.id}>
                      <td className="whitespace-nowrap px-4 py-2">{formatChantierDateTime(l.createdAt)}</td>
                      <td className="whitespace-nowrap px-4 py-2 font-mono text-xs">{l.ipTruncated}</td>
                      <td className={cn('px-4 py-2', ev.ok ? '' : 'text-destructive')}>{ev.label}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {accessLogs.length >= 300 && (
          <p className="text-xs text-muted-foreground">Les 300 derniers accès sont affichés.</p>
        )}
      </section>
    </div>
  )
}

function Block({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card">
      <div className="border-b px-5 py-3">
        <h3 className="font-bold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="divide-y">{children}</div>
    </div>
  )
}

function SectionRows({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-3">
      <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      <dl className="divide-y divide-border/60">{children}</dl>
    </div>
  )
}

function FieldRow({
  label,
  blocking,
  empty,
  updatedAt,
  history = [],
  field,
  options,
  children,
}: {
  label: string
  blocking: boolean
  empty: boolean
  updatedAt?: Date
  history?: Revision[]
  field?: FieldDef
  options?: object
  children: React.ReactNode
}) {
  return (
    <div className={cn('grid gap-1 py-2.5 sm:grid-cols-[14rem_1fr] sm:gap-4', blocking && '-mx-2 rounded-lg bg-amber-50 px-2 dark:bg-amber-500/10')}>
      <dt className="text-sm font-medium">
        {label}
        {blocking && (
          <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-amber-200 px-1.5 text-[11px] font-semibold text-amber-950">
            bloquant
          </span>
        )}
      </dt>
      <dd className="min-w-0 space-y-1 text-sm">
        <p className={cn('whitespace-pre-line break-words', empty && 'italic text-muted-foreground')}>{children}</p>
        {updatedAt && <p className="text-xs text-muted-foreground">modifié le {formatChantierDateTime(updatedAt)}</p>}
        {history.length > 0 && field && (
          <details className="text-xs">
            <summary className="cursor-pointer text-primary">Historique ({history.length})</summary>
            <ol className="mt-1 space-y-1.5 border-l pl-3">
              {history.map((r) => (
                <li key={r.id}>
                  <span className="text-muted-foreground">
                    {formatChantierDateTime(r.updatedAt)} · {r.actor === 'client' ? 'client' : 'GeoMind'}
                  </span>
                  <span className="block whitespace-pre-line">
                    {formatAnswer(field, r.oldValue, options) ?? 'vide'} → {formatAnswer(field, r.newValue, options) ?? 'vide'}
                  </span>
                </li>
              ))}
            </ol>
          </details>
        )}
      </dd>
    </div>
  )
}
