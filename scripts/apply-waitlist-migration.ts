// Script one-shot : applique drizzle/0020_waitlist_signups.sql sur Supabase.
// Idempotent — ré-exécutable sans risque (CREATE TABLE IF NOT EXISTS).
// Usage : npx tsx scripts/apply-waitlist-migration.ts

import postgres from 'postgres'
import * as dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error('DATABASE_URL manquant dans .env.local')

const sql = postgres(DATABASE_URL, { ssl: 'require', max: 1 })

async function main() {
  console.log('🚀 Application de la migration waitlist (0020)…')

  const file = readFileSync(resolve(process.cwd(), 'drizzle/0020_waitlist_signups.sql'), 'utf8')
  const statements = file
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)

  for (const statement of statements) {
    await sql.unsafe(statement)
    console.log(`  ✓ ${statement.slice(0, 60).replace(/\s+/g, ' ')}…`)
  }

  const check = await sql`
    select rowsecurity from pg_tables
    where schemaname = 'public' and tablename = 'waitlist_signups'
  `
  console.log('RLS activée :', check[0]?.rowsecurity === true ? 'oui ✓' : 'NON ⚠️')

  await sql.end()
  console.log('✅ Terminé.')
}

main().catch((err) => {
  console.error('❌ Échec migration :', err)
  process.exit(1)
})
