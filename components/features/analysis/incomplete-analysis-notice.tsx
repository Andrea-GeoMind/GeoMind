import { AlertTriangle } from 'lucide-react'
import type { UnansweredPrompt } from '@/lib/db/queries/authority-failures'

/**
 * Avertissement : des questions n'ont obtenu aucune réponse.
 *
 * Le 15/09/2026, deux questions sur dix sont restées sans réponse des quatre
 * moteurs et l'analyse s'est présentée comme réussie : le client croyait
 * mesurer les dix questions qu'il avait configurées. Une mesure partielle se
 * dit, sinon elle se fait passer pour une mesure complète.
 *
 * Le ton est volontairement factuel : ce n'est pas la faute du client, et ce
 * n'est pas non plus un incident grave — c'est une information sur la portée
 * du chiffre qu'il lit juste à côté.
 */
export function IncompleteAnalysisNotice({
  unanswered,
  totalPrompts,
  className,
}: {
  unanswered: UnansweredPrompt[]
  totalPrompts: number
  className?: string
}) {
  if (unanswered.length === 0) return null

  const answered = totalPrompts - unanswered.length

  return (
    <div
      className={
        className ??
        'rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-foreground'
      }
    >
      <div className="flex items-start gap-3">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
        <div className="space-y-2">
          <p className="font-semibold">
            Analyse incomplète : {unanswered.length}{' '}
            {unanswered.length > 1 ? 'questions sont restées' : 'question est restée'} sans
            réponse
          </p>
          <p className="text-muted-foreground">
            Les scores ci-dessous portent sur {answered} question
            {answered > 1 ? 's' : ''} sur {totalPrompts}. Les moteurs n&apos;ont rien renvoyé
            pour {unanswered.length > 1 ? 'les suivantes' : 'la suivante'}, malgré plusieurs
            tentatives :
          </p>
          <ul className="space-y-1 text-muted-foreground">
            {unanswered.map((p) => (
              <li key={p.promptId} className="border-l-2 border-amber-500/40 pl-3">
                <span className="italic">« {p.text} »</span>
                <span className="mt-0.5 block text-xs">
                  {p.engines.length} moteur{p.engines.length > 1 ? 's' : ''} —{' '}
                  <span className="font-mono">{p.reason}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground">
            Relancez l&apos;analyse pour les reposer : c&apos;est le plus souvent une
            saturation passagère du côté des moteurs.
          </p>
        </div>
      </div>
    </div>
  )
}
