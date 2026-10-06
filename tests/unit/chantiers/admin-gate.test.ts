import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { isActiveAdmin } from '@/lib/plans'

/**
 * Le tableau de bord des chantiers est réservé aux admins. La barre latérale
 * cache le lien aux autres, mais seule la vérification serveur compte : chaque
 * page et chaque Server Action doit appeler requireAdmin() avant tout le reste.
 */

const DIR = 'app/(app)/dashboard/chantiers'
const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [join(dir, e.name)] : []
  )

describe('isActiveAdmin', () => {
  it.each([
    [{ plan: 'admin' as const, status: 'active' }, true],
    [{ plan: 'admin' as const, status: 'canceled' }, false],
    [{ plan: 'admin' as const, status: 'past_due' }, false],
    [{ plan: 'business' as const, status: 'active' }, false],
    [null, false],
  ])('%j → %s', (sub, expected) => {
    expect(isActiveAdmin(sub)).toBe(expected)
  })
})

describe('garde admin du tableau de bord des chantiers', () => {
  const files = walk(DIR)

  it('chaque page appelle requireAdmin()', () => {
    const pages = files.filter((f) => f.endsWith('page.tsx'))
    expect(pages.length).toBeGreaterThanOrEqual(2)
    for (const f of pages) expect(readFileSync(f, 'utf8'), f).toMatch(/await requireAdmin\(\)/)
  })

  it('chaque Server Action commence par requireAdmin()', () => {
    const actions = readFileSync(`${DIR}/actions.ts`, 'utf8')
    // Première instruction après « ): Promise<…> { »
    const bodies = [
      ...actions.matchAll(/export async function (\w+)\([\s\S]*?\): Promise<[\s\S]*?>\s*\{\s*\n\s*([^\n]*)/g),
    ]
    expect(bodies.length).toBe((actions.match(/export async function/g) ?? []).length)
    expect(bodies.length).toBeGreaterThanOrEqual(2)
    for (const [, name, firstLine] of bodies) {
      expect(firstLine, name).toMatch(/await requireAdmin\(\)/)
    }
  })

  it('requireAdmin lit le plan en base et renvoie une 404 aux autres', () => {
    const src = readFileSync('lib/admin.ts', 'utf8')
    expect(src.split('\n')[0]).toBe("import 'server-only'")
    expect(src).toMatch(/getSubscriptionByUserId\(user\.id\)/)
    expect(src).toMatch(/if \(!isActiveAdmin\(subscription\)\) notFound\(\)/)
  })
})
