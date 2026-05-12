'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  addCompetitorAction,
  deleteCompetitorAction,
} from '@/app/(app)/sites/[siteId]/discovery/actions'

interface Competitor {
  id: string
  url: string
  name: string | null
}

interface CompetitorsEditorProps {
  siteId: string
  initialCompetitors: Competitor[]
}

export function CompetitorsEditor({ siteId, initialCompetitors }: CompetitorsEditorProps) {
  const [competitors, setCompetitors] = useState(initialCompetitors)
  const [urlInput, setUrlInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState('')

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const url = urlInput.trim()
    if (!url) return

    setFormError('')
    startTransition(async () => {
      const result = await addCompetitorAction(siteId, url, nameInput.trim() || null)
      if (result.error) {
        setFormError(result.error)
      } else if (result.data) {
        setCompetitors((prev) => [...prev, result.data!])
        setUrlInput('')
        setNameInput('')
      }
    })
  }

  function handleDelete(id: string) {
    setCompetitors((prev) => prev.filter((c) => c.id !== id))
    startTransition(async () => {
      await deleteCompetitorAction(siteId, id)
    })
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Concurrents</label>

      <div className="space-y-2">
        {competitors.length === 0 && (
          <p className="text-sm italic text-muted-foreground">Aucun concurrent détecté.</p>
        )}
        {competitors.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2"
          >
            <div className="min-w-0">
              {c.name && <p className="truncate text-sm font-medium">{c.name}</p>}
              <p className="truncate text-xs text-muted-foreground">{c.url}</p>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(c.id)}
              className="ml-3 shrink-0 rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label="Supprimer ce concurrent"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <form
        onSubmit={handleAdd}
        className="flex flex-col gap-2 rounded-md border border-dashed border-border p-3"
      >
        <p className="text-xs font-medium text-muted-foreground">Ajouter un concurrent</p>
        <input
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          placeholder="Nom (ex : Concurrent.io)"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex gap-2">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://exemple.com"
            className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={isPending || !urlInput.trim()}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus size={14} />
            Ajouter
          </button>
        </div>
        {formError && <p className="text-xs text-destructive">{formError}</p>}
      </form>
    </div>
  )
}
