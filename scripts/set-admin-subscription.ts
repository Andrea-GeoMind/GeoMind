// Script one-shot : donne un abonnement admin illimité à un utilisateur par email.
// Usage : npx tsx scripts/set-admin-subscription.ts <email>
// Exemple : npx tsx scripts/set-admin-subscription.ts andreaschwertz@icloud.com

import postgres from 'postgres'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Cherche .env.local dans le répertoire courant, sinon 3 niveaux au-dessus (worktree → projet root)
const envLocal = resolve(process.cwd(), '.env.local')
const envParent = resolve(process.cwd(), '../../..', '.env.local')
dotenv.config({ path: envLocal })
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: envParent })
}

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error('DATABASE_URL manquant dans .env.local')

const targetEmail = process.argv[2]
if (!targetEmail) {
  console.error('Usage : npx tsx scripts/set-admin-subscription.ts <email>')
  process.exit(1)
}

const sql = postgres(DATABASE_URL, { ssl: 'require', max: 1 })

async function main() {
  console.log(`\n🔧 Configuration abonnement admin pour : ${targetEmail}\n`)

  // 1. Ajouter 'admin' à l'enum si pas encore présent (idempotent)
  try {
    await sql`ALTER TYPE "plan" ADD VALUE IF NOT EXISTS 'admin'`
    console.log("✅ Enum 'plan' : valeur 'admin' présente")
  } catch (e) {
    // Postgres < 9.6 ne supporte pas IF NOT EXISTS — ignorer si déjà existant
    const msg = (e as Error).message
    if (!msg.includes('already exists')) throw e
    console.log("✅ Enum 'plan' : valeur 'admin' déjà présente")
  }

  // 2. Trouver l'utilisateur dans profiles par email
  const [profile] = await sql<{ id: string; email: string }[]>`
    SELECT id, email FROM public.profiles WHERE email = ${targetEmail} LIMIT 1
  `

  if (!profile) {
    console.error(`❌ Aucun profil trouvé pour l'email : ${targetEmail}`)
    console.error('   Vérifiez que le compte existe dans Supabase Auth.')
    process.exit(1)
  }

  console.log(`✅ Profil trouvé : ${profile.id}`)

  // 3. Upsert de la subscription en plan admin (pas de contrainte UNIQUE sur user_id)
  const existing = await sql<{ id: string }[]>`
    SELECT id FROM public.subscriptions WHERE user_id = ${profile.id} LIMIT 1
  `

  let sub: { id: string; plan: string; status: string }
  if (existing.length > 0) {
    const [updated] = await sql<{ id: string; plan: string; status: string }[]>`
      UPDATE public.subscriptions SET
        plan = 'admin',
        status = 'active',
        stripe_subscription_id = NULL,
        current_period_end = NULL,
        updated_at = NOW()
      WHERE user_id = ${profile.id}
      RETURNING id, plan, status
    `
    sub = updated
  } else {
    const [created] = await sql<{ id: string; plan: string; status: string }[]>`
      INSERT INTO public.subscriptions (user_id, plan, status, created_at, updated_at)
      VALUES (${profile.id}, 'admin', 'active', NOW(), NOW())
      RETURNING id, plan, status
    `
    sub = created
  }

  console.log(`✅ Abonnement upsert : id=${sub.id}, plan=${sub.plan}, status=${sub.status}`)
  console.log(`\n🎉 ${targetEmail} a maintenant un accès admin illimité.\n`)

  await sql.end()
}

main().catch((err) => {
  console.error('❌ Erreur :', err)
  process.exit(1)
})
