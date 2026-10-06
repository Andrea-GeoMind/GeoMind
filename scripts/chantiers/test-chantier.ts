// Chantier de test « TEST — à supprimer », pour vérifier l'espace client sans
// jamais toucher aux vrais chantiers.
//
// Usage :
//   npx tsx scripts/chantiers/test-chantier.ts create <email du compte admin>
//   npx tsx scripts/chantiers/test-chantier.ts link <base, ex. https://geomind.fr>
//   npx tsx scripts/chantiers/test-chantier.ts expire | revoke
//   npx tsx --conditions=react-server scripts/chantiers/test-chantier.ts delete
//
// delete vide d'abord le stockage (la suppression en base ne l'atteint pas),
// d'où la condition react-server, qu'exige l'import 'server-only'.
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
        alertEmail: DEFAULT_GEOMIND_ADDRESS,
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
      const { like } = await import('drizzle-orm')
      const { rateLimits } = await import('@/lib/db/schema')
      const { purgeChantierFiles } = await import('@/lib/chantiers/file-service')
      const { removeObjects } = await import('@/lib/chantiers/storage-admin')
      const { sql } = await import('drizzle-orm')
      for (const t of testChantiers) {
        const purged = await purgeChantierFiles(t.ownerId, t.id)
        // La purge laisse un fichier vide à la place des dépôts récents (ils
        // bloquent les adresses d'envoi encore valables) : un chantier de test
        // supprimé n'en a plus besoin.
        const leftovers = (await db.execute(
          sql`select name from storage.objects where bucket_id = 'chantier-files' and name like ${`${t.id}/%`}`
        )) as unknown as { name: string }[]
        await removeObjects(leftovers.map((o) => o.name))
        console.log(`Stockage vidé : ${purged?.count ?? 0} fichier(s), ${leftovers.length} objet(s) retiré(s)`)
        // Cascade : établissements, réponses, historique, fichiers, journal
        await db.delete(chantiers).where(eq(chantiers.id, t.id))
        await db.delete(rateLimits).where(like(rateLimits.key, `%:${t.id}`))
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
