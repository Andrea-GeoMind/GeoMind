import type { Metadata } from 'next'
import Link from 'next/link'
import { Rocket } from 'lucide-react'
import { StepProgress } from '@/components/features/onboarding/StepProgress'
import { WelcomeStep } from '@/components/features/onboarding/WelcomeStep'
import { AddSiteStep } from '@/components/features/onboarding/AddSiteStep'

export const metadata: Metadata = {
  title: 'Onboarding — GEOMIND',
}

type Props = {
  searchParams: Promise<{ step?: string }>
}

export default async function OnboardingPage({ searchParams }: Props) {
  const { step: stepParam } = await searchParams
  const step = (Number(stepParam) || 1) as 1 | 2 | 3

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        <div className="flex justify-center">
          <StepProgress currentStep={step} />
        </div>

        <div className="rounded-xl border bg-card p-6 sm:p-8 shadow-sm">
          {step === 1 && <WelcomeStep />}
          {step === 2 && <AddSiteStep />}
          {step === 3 && <AnalysisStartedStep />}
        </div>
      </div>
    </div>
  )
}

function AnalysisStartedStep() {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Rocket className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Analyse en cours !</h2>
        <p className="text-muted-foreground">
          GEOMIND interroge les IA en ce moment. Résultats disponibles dans 2 à 5 minutes.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
      >
        Aller au tableau de bord
      </Link>
    </div>
  )
}
