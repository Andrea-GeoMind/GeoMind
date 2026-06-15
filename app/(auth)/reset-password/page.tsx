import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { MailCheck } from 'lucide-react'
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
          <Link href="/" className="inline-block">
            <Logo size={32} className="justify-center" />
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight">Nouveau mot de passe</h1>
          <p className="text-sm text-muted-foreground">Choisissez un nouveau mot de passe.</p>
        </div>
        <UpdatePasswordForm />
      </div>
    )
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-4">
          <Link href="/" className="inline-block">
            <Logo size={32} className="justify-center" />
          </Link>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
            <MailCheck className="h-8 w-8 text-indigo-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight">Email envoyé</h1>
            <p className="text-sm text-muted-foreground">
              Vérifiez votre boîte mail et cliquez sur le lien de réinitialisation.
            </p>
          </div>
        </div>
        <Button variant="outline" asChild className="w-full rounded-lg">
          <Link href="/login">Retour à la connexion</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <Link href="/" className="inline-block">
          <Logo size={32} className="justify-center" />
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">Mot de passe oublié</h1>
        <p className="text-sm text-muted-foreground">
          Entrez votre email pour recevoir un lien de réinitialisation.
        </p>
      </div>
      <ResetPasswordForm />
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary font-medium hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </div>
  )
}
