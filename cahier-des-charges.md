# GEOMIND — Cahier des charges V1

> **Document à transmettre à Claude Code.** À lire en complément de `CLAUDE.md` et `roadmap.md`.
> Périmètre : V1 lancement (6 semaines), avec features Coach IA conversationnel, benchmark concurrents et historique multi-analyses reportées en v0.2.

---

## 1. Contexte produit et vision

### 1.1 Promesse client

**GEOMIND aide les TPE, PME et indépendants français à apparaître dans les réponses de ChatGPT, Perplexity, Gemini et Claude.**

Le produit répond à 3 jobs-to-be-done :
1. *Savoir* où mon site est cité (ou pas) dans les réponses IA.
2. *Comprendre* pourquoi je ne suis pas cité.
3. *Améliorer* ma visibilité avec un plan d'action concret, compréhensible par un non-expert.

### 1.2 Positionnement

- **Outil dédié à la visibilité IA** (Generative Engine Optimization), pas un outil SEO généraliste.
- **Ultra-spécialisé pour TPE / PME / indépendants** non-experts, avec UX ludique et copy accessible.
- **Marché initial** : France uniquement.

### 1.3 Différenciateurs vs concurrence

1. **Site-centric** : on ne mesure pas que les citations, on analyse aussi le code (Technique) et le contenu (Contenu) du site pour expliquer le score.
2. **Coach IA pédagogique** : recommandations en langage simple, références au cours GEO en option "version complète".
3. **Feature Publishers** : on dit au client *où* publier (Wikipédia, Reddit, médias français) pour gagner en autorité IA.
4. **Approche multi-IA dès la V1** : 4 moteurs analysés en parallèle.

---

## 2. Personas et parcours utilisateur

### 2.1 Personas cibles

| Persona | Profil | Job principal |
|---|---|---|
| **Pierre, dirigeant TPE** | Boulanger, plombier, artisan, restaurateur. ~45 ans. Pas expert SEO. | "Je veux que quand quelqu'un demande à ChatGPT un boulanger à Lyon, on me cite." |
| **Sarah, marketeuse PME** | Responsable marketing dans une PME B2B SaaS. 30 ans. Connaît le SEO mais pas le GEO. | "Je dois prouver à ma direction qu'on est visible dans les IA et savoir quoi faire." |
| **Karim, freelance SEO** | Consultant SEO en micro-entreprise. Audite ses clients. | "Je veux un outil GEO simple à montrer à mes clients TPE." |

### 2.2 Parcours principal (happy path)

```
Landing page
    ↓ clic "Lancer GEOMIND"
Page Signup (email + password)
    ↓ submit
Email de confirmation envoyé
    ↓ clic lien
Page "email vérifié" → redirect vers /onboarding
    ↓
Wizard onboarding (4 étapes) :
    1. Bienvenue + explication GEO en 30 secondes
    2. Ajouter le premier site (nom + URL + langue + pays)
    3. Validation de l'analyse de découverte (description, mots-clés, concurrents, prompts) — éditable
    4. Lancement de l'analyse complète
    ↓
Page d'attente avec progression (toast "Analyse en cours...") — environ 60-90 secondes
    ↓
Redirection vers /sites/{siteId}/overview
    ↓
Découverte de la note GEO globale + accès aux 3 onglets
    ↓
Si Free : voit les points faibles mais solutions floutées → CTA upgrade Pro
Si Pro/Business : accès complet, peut consulter les fiches de recommandation
```

---

## 3. Périmètre V1 (exhaustif)

### 3.1 Inclus en V1

**Authentification & comptes**
- Signup avec email + mot de passe
- Email de confirmation (Resend)
- Login
- Mot de passe oublié (lien de reset)
- Logout
- 1 utilisateur = 1 compte (pas de multi-user en V1)
- Suppression de compte (RGPD)

**Plans & paiement**
- 3 plans : Gratuit, Pro (49€/mois), Business (149€/mois)
- Checkout via Stripe Checkout
- Gestion d'abonnement via Stripe Customer Portal
- Webhooks Stripe → mise à jour de la table `subscriptions`
- Affichage du plan actif + usage actuel sur `/settings/billing`

**Gestion des sites**
- Ajouter un site (nom + URL + langue + pays)
- Liste des sites du compte
- Page projet par site avec 4 onglets
- Supprimer un site (avec confirmation + cascade RGPD)

**Analyse de découverte**
- Crawl Firecrawl du site (limite par plan : 10 / 30 / 50 pages)
- Génération automatique par LLM (Claude Haiku ou équivalent) de :
  - Description (5-7 lignes)
  - 15 mots-clés
  - 3 concurrents directs suggérés (domaines + nom)
  - 20 prompts neutres (selon plan : 5 max en Free, 20 en Pro, 30 en Business)
- Interface d'édition : modifier description, ajouter/supprimer mots-clés, concurrents, prompts
- Détection automatique des prompts contenant le domaine ou la marque → badge "non neutre" + warning + exclusion du calcul de note
- Message pédagogique : "Plus vos prompts sont neutres, plus la note GEO est pertinente."
- Bouton "Valider et lancer l'analyse complète"

**Analyse complète (3 piliers)**
- Lancement en arrière-plan via Inngest (3 jobs parallèles : autorité, technique, contenu)
- État visible côté UI : `pending`, `running`, `success`, `error`
- Notification (UI toast) quand l'analyse est terminée

