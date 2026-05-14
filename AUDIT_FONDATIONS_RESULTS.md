# AUDIT FONDATIONS — Résultats du diagnostic

> Diagnostic réalisé le 2026-05-15. Aucune correction n'a été effectuée.

---

## 1. Base de données

**ORM/client utilisé :**

- **Drizzle** (`drizzle-orm`) : ORM principal pour toutes les queries. **20 fichiers** l'importent.
- **`@supabase/supabase-js`** : **1 seul fichier** — `lib/supabase/admin.ts` — exclusivement pour le client service_role (bypass RLS, Inngest uniquement).
- **`@supabase/ssr`** : **3 fichiers** — `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts` — exclusivement pour l'auth (lecture de session, cookies).

**Fichiers importants :**
| Fichier | Rôle |
|---|---|
| `lib/db/client.ts` | Instance Drizzle (connexion Postgres) |
| `lib/db/schema.ts` | Schéma complet des tables |
| `lib/db/queries/*.ts` | 11 modules de queries typées par domaine |
| `lib/supabase/admin.ts` | Client service_role (`@supabase/supabase-js`) — Inngest seulement |

**Tables touchées par Drizzle :** analyses, authority_results, authority_sources, competitors, content_issues, firecrawl_pages, prompts, publishers, recommendations, site_metadata, sites, subscriptions, technical_issues (toutes les tables métier).

**Tables touchées par `@supabase/supabase-js` :** aucune — `admin.ts` est uniquement instancié, pas utilisé directement pour des queries (la query passe toujours par Drizzle).

**Stratégie réelle :** La séparation est nette et conforme à CLAUDE.md : Drizzle pour les données, `@supabase/ssr` pour l'auth. Pas d'incohérence ORM détectée.

---

## 2. Authentification

**Système utilisé en prod :** **Supabase Auth** via `@supabase/ssr`.

**Better Auth :**
- Imports `better-auth` dans le code : **0 fichier**
- `better-auth` n'est **pas installé** dans `package.json`
- **Il n'existe pas de `lib/auth.ts`** dans le projet

**`@supabase/ssr` :**
- Imports : **3 fichiers** (`lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`)

**Handler d'auth :**
- `app/api/auth/[...all]/route.ts` **n'existe pas** — CLAUDE.md le cite comme handler Better Auth, mais Better Auth n'est pas utilisé.
- L'auth est entièrement gérée par Supabase (pas de route custom nécessaire pour Supabase Auth).
- Les routes API existantes : `app/api/inngest/route.ts`, `app/api/stripe/webhooks/route.ts`.

**Table `users` :** gérée par Supabase Auth (pas de table `users` custom dans le schéma Drizzle — à vérifier dans `lib/db/schema.ts` si une table profiles existe).

**Conclusion :** CLAUDE.md est en désaccord avec le code — il décrit Better Auth mais le projet utilise exclusivement Supabase Auth. CLAUDE.md doit être corrigé sur ce point.

---

## 3. Variables Stripe en doublon

**Convention utilisée dans le code :**
- `STRIPE_PRO_PRICE_ID` → défini dans `lib/env.ts:49`, utilisé dans `lib/stripe.ts:10`
- `STRIPE_BUSINESS_PRICE_ID` → défini dans `lib/env.ts:52`, utilisé dans `lib/stripe.ts:11`

**Convention `STRIPE_PRICE_PRO` / `STRIPE_PRICE_BUSINESS` :**
- **0 occurrence** dans tout le code source.
- Ces variables ne sont référencées nulle part.

**Fichiers concernés :**
| Fichier | Variable |
|---|---|
| `lib/env.ts:49` | `STRIPE_PRO_PRICE_ID` (validé Zod, doit commencer par `price_`) |
| `lib/env.ts:52` | `STRIPE_BUSINESS_PRICE_ID` (validé Zod, doit commencer par `price_`) |
| `lib/stripe.ts:10-11` | Consomme les deux via `env.STRIPE_PRO_PRICE_ID` / `env.STRIPE_BUSINESS_PRICE_ID` |

**Conclusion :** La convention correcte est `STRIPE_PRO_PRICE_ID` / `STRIPE_BUSINESS_PRICE_ID`. Si `STRIPE_PRICE_PRO` ou `STRIPE_PRICE_BUSINESS` existent dans Vercel, ce sont des variables orphelines à supprimer.

---

## 4. Inngest — convention d'événements

**Fonctions déclarées et événements écoutés :**

| Fichier | id | Événement écouté |
|---|---|---|
| `lib/inngest/functions/crawl-site.ts` | `crawl-site` | `site/crawl.requested` (slash) |
| `lib/inngest/functions/run-discovery.ts` | `run-discovery` | `site.discovery.requested` (point) |
| `lib/inngest/functions/run-authority-analysis.ts` | `run-authority-analysis` | `site.analysis.requested` (point) |
| `lib/inngest/functions/run-full-analysis.ts` | `run-full-analysis` | `analysis.full.requested` (point) |

**Événements émis dans le code applicatif :**

