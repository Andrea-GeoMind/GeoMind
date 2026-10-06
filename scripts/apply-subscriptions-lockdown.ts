// Script one-shot : applique drizzle/0024_subscriptions_read_only.sql sur Supabase.
// Idempotent — ré-exécutable sans risque.
// Usage : npx tsx scripts/apply-subscriptions-lockdown.ts
// Puis : npx tsx scripts/audit/check-admin-escalation.ts (doit répondre PROTÉGÉ)

import postgres from 'postgres'
import * as dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local'), quiet: true })

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error('DATABASE_URL manquant dans .env.local')

const sql = postgres(DATABASE_URL, { ssl: 'require', max: 1, onnotice: () => {} })

async function main() {
  console.log('🔒 Verrouillage de subscriptions (0024)…')
  const file = readFileSync(resolve(process.cwd(), 'drizzle/0024_subscriptions_read_only.sql'), 'utf8')
  await sql.unsafe(file)

  const policies = await sql<{ policyname: string; cmd: string }[]>`
    select policyname, cmd from pg_policies
    where schemaname = 'public' and tablename = 'subscriptions'
  `
  console.log('  policies :', policies.map((p) => `${p.policyname} (${p.cmd})`).join(', '))

  const grants = await sql<{ grantee: string; privileges: string }[]>`
    select grantee, string_agg(privilege_type, ',' order by privilege_type) as privileges
    from information_schema.role_table_grants
    where table_schema = 'public' and table_name = 'subscriptions'
      and grantee in ('anon', 'authenticated')
    group by grantee
  `
  for (const g of grants) console.log(`  droits ${g.grantee} : ${g.privileges}`)

  const [trigger] = await sql`
    select 1 from pg_trigger where tgname = 'subscriptions_guard_admin_plan' and not tgisinternal
  `
  console.log('  trigger guard_admin_plan :', trigger ? 'présent ✓' : 'ABSENT ⚠️')

  await sql.end()
  console.log('✅ Terminé.')
}

main().catch(async (err) => {
  console.error('❌ Échec :', err)
  await sql.end()
  process.exit(1)
})
