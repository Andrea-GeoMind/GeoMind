import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { LoginForm } from '@/components/features/auth/login-form'

export const metadata: Metadata = {
  title: 'Connexion — GEOMIND',
}

type Props = {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <Link href="/" className="inline-block">
          <Logo size={32} className="justify-center" />
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">Connexion</h1>
        <p className="text-sm text-muted-foreground">Accédez à votre espace GeoMind</p>
      </div>
      {error === 'auth-callback' && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
          Le lien a expiré ou est invalide. Réessayez.
        </p>
      )}
      <LoginForm />
      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{' '}
        <Link href="/signup" className="text-primary font-medium hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  )
}
