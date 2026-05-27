import { NextResponse } from 'next/server'
import { eq, count } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import {
  analyses,
  authorityResults,
  technicalIssues,
  contentIssues,
  recommendations,
  publishers,
  prompts,
} from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'

// Calcule la progression réelle à partir des données effectivement écrites en base.
// Étapes réelles (run-full-analysis) :
//   crawl → authority_results (1 par prompt×engine) → scores → recommendations → publishers → success

export type AnalysisProgressResponse = {
  progress: number   // 0-100
  step: string       // label affiché
  status: string     // 'pending' | 'running' | 'success' | 'error'
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  const { analysisId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Vérification ownership : analysis → site → user
  const analysis = await db.query.analyses.findFirst({
    where: eq(analyses.id, analysisId),
    with: { site: true },
  })
  if (!analysis || analysis.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (analysis.status === 'success') {
    return NextResponse.json({ progress: 100, step: 'Analyse terminée', status: 'success' })
  }
  if (analysis.status === 'error') {
    return NextResponse.json({ progress: 0, step: 'Erreur d\'analyse', status: 'error' })
  }
  if (analysis.status === 'pending') {
    return NextResponse.json({ progress: 2, step: 'En file d\'attente…', status: 'pending' })
  }

  // Récupérer les compteurs en parallèle
  const [
    [{ authorityCount }],
    [{ techCount }],
    [{ contentCount }],
    [{ recoCount }],
    [{ publishersCount }],
    [{ promptsTotal }],
  ] = await Promise.all([
    db.select({ authorityCount: count() }).from(authorityResults).where(eq(authorityResults.analysisId, analysisId)),
    db.select({ techCount: count() }).from(technicalIssues).where(eq(technicalIssues.analysisId, analysisId)),
    db.select({ contentCount: count() }).from(contentIssues).where(eq(contentIssues.analysisId, analysisId)),
    db.select({ recoCount: count() }).from(recommendations).where(eq(recommendations.analysisId, analysisId)),
    db.select({ publishersCount: count() }).from(publishers).where(eq(publishers.analysisId, analysisId)),
    db.select({ promptsTotal: count() }).from(prompts).where(eq(prompts.siteId, analysis.siteId)),
  ])

  // Total de réponses attendues = prompts neutres × 4 moteurs IA
  const expectedAuthority = Math.max(promptsTotal * 4, 1)

  let progress: number
  let step: string

  if (authorityCount === 0) {
    // Pas encore de résultats autorité — crawl ou file d'attente
    progress = 8
    step = 'Crawl du site en cours…'
  } else if (analysis.authorityScore === null) {
    // Réponses IA arrivent progressivement (score pas encore calculé)
    const ratio = Math.min(authorityCount / expectedAuthority, 1)
    progress = Math.round(8 + ratio * 47) // 8% → 55%
    step = `Interrogation des moteurs IA… (${authorityCount}/${expectedAuthority} réponses)`
  } else if (analysis.technicalScore === null || analysis.contentScore === null) {
    // Phases technique + contenu en cours (peut trouver 0 problème → score != null quand done)
    progress = 62
    step = 'Analyse technique & contenu…'
  } else if (publishersCount === 0) {
    // Scores calculés, mais recommendations + publishers pas encore terminés.
    // detectPublishers insère toujours ≥1 résultat → son absence = phase en cours.
    progress = recoCount > 0 ? 85 : 76
    step = recoCount > 0 ? 'Identification des publishers…' : 'Génération des recommandations…'
  } else {
    // Tout est prêt, mark-success en cours (gap infime avant status=success)
    progress = 95
    step = 'Finalisation…'
  }

  return NextResponse.json({ progress, step, status: 'running' } satisfies AnalysisProgressResponse)
}
