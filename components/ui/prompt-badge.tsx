/**
 * PromptBadge — badge indiquant si un prompt est neutre ou orienté.
 * Un prompt "orienté" contient le domaine/marque du client → is_neutral=false.
 * Cf. règle métier #6 dans CLAUDE.md.
 */

import { cn } from '@/lib/utils'
import { AlertTriangle, CheckCircle } from 'lucide-react'

interface PromptBadgeProps {
  isNeutral: boolean
  className?: string
  /** Mode compact : icône seule sans label (utile dans les tableaux) */
  iconOnly?: boolean
}

export function PromptBadge({ isNeutral, className, iconOnly = false }: PromptBadgeProps) {
  if (isNeutral) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
          'bg-[--score-good-50] text-[--score-good-700] ring-1 ring-inset ring-[--score-good-200]',
          className,
        )}
        title="Prompt neutre — inclus dans le calcul GEO"
      >
        <CheckCircle size={11} aria-hidden />
        {!iconOnly && <span>Neutre</span>}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        'bg-[--score-mid-50] text-[--score-mid-700] ring-1 ring-inset ring-[--score-mid-200]',
        className,
      )}
      title="Question orientée — exclue du calcul GEO"
    >
      <AlertTriangle size={11} aria-hidden />
      {!iconOnly && <span>Question orientée</span>}
    </span>
  )
}
