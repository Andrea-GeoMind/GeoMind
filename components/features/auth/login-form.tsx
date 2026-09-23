'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signIn, sendSignInLink } from '@/app/(auth)/actions'
import { GoogleSignInButton, AuthDivider } from '@/components/features/auth/google-sign-in-button'

const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

type LoginData = z.infer<typeof loginSchema>

export function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  /** Lien magique : 'idle' | 'sending' | 'sent' | l'adresse est invalide. */
  const [linkState, setLinkState] = useState<'idle' | 'sending' | 'sent' | 'invalid'>('idle')

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  })

  /**
   * Beaucoup de comptes viennent du tunnel d'audit public et n'ont jamais eu
   * de mot de passe : pour eux, ce bouton est la seule porte d'entrée.
   */
  function onSendLink() {
    const email = getValues('email')
    if (!email || !z.string().email().safeParse(email).success) {
      setLinkState('invalid')
      return
    }
    setServerError(null)
    setLinkState('sending')
    startTransition(async () => {
      await sendSignInLink(email)
      setLinkState('sent')
    })
  }

  function onSubmit(data: LoginData) {
    setServerError(null)
    startTransition(async () => {
      const result = await signIn(data.email, data.password)
      if (result?.error) setServerError(result.error)
    })
  }

  return (
    <div className="space-y-4">
      <GoogleSignInButton label="Se connecter avec Google" />
      <AuthDivider />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="vous@exemple.fr"
          autoComplete="email"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Mot de passe</Label>
          <Link href="/reset-password" className="text-sm text-primary hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Connexion...' : 'Se connecter'}
      </Button>

      <div className="space-y-2 border-t border-border pt-4">
        {linkState === 'sent' ? (
          <p className="text-center text-sm text-muted-foreground">
            Si un compte existe pour cette adresse, un lien de connexion vient d&apos;être
            envoyé. Vérifiez votre boîte mail — le lien est valable une heure.
          </p>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isPending}
              onClick={onSendLink}
            >
              {linkState === 'sending' ? 'Envoi...' : 'Recevoir un lien de connexion'}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {linkState === 'invalid'
                ? 'Renseignez d’abord votre adresse email ci-dessus.'
                : 'Sans mot de passe — pratique si vous êtes arrivé par un audit gratuit.'}
            </p>
          </>
        )}
      </div>

      </form>
    </div>
  )
}
