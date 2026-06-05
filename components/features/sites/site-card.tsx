'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Globe, Trash2, ExternalLink, ArrowRight } from 'lucide-react'
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
      <Card className="rounded-xl border border-border bg-white shadow-sm transition-shadow duration-150 hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-4">
          {/* Icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/15">
            <Globe className="h-4 w-4 text-primary" />
          </div>

          {/* Site info */}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{site.name}</p>
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 truncate text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {site.url}
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </div>

          {/* CTA */}
          <Link
            href={`/sites/${site.id}/overview`}
            className="group flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            Voir l&apos;analyse
            <ArrowRight className="h-3 w-3 transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>

          {/* Delete */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
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
              <strong>{site.name}</strong> ({site.url}) et toutes ses analyses seront supprimés
              définitivement. Cette action est irréversible.
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
