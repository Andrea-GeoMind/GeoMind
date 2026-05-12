'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { updateKeywordsAction } from '@/app/(app)/sites/[siteId]/discovery/actions'

interface KeywordsEditorProps {
  siteId: string
  initialKeywords: string[]
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function KeywordsEditor({ siteId, initialKeywords }: KeywordsEditorProps) {
  const [keywords, setKeywords] = useState(initialKeywords)
  const [input, setInput] = useState('')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [])

  function save(next: string[]) {
    setSaveStatus('saving')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const result = await updateKeywordsAction(siteId, next)
        if (result.error) {
          setSaveStatus('error')
        } else {
          setSaveStatus('saved')
          if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
          savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000)
        }
      })
    }, 500)
  }

  function addKeyword() {
    const trimmed = input.trim()
    if (!trimmed || keywords.includes(trimmed)) {
      setInput('')
      return
    }
    const next = [...keywords, trimmed]
    setKeywords(next)
    setInput('')
    save(next)
  }

  function removeKeyword(kw: string) {
    const next = keywords.filter((k) => k !== kw)
    setKeywords(next)
    save(next)
  }

  const effectiveStatus: SaveStatus = isPending ? 'saving' : saveStatus

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Mots-clés</label>
        <SaveIndicator status={effectiveStatus} />
      </div>
      <div className="flex min-h-[2.75rem] flex-wrap gap-1.5 rounded-md border border-input bg-background p-2">
        {keywords.map((kw) => (
          <span
            key={kw}
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
          >
            {kw}
            <button
              type="button"
              onClick={() => removeKeyword(kw)}
              className="rounded-full text-muted-foreground hover:text-destructive focus:outline-none"
              aria-label={`Supprimer ${kw}`}
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addKeyword()
            }
            if (e.key === ',') {
              e.preventDefault()
              addKeyword()
            }
          }}
          placeholder={keywords.length === 0 ? 'Ajouter un mot-clé…' : ''}
          className="min-w-[140px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <p className="text-xs text-muted-foreground">Entrée ou virgule pour ajouter · clic sur × pour retirer.</p>
    </div>
  )
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null
  if (status === 'saving')
    return <span className="text-xs text-muted-foreground">Sauvegarde…</span>
  if (status === 'saved')
    return <span className="text-xs text-[--score-good-600]">✓ Enregistré</span>
  return <span className="text-xs text-destructive">Erreur lors de la sauvegarde</span>
}
