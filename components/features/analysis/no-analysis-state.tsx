import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NoAnalysisStateProps {
  siteId: string
}

export function NoAnalysisState({ siteId }: NoAnalysisStateProps) {
  return (
    <div className="mx-auto max-w-sm px-4 py-20 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      <h2 className="mb-2 text-lg font-extrabold tracking-tight text-foreground">
        Aucune analyse disponible
      </h2>
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        Lancez la découverte pour que GEOMIND génère vos premiers prompts et interroge les IA.
      </p>
      <Button
        asChild
        size="default"
        className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700"
      >
        <Link href={`/sites/${siteId}/discovery`}>Lancer la découverte</Link>
      </Button>
    </div>
  )
}
