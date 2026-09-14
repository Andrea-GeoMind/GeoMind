# CHECKUP GEOMIND — État des lieux avant lancement

**Date** : 14 septembre 2026 · **Branche** : `claude/geomind-checkup-launch-c02212` (à jour avec `main`)
**Méthode** : diagnostic pur, zéro modification de code. Install + build + tests locaux, sondes API sur les services externes, parcours réel dans le navigateur sur geomind.fr, 2 audits de code approfondis (sécurité + inventaire fonctionnel).

---

## TL;DR

**Le produit est mort en production, mais pas pour la raison qu'on croirait.** Le code est en très bon état : build vert, 583/583 tests verts, typecheck et lint zéro erreur, pipeline d'analyse complet, billing câblé, sécurité applicative sérieuse. **Mais le projet Supabase n'existe plus** (DNS NXDOMAIN — supprimé ou purgé après ~3 mois d'inactivité, très probablement par la politique de pause/suppression du free tier). Résultat : inscription, connexion, audit express, audits complets — tout ce qui touche la base échoue, en prod comme en local. C'est UNE seule cause racine, mais elle éteint 100 % du produit.

Le lancement n'est pas loin : il faut recréer/restaurer la base, refaire le câblage (env vars, migrations, RLS), remplir 3 trous de config (SIRET dans les mentions légales, Stripe en mode live, clé Perplexity), et purger des secrets commités dans git. Estimation réaliste : **quelques jours de travail concentré**, pas des semaines.

---

## 1. ✅ Ce qui marche

### Code & build (local)
- `pnpm install` : OK (lockfile sain, pnpm 11.0.9).
- `pnpm typecheck` : **0 erreur**.
- `pnpm lint` : **0 erreur, 0 warning**.
- `pnpm test` : **583/583 tests verts** (52 fichiers, ~10 s).
- `pnpm build` : **build de prod complet sans erreur** — ~60 routes compilées (marketing, blog, app, API).
- `pnpm start` : le serveur de prod boote en 1,6 s, pages publiques servies en local.

### Produit (état du code — vérifié fichier par fichier)
Le produit est **largement implémenté, pas un squelette** :
- **Auth** : signup, login, Google OAuth, reset password, vérification email avec callback PKCE et protection open-redirect. (Pas de magic link — jamais implémenté, malgré la mention dans CLAUDE.md.)
- **Onboarding** : wizard 3 étapes complet — création site → quota → crawl Firecrawl → découverte → validation → analyse complète, avec consommation atomique de 400 crédits et **remboursement automatique en cas d'échec**.
- **Pipeline d'analyse** : 11 fonctions Inngest réelles (crawl, discovery, full-analysis, monitoring hebdo/mensuel, rapport mensuel, réputation, mémoire coach). 31 règles techniques + 26 règles contenu, toutes implémentées. Les deux commentaires `// stub for now` dans `run-full-analysis.ts:93,96` sont **périmés** — le code derrière est réel.
- **Billing Stripe** : checkout abonnements + packs de crédits, portail client, webhooks avec vérification de signature ET idempotence (table `webhook_events`), sync `subscriptions`, essai Pro 7 j anti-abus, top-up de crédits à l'upgrade. Le code est prêt ; c'est la **config** qui manque (voir blocants).
- **Quotas/crédits** : limites par plan, consommation atomique, sites gelés au downgrade (jamais supprimés), alerte « crédits bas » à 20 %.
- **Emails** : 5 templates Resend branchés (analyse terminée, 1ʳᵉ citation, chute de visibilité, rapport mensuel, crédits bas).
- **Observabilité** : Sentry (client/server/edge) et PostHog (avec opt-out lié au consentement cookies) réellement câblés. PWA Serwist fonctionnelle (gelée volontairement).

