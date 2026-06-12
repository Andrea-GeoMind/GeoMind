import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSiteById } from '@/lib/db/queries/sites'
import { getLatestSuccessfulAnalyses } from '@/lib/db/queries/analyses'
import { getRecentCoachMessages } from '@/lib/db/queries/coach'
import { canUseCoachMemory } from '@/lib/quotas'
import { CREDIT_COSTS, getUserCredits } from '@/lib/credits'
import { getPriorityAction } from '@/lib/analysis/scoring'
import { getSuggestions } from '@/lib/ai/coach-suggestions'
import { CoachPanel } from '@/components/features/coach/coach-panel'
import { GeoAvatar } from '@/components/features/coach/geo-avatar'
import { ClearMemoryButton } from '@/components/features/coach/clear-memory-button'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Coach — GEOMIND',
}

const PILLAR_LABELS: Record<'authority' | 'technical' | 'content', string> = {
  authority: 'Autorité',
  technical: 'Technique',
  content: 'Contenu',
}

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

  const successfulAnalyses = await getLatestSuccessfulAnalyses(siteId, 1)
  const latestAnalysis = successfulAnalyses[0] ?? null

  if (!latestAnalysis) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 px-6 py-24 text-center">
        <GeoAvatar size="lg" />
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Lance une analyse d&apos;abord</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            GEO a besoin des données d&apos;une analyse pour te conseiller. Lance ta première
            analyse depuis la Vue d&apos;ensemble.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/sites/${siteId}/overview`}>Aller à la Vue d&apos;ensemble</Link>
        </Button>
      </div>
    )
  }

  const [memoryEnabled, credits] = await Promise.all([
    canUseCoachMemory(user.id),
    getUserCredits(user.id),
  ])

  // Mémoire de GEO (§16.8) : historique rechargé uniquement avec le gate plan
  const history = memoryEnabled ? await getRecentCoachMessages(user.id, siteId, 20) : []

  const initialMessages = history.map((m) => ({
    id: m.id,
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  // Nombre de messages restants estimé depuis le solde de crédits (TKT-CREDITS)
  const remainingMessages = Number.isFinite(credits.total)
    ? Math.floor(credits.total / CREDIT_COSTS.coachMessage)
    : null

  // Accueil contextualisé (§16.5.B) — rendu statique côté UI, jamais persisté
  let welcomeMessage: string | undefined
  if (initialMessages.length === 0) {
    const weakestPillar = getPriorityAction(
      latestAnalysis.authorityScore ?? 0,
      latestAnalysis.technicalScore ?? 0,
      latestAnalysis.contentScore ?? 0
    ).pillar
    welcomeMessage =
      latestAnalysis.globalScore !== null
        ? `Salut ! J'ai épluché l'analyse de **${site.name}**. Ton score global est de **${latestAnalysis.globalScore}/100** — ton point faible, c'est le pilier **${PILLAR_LABELS[weakestPillar]}**. Bonne nouvelle : j'ai un plan. On attaque ?`
        : `Salut ! L'analyse de **${site.name}** est en cours de finalisation — je te dis tout dès que les scores tombent. En attendant, pose-moi tes questions !`
  }

  const suggestions = getSuggestions('coach', {
    hasAnalysis: true,
    globalScore: latestAnalysis.globalScore,
    issueCount: 0,
    cited: null,
  })

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      <div className="border-b border-border bg-white px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <GeoAvatar size="md" />
            <div>
              <h2 className="text-sm font-bold">GEO</h2>
              <p className="text-xs text-muted-foreground">
                Ton assistant pour la visibilité de {site.name} dans les IA
              </p>
            </div>
          </div>

          {memoryEnabled ? (
            <ClearMemoryButton siteId={siteId} />
          ) : (
            <p className="text-xs text-muted-foreground">
              GEO se souviendra de vos conversations avec le plan Solo —{' '}
              <Link
                href="/settings/billing"
                className="font-semibold text-primary underline underline-offset-2"
              >
                voir les plans
              </Link>
            </p>
          )}
        </div>
      </div>

      <CoachPanel
        siteId={siteId}
        analysisId={latestAnalysis.id}
        initialMessages={initialMessages}
        remainingMessages={remainingMessages}
        suggestions={suggestions}
        welcomeMessage={welcomeMessage}
      />
    </div>
  )
}
