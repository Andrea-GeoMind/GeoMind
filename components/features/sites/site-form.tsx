'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Globe } from 'lucide-react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { createSiteAction } from '@/app/(app)/sites/actions'
// Import depuis lib/validations (pure Zod, sans postgres) pour éviter de faire
// entrer db/client.ts dans le bundle client.
import { siteSchema } from '@/lib/validations/site'

type SiteFormData = z.infer<typeof siteSchema>

type Props = {
  canAdd: boolean
  planUpgradeUrl: string | null
}

export function SiteForm({ canAdd, planUpgradeUrl }: Props) {
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SiteFormData>({
    resolver: zodResolver(siteSchema),
  })

  function onSubmit(data: SiteFormData) {
    setServerError(null)
    const fd = new FormData()
    fd.set('name', data.name)
    fd.set('url', data.url)

    startTransition(async () => {
      const result = await createSiteAction(fd)
      if (result?.error) {
        setServerError(result.error)
      } else {
        reset()
        setOpen(false)
      }
    })
  }

  if (!canAdd) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-dashed border-border/60 bg-muted/30 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Globe className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="flex-1 text-sm text-muted-foreground">
          Limite de sites atteinte pour votre plan.
        </p>
        {planUpgradeUrl && (
          <a
            href={planUpgradeUrl}
            className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Passer Pro
          </a>
        )}
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-all duration-200 hover:opacity-90 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98]"
      >
        <Plus className="h-4 w-4" />
        Ajouter un site
      </button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!isPending) {
            setOpen(v)
            if (!v) {
              reset()
              setServerError(null)
            }
          }
        }}
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
              <Globe className="h-5 w-5 text-indigo-600" />
            </div>
            <DialogTitle className="text-lg font-bold">Ajouter un site</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Entrez le nom et l&apos;URL de votre site. L&apos;URL doit commencer par https://.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nom du site
              </Label>
              <Input
                id="name"
                placeholder="Mon site e-commerce"
                className="rounded-lg border-border focus-visible:ring-primary"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="url" className="text-sm font-medium">
                URL
              </Label>
              <Input
                id="url"
                type="url"
                placeholder="https://exemple.fr"
                className="rounded-lg border-border focus-visible:ring-primary"
                {...register('url')}
              />
              {errors.url && (
                <p className="text-xs text-destructive">{errors.url.message}</p>
              )}
            </div>

            {serverError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
                <p className="text-sm text-destructive">{serverError}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isPending} className="rounded-lg">
                  Annuler
                </Button>
              </DialogClose>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? 'Enregistrement...' : 'Ajouter'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
