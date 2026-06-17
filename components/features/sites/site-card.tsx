'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Trash2, ExternalLink, ArrowRight, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { SiteLogo } from '@/components/features/sites/site-logo'
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
  /** Site gelé après downgrade (§17.5) : lecture seule, pas de nouvelle analyse */
  frozen?: boolean
}

export function SiteCard({ site, frozen = false }: Props) {
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
      <Card className="group relative overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
        {/* Liseré navy de marque révélé au survol */}
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1 bg-[#16304B] opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        />
        <CardContent className="flex items-center gap-4 p-5">
          {/* Logo du site (favicon Google, fallback Globe) */}
          <SiteLogo url={site.url} name={site.name} />

          {/* Site info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-base font-bold tracking-tight text-foreground">
                {site.name}
              </p>
              {frozen && (
                <span
                  title="Votre plan actuel ne couvre plus tous vos sites. Les données restent consultables, mais aucune nouvelle analyse n'est possible. Passez à un plan supérieur pour le réactiver."
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  <Lock className="h-2.5 w-2.5" />
                  Gelé
                </span>
              )}
            </div>
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
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
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
