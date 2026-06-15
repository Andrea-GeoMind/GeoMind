'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle, Rocket, Tag, Users, MessageSquare, X, Plus, AlertTriangle } from 'lucide-react'
import { validateAndLaunchAction } from '@/app/(app)/onboarding/validate-and-launch-action'
import { launchDiscoveryAction } from '@/app/(app)/sites/[siteId]/discovery/launch-action'
import type { AnalysisProgressResponse } from '@/app/api/analysis/[analysisId]/progress/route'

// ─── Types ────────────────────────────────────────────────────────────────────

type DiscoveryData = {
  description: string
  keywords: string[]
  competitors: { id: string; url: string; name: string }[]
  prompts: { id: string; text: string; isNeutral: boolean }[]
}

type Phase = 'crawling' | 'reviewing' | 'launching' | 'analyzing' | 'done' | 'failed'

/** Quand un échec est détecté : quoi proposer à l'utilisateur. */
type Failure = {
  title: string
  message: string
  /** 'discovery' → bouton Réessayer relance la découverte ; 'wait' → continuer d'attendre ; 'overview' → lien vue d'ensemble */
  kind: 'discovery' | 'analysis-error' | 'analysis-slow'
}

// La découverte est annoncée à 20-40 s — au-delà de 2 min, quelque chose
// cloche (site inaccessible, crawl bloqué) : on arrête d'attendre en silence.
const DISCOVERY_TIMEOUT_S = 120
// L'analyse est annoncée à 2-4 min — au-delà de 10 min on propose de sortir.
const ANALYSIS_TIMEOUT_S = 600
// Au-delà de 4 polls consécutifs en échec (~20 s), on signale la connexion.
const MAX_POLL_FAILURES = 4

const CRAWL_STEPS = [
  { label: 'Crawl des pages de votre site…', at: 0 },
  { label: 'Analyse de votre activité…', at: 12 },
  { label: 'Génération des mots-clés…', at: 22 },
  { label: 'Création des prompts neutres…', at: 30 },
]

// ─── Hook : intervalle pausé quand l'onglet est caché ─────────────────────────

function useActiveInterval(cb: () => void, delay: number) {
  const cbRef = useRef(cb)
  cbRef.current = cb
  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null

    function start() {
      if (id) return
      id = setInterval(() => cbRef.current(), delay)
    }
    function stop() {
      if (id) { clearInterval(id); id = null }
    }

    function onVisibility() {
      if (document.hidden) { stop() } else { start() }
    }

    start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [delay])
}

// ─── Sous-composant : étape Crawl ─────────────────────────────────────────────

function CrawlingPhase({ elapsed }: { elapsed: number }) {
  const step = [...CRAWL_STEPS].reverse().find((s) => elapsed >= s.at) ?? CRAWL_STEPS[0]!
  // Plafonne à 90% — les derniers % ne se débloquent que quand le job répond
  const pct = Math.min(Math.round((elapsed / 40) * 90), 90)

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold tracking-tight">Découverte de votre site</h2>
        <p className="text-sm text-muted-foreground">
          GeoMind crawle votre site et génère votre profil GEO.
          <br />
          Cette étape prend 20 à 40 secondes.
        </p>
      </div>
      <div className="w-full space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="font-medium text-indigo-600">{step.label}</span>
          <span className="tabular-nums">{elapsed} s</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-[width] duration-1000 ease-linear"
            style={{ width: `${Math.max(pct, 3)}%` }}
          />
        </div>
        <p className="text-right text-xs tabular-nums text-muted-foreground/60">{pct}%</p>
      </div>
    </div>
  )
}

// ─── Sous-composant : étape Révision ──────────────────────────────────────────

