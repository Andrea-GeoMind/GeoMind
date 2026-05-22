import type { Metadata } from 'next'
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
  const step = (Number(stepParam) || 1) as 1 | 2

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      {/* Brand header */}
      <div className="mb-8 flex flex-col items-center gap-1">
        <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
          GEOMIND
        </span>
        <span className="text-xs text-muted-foreground">Visibilité IA pour votre site</span>
      </div>

      <div className="w-full max-w-lg space-y-8">
        {/* Step indicator */}
        <div className="flex justify-center">
          <StepProgress currentStep={step} />
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8">
          {step === 1 && <WelcomeStep />}
          {step === 2 && <AddSiteStep />}
        </div>
      </div>
    </div>
  )
}
