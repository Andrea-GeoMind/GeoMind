import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-6xl font-bold tracking-tight text-foreground">GEOMIND</h1>
      <p className="max-w-md text-center text-lg text-muted-foreground">
        Auditez votre visibilité dans les moteurs de réponses IA (ChatGPT, Perplexity, Gemini,
        Claude).
      </p>
      <Button size="lg">Analyser mon site</Button>
    </main>
  )
}
