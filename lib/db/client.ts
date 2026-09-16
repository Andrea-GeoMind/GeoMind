/**
 * lib/db/client.ts
 *
 * Instance Drizzle ORM pour interactions avec la base de données PostgreSQL.
 *
 * ⚠️ IMPORTANT : Supabase Transaction pooler (port 6543) utilise PgBouncer en mode Transaction,
 * qui NE supporte PAS les prepared statements. D'où { prepare: false }.
 *
 * Usage :
 *   import { db } from '@/lib/db/client'
 *   const users = await db.query.users.findMany()
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '@/lib/env'
import * as schema from '@/lib/db/schema'

// ─── Client PostgreSQL avec pooler Supabase (Transaction mode) ──────────────────
// PgBouncer en mode Transaction n'autorise pas les prepared statements.
//
// Les valeurs par défaut de postgres-js sont pensées pour un serveur qui vit
// longtemps, pas pour du serverless : `max: 10` et surtout `idle_timeout: null`,
// c'est-à-dire qu'une connexion inactive n'est JAMAIS rendue. Chaque instance
// Vercel garde donc jusqu'à 10 connexions ouvertes contre le pooler tant
// qu'elle est tiède, et les instances s'empilent sous la charge — jusqu'à
// épuiser les connexions clientes du pooler, ce qui fait échouer des requêtes
// au hasard sans qu'aucune soit fautive en elle-même.
const queryClient = postgres(env.DATABASE_URL, {
  prepare: false,
  // Empreinte bornée par instance : les quelques requêtes en parallèle du code
  // (Promise.all technique + contenu) passent, sans monopoliser le pooler.
  max: 5,
  // Rendre les connexions inactives au pooler au lieu de les retenir.
  idle_timeout: 20,
  // Recycler les connexions de longue durée : une instance tiède ne conserve
  // pas indéfiniment la même socket, qui peut avoir été coupée en amont.
  max_lifetime: 60 * 30,
  // Échouer vite plutôt que de consommer le budget d'exécution de la route
  // (maxDuration 30 s sur /api/public-audit) à attendre une connexion.
  connect_timeout: 10,
})

// ─── Instance Drizzle ─────────────────────────────────────────────────────────────
export const db = drizzle(queryClient, { schema })
