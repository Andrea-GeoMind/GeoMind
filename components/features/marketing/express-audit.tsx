'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Loader2, Search, XCircle } from 'lucide-react'

/**
 * Audit express sans inscription (PLAN item 20) — le visiteur tape son URL et
 * voit un mini-score en ~10 s. Teaser honnête : 11 vérifications instantanées,
 * l'audit complet (citations IA réelles, 57 règles, plan d'action) est derrière
 * l'inscription gratuite.
 */

interface ExpressCheck {
  key: string
  label: string
  ok: boolean
  hint: string
}

interface AuditResponse {
  domain: string
  score: number
  checks: ExpressCheck[]
  error?: string
}

type Status = 'idle' | 'loading' | 'done' | 'error'

const LOADING_STEPS = [
  'Lecture de votre page d’accueil…',
  'Vérification de robots.txt et sitemap…',
  'Recherche des données structurées…',
  'Calcul de votre score express…',
]

export function ExpressAudit() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [stepIdx, setStepIdx] = useState(0)
  const [result, setResult] = useState<AuditResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim() || status === 'loading') return
    setStatus('loading')
    setError(null)
    setResult(null)
    setStepIdx(0)

    const ticker = setInterval(
      () => setStepIdx((i) => Math.min(i + 1, LOADING_STEPS.length - 1)),
      2_500
    )

    try {
      const res = await fetch('/api/public-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const json = (await res.json()) as AuditResponse & { error?: string }
      if (!res.ok || json.error) {
        setError(json.error ?? 'Une erreur est survenue. Réessayez.')
        setStatus('error')
        return
      }
      setResult(json)
      setStatus('done')
    } catch {
      setError('Connexion impossible. Réessayez dans un instant.')
      setStatus('error')
    } finally {
      clearInterval(ticker)
    }
  }

  const failed = result?.checks.filter((c) => !c.ok) ?? []
  const passed = result?.checks.filter((c) => c.ok) ?? []

  return (
    <div className="mx-auto w-full max-w-2xl">
      <form onSubmit={run} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="votresite.fr"
            aria-label="Adresse de votre site"
            className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200/60 transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {status === 'loading' ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <>
              Tester mon site
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>
      <p className="mt-2 text-center text-xs text-muted-foreground sm:text-left">
        Gratuit, sans inscription — 11 vérifications en quelques secondes
      </p>

      {status === 'loading' && (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <Loader2 size={15} className="shrink-0 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{LOADING_STEPS[stepIdx]}</p>
        </div>
      )}

      {status === 'error' && error && (
        <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {status === 'done' && result && (
        <div className="mt-5 rounded-2xl border border-border bg-card p-6 text-left shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Score express — {result.domain}
              </p>
              <p className="mt-1 text-4xl font-extrabold text-foreground">
                {result.score}
                <span className="text-base font-medium text-muted-foreground">/100</span>
              </p>
            </div>
            <p className="max-w-[220px] text-xs leading-relaxed text-muted-foreground">
              {passed.length}/{result.checks.length} vérifications de base réussies — l&apos;audit
              complet en couvre 57, plus vos citations réelles dans les IA.
            </p>
          </div>

          {failed.length > 0 && (
            <div className="mt-5 space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                À corriger en priorité
              </p>
              {failed.slice(0, 4).map((c) => (
                <div key={c.key} className="flex items-start gap-2.5">
                  <XCircle size={15} className="mt-0.5 shrink-0 text-[--score-bad-500]" />
                  <div>
                    <p className="text-sm font-semibold leading-snug text-foreground">{c.label}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{c.hint}</p>
                  </div>
                </div>
              ))}
              {failed.length > 4 && (
                <p className="text-xs text-muted-foreground">
                  + {failed.length - 4} autre{failed.length - 4 > 1 ? 's' : ''} point
                  {failed.length - 4 > 1 ? 's' : ''} détecté
                  {failed.length - 4 > 1 ? 's' : ''}…
                </p>
              )}
            </div>
          )}

          {failed.length === 0 && (
            <div className="mt-5 flex items-start gap-2.5">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[--score-good-500]" />
              <p className="text-sm text-muted-foreground">
                Les bases sont en place. Reste la vraie question : les IA vous citent-elles ?
              </p>
            </div>
          )}

          <Link
            href="/signup"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200/60 transition-opacity hover:opacity-90"
          >
            Voir si ChatGPT me cite — audit complet offert
            <ArrowRight size={15} />
          </Link>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Sans carte bancaire · ChatGPT, Perplexity, Gemini et Claude interrogés réellement
          </p>
        </div>
      )}
    </div>
  )
}
