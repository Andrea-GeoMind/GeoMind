// Crée les deux premiers chantiers (Oravis, Home Sweet Event) en brouillon.
// Usage : npx tsx scripts/chantiers/seed-oravis-hse.ts <email du compte admin>
//
// Idempotent : un chantier qui existe déjà (même client, même propriétaire)
// est laissé tel quel. Aucun lien n'est émis ici : les liens s'émettent depuis
// /dashboard/chantiers, et ne s'affichent qu'une fois, dans le navigateur.

import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local'), quiet: true })

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage : npx tsx scripts/chantiers/seed-oravis-hse.ts <email du compte admin>')
    process.exit(1)
  }

  // Imports après dotenv : lib/env valide les variables au chargement
  const { eq } = await import('drizzle-orm')
  const { db } = await import('@/lib/db/client')
  const { profiles } = await import('@/lib/db/schema')
  const { getSubscriptionByUserId } = await import('@/lib/db/queries/subscriptions')
  const { createChantier, findChantierByClientName } = await import('@/lib/db/queries/chantiers')
  const { isActiveAdmin } = await import('@/lib/plans')
  const { CHANTIER_SEEDS, seedToInput } = await import('@/lib/chantiers/seed-data')
  const { chantierInputSchema } = await import('@/lib/chantiers/validation')
  const { DEFAULT_GEOMIND_ADDRESS } = await import('@/lib/chantiers/copy')

  // Colonnes explicites : profiles.avatar_url est déclarée dans le schéma
  // Drizzle mais absente de la base, un select() complet échoue.
  const [owner] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.email, email))
    .limit(1)
  if (!owner) throw new Error(`Aucun compte pour ${email}`)
  if (!isActiveAdmin(await getSubscriptionByUserId(owner.id))) {
    throw new Error(`${email} n'a pas le plan admin actif`)
  }

  for (const seed of CHANTIER_SEEDS) {
    const existing = await findChantierByClientName(owner.id, seed.clientName)
    if (existing) {
      console.log(`  = ${seed.clientName} : existe déjà (${existing.status}), laissé tel quel`)
      continue
    }
    const input = chantierInputSchema.parse(seedToInput(seed, DEFAULT_GEOMIND_ADDRESS))
    const id = await createChantier(owner.id, input)
    console.log(
      `  + ${seed.clientName} : créé en brouillon (${input.establishments.length} établissement(s)) — ${id}`
    )
  }

  console.log('\nLiens à émettre depuis /dashboard/chantiers.')
  process.exit(0)
}

main().catch((err) => {
  console.error('❌', err instanceof Error ? err.message : err)
  process.exit(1)
})
