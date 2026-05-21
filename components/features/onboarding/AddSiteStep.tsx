'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { onboardingSiteSchema } from '@/lib/validations/site'
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
    <div className="flex flex-col gap-7">
      <div className="space-y-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
          <Globe className="h-6 w-6 text-indigo-600" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Votre site web</h2>
        <p className="text-sm text-muted-foreground">
          Renseignez le site dont vous souhaitez auditer la visibilité IA.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Nom du site
          </Label>
          <Input
            id="name"
            placeholder="Mon agence web"
            autoFocus
            className="rounded-lg border-border focus-visible:ring-primary"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="url" className="text-sm font-medium">
            URL du site
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="language" className="text-sm font-medium">
              Langue du site
            </Label>
            <select
              id="language"
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              {...register('language')}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            {errors.language && (
              <p className="text-xs text-destructive">{errors.language.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="country" className="text-sm font-medium">
              Pays cible
            </Label>
            <select
              id="country"
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              {...register('country')}
            >
              {COUNTRIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            {errors.country && (
              <p className="text-xs text-destructive">{errors.country.message}</p>
            )}
          </div>
        </div>

        {serverError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
            <p className="text-sm text-destructive">{serverError}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => window.history.back()}
            className="flex-1 rounded-lg"
          >
            Retour
          </Button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Lancement de l'analyse..." : 'Analyser mon site'}
          </button>
        </div>
      </form>
    </div>
  )
}
