'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Clock, Loader2, Sparkles, Zap } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { IssueSeverityBadge } from '@/components/features/technical/issue-severity-badge'
import { penaltyToSeverity, type TechnicalIssueRow } from '@/components/features/technical/issue-card'
import {
  TECHNICAL_RECOMMENDATIONS,
  type TechnicalRecommendation,
} from '@/lib/analysis/technical/recommendations'
import { generateCompleteRecommendation } from '@/app/(app)/sites/[siteId]/recommendation-actions'
import { FixDetails } from '@/components/features/fixes/fix-details'
import { useCoach } from '@/components/features/coach/coach-provider'
import type { ActionFix } from '@/lib/analysis/action-fixes'

const EFFORT_LABELS: Record<TechnicalRecommendation['effort'], string> = {
  low: 'Rapide',
  medium: 'Quelques heures',
  high: 'Effort important',
}

const EFFORT_ICONS: Record<TechnicalRecommendation['effort'], React.ReactNode> = {
  low: <Zap size={12} className="shrink-0 text-[--score-good-500]" />,
  medium: <Clock size={12} className="shrink-0 text-[--score-mid-500]" />,
  high: <Clock size={12} className="shrink-0 text-[--score-bad-500]" />,
}

interface RecommendationSheetProps {
  issue: TechnicalIssueRow | null
  isPro: boolean
  isBusiness: boolean
  /** Correctif prêt à coller pour cette règle, si disponible (ouvert à tous les plans). */
  fix?: ActionFix
  onClose: () => void
}

export function RecommendationSheet({ issue, isPro, isBusiness, fix, onClose }: RecommendationSheetProps) {
  const { openWithIssue } = useCoach()
  const rec = issue ? TECHNICAL_RECOMMENDATIONS[issue.ruleKey] : undefined
  const severity = issue ? penaltyToSeverity(issue.penalty) : undefined
  const [showComplete, setShowComplete] = useState(false)
  const [completeContent, setCompleteContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  async function handleToggleComplete() {
    if (!issue) return
    if (showComplete) {
      setShowComplete(false)
      return
    }
    if (completeContent) {
      setShowComplete(true)
      return
    }
    setIsLoading(true)
    setLoadError(null)
    const result = await generateCompleteRecommendation(issue.id, 'technical')
    setIsLoading(false)
    if ('error' in result) {
      setLoadError(result.error)
      return
    }
    setCompleteContent(result.content)
    setShowComplete(true)
  }

  function handleClose() {
    setShowComplete(false)
    setCompleteContent(null)
    setLoadError(null)
    onClose()
  }

  return (
    <Sheet open={issue !== null} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        {issue && severity && (
          <>
            <SheetHeader className="mb-6">
              <div className="mb-3 flex items-center gap-2 flex-wrap">
                <IssueSeverityBadge severity={severity} />
                {rec && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {EFFORT_ICONS[rec.effort]}
                    {EFFORT_LABELS[rec.effort]}
                  </span>
                )}
              </div>
              <SheetTitle className="text-base font-extrabold leading-snug tracking-tight">
                {issue.title}
              </SheetTitle>
              <SheetDescription className="text-sm leading-relaxed">{issue.description}</SheetDescription>
            </SheetHeader>

            {/* Demander à GEO : engage la conversation contextualisée sur ce problème */}
            <button
              type="button"
              onClick={() => {
                openWithIssue({ title: issue.title, description: issue.description })
                onClose()
              }}
              className="mb-5 inline-flex w-fit items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              <Sparkles size={13} aria-hidden />
              Demander à GEO de m’aider
            </button>

            {/* Correctif prêt à coller (ouvert à tous les plans) */}
            {fix && (
              <div className="mb-5">
                <FixDetails fix={fix} />
              </div>
            )}

            {/* Toggle version complète */}
            {isPro && (
              <div className="mb-5">
                <span title={isBusiness ? undefined : 'Disponible avec le plan Business'}>
                  <button
                    type="button"
                    onClick={handleToggleComplete}
                    disabled={!isBusiness || isLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 size={12} className="shrink-0 animate-spin" />
                    ) : (
                      <Sparkles size={12} className="shrink-0 text-primary" />
                    )}
                    {showComplete ? 'Version simplifiée' : 'Version complète IA'}
                    {!isBusiness && (
                      <span className="ml-1 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        Business
                      </span>
                    )}
                  </button>
                </span>
                {loadError && (
                  <p className="mt-2 text-xs text-destructive">{loadError}</p>
                )}
              </div>
            )}

            {/* Recommendation body */}
            <div className="relative flex-1">
              {showComplete && completeContent ? (
                <div className="prose prose-sm max-w-none text-foreground">
                  <MarkdownContent content={completeContent} />
                </div>
              ) : rec ? (
                <div className={isPro ? undefined : 'max-h-32 overflow-hidden'}>
                  <section className="mb-5 rounded-xl border border-border bg-muted/30 p-4">
                    <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Comment corriger
                    </h4>
                    <p className="text-sm leading-relaxed text-foreground">{rec.how}</p>
                  </section>
                  <section className="rounded-xl border border-border bg-muted/30 p-4">
                    <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Impact attendu
                    </h4>
                    <p className="text-sm leading-relaxed text-foreground">{rec.impact}</p>
                  </section>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucune recommandation disponible pour cette règle.
                </p>
              )}

              {/* Free plan overlay */}
              {!isPro && rec && (
                <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 rounded-b-xl bg-gradient-to-t from-background via-background/95 to-transparent pb-6 pt-16 text-center">
                  <p className="text-sm font-semibold text-foreground">
                    Passez en Pro pour voir la fiche complète
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Accédez à toutes les recommandations détaillées et au plan d&apos;action.
                  </p>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Passer en Pro
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
              )}
            </div>

            {/* Sample URLs */}
            {issue.sampleUrls.length > 0 && isPro && (
              <section className="mt-6 border-t border-border pt-5">
                <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Pages concernées
                </h4>
                <ul className="space-y-1.5">
                  {issue.sampleUrls.slice(0, 5).map((url) => (
                    <li key={url}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                      >
                        <span className="max-w-xs truncate">{url}</span>
                        <ArrowUpRight size={10} className="shrink-0" />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

// Minimal Markdown renderer for the complete version (headers + paragraphs + code blocks)
function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={i} className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground first:mt-0">
          {line.slice(3)}
        </h3>
      )
    } else if (line.startsWith('# ')) {
      elements.push(
        <h2 key={i} className="mb-2 mt-5 text-sm font-extrabold tracking-tight first:mt-0">
          {line.slice(2)}
        </h2>
      )
    } else if (line.startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <pre key={i} className="my-3 overflow-x-auto rounded-xl bg-muted p-3 text-xs">
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
    } else if (line.startsWith('- ')) {
      const items: string[] = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <ul key={i} className="my-2 space-y-1 pl-4">
          {items.map((item, j) => (
            <li key={j} className="list-disc text-sm leading-relaxed text-foreground">
              {item}
            </li>
          ))}
        </ul>
      )
      continue
    } else if (line.trim() !== '') {
      elements.push(
        <p key={i} className="mb-3 text-sm leading-relaxed text-foreground">
          {line}
        </p>
      )
    }

    i++
  }

  return <>{elements}</>
}
