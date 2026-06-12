# GEOMIND — Roadmap Claude Code (6 semaines)

> Découpage en tickets séquentiels à donner à Claude Code dans l'ordre.
> Chaque ticket suit le format : **Objectif** / **Fichiers à créer ou modifier** / **Critères d'acceptation**.
> Avant de lancer un ticket, lire `CLAUDE.md` et la section pertinente de `cahier-des-charges.md`.

---

## Sprint 1 — Fondations (Semaine 1)

### Ticket 1 — Setup initial du projet
**Objectif** : créer un projet Next.js 15 avec TypeScript strict, Tailwind, shadcn/ui, ESLint, Prettier, pnpm.

**Fichiers à créer ou modifier** :
- `package.json` (avec scripts dev, build, typecheck, lint, format, test)
- `tsconfig.json` (strict: true, paths alias `@/*`)
- `tailwind.config.ts`
- `next.config.mjs`
- `.eslintrc.json` + `.prettierrc`
- `app/layout.tsx`, `app/page.tsx` (page d'accueil minimale)
- `components/ui/` : installer Button, Card, Input, Label, Dialog, Sheet, Toast via `pnpm dlx shadcn@latest add ...`
- `lib/utils.ts` (fonction `cn`)
- `app/globals.css` (variables CSS shadcn)

**Critères d'acceptation** :
- `pnpm dev` lance le serveur sur `localhost:3000` sans erreur
- `pnpm typecheck` retourne 0 erreur
- Page d'accueil affiche "GEOMIND" en gros avec un bouton shadcn

---

### Ticket 2 — Validation des variables d'environnement (Zod)
**Objectif** : centraliser et valider toutes les variables d'env au démarrage de l'app.

**Fichiers** :
- `lib/env.ts` : schéma Zod qui parse `process.env`, crash si invalide
- `.env.example` : documenter toutes les variables (voir `CLAUDE.md` section 8)
- Import de `env` dans `app/layout.tsx` pour valider au boot

**Critères** :
- Si une variable obligatoire manque, le serveur crash avec un message clair
- Types TypeScript exportés pour utilisation ailleurs (`import { env } from '@/lib/env'`)

---

### Ticket 3 — Setup Supabase + Drizzle + schéma initial + RLS
**Objectif** : connecter le projet à Supabase (Postgres EU), configurer Drizzle comme ORM serveur, créer les premières tables avec RLS.

**Fichiers** :
- Projet Supabase créé (région Frankfurt ou Paris) — récupérer URL, anon key, service role key, connection string Postgres
- `drizzle.config.ts` (DATABASE_URL = Supabase pooler)
- `lib/db/client.ts` (instance Drizzle utilisant `postgres-js` ou `node-postgres`)
- `lib/db/schema.ts` : tables `profiles` (mirror de `auth.users`), `subscriptions`, `sites`
- `drizzle/migrations/0001_init.sql` : créer trigger `on auth.users insert → insert into profiles`, activer RLS sur toutes les tables `public.*`, créer policies (`auth.uid() = user_id`)
- Scripts `db:generate`, `db:push`, `db:migrate`, `db:studio` dans package.json

**Critères** :
- `pnpm db:push` applique le schéma sur Supabase sans erreur
- `pnpm db:studio` ouvre l'UI et montre les tables vides
- Vérif manuelle dans Supabase dashboard : RLS est `enabled` sur toutes les tables `public.*`
- Test : insertion d'un user via `auth.signUp` crée automatiquement la ligne `profiles` correspondante (trigger)

---

### Ticket 4 — Supabase Auth + clients SSR + Resend transactionnel
**Objectif** : authentification fonctionnelle (signup, login, email verification, reset password) via Supabase Auth, avec emails brandés via Resend (SMTP custom).

**Fichiers** :
- `lib/supabase/server.ts` (`createServerClient` pour Server Components/Actions, lit/écrit les cookies Next.js)
- `lib/supabase/client.ts` (`createBrowserClient` pour composants `'use client'`)
- `lib/supabase/admin.ts` (`createClient` avec service_role — usage Inngest uniquement)
- `lib/supabase/middleware.ts` + `middleware.ts` à la racine (refresh cookies de session sur chaque request)
- `lib/email/client.ts` (Resend init pour emails applicatifs : "analyse terminée", "upgrade plan", etc.)
- Configuration Supabase dashboard : SMTP custom → Resend (clé API + domaine vérifié `geomind.fr`), templates verif/reset personnalisés (HTML inline simple, brand GEOMIND)
- `app/(auth)/signup/page.tsx`, `app/(auth)/login/page.tsx`, `app/(auth)/verify-email/page.tsx`, `app/(auth)/reset-password/page.tsx`, `app/(auth)/callback/route.ts` (échange code OTP → session)
- `components/features/auth/SignupForm.tsx`, `LoginForm.tsx` (avec react-hook-form + Zod, appellent les Server Actions qui invoquent `supabase.auth.signUp/signInWithPassword`)

**Critères** :
- Un user peut créer un compte → reçoit un email branded (Resend) → clique le lien → email verified + redirect vers `/onboarding`
- Un user peut se connecter et se voit redirigé vers `/dashboard`
- Reset password fonctionne (envoi email + lien valide 1h)
- Les pages `/dashboard` et `/sites/*` redirigent vers `/login` si pas de session (vérif côté `(app)/layout.tsx` via `supabase.auth.getUser()`)
- Une requête API avec un autre user_id renvoie zéro résultat (test RLS positif)

---

### Ticket 5 — Layouts publics et authentifiés
**Objectif** : structure de navigation, layouts pour les zones publiques et privées.

**Fichiers** :
- `app/(marketing)/layout.tsx` (header avec logo + nav + CTA "Se connecter")
- `app/(auth)/layout.tsx` (layout centré minimaliste)
- `app/(app)/layout.tsx` (sidebar avec navigation : Dashboard, Sites, Settings ; vérifie auth)
- `components/features/marketing/Header.tsx`, `Footer.tsx`
- `components/features/app/Sidebar.tsx`

**Critères** :
- Les 3 layouts coexistent sans conflit (routes groups Next 15)
- L'utilisateur connecté voit la sidebar partout dans `/app/...`
- L'utilisateur non connecté ne peut pas accéder à `/app/...`

---

## Sprint 2 — Sites et crawl (Semaine 2)

### Ticket 6 — CRUD sites
**Objectif** : ajout, lecture, suppression de sites.

**Fichiers** :
- `lib/db/queries/sites.ts` (`createSite`, `getSitesByUserId`, `getSiteById`, `deleteSite`)
- `lib/quotas.ts` (fonction `canAddSite(userId)` qui vérifie le plan)
- `lib/plans.ts` (constantes : limites par plan)
- Server Actions : `app/(app)/sites/actions.ts` (`createSiteAction`, `deleteSiteAction`)
- `app/(app)/dashboard/page.tsx` (liste des sites)
- `components/features/sites/SiteCard.tsx`, `SiteForm.tsx`

**Critères** :
- Un user peut créer un site (validation URL via Zod : protocole + domain)
- La liste se met à jour après création (revalidatePath)
- Suppression demande confirmation
- Limite par plan respectée (test : Free + 1 site → "passez Pro")

---

### Ticket 7 — Intégration Firecrawl
**Objectif** : crawler un site et stocker les résultats.

**Fichiers** :
- `lib/crawl/firecrawl.ts` (wrapper avec types Zod, fonction `crawlSite({siteId, maxPages})`)
- `lib/db/schema.ts` : ajouter table `firecrawl_pages`
- `lib/db/queries/firecrawl-pages.ts`

**Critères** :
- Appel manuel `crawlSite({siteId, maxPages: 10})` peuple la table avec les pages crawlées
- Markdown + metadata correctement stockés
- Gestion d'erreur Firecrawl propre (retry 3 fois sur erreur 5xx)

---

### Ticket 8 — Setup Inngest
**Objectif** : workers background pour les analyses longues.

**Fichiers** :
- `lib/inngest/client.ts`
- `app/api/inngest/route.ts` (handler Inngest)
- `lib/inngest/functions/crawl-site.ts` (1re fonction Inngest : déclenchée par event `site.crawl.requested`, appelle `crawlSite`)
- Script `pnpm inngest:dev` dans package.json

**Critères** :
- `pnpm inngest:dev` lance le dev server Inngest
- Émettre un event depuis une Server Action déclenche le job
- Le job est visible dans le dashboard Inngest dev (`http://localhost:8288`)

---

### Ticket 8.5 — Design system rétroactif (Claude Design)
**Objectif** : figer la direction artistique GEOMIND avant d'attaquer toute UI brandée (T9+). Rétroactivement re-skiner les ~7 composants livrés en T1-T7 avec les nouveaux tokens.

**Outil** : [claude.ai/design](https://claude.ai/design) — **pas Claude Code**

**Étapes** :
1. Sur claude.ai/design → **Set up design system** → coller le brief GEOMIND (palette, ton, inspirations Doctolib/Indy/Qonto, couleurs sémantiques 0-29/30-59/60+, composants signatures)
2. Valider `colors_and_type.css` généré → récupérer les valeurs HEX + font choisie
3. Valider `logo` + `logo-mark` générés → exporter en SVG
4. Sur claude.ai/design → **Prototype High fidelity** (dans l'ordre) :
   - GEOMIND — Vue d'ensemble (jauge + 3 sous-notes + delta)
   - GEOMIND — Onglet Autorité (tableau croisé + modal détail)
   - GEOMIND — Onboarding étape 3 (édition découverte)
   - GEOMIND — Coach Sheet (drawer reco Markdown)

**Fichiers à modifier côté code** (après validation des maquettes) :
- `app/globals.css` : remplacer les CSS vars shadcn par défaut avec les tokens GEOMIND (format HSL sans `hsl()`, ex: `220 89% 56%`)
- `app/layout.tsx` : importer la font via `next/font/google` selon le choix du design system
- `public/logo.svg`, `public/logo-mark.svg` : exports SVG du logo généré
- `public/favicon.ico`, `public/favicon.svg`
- `components/charts/ScoreGauge.tsx` : jauge circulaire 0-100 (couleurs sémantiques auto)
- `components/features/analysis/ScoreCard.tsx` : carte note + delta coloré
- `components/features/discovery/NeutralPromptBadge.tsx` : badge rouge "Non neutre" + tooltip
- `components/features/technical/IssueSeverityBadge.tsx` : badge Minor/Moderate/Major
- Re-skin rapide des 7 composants existants (sidebar, header, footer, SiteCard, forms auth) — devrait être quasi-automatique via les CSS vars

**Critères** :
- `app/globals.css` contient les tokens GEOMIND (plus les valeurs shadcn par défaut)
- Logo SVG présent dans `public/`
- Font chargée via `next/font/google` (pas de @import CSS)
- Les 4 composants signatures codés et visibles dans une page de démo locale
- Visuellement cohérent avec les maquettes Claude Design validées
- `pnpm typecheck && pnpm lint` : 0 erreur

**Note** : ce ticket est parallélisable avec T10 (connecteurs LLM, 0 UI). T9 doit attendre que T8.5 soit terminé.

---

### Ticket 9 — Wizard onboarding (étapes 1 et 2)
**Objectif** : flow guidé pour le premier site.

**Fichiers** :
- `app/(app)/onboarding/page.tsx` (avec query param `step`)
- `components/features/onboarding/WelcomeStep.tsx`
- `components/features/onboarding/AddSiteStep.tsx`
- `components/features/onboarding/StepProgress.tsx` (barre de progression)

**Critères** :
- Un nouveau user est redirigé vers `/onboarding?step=1` après vérification email
- Étape 1 affiche le message de bienvenue + CTA "Continuer"
- Étape 2 a le form site (nom + URL + langue + pays)
- À la soumission : crée le site, émet `site.crawl.requested` + `site.discovery.requested`, passe à l'étape 3

---

## Sprint 3 — Analyse de découverte (Semaine 3)

### Ticket 10 — Connecteurs LLM (base + 4 moteurs)
**Objectif** : interface unifiée pour interroger les 4 IAs.

**Fichiers** :
- `lib/ai/connectors/base.ts` (interface `IAEngine`, types `IAResponse`)
- `lib/ai/connectors/chatgpt.ts` (OpenRouter `openai/gpt-4o-mini` + Parallel search)
- `lib/ai/connectors/claude.ts` (OpenRouter `anthropic/claude-haiku-4-5` + Anthropic native web_search)
- `lib/ai/connectors/gemini.ts` (OpenRouter `google/gemini-2.5-flash` + Google grounding)
- `lib/ai/connectors/perplexity.ts` (Perplexity Sonar API direct)
- `lib/ai/parse.ts` (parsing des réponses → sources structurées)
- `lib/ai/cost.ts` (tracking coût par appel)
- Tests unitaires sur le parsing

**Critères** :
- Pour chaque connecteur, un test unitaire avec un mock de réponse valide
- L'interface `IAEngine` est respectée par les 4 connecteurs
- Le parsing gère les cas dégradés (sources manquantes, format inattendu) en retournant `partial_response: true`

---

### Ticket 11 — Analyse de découverte (Inngest function)
**Objectif** : générer description, mots-clés, concurrents, prompts à partir du crawl.

**Fichiers** :
- `lib/ai/prompts/discovery.ts` (prompt système pour générer la description, etc.)
- `lib/ai/prompts/neutral-prompts.ts` (prompt pour générer 20 prompts neutres)
- `lib/db/schema.ts` : tables `site_metadata`, `competitors`, `prompts`
- `lib/db/queries/site-metadata.ts`, `competitors.ts`, `prompts.ts`
- `lib/analysis/discovery.ts` (orchestration : prend les pages crawlées, appelle Haiku, parse en JSON via Zod, store)
- `lib/inngest/functions/run-discovery.ts`

**Critères** :
- Émettre `site.discovery.requested` après le crawl peuple les 3 tables
- Les prompts générés ne contiennent jamais le domaine du client (test avec assertion)
- Le LLM est appelé via structured output (JSON validé par Zod, retry si parsing échoue)

---

### Ticket 11.5 — Prompts orientés citation (GEO-aware prompt engineering)

**Objectif** : reformuler les 20 prompts générés lors de la découverte pour qu'ils produisent des réponses IA contenant des citations de sources. Un prompt purement informationnel comme "Quels sont les défis de l'implémentation Salesforce pour une ETI ?" amène l'IA à répondre depuis sa mémoire sans citer personne. Les prompts doivent au contraire déclencher des réponses où l'IA recommande des acteurs, ressources, ou outils précis — ce qui crée des citations exploitables par GeoMind.

**Principe** : les moteurs IA (Perplexity, ChatGPT, Gemini) citent des URLs quand la question appelle une recommandation de source, de prestataire, ou de comparatif — pas quand elle appelle une explication conceptuelle.

**Patterns à privilégier dans les prompts générés** :
- `"Quels prestataires / outils / solutions recommandez-vous pour [domaine] ?"` → l'IA liste des entreprises avec URLs
- `"Où trouver des ressources fiables / des avis / un comparatif sur [sujet] ?"` → l'IA cite des sites de référence
- `"Quelles agences ou plateformes sont reconnues pour [expertise] ?"` → l'IA nomme des acteurs connus
- `"Comparez les meilleures solutions [X] pour [profil] ?"` → l'IA structure une liste avec sources
- `"Quels experts, blogs ou guides font référence sur [thématique] ?"` → déclencheur direct de citation
- `"Quel outil / logiciel utiliser pour [besoin précis] ?"` → l'IA recommande des produits spécifiques

**Patterns à éviter** (génèrent des réponses non-citantes) :
- `"Quels sont les défis de…"` → réponse purement conceptuelle, 0 citation
- `"Comment fonctionne…"` → réponse explicative, 0 citation
- `"Pourquoi est-il important de…"` → réponse argumentative, 0 citation

**Fichiers à modifier** :
- `lib/ai/prompts/neutral-prompts.ts` : reécrire `NEUTRAL_PROMPTS_SYSTEM_PROMPT` pour imposer les patterns citation-inducing

**Changements dans le prompt système** :
1. Ajouter une section explicite "PATTERNS EFFICACES" avec exemples de formulations qui provoquent des citations
2. Imposer que **au moins 14 des 20 prompts** utilisent un pattern de type recommandation/comparatif/source (quantifier explicitement dans l'instruction)
3. Interdire explicitement les formulations purement conceptuelles/explicatives
4. Garder une minorité (≤ 6) de prompts informationnels pour la variété et la détection de la présence générale dans les IAs
5. Ajouter dans le message utilisateur un rappel du contexte : "Les prompts servent à mesurer si ce business est cité dans les réponses IA — privilégie les formulations qui poussent l'IA à nommer des acteurs."

**Critères** :
- Sur un business test (ex : intégrateur Salesforce ETI), au moins 14 des 20 prompts contiennent un mot déclencheur de citation : "recommandez", "meilleur", "comparatif", "où trouver", "quelle agence", "quel outil", "quelles ressources", "quelles plateformes", "quels prestataires", "quelles solutions"
- Aucun régression sur la règle de neutralité : 0 prompt ne contient le domaine ou la marque du client
- `pnpm typecheck && pnpm lint` : 0 erreur (fichier `.ts` pur, pas de composants)
- Pas de modification de schéma DB ni de routes — uniquement le prompt système

---

### Ticket 12 — UI édition découverte (étape 3 onboarding + page dédiée)
**Objectif** : permettre à l'utilisateur d'ajuster description, mots-clés, concurrents, prompts.

**Fichiers** :
- `app/(app)/sites/[siteId]/discovery/page.tsx`
- `components/features/discovery/DescriptionEditor.tsx`
- `components/features/discovery/KeywordsEditor.tsx` (chips + input)
- `components/features/discovery/CompetitorsEditor.tsx`
- `components/features/discovery/PromptsEditor.tsx`
- Server Actions pour update each
- Validation côté serveur : si un prompt ajouté contient le domaine → flag `is_neutral=false` + raison

**Critères** :
- L'utilisateur peut éditer chaque élément avec autosave (debounce 500ms)
- Validation prompts non-neutres affiche un badge rouge + tooltip
- Banner pédagogique "💡 Plus vos prompts sont neutres..." visible en haut

---

### Ticket 13 — Bouton "Lancer analyse complète"
**Objectif** : émettre l'event de full analysis avec vérification de quota.

**Fichiers** :
- `lib/db/schema.ts` : table `analyses`
- `lib/quotas.ts` : ajout fonction `canRunFullAnalysis(userId, siteId)`
- Server Action `runFullAnalysisAction`
- Composant `components/features/analysis/RunAnalysisButton.tsx`

**Critères** :
- Click sur le bouton vérifie le quota côté serveur (réjette si dépassé avec message clair)
- Si OK : crée un record `analyses` avec status=pending, émet event Inngest, redirect vers `/sites/{id}/overview`
- Affiche un toast "Analyse lancée, vous serez notifié à la fin"

---

## Sprint 4 — Analyse Autorité + Technique (Semaine 4)

### Ticket 14 — Inngest function full analysis (orchestrateur)
**Objectif** : orchestrer crawl + autorité + technique + contenu + scoring.

**Fichiers** :
- `lib/inngest/functions/run-full-analysis.ts` (avec `step.run` pour chaque sous-étape, parallélisme là où possible)
- Émission d'events pour décomposer (`analysis.authority.run`, etc.) ou tout en sub-steps

**Critères** :
- Une analyse complète passe successivement par crawl → discovery (skip si déjà fait) → authority → technical → content → recommendations → scoring → publishers
- Status mis à jour à chaque étape (`running` puis `success` ou `error`)
- Si une sous-étape échoue, l'analyse passe en `error` avec un message en DB (et le quota n'est pas décrémenté)

---

### Ticket 15 — Analyse Autorité (boucle prompts × IAs)
**Objectif** : pour chaque prompt neutre, interroger les 4 IAs en parallèle, parser, stocker.

**Fichiers** :
- `lib/db/schema.ts` : tables `authority_results`, `authority_sources`
- `lib/analysis/authority.ts` : fonction `runAuthorityAnalysis(analysisId)` qui boucle sur prompts × IAs avec `Promise.all` plafonné (max 8 concurrents)
- Détection automatique du domaine client + concurrents dans les sources retournées

**Critères** :
- 20 prompts × 4 IAs = 80 appels, exécutés en parallèle bornée
- Toutes les données stockées en `authority_results` + `authority_sources`
- Logs Sentry si une IA renvoie une erreur (mais l'analyse continue avec les autres)

---

### Ticket 16 — Scoring (les 4 notes)
**Objectif** : calculer note globale + notes Autorité/Technique/Contenu.

**Fichiers** :
- `lib/analysis/scoring.ts` (4 fonctions pures + tests unitaires)
- Update `analyses.global_score`, `authority_score`, etc. à la fin de chaque sous-analyse

**Critères** :
- Tests unitaires couvrent : cas où le site n'est jamais cité (score 0), toujours cité top 1 (score 100), cas mixtes
- Les scores sont déterministes (mêmes inputs → mêmes outputs)

---

### Ticket 17 — Page Vue d'ensemble
**Objectif** : afficher les 4 notes + comparaison vs analyse précédente.

**Fichiers** :
- `app/(app)/sites/[siteId]/overview/page.tsx`
- `components/charts/ScoreGauge.tsx` (jauge Recharts ou SVG)
- `components/features/analysis/ScoreCard.tsx` (carte note avec icône, delta)

**Critères** :
- La note globale s'affiche en grand avec couleur (rouge < 30, orange 30-59, vert ≥ 60)
- Les 3 sous-notes affichées en cards cliquables (lien vers l'onglet)
- Si analyse précédente existe : delta affiché en + ou − à côté de la note globale
- Si analyse en cours : skeleton + polling toutes les 5s

---

### Ticket 18 — Onglet Autorité (tableau + détail)
**Objectif** : tableau croisé prompts × IAs avec détail au click.

**Fichiers** :
- `app/(app)/sites/[siteId]/authority/page.tsx`
- `components/features/authority/CitationsTable.tsx`
- `components/features/authority/CitationsBarChart.tsx`
- `components/features/authority/ResponseDetailDialog.tsx` (modal détail avec surlignage)

**Critères** :
- Tableau scrollable horizontalement si beaucoup de prompts
- Click sur cellule ouvre le dialog avec la réponse complète, mentions client en vert (background ou bordure)
- Bar chart en haut montre les citations par IA
- Bouton "Relancer analyse Autorité" → check quota → émet event

---

### Ticket 19 — Règles GEO Technique (10 règles)
**Objectif** : implémenter les règles techniques en isolation.

**Fichiers** :
- `lib/db/schema.ts` : table `technical_issues`
- `lib/analysis/technical/rules/` : 1 fichier par règle (voir cahier des charges section 9)
- `lib/analysis/technical/index.ts` : runner qui itère sur les règles et stocke les issues
- Tests unitaires pour chaque règle (avec fixtures HTML)

**Critères** :
- Chaque règle est une fonction pure `(pages: FirecrawlPage[]) => TechnicalIssue | null`
- Le runner appelle toutes les règles et stocke les issues détectées
- Tests unitaires couvrent les cas positifs (issue détectée) et négatifs (pas d'issue)

---

### Ticket 20 — Onglet Technique
**Objectif** : afficher les points faibles techniques avec recommendation drawer.

**Fichiers** :
- `app/(app)/sites/[siteId]/technical/page.tsx`
- `components/features/technical/IssuesList.tsx`
- `components/features/technical/IssueCard.tsx`
- `components/features/coach/RecommendationSheet.tsx`

**Critères** :
- Issues groupées par catégorie (Accessibilité, Structure, Schema.org, Performance)
- Click sur une issue ouvre le Sheet latéral avec la fiche recommandation
- Plan Free : fiche tronquée + overlay upgrade

---

## Sprint 5 — Contenu + Coach IA + Publishers (Semaine 5)

### Ticket 21 — Règles GEO Contenu (8-10 règles)
**Objectif** : implémenter les règles contenu (voir section 10 du cahier des charges).

**Fichiers** :
- `lib/analysis/content/rules/`
- `lib/analysis/content/index.ts`
- Tests unitaires

**Critères** : idem ticket 19, mais pour le contenu.

---

### Ticket 22 — Onglet Contenu
**Objectif** : équivalent ticket 20 mais pour le contenu.

**Fichiers** :
- `app/(app)/sites/[siteId]/content/page.tsx`
- `components/features/content/IssuesList.tsx`

**Critères** : idem ticket 20.

---

### Ticket 23 — Génération recommandations statiques
**Objectif** : pour chaque issue (technique + contenu), générer une fiche recommandation via Haiku.

**Fichiers** :
- `lib/db/schema.ts` : table `recommendations`
- `lib/ai/prompts/recommendations.ts`
- `lib/analysis/recommendations.ts` (génère pour chaque issue, store en DB)
- Étape Inngest `step.run("recommendations")` dans la full analysis

**Critères** :
- Toutes les issues d'une analyse ont une `recommendation` variant `simplified` après l'analyse
- Le contenu est en Markdown, lisible, langage simple

---

### Ticket 24 — Toggle "Version complète" + génération à la demande
**Objectif** : permettre aux users Business de générer une version complète via Sonnet.

**Fichiers** :
- Server Action `generateCompleteRecommendation(issueId)` (vérifie plan Business, sinon refuse)
- Update `RecommendationSheet.tsx` avec toggle

**Critères** :
- Toggle visible mais désactivé pour Free/Pro avec tooltip "Plan Business"
- Si Business + click : génère via Sonnet, store, affiche
- Si déjà générée : affiche depuis DB (pas de re-génération)

---

### Ticket 25 — Feature Publishers
**Objectif** : générer et afficher la liste des publishers par secteur.

**Fichiers** :
- `lib/db/schema.ts` : table `publishers`
- `lib/analysis/publishers.ts` (génère via Haiku avec structured output)
- Étape Inngest `step.run("publishers")` à la fin de la full analysis
- `app/(app)/sites/[siteId]/publishers/page.tsx`
- `components/features/publishers/PublishersList.tsx`

**Critères** :
- 15 publishers générés (5 médias FR, 5 communautés, 5 bases publiques)
- Chaque publisher a un `pitch_angle` actionnable
- Plan Free : 3 visibles, reste flouté

---

### Ticket 26 — Polling de l'état d'analyse + notifications UI
**Objectif** : l'utilisateur voit en temps réel l'avancement.

**Fichiers** :
- Server Component avec `revalidatePath` ou hook React `usePollAnalysis(analysisId)` qui poll toutes les 5s tant que status=running
- Toast notification quand analyse passe à success
- Skeleton loaders sur les onglets pendant le running

**Critères** :
- Sur la page overview, le statut se met à jour sans refresh manuel
- Une fois success, les 4 notes s'affichent
- Si error : message d'erreur + bouton "Recommencer"

---

## Sprint 6 — Paiement + Polish + Launch (Semaine 6)

### Ticket 27 — Stripe : checkout + customer portal + webhooks
**Objectif** : paiement Pro et Business fonctionnel end-to-end.

**Fichiers** :
- `lib/stripe.ts` (init client, helpers)
- `app/api/stripe/webhooks/route.ts` (gère `customer.subscription.created/updated/deleted`, `invoice.payment_succeeded/failed`)
- Server Actions `createCheckoutSession` et `createPortalSession`
- `app/(app)/settings/billing/page.tsx`
- 3 produits Stripe créés (à faire manuellement dans le dashboard Stripe) + IDs en env vars

**Critères** :
- Un user Free peut cliquer "Passer Pro" → redirigé vers Stripe Checkout → paiement test (carte 4242) → retour app avec plan Pro
- Le webhook met à jour `subscriptions.plan` et `status`
- Gestion du portail Stripe (changer carte, annuler) fonctionnelle

---

### Ticket 28 — Quotas système + page Usage
**Objectif** : vérifications quota partout + affichage usage.

**Fichiers** :
- Compléter `lib/quotas.ts` avec toutes les fonctions (`canRunFullAnalysis`, `canRunTabAnalysis`, `getRemainingAnalysesThisMonth`, etc.)
- `app/(app)/settings/usage/page.tsx`
- Tests unitaires sur les fonctions de quota

**Critères** :
- Toutes les actions coûteuses (analyse, génération coach IA premium, ajout site) passent par un check `lib/quotas.ts`
- Page Usage affiche les quotas restants par fonctionnalité

---

### Ticket 29 — PWA setup
**Objectif** : app installable sur mobile, manifest correct.

**Fichiers** :
- `public/manifest.json`
- `public/icons/` (192px et 512px)
- Configuration Serwist dans `next.config.mjs`
- Composant `components/InstallPrompt.tsx` (suggère l'install sur mobile au bout de 30s d'utilisation)

**Critères** :
- Lighthouse PWA score > 90
- L'app est installable depuis Chrome mobile

---

### Ticket 30 — Pages légales
**Objectif** : CGV, mentions, RGPD, cookies.

**Fichiers** :
- `app/(marketing)/legal/cgv/page.tsx`
- `app/(marketing)/legal/privacy/page.tsx`
- `app/(marketing)/legal/mentions/page.tsx`
- `app/(marketing)/legal/cookies/page.tsx`
- `components/CookieBanner.tsx` (consent simple : essentiels / analytics)

**Critères** :
- Pages accessibles via le footer
- Bannière cookies bloque PostHog tant que pas de consent
- Mention SIRET (à compléter après inscription auto-entrepreneur)

---

### Ticket 31 — Sentry + PostHog + QA finale
**Objectif** : observabilité production + tests manuels exhaustifs.

**Fichiers** :
- `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- `lib/posthog.ts` (init avec respect du consent)
- Events PostHog : signup, first_analysis_started, first_analysis_completed, plan_upgraded, etc.
- Checklist QA en `tests/qa-checklist.md`

**Critères** :
- Une exception en prod est reportée à Sentry avec contexte (user, route, etc.)
- Les events principaux sont trackés dans PostHog
- Checklist QA passée à 100% (en local sur Vercel preview)

---

### Ticket 31.5 — Polish pass UI (Claude Design)
**Objectif** : passe de finition visuelle sur l'ensemble des écrans avant le deploy production. Compléter les états manquants, finaliser la landing, vérifier la cohérence mobile.

**Outil** : [claude.ai/design](https://claude.ai/design) — Prototype High fidelity en réutilisant le design system créé en T8.5

**Étapes** :
1. **Landing page finale** (T1 avait juste un placeholder) : hero "Soyez cité par ChatGPT. Pas par hasard." + 3 colonnes Sache/Comprends/Améliore + plans tarifaires + FAQ 6-8 questions + footer légal
2. **Empty states** : 0 site (dashboard), 0 analyse, analyse en erreur, 0 issue (onglets tech/contenu)
3. **Loading states** : skeletons cohérents sur tous les onglets pendant `status=running`
4. **Error states** : analyse échouée + bouton "Recommencer", erreurs form avec messages clairs
5. **Copy review** : relecture de tous les textes UI (boutons, tooltips, messages d'erreur, copy coach IA) — ton accessible pour TPE/PME non-experts
6. **Micro-interactions** : animation de remplissage de la ScoreGauge, hover sur cellules tableau Autorité, transition Sheet latéral, animation lancement analyse
7. **Responsive / mobile** : audit particulier sur le tableau croisé Autorité (sticky header + scroll horizontal), onboarding wizard, dashboard cards
8. **Audit visuel screen-par-screen** : vérifier alignements, rythme vertical, cohérence des espacements sur les 15+ écrans livrés

**Fichiers à modifier** :
- `app/(marketing)/page.tsx` : landing page complète (hero + sections + pricing + FAQ)
- `components/features/*/EmptyState.tsx` : composants empty state par section
- `components/features/analysis/AnalysisError.tsx` : état erreur analyse
- Mise à jour des skeletons dans T26 si incomplets
- `app/globals.css` : ajustements tokens si nécessaire après vision globale

**Critères** :
- Landing page complète et brandée (plus le placeholder T1)
- Tous les écrans ont un état empty, loading et error cohérents
- Aucun texte "Lorem ipsum" ou placeholder restant en production
- Tableau Autorité scrollable et lisible sur mobile (375px)
- Wizard onboarding complet sur mobile (375px)
- Copy validée : zéro jargon SEO/tech inexpliqué côté utilisateur final
- `pnpm typecheck && pnpm lint` : 0 erreur
- Lighthouse mobile > 85

---

### Ticket 32 — Deploy production + DNS geomind.fr
**Objectif** : mise en ligne.

**Fichiers** : aucun, configuration Vercel.

**Étapes** :
- Connecter le repo GitHub à Vercel
- Variables d'environnement de production saisies dans Vercel
- DNS de `geomind.fr` pointé vers Vercel
- Vérification du domaine sur Resend (SPF, DKIM)
- Création des produits Stripe en mode Live (et update des price_ids)
- Stripe en mode Live (impossible sans SIRET, donc en attente de l'inscription auto-entrepreneur)
- Test E2E sur le domaine de prod

**Critères** :
- `https://geomind.fr` charge la landing
- Un signup E2E fonctionne (email reçu, lien de vérif valide)
- Sentry et PostHog reçoivent les premiers events

---

### Ticket 32.5 — Overlay de chargement bloquant pendant les analyses

**Objectif** : quand une analyse (découverte ou complète) est lancée, ouvrir une fenêtre modale fullscreen qui bloque toute navigation dans l'app tant que l'analyse n'est pas terminée. Le client ne peut pas changer d'onglet, cliquer sur la sidebar, ni quitter la page — il voit le statut en temps réel jusqu'à la fin.

**Contexte** : aujourd'hui, après le click sur "Lancer l'analyse", l'utilisateur est redirigé vers `/overview` et peut naviguer librement. Un polling passif tourne en arrière-plan. Le problème : l'utilisateur quitte souvent la page, revient plus tard et ne sait pas où en est l'analyse. Ce ticket force une attente active avec feedback visuel engageant.

**Fichiers** :
- `components/features/analysis/AnalysisLockProvider.tsx` ← nouveau — Context React + état "locked"
- `components/features/analysis/AnalysisLoadingOverlay.tsx` ← nouveau — modale fullscreen bloquante
- `components/features/analysis/RunAnalysisButton.tsx` ← déclenche le lock au clic
- `components/features/app/sidebar.tsx` ← désactive les liens nav quand locked
- `app/(app)/layout.tsx` ← wraps avec `<AnalysisLockProvider>`
- `components/features/overview/overview-polling.tsx` ← déverrouille quand status ≠ pending/running

**Comportement détaillé** :

1. **Lock au lancement** — Au clic sur "Lancer l'analyse" (`RunAnalysisButton`), après succès de la Server Action, appeler `lockAnalysis(analysisId)` depuis le context. Le lock stocke `{ analysisId, startedAt, type: 'discovery' | 'full' }` dans un Context React (pas localStorage — le lock doit mourir si l'onglet se ferme).

2. **Overlay fullscreen bloquant** (`AnalysisLoadingOverlay`) — Apparaît dès que `locked === true`. Caractéristiques :
   - Position `fixed inset-0 z-[9999]` pour passer au-dessus de tout (sidebar incluse)
   - Fond `bg-background/95 backdrop-blur-sm` — pas complètement opaque, le contenu en dessous reste visible en flou
   - Pas de bouton "fermer", pas de click en dehors pour fermer (`pointer-events-none` sur la zone de fond)
   - Affiche : nom du site, type d'analyse, spinner animé, étape courante (voir ci-dessous), durée estimée ("~2-5 min")
   - **Étapes progressives** : afficher un stepper ou message rotatif — "Crawl du site…", "Interrogation des moteurs IA…", "Analyse des citations…", "Calcul des scores…" — basé sur un timer côté client (pas de vrai tracking d'étape, juste simulation temporelle progressive toutes les 20-30s)
   - Un seul CTA en bas : lien désactivé grisé "Changer d'onglet" avec tooltip "Restez ici pour voir vos résultats en temps réel"

3. **Bloc navigation** — Pendant le lock :
   - La `Sidebar` reçoit une prop `locked` et rend tous ses `<Link>` non-cliquables (`pointer-events-none opacity-50`), avec un tooltip "Analyse en cours…"
   - Ajouter un handler `beforeunload` dans l'overlay pour prévenir la fermeture de l'onglet navigateur (message natif du browser : "Des modifications sont en cours")

4. **Déverrouillage** — `overview-polling.tsx` poll toutes les 5s. Quand le status passe à `success` ou `error`, appeler `unlockAnalysis()` depuis le context. L'overlay se ferme avec une animation (fade out), puis :
   - Si `success` : afficher un toast "Analyse terminée ! Voici vos résultats." + `router.refresh()` sur la page overview
   - Si `error` : afficher un toast d'erreur + libérer la navigation normalement

5. **Résilience** — Si l'utilisateur recharge la page alors qu'une analyse est `pending`/`running` en DB, l'overlay doit se ré-ouvrir automatiquement. Au mount du layout, vérifier si un `analysis` avec status `pending`/`running` existe pour le site courant (via Server Component → prop passée au Provider). Si oui, initialiser le lock dès le rendu.

**Critères** :
- Cliquer sur un lien de la sidebar pendant une analyse → non-cliquable (visuellement désactivé + tooltip)
- Fermer l'onglet pendant une analyse → dialog de confirmation native du browser
- Recharger la page pendant une analyse → overlay se ré-ouvre
- Quand l'analyse se termine (success ou error) → overlay se ferme, navigation restaurée
- L'overlay est rendu au-dessus de la sidebar ET du main content (z-index ≥ 9999)
- Aucun appel LLM ou logique métier dans les composants de l'overlay — uniquement lecture du status via polling existant

---

---

## Sprint 7 — V2 produit (post-launch)

### TKT-CREDITS — Système de crédits universel

> **Spec de référence : `cahier-des-charges.md` section 17** — principes, cycle de vie des crédits, pédagogie UX, anti-abus, migration. En cas de doute, la section 17 fait foi.

**Objectif** : remplacer le système de quotas (nb analyses/mois + nb messages coach) par un système de crédits universel consommé par toute opération qui appelle une API externe. Coût variable selon la complexité de l'opération, avec possibilité d'acheter des packs supplémentaires.

**Principe** :
- 1 crédit ≈ 0,001 € de coût API réel (marge ×2)
- Crédits mensuels reset à la **date anniversaire de facturation** (webhook Stripe `invoice.payment_succeeded`) ; plan Gratuit : 1er du mois, check lazy à la consommation — pas de cron
- Pas de report des mensuels non consommés ; les crédits achetés en pack ne périment jamais
- Priorité de consommation : crédits du plan d'abord, puis crédits achetés
- **Bonus de bienvenue** : 1 000 crédits one-shot à l'inscription (`reason='welcome_bonus'`)
- Analyse décomptée au lancement ; si échec technique → remboursement automatique (`reason='refund_failed_analysis'`)
- Jamais de solde négatif ; plan admin = `Infinity`, aucune transaction

**Coût en crédits par opération** (à définir dans `lib/credits.ts`) :

| Opération | Crédits |
|-----------|---------|
| Analyse complète (crawl + 4 IAs × 3 prompts) | 400 |
| Analyse autorité seule | 150 |
| Analyse technique seule | 20 |
| Analyse contenu seule | 20 |
| Analyse page par page (par page) | 8 |
| Message Coach IA (modèle Haiku) | 10 |
| Message Coach IA (modèle Sonnet) | 30 |
| Génération recommandation complète (Sonnet) | 50 |

**Fichiers** :
- `lib/credits.ts` : constantes `CREDIT_COSTS` + fonctions `getUserCredits(userId)`, `consumeCredits(userId, amount, reason)`, `refundCredits(userId, amount, reason)`, `hasEnoughCredits(userId, amount)`, `formatCreditsAsUsage(credits)` (traduction humaine « ≈ X analyses ou Y questions à GEO ») — lecture/écriture en DB
- `lib/db/schema.ts` : table `credit_balances` (userId, monthly_credits, purchased_credits, last_reset_at), table `credit_transactions` (userId, amount, reason, created_at)
- `drizzle/migrations/` : migration pour les 2 nouvelles tables
- `lib/plans.ts` : remplacer `analyses` et `coachMessagesPerMonth` par `creditsPerMonth`
- `lib/quotas.ts` : refactoriser `canRunFullAnalysis`, `canRunTabAnalysis`, `canSendCoachMessage` → délèguent tous à `hasEnoughCredits`
- `lib/inngest/functions/run-full-analysis.ts` : déduire les crédits via `consumeCredits` au début de chaque sous-étape (si échec = pas de consommation grâce au try/catch existant)
- `app/api/coach/[siteId]/route.ts` : consommer les crédits avant chaque appel LLM
- `app/api/stripe/webhooks/route.ts` : gérer `checkout.session.completed` pour les packs de crédits → `consumeCredits` en négatif (rechargement)
- `lib/stripe.ts` : helper `createCreditPackCheckout(userId, packId)`
- `app/(app)/settings/billing/page.tsx` : afficher les crédits restants (mensuel + achetés) + bouton "Acheter des crédits"
- `components/features/credits/CreditPacksModal.tsx` : modal avec 3 packs
- `components/features/credits/CreditsBadge.tsx` : badge solde dans la sidebar (toutes pages), traduction humaine au survol, lien `/settings/usage`
- `app/(app)/settings/usage/page.tsx` : refonte — jauge double (mensuels/achetés), historique `credit_transactions`, équivalences humaines, CTA packs
- Alerte 20 % : bannière in-app + email Resend quand le solde mensuel passe sous 20 % (flag `low_credit_alerted_at`, une fois par cycle) — template dans `lib/email/templates/`
- Confirmation avant dépense ≥ 100 crédits : coût + solde résultant affichés avant l'action (RunAnalysisButton notamment)

**Packs de crédits** (produits Stripe à créer) :

| Pack | Crédits | Prix |
|------|---------|------|
| Starter | 500 crédits | 5 € |
| Growth | 2 000 crédits | 15 € |
| Power | 8 000 crédits | 49 € |

**Critères** :
- `getUserCredits(userId)` retourne `{ monthly: number, purchased: number, total: number }`
- `consumeCredits` échoue proprement si solde insuffisant (pas de solde négatif)
- Un achat Stripe de pack crédite instantanément le compte via webhook
- Les crédits mensuels se réinitialisent à la date anniversaire de facturation (webhook Stripe) ; plan Gratuit au 1er du mois en lazy
- Un nouveau compte reçoit 1 000 crédits de bienvenue (visible dans `credit_transactions`)
- Une analyse qui échoue techniquement est remboursée automatiquement
- Le badge solde est visible dans la sidebar sur toutes les pages, avec traduction humaine au survol
- L'alerte 20 % se déclenche une seule fois par cycle (in-app + email)
- Page billing affiche la jauge de crédits restants
- `pnpm typecheck && pnpm lint && pnpm test` : 0 erreur

---

### TKT-PLANS-V2 — Nouveau modèle de plans + feature gates

> **Spec de référence : `cahier-des-charges.md` section 17** — grille complète, changements de plan (upgrade/downgrade/annulation/impayé), positionnement du Gratuit, migration. En cas de doute, la section 17 fait foi.

**Objectif** : refonte du business model. 4 plans (Gratuit / Solo / Pro / Business) avec des crédits mensuels différents ET des fonctionnalités débloquées selon le plan. Facturation mensuelle ET annuelle (-20 %). Mise à jour Stripe, UI pricing, et tous les paywalls existants.

**Dépendance** : TKT-CREDITS doit être terminé avant ce ticket.

**Nouveau modèle de plans** :

| | Gratuit | Solo | Pro | Business |
|--|---------|------|-----|----------|
| Prix mensuel | 0 € | 19 €/mois | 59 €/mois | 149 €/mois |
| Prix annuel (-20 %, /mois) | — | 15 € | 47 € | 119 € |
| Sites | 1 | 2 | 5 | 15 |
| Crédits/mois | 500 | 5 000 | 20 000 | 80 000 |
| Analyse page par page | ❌ | ✅ 5 pages max | ✅ 10 pages max | ✅ 10 pages max |
| Mémoire Coach IA | ❌ | ✅ | ✅ | ✅ |
| Recommandations complètes (Sonnet) | ❌ | ❌ | ✅ | ✅ |
| Publishers complets (15) | ❌ (3 seulement) | ✅ | ✅ | ✅ |
| Export PDF rapport | ❌ | ❌ | ✅ | ✅ white-label (logo client) |
| Historique analyses | 30 j | 90 j | 365 j | illimité |
| Support | Standard | Standard | Standard | Prioritaire (< 24 h) |
| Achat crédits à la carte | ✅ | ✅ | ✅ | ✅ |

**Fichiers** :
- `lib/plans.ts` : refactoriser `PLAN_LIMITS` avec les nouvelles valeurs + nouvelle constante `PLAN_FEATURES` (feature flags par plan : `pageAnalysis`, `coachMemory`, `fullRecommendations`, `publishersFull`, `pdfExport`, `historyDays`)
- `lib/quotas.ts` : ajouter `canUsePageAnalysis(userId)`, `canUseCoachMemory(userId)`, `canUseFullRecommendations(userId)`, `getPageAnalysisLimit(userId)`
- `app/(marketing)/pricing/page.tsx` : refonte complète — toggle Mensuel/Annuel, badge « Le plus populaire » sur Pro, grille avec équivalences humaines des crédits, FAQ crédits
- `app/(app)/settings/billing/page.tsx` : mettre à jour les plans affichés (mensuel + annuel)
- Gestion des changements de plan (cf. §17.5) : upgrade immédiat avec complément de crédits, downgrade en fin de période, sites excédentaires gelés en **lecture seule** (jamais supprimés, l'utilisateur choisit lesquels restent actifs), impayé = 7 j de grâce puis gel au niveau Gratuit
- `lib/db/queries/sites.ts` : statut `frozen` sur les sites excédentaires + UI de sélection des sites actifs après downgrade
- Stripe dashboard (manuel) : 6 Price IDs (3 plans × mensuel/annuel) + 3 produits packs → env vars ; migration des comptes test DB (`pro`→Pro, `business`→Business, soldes initialisés + bonus bienvenue rétroactif) — aucun client payant réel (Stripe jamais Live), pas de grandfathering
- Tous les paywalls existants (recommandations complètes, publishers, coach) : mettre à jour les vérifications pour utiliser `PLAN_FEATURES`
- `app/(app)/sites/[siteId]/authority/page.tsx`, `technical/page.tsx`, `content/page.tsx` : ajouter paywall export PDF (bouton désactivé + tooltip si plan < Pro)

**Critères** :
- La page `/pricing` affiche les 4 plans avec toggle Mensuel/Annuel et équivalences humaines des crédits
- Un user Gratuit ne peut pas activer la mémoire de GEO → teaser avec lien upgrade
- Un user Pro peut générer les recommandations complètes et exporter en PDF
- Stripe Checkout fonctionne pour les 6 prix (3 plans × 2 périodicités, test cards)
- Un downgrade Pro → Solo gèle les sites excédentaires en lecture seule sans perte de données
- Un upgrade Solo → Pro complète immédiatement les crédits mensuels de la différence
- `pnpm typecheck && pnpm lint && pnpm test` : 0 erreur

---

### TKT-COACH-V2 — GEO, le coach IA (refonte complète)

> **Spec de référence : `cahier-des-charges.md` section 16** — identité et voix (exemples calibrés), budget tokens, messages d'accueil exacts, matrice complète des chips, formule de décompte crédits, sécurité/anti-injection, cas limites, observabilité. Le présent ticket est le résumé opérationnel ; en cas de doute, la section 16 fait foi.

**Objectif** : refonte complète du Coach IA. Corriger le bug d'accès (plan Gratuit bloqué), créer un assistant IA nommé **GEO** — ludique, pédagogique, expert GEO — accessible partout dans l'app via un bouton flottant ET dans un onglet dédié par site. GEO aide le client à corriger ses points faibles le plus vite possible, avec accès aux données du site + capacité de recherche web.

**Dépendances** : TKT-CREDITS + TKT-PLANS-V2 doivent être terminés.

**Phasage** (4 sous-lots livrables séquentiellement, détail en section 16.13 du cahier des charges) :
1. **V2a — Cerveau** : API route (Sonnet + fallback Haiku, web search, crédits réels, system prompt v2, anti-injection, rate limit 30 msg/h)
2. **V2b — Corps** : UI complète (provider, flottant, avatar, chips, Markdown+copier, états, bouton "Demander à GEO", mobile)
3. **V2c — Mémoire** : table + compression + rechargement + gate plan + comparaison N vs N-1
4. **V2d — Magie** : auto-ouverture 1re analyse, badge pulse, messages d'accueil, PostHog, QA

---

#### Identité de GEO

- **Nom** : GEO (l'assistant GeoMind)
- **Personnalité** : ludique, direct, pédagogique — jamais de jargon SEO non expliqué, il parle comme un coach humain qui connaît très bien son sujet
- **Modèle** : `anthropic/claude-sonnet-4-6` via OpenRouter — meilleur rapport pertinence/coût pour ce rôle de coaching
- **Web search** : activé via le paramètre `web_search_tool` d'OpenRouter (Sonnet + web) — GEO peut chercher des informations en ligne si la question le justifie (ex : "comment ajouter un FAQ schema sur WordPress")
- **Langue** : toujours répondre dans la langue du site analysé (fr/en selon `site.language`)

---

#### Deux points d'accès

**1. Bouton flottant global** (`CoachFloatingButton`)
- Présent sur toutes les pages authentifiées de l'app (`app/(app)/layout.tsx`)
- Icône fixe en bas à droite (z-50), badge avec solde de crédits
- Au clic : ouvre un panel latéral `CoachFloatingPanel` (drawer 400px)
- Le panel s'ouvre **sans contexte pré-injecté** — GEO accueille l'utilisateur et lui demande sur quoi il veut de l'aide
- Si un `siteId` est détectable dans l'URL courante, GEO connaît déjà le site actif
- Mémoire : partagée avec l'onglet dédié (même `coach_messages` par siteId)

**2. Onglet Coach dédié** (`/sites/[siteId]/coach`)
- Interface de chat plein écran, historique complet visible
- GEO accueille avec un message d'intro contextualisé : score global, pilier le plus faible, suggestion d'action prioritaire
- Bouton "Nouvelle conversation" possible mais l'historique reste consultable

**3. Ouverture contextuelle depuis une issue** (`"Demander à GEO"`)
- Sur les onglets Technique et Contenu, chaque `IssueCard` a un bouton "Demander à GEO"
- Au clic : ouvre le `CoachFloatingPanel` avec l'issue pré-injectée comme premier message système
- GEO démarre directement sur le problème : "Tu veux corriger **[titre de l'issue]**. Voici comment faire…" + code prêt à copier si applicable (balises HTML, JSON-LD, meta tags…)
- Pas de navigation vers l'onglet Coach — le panel s'ouvre par-dessus la page courante

---

#### Ce que GEO sait (system prompt contextualisé)

À chaque conversation, le system prompt injecte :

```
- Nom du site + URL + secteur d'activité + langue + pays
- Score global + note Autorité + note Technique + note Contenu
- Top 5 issues prioritaires (titre + sévérité + catégorie)
- Mots-clés cibles du site
- Concurrents détectés
- Résumé mémoire de la conversation précédente (si existant)
- Date de la dernière analyse
- Contexte de l'issue si ouverture contextuelle
```

GEO génère du code prêt à copier-coller quand c'est utile (balise HTML, JSON-LD, meta tag, extrait de config) — rendu en bloc de code Markdown avec bouton "Copier".

---

#### Décisions produit (arbitrées 2026-06-12)

**Premier contact — proactif une seule fois**
- À la fin de la **première analyse d'un site** (et uniquement celle-là), le panel GEO s'ouvre automatiquement avec un message d'accueil personnalisé : score global, pilier le plus faible, proposition d'attaquer la première correction
- Flag `coach_intro_seen` (boolean) sur la table `sites` pour ne jamais ré-ouvrir automatiquement
- Ensuite : badge "•" animé sur le bouton flottant quand GEO a du nouveau (nouvelle analyse terminée, comparaison N vs N-1 disponible) — jamais d'ouverture forcée

**Chips de questions suggérées — contextuelles**
- 3 suggestions cliquables max sous l'input, qui varient selon la page courante et l'état du site
- Exemples : onglet Technique avec issues → "Par quoi je commence ?" / "Explique-moi l'issue la plus grave" / "Combien de temps pour tout corriger ?" ; onglet Overview → "Pourquoi mon score est de X ?" / "C'est quoi mon point faible ?" ; panel flottant sans contexte → "Comment améliorer ma visibilité IA ?" / "Explique-moi mes notes"
- Constantes dans `lib/ai/coach-suggestions.ts` : `getSuggestions(page, siteState): string[]` — fonction pure, testée

**Boucle de correction — le moment gratifiant**
- Après avoir guidé une correction, GEO propose de relancer une analyse pour vérifier, en affichant le coût : "Quand tu as fait la modif, relance une analyse (400 crédits) et on vérifie ensemble !"
- Au premier message d'une conversation qui suit une nouvelle analyse, GEO compare automatiquement N vs N-1 (via `lib/analysis/compare.ts`) : issues disparues, deltas de scores — et célèbre les progrès ("🎉 3 issues corrigées, ton score technique passe de 45 à 62")
- Le contexte injecté dans le system prompt inclut le diff N vs N-1 si une analyse précédente existe

**Avatar — identitaire et sobre**
- Pas de mascotte cartoon : un orbe/boussole animé aux couleurs GeoMind (SVG animé, dégradé brand)
- Pulse doux sur le bouton flottant quand le badge "nouveau" est actif
- `components/features/coach/GeoAvatar.tsx` : 3 tailles (bouton flottant, header du panel, messages)

**Limites et honnêteté**
- Hors-sujet (rédaction LinkedIn, code sans rapport, etc.) : GEO répond en une phrase avec humour et recentre sur la visibilité IA — pas de longue réponse hors périmètre
- Donnée indisponible (trafic, analytics, positions Google) : GEO le dit explicitement ("Je n'ai pas accès à ton trafic — par contre je peux te dire ce que les IA pensent de ton site") et propose une alternative dans son périmètre
- Jamais d'invention de données : si GEO ne sait pas, il le dit
- Ces règles sont dans le system prompt, avec exemples few-shot

---

#### Mémoire persistante par site

- Table `coach_memory` (userId, siteId, memory_summary text, message_count int, updated_at)
- Résumé roulant généré automatiquement par Haiku tous les 10 messages (event Inngest `coach.memory.compress`)
- Le résumé contient : problèmes discutés, corrections déjà appliquées mentionnées, niveau de progression perçu
- Au mount du panel/page : charger les 20 derniers messages depuis `coach_messages` + le résumé mémoire
- Plan Gratuit : pas de mémoire (conversation repart de zéro à chaque session) — voir `PLAN_FEATURES.coachMemory`

---

#### Coût en crédits

- Message standard (< 500 tokens en réponse) : **15 crédits**
- Message long ou avec web search (> 500 tokens) : **30 crédits**
- Le coût réel est calculé après la réponse (tokens de sortie × coefficient) et déduit via `consumeCredits`
- Si l'utilisateur n'a plus assez de crédits : message GEO "Il me faut plus de carburant ! Recharge tes crédits pour continuer." + lien vers billing

---

#### Fichiers

- `lib/db/schema.ts` : table `coach_memory` (userId, siteId, memory_summary, message_count, updated_at) + index (userId, siteId) ; colonne `coach_intro_seen boolean default false` sur `sites`
- `drizzle/migrations/` : migration pour `coach_memory` + `sites.coach_intro_seen`
- `lib/ai/coach-suggestions.ts` : `getSuggestions(page, siteState): string[]` — chips contextuelles, fonction pure testée
- `components/features/coach/GeoAvatar.tsx` : orbe/boussole SVG animé, 3 tailles (bouton, header, message)
- `lib/db/queries/coach.ts` : ajouter `getCoachMemory`, `upsertCoachMemory`, `getRecentCoachMessages(userId, siteId, limit: 20)`
- `lib/ai/prompts/coach.ts` : `buildCoachSystemPrompt(context: CoachContext): string` — paramétré, versionné, testé
- `app/api/coach/[siteId]/route.ts` : refactoriser — modèle Sonnet + web search, `consumeCredits` après la réponse (tokens réels), inject system prompt complet, vérif `hasEnoughCredits` avant appel
- `app/(app)/layout.tsx` : ajouter `<CoachFloatingButton siteId={currentSiteId} />`
- `components/features/coach/CoachFloatingButton.tsx` : bouton fixe bas-droite, badge crédits, état ouvert/fermé via Context
- `components/features/coach/CoachFloatingPanel.tsx` : drawer 400px, liste messages, input, streaming SSE, bouton copier sur blocs de code
- `components/features/coach/CoachProvider.tsx` : Context React global — état du panel ouvert/fermé + `openWithIssue(issue)` pour l'ouverture contextuelle
- `components/features/coach/CoachPanel.tsx` : refactoriser le panel existant (utilisé dans l'onglet dédié) pour partager la logique avec `CoachFloatingPanel`
- `components/features/technical/IssueCard.tsx` + `components/features/content/ContentIssueCard.tsx` : ajouter bouton "Demander à GEO" qui appelle `openWithIssue(issue)` depuis le Context
- `app/(app)/sites/[siteId]/coach/page.tsx` : fix gate plan (utiliser `hasEnoughCredits`), charger historique + mémoire server-side, message d'intro contextualisé
- `lib/inngest/functions/` : `compress-coach-memory.ts` — déclenché par event `coach.memory.compress`, résume via Haiku, `upsertCoachMemory`

**Critères** :
- Un user Gratuit voit GEO et peut envoyer des messages (dans la limite de ses crédits — plus aucun paywall bloquant)
- Cliquer sur "Demander à GEO" depuis une issue ouvre le panel avec GEO qui démarre directement sur le problème
- Rouvrir GEO 2 jours plus tard → les 20 derniers messages sont là (si plan Solo+)
- GEO génère du code prêt à copier-coller sur les issues techniques (balise HTML, JSON-LD)
- Le bouton flottant est visible sur toutes les pages `/sites/[siteId]/*`
- Le solde de crédits est affiché dans le panel flottant et dans l'onglet Coach
- À la fin de la 1re analyse d'un site, le panel s'ouvre automatiquement avec le message d'accueil personnalisé — et plus jamais ensuite (`coach_intro_seen`)
- 3 chips de suggestions contextuelles s'affichent sous l'input et varient selon l'onglet
- Après une nouvelle analyse, le premier message de GEO compare N vs N-1 (issues corrigées + deltas de scores)
- Une question hors-sujet reçoit une réponse d'une phrase + recentrage (vérifié manuellement avec 3 exemples)
- `pnpm typecheck && pnpm lint && pnpm test` : 0 erreur

---

### TKT-RULES-V2 — Règles GEO v2 (~33 règles techniques, ~26 règles contenu, analyse page par page)

> **Spec de référence : `cahier-des-charges.md` section 18** — catalogues complets des règles avec scope/sévérité/source de données, scoring V2, sélection des pages, opportunités, migration DB. En cas de doute, la section 18 fait foi.

**Objectif** : refonte complète des règles GEO pour qu'un audit ait **toujours** quelque chose à dire. Constat V1 (audit du code 2026-06-12) : seulement 10 règles techniques et 6 règles contenu réellement actives (16 ont été désactivées au fil du temps comme « SEO classique »), toutes au niveau site, seuils à 20 % — un bon site remonte 0 issue.

**Dépendance** : TKT-PLANS-V2 (pour le gate page-par-page par plan). Peut être développé en parallèle de TKT-CREDITS.

**Les 3 leviers** :
1. **Catalogue ×3** : réintégration des 10 règles désactivées (reformulées sous l'angle GEO — les crawlers IA parsent la structure HTML et utilisent title/meta dans leurs citations) + 17 nouvelles règles techniques + 16 nouvelles règles contenu → ~33 techniques, ~26 contenu (détail complet en §18.4 et §18.5)
2. **Analyse page par page** : règles à `scope: 'page'` exécutées sur les pages sélectionnées par `selectPagesForAnalysis()` (accueil toujours incluse, puis profondeur/contenu/diversité — pure et déterministe). Gratuit = analyse globale seule, Solo = 5 pages, Pro/Business = 10. Crawl de l'analyse complète porté à `maxPages: 15`.
3. **Niveau « opportunité »** : sévérité sans pénalité, section « Pour aller plus loin » dédiée — garantie produit : **tout audit affiche ≥ 3 opportunités**, même un site parfait (pool statique par secteur en complément, `lib/analysis/opportunities.ts`, zéro appel LLM).

**Métadonnées de règles** : chaque règle déclare `scope` (site/page), `severity` (major/moderate/minor/opportunity), `effort` (1-3) et `impact` (1-3) — alimentent le bloc « Quick wins » de l'UI et le contexte injecté à GEO.

**Scoring V2** (`lib/analysis/scoring.ts`, pur et testé) :
- Pénalités par sévérité : major 12 / moderate 6 / minor 3 / opportunity 0
- Issues de page proportionnelles : pénalité × (pages affectées / pages analysées)
- Plafond de 30 points de pénalité par catégorie (une catégorie ne coule pas le score seule)
- Colonne `analyses.rules_version` (V2 = 2) ; pas de recalcul rétroactif ; badge « Méthodologie enrichie » sur les comparaisons N vs N-1 qui traversent un changement de version

**Migration DB** : `technical_issues` + `content_issues` : + `page_url` (null = issue site), + `severity`, + `effort`, + `impact` (`penalty` conservée, calculée depuis la sévérité) ; `analyses` : + `rules_version int default 1`.

**UI V2** (onglets Technique et Contenu) :
- Bloc « Quick wins » en tête (effort = 1, impact ≥ 2, triés par impact)
- Vue globale + accordéons par page (« Page : /tarifs — 3 points faibles »)
- Filtres catégorie/sévérité, section « Pour aller plus loin » en bas
- Sheet de recommandation conservé + bouton « Demander à GEO »

**Phasage** (détail §18.10) :
1. **RULES-V2a — Infra** : types V2, scoring V2 + plafonds, `rules_version`, `selectPagesForAnalysis`, migration DB, réintégration des 10 règles désactivées
2. **RULES-V2b — Technique** : 17 nouvelles règles + durcissement seuils (response-time 2 s, hiérarchie Hn, schema-faq sur contenu FAQ existant) + fixtures
3. **RULES-V2c — Contenu** : 16 nouvelles règles + durcissement (thin-content médiane/150 mots, Q&A implicites) + fixtures
4. **RULES-V2d — UI** : vue par page, quick wins, filtres, opportunités, badge méthodologie

**Tests** : 1 test positif + 1 négatif minimum par règle (fixtures dans `tests/unit/fixtures/`), tests scoring V2 (plafonds, proportionnalité, déterminisme), test garantie ≥ 3 opportunités sur fixture de site parfait, tests `selectPagesForAnalysis`.

**Critères** :
- Sur un site quelconque, l'audit remonte au minimum 5 issues techniques et 5 issues contenu ; sur un site parfait, au minimum 3 opportunités par onglet
- Le bloc « Quick wins » apparaît en tête quand des issues effort=1/impact≥2 existent
- L'analyse page par page est visible (accordéons par URL) ; Solo = 5 pages max, Pro/Business = 10, Gratuit = vue globale seule
- Les scores restent déterministes et comparables ; le badge « Méthodologie enrichie » apparaît sur la première comparaison post-V2
- Migration DB rétrocompatible (anciennes issues : `page_url = null`, sévérité rétro-déduite de `penalty`)
- `pnpm typecheck && pnpm lint && pnpm test` : 0 erreur

---

## Ordre de priorité si retard de planning

Si le rythme dérape, voici l'ordre de coupe (du moins critique au plus critique) :

1. **PWA setup** (ticket 29) — peut être ajouté post-launch
2. **Feature Publishers** (ticket 25) — gros plus mais pas vital pour le 1er jour
3. **Toggle "version complète"** (ticket 24) — peut être différé en v0.2
4. **Onglet Contenu** (tickets 21, 22) — peut être livré incomplet en V1 si nécessaire (juste 3-4 règles au lieu de 8-10)
5. **Reste** — non-négociable

---

## Points de checkpoint hebdomadaires

À la fin de chaque semaine, faire un point :
- Combien de tickets terminés vs prévus ?
- Quels blocages techniques ?
- Quels ajustements de scope ?
- Le `pnpm typecheck && pnpm test` passe-t-il toujours ?

---

**Bon dev. 🚀**
