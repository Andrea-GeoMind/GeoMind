'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
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
import { siteSchema } from '@/lib/db/queries/sites'

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
      <div className="flex items-center gap-3 rounded-lg border border-dashed p-4">
        <p className="flex-1 text-sm text-muted-foreground">
          Limite de sites atteinte pour votre plan.
        </p>
        {planUpgradeUrl && (
          <Button size="sm" asChild>
            <a href={planUpgradeUrl}>Passer Pro</a>
          </Button>
        )}
      </div>
    )
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Ajouter un site
      </Button>

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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un site</DialogTitle>
            <DialogDescription>
              Entrez le nom et l&apos;URL de votre site. L&apos;URL doit commencer par https://.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du site</Label>
              <Input
                id="name"
                placeholder="Mon site e-commerce"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://exemple.fr"
                {...register('url')}
              />
              {errors.url && (
                <p className="text-sm text-destructive">{errors.url.message}</p>
              )}
            </div>

            {serverError && <p className="text-sm text-destructive">{serverError}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isPending}>
                  Annuler
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Enregistrement...' : 'Ajouter'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
