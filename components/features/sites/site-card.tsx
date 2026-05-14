'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Globe, Trash2, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { deleteSiteAction } from '@/app/(app)/sites/actions'

type Site = {
  id: string
  name: string
  url: string
  createdAt: Date
}

type Props = {
  site: Site
}

export function SiteCard({ site }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deleteSiteAction(site.id)
      if (result?.error) {
        setError(result.error)
      } else {
        setOpen(false)
      }
    })
  }

  return (
    <>
      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Globe className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">{site.name}</p>
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 truncate text-xs text-muted-foreground hover:text-foreground"
              >
                {site.url}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>
          </div>
          <Link
            href={`/sites/${site.id}/overview`}
            className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Voir l&apos;analyse
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => setOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Supprimer</span>
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce site ?</DialogTitle>
            <DialogDescription>
              <strong>{site.name}</strong> ({site.url}) et toutes ses analyses seront
              supprimés définitivement. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isPending}>
                Annuler
              </Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
