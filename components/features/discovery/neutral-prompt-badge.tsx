import { cn } from '@/lib/utils'
import { AlertTriangle, CheckCircle } from 'lucide-react'

interface NeutralPromptBadgeProps {
  isNeutral: boolean
  className?: string
  /** Mode compact : icône seule sans label (utile dans les tableaux) */
  iconOnly?: boolean
}

export function NeutralPromptBadge({
  isNeutral,
  className,
  iconOnly = false,
}: NeutralPromptBadgeProps) {
  if (isNeutral) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
          'bg-[--score-good-50] text-[--score-good-700] ring-1 ring-inset ring-[--score-good-100]',
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
        'bg-[--score-bad-50] text-[--score-bad-700] ring-1 ring-inset ring-[--score-bad-100]',
        className,
      )}
      title="Question orientée — exclue du calcul GEO"
    >
      <AlertTriangle size={11} aria-hidden />
      {!iconOnly && <span>Non neutre</span>}
    </span>
  )
}