**Onglet Vue d'ensemble**
- Note GEO globale (jauge 0-100)
- 3 sous-notes : Autorité, Technique, Contenu (avec icônes vert/orange/rouge selon seuils)
- Comparaison avec l'analyse précédente (delta sur chaque note, si analyse N-1 existe)
- Bouton "Relancer analyse complète" (avec vérif quota)
- Date de dernière analyse

**Onglet Autorité**
- Note Autorité pondérée (top 3 = 3pts, top 10 = 2pts, ailleurs = 1pt, normalisée sur 100)
- Graphique : nombre de citations par IA (bar chart, 4 colonnes)
- Tableau : lignes = prompts, colonnes = 4 IAs, cellules = icône cité/non + rang si cité
- Click sur cellule → modal avec réponse complète de l'IA, mentions du domaine client surlignées en vert, mentions des concurrents en orange
- Liste des publishers détectés (top 10 domaines sources sur lesquels les IAs s'appuient)
- Bouton "Relancer analyse Autorité"

**Onglet Technique**
- Note Technique (0-100)
- Liste structurée des points faibles techniques par catégorie : Accessibilité, Structure, Données structurées, Performance
- Chaque point faible cliquable → ouvre une fiche de recommandation (panel latéral)
- Bouton "Relancer analyse Technique"

**Onglet Contenu**
- Note Contenu (0-100)
- Liste des points faibles : alignement intentions, structure en chunks, clusters sémantiques, qualité éditoriale, formats appréciés des IAs (FAQ, listes, tableaux)
- Chaque point faible cliquable → fiche de recommandation
- Suggestions de pages à créer/enrichir
- Bouton "Relancer analyse Contenu"

**Coach IA (fiches statiques)**
- Pour chaque point faible : génération unique d'une recommandation détaillée par LLM (Haiku par défaut)
- Toggle "Version simplifiée" / "Version complète" :
  - Simplifiée : recommandation générique, langage très accessible, exemples concrets
  - Complète : référence explicitement les concepts du cours GEO (chunks, clusters, pyramide inversée, publishers, schema.org, etc.), niveau pédagogique plus poussé
- Plan Free : recommandations floutées (CTA upgrade)
- Plan Pro/Business : accès complet

**Feature Publishers**
- Page dédiée par site `/sites/{siteId}/publishers`
- Liste auto-générée de publishers, subreddits, et bases publiques pertinents pour le secteur du client (basée sur les mots-clés et les concurrents)
- Catégories : Médias FR, Communautés (Reddit, Quora), Bases publiques (Wikipédia, sites institutionnels)
- Pour chaque publisher : 1 exemple d'angle éditorial GEO-friendly à proposer en relations presse
- Plan Free : 3 publishers visibles, le reste flouté
- Plan Pro/Business : liste complète

**Quotas & relance d'analyse**
- Free : 1 analyse complète à vie (compteur en DB)
- Pro : 4 analyses complètes par mois calendaire
- Business : 30 analyses complètes par mois calendaire
- Tous plans payants : relance par onglet (Autorité / Technique / Contenu) = 1 analyse complète facturée si elle inclut les 4 IAs ; sinon facturée à 1/3 d'analyse pour les onglets Technique et Contenu (pas d'appel LLM, juste crawl + règles)
- Affichage du quota restant sur `/settings/usage`

**PWA**
- Manifest configuré
- Service worker via Serwist (cache des assets statiques)
- Installable sur mobile
- Mode offline minimal (page "vous êtes hors ligne")

**Pages légales**
- CGV
- Politique de confidentialité (RGPD)
- Mentions légales
- Politique cookies (avec bannière consent simple)

### 3.2 Exclu de V1 (reporté en v0.2 ou plus tard)

- Coach IA conversationnel (chat par point faible)
- Benchmark concurrents (analyse parallèle des 3 concurrents + comparaison directe sur le dashboard)
- Historique multi-analyses avec graphique d'évolution temporel
- Multi-utilisateurs par compte
- Multi-langues UI (V1 = français uniquement)
- Intégrations externes (GA4, Search Console, Semrush, etc.)
- API publique
- Rôles et permissions

---

## 4. Modèle économique

### 4.1 Plans

| Plan | Prix | Sites | Analyses complètes | Prompts max / site | Recos coach IA | Publishers visibles |
|---|---|---|---|---|---|---|
| **Gratuit** | 0€/mois | 1 | 1 à vie | 5 | floutées | 3 |
| **Pro** | 49€/mois TTC | 3 | 4 / mois | 20 | accessibles | toutes |
| **Business** | 149€/mois TTC | 10 | 30 / mois | 30 | accessibles + toggle "version complète" | toutes |

### 4.2 Coûts variables réels (par analyse complète)

| Composant | Free | Pro | Business |
|---|---|---|---|
| Appels LLM grounded | 0,24€ | 0,96€ | 1,44€ |
| Crawl Firecrawl | 0,06€ | 0,18€ | 0,30€ |
| Recos coach IA | 0,03€ | 0,10€ | 0,15€ |
| **Total** | **0,33€** | **1,24€** | **1,89€** |

### 4.3 Marges brutes mensuelles

- Pro : 49€ − (4 × 1,24€) = **45,04€ → marge 92 %**
- Business : 149€ − (30 × 1,89€) = **92,30€ → marge 62 %**

---

## 5. Architecture technique

### 5.1 Vue d'ensemble

