// Script one-shot : applique drizzle/0023_chantiers.sql sur Supabase.
// Idempotent — ré-exécutable sans risque.
// Usage : npx tsx scripts/apply-chantiers-migration.ts
//
// Le fichier contient des blocs DO $$ … $$ : on l'envoie d'un seul tenant
// (protocole simple, plusieurs instructions) au lieu de le découper sur « ; ».

import postgres from 'postgres'
import * as dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error('DATABASE_URL manquant dans .env.local')

const sql = postgres(DATABASE_URL, { ssl: 'require', max: 1 })

const TABLES = [
  'chantiers',
  'chantier_establishments',
  'chantier_answers',
  'chantier_answer_revisions',
  'chantier_files',
  'chantier_access_logs',
  'rate_limits',
]

async function main() {
  console.log('🚀 Application de la migration chantiers (0023)…')

  const file = readFileSync(resolve(process.cwd(), 'drizzle/0023_chantiers.sql'), 'utf8')
  await sql.unsafe(file)

  const rls = await sql<{ tablename: string; rowsecurity: boolean }[]>`
    select tablename, rowsecurity from pg_tables
    where schemaname = 'public' and tablename in ${sql(TABLES)}
  `
  for (const table of TABLES) {
    const row = rls.find((r) => r.tablename === table)
    console.log(`  ${table} : ${!row ? 'ABSENTE ⚠️' : row.rowsecurity ? 'RLS ✓' : 'RLS NON ⚠️'}`)
  }

  const [bucket] = await sql<{ public: boolean; file_size_limit: number | null }[]>`
    select public, file_size_limit from storage.buckets where id = 'chantier-files'
  `
  console.log(
    '  bucket chantier-files :',
    bucket ? `privé=${!bucket.public}, limite=${bucket.file_size_limit} octets` : 'ABSENT ⚠️'
  )

  await sql.end()
  console.log('✅ Terminé.')
}

main().catch(async (err) => {
  console.error('❌ Échec migration :', err)
  await sql.end()
  process.exit(1)
})
