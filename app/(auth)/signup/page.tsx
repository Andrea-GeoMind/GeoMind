import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { SignupForm } from '@/components/features/auth/signup-form'

export const metadata: Metadata = {
  title: 'Créer un compte — GEOMIND',
  description:
    'Créez votre compte GEOMIND et lancez votre première analyse de visibilité IA, offerte et sans carte bancaire.',
  robots: { index: false, follow: false },
}

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <Link href="/" className="inline-block">
          <Logo size={32} className="justify-center" />
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">Créer un compte</h1>
        <p className="text-sm text-muted-foreground">
          Auditez la visibilité de votre site dans les IA
        </p>
      </div>
      <SignupForm />
      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
