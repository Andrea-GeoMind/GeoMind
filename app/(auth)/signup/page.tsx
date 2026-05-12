import type { Metadata } from 'next'
import { SignupForm } from '@/components/features/auth/signup-form'

export const metadata: Metadata = {
  title: 'Créer un compte — GEOMIND',
}

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Créer un compte</h1>
        <p className="text-sm text-muted-foreground">
          Auditez la visibilité de votre site dans les IA
        </p>
      </div>
      <SignupForm />
    </div>
  )
}
