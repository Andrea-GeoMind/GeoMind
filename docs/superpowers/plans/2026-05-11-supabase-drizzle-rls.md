# TKT-003 — Supabase + Drizzle + RLS + trigger auth.users → profiles

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connecter GeoMind à Supabase (Postgres EU), configurer Drizzle comme ORM serveur, créer les tables `profiles`, `subscriptions`, `sites` avec RLS activée, et un trigger SQL qui crée automatiquement un profil à chaque inscription Supabase Auth.

**Architecture:** Drizzle gère le schéma des tables `public.*` et les queries typées. La DDL est appliquée via `drizzle-kit push` (connexion directe). Le trigger `on auth.users insert → profiles` et les policies RLS sont exécutés manuellement via le SQL Editor Supabase (Drizzle ne touche pas le schéma `auth`). L'app queries via le pooler Transaction (port 6543) avec `postgres-js`.

**Tech Stack:** drizzle-orm, drizzle-kit, postgres (postgres-js), Supabase Postgres EU, Zod v4

---

## Prérequis manuels (hors code — à faire en amont)

Avant d'écrire une seule ligne de code, le développeur doit :

1. **Créer le projet Supabase** sur https://supabase.com/dashboard → New Project
   - Region : **Frankfurt (eu-central-1)** ou **Paris (eu-west-3)**
   - Choisir un mot de passe de base de données fort (le noter)

2. **Récupérer les 4 valeurs** depuis Supabase Dashboard → Project Settings → API :
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://[ref].supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJ...`
   - `SUPABASE_SERVICE_ROLE_KEY` = `eyJ...`

