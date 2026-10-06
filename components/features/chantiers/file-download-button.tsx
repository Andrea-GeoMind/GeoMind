'use client'

import { useState, useTransition } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getChantierFileDownloadAction } from '@/app/(app)/dashboard/chantiers/actions'

/**
 * Télécharge un fichier déposé : l'adresse signée (60 s) est demandée au
 * clic et ouverte aussitôt. Servie en pièce jointe, elle déclenche un
 * enregistrement, jamais un affichage.
 */
export default function FileDownloadButton({ fileId }: { fileId: string }) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => {
          setError(null)
          startTransition(async () => {
            const result = await getChantierFileDownloadAction(fileId)
            if ('error' in result) setError(result.error)
            else window.location.assign(result.url)
          })
        }}
      >
        {isPending ? <Loader2 className="animate-spin" /> : <Download />}
        Télécharger
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </span>
  )
}
