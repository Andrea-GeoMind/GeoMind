import { mkdirSync, readFileSync, writeFileSync, appendFileSync, existsSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { ChatGPTConnector } from '@/lib/ai/connectors/chatgpt'
import { ClaudeConnector } from '@/lib/ai/connectors/claude'
import { GeminiConnector } from '@/lib/ai/connectors/gemini'
import { AUDIT_CAP_USD, BudgetExceededError, AuditBudget } from '@/lib/prospect-audit/budget'
import { readProspectSite } from '@/lib/prospect-audit/crawl'
import { hasOwnSite } from '@/lib/prospect-audit/issues'
import { PROSPECT_PAGE_LIMIT, runProspectAudit } from '@/lib/prospect-audit/run'
import { ensureAuditBucket, loadAuditDocument, saveAuditDocument } from '@/lib/prospect-audit/storage'
import { synthesizeAudit } from '@/lib/prospect-audit/synthesis'
import { generateAuditToken, hashAuditToken } from '@/lib/prospect-audit/token'
import { activityForSector } from '@/lib/prospect-audit/activity'
import { ProspectInputSchema, type ProspectInput } from '@/lib/prospect-audit/types'
import type { FirecrawlPage } from '@/lib/analysis/technical/types'

/**
 * Audit prospect (ticket C-05b) — génération réservée à l'admin : il faut la
 * clé service Supabase et la clé OpenRouter de .env.local. Aucun appel LLM ne
 * part d'une route : tout se passe ici, une question à la fois.
 *
 * Usage :
 *   npx tsx --conditions=react-server --env-file=.env.local \
 *     scripts/prospection/audit-prospect.ts --input prospects-cle-en-main.json --rank 1
 *   ... --dry-run          affiche les questions et le budget, aucun appel payant
 *   ... --total-cap 4      plafond du ticket, tests compris (défaut 4 $)
 *   ... --refaire-redaction   ne refait que les solutions et le plan d'un audit
 *                             déjà publié (même lien, ~0,01 $), questions intactes
 *
 * Garde-fous : 0,20 $ par audit (arrêt avant ou après l'appel qui le
 * dépasserait), plafond total tenu dans le journal, verrou contre deux audits
 * simultanés. Le lien n'existe en clair que dans `liens.csv` (et sur la
 * feuille A4) : le stockage n'a que son empreinte.
 */

const OUT_DIR = join(homedir(), 'Downloads', 'Audits-C05b')
const LEDGER = join(OUT_DIR, 'journal.jsonl')
const LINKS = join(OUT_DIR, 'liens.csv')
const LOCK = join(OUT_DIR, '.audit-en-cours')
// Adresse publique des liens : jamais celle de .env.local (localhost en développement)
const SITE_URL = 'https://geomind.fr'

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag)
  return i >= 0 ? process.argv[i + 1] : undefined
}

interface RawProspect {
  rank: number
  name: string
  sector: string
  [key: string]: unknown
}

function toProspect(raw: RawProspect): ProspectInput {
  return ProspectInputSchema.parse({ ...raw, activity: activityForSector(raw.sector, raw.name) })
}

interface LedgerLine {
  at: string
  rank: number
  name: string
  status: 'publié' | 'arrêté'
  costUsd: number
  firecrawlCredits: number
  detail?: string
}

function ledgerTotal(): number {
  if (!existsSync(LEDGER)) return 0
  return readFileSync(LEDGER, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l) as LedgerLine)
    .reduce((sum, l) => sum + l.costUsd, 0)
}

async function openRouterKeyUsage(): Promise<number | null> {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/key', {
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
    })
    const json = (await res.json()) as { data?: { usage?: number } }
    return json.data?.usage ?? null
  } catch {
    return null
  }
}

function slug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

