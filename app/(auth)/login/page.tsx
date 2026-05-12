import type { Metadata } from 'next'
import Link from 'next/link'
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
        <Link href="/" className="inline-block text-xl font-bold tracking-tight">
          GEOMIND
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Connexion</h1>
      </div>
      {error === 'auth-callback' && (
        <p className="rounded-md bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
          Le lien a expiré ou est invalide. Réessayez.
        </p>
      )}
      <LoginForm />
    </div>
  )
}
