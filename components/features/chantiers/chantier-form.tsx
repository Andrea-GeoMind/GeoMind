'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useFieldArray, useForm, type Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createChantierAction } from '@/app/(app)/dashboard/chantiers/actions'
import {
  EMPTY_CHANTIER_FORM,
  EMPTY_ESTABLISHMENT,
  chantierFormSchema,
  chantierInputSchema,
  formToChantierInput,
  type ChantierFormValues,
} from '@/lib/chantiers/validation'

export interface ExtraFieldOption {
  key: string
  label: string
}

type Props = {
  chantierExtras: ExtraFieldOption[]
  establishmentExtras: ExtraFieldOption[]
}

const KIND_LABELS = { venue: 'Lieu de réception', rental: 'Loueur' } as const

export default function ChantierForm({ chantierExtras, establishmentExtras }: Props) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ChantierFormValues>({
    resolver: zodResolver(chantierFormSchema),
    defaultValues: EMPTY_CHANTIER_FORM,
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'establishments' })

  function onSubmit(form: ChantierFormValues) {
    setServerError(null)
    const input = formToChantierInput(form)

    // Validation complète avant l'envoi, erreurs rattachées à leur champ ;
    // le serveur revalide de toute façon.
    const parsed = chantierInputSchema.safeParse(input)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const [first, index, key] = issue.path
        const path =
          first === 'establishments' && typeof index === 'number'
            ? `establishments.${index}.${key === 'addressOptions' ? 'addressText' : String(key)}`
            : String(first)
        setError(path as Path<ChantierFormValues>, { message: issue.message })
      }
      return
    }

    startTransition(async () => {
      const result = await createChantierAction(parsed.data)
      if ('error' in result) setServerError(result.error)
      else router.push('/dashboard/chantiers')
    })
  }

  const fieldError = (message?: string) =>
    message ? <p className="text-xs text-destructive">{message}</p> : null

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-bold">Client</h2>
        <div className="space-y-2">
          <Label htmlFor="clientName">Nom du client</Label>
          <Input id="clientName" {...register('clientName')} placeholder="Home Sweet Event" />
          {fieldError(errors.clientName?.message)}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactEmail">E-mail du client (facultatif)</Label>
          <Input id="contactEmail" type="email" {...register('contactEmail')} />
          {fieldError(errors.contactEmail?.message)}
        </div>
        <div className="space-y-2">
          <Label htmlFor="geomindAddress">Adresse GeoMind : à inviter et à contacter</Label>
          <Input id="geomindAddress" type="email" {...register('geomindAddress')} />
          <p className="text-xs text-muted-foreground">
            Remplace [ADRESSE] et [CONTACT] dans les textes vus par le client.
          </p>
          {fieldError(errors.geomindAddress?.message)}
        </div>
        <div className="space-y-2">
          <Label htmlFor="alertEmail">Adresse des alertes e-mail</Label>
          <Input id="alertEmail" type="email" {...register('alertEmail')} />
          <p className="text-xs text-muted-foreground">
            Reçoit l’e-mail groupé d’activité et l’alerte d’expiration du lien.
          </p>
          {fieldError(errors.alertEmail?.message)}
        </div>
        {chantierExtras.length > 0 && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Champs propres à ce chantier</legend>
            {chantierExtras.map((x) => (
              <label key={x.key} className="flex items-center gap-2 text-sm">
                <input type="checkbox" value={x.key} {...register('extraFields')} />
                {x.label}
              </label>
            ))}
            {fieldError(errors.extraFields?.message)}
          </fieldset>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">Établissements</h2>
        {fields.map((field, index) => {
          const err = errors.establishments?.[index]
          return (
            <div key={field.id} className="space-y-4 rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Établissement {index + 1}</p>
                {fields.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                    <Trash2 />
                    Retirer
                  </Button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`est-${index}-name`}>Nom</Label>
                  <Input id={`est-${index}-name`} {...register(`establishments.${index}.name`)} />
                  {fieldError(err?.name?.message)}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`est-${index}-kind`}>Type</Label>
                  <select
                    id={`est-${index}-kind`}
                    {...register(`establishments.${index}.kind`)}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    {Object.entries(KIND_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`est-${index}-website`}>Site</Label>
                <Input
                  id={`est-${index}-website`}
                  {...register(`establishments.${index}.website`)}
                  placeholder="https://"
                />
                {fieldError(err?.website?.message)}
              </div>
              <div className="space-y-2">
                <Label htmlFor={`est-${index}-addresses`}>Adresses officielles proposées</Label>
                <textarea
                  id={`est-${index}-addresses`}
                  rows={3}
                  {...register(`establishments.${index}.addressText`)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="Une adresse par ligne. « Autre » est toujours proposé au client."
                />
                {fieldError(err?.addressText?.message)}
              </div>
              {establishmentExtras.length > 0 && (
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">Champs propres à cet établissement</legend>
                  {establishmentExtras.map((x) => (
                    <label key={x.key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        value={x.key}
                        {...register(`establishments.${index}.extraFields`)}
                      />
                      {x.label}
                    </label>
                  ))}
                  {fieldError(err?.extraFields?.message)}
                </fieldset>
              )}
            </div>
          )
        })}
        {fieldError(errors.establishments?.message)}
        <Button type="button" variant="outline" onClick={() => append(EMPTY_ESTABLISHMENT)}>
          <Plus />
          Ajouter un établissement
        </Button>
      </section>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Création…' : 'Créer le chantier'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/dashboard/chantiers')}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
