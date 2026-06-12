import { Info } from 'lucide-react'

/**
 * Note de méthodologie — honnêteté sur ce que mesurent les scores (PLAN item 9).
 * Les réponses des LLMs ne sont pas déterministes : le même prompt peut donner
 * des résultats différents d'un jour à l'autre. On l'assume plutôt que de
 * laisser le client paniquer (ou se réjouir) pour du bruit statistique.
 */

export function AuthorityMethodologyNote() {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 px-4 py-3">
      <Info size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
      <p className="text-xs leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">Comment lire ce score ?</span> Nous
        interrogeons ChatGPT, Claude, Gemini et Perplexity via leurs API officielles — un bon
        indicateur, même si les réponses peuvent différer légèrement de l&apos;application que
        vos clients utilisent. Les IA ne répondent jamais deux fois exactement pareil : un écart
        de quelques points entre deux analyses est normal.{' '}
        <span className="font-medium text-foreground">
          Fiez-vous à la tendance sur plusieurs analyses, pas au chiffre du jour.
        </span>
      </p>
    </div>
  )
}

export function PageSamplingNote({
  pagesAnalyzed,
  pagesDetected,
}: {
  pagesAnalyzed: number
  pagesDetected: number
}) {
  // Tout est couvert : rien à signaler.
  if (pagesDetected <= pagesAnalyzed) return null

  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 px-4 py-3">
      <Info size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
      <p className="text-xs leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">
          {pagesAnalyzed === 0
            ? `Analyse globale du site — les ${pagesDetected} pages détectées ne sont pas auditées individuellement avec votre plan.`
            : `Cette analyse page par page couvre ${pagesAnalyzed} page${pagesAnalyzed > 1 ? 's' : ''} sur les ${pagesDetected} détectées`}
        </span>
        {pagesAnalyzed > 0 && (
          <>
            {' '}
            (limite de votre plan) — les pages les plus représentatives sont sélectionnées
            automatiquement, et les vérifications à l&apos;échelle du site couvrent, elles, tout
            le site.
          </>
        )}
      </p>
    </div>
  )
}
