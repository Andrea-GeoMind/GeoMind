import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { getLatestSuccessfulAnalyses } from '@/lib/db/queries/analyses'
import { getCoachMessages } from '@/lib/db/queries/coach'
import { getRemainingCoachMessages } from '@/lib/quotas'
import { getSubscriptionByUserId } from '@/lib/db/queries/subscriptions'
import { CoachPanel } from '@/components/features/coach/coach-panel'
import { Button } from '@/components/ui/button'

type Props = {
  params: Promise<{ siteId: string }>
}

export default async function CoachPage({ params }: Props) {
  const { siteId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const site = await getSiteById(siteId)
  if (!site || site.userId !== user.id) notFound()

  const subscription = await getSubscriptionByUserId(user.id)
  const plan = subscription?.plan ?? 'free'

  if (plan === 'free') {
    return (
      <div className="flex flex-col items-center justify-center gap-6 px-6 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
          <Sparkles className="h-7 w-7 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Coach IA — Plan Pro requis</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Le Coach IA analyse vos scores et vous guide avec des conseils personnalisés. Disponible
            à partir du plan Pro.
          </p>
        </div>
        <Button asChild>
          <Link href="/pricing">Voir les plans</Link>
        </Button>
      </div>
    )
  }

  const successfulAnalyses = await getLatestSuccessfulAnalyses(siteId, 1)
  const latestAnalysis = successfulAnalyses[0] ?? null

  if (!latestAnalysis) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 px-6 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
          <Sparkles className="h-7 w-7 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Lancez une analyse d&apos;abord</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Le Coach IA a besoin des données d&apos;une analyse pour vous conseiller. Lancez votre
            première analyse depuis la Vue d&apos;ensemble.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/sites/${siteId}/overview`}>Aller à la Vue d&apos;ensemble</Link>
        </Button>
      </div>
    )
  }

  const [messages, quota] = await Promise.all([
    getCoachMessages(siteId, latestAnalysis.id),
    getRemainingCoachMessages(user.id),
  ])

  const remainingMessages = quota.remaining === Infinity ? null : quota.remaining

  const initialMessages = messages.map((m) => ({
    id: m.id,
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 ring-1 ring-primary/20">
            <Sparkles className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Coach IA</h2>
            <p className="text-xs text-muted-foreground">
              Posez vos questions sur la visibilité de {site.name} dans les IAs
            </p>
          </div>
        </div>
      </div>

      <CoachPanel
        siteId={siteId}
        analysisId={latestAnalysis.id}
        initialMessages={initialMessages}
        remainingMessages={remainingMessages}
      />
    </div>
  )
}
