// Preuve en base : un utilisateur connecté peut-il se donner le plan admin ?
// Usage : npx tsx scripts/audit/check-admin-escalation.ts
//
// Joue exactement ce que ferait un client avec la clé publique et sa session
// (rôle `authenticated`, auth.uid() = lui-même) contre la vraie base, en
// essayant de passer sa propre ligne de subscriptions en admin, puis d'en
// créer une. Essaie enfin avec service_role, pour vérifier que le trigger de
// 0024 tient à lui seul. Tout se passe dans une transaction TOUJOURS annulée :
// rien n'est écrit, quel que soit le résultat.
//
// Sortie : PROTÉGÉ (code 0) ou VULNÉRABLE (code 1).

import postgres from 'postgres'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local'), quiet: true })

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error('DATABASE_URL manquant dans .env.local')

const sql = postgres(DATABASE_URL, { ssl: 'require', max: 1, onnotice: () => {} })

class Rollback extends Error {}

type Attempt = { label: string; outcome: string; escalated: boolean }

async function attempt(
  label: string,
  userId: string,
  role: 'authenticated' | 'service_role',
  run: (tx: postgres.TransactionSql) => Promise<number>
): Promise<Attempt> {
  let result: Attempt = { label, outcome: '', escalated: false }
  try {
    await sql.begin(async (tx) => {
      await tx`select set_config('request.jwt.claims', ${JSON.stringify({ sub: userId, role: 'authenticated' })}, true)`
      await tx`select set_config('request.jwt.claim.sub', ${userId}, true)`
      await tx.unsafe(`set local role ${role}`)
      try {
        const rows = await run(tx)
        result = {
          label,
          outcome: rows > 0 ? `${rows} ligne(s) passée(s) en admin` : 'aucune ligne modifiée',
          escalated: rows > 0,
        }
      } catch (err) {
        result = { label, outcome: `refusé : ${(err as Error).message}`, escalated: false }
      }
      throw new Rollback()
    })
  } catch (err) {
    if (!(err instanceof Rollback)) throw err
  }
  return result
}

async function main() {
  const [withSub] = await sql<{ user_id: string }[]>`
    select user_id from subscriptions where plan <> 'admin' limit 1
  `
  const [withoutSub] = await sql<{ id: string }[]>`
    select p.id from profiles p
    where not exists (select 1 from subscriptions s where s.user_id = p.id)
    limit 1
  `

  const attempts: Attempt[] = []
  if (withSub) {
    attempts.push(
      await attempt('UPDATE de sa propre ligne', withSub.user_id, 'authenticated', async (tx) => {
        const rows = await tx`
          update subscriptions set plan = 'admin', status = 'active'
          where user_id = ${withSub.user_id} returning id
        `
        return rows.length
      })
    )
  }
  if (withoutSub) {
    attempts.push(
      await attempt('INSERT d’une ligne admin', withoutSub.id, 'authenticated', async (tx) => {
        const rows = await tx`
          insert into subscriptions (user_id, plan, status)
          values (${withoutSub.id}, 'admin', 'active') returning id
        `
        return rows.length
      })
    )
  }

  if (withSub) {
    // Le trigger seul : service_role contourne RLS et garde ses droits d'écriture
    attempts.push(
      await attempt('UPDATE en service_role (trigger seul)', withSub.user_id, 'service_role', async (tx) => {
        const rows = await tx`
          update subscriptions set plan = 'admin' where user_id = ${withSub.user_id} returning id
        `
        return rows.length
      })
    )
  }

  for (const a of attempts) console.log(`  ${a.escalated ? '✗' : '✓'} ${a.label} : ${a.outcome}`)
  if (attempts.length === 0) console.log('  (aucun compte pour tester)')

  const vulnerable = attempts.some((a) => a.escalated)
  console.log(vulnerable ? '\nVULNÉRABLE' : '\nPROTÉGÉ')
  console.log('Transactions annulées : aucune donnée modifiée.')
  await sql.end()
  process.exit(vulnerable ? 1 : 0)
}

main().catch(async (err) => {
  console.error('❌ Vérification impossible :', err)
  await sql.end()
  process.exit(2)
})
