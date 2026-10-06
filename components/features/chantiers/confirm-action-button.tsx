'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Props = {
  label: string
  icon?: ReactNode
  title: string
  description: string
  confirmLabel: string
  action: () => Promise<{ ok: true } | { error: string }>
  disabled?: boolean
}

/** Action destructive de la vue GeoMind : rien ne part sans confirmation. */
export default function ConfirmActionButton({
  label,
  icon,
  title,
  description,
  confirmLabel,
  action,
  disabled,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function confirm() {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if ('error' in result) {
        setError(result.error)
      } else {
        setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => setOpen(true)}>
        {icon}
        {label}
      </Button>
      <Dialog open={open} onOpenChange={(v) => !isPending && setOpen(v)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={isPending}>
                Annuler
              </Button>
            </DialogClose>
            <Button type="button" variant="destructive" onClick={confirm} disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {confirmLabel}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
