import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Vérifiez votre email — GEOMIND',
}

export default function VerifyEmailPage() {
  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Vérifiez votre email</h1>
        <p className="text-muted-foreground">
          Un email de confirmation vous a été envoyé. Cliquez sur le lien pour activer votre
          compte et être redirigé vers l&apos;onboarding.
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        Email non reçu ?{' '}
        <Link href="/signup" className="text-primary hover:underline">
          Réessayer
        </Link>
      </p>
      <Button variant="outline" asChild className="w-full">
        <Link href="/login">Retour à la connexion</Link>
      </Button>
    </div>
  )
}
