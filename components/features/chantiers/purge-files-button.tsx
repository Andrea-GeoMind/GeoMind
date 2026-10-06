'use client'

import { useState, useTransition } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { purgeChantierFilesAction } from '@/app/(app)/dashboard/chantiers/actions'
import { formatFileSize } from '@/lib/chantiers/files'

type Props = { chantierId: string; fileCount: number; totalBytes: number }

/** Vide le stockage du chantier, après confirmation. Les réponses restent. */
export default function PurgeFilesButton({ chantierId, fileCount, totalBytes }: Props) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function purge() {
    startTransition(async () => {
      const result = await purgeChantierFilesAction(chantierId)
      if ('error' in result) {
        setMessage(result.error)
      } else {
        setMessage(`${result.count} fichier(s) supprimé(s) du stockage, ${formatFileSize(result.bytes)} libérés.`)
        setOpen(false)
      }
    })
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" disabled={fileCount === 0} onClick={() => setOpen(true)}>
        <Trash2 />
        Purger les fichiers
      </Button>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <Dialog open={open} onOpenChange={(v) => !isPending && setOpen(v)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Purger les fichiers de ce chantier ?</DialogTitle>
            <DialogDescription>
              {fileCount} fichier(s), {formatFileSize(totalBytes)}, seront supprimés définitivement du
              stockage. Vérifiez qu’ils sont bien rapatriés en local. Les réponses saisies par le
              client sont conservées.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={isPending}>
                Annuler
              </Button>
            </DialogClose>
            <Button type="button" variant="destructive" onClick={purge} disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              Supprimer {fileCount} fichier(s)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