```
┌──────────────────────────────────────────────┐
│                  Vercel                       │
│  ┌────────────────────────────────────────┐  │
│  │  Next.js 15 (App Router)                │  │
│  │  - Pages SSR/SSG                        │  │
│  │  - Server Actions                       │  │
│  │  - Route Handlers (API)                 │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
        │                    │              │
        ▼                    ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Supabase   │  │   Inngest    │  │   Stripe     │
│ (Postgres +  │  │  (Workers)   │  │ (Paiements)  │
│  Auth + RLS) │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  OpenRouter  │  │   Perplexity │  │  Firecrawl   │
│  (multi-LLM) │  │   API direct │  │   (Crawl)    │
└──────────────┘  └──────────────┘  └──────────────┘
                          │
                          ▼
                  ┌──────────────┐
                  │    Resend    │
                  │   (Emails)   │
                  └──────────────┘
```

### 5.2 Flux d'une analyse complète

```
1. User clique "Lancer analyse complète"
2. Server Action vérifie le quota via lib/quotas.ts
3. Si OK : crée un record en table analyses (status=pending), retourne l'ID
4. Émet un event Inngest "analysis.full.requested" avec l'analysisId
5. UI redirige vers la page overview avec polling de l'analyse
6. Inngest fonction run-full-analysis :
   a. Met status=running
   b. step.run("crawl") → appel Firecrawl
   c. step.run("authority") → boucle sur prompts, parallel(4 IAs), parse, store
   d. step.run("technical") → applique règles techniques sur les pages crawlées
   e. step.run("content") → applique règles contenu sur les pages crawlées
   f. step.run("recommendations") → génère reco pour chaque point faible
   g. step.run("scoring") → calcule les 4 notes
   h. step.run("publishers") → détecte publishers pertinents
   i. Met status=success, met date_completed
7. UI polling détecte success → recharge les données + toast notification
```

### 5.3 Gestion des erreurs

- Tout step Inngest avec `step.run()` qui échoue est retried 3 fois automatiquement.
- Après 3 échecs : status=error, message d'erreur loggé en Sentry, UI affiche "Analyse échouée, contactez le support".
- L'utilisateur n'est PAS facturé si l'analyse échoue (le quota n'est décrémenté qu'après success).

---

## 6. Modèle de données (Drizzle)

> Schéma à implémenter dans `lib/db/schema.ts`. Tous les types `text` UUID utilisent `gen_random_uuid()` Postgres. Tous les timestamps utilisent `timestamp with time zone`.

### 6.1 Tables Auth (gérées par Supabase Auth, schéma `auth.*`, à ne pas modifier manuellement)

- `auth.users` : géré par Supabase (id uuid, email, encrypted_password, email_confirmed_at, raw_user_meta_data, etc.)
- `auth.sessions`, `auth.refresh_tokens`, `auth.identities` : gérés par Supabase

**Table miroir applicative** (schéma `public`, créée par migration Drizzle) :
- `public.profiles` : id (uuid, FK → auth.users.id, cascade delete), full_name (text, nullable), created_at, updated_at. Peuplée par un trigger Postgres `on auth.users insert`.

**RLS** : activée sur **toutes** les tables `public.*` ci-dessous. Toute policy se base soit directement sur `auth.uid() = user_id`, soit sur une jointure parente (`exists (select 1 from sites s where s.id = analyses.site_id and s.user_id = auth.uid())`).

### 6.2 Tables métier

