// Applique un fichier de migration SQL écrit à la main (idempotent) sur Supabase.
// Usage : npx tsx scripts/apply-sql-migration.ts drizzle/0025_chantier_alerts.sql
//
// Le fichier est envoyé d'un seul tenant (protocole simple, plusieurs
// instructions), ce qui accepte les blocs DO $$ … $$.

import postgres from 'postgres'
import * as dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local'), quiet: true })

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error('DATABASE_URL manquant dans .env.local')
const file = process.argv[2]
if (!file || !/^drizzle\/\d{4}_[a-z0-9_]+\.sql$/.test(file)) {
  throw new Error('Usage : npx tsx scripts/apply-sql-migration.ts drizzle/00XX_nom.sql')
}

const sql = postgres(DATABASE_URL, { ssl: 'require', max: 1, onnotice: () => {} })

async function main() {
  console.log(`Application de ${file}…`)
  await sql.unsafe(readFileSync(resolve(process.cwd(), file), 'utf8'))
  await sql.end()
  console.log('✅ Terminé.')
}

main().catch(async (err) => {
  console.error('❌ Échec :', err)
  await sql.end()
  process.exit(1)
})
