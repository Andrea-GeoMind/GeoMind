import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { loadAuditDocument } from '@/lib/prospect-audit/storage'
import { hashAuditToken } from '@/lib/prospect-audit/token'
import { mostUrgent, presenceFraction, presenceSummary } from '@/lib/prospect-audit/view'

/**
 * Bilan d'une série d'audits prospects (ticket C-05b) : relit chaque audit
 * publié, réécrit liens.csv trié par tournée puis ordre de passage (un lien
 * par rang, le dernier publié), et imprime le tableau du rapport et l'ordre
 * des rangs à passer à audit-sheets.ts.
 *
 * Usage :
 *   npx tsx --conditions=react-server --env-file=.env.local \
 *     scripts/prospection/audit-report.ts --input prospects-cle-en-main.json --tours "1er – Pentes (ouest),…"
 */

const OUT_DIR = join(homedir(), 'Downloads', 'Audits-C05b')
const LINKS = join(OUT_DIR, 'liens.csv')
const LEDGER = join(OUT_DIR, 'journal.jsonl')

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag)
  return i >= 0 ? process.argv[i + 1] : undefined
}

interface Prospect {
  rank: number
  name: string
  tour: string
}

/** « 2e – Bellecour (est) · 1/7 » → { quartier: « 2e – Bellecour (est) », passage: 1 }. */
function parseTour(tour: string): { area: string; stop: number } {
  const [area = tour, stop = '0'] = tour.split(' · ')
  return { area, stop: Number(stop.split('/')[0]) }
}

async function main(): Promise<void> {
  const prospects = JSON.parse(readFileSync(arg('--input') ?? 'prospects-cle-en-main.json', 'utf8')) as Prospect[]
  const tourOrder = (arg('--tours') ?? '').split(',').map((t) => t.trim()).filter(Boolean)
  const areaRank = (area: string) => {
    const i = tourOrder.indexOf(area)
    return i < 0 ? tourOrder.length : i
  }

  const rows = readFileSync(LINKS, 'utf8').trim().split('\n').slice(1).map((l) => l.split(';'))
  const lastLink = new Map(rows.map((c) => [Number(c[0]), { url: c[2] ?? '', expires: c[3] ?? '' }]))

  const sorted = prospects
    .filter((p) => lastLink.has(p.rank))
    .sort((a, b) => {
      const ta = parseTour(a.tour)
      const tb = parseTour(b.tour)
      return areaRank(ta.area) - areaRank(tb.area) || ta.area.localeCompare(tb.area) || ta.stop - tb.stop
    })

  const lines = ['rang;nom;lien;expire_le;tournee']
  const table = [
    '| Tournée | Commerce | Cité | Fiche Google | Problèmes | Le plus urgent |',
    '|---|---|---|---|---|---|',
  ]
  for (const p of sorted) {
    const link = lastLink.get(p.rank)!
    const doc = await loadAuditDocument(hashAuditToken(link.url.split('/audit/')[1] ?? ''))
    if (!doc) throw new Error(`Audit introuvable : ${p.name}`)
    lines.push([p.rank, p.name.replace(/;/g, ','), link.url, link.expires, p.tour].join(';'))
    table.push(
      `| ${p.tour} | ${p.name} | ${presenceFraction(presenceSummary(doc.answers))} | ${doc.scores.place} | ${doc.issues.length} | ${mostUrgent(doc) ?? '—'} |`
    )
  }
  writeFileSync(LINKS, lines.join('\n') + '\n')

  const spent = existsSync(LEDGER)
    ? readFileSync(LEDGER, 'utf8')
        .split('\n')
        .filter(Boolean)
        .reduce((sum, l) => sum + (JSON.parse(l) as { costUsd: number }).costUsd, 0)
    : 0
  console.log(table.join('\n'))
  console.log(`\nCoût total du journal : ${spent.toFixed(4)} $`)
  console.log(`ORDRE ${sorted.map((p) => p.rank).join(',')}`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
