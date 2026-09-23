/**
 * lib/analysis/robots-parser.ts
 *
 * Parsing de robots.txt — partagé entre l'analyse complète (règles Technique,
 * lib/analysis/technical/rules/robots-txt-block-*.ts) et l'audit express
 * public (lib/analysis/express-audit.ts). Une seule implémentation, une seule
 * liste de bots IA : le gratuit et le payant doivent s'accorder sur ce qui
 * bloque quoi, sans quoi ils se contrediraient devant le même visiteur.
 */

interface RobotsRecord {
  userAgents: string[]
  disallows: string[]
}

export function parseRobots(text: string): RobotsRecord[] {
  const records: RobotsRecord[] = []
  let current: RobotsRecord = { userAgents: [], disallows: [] }

  for (const rawLine of text.split('\n')) {
    const line = rawLine.split('#')[0].trim()

    if (line === '') {
      if (current.userAgents.length > 0) {
        records.push(current)
        current = { userAgents: [], disallows: [] }
      }
      continue
    }

    const lower = line.toLowerCase()
    if (lower.startsWith('user-agent:')) {
      const agent = line.slice('user-agent:'.length).trim()
      if (agent) current.userAgents.push(agent)
    } else if (lower.startsWith('disallow:')) {
      current.disallows.push(line.slice('disallow:'.length).trim())
    }
  }

  if (current.userAgents.length > 0) records.push(current)
  return records
}

export function blocksAllBots(robotsText: string): boolean {
  const records = parseRobots(robotsText)
  return records.some(
    (r) => r.userAgents.includes('*') && r.disallows.includes('/')
  )
}

/** Les 5 robots d'IA que l'analyse complète et l'audit express vérifient tous les deux. */
export const AI_BOTS = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'PerplexityBot', 'CCBot']

export function blockedAiBots(robotsText: string): string[] {
  const records = parseRobots(robotsText)
  return AI_BOTS.filter((bot) => {
    const match = records.find((r) =>
      r.userAgents.some((ua) => ua.toLowerCase() === bot.toLowerCase())
    )
    return match !== undefined && match.disallows.includes('/')
  })
}
