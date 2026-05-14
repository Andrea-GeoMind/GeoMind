import Link from 'next/link'
import { BarChart2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NoAnalysisStateProps {
  siteId: string
}

export function NoAnalysisState({ siteId }: NoAnalysisStateProps) {
  return (
    <div className="mx-auto max-w-sm px-4 py-20 text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <BarChart2 className="h-7 w-7 text-primary" />
      </div>
      <h2 className="mb-2 font-semibold text-foreground">Aucune analyse disponible</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Lancez la découverte pour que GEOMIND génère vos premiers prompts et interroge les IA.
      </p>
      <Button asChild size="sm">
        <Link href={`/sites/${siteId}/discovery`}>Lancer la découverte</Link>
      </Button>
    </div>
  )
}