function ReviewingPhase({
  data,
  onValidate,
}: {
  data: DiscoveryData
  onValidate: (edits: { description: string; keywords: string[]; competitors: { url: string; name: string }[]; prompts: { text: string }[] }) => void
}) {
  const [description, setDescription] = useState(data.description)
  const [keywords, setKeywords] = useState<string[]>(data.keywords)
  const [kwInput, setKwInput] = useState('')
  const [competitorsList, setCompetitorsList] = useState(
    data.competitors.map((c) => ({ url: c.url, name: c.name }))
  )
  const [promptsList, setPromptsList] = useState(data.prompts.map((p) => ({ text: p.text })))
  const [isSubmitting, setIsSubmitting] = useState(false)

  function addKeyword() {
    const kw = kwInput.trim()
    if (kw && !keywords.includes(kw)) setKeywords((prev) => [...prev, kw])
    setKwInput('')
  }

  function removeKeyword(kw: string) {
    setKeywords((prev) => prev.filter((k) => k !== kw))
  }

  function handleSubmit() {
    setIsSubmitting(true)
    onValidate({ description, keywords, competitors: competitorsList, prompts: promptsList })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/30">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight">Profil GEO généré !</h2>
          <p className="text-xs text-muted-foreground">Vérifiez et ajustez avant de lancer l&apos;analyse.</p>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <MessageSquare size={12} /> Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Mots-clés + Concurrents côte à côte sur grand écran */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Mots-clés */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Tag size={12} /> Mots-clés
          </label>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((kw) => (
              <span
                key={kw}
                className="flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-500/20"
              >
                {kw}
                <button onClick={() => removeKeyword(kw)} className="ml-0.5 hover:text-destructive">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={kwInput}
              onChange={(e) => setKwInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
              placeholder="Ajouter un mot-clé…"
              className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={addKeyword}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted"
            >
              <Plus size={12} /> Ajouter
            </button>
          </div>
        </div>

        {/* Concurrents */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Users size={12} /> Concurrents détectés
          </label>
          <div className="space-y-1.5">
            {competitorsList.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={c.url}
                  onChange={(e) => setCompetitorsList((prev) => prev.map((x, j) => j === i ? { ...x, url: e.target.value } : x))}
                  placeholder="https://concurrent.fr"
                  className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={() => setCompetitorsList((prev) => prev.filter((_, j) => j !== i))}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setCompetitorsList((prev) => [...prev, { url: '', name: '' }])}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Plus size={12} /> Ajouter un concurrent
            </button>
          </div>
        </div>
      </div>

      {/* Prompts */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Rocket size={12} /> Questions de test pour les IA
        </label>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Les questions que vos clients poseraient à ChatGPT — sans citer votre nom, sinon le
          test serait biaisé. Modifiez-les librement.
        </p>
        <div className="space-y-2">
          {promptsList.map((p, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-2 shrink-0 text-xs font-bold text-muted-foreground">{i + 1}.</span>
              <textarea
                value={p.text}
                onChange={(e) => setPromptsList((prev) => prev.map((x, j) => j === i ? { text: e.target.value } : x))}
                rows={2}
                className="flex-1 resize-none rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={() => setPromptsList((prev) => prev.filter((_, j) => j !== i))}
                className="mt-2 text-muted-foreground hover:text-destructive"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-all hover:opacity-90 disabled:opacity-60"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Lancement…
          </span>
        ) : (
          'Valider et lancer l\'analyse GEO →'
        )}
      </button>
    </div>
  )
}

// ─── Sous-composant : étape Analyse ───────────────────────────────────────────
// Reçoit progress/step du parent (un seul polling, pas de double fetch)

function AnalyzingPhase({
  progress,
  step,
  elapsed,
  connectionUnstable,
}: {
  progress: number
  step: string
  elapsed: number
  connectionUnstable: boolean
}) {
  const minutes = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const timeStr = minutes > 0 ? `${minutes} min ${String(secs).padStart(2, '0')} s` : `${secs} s`

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg">
        <Loader2 className="h-10 w-10 animate-spin text-white" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold tracking-tight">Analyse GEO en cours</h2>
        <p className="text-sm text-muted-foreground">
          GEOMIND interroge ChatGPT, Perplexity, Gemini et Claude.
          <br />
          Résultats dans 2 à 4 minutes.
        </p>
      </div>
      <div className="w-full space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="font-medium text-indigo-600">{step}</span>
          <span className="tabular-nums">{timeStr}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-[width] duration-700 ease-out"
            style={{ width: `${Math.max(progress, 2)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground/60">
          <span>Mise à jour toutes les 5 s</span>
          <span className="tabular-nums">{progress}%</span>
        </div>
      </div>
      {connectionUnstable && (
        <p className="flex items-center gap-1.5 rounded-lg border border-amber-300/50 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <AlertTriangle size={12} className="shrink-0" />
          Connexion instable — on continue d&apos;essayer, vos résultats ne sont pas perdus.
        </p>
      )}
      <p className="text-xs text-muted-foreground/50">
        Vous pouvez fermer cet onglet : l’analyse continue en arrière-plan et vos résultats vous attendront sur la Vue d’ensemble.
      </p>
    </div>
  )
}

// ─── Sous-composant : étape Échec ─────────────────────────────────────────────

function FailedPhase({
  failure,
  onRetryDiscovery,
  onKeepWaiting,
  onGoToOverview,
  isRetrying,
}: {
  failure: Failure
  onRetryDiscovery: () => void
  onKeepWaiting: () => void
  onGoToOverview: () => void
  isRetrying: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/30">
        <AlertTriangle className="h-8 w-8 text-amber-600" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold tracking-tight">{failure.title}</h2>
        <p className="text-sm text-muted-foreground">{failure.message}</p>
      </div>
      <div className="flex w-full flex-col gap-2">
        {failure.kind === 'discovery' && (
          <button
            onClick={onRetryDiscovery}
            disabled={isRetrying}
            className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 disabled:opacity-60"
          >
            {isRetrying ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Relance…
              </span>
            ) : (
              'Réessayer la découverte'
            )}
          </button>
        )}
        {failure.kind === 'analysis-slow' && (
          <button
            onClick={onKeepWaiting}
            className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90"
          >
            Continuer d&apos;attendre
          </button>
        )}
        <button
          onClick={onGoToOverview}
          className="w-full rounded-lg border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Aller à la vue d&apos;ensemble
        </button>
      </div>
    </div>
  )
}

// ─── Composant principal ───────────────────────────────────────────────────────

export function OnboardingFlowModal({ siteId }: { siteId: string }) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('crawling')
  const [discoveryData, setDiscoveryData] = useState<DiscoveryData | null>(null)
  const [analysisId, setAnalysisId] = useState<string | null>(null)
  const [analysisProgress, setAnalysisProgress] = useState(2)
  const [analysisStep, setAnalysisStep] = useState('Démarrage de l\'analyse…')
  const [analysisElapsed, setAnalysisElapsed] = useState(0)
  const [crawlElapsed, setCrawlElapsed] = useState(0)
  const [pollFailures, setPollFailures] = useState(0)
  const [failure, setFailure] = useState<Failure | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Bloquer fermeture de l'onglet
  useEffect(() => {
    if (phase === 'done' || phase === 'failed') return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [phase])

  // Poll découverte (phase crawling) — toutes les 5s, pausé quand onglet caché
  useActiveInterval(
    useCallback(() => {
      if (phase !== 'crawling') return
      fetch(`/api/site/${siteId}/discovery-status`)
        .then((r) => r.ok ? r.json() : null)
        .then((json) => {
          setPollFailures(0)
          if (json?.ready) {
            setDiscoveryData(json.data as DiscoveryData)
            setPhase('reviewing')
          }
        })
        .catch(() => setPollFailures((n) => n + 1))
    }, [phase, siteId]),
    5000
  )

  // Poll analyse (phase analyzing) — toutes les 5s, unique source de vérité
  useActiveInterval(
    useCallback(() => {
      if (phase !== 'analyzing' || !analysisId) return
      fetch(`/api/analysis/${analysisId}/progress`)
        .then((r) => r.ok ? r.json() : null)
        .then((json: AnalysisProgressResponse | null) => {
          if (!json) {
            setPollFailures((n) => n + 1)
            return
          }
          setPollFailures(0)
          setAnalysisProgress(json.progress)
          setAnalysisStep(json.step)
          if (json.status === 'success') setPhase('done')
          if (json.status === 'error') {
            setFailure({
              kind: 'analysis-error',
              title: 'L\'analyse a échoué',
              message:
                'Un incident technique a interrompu l\'analyse. Vos crédits ont été remboursés automatiquement — vous pouvez la relancer depuis la vue d\'ensemble.',
            })
            setPhase('failed')
          }
        })
        .catch(() => setPollFailures((n) => n + 1))
    }, [phase, analysisId]),
    5000
  )

  // Timers temps écoulé (pausés quand l'onglet est caché)
  useActiveInterval(
    useCallback(() => {
      if (phase === 'analyzing') setAnalysisElapsed((s) => s + 1)
      if (phase === 'crawling') setCrawlElapsed((s) => s + 1)
    }, [phase]),
    1000
  )

  // Timeouts : on ne laisse jamais l'utilisateur attendre dans le vide.
  useEffect(() => {
    if (phase === 'crawling' && crawlElapsed > DISCOVERY_TIMEOUT_S) {
      setFailure({
        kind: 'discovery',
        title: 'La découverte prend trop de temps',
        message:
          'Votre site est peut-être lent, inaccessible, ou bloque les robots. Vérifiez que l\'adresse est correcte et accessible, puis réessayez.',
      })
      setPhase('failed')
    }
    if (phase === 'analyzing' && analysisElapsed > ANALYSIS_TIMEOUT_S) {
      setFailure({
        kind: 'analysis-slow',
        title: 'L\'analyse prend plus de temps que prévu',
        message:
          'Elle continue de tourner en arrière-plan — vous pouvez attendre encore ou consulter la vue d\'ensemble : les résultats s\'y afficheront dès qu\'ils seront prêts.',
      })
      setPhase('failed')
    }
  }, [phase, crawlElapsed, analysisElapsed])

  // Redirect quand done
  useEffect(() => {
    if (phase === 'done') {
      router.push(`/sites/${siteId}/overview`)
    }
  }, [phase, siteId, router])

  const handleValidate = useCallback(async (edits: Parameters<typeof validateAndLaunchAction>[1]) => {
    setPhase('launching')
    const result = await validateAndLaunchAction(siteId, edits)
    if ('error' in result) {
      setError(result.error)
      setPhase('reviewing')
      return
    }
    setAnalysisElapsed(0)
    setAnalysisId(result.analysisId)
    setPhase('analyzing')
  }, [siteId])

  const handleRetryDiscovery = useCallback(async () => {
    setIsRetrying(true)
    const result = await launchDiscoveryAction(siteId)
    setIsRetrying(false)
    if (result.error) {
      setFailure((f) => (f ? { ...f, message: result.error! } : f))
      return
    }
    setFailure(null)
    setCrawlElapsed(0)
    setPollFailures(0)
    setPhase('crawling')
  }, [siteId])

  const handleKeepWaiting = useCallback(() => {
    setFailure(null)
    setAnalysisElapsed(0)
    setPhase('analyzing')
  }, [])

  const handleGoToOverview = useCallback(() => {
    router.push(`/sites/${siteId}/overview`)
  }, [router, siteId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className={['w-full px-4', phase === 'reviewing' ? 'max-w-3xl' : 'max-w-lg'].join(' ')}>
        <div
          className={[
            'rounded-2xl border border-border bg-card shadow-2xl',
            phase === 'reviewing' ? 'max-h-[90vh] overflow-y-auto p-6 sm:p-8' : 'p-8 sm:p-10',
          ].join(' ')}
        >
          {phase === 'crawling' && <CrawlingPhase elapsed={crawlElapsed} />}

          {phase === 'reviewing' && discoveryData && (
            <ReviewingPhase data={discoveryData} onValidate={handleValidate} />
          )}

          {phase === 'launching' && (
            <div className="flex flex-col items-center gap-6 py-4 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
              <p className="text-sm font-medium">Lancement de l&apos;analyse…</p>
            </div>
          )}

          {phase === 'analyzing' && analysisId && (
            <AnalyzingPhase
              progress={analysisProgress}
              step={analysisStep}
              elapsed={analysisElapsed}
              connectionUnstable={pollFailures >= MAX_POLL_FAILURES}
            />
          )}

          {phase === 'failed' && failure && (
            <FailedPhase
              failure={failure}
              onRetryDiscovery={handleRetryDiscovery}
              onKeepWaiting={handleKeepWaiting}
              onGoToOverview={handleGoToOverview}
              isRetrying={isRetrying}
            />
          )}

          {phase === 'done' && (
            <div className="flex flex-col items-center gap-6 py-4 text-center">
              <CheckCircle className="h-12 w-12 text-emerald-500" />
              <p className="text-lg font-bold">Analyse terminée !</p>
              <p className="text-sm text-muted-foreground">Redirection vers vos résultats…</p>
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
