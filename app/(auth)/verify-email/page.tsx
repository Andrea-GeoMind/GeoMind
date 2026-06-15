import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { MailOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Vérifiez votre email — GEOMIND',
}

export default function VerifyEmailPage() {
  return (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <Link href="/" className="inline-block">
          <Logo size={32} className="justify-center" />
        </Link>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
          <MailOpen className="h-8 w-8 text-indigo-600" />
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