| Fichier émetteur | Événement émis | Convention |
|---|---|---|
| `app/(app)/onboarding/actions.ts:38` | `site/crawl.requested` | slash |
| `app/(app)/onboarding/actions.ts:42` | `site/discovery.requested` | slash |
| `app/(app)/sites/[siteId]/analysis-actions.ts:36` | `site.analysis.requested` | point |
| `app/(app)/sites/[siteId]/discovery/launch-action.ts:29` | `site/crawl.requested` | slash |
| `lib/inngest/functions/crawl-site.ts:19` (step.sendEvent) | `site.discovery.requested` | point |

**Analyse des mismatches :**

| # | Émis | Écouté | Statut |
|---|---|---|---|
| 1 | `site/crawl.requested` (slash) | `site/crawl.requested` (slash) | ✅ OK |
| 2 | **`site/discovery.requested`** (slash — onboarding) | **`site.discovery.requested`** (point — run-discovery) | ❌ **MISMATCH CRITIQUE** |
| 3 | `site.discovery.requested` (point — crawl step.sendEvent) | `site.discovery.requested` (point — run-discovery) | ✅ OK |
| 4 | `site.analysis.requested` (point) | `site.analysis.requested` (point) | ✅ OK |
| 5 | *(personne n'émet)* | `analysis.full.requested` | ❌ **FONCTION MORTE** |

**Détail des problèmes :**

1. **MISMATCH ligne onboarding/actions.ts:42** — L'onboarding émet `site/discovery.requested` (avec slash) mais `run-discovery` écoute `site.discovery.requested` (avec point). La découverte ne se déclenche **jamais** depuis l'onboarding. Seul le `step.sendEvent` à la fin de `crawl-site` déclenche correctement la découverte.

2. **FONCTION MORTE** — `run-full-analysis` écoute `analysis.full.requested` mais **aucun fichier dans le code n'émet cet événement**. Cette fonction n'est donc jamais exécutée en production. À la place, `analysis-actions.ts` émet `site.analysis.requested` qui déclenche `run-authority-analysis` — qui ne fait que l'analyse d'autorité, pas l'analyse complète (crawl + discovery + authority + tech + content).

---

## 5. Bypass tokens

**`DEV_BYPASS_TOKEN` et `DEV_BYPASS_EMAIL` :**
- **0 occurrence** dans tout le code source.
- Ces variables ne sont définies ni dans `lib/env.ts`, ni dans le schéma Zod.
- Elles n'existent pas dans ce projet.

**Conclusion :** Ces tokens ne sont pas présents. Soit ils n'ont jamais été implémentés, soit ils ont été supprimés. Il n'y a rien à désactiver ni à risquer en prod sur ce point.

---

## Incohérences détectées

### 🔴 CRITIQUE — Mismatch événement Inngest onboarding

**Fichier :** `app/(app)/onboarding/actions.ts:42`
**Émis :** `site/discovery.requested` (slash)
**Attendu :** `site.discovery.requested` (point)

Conséquence : lors de l'onboarding d'un nouveau site, la découverte est demandée mais ne se déclenche **jamais**. Le crawl se lance, puis son `step.sendEvent` interne déclenche la découverte — donc la découverte finit par tourner, mais avec un délai et uniquement si le crawl réussit. Si le crawl échoue, la découverte n'est jamais déclenchée du tout.

---

### 🔴 CRITIQUE — Fonction `run-full-analysis` jamais déclenchée

**Fichier :** `lib/inngest/functions/run-full-analysis.ts`
**Écoute :** `analysis.full.requested`
**Émetteur :** personne

Conséquence : quand l'utilisateur clique "Lancer l'analyse", `analysis-actions.ts` envoie `site.analysis.requested`, qui déclenche `run-authority-analysis` (analyse autorité uniquement). La fonction `run-full-analysis` — qui orchestre crawl + discovery + authority + technical + content + recommendations + publishers — **n'est jamais exécutée**.

L'analyse complète est donc cassée : seule l'autorité est calculée. Les onglets Technique et Contenu restent vides.

---

### 🟡 DOCUMENTATION — CLAUDE.md décrit Better Auth, le code utilise Supabase Auth

**Fichier :** `CLAUDE.md` sections 2 (stack), 5 (règles), 6 (structure)
**Mention :** `app/api/auth/[...all]/route.ts`, `Better Auth handler`, `lib/supabase/middleware.ts` (déjà correct)

CLAUDE.md cite Better Auth comme système d'auth mais `better-auth` n'est pas installé. Le projet utilise Supabase Auth. Ce fichier de documentation est incorrect sur ce point et peut induire en erreur.

---

### 🟡 DOCUMENTATION — Convention événements Inngest non homogène

Deux conventions coexistent sans règle claire :
- **Slash** (`site/crawl.requested`, `site/discovery.requested`) — style Inngest v2
- **Point** (`site.discovery.requested`, `site.analysis.requested`, `analysis.full.requested`) — style Inngest v3+

Recommandation : choisir une convention (point recommandé, plus lisible) et la standardiser dans toutes les fonctions et tous les émetteurs.

---

### 🟢 OK — Variables Stripe

Pas de doublon dans le code. `STRIPE_PRO_PRICE_ID` / `STRIPE_BUSINESS_PRICE_ID` sont les seules conventions utilisées.

---

### 🟢 OK — Séparation Drizzle / Supabase Auth

La stratégie est nette : Drizzle pour les données, `@supabase/ssr` pour l'auth. Pas de mélange.

---

*Fin du diagnostic — aucune modification n'a été apportée au code.*