```typescript
// subscriptions
{
  id: uuid (PK)
  user_id: uuid (FK → users.id, unique)
  plan: enum('free', 'pro', 'business')
  stripe_customer_id: text (nullable)
  stripe_subscription_id: text (nullable)
  current_period_end: timestamptz (nullable)
  status: enum('active', 'past_due', 'canceled', 'incomplete') (default: 'active')
  free_analysis_used: boolean (default false)
  created_at, updated_at
}

// sites
{
  id: uuid (PK)
  user_id: uuid (FK → users.id, cascade delete)
  name: text
  main_url: text
  domain: text  // ex: "geomind.fr" extrait de main_url
  language: text (default 'fr')
  country: text (default 'FR')
  created_at, updated_at
}

// firecrawl_pages
{
  id: uuid (PK)
  site_id: uuid (FK → sites.id, cascade delete)
  url: text
  status_code: integer (nullable)
  html: text (nullable)  // optionnel, peut être tronqué
  markdown: text
  metadata: jsonb  // { title, description, h1, h2, schema_orgs, hreflang, ... }
  crawled_at: timestamptz
}

// site_metadata (résultats de la découverte)
{
  id: uuid (PK)
  site_id: uuid (FK → sites.id, cascade delete, unique)
  description: text
  keywords: jsonb  // string[]
  sector: text  // détecté automatiquement, ex: "boulangerie", "saas B2B"
  updated_at: timestamptz
}

// competitors
{
  id: uuid (PK)
  site_id: uuid (FK → sites.id, cascade delete)
  domain: text
  name: text
  source: enum('auto', 'user')  // suggéré par l'IA ou ajouté manuellement
  created_at: timestamptz
}

// prompts
{
  id: uuid (PK)
  site_id: uuid (FK → sites.id, cascade delete)
  text: text
  is_neutral: boolean
  reason_if_not_neutral: text (nullable)  // "contient le domaine geomind.fr"
  source: enum('auto', 'user')
  active: boolean (default true)
  created_at: timestamptz
}

// analyses
{
  id: uuid (PK)
  site_id: uuid (FK → sites.id, cascade delete)
  type: enum('full', 'authority', 'technical', 'content')
  status: enum('pending', 'running', 'success', 'error')
  error_message: text (nullable)
  started_at: timestamptz
  finished_at: timestamptz (nullable)
  global_score: real (nullable)
  authority_score: real (nullable)
  technical_score: real (nullable)
  content_score: real (nullable)
  estimated_cost_eur: real (nullable)  // tracking interne des coûts
  prev_global_score: real (nullable)  // pour comparaison avec analyse N-1
}

// authority_results
{
  id: uuid (PK)
  analysis_id: uuid (FK → analyses.id, cascade delete)
  prompt_id: uuid (FK → prompts.id)
  ia_engine: enum('chatgpt', 'claude', 'gemini', 'perplexity')
  cited: boolean
  rank: integer (nullable)  // position dans la liste des sources (1-N)
  total_sources_returned: integer
  raw_response_text: text  // réponse complète de l'IA (pour modal détail)
  created_at: timestamptz
}

// authority_sources
{
  id: uuid (PK)
  authority_result_id: uuid (FK → authority_results.id, cascade delete)
  position: integer
  name: text (nullable)
  url: text
  domain: text
  is_client_site: boolean
  is_competitor: boolean
  competitor_id: uuid (FK → competitors.id, nullable)
}

// technical_issues
{
  id: uuid (PK)
  analysis_id: uuid (FK → analyses.id, cascade delete)
  rule_key: text  // ex: "robots_txt_blocks_ai", "missing_llms_txt", "schema_org_missing"
  category: enum('accessibility', 'structure', 'schema_org', 'performance')
  title: text
  description: text
  sample_urls: jsonb  // string[]
  penalty: integer  // points retirés à la note technique
  created_at: timestamptz
}

// content_issues
{
  id: uuid (PK)
  analysis_id: uuid (FK → analyses.id, cascade delete)
  rule_key: text  // ex: "missing_chunk_structure", "no_faq_format", "cluster_incomplete"
  category: enum('alignment', 'chunks', 'clusters', 'editorial_quality', 'formats')
  title: text
  description: text
  sample_urls: jsonb  // string[]
  penalty: integer
  created_at: timestamptz
}

// recommendations
{
  id: uuid (PK)
  issue_id: uuid  // FK polymorphe vers technical_issues OR content_issues
  issue_type: enum('technical', 'content')
  variant: enum('simplified', 'complete')
  content: text  // markdown
  generated_at: timestamptz
}

// publishers
{
  id: uuid (PK)
  analysis_id: uuid (FK → analyses.id, cascade delete)
  category: enum('media_fr', 'community', 'public_base')
  name: text
  url: text
  pitch_angle: text  // exemple d'angle éditorial à proposer
  relevance_score: real  // 0-100
}

// analysis_stats (snapshot pour comparaison)
{
  id: uuid (PK)
  analysis_id: uuid (FK → analyses.id, cascade delete, unique)
  total_prompts_neutral: integer
  total_ia_responses: integer
  total_citations: integer
  citations_by_engine: jsonb  // { chatgpt: 3, claude: 5, ... }
}
```

### 6.3 Index importants

- `sites(user_id)` pour lister rapidement les sites d'un user
- `analyses(site_id, type, started_at DESC)` pour récupérer la dernière analyse d'un site
- `authority_results(analysis_id, prompt_id, ia_engine)` pour récupérer une cellule du tableau
- `authority_sources(authority_result_id, position)` pour trier les sources d'une réponse
- `prompts(site_id, active, is_neutral)` pour filtrer les prompts à utiliser

---

## 7. Connecteurs LLM

### 7.1 Interface commune

Tous les connecteurs implémentent l'interface `IAEngine` dans `lib/ai/connectors/base.ts` :

```typescript
interface IAEngine {
  key: 'chatgpt' | 'claude' | 'gemini' | 'perplexity'
  displayName: string

  /**
   * Envoie un prompt avec web grounding actif.
   * Retourne la réponse parsée + métadonnées.
   */
  queryWithSources(input: {
    prompt: string
    language: 'fr' | 'en'
    country: string  // 'FR', 'US', etc.
  }): Promise<IAResponse>
}

interface IAResponse {
  engine: string
  rawText: string
  sources: Array<{
    position: number
    name?: string
    url: string
    domain: string
  }>
  modelUsed: string
  inputTokens: number
  outputTokens: number
  searchRequests: number
  estimatedCostUsd: number
}
```

### 7.2 Implémentations

| Connecteur | Stratégie | Modèle par défaut | Cible coût/appel |
|---|---|---|---|
| **chatgpt** | OpenRouter + Parallel search (server tool) | `openai/gpt-4o-mini` | ~0,007€ |
| **claude** | OpenRouter + Anthropic native web_search | `anthropic/claude-haiku-4-5` | ~0,012€ |
| **gemini** | OpenRouter + Google grounding | `google/gemini-2.5-flash` | ~0,003€ |
| **perplexity** | API Perplexity directe (Sonar de base) | `sonar` | ~0,007€ |

### 7.3 Prompt système commun (à versionner)

Localisation : `lib/ai/prompts/search-query.ts`.

```
Tu es un assistant qui aide les utilisateurs à trouver des sites web pertinents pour répondre à leur question.

Question de l'utilisateur : {prompt}

Instructions :
1. Effectue une recherche web pour identifier les sites les plus pertinents.
2. Présente entre 10 et 15 sites web qui répondent vraiment à la question.
3. Pour chaque site, donne le nom de la marque/site et son URL complète.
4. Trie les sites par pertinence décroissante.
5. Format de réponse strict :

1. Nom du site — URL
2. Nom du site — URL
...

Ne mets aucun texte avant ou après cette liste. Pas d'introduction, pas de conclusion.
Langue de la recherche : {language}, pays cible : {country}.
```

