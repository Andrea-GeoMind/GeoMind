import { describe, it, expect, expectTypeOf, vi } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Personne ne peut se donner le plan admin.
 *
 * Le plan admin donne des crédits illimités et ouvre l'espace chantier côté
 * GeoMind. Jusqu'au 06/10/2026, la policy RLS de subscriptions (FOR ALL)
 * laissait n'importe quel compte passer sa propre ligne en admin via l'API
 * REST Supabase. La migration 0024 l'a fermée ; la preuve en base est
 * scripts/audit/check-admin-escalation.ts (transaction annulée, à relancer
 * après toute migration qui touche subscriptions).
 *
 * Ce test verrouille la partie vérifiable sans base :
 *   - les migrations : plus aucune policy d'écriture sur subscriptions ;
 *   - le code : une seule porte d'écriture, appelée par le seul webhook Stripe
 *     signé, avec un plan déduit d'un identifiant de prix — jamais admin ;
 *   - aucune route, action ou page n'écrit le plan admin en dur.
 */

vi.mock('@/lib/env', () => ({
  env: {
    STRIPE_SECRET_KEY: 'cle-factice-pour-les-tests',
    STRIPE_SOLO_PRICE_ID: 'price_solo_m',
    STRIPE_SOLO_ANNUAL_PRICE_ID: 'price_solo_a',
    STRIPE_PRO_PRICE_ID: 'price_pro_m',
    STRIPE_PRO_ANNUAL_PRICE_ID: 'price_pro_a',
    STRIPE_BUSINESS_PRICE_ID: 'price_business_m',
    STRIPE_BUSINESS_ANNUAL_PRICE_ID: undefined,
  },
}))

const CODE = /\.(ts|tsx)$/
function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : walk(join(dir, e.name))
    return CODE.test(e.name) ? [join(dir, e.name)] : []
  })
}
const appCode = ['app', 'lib', 'components'].flatMap(walk)
const read = (f: string) => readFileSync(f, 'utf8')

describe('migrations', () => {
  const migrations = readdirSync('drizzle')
    .filter((f) => /^\d{4}_.*\.sql$/.test(f))
    .sort()
  const lockdown = '0024_subscriptions_read_only.sql'

  it('0024 retire la policy FOR ALL, ne laisse que la lecture, retire les droits et pose le trigger', () => {
    const sql = read(`drizzle/${lockdown}`)
    expect(sql).toMatch(/DROP POLICY IF EXISTS "subscriptions: own data only"/)
    expect(sql).toMatch(/CREATE POLICY "subscriptions: own read" ON public\.subscriptions\s+FOR SELECT/)
    expect(sql).toMatch(/REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public\.subscriptions FROM anon, authenticated/)
    expect(sql).toMatch(/BEFORE INSERT OR UPDATE OF plan ON public\.subscriptions/)
    expect(sql).toMatch(/current_user NOT IN \('postgres', 'supabase_admin'\)/)
  })

  it('aucune migration postérieure ne rouvre l’écriture sur subscriptions', () => {
    const later = migrations.filter((f) => f > lockdown)
    for (const f of later) {
      const sql = read(`drizzle/${f}`)
      const policies = [...sql.matchAll(/CREATE POLICY[^;]*ON public\.subscriptions[^;]*;/gi)].map((m) => m[0])
      for (const p of policies) expect(p, f).toMatch(/FOR SELECT/i)
      expect(sql, f).not.toMatch(/GRANT[^;]*(INSERT|UPDATE|ALL)[^;]*subscriptions[^;]*(anon|authenticated)/i)
      expect(sql, f).not.toMatch(/DROP TRIGGER[^;]*subscriptions_guard_admin_plan/i)
    }
  })
})

describe('code applicatif', () => {
  it('une seule porte d’écriture sur subscriptions', () => {
    const writers = appCode.filter((f) =>
      /\.(insert|update|delete)\(subscriptions\)/.test(read(f))
    )
    expect(writers).toEqual(['lib/db/queries/subscriptions.ts'])
  })

  it('aucun accès à subscriptions par le SDK Supabase', () => {
    const viaSdk = appCode.filter((f) => /from\(\s*['"]subscriptions['"]\s*\)/.test(read(f)))
    expect(viaSdk).toEqual([])
  })

  it('upsertSubscription n’est appelé que par le webhook Stripe signé', () => {
    const callers = appCode.filter(
      (f) => f !== 'lib/db/queries/subscriptions.ts' && /upsertSubscription\(/.test(read(f))
    )
    expect(callers).toEqual(['app/api/stripe/webhooks/route.ts'])

    const webhook = read('app/api/stripe/webhooks/route.ts')
    expect(webhook).toMatch(/stripe\.webhooks\.constructEvent\(body, sig, env\.STRIPE_WEBHOOK_SECRET\)/)
    expect(webhook).toMatch(/const plan = planFromPriceId\(priceId\)/)
  })

  it('aucune route, action ou page n’attribue le plan admin en dur', () => {
    const offenders = appCode.filter((f) => /plan\s*[:=]\s*['"]admin['"]/.test(read(f)))
    expect(offenders).toEqual([])
  })
})

describe('planFromPriceId', () => {
  it('ne renvoie jamais admin, quel que soit l’identifiant de prix', async () => {
    const { planFromPriceId } = await import('@/lib/stripe')
    const inputs = ['price_solo_m', 'price_pro_a', 'price_business_m', 'admin', 'price_admin', '', 'undefined']
    for (const id of inputs) expect(planFromPriceId(id)).not.toBe('admin')
    expect(planFromPriceId('price_pro_a')).toBe('pro')
    // Un prix non configuré (undefined) ne doit pas correspondre à la chaîne vide
    expect(planFromPriceId('')).toBe('free')
  })

  it('son type de retour exclut admin', async () => {
    const { planFromPriceId } = await import('@/lib/stripe')
    expectTypeOf(planFromPriceId).returns.toEqualTypeOf<'free' | 'solo' | 'pro' | 'business'>()
  })
})
