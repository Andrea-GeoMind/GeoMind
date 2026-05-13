'use client'

import Link from 'next/link'
import { ArrowUpRight, Clock, Zap } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { IssueSeverityBadge } from '@/components/features/technical/issue-severity-badge'
import { penaltyToSeverity } from '@/components/features/technical/issue-card'
import {
  CONTENT_RECOMMENDATIONS,
  type ContentRecommendation,
} from '@/lib/analysis/content/recommendations'
import type { ContentIssueRow } from './content-issue-card'

const EFFORT_LABELS: Record<ContentRecommendation['effort'], string> = {
  low: 'Rapide',
  medium: 'Quelques heures',
  high: 'Effort important',
}

const EFFORT_ICONS: Record<ContentRecommendation['effort'], React.ReactNode> = {
  low: <Zap size={12} className="shrink-0" />,
  medium: <Clock size={12} className="shrink-0" />,
  high: <Clock size={12} className="shrink-0" />,
}

interface ContentRecommendationSheetProps {
  issue: ContentIssueRow | null
  isPro: boolean
  onClose: () => void
}

export function ContentRecommendationSheet({ issue, isPro, onClose }: ContentRecommendationSheetProps) {
  const rec = issue ? CONTENT_RECOMMENDATIONS[issue.ruleKey] : undefined
  const severity = issue ? penaltyToSeverity(issue.penalty) : undefined

  return (
    <Sheet open={issue !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        {issue && severity && (
          <>
            <SheetHeader className="mb-6">
              <div className="mb-2 flex items-center gap-2">
                <IssueSeverityBadge severity={severity} />
                {rec && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    {EFFORT_ICONS[rec.effort]}
                    {EFFORT_LABELS[rec.effort]}
                  </span>
                )}
              </div>
              <SheetTitle className="text-base leading-snug">{issue.title}</SheetTitle>
              <SheetDescription className="text-sm">{issue.description}</SheetDescription>
            </SheetHeader>

            <div className="relative flex-1">
              {rec ? (
                <div className={isPro ? undefined : 'max-h-32 overflow-hidden'}>
                  <section className="mb-5">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Comment corriger
                    </h4>
                    <p className="text-sm leading-relaxed text-foreground">{rec.how}</p>
                  </section>
                  <section>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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

              {!isPro && rec && (
                <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 rounded-b-lg bg-gradient-to-t from-background via-background/95 to-transparent pb-4 pt-16 text-center">
                  <p className="text-sm font-medium text-foreground">
                    Passez en Pro pour voir la fiche complète
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Accédez à toutes les recommandations détaillées et au plan d&apos;action.
                  </p>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[--brand-blue-500] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  >
                    Passer en Pro
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
              )}
            </div>

            {issue.sampleUrls.length > 0 && isPro && (
              <section className="mt-6 border-t border-border pt-5">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Pages concernées
                </h4>
                <ul className="space-y-1">
                  {issue.sampleUrls.slice(0, 5).map((url) => (
                    <li key={url}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[--brand-blue-500] underline-offset-4 hover:underline"
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