### 7.4 Parsing des réponses

Localisation : `lib/ai/parse.ts`.

Pour chaque IA, après réception de la réponse :
1. Récupérer les sources nativement fournies par l'API (Perplexity et Gemini les donnent en JSON).
2. Pour Claude et ChatGPT : parser le texte de réponse avec une regex sur le pattern `\d+\.\s+(.+?)\s+[—–-]\s+(https?://\S+)`.
3. Pour chaque source : extraire `domain` via `new URL(url).hostname.replace('www.', '')`.
4. Comparer avec le domaine du client → `is_client_site`.
5. Comparer avec les domaines des concurrents → `is_competitor` + `competitor_id`.
6. Si <10 sources : flagger `partial_response=true` mais utiliser quand même les données.

---

## 8. Algorithmes de scoring

### 8.1 Note GEO globale (Vue d'ensemble)

```
Soit N = nombre total de prompts neutres × nombre d'IAs interrogées
Soit C = nombre de (prompt × IA) où le domaine client est cité

note_globale = (C / N) × 100
```

Affichée sur la vue d'ensemble avec une jauge (0-100), code couleur :
- 0-29 : rouge
- 30-59 : orange
- 60-100 : vert

### 8.2 Note Autorité (Onglet Autorité)

Pondération par position dans la liste de sources :

```
Soit P = ensemble des (prompt × IA × position) où le domaine client apparaît
Soit score_brut = Σ (3 si position ∈ [1,3] sinon 2 si position ∈ [4,10] sinon 1)
Soit score_max = N × 3   (cas où le client est en top 3 partout)

note_autorité = (score_brut / score_max) × 100
```

### 8.3 Note Technique

Système de pénalités. Note de départ = 100, retrait de points pour chaque règle violée.

```
note_technique = max(0, 100 - Σ penalty)
```

Règles et pénalités (détaillées en section 9) :

| Règle | Pénalité |
|---|---|
| robots.txt bloque tous les bots | 30 |
| robots.txt bloque GPTBot / Claude-Web / Google-Extended | 15 |
| sitemap.xml absent | 10 |
| sitemap.xml malformé (erreurs XML) | 5 |
| LLMS.txt absent | 10 |
| Erreurs 404 / 5xx (>5% des pages) | 15 |
| Schema.org Organization / LocalBusiness absent sur l'accueil | 8 |
| Schema.org FAQPage absent sur pages FAQ détectées | 5 |
| H1 absent ou multiples sur certaines pages | 5 |
| H2/H3 absents (structure plate) | 5 |
| Contenu principal nécessite JS pour s'afficher | 12 |
| Profondeur > 3 clics depuis la home pour des pages clés | 5 |
| Temps de réponse moyen > 3 secondes | 5 |
| HTTPS absent | 15 |

### 8.4 Note Contenu

Mêmes principes, sur les règles de contenu :

| Règle | Pénalité |
|---|---|
| Aucune page ne répond à une intention de prompt | 10 |
| Paragraphes > 5 lignes sans découpage (chunks) | 5 |
| Absence totale de format FAQ / Q&R | 5 |
| Absence de listes / tableaux sur les pages clés | 4 |
| Ton trop vague (peu de chiffres concrets, peu de données) | 6 |
| Pas de cluster sémantique identifiable (page pilier + pages filles) | 8 |
| Maillage interne pauvre (<3 liens internes par page) | 4 |
| Pas de dates de mise à jour visibles | 3 |
| Pas de signature d'auteur ou d'organisation | 3 |
| Manque de couverture lexicale sur la thématique principale | 6 |

---

## 9. Règles GEO Technique (détail des règles)

Localisation : `lib/analysis/technical/rules/`. Chaque règle est un fichier qui exporte une fonction `(pages: FirecrawlPage[]) => TechnicalIssue | null`.

### 9.1 Accessibilité

- **`robots_txt_block_all.ts`** : récupère `https://{domain}/robots.txt`, parse, vérifie s'il y a `User-agent: * \n Disallow: /`. Pénalité 30.
- **`robots_txt_block_ai_bots.ts`** : vérifie les User-agents `GPTBot`, `ClaudeBot`, `Google-Extended`, `PerplexityBot`, `CCBot`. Si bloqués : pénalité 15.
- **`sitemap_missing.ts`** : tente `https://{domain}/sitemap.xml`. Si 404 ou non-XML : pénalité 10.
- **`sitemap_malformed.ts`** : si sitemap existe, parse XML. Si erreur : pénalité 5.
- **`llms_txt_missing.ts`** : tente `https://{domain}/llms.txt`. Si absent : pénalité 10 + reco de génération.
- **`http_errors_ratio.ts`** : compte les pages avec status >= 400 dans les pages crawlées. Si >5% : pénalité 15.
- **`https_missing.ts`** : si l'URL principale est en HTTP : pénalité 15.

### 9.2 Structure

- **`h1_missing_or_duplicate.ts`** : pour chaque page crawlée, vérifier qu'il y a exactement 1 H1. Sinon : compter les pages problématiques. Si >20% : pénalité 5.
- **`hierarchy_missing.ts`** : sur les pages contenu (pas la home), vérifier la présence de H2/H3. Si >50% des pages contenu n'ont pas de H2 : pénalité 5.
- **`js_required_for_content.ts`** : Firecrawl peut rendre avec et sans JS. Comparer le markdown rendu avec et sans : si différence >50%, le contenu dépend trop de JS. Pénalité 12.
- **`depth_too_deep.ts`** : calculer la profondeur de navigation de chaque page (nb de clics depuis la home). Si plus de 30% des pages sont à >3 clics : pénalité 5.

