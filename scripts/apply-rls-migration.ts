// Script one-shot : applique drizzle/0009_rls_all_tables.sql sur Supabase.
// Idempotent — ré-exécutable sans risque.
// Usage : npx tsx scripts/apply-rls-migration.ts

import postgres from 'postgres'
import * as dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error('DATABASE_URL manquant dans .env.local')

const sql = postgres(DATABASE_URL, { ssl: 'require', max: 1 })

async function main() {
  console.log('🚀 Application des policies RLS (0009)…')

  const file = readFileSync(resolve(process.cwd(), 'drizzle/0009_rls_all_tables.sql'), 'utf8')

  // Retire les lignes de commentaires puis découpe en statements : le fichier
  // ne contient que des statements simples (pas de DO $$ … $$), un split sur
  // ';' est sûr.
  const withoutComments = file
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
  const statements = withoutComments
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  for (const statement of statements) {
    await sql.unsafe(statement)
    const label = statement.split('\n')[0].slice(0, 80)
    console.log(`✓ ${label}`)
  }

  await sql.end()
  console.log('\n✅ RLS activée et policies en place sur les 12 tables métier.')
}

main().catch((err) => {
  console.error('❌ Erreur migration RLS :', err)
  process.exit(1)
})