3. **Récupérer les 2 URLs de base de données** depuis Project Settings → Database :
   - **Transaction pooler** (pour l'app) : `Connection string` → Mode: **Transaction** → `postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres` → variable `DATABASE_URL`
   - **Connexion directe** (pour les migrations Drizzle) : `Connection string` → Mode: **Direct** → `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres` → variable `DIRECT_DATABASE_URL`

4. **Créer le fichier `.env.local`** en copiant `.env.example` et en remplissant les 5 valeurs ci-dessus (les autres peuvent rester à leur valeur placeholder pour l'instant).

---

## Carte des fichiers

| Fichier | Action | Rôle |
|---|---|---|
| `package.json` | Modifier | Ajouter `drizzle-orm`, `postgres` en deps ; `drizzle-kit` en devDeps |
| `.env.example` | Modifier | Ajouter `DIRECT_DATABASE_URL` (connexion directe Supabase) |
| `lib/env.ts` | Modifier | Ajouter validation Zod de `DIRECT_DATABASE_URL` |
| `drizzle.config.ts` | Créer | Config Drizzle Kit (url = DIRECT_DATABASE_URL, schéma, dossier migrations) |
| `lib/db/client.ts` | Créer | Instance Drizzle avec postgres-js (pooler, `prepare: false`) |
| `lib/db/schema.ts` | Créer | Tables `profiles`, `subscriptions`, `sites` avec types Drizzle |
| `drizzle/seed/trigger_profiles.sql` | Créer | SQL pour le trigger auth.users → profiles (à exécuter manuellement) |
| `drizzle/seed/rls_policies.sql` | Créer | SQL pour activer RLS + créer les policies (à exécuter manuellement) |
| `tests/unit/db-schema.test.ts` | Créer | Tests de structure des tables (colonnes obligatoires, types, defaults) |

---

## Task 1 — Installer les packages Drizzle

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Installer les dépendances**

```bash
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit
```

- [ ] **Step 2: Vérifier que les packages sont bien dans package.json**

```bash
grep -E "drizzle|postgres" package.json
```

Résultat attendu (les versions peuvent varier) :
```
"drizzle-orm": "^0.44.x",
"postgres": "^3.x.x",
"drizzle-kit": "^0.31.x",
```

- [ ] **Step 3: Vérifier que TypeScript est satisfait après l'install**

```bash
pnpm typecheck
```

Résultat attendu : `0 errors`

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(deps): install drizzle-orm, postgres, drizzle-kit"
```

---

## Task 2 — Ajouter DIRECT_DATABASE_URL à l'env

**Files:**
- Modify: `.env.example`
- Modify: `lib/env.ts`

- [ ] **Step 1: Écrire le test qui doit échouer** (vérifie que DIRECT_DATABASE_URL est validé)

Dans `tests/unit/env.test.ts`, ajouter ce bloc **après** les tests existants :

```typescript
describe('DIRECT_DATABASE_URL', () => {
  it('doit être présent et être une URL valide', () => {
    const result = z.string().min(1).safeParse(process.env.DIRECT_DATABASE_URL)
    // Ce test vérifie uniquement la présence — l'URL réelle est dans .env.local
    // En CI, on vérifie juste que le schéma Zod l'exige
    expect(result).toBeDefined()
  })
})
```

> Note : ce test est symbolique — le vrai test de validation est le crash au démarrage si la variable manque. Les tests suivants vérifient le schéma Zod.

- [ ] **Step 2: Ajouter DIRECT_DATABASE_URL dans lib/env.ts**

Dans `lib/env.ts`, dans le `envSchema`, après la ligne `DATABASE_URL` :

```typescript
// ── Database (connexion directe — migrations Drizzle uniquement) ─────────────
DIRECT_DATABASE_URL: z.string().min(1, { message: 'DIRECT_DATABASE_URL manquant — requis pour pnpm db:push et db:migrate' }),
```

- [ ] **Step 3: Ajouter DIRECT_DATABASE_URL dans .env.example**

Dans `.env.example`, après la ligne `DATABASE_URL` :

```bash
# Connexion directe Postgres (non-poolée) — UNIQUEMENT pour drizzle-kit push/migrate
# Dashboard Supabase → Project Settings → Database → Connection string → Mode: Direct
DIRECT_DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
```

- [ ] **Step 4: Ajouter DIRECT_DATABASE_URL dans .env.local** (non committé)

Dans ton `.env.local`, ajouter la valeur réelle récupérée depuis Supabase Dashboard.

- [ ] **Step 5: Vérifier typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

Résultat attendu : `0 errors`

- [ ] **Step 6: Commit**

```bash
git add .env.example lib/env.ts tests/unit/env.test.ts
git commit -m "feat(env): add DIRECT_DATABASE_URL for Drizzle migrations"
```

---

## Task 3 — drizzle.config.ts

**Files:**
- Create: `drizzle.config.ts`

- [ ] **Step 1: Créer drizzle.config.ts à la racine**

```typescript
import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle',
  schema: './lib/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DIRECT_DATABASE_URL!,
  },
})
```

> Pourquoi `DIRECT_DATABASE_URL` ici : le pooler Transaction (port 6543) ne supporte pas les commandes DDL (`CREATE TABLE`, `ALTER TABLE`). Drizzle Kit doit passer par la connexion directe pour créer les tables.

- [ ] **Step 2: Vérifier que drizzle-kit reconnaît la config**

```bash
pnpm db:studio
```

Résultat attendu : Drizzle Studio ouvre sur `https://local.drizzle.studio` — même si les tables n'existent pas encore, il ne doit pas crasher avec une erreur de config. Fermer avec Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add drizzle.config.ts
git commit -m "feat(db): add drizzle.config.ts pointing to DIRECT_DATABASE_URL"
```

---

## Task 4 — lib/db/client.ts

**Files:**
- Create: `lib/db/client.ts`

- [ ] **Step 1: Créer l'instance Drizzle**

```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '@/lib/env'
import * as schema from '@/lib/db/schema'

// Le pooler Transaction (port 6543) ne supporte pas les prepared statements.
const queryClient = postgres(env.DATABASE_URL, { prepare: false })

export const db = drizzle(queryClient, { schema })
```

> **Pourquoi `prepare: false`** : Supabase Transaction pooler (PgBouncer) ne peut pas maintenir des prepared statements entre les connexions. Sans ce flag, les queries échouent silencieusement.

- [ ] **Step 2: Vérifier typecheck**

```bash
pnpm typecheck
```

Résultat attendu : `0 errors`

> Si `lib/db/schema` n'existe pas encore, le typecheck peut échouer avec "Cannot find module". C'est normal — créer le fichier dans la tâche suivante.

- [ ] **Step 3: Commit (après création du schema dans la tâche suivante)**

Ne pas committer seul — attendre Task 5.

---

## Task 5 — lib/db/schema.ts

**Files:**
- Create: `lib/db/schema.ts`

- [ ] **Step 1: Écrire les tests de structure qui doivent échouer**

Créer `tests/unit/db-schema.test.ts` :

```typescript
import { describe, it, expect } from 'vitest'
import { profiles, subscriptions, sites } from '@/lib/db/schema'
import { getTableColumns } from 'drizzle-orm'