### 9.3 Données structurées (Schema.org)

- **`schema_org_organization.ts`** : sur la home, chercher un JSON-LD avec `@type: Organization` ou `LocalBusiness`. Si absent : pénalité 8.
- **`schema_org_faq.ts`** : détecter les pages avec patterns de FAQ (titres en question, structure Q/R). Pour ces pages, vérifier la présence d'un schema `FAQPage`. Si absent : pénalité 5.
- **`schema_org_article.ts`** : sur les pages détectées comme articles (blog, actu), vérifier `Article` ou `BlogPosting`. Si absent : pénalité 4.
- **`schema_org_product.ts`** : si le site est e-commerce (détection auto par mots-clés et URLs `/produit/`, `/product/`, `/shop/`), vérifier les schémas `Product` sur les pages produit. Si absent : pénalité 6.

### 9.4 Performance

- **`response_time_slow.ts`** : moyenne des temps de réponse des pages crawlées. Si >3s : pénalité 5.
- **`page_size_heavy.ts`** : taille moyenne des pages HTML. Si >2MB : pénalité 3.

---

## 10. Règles GEO Contenu (détail des règles)

Localisation : `lib/analysis/content/rules/`.

### 10.1 Alignement intentions

- **`intent_coverage.ts`** : pour chaque prompt neutre, vérifier si une page du site répond à l'intention via embeddings (utiliser `text-embedding-3-small` ou équivalent éco). Score de cosinus entre l'embedding du prompt et chaque page. Si aucune page n'a un score >0.6 pour un prompt : pénalité 10 par prompt non couvert (cap à 30).

### 10.2 Structure en chunks

- **`chunk_size_too_long.ts`** : pour chaque page contenu, compter les paragraphes >5 lignes. Si >30% des paragraphes sont trop longs : pénalité 5.
- **`no_lists_or_tables.ts`** : compter les pages contenu sans aucune `<ul>`, `<ol>`, ou `<table>`. Si >50% : pénalité 4.
- **`no_faq_format.ts`** : compter les pages structurées en Q/R. Si 0 sur tout le site : pénalité 5.

### 10.3 Clusters sémantiques

- **`no_pillar_pages.ts`** : identifier les pages pilier (haut maillage entrant + sortant). Si aucune page pilier détectée : pénalité 8.
- **`internal_linking_sparse.ts`** : moyenne de liens internes par page. Si <3 : pénalité 4.

### 10.4 Qualité éditoriale

- **`vague_tone.ts`** : analyser par LLM (Haiku) un échantillon de 5-10 pages. Si la majorité ressort comme "vague, peu de chiffres, peu de données concrètes" : pénalité 6.
- **`no_date_metadata.ts`** : compter les pages avec un `<time>`, une date visible en bas, ou un schema `dateModified`. Si <30% : pénalité 3.
- **`no_author_signal.ts`** : compter les pages avec un auteur identifiable (schema `Person`, bloc auteur). Si <20% : pénalité 3.

### 10.5 Couverture lexicale

- **`thematic_coverage.ts`** : à partir des mots-clés générés en découverte, vérifier la présence sur le site (au moins 2 occurrences sur 2 pages différentes par mot-clé). Si <50% des mots-clés sont couverts : pénalité 6.

---

## 11. Coach IA — fiches de recommandation

### 11.1 Génération

Pour chaque `technical_issue` ou `content_issue` créé(e), Inngest génère immédiatement la fiche `recommendations` correspondante (variant `simplified` par défaut).

Localisation prompt : `lib/ai/prompts/recommendations.ts`.

```
Tu es un coach IA qui aide une TPE/PME française à améliorer la visibilité de son site dans les moteurs IA (ChatGPT, Perplexity, Gemini, Claude).

Voici le point faible détecté :
- Type : {category}
- Titre : {title}
- Description : {description}
- Pages concernées : {sample_urls}

Génère un plan d'action en français, dans le ton {tone}, qui :
1. Explique en 2-3 phrases pourquoi ce point est important (impact GEO).
2. Donne une démarche pas-à-pas pour le corriger, compréhensible par quelqu'un qui n'est PAS expert SEO/dev.
3. Si pertinent, fournit un exemple de code (HTML, JSON-LD) ou de contenu (paragraphe, structure de page) prêt à copier-coller.
4. Termine par 1 phrase pour valider que c'est fait (test à faire).

Tone {tone} = "simplified" : langage très accessible, métaphores simples, pas de jargon SEO.
Tone {tone} = "complete" : explique aussi les concepts GEO sous-jacents (chunks, clusters sémantiques, schema.org, publishers, pyramide inversée), avec références théoriques.

Format : Markdown. 300-600 mots. Pas d'introduction du genre "Voici votre plan", entre directement dans le contenu.
```

### 11.2 Affichage

- Click sur un point faible → ouvre un sheet/drawer latéral (shadcn `Sheet`)
- Header du sheet : titre du point faible + badge catégorie
- Body : rendu Markdown de la recommandation
- Toggle en haut : "Version simplifiée" / "Version complète" (Business plan uniquement, sinon greyed avec "Plan Business")
- Si l'utilisateur active "complète" et qu'elle n'existe pas encore en DB : Server Action qui appelle Claude Sonnet pour la générer, store en DB, affiche.

