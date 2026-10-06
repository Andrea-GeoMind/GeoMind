import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { CHANTIER_PRIVATE_HEADERS } from '@/lib/chantiers/headers'

/**
 * Corrections de l'audit de sécurité du 07/10/2026 sur l'espace chantier.
 * Chaque test verrouille un constat corrigé ; les essais réels en production
 * sont décrits dans le compte rendu de l'audit.
 */

const read = (f: string) => readFileSync(f, 'utf8')

describe('lien et limite de débit', () => {
  it('une IP qui a épuisé ses faux liens n’obtient plus aucune vérification', () => {
    const access = read('lib/chantiers/access.ts')
    const body = access.slice(access.indexOf('export async function checkChantierToken'))
    const peek = body.indexOf('peekRateLimit(badTokenKey')
    const lookup = body.indexOf('findChantierByToken(token)')
    expect(peek).toBeGreaterThan(-1)
    expect(peek).toBeLessThan(lookup)
    expect(body.slice(peek, lookup)).toMatch(/return \{ ok: false, state: 'rate_limited', chantier: null \}/)
  })
})

describe('adresse d’envoi signée réutilisée après suppression', () => {
  const service = read('lib/chantiers/file-service.ts')

  it('un fichier de moins de 2 h laisse un fichier vide à sa place, pas un emplacement libre', () => {
    const body = service.slice(service.indexOf('async function deleteRows'), service.indexOf('/** Fichiers vivants'))
    expect(body).toMatch(/occupyWithTombstones\(rows\.filter\(uploadStillPossible\)/)
    expect(body).toMatch(/removeObjects\(rows\.filter\(\(r\) => !uploadStillPossible\(r\)\)/)
    expect(body).toMatch(/now\.getTime\(\) - r\.createdAt\.getTime\(\) < PENDING_UPLOAD_TTL_MS/)
  })

  it('le fichier vide occupe l’emplacement sans upsert possible côté client', () => {
    const storage = read('lib/chantiers/storage-admin.ts')
    expect(storage).toMatch(/upload\(path, empty, \{ upsert: true, contentType: 'text\/csv' \}\)/)
    // L'adresse signée du client, elle, n'autorise jamais l'écrasement
    expect(read('components/features/chantier-space/file-field.tsx')).toMatch(/'x-upsert', 'false'/)
  })

  it('le balayage horaire retire tout objet sans fichier vivant', () => {
    expect(service).toMatch(/export async function cleanupOrphanObjects/)
    expect(service).toMatch(/f\.id is null or \(f\.status = 'deleted' and f\.created_at <= \$\{cutoff\}::timestamptz\)/)
    // Le SQL brut ne convertit pas les Date : la borne doit partir en texte ISO
    expect(service).toMatch(/const cutoff = new Date\(now\.getTime\(\) - PENDING_UPLOAD_TTL_MS\)\.toISOString\(\)/)
    expect(read('lib/inngest/functions/chantier-files-maintenance.ts')).toMatch(
      /step\.run\('cleanup-orphan-objects', \(\) => cleanupOrphanObjects\(\)\)/
    )
  })
})

describe('droits SQL', () => {
  const sql = read('drizzle/0026_chantier_grants.sql')

  it('anon n’a plus aucun droit sur les 7 tables', () => {
    expect(sql).toMatch(/REVOKE ALL ON[\s\S]*public\.rate_limits\s+FROM anon;/)
    for (const t of ['chantiers', 'chantier_establishments', 'chantier_answers', 'chantier_answer_revisions', 'chantier_files', 'chantier_access_logs', 'rate_limits']) {
      expect(sql.slice(0, sql.indexOf('FROM anon')), t).toContain(`public.${t}`)
    }
  })

  it('authenticated : lecture seule, jamais TRUNCATE', () => {
    expect(sql).toMatch(/REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON[\s\S]*FROM authenticated;/)
    expect(sql).toMatch(/REVOKE ALL ON\s+public\.chantier_access_logs,\s+public\.rate_limits\s+FROM authenticated;/)
    expect(sql).not.toMatch(/GRANT[^;]*(INSERT|UPDATE|DELETE|TRUNCATE|ALL)[^;]*TO (anon|authenticated)/)
  })
})

describe('en-têtes de /chantier', () => {
  it('jamais dans un cadre, pas de devinette de type', () => {
    const keys = Object.fromEntries(CHANTIER_PRIVATE_HEADERS.map((h) => [h.key, h.value]))
    expect(keys['X-Frame-Options']).toBe('DENY')
    expect(keys['Content-Security-Policy']).toBe("frame-ancestors 'none'")
    expect(keys['X-Content-Type-Options']).toBe('nosniff')
    const config = read('next.config.mjs')
    for (const [k, v] of Object.entries(keys)) expect(config, k).toContain(`{ key: '${k}', value: ${k === 'Content-Security-Policy' ? `"${v}"` : `'${v}'`} }`)
  })
})

describe('ce que reçoit le navigateur du client', () => {
  it('les options du chantier se limitent aux champs activés (pas l’adresse des alertes)', () => {
    const page = read('app/chantier/espace/page.tsx')
    expect(page).toMatch(/chantierOptions=\{\{ extraFields: chantier\.options\.extraFields \?\? \[\] \}\}/)
    expect(page).not.toMatch(/chantierOptions=\{chantier\.options\}/)
  })
})
