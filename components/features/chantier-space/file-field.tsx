'use client'

import { useRef, useState } from 'react'
import { AlertCircle, Check, FileText, Loader2, Lock, Trash2, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CHANTIER_COPY, fillCopy } from '@/lib/chantiers/copy'
import type { FieldDef } from '@/lib/chantiers/fields'
import {
  ACCEPTED_TYPE_LABELS,
  UPLOAD_ERROR_MESSAGES,
  acceptAttribute,
  formatFileSize,
  validateUploadRequest,
  type ChantierFileView,
} from '@/lib/chantiers/files'
import { formatChantierDate } from '@/lib/chantiers/status'
import {
  confirmFileUploadAction,
  deleteChantierFileAction,
  requestFileUploadAction,
} from '@/app/chantier/espace/actions'

const C = CHANTIER_COPY

type FileField = Extract<FieldDef, { type: 'file' }>

type Props = {
  field: FileField
  establishmentId: string | null
  /** Fichiers vivants de cet emplacement */
  files: ChantierFileView[]
  /** Espace occupé par tout le chantier (en attente compris) */
  usedBytes: number
  /** Case à cocher à signer avant tout dépôt (droits sur les photos) */
  blockedBy: string | null
  onUploaded: (file: ChantierFileView) => void
  onDeleted: (fileId: string) => void
}

interface Upload {
  localId: string
  name: string
  progress: number
  phase: 'uploading' | 'checking' | 'error'
  error?: string
}

/** Envoi direct au bucket, avec progression (fetch ne la donne pas). */
function putToSignedUrl(
  url: string,
  file: File,
  contentType: string,
  onProgress: (ratio: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('content-type', contentType)
    xhr.setRequestHeader('x-upsert', 'false')
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total)
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)))
    xhr.onerror = () => reject(new Error('network'))
    xhr.send(file)
  })
}

function errorMessage(error: string): string {
  return error in UPLOAD_ERROR_MESSAGES
    ? UPLOAD_ERROR_MESSAGES[error as keyof typeof UPLOAD_ERROR_MESSAGES]
    : C.files.uploadFailed
}