### 11.3 Mode floué (Free)

Pour le plan Free : la fiche est tronquée à 50 mots avec un overlay "Débloquez le plan d'action complet — passez Pro". CTA vers `/settings/billing`.

---

## 12. Feature Publishers

### 12.1 Génération

À la fin de l'analyse complète, un step Inngest `step.run("publishers")` génère la liste :

1. Détecter le secteur du site (depuis `site_metadata.sector`).
2. Appeler un LLM (Haiku) avec le prompt :

```
Je gère un SaaS qui aide les TPE/PME à améliorer leur visibilité dans les IAs.

Mon client opère dans le secteur : {sector}.
Mots-clés principaux : {keywords}.
Concurrents identifiés : {competitors}.

Génère une liste de 15 publishers/plateformes en France où il aurait intérêt à apparaître pour gagner en visibilité IA :
- 5 médias français pertinents pour son secteur
- 5 communautés (Reddit, Quora, forums spécialisés)
- 5 bases publiques ou sites institutionnels

Pour chaque entrée :
- Nom
- URL
- 1 angle éditorial concret à proposer (article sponsorisé, contribution communautaire, etc.) en français, 2 phrases max.

Format JSON strict : [{name, url, category, pitch_angle}].
```

3. Parser la réponse via Zod, stocker en `publishers`.

### 12.2 Affichage

Page `/sites/{siteId}/publishers` :
- 3 sections en accordéons : Médias FR, Communautés, Bases publiques
- Pour chaque entrée : carte avec nom + URL (lien externe) + pitch_angle
- Plan Free : 3 entrées visibles (1 par catégorie), reste flouté
- Plan Pro/Business : tout visible

---

## 13. UI / UX par écran

### 13.1 Landing (`/`)

- Hero : H1 "Soyez cité par ChatGPT. Pas par hasard.", baseline, CTA "Lancer GEOMIND"
- Problème : "48% des Français utilisent l'IA pour faire leurs recherches. Si vous n'y êtes pas, vous n'existez pas." (chiffre du cours GEO)
- Solution : 3 colonnes "Sache / Comprends / Améliore"
- Comment ça marche : 3 étapes avec illustrations
- Plans : 3 cartes (Free / Pro / Business)
- FAQ : 6-8 questions
- Footer : liens légaux + contact

### 13.2 Signup / Login (`/signup`, `/login`)

- Formulaire centré, simple
- Champs : email + mot de passe
- Validation Zod côté client + côté serveur
- Liens : "Mot de passe oublié ?" / "Déjà un compte ? Se connecter"

### 13.3 Email de vérification

- Page intermédiaire : "Vérifiez votre email pour activer votre compte."
- Email envoyé via Resend avec template React Email simple, brand GEOMIND
- Click sur lien → confirme l'email → redirect vers `/onboarding`

### 13.4 Onboarding (`/onboarding`)

Wizard 4 étapes avec barre de progression visible en haut. Pas de retour arrière sur l'étape 1 (juste un "skip" sur l'étape 1 si l'utilisateur veut aller direct au dashboard, déconseillé).

**Étape 1 — Bienvenue**
- Animation/illustration
- Texte : "Bienvenue dans GEOMIND. En 2 minutes, on va analyser votre site pour voir si vous apparaissez dans les réponses de ChatGPT, Perplexity, Gemini et Claude. C'est parti ?"
- CTA "Continuer"

**Étape 2 — Ajouter votre site**
- Champ "Nom de votre site" (placeholder : "Ma Boulangerie Lyon")
- Champ "URL principale" (placeholder : "https://maboulangerie-lyon.fr")
- Sélecteur langue (FR par défaut)
- Sélecteur pays (FR par défaut)
- CTA "Lancer l'analyse de découverte"

**Étape 3 — Validation des suggestions**
- Pendant le crawl + découverte (60-90s) : loading avec messages rotatifs ("On scanne votre site...", "On comprend votre activité...", "On génère des questions clients réalistes...")
- Quand prêt : affiche la description (éditable inline), les 15 mots-clés (chips supprimables + input pour ajouter), les 3 concurrents (cards avec bouton supprimer + bouton "Ajouter un concurrent"), les prompts neutres (liste avec checkbox actif/inactif + édition + bouton ajouter).
- Validation automatique des prompts : si un prompt contient le domaine ou la marque, badge rouge "Non neutre" avec tooltip explicatif. Le prompt reste affiché mais exclu du calcul.
- Banner haut : "💡 Plus vos prompts ressemblent aux vraies questions de vos clients (sans mentionner votre marque), plus votre note GEO sera juste."
- CTA "Valider et lancer l'analyse complète"

**Étape 4 — Confirmation**
- Animation de lancement
- Texte : "On lance l'analyse complète. Vous serez notifié dès qu'elle est prête (environ 1-2 minutes). En attendant, vous pouvez explorer le dashboard."
- Redirect auto vers `/sites/{siteId}/overview` après 3s

### 13.5 Dashboard (`/dashboard`)

- Header : "Vos sites"
- Si 0 site : empty state avec gros CTA "Ajouter votre premier site"
- Si N sites : grille de cards (nom, domaine, date dernière analyse, note globale en gros, badge plan)
- CTA secondaire (si quota le permet) : "Ajouter un site"
- Limite atteinte → toast "Vous avez atteint la limite de votre plan, passez Pro/Business"

### 13.6 Page projet — Vue d'ensemble (`/sites/{id}/overview`)