### Prod — pages publiques (testées dans le navigateur)
- geomind.fr répond en HTTP 200 sur Vercel (edge cdg1), HSTS actif.
- Landing complète et convaincante (hero, 4 plans, FAQ, cas d'usage), **pages légales présentes** (CGV, confidentialité, mentions, cookies), blog (10 articles), glossaire, générateur llms.txt gratuit, page 404 propre, sitemap/robots.
- `/dashboard` correctement protégé (redirection 307 → `/login`).
- Bandeau cookies conforme : « Essentiels uniquement » proposé au même niveau que « Tout accepter ».

### Sécurité applicative (audit code — globalement solide)
- Les **8 routes API** vérifient session + ownership (ou sont volontairement publiques avec Zod + rate-limit + garde SSRF).
- Les **14 fichiers de Server Actions** vérifient auth puis `site.userId !== user.id` avant toute mutation.
- Webhook Stripe : signature vérifiée avant tout parsing + allowlist d'événements + idempotence. Inngest : signing key obligatoire au boot.
- `SUPABASE_SERVICE_ROLE_KEY` : un seul point d'usage, côté serveur, après contrôle de session.
- Aucun bypass d'auth (`DEV_BYPASS_*` dans `.env.local` ne sont référencés nulle part dans le code).
- Aucune injection SQL possible (tout passe par Drizzle paramétré), pas d'`eval`, pas d'open redirect.
- `.env.local` bien untracked, `.env.example` sans vraies valeurs.

---

## 2. ❌ Ce qui est cassé (avec la cause)

### 💀 Cause racine n° 1 : le projet Supabase n'existe plus
- `jiuruhaeckqwysyqwbao.supabase.co` → **NXDOMAIN** (le DNS ne résout plus). Le pooler Postgres répond « tenant not found ».
- **Conséquences constatées en prod** (testées en vrai dans le navigateur) :
  - **Login** → erreur « fetch failed » affichée brute à l'utilisateur.
  - **Inscription** → « fetch failed » aussi. Personne ne peut créer de compte.
  - **Audit express du hero** (« Tester mon site », sans inscription) → « Connexion impossible. Réessayez dans un instant. »
  - Par extension : reset password, Google OAuth, tout le dashboard, toutes les analyses → morts.
  - Les **crons de monitoring** (hebdo/mensuel) échouent nécessairement depuis ~3 mois.
- **Cause probable** : projet Supabase free tier pausé pour inactivité puis supprimé/purgé (~90 jours). À vérifier dans ton dashboard Supabase : s'il est « paused », un restore suffit ; s'il a disparu, il faut recréer un projet et rejouer les migrations (`drizzle/` en contient 20+, plus `drizzle/seed/rls_policies.sql` **à exécuter à la main** — voir blocants).

### Clé Perplexity morte
- `PERPLEXITY_API_KEY` → **401 Unauthorized** (testé en direct sur `api.perplexity.ai`). Le connecteur Perplexity (1 des 4 IA promises sur la landing) échouera à chaque analyse. Les 3 autres services critiques sont OK : **OpenRouter ✅ (ChatGPT/Gemini/Claude), Firecrawl ✅, Resend ✅, Stripe ✅**.

### Stripe en mode test
- La clé locale est `sk_test_…` et PROGRESS.md confirme : « Stripe Live bloqué — en attente SIRET ». De plus, **seuls 2 price IDs sur 9 existent** (Pro + Business mensuels) : pas de Solo, pas d'annuel, pas de packs de crédits. L'UI les désactive proprement (« Bientôt disponible »), mais la page tarifs **vend** Solo 19 € et l'annuel −20 % → personne ne peut les acheter.

### Divers cassés
- **www.geomind.fr ne répond pas du tout** (pas de DNS). Quiconque tape « www. » n'atteint jamais le site.
- **Token Vercel CLI expiré** en local (`vercel login` à refaire) — je n'ai pas pu inspecter l'état des déploiements/env vars de prod.
- **Header mobile** (375 px) : le bouton « Commencer » est tronqué à droite et il n'y a **pas de menu hamburger** — la nav (Fonctionnalités/Tarifs/Blog) est inaccessible sur mobile.

---

## 3. 🚨 BLOQUANT LANCEMENT — la liste minimale, dans l'ordre

1. **Restaurer/recréer la base Supabase** (cause racine de tout).
   - Vérifier dans le dashboard Supabase si le projet est pausé (restore 1 clic) ou supprimé (recréer, région EU).
   - Si recréation : rejouer les migrations Drizzle (`pnpm db:migrate`), **exécuter `drizzle/seed/rls_policies.sql` dans le SQL Editor** (les tables `sites`, `profiles`, `subscriptions` n'ont leurs policies RLS que via ce script manuel — sans lui, la clé anon publique lit/écrit les données de tout le monde), reconfigurer le SMTP Resend dans Supabase Auth, reconfigurer l'OAuth Google (nouvelles URLs de callback), et mettre à jour **toutes les env vars** (locales + Vercel) : URL, anon key, service_role, DATABASE_URL, DIRECT_DATABASE_URL.
   - Vérifier ensuite que RLS est bien actif : `select tablename, rowsecurity from pg_tables where schemaname='public';`
2. **Purger les secrets commités dans git** — à faire en même temps que le point 1.
   - `tests/final-audit.ts:19-24`, `tests/debug-cookies.ts:11-14`, `tests/take-screenshots.ts` contiennent la **clé service_role, le mot de passe Postgres de prod** (`postgres.jiuruhaeckqwysyqwbao:OKM3…`) et des mots de passe de comptes de test — dans HEAD **et** dans l'historique. Le JWT expire en 2036. `tsconfig.json:27` exclut même ces fichiers du typecheck pour les faire passer.
   - La mort du projet Supabase rend ces clés inertes *aujourd'hui*, mais : supprimer les 3 fichiers, retirer l'exclusion tsconfig, purger l'historique (`git filter-repo`), et **ne jamais réutiliser** ces valeurs pour le nouveau projet. Ajouter un hook de secret-scanning.
3. **Mentions légales incomplètes = illégal en France.** `app/(marketing)/legal/mentions/page.tsx:28` et `privacy/page.tsx:23` affichent littéralement « SIRET : [à compléter après inscription auto-entrepreneur] » en prod. L'immatriculation est aussi le blocage de Stripe Live → même chantier : **obtenir le SIRET, le mettre dans les 2 pages, passer Stripe en live**.
4. **Stripe live + price IDs manquants.** Créer les 9 prix (Solo/Pro/Business × mensuel/annuel + 3 packs) dans Stripe live, renseigner les env vars Vercel, rebrancher le webhook (nouveau `whsec_`). Sinon : retirer Solo/annuel/packs de la page tarifs au lancement — mais ne pas vendre ce qu'on ne peut pas encaisser.
5. **Clé Perplexity** : régénérer (ou décider de lancer à 3 moteurs et adapter la promesse « 4 IA » sur la landing — elle est répétée partout).
6. **Refaire tourner UN audit complet de bout en bout** après les points 1–5, sur un vrai site, et vérifier : crawl → découverte → 4 connecteurs → scores → recommandations → email « analyse terminée ». C'est le cœur de la promesse ; il n'a pas tourné depuis ~3 mois et les APIs LLM bougent vite.
7. **www.geomind.fr** : ajouter le CNAME chez le registrar + le domaine dans Vercel (redirection vers l'apex).
8. **Messages d'erreur bruts** : « fetch failed » affiché tel quel sur login/signup. Une fois la base restaurée le cas devient rare, mais prévoir un message humain (« Service momentanément indisponible ») — c'est la première impression en cas de pépin.

---

## 4. ⚠️ Pas bloquant, mais à corriger vite après le lancement

1. **Nav mobile** : bouton « Commencer » tronqué + absence de hamburger sur la landing (375 px). Une bonne partie du trafic TPE/indépendants sera mobile.
2. **Vulnérabilités dépendances** : 97 au total (4 critiques, 45 high) — mais **aucune n'est exploitable telle quelle en prod** : les critiques touchent Next.js (RCE Windows — vous êtes sur Vercel/Linux ; RCE AVIF dans l'optimisation d'images — à traiter vite quand même), vitest/vite (dev only), shell-quote via concurrently (dev only). Faire un `pnpm update` ciblé : **next**, @sentry/nextjs, @mendable/firecrawl-js (chaîne axios vulnérable), inngest (chaîne grpc/protobufjs).
3. **Headers de sécurité absents** : pas de CSP, pas de `X-Frame-Options`/`frame-ancestors` (clickjacking du dashboard), pas de `X-Content-Type-Options`. Ajouter un bloc `headers()` dans `next.config.mjs`.
4. **SSRF sur l'audit public** : `lib/analysis/express-audit.ts:85` suit les redirections sans revalider chaque saut — un site public peut 302 vers une IP interne/metadata. Revalider la cible à chaque hop.
5. **RLS non versionnée** : promouvoir `drizzle/seed/rls_policies.sql` en migration numérotée + ajouter une assertion automatique (`pg_tables.rowsecurity`) pour que ça ne dépende plus d'un geste manuel.
6. **`historyDays` jamais appliqué** : la rétention d'historique promise par plan (1 an Pro, illimité Business) n'est enforcée nulle part. Aujourd'hui tout le monde a tout — décision produit à prendre.
7. **`INNGEST_DEV=1` dans `.env.development` (tracké)** : désactive la vérification de signature Inngest — inoffensif tant que `NODE_ENV=production` en prod, mais fragile.
8. **Commentaires trompeurs** : `// stub for now` ×2 dans `run-full-analysis.ts`, « pdfExport non branché » périmé dans `lib/plans.ts`.
9. **Vercel CLI** : refaire `vercel login` et vérifier que les env vars de prod sont alignées avec `.env.example` (impossible à auditer aujourd'hui).
10. **Dépendances majeures en retard** : inngest 4.3 → 4.20, posthog-js ~57 versions, firecrawl-js 4.22 → 4.39 (l'API Firecrawl évolue vite — à retester après la remise en route).

## 5. 💡 Améliorations pour plus tard

- **Magic link** : mentionné dans CLAUDE.md, jamais implémenté. Google OAuth + mot de passe couvrent l'essentiel ; à décider.
- **Preuve sociale** : PLAN.md garde une question ouverte sur « 2 400+ sites / 4,8 Trustpilot » — s'assurer que rien d'invérifiable ne reste sur la landing au lancement.
- Les 5 items non cochés du PLAN (Google AI Overviews, corrélations propriétaires, plan Agence/white-label, Baromètre GEO France, Mistral Le Chat) : rien d'urgent, backlog V2.
- Tests e2e Playwright : présents mais non exécutables sans base — les brancher sur un projet Supabase de test/staging pour qu'ils protègent le parcours signup → audit en CI.
- Sentry : vérifier après remise en route que les alertes de coût (> 5 €/analyse) et les erreurs crons remontent bien — 3 mois d'échecs de crons auraient dû alerter quelqu'un.

---

## Ordre de bataille suggéré (résumé exécutable)

| Jour | Action |
|---|---|
| J1 | Dashboard Supabase : restore ou recréation + migrations + RLS + SMTP + OAuth. Rotation de toutes les clés. Purge git des secrets. Mise à jour env vars Vercel + locales. |
| J1 | Régénérer la clé Perplexity (ou passer la promesse à 3 IA). |
| J2 | SIRET → mentions légales + privacy → Stripe live + 9 prix + webhook. |
| J2 | DNS www + fix message d'erreur login/signup + fix nav mobile. |
| J3 | Test de bout en bout complet (signup réel → onboarding → audit → email → upgrade payant en live avec une vraie CB → refund). `pnpm update` ciblé sur next/@sentry. |
| J3+ | Lancement 🚀 puis liste ⚠️. |

*Rapport généré le 14/09/2026 — diagnostic sans aucune modification de code. Fichiers examinés référencés inline ; toutes les pannes citées ont été reproduites en conditions réelles (navigateur sur geomind.fr, sondes API directes).*
