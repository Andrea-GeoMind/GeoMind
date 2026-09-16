'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Loader2,
  MailCheck,
  Search,
  XCircle,
} from 'lucide-react'
import { ENGINE_COUNT } from '@/lib/ai/connectors/base'
import { ENGINE_LIST } from '@/lib/analysis/authority-table'
import {
  EXPRESS_UNKNOWNS,
  EXPRESS_PILLARS_COVERED,
  PILLAR_COUNT,
} from '@/lib/analysis/express-audit'
import { claimExpressAudit } from '@/app/actions/public-audit'
import { cn } from '@/lib/utils'

/**
 * Audit express sans inscription (PLAN item 20) — premier étage du tunnel.
 *
 * Le résultat est délibérément en deux temps :
 *  1. la note technique telle quelle (ce que les 11 vérifications mesurent) ;
 *  2. « ce qu'on ne sait pas encore » — les deux piliers que l'express ne
 *     couvre pas du tout.
 *
 * Sans le second bloc, un site correct décroche 10/11 et repart rassuré, alors
 * que la note complète (moyenne des trois piliers) est bien plus basse. Les
 * inconnues ne sont donc pas un argument de vente : c'est le périmètre
 * manquant, énoncé. Cf. lib/analysis/express-audit.ts.
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
  claimToken?: string
  error?: string
}

type Status = 'idle' | 'loading' | 'done' | 'error'

const LOADING_STEPS = [
  'Lecture de votre page d’accueil…',
  'Vérification de robots.txt et sitemap…',
  'Recherche des données structurées…',
  'Calcul de votre note technique…',
]

/** `hero` : posé sur le fond navy. `band` : bandeau autonome sur fond clair. */
export type ExpressAuditVariant = 'hero' | 'band'

export function ExpressAudit({ variant = 'hero' }: { variant?: ExpressAuditVariant }) {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [stepIdx, setStepIdx] = useState(0)
  const [result, setResult] = useState<AuditResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Capture d'email en fin d'audit
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [isSending, startSending] = useTransition()

  const onNavy = variant === 'hero'

  async function run(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim() || status === 'loading') return
    if (!url.includes('.') || url.trim().includes(' ')) {
      setError('Entrez l\'adresse de votre site — exemple : monentreprise.fr')
      setStatus('error')
      return
    }
    setStatus('loading')
    setError(null)
    setResult(null)
    setEmailSent(false)
    setEmailError(null)
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

  function submitEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!result?.claimToken || isSending) return
    setEmailError(null)
    startSending(async () => {
      const res = await claimExpressAudit(email, result.claimToken as string)
      if (res.error) setEmailError(res.error)
      else setEmailSent(true)
    })
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
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#34D399] px-6 py-3 text-sm font-semibold text-[#0B3B2E] shadow-lg shadow-black/20 transition-colors hover:bg-[#2bbd88] disabled:opacity-60"
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
      <p
        className={cn(
          'mt-2 text-center text-xs sm:text-left',
          onNavy ? 'text-[#7C92AC]' : 'text-muted-foreground'
        )}
      >
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
        <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-card text-left shadow-lg">
          {/* ── 1 · La note technique, telle quelle ─────────────────── */}
          <div className="p-6">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Technique — {result.domain}
              </p>
              <p className="text-sm font-semibold text-foreground">
                {result.score}
                <span className="font-normal text-muted-foreground">/100</span>
              </p>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-[--score-good-500]"
                style={{ width: `${result.score}%` }}
              />
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              {passed.length} des {result.checks.length} vérifications de base passent.{' '}
              <strong className="font-semibold text-foreground">
                {EXPRESS_PILLARS_COVERED} pilier sur {PILLAR_COUNT}
              </strong>{' '}
              — la note complète est la moyenne des trois.
            </p>

            {failed.length > 0 && (
              <div className="mt-4 space-y-2.5">
                {failed.slice(0, 3).map((c) => (
                  <div key={c.key} className="flex items-start gap-2.5">
                    <XCircle size={15} className="mt-0.5 shrink-0 text-[--score-bad-500]" />
                    <div>
                      <p className="text-sm font-semibold leading-snug text-foreground">{c.label}</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">{c.hint}</p>
                    </div>
                  </div>
                ))}
                {failed.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    + {failed.length - 3} autre{failed.length - 3 > 1 ? 's' : ''} point
                    {failed.length - 3 > 1 ? 's' : ''} technique
                    {failed.length - 3 > 1 ? 's' : ''}.
                  </p>
                )}
              </div>
            )}

            {failed.length === 0 && (
              <div className="mt-4 flex items-start gap-2.5">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[--score-good-500]" />
                <p className="text-sm text-muted-foreground">
                  Les bases techniques sont en place.
                </p>
              </div>
            )}
          </div>

          {/* ── 2 · Ce qu'on ne sait pas encore ─────────────────────── */}
          <div className="border-t border-border bg-muted/40 p-6">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-foreground">
                Ce qu’on ne sait pas encore
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                {PILLAR_COUNT - EXPRESS_PILLARS_COVERED} piliers
              </p>
            </div>

            <dl className="mt-4 space-y-3.5">
              {EXPRESS_UNKNOWNS.map(({ key, question, detail }) => (
                <div key={key} className="flex items-start gap-2.5">
                  <HelpCircle size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden />
                  <div>
                    <dt className="text-sm font-semibold leading-snug text-foreground">
                      {question}
                    </dt>
                    <dd className="text-xs leading-relaxed text-muted-foreground">{detail}</dd>
                  </div>
                </div>
              ))}
            </dl>

            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Ces trois réponses demandent d’interroger réellement les {ENGINE_COUNT} IA — c’est
              l’analyse complète.
            </p>
          </div>

          {/* ── 3 · Capture d'email → compte en un clic ─────────────── */}
          <div className="border-t border-border p-6">
            {emailSent ? (
              <div className="flex items-start gap-3">
                <MailCheck size={18} className="mt-0.5 shrink-0 text-[--score-good-500]" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Lien envoyé à {email}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Ouvrez-le pour accéder à votre rapport : votre compte et le site{' '}
                    {result.domain} sont créés en un clic, sans mot de passe. Pensez à vérifier vos
                    indésirables.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm font-bold text-foreground">
                  Recevoir le rapport complet et savoir si les IA vous citent
                </p>
                <form onSubmit={submitEmail} className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.fr"
                    autoComplete="email"
                    aria-label="Votre adresse email"
                    className="flex-1 rounded-xl border border-border bg-background px-3.5 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !result.claimToken}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-colors hover:bg-primary/90 disabled:opacity-60"
                  >
                    {isSending ? <Loader2 size={15} className="animate-spin" /> : 'Recevoir'}
                    {!isSending && <ArrowRight size={15} />}
                  </button>
                </form>

                {emailError && <p className="mt-2 text-xs text-destructive">{emailError}</p>}

                <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground">
                  Votre audit de {result.domain} sera rattaché au compte. Votre email sert
                  uniquement à vous envoyer ce lien et votre rapport — pas de démarchage.{' '}
                  <Link
                    href="/legal/privacy"
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    Politique de confidentialité
                  </Link>
                </p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Sans carte bancaire · {ENGINE_LIST} interrogés réellement
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
