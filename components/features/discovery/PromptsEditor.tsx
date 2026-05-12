'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, Plus, Trash2 } from 'lucide-react'
import { NeutralPromptBadge } from '@/components/features/discovery/neutral-prompt-badge'
import { isPromptNeutral } from '@/lib/analysis/neutrality'
import {
  addPromptAction,
  deletePromptAction,
} from '@/app/(app)/sites/[siteId]/discovery/actions'

interface Prompt {
  id: string
  text: string
  isNeutral: boolean
}

interface PromptsEditorProps {
  siteId: string
  siteUrl: string
  siteName: string
  initialPrompts: Prompt[]
}

export function PromptsEditor({ siteId, siteUrl, siteName, initialPrompts }: PromptsEditorProps) {
  const [prompts, setPrompts] = useState(initialPrompts)
  const [input, setInput] = useState('')
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState('')

  const neutralCount = prompts.filter((p) => p.isNeutral).length
  const previewIsNeutral = input.trim() ? isPromptNeutral(input, siteUrl, siteName) : null

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return

    setFormError('')
    startTransition(async () => {
      const result = await addPromptAction(siteId, text)
      if (result.error) {
        setFormError(result.error)
      } else if (result.data) {
        setPrompts((prev) => [...prev, result.data!])
        setInput('')
      }
    })
  }

  function handleDelete(id: string) {
    setPrompts((prev) => prev.filter((p) => p.id !== id))
    startTransition(async () => {
      await deletePromptAction(siteId, id)
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Prompts</label>
        <span className="text-xs text-muted-foreground">
          {neutralCount}/{prompts.length} neutres
        </span>
      </div>

      <div className="space-y-2">
        {prompts.length === 0 && (
          <p className="text-sm italic text-muted-foreground">Aucun prompt généré.</p>
        )}
        {prompts.map((p) => (
          <div
            key={p.id}
            className="flex items-start gap-2 rounded-md border border-border bg-background px-3 py-2"
          >
            <span className="flex-1 text-sm leading-relaxed">{p.text}</span>
            <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
              <NeutralPromptBadge isNeutral={p.isNeutral} iconOnly />
              <button
                type="button"
                onClick={() => handleDelete(p.id)}
                className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label="Supprimer ce prompt"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={handleAdd}
        className="flex flex-col gap-2 rounded-md border border-dashed border-border p-3"
      >
        <p className="text-xs font-medium text-muted-foreground">Ajouter un prompt</p>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex : Quel outil pour améliorer ma visibilité dans les IAs ?"
            className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={isPending || !input.trim()}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus size={14} />
            Ajouter
          </button>
        </div>
        {previewIsNeutral === false && (
          <p className="flex items-center gap-1.5 text-xs text-[--score-bad-600]">
            <AlertTriangle size={12} className="shrink-0" />
            Ce prompt mentionne votre domaine ou marque — il sera marqué{' '}
            <strong>non neutre</strong> et exclu du calcul GEO.
          </p>
        )}
        {formError && <p className="text-xs text-destructive">{formError}</p>}
      </form>
    </div>
  )
}
