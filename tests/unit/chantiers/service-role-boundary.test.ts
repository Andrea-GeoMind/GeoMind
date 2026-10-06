import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Frontière de la clé service_role (bypass RLS).
 *
 * L'espace client de chantier est ouvert sans compte, par un simple lien : la
 * clé qui contourne RLS ne doit y entrer que par un seul module,
 * lib/chantiers/storage-admin.ts, marqué 'server-only' pour qu'aucun
 * composant client ne puisse l'embarquer.
 *
 * Au-delà, la liste des fichiers qui touchent la clé est figée pour tout le
 * dépôt : un nouvel import fait échouer ce test, et doit être ajouté ici en
 * connaissance de cause. Les trois usages historiques (suppression de compte,
 * audit public, inscription) restent autorisés.
 */

const ADMIN_CLIENT_IMPORTERS = [
  'app/(app)/settings/account/actions.ts',
  'app/(auth)/actions.ts',
  'app/actions/public-audit.ts',
  'lib/chantiers/storage-admin.ts',
]

const SERVICE_KEY_READERS = ['lib/env.ts', 'lib/supabase/admin.ts', 'tests/e2e/fixtures/auth.ts']

const STORAGE_ADMIN = 'lib/chantiers/storage-admin.ts'
const THIS_FILE = 'tests/unit/chantiers/service-role-boundary.test.ts'

const ROOTS = ['app', 'lib', 'components', 'scripts', 'tests', 'middleware.ts', 'instrumentation.ts']
const SKIP_DIRS = new Set(['node_modules', '.next', 'test-results', 'playwright-report'])
const CODE = /\.(ts|tsx|js|mjs|cjs)$/

function walk(path: string): string[] {
  let entries
  try {
    entries = readdirSync(path, { withFileTypes: true })
  } catch {
    return CODE.test(path) ? [path] : []
  }
  return entries.flatMap((e) => {
    if (e.isDirectory()) return SKIP_DIRS.has(e.name) ? [] : walk(join(path, e.name))
    return CODE.test(e.name) ? [join(path, e.name)] : []
  })
}

const files = ROOTS.flatMap(walk).filter((f) => f !== THIS_FILE)
const sources = new Map(files.map((f) => [f, readFileSync(f, 'utf8')]))

const ADMIN_IMPORT = /['"](?:@\/lib\/|(?:\.\.?\/)+(?:lib\/)?)supabase\/admin['"]/
const STORAGE_ADMIN_IMPORT = /['"](?:@\/lib\/chantiers\/|\.\/|(?:\.\.\/)+(?:lib\/)?chantiers\/)storage-admin['"]/

describe('frontière service_role', () => {
  it('le scan voit bien le code du dépôt', () => {
    expect(files.length).toBeGreaterThan(100)
    expect(sources.has(STORAGE_ADMIN)).toBe(true)
  })

  it('seuls les fichiers autorisés importent le client admin Supabase', () => {
    const importers = files.filter((f) => ADMIN_IMPORT.test(sources.get(f) ?? '')).sort()
    expect(importers).toEqual([...ADMIN_CLIENT_IMPORTERS].sort())
  })

  it('seuls les fichiers autorisés lisent SUPABASE_SERVICE_ROLE_KEY', () => {
    const readers = files.filter((f) => (sources.get(f) ?? '').includes('SUPABASE_SERVICE_ROLE_KEY')).sort()
    expect(readers).toEqual([...SERVICE_KEY_READERS].sort())
  })

  it("dans l'espace chantier, storage-admin est le seul point d'entrée", () => {
    const chantierCode = files.filter(
      (f) => /chantier/i.test(f) && f !== STORAGE_ADMIN && !f.startsWith('tests/')
    )
    for (const f of chantierCode) {
      const src = sources.get(f) ?? ''
      expect(ADMIN_IMPORT.test(src), `${f} importe le client admin`).toBe(false)
      expect(src.includes('SUPABASE_SERVICE_ROLE_KEY'), `${f} lit la clé`).toBe(false)
    }
  })

  it("storage-admin est marqué 'server-only' en première ligne", () => {
    const firstLine = (sources.get(STORAGE_ADMIN) ?? '').split('\n')[0]
    expect(firstLine).toBe("import 'server-only'")
  })

  it("aucun composant client n'importe storage-admin", () => {
    const offenders = files.filter((f) => {
      const src = sources.get(f) ?? ''
      return /^\s*['"]use client['"]/.test(src) && STORAGE_ADMIN_IMPORT.test(src)
    })
    expect(offenders).toEqual([])
  })
})
