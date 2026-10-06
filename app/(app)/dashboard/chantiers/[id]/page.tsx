import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Lock } from 'lucide-react'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin'
import { getChantierForOwner } from '@/lib/db/queries/chantiers'
import { listFilesForOwner } from '@/lib/chantiers/file-service'
import { getField } from '@/lib/chantiers/fields'
import { CHANTIER_QUOTA_BYTES, formatFileSize, usedBytes } from '@/lib/chantiers/files'
import { chantierDisplayState, formatChantierDate } from '@/lib/chantiers/status'
import FileDownloadButton from '@/components/features/chantiers/file-download-button'
import PurgeFilesButton from '@/components/features/chantiers/purge-files-button'

export const metadata: Metadata = {
  title: 'Chantier',
  robots: { index: false, follow: false },
}

const DELETED_REASON: Record<string, string> = {
  client: 'supprimé par le client',
  replaced: 'remplacé',
  purge: 'purgé',
  expired: 'expiré',
  rejected: 'refusé (contenu non conforme)',
  abandoned: 'dépôt abandonné',
  missing: 'jamais reçu',
}

/**
 * Vue GeoMind d'un chantier. S2.5 : les fichiers (téléchargement, purge).
 * S2.6 y ajoutera les réponses, l'historique, le journal et la gestion du lien.
 */
export default async function ChantierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  const { id } = await params
  if (!z.uuid().safeParse(id).success) notFound()

  const data = await getChantierForOwner(admin.id, id)
  const files = await listFilesForOwner(admin.id, id)
  if (!data || !files) notFound()

  const { chantier, establishments } = data
  const names = new Map(establishments.map((e) => [e.id, e.name]))
  const live = files.filter((f) => f.status !== 'deleted')
  const ready = live.filter((f) => f.status === 'ready')
  const state = chantierDisplayState(chantier, new Date())

  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8">
      <Link
        href="/dashboard/chantiers"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Chantiers
      </Link>
      <h1 className="text-2xl font-extrabold tracking-tight">{chantier.clientName}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {state.label} · {establishments.map((e) => e.name).join(' · ')}
      </p>

      <section className="mt-8 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Fichiers</h2>
            <p className="text-sm text-muted-foreground">
              {ready.length} fichier(s) · {formatFileSize(usedBytes(live))} utilisés sur{' '}
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
            {files.map((f) => {
              const field = getField(f.fieldKey)
              return (
                <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0 space-y-0.5">
                    <p className={f.status === 'deleted' ? 'truncate text-sm text-muted-foreground line-through' : 'truncate text-sm font-medium'}>
                      {f.originalName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {field?.label ?? f.fieldKey}
                      {f.establishmentId && ` · ${names.get(f.establishmentId) ?? ''}`} ·{' '}
                      {formatFileSize(f.sizeBytes)} · {f.mimeType} · déposé le {formatChantierDate(f.createdAt)}
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
                        {f.deletedAt && ` le ${formatChantierDate(f.deletedAt)}`}
                      </p>
                    )}
                    {f.status === 'pending' && <p className="text-xs text-muted-foreground">envoi en cours ou interrompu</p>}
                  </div>
                  {f.status === 'ready' && <FileDownloadButton fileId={f.id} />}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
