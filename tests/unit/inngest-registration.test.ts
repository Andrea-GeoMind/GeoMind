import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { readdirSync } from 'node:fs'

/**
 * Régression : de juin à septembre 2026, 8 fonctions Inngest sur 12 n'étaient
 * pas enregistrées côté Inngest Cloud — tous les crons compris. Le code était
 * correct, c'est la synchronisation qui n'avait jamais été relancée.
 *
 * Ce test ne peut pas vérifier l'état d'Inngest Cloud (`pnpm inngest:sync` s'en
 * charge). Il verrouille la moitié vérifiable : toute fonction écrite sur le
 * disque doit être servie par la route, pour qu'un oubli d'import ne vienne pas
 * s'ajouter au problème de synchronisation.
 */
const route = readFileSync('app/api/inngest/route.ts', 'utf8')
const served = route.slice(route.indexOf('functions: ['), route.indexOf('],', route.indexOf('functions: [')))

const files = readdirSync('lib/inngest/functions').filter((f) => f.endsWith('.ts'))

describe('enregistrement des fonctions Inngest', () => {
  it.each(files)('%s : toutes ses fonctions sont servies par la route', (file) => {
    const src = readFileSync(`lib/inngest/functions/${file}`, 'utf8')
    const exported = [...src.matchAll(/export const (\w+Function)\s*=\s*inngest\.createFunction/g)].map(
      (m) => m[1]
    )
    expect(exported.length).toBeGreaterThan(0)
    for (const name of exported) {
      expect(served, `${name} n'est pas dans functions: [] de app/api/inngest/route.ts`).toContain(name)
    }
  })

  it('chaque fonction déclare au moins un trigger', () => {
    for (const file of files) {
      const src = readFileSync(`lib/inngest/functions/${file}`, 'utf8')
      const fns = src.match(/inngest\.createFunction/g)?.length ?? 0
      const triggers = src.match(/triggers:\s*\[/g)?.length ?? 0
      expect(triggers, `${file} : ${fns} fonction(s), ${triggers} trigger(s)`).toBe(fns)
    }
  })
})