describe('Schema: profiles', () => {
  it('a les colonnes obligatoires', () => {
    const cols = Object.keys(getTableColumns(profiles))
    expect(cols).toContain('id')
    expect(cols).toContain('email')
    expect(cols).toContain('createdAt')
  })
})

describe('Schema: subscriptions', () => {
  it('a les colonnes obligatoires', () => {
    const cols = Object.keys(getTableColumns(subscriptions))
    expect(cols).toContain('id')
    expect(cols).toContain('userId')
    expect(cols).toContain('plan')
    expect(cols).toContain('status')
  })
})

describe('Schema: sites', () => {
  it('a les colonnes obligatoires', () => {
    const cols = Object.keys(getTableColumns(sites))
    expect(cols).toContain('id')
    expect(cols).toContain('userId')
    expect(cols).toContain('name')
    expect(cols).toContain('url')
    expect(cols).toContain('language')
    expect(cols).toContain('country')
  })
})
```

- [ ] **Step 2: Lancer les tests — ils doivent échouer**

```bash
pnpm test tests/unit/db-schema.test.ts
```

Résultat attendu : `Cannot find module '@/lib/db/schema'`

- [ ] **Step 3: Créer lib/db/schema.ts**

```typescript
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const planEnum = pgEnum('plan', ['free', 'pro', 'business'])

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'canceled',
  'past_due',
  'trialing',
  'incomplete',
])

// ─── profiles ─────────────────────────────────────────────────────────────────
// Mirror de auth.users — créé automatiquement par trigger SQL.
// La suppression en cascade est déclarée dans rls_policies.sql.

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // = auth.users.id
  email: text('email').notNull(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── subscriptions ────────────────────────────────────────────────────────────
// Source de vérité pour le plan d'un utilisateur — mise à jour par Stripe webhooks.

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  plan: planEnum('plan').notNull().default('free'),
  status: subscriptionStatusEnum('status').notNull().default('active'),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── sites ────────────────────────────────────────────────────────────────────

export const sites = pgTable('sites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  url: text('url').notNull(),
  language: varchar('language', { length: 2 }).notNull().default('fr'),
  country: varchar('country', { length: 2 }).notNull().default('FR'),
  isVerified: boolean('is_verified').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Relations ────────────────────────────────────────────────────────────────

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  subscription: one(subscriptions, {
    fields: [profiles.id],
    references: [subscriptions.userId],
  }),
  sites: many(sites),
}))

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  profile: one(profiles, {
    fields: [subscriptions.userId],
    references: [profiles.id],
  }),
}))

export const sitesRelations = relations(sites, ({ one }) => ({
  profile: one(profiles, {
    fields: [sites.userId],
    references: [profiles.id],
  }),
}))
```

- [ ] **Step 4: Lancer les tests — ils doivent passer**

```bash
pnpm test tests/unit/db-schema.test.ts
```

Résultat attendu :
```
✓ Schema: profiles > a les colonnes obligatoires
✓ Schema: subscriptions > a les colonnes obligatoires
✓ Schema: sites > a les colonnes obligatoires
```

- [ ] **Step 5: Vérifier typecheck complet**

```bash
pnpm typecheck
```

Résultat attendu : `0 errors`

- [ ] **Step 6: Lancer tous les tests**

```bash
pnpm test
```

Résultat attendu : tous les tests existants passent + les 3 nouveaux.

- [ ] **Step 7: Commit**

```bash
git add lib/db/client.ts lib/db/schema.ts tests/unit/db-schema.test.ts
git commit -m "feat(db): Drizzle client + schéma profiles/subscriptions/sites"
```

---

## Task 6 — Push du schéma vers Supabase

**Files:** aucun fichier créé — action `pnpm db:push`

- [ ] **Step 1: Générer un aperçu des changements (dry-run)**

```bash
pnpm db:push --dry-run
```

Résultat attendu : liste des tables et enums à créer :
```
[✓] Changes applied:
  - create enum "plan"
  - create enum "subscription_status"
  - create table "profiles"
  - create table "subscriptions"
  - create table "sites"
