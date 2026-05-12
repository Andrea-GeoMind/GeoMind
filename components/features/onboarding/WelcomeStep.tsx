'use client'

import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function WelcomeStep() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          Bienvenue sur GEOMIND
        </h1>
        <p className="max-w-md text-muted-foreground">
          Découvrez si votre site est cité par les IA comme ChatGPT, Perplexity ou
          Gemini — et obtenez un plan d&apos;action concret pour améliorer votre
          visibilité.
        </p>
      </div>

      <div className="flex flex-col gap-2 text-left text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
          <span>Renseignez votre site web</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">2</span>
          <span>Nous analysons votre visibilité dans les IA</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">3</span>
          <span>Recevez votre score GEO et vos recommandations</span>
        </div>
      </div>

      <Button size="lg" onClick={() => router.push('/onboarding?step=2')} className="w-full max-w-xs">
        Commencer
      </Button>
    </div>
  )
}
