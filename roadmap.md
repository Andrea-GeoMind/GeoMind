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

## Sprint 6 — Qualité produit (post-launch)

### Ticket 034 — Refonte design et organisation UI
**Objectif** : rendre l'interface claire, cohérente et professionnelle. Le design actuel est perçu comme désorganisé et ne donne pas confiance. Priorité : lisibilité des données, hiérarchie visuelle, navigation évidente.

**Problèmes identifiés** :
- Hiérarchie visuelle floue : on ne sait pas quoi regarder en premier
- Onglets analyse peu lisibles sur mobile
- Cards et tableaux surchargés d'informations sans priorisation
- Landing page insuffisamment convaincante pour des TPE/PME non-experts

**Fichiers à modifier** :
- `app/(marketing)/page.tsx` : revoir le hero, la section "comment ça marche", les preuves sociales
- `app/(app)/dashboard/page.tsx` : recentrer sur l'action principale (lancer une analyse)
- `app/(app)/sites/[siteId]/overview/page.tsx` : score global plus lisible, hiérarchie claire
- `app/(app)/sites/[siteId]/authority/page.tsx` : tableau croisé simplifié
- `components/features/analysis/` : revoir les ScoreCards, badges, états vides
- `app/globals.css` : réviser la palette si nécessaire

**Critères d'acceptation** :
- Un non-expert comprend en 5 secondes ce que fait le produit (landing)
- La vue d'ensemble d'un site montre clairement : score global + 3 sous-scores + action suivante
- Les onglets Autorité/Technique/Contenu ont une structure identique et prévisible
- Aucun écran ne dépasse 3 niveaux de hiérarchie visuelle
- `pnpm typecheck && pnpm lint` : 0 erreur
- Responsive validé sur 375px et 1280px

---

### Ticket 035 — Coach IA
**Objectif** : implémenter le Coach IA — une interface conversationnelle qui permet au client de poser des questions sur son analyse et d'obtenir des conseils personnalisés basés sur ses données réelles (scores, issues, citations).

**Contexte** : c'est la feature qui transforme GeoMind d'un rapport statique en un outil actif. Le coach a accès au contexte complet du site analysé et répond avec des conseils actionnables, pas des généralités.

**Étapes** :
1. Table `coach_messages` en DB : `id`, `site_id`, `analysis_id`, `role` (user/assistant), `content`, `created_at`
2. Server Action `sendCoachMessage` : vérifie ownership + plan (coach = Pro+), construit le contexte (scores + top issues + citations), appelle le LLM (Haiku streaming), persiste les messages
3. Contexte système du coach : scores actuels, issues critiques, taux de citation par IA, comparaison avec analyse précédente — tout injecté dans le system prompt
4. UI Coach : page ou Sheet latéral persistant, input message, historique de conversation, streaming de la réponse
5. Quota : Free = coach désactivé (badge upgrade), Pro = 20 messages/mois, Business = illimité

**Fichiers à créer** :
- `lib/db/schema.ts` : table `coach_messages`
- `lib/db/queries/coach.ts` : insert/get messages
- `lib/ai/prompts/coach.ts` : system prompt contextualisé
- `lib/inngest/functions/run-coach.ts` : si streaming Inngest, sinon Server Action directe
- `components/features/coach/CoachPanel.tsx` : UI conversationnelle
- `components/features/coach/CoachMessage.tsx` : bulle message
- `app/(app)/sites/[siteId]/coach/page.tsx` : page coach

