/**
 * Prompt système pour le Coach GEO de GeoMind.
 * Injecté à chaque conversation IA coach pour contextualiser les scores,
 * les problèmes détectés et le pilier prioritaire du site analysé.
 */
import { getScoreMaturity } from '@/lib/analysis/scoring'

export interface CoachContext {
  siteName: string
  siteUrl: string
  siteDescription: string | null
  globalScore: number | null
  authorityScore: number | null
  technicalScore: number | null
  contentScore: number | null
  topTechnicalIssues: Array<{ title: string; penalty: number }>
  topContentIssues: Array<{ title: string; penalty: number }>
  priorityPillar: 'authority' | 'technical' | 'content' | null
}

export function buildCoachSystemPrompt(ctx: CoachContext): string {
  const lines: string[] = [
    'Tu es le Coach GEO de GeoMind, un assistant expert en visibilité dans les moteurs de réponses IA (ChatGPT, Perplexity, Gemini, Claude).',
    "Tu aides l'utilisateur à améliorer la présence de son site web dans les réponses générées par les IAs.",
    '',
    `**Site analysé** : ${ctx.siteName} (${ctx.siteUrl})`,
  ]

  if (ctx.siteDescription) {
    lines.push(`**Description** : ${ctx.siteDescription}`)
  }

  lines.push('')

  const allScoresPresent =
    ctx.globalScore !== null &&
    ctx.authorityScore !== null &&
    ctx.technicalScore !== null &&
    ctx.contentScore !== null

  if (allScoresPresent) {
    lines.push('**Scores actuels** :')
    lines.push(
      `- Score global : ${ctx.globalScore}/100 (${getScoreMaturity(ctx.globalScore!).label})`
    )
    lines.push(
      `- Autorité IA : ${ctx.authorityScore}/100 (${getScoreMaturity(ctx.authorityScore!).label}) — fréquence de citation par les IAs`
    )
    lines.push(
      `- Technique : ${ctx.technicalScore}/100 (${getScoreMaturity(ctx.technicalScore!).label}) — structure lisible par les IAs`
    )
    lines.push(
      `- Contenu : ${ctx.contentScore}/100 (${getScoreMaturity(ctx.contentScore!).label}) — qualité du contenu pour les IAs`
    )
    lines.push('')
  } else {
    lines.push(
      "**Aucune analyse disponible.** Invite l'utilisateur à lancer une première analyse depuis la Vue d'ensemble."
    )
    lines.push('')
  }

  if (ctx.topTechnicalIssues.length > 0) {
    lines.push('**Principaux problèmes techniques** :')
    ctx.topTechnicalIssues.forEach((issue) => {
      lines.push(`- ${issue.title} (impact : -${issue.penalty} pts)`)
    })
    lines.push('')
  }

  if (ctx.topContentIssues.length > 0) {
    lines.push('**Principaux problèmes de contenu** :')
    ctx.topContentIssues.forEach((issue) => {
      lines.push(`- ${issue.title} (impact : -${issue.penalty} pts)`)
    })
    lines.push('')
  }

  if (ctx.priorityPillar) {
    const pillarLabel: Record<NonNullable<CoachContext['priorityPillar']>, string> = {
      authority: 'Autorité IA',
      technical: 'Technique',
      content: 'Contenu',
    }
    lines.push(
      `**Priorité identifiée** : Pilier "${pillarLabel[ctx.priorityPillar]}" — c'est là que l'amélioration aura le plus grand impact.`
    )
    lines.push('')
  }

  lines.push('**Règles de comportement** :')
  lines.push('- Réponds TOUJOURS en français, de manière concise et bienveillante.')
  lines.push('- Base tes conseils sur les données réelles du site fournies ci-dessus.')
  lines.push("- Donne des étapes concrètes et actionnables, pas des généralités.")
  lines.push("- Si tu ne connais pas la réponse, dis-le plutôt qu'inventer.")
  lines.push('- Ton objectif : aider progressivement à améliorer le score GEO du site.')

  return lines.join('\n')
}