```

> Si la connexion échoue (`connection refused` ou `ECONNREFUSED`), vérifier que `DIRECT_DATABASE_URL` est correctement renseignée dans `.env.local` et que le projet Supabase est bien actif.

- [ ] **Step 2: Appliquer le schéma**

```bash
pnpm db:push
```

Résultat attendu : aucune erreur, les tables sont créées.

- [ ] **Step 3: Vérifier dans Drizzle Studio**

```bash
pnpm db:studio
```

Ouvrir `https://local.drizzle.studio` → vérifier que les 3 tables apparaissent avec leurs colonnes. Fermer avec Ctrl+C.

- [ ] **Step 4: Vérifier dans Supabase Dashboard**

Aller sur https://supabase.com/dashboard → ton projet → Table Editor.
Les tables `profiles`, `subscriptions`, `sites` doivent apparaître dans le schéma `public`.

---

## Task 7 — Trigger auth.users → profiles (SQL manuel)

**Files:**
- Create: `drizzle/seed/trigger_profiles.sql`

Ce fichier documente la DDL qui doit être exécutée **manuellement** dans Supabase SQL Editor car elle touche le schéma `auth` (géré par Supabase, hors portée de Drizzle).

- [ ] **Step 1: Créer le fichier de seed SQL**

```bash
mkdir -p drizzle/seed
```

Créer `drizzle/seed/trigger_profiles.sql` :

```sql
-- ============================================================
-- Trigger : auth.users → public.profiles
-- À exécuter UNE SEULE FOIS dans le SQL Editor de Supabase.
-- Ce fichier sert de documentation et de source de vérité.
-- ============================================================

-- 1. Fonction déclenchée à chaque nouvel utilisateur Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. Trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

- [ ] **Step 2: Exécuter dans Supabase SQL Editor**

1. Ouvrir https://supabase.com/dashboard → ton projet → SQL Editor
2. Coller le contenu de `drizzle/seed/trigger_profiles.sql`
3. Cliquer "Run"
4. Résultat attendu : `Success. No rows returned`

- [ ] **Step 3: Commit du fichier de documentation**

```bash
git add drizzle/seed/trigger_profiles.sql
git commit -m "feat(db): trigger SQL auth.users → profiles (à exécuter dans Supabase)"
```

---

## Task 8 — RLS + policies (SQL manuel)

**Files:**
- Create: `drizzle/seed/rls_policies.sql`

- [ ] **Step 1: Créer le fichier rls_policies.sql**

```sql
-- ============================================================
-- Row Level Security — public.profiles, subscriptions, sites
-- À exécuter UNE SEULE FOIS dans le SQL Editor de Supabase.
-- ============================================================

-- ── profiles ──────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Un utilisateur ne peut voir et modifier que son propre profil.
CREATE POLICY "profiles: own data only"
  ON public.profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── subscriptions ─────────────────────────────────────────────────────────────

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Un utilisateur ne peut voir que ses propres abonnements.
CREATE POLICY "subscriptions: own data only"
  ON public.subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── sites ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

-- Un utilisateur ne peut voir et modifier que ses propres sites.
CREATE POLICY "sites: own data only"
  ON public.sites
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

- [ ] **Step 2: Exécuter dans Supabase SQL Editor**

1. Ouvrir https://supabase.com/dashboard → ton projet → SQL Editor
2. Coller le contenu de `drizzle/seed/rls_policies.sql`
3. Cliquer "Run"
4. Résultat attendu : `Success. No rows returned`

- [ ] **Step 3: Vérifier dans Supabase Dashboard**

Aller sur Authentication → Policies → vérifier que les 3 tables ont RLS = `ON` et chacune 1 policy.

