import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-6xl font-bold tracking-tight text-foreground">GEOMIND</h1>
      <p className="max-w-md text-center text-lg text-muted-foreground">
        Auditez votre visibilité dans les moteurs de réponses IA (ChatGPT, Perplexity, Gemini,
        Claude).
      </p>
      <div className="flex gap-3">
        <Button size="lg" asChild>
          <Link href="/signup">Analyser mon site</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/pricing">Voir les tarifs</Link>
        </Button>
      </div>
    </div>
  )
}
