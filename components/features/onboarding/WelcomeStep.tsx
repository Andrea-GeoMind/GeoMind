'use client'

import { useRouter } from 'next/navigation'
import { Sparkles, Globe, BarChart3, Lightbulb } from 'lucide-react'

export function WelcomeStep() {
  const router = useRouter()

  const features = [
    {
      icon: Globe,
      title: 'Renseignez votre site web',
      description: 'URL, langue et marché cible — moins d’une minute',
    },
    {
      icon: BarChart3,
      title: 'Analyse de visibilité IA',
      description: 'ChatGPT, Perplexity, Gemini & Claude interrogés',
    },
    {
      icon: Lightbulb,
      title: 'Score GEO + recommandations',
      description: "Plan d’action concret pour progresser",
    },
  ]

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      {/* Hero icon */}
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
        <Sparkles className="h-10 w-10 text-indigo-600" />
      </div>

      {/* Title */}
      <div className="space-y-3">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Bienvenue sur{' '}
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            GEOMIND
          </span>
        </h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground leading-relaxed">
          Découvrez si votre site est cité par les IA et obtenez un plan d&apos;action
          concret pour améliorer votre visibilité dans les IA.
        </p>
      </div>

      {/* Feature list */}
      <div className="w-full space-y-3">
        {features.map((feature, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-left"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
              <feature.icon className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{feature.title}</p>
              <p className="text-xs text-muted-foreground">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => router.push('/onboarding?step=2')}
        className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:opacity-90 hover:shadow-xl hover:shadow-indigo-500/30 active:scale-[0.98]"
      >
        Commencer l&apos;audit gratuit
      </button>
    </div>
  )
}