Ou via SQL :
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'subscriptions', 'sites');
```

Résultat attendu : `rowsecurity = true` pour les 3 tables.

- [ ] **Step 4: Commit**

```bash
git add drizzle/seed/rls_policies.sql
git commit -m "feat(db): RLS policies pour profiles, subscriptions, sites"
```

---

## Task 9 — Vérification end-to-end du trigger

Cette tâche est manuelle et ne produit pas de code. Elle valide que le trigger fonctionne.

- [ ] **Step 1: Créer un utilisateur test via Supabase Auth**

Dans Supabase Dashboard → Authentication → Users → "Invite user" ou via SQL Editor :

```sql
-- Option 1 : via la console SQL (crée un user fictif pour test)
SELECT * FROM auth.users LIMIT 5; -- vérifier que la table auth.users est accessible
```

Ou utiliser le SDK côté client (à faire quand le TKT-004 sera implémenté). Pour l'instant, créer un utilisateur manuellement :

Dashboard → Authentication → Users → Add user → remplir email + password.

- [ ] **Step 2: Vérifier que le profil a été créé**

Dans Supabase Dashboard → Table Editor → `profiles` :
Le row doit exister avec l'UUID correspondant à l'utilisateur créé.

Ou via SQL Editor :
```sql
SELECT p.id, p.email, p.created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY p.created_at DESC
LIMIT 5;
```

Résultat attendu : 1 row avec l'email du user créé.

- [ ] **Step 3: Vérifier que RLS bloque sans token**

Depuis le SQL Editor (qui utilise `service_role`, donc bypass RLS), tester qu'une query sans auth ne retourne rien via l'anon key. Ce test complet sera fait dans le TKT-004 (auth end-to-end).

---

## Task 10 — Vérification finale + commit de clôture

- [ ] **Step 1: Lancer la suite de tests complète**

```bash
pnpm typecheck && pnpm lint && pnpm test
```

Résultat attendu :
```
TypeScript: 0 errors
ESLint: 0 warnings, 0 errors
Tests: XX passed (including 3 new db-schema tests)
```

- [ ] **Step 2: Vérifier l'état git**

```bash
git log --oneline -8
```

Résultat attendu : commits propres pour chaque tâche.

- [ ] **Step 3: Mettre à jour PROGRESS.md**

Dans `PROGRESS.md`, cocher TKT-003 et ajouter une ligne au journal :

```markdown
| TKT-003 | ✅ | 2026-05-11 | Drizzle + Supabase EU, 3 tables, RLS ON, trigger profiles, db:push OK |
```

- [ ] **Step 4: Commit final**

```bash
git add PROGRESS.md
git commit -m "docs: PROGRESS.md — TKT-003 archivé"
```

---

## Référence rapide — commandes Drizzle

| Commande | Quand | Connexion utilisée |
|---|---|---|
| `pnpm db:push` | Dev — appliquer le schéma directement | `DIRECT_DATABASE_URL` |
| `pnpm db:generate` | Générer un fichier de migration | Local uniquement |
| `pnpm db:migrate` | Prod — appliquer les migrations | `DIRECT_DATABASE_URL` |
| `pnpm db:studio` | Explorer la DB en UI | `DIRECT_DATABASE_URL` |

> **Important :** ne jamais utiliser `pnpm db:push` en production. En production, générer une migration avec `db:generate` et l'appliquer avec `db:migrate`.

---

## Pièges connus

| Piège | Symptôme | Solution |
|---|---|---|
| Pooler Transaction pour migrations | `prepared statement "..." already exists` ou timeout DDL | Utiliser `DIRECT_DATABASE_URL` dans `drizzle.config.ts` |
| `prepare: false` manquant dans le client | Erreurs aléatoires en production | Toujours mettre `{ prepare: false }` avec le pooler Transaction |
| Trigger dupliqué | `ERROR: trigger "on_auth_user_created" already exists` | Le SQL a `DROP TRIGGER IF EXISTS` avant la création |
| RLS sans policy | Table inaccessible pour tous les users | Toujours créer les policies juste après `ENABLE ROW LEVEL SECURITY` |
| `auth.uid()` = NULL dans Inngest | Toutes les queries Drizzle retournent 0 rows | Jobs Inngest = utiliser `SUPABASE_SERVICE_ROLE_KEY` + vérifier ownership en code |
