'use client'

import { useState, useTransition } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportChantierMarkdownAction } from '@/app/(app)/dashboard/chantiers/actions'

/** Télécharge les réponses du chantier en Markdown (fichier .md). */
export default function ExportButton({ chantierId }: { chantierId: string }) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function download() {
    setError(null)
    startTransition(async () => {
      const result = await exportChantierMarkdownAction(chantierId)
      if ('error' in result) return setError(result.error)
      const url = URL.createObjectURL(new Blob([result.content], { type: 'text/markdown;charset=utf-8' }))
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <Button type="button" size="sm" variant="outline" onClick={download} disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" /> : <FileDown />}
        Exporter les réponses
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </span>
  )
}
