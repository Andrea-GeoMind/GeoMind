'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Eraser, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { clearCoachMemoryAction } from '@/app/(app)/sites/[siteId]/coach-actions'
import { captureCoachEvent } from '@/components/features/coach/coach-analytics'

interface ClearMemoryButtonProps {
  siteId: string
}

/**
 * « Effacer la mémoire de GEO » (RGPD §16.8) — supprime les messages et le
 * résumé mémoire du site, après confirmation.
 */
export function ClearMemoryButton({ siteId }: ClearMemoryButtonProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      const result = await clearCoachMemoryAction(siteId)
      if ('error' in result) {
        setError(result.error)
        return
      }
      captureCoachEvent('coach_memory_cleared')
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <Eraser size={13} className="mr-1.5" />
        Effacer la mémoire de GEO
      </Button>

      <Dialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Effacer la mémoire de GEO ?</DialogTitle>
            <DialogDescription>
              Toutes les conversations avec GEO et le résumé mémoire de ce site seront supprimés
              définitivement. GEO repartira de zéro.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isPending && <Loader2 size={14} className="mr-1.5 animate-spin" />}
              Effacer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
