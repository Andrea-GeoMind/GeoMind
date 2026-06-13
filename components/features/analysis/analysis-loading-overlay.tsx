'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import type { AnalysisProgressResponse } from '@/app/api/analysis/[analysisId]/progress/route'
import { toast } from '@/components/ui/use-toast'
import { useAnalysisLock } from './analysis-lock-context'

type Props = {
  siteName: string | null
  analysisId: string | null
}

export function AnalysisLoadingOverlay({ siteName, analysisId }: Props) {
  const router = useRouter()
  const { unlockAnalysis } = useAnalysisLock()
  const [progress, setProgress] = useState(2)
  const [step, setStep] = useState('Démarrage de l\'analyse…')
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const doneRef = useRef(false)

  // Chronomètre
  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // Polling du vrai état DB toutes les 3 secondes.
  // L'overlay est seule source de vérité pendant l'analyse : il interroge une
  // route légère (compteurs) plutôt que de déclencher un router.refresh() de
  // toute la page overview en boucle (cause des ralentissements navigateur).
  // À la fin, un SEUL router.refresh() recharge les résultats puis on déverrouille.
  useEffect(() => {
    if (!analysisId) return

    async function fetchProgress() {
      if (doneRef.current) return
      try {
        const res = await fetch(`/api/analysis/${analysisId}/progress`)
        if (!res.ok) return
        const data: AnalysisProgressResponse = await res.json()
        setProgress(data.progress)
        setStep(data.step)

        if (data.status === 'success' || data.status === 'error') {
          doneRef.current = true
          if (intervalRef.current) clearInterval(intervalRef.current)
          router.refresh()
          unlockAnalysis()
          if (data.status === 'success') {
            toast({
              title: 'Analyse terminée',
              description: 'Votre score GEO est maintenant disponible.',
            })
          } else {
            toast({
              title: 'Analyse échouée',
              description: "Une erreur est survenue lors de l'analyse.",
              variant: 'destructive',
            })
          }
        }
      } catch {
        // Silencieux — on garde le dernier état connu
      }
    }

    fetchProgress()
    intervalRef.current = setInterval(fetchProgress, 3000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [analysisId, router, unlockAnalysis])

  // Prévenir fermeture de l'onglet
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  const minutes = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const timeStr = minutes > 0 ? `${minutes} min ${String(secs).padStart(2, '0')} s` : `${secs} s`

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95"
      role="dialog"
      aria-modal="true"
      aria-label="Analyse en cours"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-8 px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg">
          <Loader2 className="h-10 w-10 animate-spin text-white" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-extrabold tracking-tight text-foreground">
            Analyse en cours
          </h2>
          {siteName && (
            <p className="text-sm text-muted-foreground">{siteName}</p>
          )}
        </div>

        <div className="w-full space-y-4">
          {/* Étape courante */}
          <p className="min-h-[1.25rem] text-sm font-medium text-primary">{step}</p>

          {/* Barre de progression réelle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="tabular-nums">{timeStr}</span>
              <span className="tabular-nums font-medium">{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700 ease-out"
                style={{ width: `${Math.max(progress, 2)}%` }}
              />
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground/50">
          Restez sur cette fenêtre pour voir vos résultats en temps réel
        </p>
      </div>
    </div>
  )
}
