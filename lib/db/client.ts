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
const queryClient = postgres(env.DATABASE_URL, { prepare: false })

// ─── Instance Drizzle ─────────────────────────────────────────────────────────────
export const db = drizzle(queryClient, { schema })
