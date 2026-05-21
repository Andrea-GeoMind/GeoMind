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
          {step === 3 && <AnalysisStartedStep />}
        </div>
      </div>
    </div>
  )
}

function AnalysisStartedStep() {
  return (
    <div className="flex flex-col items-center gap-7 text-center">
      {/* Animated icon */}
      <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
        <Rocket className="h-10 w-10 text-indigo-600" />
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500">
          <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
        </span>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight">Analyse en cours !</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          GEOMIND interroge ChatGPT, Perplexity, Gemini et Claude en ce moment.
          <br />
          Résultats disponibles dans 2 à 5 minutes.
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 animate-bounce rounded-full bg-indigo-600"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>

      <Link
        href="/dashboard"
        className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-6 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-all duration-200 hover:opacity-90"
      >
        Voir le tableau de bord
      </Link>
    </div>
  )
}
