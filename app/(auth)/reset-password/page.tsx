import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ResetPasswordForm } from '@/components/features/auth/reset-password-form'
import { UpdatePasswordForm } from '@/components/features/auth/update-password-form'

export const metadata: Metadata = {
  title: 'Mot de passe oublié — GEOMIND',
}

type Props = {
  searchParams: Promise<{ sent?: string; mode?: string }>
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { sent, mode } = await searchParams

  if (mode === 'update') {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Nouveau mot de passe</h1>
          <p className="text-sm text-muted-foreground">Choisissez un nouveau mot de passe.</p>
        </div>
        <UpdatePasswordForm />
      </div>
    )
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Email envoyé</h1>
          <p className="text-muted-foreground">
            Vérifiez votre boîte mail et cliquez sur le lien de réinitialisation.
          </p>
        </div>
        <Button variant="outline" asChild className="w-full">
          <Link href="/login">Retour à la connexion</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Mot de passe oublié</h1>
        <p className="text-sm text-muted-foreground">
          Entrez votre email pour recevoir un lien de réinitialisation.
        </p>
      </div>
      <ResetPasswordForm />
    </div>
  )
}
