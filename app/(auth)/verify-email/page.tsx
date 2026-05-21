import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Vérifiez votre email — GEOMIND',
}

export default function VerifyEmailPage() {
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
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight">Vérifiez votre email</h1>
          <p className="text-sm text-muted-foreground">
            Un email de confirmation vous a été envoyé. Cliquez sur le lien pour activer votre
            compte et être redirigé vers l&apos;onboarding.
          </p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Email non reçu ?{' '}
        <Link href="/signup" className="text-primary font-medium hover:underline">
          Réessayer
        </Link>
      </p>
      <Button variant="outline" asChild className="w-full rounded-lg">
        <Link href="/login">Retour à la connexion</Link>
      </Button>
    </div>
  )
}
