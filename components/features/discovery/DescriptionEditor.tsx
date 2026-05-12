'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { updateDescriptionAction } from '@/app/(app)/sites/[siteId]/discovery/actions'

interface DescriptionEditorProps {
  siteId: string
  initialValue: string
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function DescriptionEditor({ siteId, initialValue }: DescriptionEditorProps) {
  const [value, setValue] = useState(initialValue)
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

  function handleChange(newValue: string) {
    setValue(newValue)
    setSaveStatus('saving')

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const result = await updateDescriptionAction(siteId, newValue)
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

  const effectiveStatus: SaveStatus = isPending ? 'saving' : saveStatus

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Description</label>
        <SaveIndicator status={effectiveStatus} />
      </div>
      <textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        rows={4}
        className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        placeholder="Décrivez votre activité en 2-3 phrases…"
      />
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
