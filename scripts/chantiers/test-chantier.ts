// Chantier de test « TEST — à supprimer », pour vérifier l'espace client sans
// jamais toucher aux vrais chantiers.
//
// Usage :
//   npx tsx scripts/chantiers/test-chantier.ts create <email du compte admin>
//   npx tsx scripts/chantiers/test-chantier.ts link <base, ex. https://geomind.fr>
//   npx tsx scripts/chantiers/test-chantier.ts expire | revoke | delete
//
// Toutes les commandes ne visent que le chantier portant exactement ce nom.

import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local'), quiet: true })

const TEST_NAME = 'TEST — à supprimer'

async function main() {
  const [command, arg] = process.argv.slice(2)
  const { eq } = await import('drizzle-orm')
  const { db } = await import('@/lib/db/client')
  const { chantiers, profiles } = await import('@/lib/db/schema')
  const { createChantier, issueChantierLink } = await import('@/lib/db/queries/chantiers')
  const { chantierInputSchema } = await import('@/lib/chantiers/validation')
  const { DEFAULT_GEOMIND_ADDRESS } = await import('@/lib/chantiers/copy')

  const testChantiers = await db.select().from(chantiers).where(eq(chantiers.clientName, TEST_NAME))
  const test = testChantiers[0]

  switch (command) {
    case 'create': {
      if (test) return console.log(`Existe déjà : ${test.id}`)
      if (!arg) throw new Error('Email du compte admin requis')
      const [owner] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.email, arg))
      if (!owner) throw new Error(`Aucun compte pour ${arg}`)
      const input = chantierInputSchema.parse({
        clientName: TEST_NAME,
        contactEmail: '',
        geomindAddress: DEFAULT_GEOMIND_ADDRESS,
        extraFields: ['hse.liste_maries', 'oravis.fiche_entrepot'],
        establishments: [
          {
            name: 'Domaine Test',
            kind: 'venue',
            website: 'https://exemple.fr',
            addressOptions: ['1 chemin du Test, 84000 Avignon', '2 route du Test, 84000 Avignon'],
            extraFields: ['hameau.figaro_reference', 'hameau.figaro_file'],
          },
          {
            name: 'Loueur Test',
            kind: 'rental',
            website: '',
            addressOptions: ['3 avenue du Test, 84300 Cavaillon'],
            extraFields: [],
          },
        ],
      })
      return console.log(`Créé : ${await createChantier(owner.id, input)}`)
    }
    case 'link': {
      if (!test) throw new Error('Pas de chantier de test')
      const token = await issueChantierLink(test.ownerId, test.id, 'script')
      return console.log(`${(arg ?? 'https://geomind.fr').replace(/\/$/, '')}/chantier/${token}`)
    }
    case 'expire': {
      if (!test) throw new Error('Pas de chantier de test')
      await db.update(chantiers).set({ tokenExpiresAt: new Date(Date.now() - 60_000) }).where(eq(chantiers.id, test.id))
      return console.log('Lien expiré')
    }
    case 'revoke': {
      if (!test) throw new Error('Pas de chantier de test')
      await db.update(chantiers).set({ tokenRevokedAt: new Date() }).where(eq(chantiers.id, test.id))
      return console.log('Lien révoqué')
    }
    case 'delete': {
      for (const t of testChantiers) {
        await db.delete(chantiers).where(eq(chantiers.id, t.id))
        console.log(`Supprimé : ${t.id}`)
      }
      if (testChantiers.length === 0) console.log('Rien à supprimer')
      return
    }
    default:
      throw new Error('Commande : create | link | expire | revoke | delete')
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌', err instanceof Error ? err.message : err)
    process.exit(1)
  })