export default function FileField({
  field,
  establishmentId,
  files,
  usedBytes,
  blockedBy,
  onUploaded,
  onDeleted,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploads, setUploads] = useState<Upload[]>([])
  const [dragging, setDragging] = useState(false)
  const used = useRef(usedBytes)
  used.current = usedBytes

  const patch = (localId: string, change: Partial<Upload>) =>
    setUploads((list) => list.map((u) => (u.localId === localId ? { ...u, ...change } : u)))

  async function uploadOne(file: File, localId: string) {
    // Mêmes règles que le serveur, pour répondre tout de suite (SVG, 20 Mo…)
    const precheck = validateUploadRequest({
      fileName: file.name,
      sizeBytes: file.size,
      accept: field.accept,
      usedBytes: used.current,
    })
    if (!precheck.ok) return patch(localId, { phase: 'error', error: errorMessage(precheck.error) })

    try {
      const start = await requestFileUploadAction({
        establishmentId,
        fieldKey: field.key,
        fileName: file.name,
        sizeBytes: file.size,
      })
      if (!start.ok) {
        if (start.error === 'access') return window.location.reload()
        return patch(localId, { phase: 'error', error: errorMessage(start.error) })
      }

      used.current += file.size
      await putToSignedUrl(start.signedUrl, file, start.contentType, (progress) =>
        patch(localId, { progress })
      )
      patch(localId, { phase: 'checking', progress: 1 })

      const done = await confirmFileUploadAction(start.fileId)
      if (!done.ok) {
        if (done.error === 'access') return window.location.reload()
        return patch(localId, { phase: 'error', error: errorMessage(done.error) })
      }
      onUploaded(done.file)
      setUploads((list) => list.filter((u) => u.localId !== localId))
    } catch {
      patch(localId, { phase: 'error', error: C.files.uploadFailed })
    }
  }

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0 || blockedBy) return
    const picked = field.multiple ? Array.from(list) : Array.from(list).slice(0, 1)
    const queued = picked.map((file) => ({
      file,
      upload: { localId: crypto.randomUUID(), name: file.name, progress: 0, phase: 'uploading' as const },
    }))
    setUploads((current) => [...current.filter((u) => u.phase !== 'error'), ...queued.map((q) => q.upload)])
    // Un fichier à la fois : sur mobile, plusieurs envois en parallèle se gênent
    for (const { file, upload } of queued) await uploadOne(file, upload.localId)
  }

  async function remove(file: ChantierFileView) {
    if (!window.confirm(C.files.confirmDelete)) return
    const result = await deleteChantierFileAction(file.id)
    if (result.ok) onDeleted(file.id)
    else if (result.error === 'access') window.location.reload()
  }

  const formats = field.accept.map((t) => ACCEPTED_TYPE_LABELS[t]).join(', ')
  const ready = files.filter((f) => f.status === 'ready')
  const inputId = `${establishmentId ?? 'chantier'}-${field.key}-input`

  return (
    <div className="space-y-3 border-b border-border/70 py-5 last:border-b-0">
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-base font-semibold leading-snug">{field.label}</p>
          {ready.length > 0 && <Check aria-label={C.files.uploaded} className="mt-1 h-4 w-4 shrink-0 text-accent" />}
        </div>
        {field.help && <p className="text-sm leading-relaxed text-muted-foreground">{field.help}</p>}
      </div>

      {field.notice && (
        <p className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm leading-relaxed text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{field.notice}</span>
        </p>
      )}

      {ready.length > 0 && (
        <ul className="divide-y divide-border/70 rounded-lg border bg-card">
          {ready.map((f) => (
            <li key={f.id} className="flex items-center gap-3 px-3 py-2.5">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{f.originalName}</p>
                <p className="text-xs text-muted-foreground">
                  {field.ownerOnlyDownload && f.expiresAt
                    ? fillCopy(C.files.ownerOnly, {
                        '[DEPOT]': formatChantierDate(new Date(f.createdAt)),
                        '[SUPPRESSION]': formatChantierDate(new Date(f.expiresAt)),
                      })
                    : `${formatFileSize(f.sizeBytes)} · ${C.files.uploaded}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void remove(f)}
                aria-label={`${C.files.delete} ${f.originalName}`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {uploads.length > 0 && (
        <ul className="space-y-2">
          {uploads.map((u) => (
            <li key={u.localId} className="rounded-lg border bg-card px-3 py-2.5">
              <div className="flex items-center gap-2 text-sm">
                {u.phase === 'error' ? (
                  <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                ) : (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                )}
                <span className="min-w-0 flex-1 truncate">{u.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {u.phase === 'uploading' ? `${Math.round(u.progress * 100)} %` : u.phase === 'checking' ? C.files.checking : ''}
                </span>
              </div>
              {u.phase === 'uploading' && (
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary transition-[width]" style={{ width: `${u.progress * 100}%` }} />
                </div>
              )}
              {u.error && <p className="mt-1 text-sm text-destructive">{u.error}</p>}
            </li>
          ))}
        </ul>
      )}

      {blockedBy ? (
        <p className="rounded-lg border-2 border-dashed p-4 text-center text-sm text-muted-foreground">
          {UPLOAD_ERROR_MESSAGES.attestation_required}
        </p>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            void handleFiles(e.dataTransfer.files)
          }}
          className={cn(
            'flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed p-4 text-center transition-colors',
            dragging ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
          )}
        >
          <Upload className="h-5 w-5 text-primary" />
          <span className="text-base font-medium sm:text-sm">{C.files.dropzone}</span>
          <span className="text-xs text-muted-foreground">{fillCopy(C.files.limits, { '[FORMATS]': formats })}</span>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            multiple={field.multiple}
            accept={acceptAttribute(field.accept)}
            className="sr-only"
            onChange={(e) => {
              void handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </label>
      )}
    </div>
  )
}
