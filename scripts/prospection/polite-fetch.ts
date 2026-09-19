/**
 * Récupération respectueuse : robots.txt + délai entre requêtes.
 *
 * On visite les sites de tiers qui n'ont rien demandé. Deux règles :
 * on lit robots.txt et on s'y tient, et on espace les requêtes pour ne pas
 * peser sur des hébergements mutualisés modestes.
 */

const USER_AGENT = 'GeoMindBot/1.0 (+https://geomind.fr) prospection'
const FETCH_TIMEOUT_MS = 12_000
const MAX_BYTES = 400_000

/** Délai minimum entre deux requêtes vers le MÊME hôte. */
export const PER_HOST_DELAY_MS = 2_000

const lastHit = new Map<string, number>()
const robotsCache = new Map<string, string[]>()

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function throttle(host: string): Promise<void> {
  const last = lastHit.get(host)
  if (last !== undefined) {
    const wait = PER_HOST_DELAY_MS - (Date.now() - last)
    if (wait > 0) await sleep(wait)
  }
  lastHit.set(host, Date.now())
}

/**
 * Chemins interdits à notre agent (ou à `*`) dans robots.txt.
 * En cas d'absence ou d'erreur, on considère le site ouvert — c'est le défaut
 * du standard, un robots.txt manquant n'interdit rien.
 */
async function disallowedPaths(origin: string): Promise<string[]> {
  const cached = robotsCache.get(origin)
  if (cached) return cached

  let rules: string[] = []
  try {
    const res = await fetch(`${origin}/robots.txt`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (res.ok) {
      const txt = (await res.text()).slice(0, 50_000)
      rules = parseDisallow(txt)
    }
  } catch {
    rules = []
  }
  robotsCache.set(origin, rules)
  return rules
}

/** Groupes `User-agent` concernant `*` ou GeoMindBot. */
export function parseDisallow(robotsTxt: string): string[] {
  const out: string[] = []
  let applies = false
  let collecting = false

  for (const raw of robotsTxt.split('\n')) {
    const line = raw.trim().toLowerCase()
    if (!line || line.startsWith('#')) continue

    if (line.startsWith('user-agent:')) {
      const agent = line.slice('user-agent:'.length).trim()
      if (!collecting) applies = false
      applies = applies || agent === '*' || agent.includes('geomind')
      collecting = true
      continue
    }
    collecting = false
    if (!applies) continue
    if (line.startsWith('disallow:')) {
      const path = line.slice('disallow:'.length).trim()
      if (path) out.push(path)
    }
  }
  return out
}

export function isAllowed(path: string, disallowed: string[]): boolean {
  return !disallowed.some((d) => d === '/' || path.startsWith(d))
}

export interface PoliteResponse {
  ok: boolean
  status: number
  html: string
  /** Vrai quand robots.txt nous a refusé la page. */
  blockedByRobots?: boolean
}

/** Récupère une page en respectant robots.txt et le délai par hôte. */
export async function politeFetch(url: string): Promise<PoliteResponse> {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return { ok: false, status: 0, html: '' }
  }

  const disallowed = await disallowedPaths(u.origin)
  if (!isAllowed(u.pathname, disallowed)) {
    return { ok: false, status: 0, html: '', blockedByRobots: true }
  }

  await throttle(u.host)

  try {
    const res = await fetch(u.toString(), {
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    const html = (await res.text()).slice(0, MAX_BYTES)
    return { ok: res.ok, status: res.status, html }
  } catch {
    return { ok: false, status: 0, html: '' }
  }
}
