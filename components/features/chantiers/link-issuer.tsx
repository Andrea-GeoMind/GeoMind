'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, Link2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { issueChantierLinkAction } from '@/app/(app)/dashboard/chantiers/actions'

type Props = {
  chantierId: string
  /** Un lien existe déjà : l'émettre à nouveau désactive l'ancien */
  regenerate?: boolean
}

/**
 * Émet le lien d'un chantier et l'affiche une seule fois. La base n'en garde
 * que l'empreinte : une fois ce bloc fermé ou la page quittée, il n'est plus
 * récupérable — seulement régénérable.
 */
export default function LinkIssuer({ chantierId, regenerate = false }: Props) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function issue() {
    setError(null)
    startTransition(async () => {
      const result = await issueChantierLinkAction(chantierId)
      setConfirming(false)
      if ('error' in result) {
        setError(result.error)
      } else {
        setUrl(result.url)
        router.refresh()
      }
    })
  }

  async function copy() {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      setError('Copie impossible : sélectionnez le lien et copiez-le à la main.')
    }
  }

  if (url) {
    return (
      <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-500/40 dark:bg-amber-500/10">
        <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
          Copiez ce lien maintenant : il ne sera plus jamais affiché.
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Lien du chantier"
            className="min-w-0 flex-1 rounded-md border bg-background px-2 py-1.5 font-mono text-xs"
          />
          <Button type="button" size="sm" variant="outline" onClick={copy}>
            {copied ? <Check /> : <Copy />}
            {copied ? 'Copié' : 'Copier'}
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        size="sm"
        variant={regenerate ? 'outline' : 'default'}
        onClick={() => (regenerate ? setConfirming(true) : issue())}
        disabled={isPending}
      >
        <Link2 />
        {isPending && !regenerate ? 'Émission…' : regenerate ? 'Régénérer le lien' : 'Émettre le lien'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}

      <Dialog open={confirming} onOpenChange={(v) => !isPending && setConfirming(v)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Régénérer le lien ?</DialogTitle>
            <DialogDescription>
              L’ancien lien cessera immédiatement de fonctionner. Le nouveau ne sera affiché qu’une
              fois : il faudra l’envoyer au client.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={isPending}>
                Annuler
              </Button>
            </DialogClose>
            <Button type="button" variant="destructive" onClick={issue} disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              Régénérer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
