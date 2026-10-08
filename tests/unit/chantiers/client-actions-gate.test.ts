import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { CHANTIER_RATE_LIMITS } from '@/lib/chantiers/rate-limits'

/**
 * Espace client (sans compte) : chaque Server Action revérifie le lien,
 * applique la limite de débit et s'arrête si l'accès est refusé ; toute
 * écriture de réponse passe par la validation du catalogue. Même principe que
 * admin-gate.test.ts pour le tableau de bord.
 */

const ACTIONS = 'app/chantier/espace/actions.ts'
const LIMITS = Object.keys(CHANTIER_RATE_LIMITS)
const src = readFileSync(ACTIONS, 'utf8')

/** Corps de chaque action exportée, découpé jusqu'à la suivante. */
function actionBodies(source: string): { name: string; body: string }[] {
  const starts = [...source.matchAll(/export async function (\w+)\(/g)]
  return starts.map((m, i) => ({
    name: m[1]!,
    body: source.slice(m.index!, starts[i + 1]?.index ?? source.length),
  }))
}

describe('Server Actions de /chantier', () => {
  const actions = actionBodies(src)

  it('le fichier est bien un module d’actions serveur', () => {
    expect(src.startsWith("'use server'")).toBe(true)
    expect(actions.length).toBeGreaterThanOrEqual(2)
  })

  it.each(actionBodies(src).map((a) => [a.name, a.body]))(
    '%s : revérifie le lien et la limite de débit avant tout',
    (_, body) => {
      // Corps : après « ): Promise<…> { » (types de retour imbriqués compris)
      const header = /\): Promise<[\s\S]*?>\s*\{\n/.exec(body)
      expect(header, 'signature attendue : (…): Promise<…> {').not.toBeNull()
      const statements = body
        .slice(header!.index + header![0].length)
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
      const first = /^const access = await requireChantierAccess\('(\w+)'\)$/.exec(statements[0] ?? '')
      expect(first, `première instruction : ${statements[0]}`).not.toBeNull()
      expect(LIMITS).toContain(first![1])
      expect(statements[1]).toMatch(/^if \(!access\.ok\) return /)
    }
  )

  it('aucune action ne lit le lien autrement que par requireChantierAccess', () => {
    expect(src).not.toMatch(/cookies\(|findChantierByToken|tokenHash/)
  })

  it('l’enregistrement d’un champ passe par la validation du catalogue', () => {
    const save = actions.find((a) => a.name === 'saveChantierFieldAction')
    expect(save?.body).toMatch(/validateFieldSave\(/)
    expect(save?.body).toMatch(/if \(!validated\.ok\) return validated/)
    expect(save?.body).toMatch(/actor: 'client'/)
  })
})

describe('pages et route de /chantier', () => {
  it('la page de l’espace commence par requireChantierAccess(\'view\')', () => {
    const page = readFileSync('app/chantier/espace/page.tsx', 'utf8')
    expect(page).toMatch(
      /export default async function \w+\(\) \{\s*const access = await requireChantierAccess\('view'\)\s*if \(!access\.ok\)/
    )
  })

  it('la route de l’assistant commence par requireChantierAccess(\'assistant\') : pas d’appel sans lien', () => {
    const route = readFileSync('app/chantier/assistant/route.ts', 'utf8')
    expect(route).toMatch(
      /export async function POST\(req: NextRequest\) \{\s*const access = await requireChantierAccess\('assistant'\)\s*if \(!access\.ok\) return /
    )
    // Une seule méthode exposée, sous /chantier (le cookie d'accès y est limité)
    expect(route.match(/export async function (GET|POST|PUT|PATCH|DELETE)/g)).toEqual(['export async function POST'])
    expect(route).not.toMatch(/cookies\(|findChantierByToken|tokenHash/)
    expect(LIMITS).toContain('assistant')
  })

  it('la route d’entrée vérifie le lien et pose un cookie httpOnly limité à /chantier', () => {
    const route = readFileSync('app/chantier/[token]/route.ts', 'utf8')
    expect(route).toMatch(/await checkChantierToken\(token, 'view', ip\)/)
    expect(route).toMatch(/httpOnly: true/)
    expect(route).toMatch(/path: CHANTIER_COOKIE_PATH/)
    expect(route).toMatch(/sameSite: 'lax'/)
    // Le lien ne doit jamais se retrouver dans l'URL de redirection
    expect(route).not.toMatch(/searchParams\.set\([^)]*token/)
  })

  it('requireChantierAccess vérifie l’état du lien et consomme la limite', () => {
    const access = readFileSync('lib/chantiers/access.ts', 'utf8')
    expect(access.split('\n')[0]).toBe("import 'server-only'")
    expect(access).toMatch(/const state = tokenState\(chantier, new Date\(\)\)/)
    expect(access).toMatch(/CHANTIER_RATE_LIMITS\.badToken/)
    expect(access).toMatch(/CHANTIER_RATE_LIMITS\[limit\]/)
  })

  it('jamais indexé : robots.txt, en-têtes et métadonnées', () => {
    expect(readFileSync('app/robots.ts', 'utf8')).toMatch(/'\/chantier\/'/)
    const config = readFileSync('next.config.mjs', 'utf8')
    expect(config).toMatch(/source: '\/chantier\/:path\*'/)
    expect(config).toMatch(/noindex, nofollow, noarchive/)
    expect(config).toMatch(/'Referrer-Policy', value: 'no-referrer'/)
    expect(readFileSync('app/chantier/layout.tsx', 'utf8')).toMatch(/robots: \{ index: false, follow: false/)
  })

  it('ni PostHog ni bandeau cookies sur /chantier', () => {
    expect(readFileSync('components/posthog-provider.tsx', 'utf8')).toMatch(
      /window\.location\.pathname\.startsWith\('\/chantier'\)\) return/
    )
    expect(readFileSync('components/cookie-banner.tsx', 'utf8')).toMatch(/startsWith\('\/chantier'\)/)
  })

  it('Sentry masque le lien sur les trois environnements', () => {
    for (const f of ['sentry.client.config.ts', 'sentry.server.config.ts', 'sentry.edge.config.ts']) {
      const cfg = readFileSync(f, 'utf8')
      expect(cfg, f).toMatch(/beforeSend: \(event\) => scrubChantierTokens\(event\)/)
      expect(cfg, f).toMatch(/beforeSendTransaction: \(event\) => scrubChantierTokens\(event\)/)
    }
  })
})
