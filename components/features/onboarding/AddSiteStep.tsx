'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { onboardingSiteSchema, type OnboardingSiteInput } from '@/lib/validations/site'
import { createSiteOnboardingAction } from '@/app/(app)/onboarding/actions'

const LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
]

const COUNTRIES = [
  { value: 'FR', label: 'France' },
  { value: 'BE', label: 'Belgique' },
  { value: 'CH', label: 'Suisse' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'Royaume-Uni' },
  { value: 'US', label: 'États-Unis' },
]

export function AddSiteStep() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(onboardingSiteSchema),
    defaultValues: { name: '', url: '', language: 'fr', country: 'FR' },
  })

  function onSubmit(data: Record<string, unknown>) {
    setServerError(null)
    const fd = new FormData()
    fd.set('name', String(data.name))
    fd.set('url', String(data.url))
    fd.set('language', String(data.language))
    fd.set('country', String(data.country))

    startTransition(async () => {
      const result = await createSiteOnboardingAction(fd)
      if (result?.error) setServerError(result.error)
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Globe className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Votre site web</h2>
        <p className="text-muted-foreground">
          Renseignez le site dont vous souhaitez auditer la visibilité IA.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Nom du site</Label>
          <Input
            id="name"
            placeholder="Mon agence web"
            autoFocus
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="language">Langue du site</Label>
            <select
              id="language"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register('language')}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            {errors.language && (
              <p className="text-sm text-destructive">{errors.language.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Pays cible</Label>
            <select
              id="country"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register('country')}
            >
              {COUNTRIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            {errors.country && (
              <p className="text-sm text-destructive">{errors.country.message}</p>
            )}
          </div>
        </div>

        {serverError && <p className="text-sm text-destructive">{serverError}</p>}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => window.history.back()}
            className="flex-1"
          >
            Retour
          </Button>
          <Button type="submit" disabled={isPending} className="flex-1">
            {isPending ? "Lancement de l'analyse..." : 'Analyser mon site'}
          </Button>
        </div>
      </form>
    </div>
  )
}
