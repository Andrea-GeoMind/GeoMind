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
          <Link href="/" className="inline-block">
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              GeoMind
            </span>
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
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              GeoMind
            </span>
          </Link>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              <path d="m16 19 2 2 4-4" />
            </svg>
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
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            GeoMind
          </span>
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