- Header : nom du site + URL (lien externe) + bouton "Relancer analyse complète"
- Hero KPI : grande jauge centrale de la note GEO globale (0-100), avec delta vs analyse précédente (+5 / -3 en sous-titre)
- 3 cartes : Note Autorité, Note Technique, Note Contenu (avec icône, score, lien "Voir détails")
- Section : "Date de dernière analyse : 12 juin 2026, 14h32. Prochaine analyse possible : maintenant" (ou "Dans X heures" si quota épuisé)

### 13.7 Page projet — Onglet Autorité (`/sites/{id}/authority`)

- Note Autorité en gros
- Bar chart : citations par IA (Recharts, 4 colonnes)
- Tableau croisé prompts × IAs (sticky header) :
  - Lignes : prompts neutres actifs (texte tronqué + tooltip pour version longue)
  - Colonnes : ChatGPT, Claude, Gemini, Perplexity
  - Cellules : icône ✅ si cité (avec petit "#3" pour le rang) sinon ❌ ; couleurs selon position (vert top 3, jaune top 10, gris ailleurs)
  - Click sur cellule → modal avec : prompt en haut, réponse IA en bas (markdown), domaines surlignés (client en vert, concurrents en orange)
- Section "Publishers cités par les IAs" : top 10 domaines sur lesquels les IAs s'appuient le plus pour répondre aux prompts (insight stratégique)
- Bouton "Relancer analyse Autorité" en bas

### 13.8 Page projet — Onglet Technique (`/sites/{id}/technical`)

- Note Technique en gros
- 4 accordéons : Accessibilité, Structure, Schema.org, Performance
- Dans chaque accordéon : liste de cards par point faible
  - Titre + description courte (2 lignes)
  - Badge sévérité (calculé à partir de la pénalité : minor < 5, moderate 5-10, major > 10)
  - "N URLs concernées" (cliquable pour voir les URLs)
  - Click sur la card → Sheet latéral avec la fiche coach IA
- Bouton "Relancer analyse Technique" en bas

### 13.9 Page projet — Onglet Contenu (`/sites/{id}/content`)

Même structure que Technique.

### 13.10 Page projet — Publishers (`/sites/{id}/publishers`)

- 3 sections : Médias FR / Communautés / Bases publiques
- Cards par publisher : nom + URL (lien externe) + pitch_angle
- Plan Free : 3 cards visibles, reste avec overlay flou + CTA upgrade

### 13.11 Settings — Billing (`/settings/billing`)

- Plan actuel : Free / Pro / Business
- Si Free : cartes Pro et Business avec bouton "Passer Pro" / "Passer Business" → Stripe Checkout
- Si Pro/Business : "Vous êtes abonné(e) au plan X. Prochaine facturation : Y. Montant : Z€." + bouton "Gérer mon abonnement" → Stripe Customer Portal

### 13.12 Settings — Usage (`/settings/usage`)

- Pour Pro/Business : barre de progression "Analyses ce mois-ci : 3 / 4 (Pro)"
- Pour Free : "Vous avez utilisé votre analyse gratuite. Passez Pro pour des analyses récurrentes."

---

## 14. Sécurité, RGPD, observabilité

### 14.1 Sécurité

- HTTPS obligatoire (Vercel s'en occupe)
- Mots de passe hashés par Supabase Auth (bcrypt avec rounds adaptés)
- Sessions JWT signées par Supabase, stockées en cookies httponly + secure + sameSite (`@supabase/ssr`)
- **RLS Postgres activée** sur toutes les tables `public.*` — defense-in-depth ; aucune fuite cross-tenant possible même en cas de bug applicatif
- Service role key (`SUPABASE_SERVICE_ROLE_KEY`) **JAMAIS** exposée côté client, utilisée uniquement par Inngest et scripts admin
- Validation Zod sur 100% des entrées utilisateur (forms, query params, API bodies)
- Rate limiting sur signup, login, reset password (via Inngest ou Upstash Rate Limit)
- Headers de sécurité : CSP strict, X-Frame-Options DENY, X-Content-Type-Options nosniff

### 14.2 RGPD

- Bannière de consentement cookies (consent simple : essentiels / analytics) au premier chargement
- PostHog désactivé tant que pas de consent
- Page Politique de confidentialité claire
- Suppression de compte avec cascade vers tous les sites, analyses, recommandations (delete `auth.users` → trigger cascade FK)
- Pas de transfert de données hors UE (Supabase région Frankfurt ou Paris, Vercel région EU)

### 14.3 Observabilité

- Sentry : exceptions back + front, traces sur les Inngest functions
- PostHog : events produit (signup, first_analysis, plan_upgrade, etc.) + session replays
- Inngest dashboard : monitoring des jobs en cours/échoués
- Stripe dashboard : monitoring des paiements

---

## 15. Definitions of Done (DoD)

Avant qu'un ticket soit considéré comme "fait" :

- ✅ `pnpm typecheck` : 0 erreur
- ✅ `pnpm lint` : 0 warning
- ✅ `pnpm test` : tous les tests passent
- ✅ Le code respecte les conventions de `CLAUDE.md`
- ✅ Les critères d'acceptation du ticket sont satisfaits (testés manuellement si UI)
- ✅ La couverture de test inclut au moins 1 test unitaire sur la logique métier ajoutée
- ✅ Les variables d'environnement nouvelles sont documentées dans `.env.example`
- ✅ Si schéma DB modifié : migration générée et appliquée

---

**Fin du cahier des charges V1.**