async function main(): Promise<void> {
  const input = arg('--input') ?? 'prospects-cle-en-main.json'
  const rank = Number(arg('--rank'))
  const totalCap = Number(arg('--total-cap') ?? '4')
  const dryRun = process.argv.includes('--dry-run')
  if (!Number.isInteger(rank)) throw new Error('--rank <n> requis')

  const all = JSON.parse(readFileSync(input, 'utf8')) as RawProspect[]
  const raw = all.find((p) => p.rank === rank)
  if (!raw) throw new Error(`Aucun prospect de rang ${rank} dans ${input}`)
  const prospect = toProspect(raw)
  mkdirSync(OUT_DIR, { recursive: true })

  const spent = ledgerTotal()
  const usage = await openRouterKeyUsage()
  console.log(`\n═══ ${prospect.name} (rang ${rank}) ═══`)
  console.log(`  métier : ${prospect.activity} · ${prospect.arrondissement} · site à lui : ${hasOwnSite(prospect) ? prospect.website : 'non'}`)
  console.log(`  dépensé sur le ticket (journal) : ${spent.toFixed(4)} $ / ${totalCap} $`)
  console.log(`  compteur de la clé OpenRouter : ${usage?.toFixed(4) ?? '?'} $ (en retard d'environ 1 h)`)

  if (spent + AUDIT_CAP_USD > totalCap + 1e-9) {
    throw new Error(`Plafond du ticket : ${spent.toFixed(4)} $ + ${AUDIT_CAP_USD} $ dépasserait ${totalCap} $. Arrêt.`)
  }
  if (dryRun) {
    const { buildProspectQuestions } = await import('@/lib/ai/prompts/prospect-audit')
    for (const q of buildProspectQuestions(prospect.activity, prospect.arrondissement)) console.log(`  · ${q.text}`)
    return
  }

  if (process.argv.includes('--refaire-redaction')) {
    await redoSynthesis(rank, prospect.name)
    return
  }

  if (existsSync(LOCK)) throw new Error(`Un audit est déjà en cours (${LOCK}). Jamais deux à la fois.`)
  writeFileSync(LOCK, `${process.pid} ${new Date().toISOString()} ${prospect.name}\n`)

  const budget = new AuditBudget()
  let credits = 0
  try {
    await ensureAuditBucket()

    let pages: FirecrawlPage[] | null = null
    if (hasOwnSite(prospect) && prospect.website) {
      console.log(`  lecture du site (${PROSPECT_PAGE_LIMIT} pages max)…`)
      const crawl = await readProspectSite(prospect.website, PROSPECT_PAGE_LIMIT)
      credits = crawl.credits
      pages = crawl.pages
      console.log(`  ${crawl.pages.length} page(s) lue(s) sur ${crawl.requested.length} demandée(s), ${credits} crédits Firecrawl`)
      for (const u of crawl.requested) console.log(`    - ${u}`)
    }

    const result = await runProspectAudit(prospect, {
      engines: { chatgpt: new ChatGPTConnector(), gemini: new GeminiConnector(), claude: new ClaudeConnector() },
      pages,
      synthesize: synthesizeAudit,
      budget,
      log: (line) => console.log(line),
    })

    const { token, hash } = generateAuditToken()
    await saveAuditDocument(hash, result.document)
    const url = `${SITE_URL}/audit/${token}`
    const base = `${String(rank).padStart(2, '0')}-${slug(prospect.name)}`
    writeFileSync(join(OUT_DIR, `${base}.reponses.json`), JSON.stringify(result.raw, null, 1))
    if (!existsSync(LINKS)) writeFileSync(LINKS, 'rang;nom;lien;expire_le\n')
    appendFileSync(LINKS, `${rank};${prospect.name.replace(/;/g, ',')};${url};${result.document.expiresAt.slice(0, 10)}\n`)
    appendFileSync(
      LEDGER,
      JSON.stringify({
        at: new Date().toISOString(),
        rank,
        name: prospect.name,
        status: 'publié',
        costUsd: budget.spentUsd,
        firecrawlCredits: credits,
      } satisfies LedgerLine) + '\n'
    )

    const d = result.document
    console.log(`\n  ✔ publié : ${url}`)
    console.log(`  notes : globale ${d.scores.global} · IA ${d.scores.authority} · technique ${d.scores.technical ?? '—'} · contenu ${d.scores.content ?? '—'}`)
    console.log(`  ${d.issues.length} problèmes · coût réel ${budget.spentUsd.toFixed(4)} $ (${budget.lines.length} appels)`)
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    appendFileSync(
      LEDGER,
      JSON.stringify({
        at: new Date().toISOString(),
        rank,
        name: prospect.name,
        status: 'arrêté',
        costUsd: budget.spentUsd,
        firecrawlCredits: credits,
        detail,
      } satisfies LedgerLine) + '\n'
    )
    if (err instanceof BudgetExceededError) console.error(`\n  ✖ AUDIT ARRÊTÉ — ${detail}`)
    throw err
  } finally {
    rmSync(LOCK, { force: true })
  }
}

/** Dernier lien publié pour ce rang, lu dans liens.csv. */
function linkFor(rank: number): string {
  const rows = existsSync(LINKS) ? readFileSync(LINKS, 'utf8').trim().split('\n').slice(1) : []
  const row = rows.map((l) => l.split(';')).filter((c) => Number(c[0]) === rank).pop()
  if (!row?.[2]) throw new Error(`Aucun lien publié pour le rang ${rank}`)
  return row[2]
}

async function redoSynthesis(rank: number, name: string): Promise<void> {
  const token = linkFor(rank).split('/audit/')[1] ?? ''
  const hash = hashAuditToken(token)
  const document = await loadAuditDocument(hash)
  if (!document) throw new Error('Audit introuvable dans le stockage')
  const budget = new AuditBudget()
  budget.assertRoom('rédaction', 0.01, { usesReserve: true })
  const synthesis = await synthesizeAudit({
    businessName: document.prospect.name,
    activity: document.prospect.activity,
    arrondissement: document.prospect.arrondissement,
    hasOwnSite: hasOwnSite(document.prospect),
    issues: document.issues,
  })
  const cost = synthesis.costUsd ?? 0.01
  await saveAuditDocument(hash, { ...document, solutions: synthesis.solutions, plan: synthesis.plan }, { overwrite: true })
  appendFileSync(
    LEDGER,
    JSON.stringify({
      at: new Date().toISOString(),
      rank,
      name,
      status: 'publié',
      costUsd: cost,
      firecrawlCredits: 0,
      detail: 'rédaction refaite',
    } satisfies LedgerLine) + '\n'
  )
  console.log(`  ✔ rédaction refaite : ${cost.toFixed(4)} $`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