**Critères d'acceptation** :
- Le coach répond en streaming (pas d'attente bloquante)
- Le coach connaît les scores, issues et taux de citation du site
- Free : accès refusé avec message upgrade clair
- Pro : compteur de messages restants visible
- Business : accès illimité
- Les messages sont persistés et retrouvables à chaque visite
- `pnpm typecheck && pnpm lint && pnpm test` : 0 erreur

---

### Ticket 036 — Enrichissement règles GEO technique et contenu
**Objectif** : passer de 16 règles techniques + 10 règles contenu à un ensemble plus complet et plus pertinent pour la visibilité dans les IAs. Les règles actuelles sont perçues comme trop légères et trop proches du SEO classique.

**Nouvelles règles techniques à ajouter** :
- Présence d'une page FAQ structurée (schema FAQPage)
- Présence d'une page "À propos" avec informations E-E-A-T (auteur, expertise, date)
- Présence de données structurées Organization/LocalBusiness avec sameAs vers Wikipédia/Wikidata
- Balise `<link rel="canonical">` cohérente
- Présence d'un sitemap XML lié dans robots.txt
- Profondeur de page < 3 clics depuis la home
- Absence de contenu dupliqué entre pages principales

**Nouvelles règles contenu à ajouter** :
- Les titres de page répondent à une question (format "Comment/Pourquoi/Quels...")
- Présence d'une section "Questions fréquentes" sur les pages clés
- Contenu mis à jour dans les 6 derniers mois (date visible)
- Citations de sources externes (liens sortants vers sources reconnues)
- Présence de données chiffrées ou statistiques vérifiables
- Longueur de contenu suffisante sur les pages principales (>800 mots)

**Fichiers à modifier** :
- `lib/analysis/technical/rules/` : ajouter les nouveaux fichiers de règles
- `lib/analysis/content/rules/` : ajouter les nouveaux fichiers de règles
- `lib/db/schema.ts` : mettre à jour les enums si nécessaire
- `components/features/technical/TechnicalRecommendationSheet.tsx` : ajouter les fiches
- `components/features/content/ContentRecommendationSheet.tsx` : ajouter les fiches

**Critères d'acceptation** :
- Au moins 22 règles techniques et 15 règles contenu
- Chaque nouvelle règle a : une détection fiable, une sévérité justifiée, une fiche recommandation avec how/impact/effort
- Les règles sont clairement différenciées du SEO classique (focus sur ce que les IAs lisent)
- `pnpm typecheck && pnpm lint && pnpm test` : 0 erreur

---

### Ticket 037 — UX des scores — explication et pédagogie
**Objectif** : rendre les scores compréhensibles pour un non-expert. Actuellement un score de 43/100 n'explique pas ce qu'il signifie, comment il est calculé, ni quoi faire. Le score doit être un point de départ vers l'action, pas une note opaque.

**Problèmes identifiés** :
- Pas d'explication de ce que mesure chaque score
- Pas de contexte : est-ce que 43/100 c'est bien ou mal pour mon secteur ?
- Pas de lien direct entre score et action prioritaire
- Le score global est une moyenne floue pour l'utilisateur

**Ce à implémenter** :
1. **Tooltip pédagogique sur chaque score** : "Ce score mesure [X]. Il est calculé en [méthode simple]. Un score > 70 est considéré bon."
2. **Niveau de maturité** : transformer le score en label lisible — Débutant (0-39) / En progression (40-69) / Avancé (70-89) / Expert (90-100) — avec couleur et icône
3. **"Pourquoi ce score ?"** : section dépliable sous chaque ScoreCard listant les 3 principales raisons du score actuel (issues critiques ou points forts)
4. **Action prioritaire** : sous le score global, une seule phrase d'action : "Votre priorité : corriger [issue la plus impactante]" avec lien vers l'onglet concerné
5. **Comparaison sectorielle** (si données disponibles) : "Dans votre secteur, la moyenne est X/100"

**Fichiers à modifier** :
- `components/charts/ScoreGauge.tsx` : ajouter label de maturité + tooltip
- `components/features/analysis/ScoreCard.tsx` : section "Pourquoi ce score ?" + action prioritaire
- `app/(app)/sites/[siteId]/overview/page.tsx` : bannière action prioritaire
- `lib/analysis/scoring.ts` : fonction `getScoreLabel(score)` + `getPriorityAction(issues)`

**Critères d'acceptation** :
- Chaque score affiche son label de maturité (Débutant/En progression/Avancé/Expert)
- Un tooltip explique la méthode de calcul en 1-2 phrases simples
- La vue d'ensemble affiche 1 action prioritaire claire et cliquable
- Un utilisateur sans bagage technique comprend son score sans aide extérieure
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
