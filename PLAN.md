# PLAN DE REFONTE GEOMIND — Phase 2 (à valider)

> Consolidation de [AUDIT.md](AUDIT.md) + [AUDIT-STRATEGIE.md](AUDIT-STRATEGIE.md).
> **Statut** : soumis à validation. Rien n'est implémenté tant que ce plan n'est pas approuvé (en bloc ou item par item).
> En Phase 3 : un item = une implémentation = un commit = un résumé avant de passer au suivant.

## Arbitrages tranchés (délégués par Andrea, modifiables)

| # | Question | Décision |
|---|----------|----------|
| 1 | Plan gratuit | **1 audit complet à vie** + surveillance mensuelle dégradée (score mis à jour, détails floutés). Code et copy alignés là-dessus |
| 2 | Grille tarifaire | Incohérences corrigées **maintenant** sur la grille V2 actuelle ; refonte complète (Découverte/Essentiel/Croissance/Agence) **après** la vague Récurrence |
| 3 | Fiabilité du score | **Oui** : 10-15 prompts, double mesure spontanée+forcée, moyenne glissante. Coût autorité ×3 assumé |
| 4 | Moteur prioritaire | **Google AI Overviews** avant Mistral |
| 5 | Pixel GeoMind | **Inscrit comme cap produit** (vague 3) ; le modèle de données série-temporelle (vague 1) le prépare |
| 6 | Done-for-you / Agence / Baromètre | Vague 4 (après product-market fit des vagues 1-3) |
| 7 | PWA Serwist | Conservée mais gelée (décision finale sur données PostHog) ; page `/design` retirée du public |
| 8 | ⚠️ **Preuve sociale ("2 400+ sites", "4,8/5 Trustpilot")** | **SEULE QUESTION OUVERTE** : si ces chiffres ne sont pas réels → retrait immédiat (item 2). **Réponse d'Andrea requise** |

---

## VAGUE 0 — ASSAINIR (P0 : vendable, sûr, cohérent)

- [x] **1. Cohérence pricing partout** — landing alignée sur les 4 plans V2 (19/59/149 €, crédits traduits en "≈ X analyses"), CGV mises à jour, HT affiché. `app/(marketing)/page.tsx`, `legal/cgv/page.tsx` — **S**
- [x] **2. Preuve sociale véridique** — si chiffres non réels : retrait des "2 400+ sites / 4,8 Trustpilot" (risque légal). Sinon, sourcer. — **S**
- [x] **3. Plan gratuit = 1 audit à vie** — adapter `lib/plans.ts`/crédits free (plus de reset mensuel à 500), copy landing/pricing alignée, surveillance dégradée préparée pour vague 1. — **M**
- [x] **4. RLS sur les 13 tables manquantes** — migration SQL policies `auth.uid()`. — **M**
- [x] **5. Isolation anti-injection des contenus crawlés** — balises `<donnees_site>` dans les prompts discovery/recommendations. — **S**
- [x] **6. Idempotence webhooks Stripe** — sur tous les événements subscription (table `processed_webhooks`). — **M**
- [x] **7. SEO/GEO de geomind.fr** — `app/robots.ts`, `app/sitemap.ts`, JSON-LD FAQPage + Organization, Open Graph + Twitter Card + metadataBase, metas sur /pricing, retrait de `/design` du public. — **M**
- [x] **8. Erreurs visibles dans l'onboarding** — timeout 45 s crawl / 5 min analyse, fin des `catch` silencieux, bannière erreur + bouton réessayer. — **M**
- [x] **9. Honnêteté méthodologique** — disclaimer mesure ("tests via API, tendance > score du jour") + transparence échantillonnage ("X pages analysées sur Y détectées"). — **S**

## VAGUE 1 — FIABILITÉ & RÉCURRENCE (le churn-killer)

- [x] **10. Refonte de la mesure d'autorité** — 10-15 prompts neutres, double mesure (réponse spontanée pondérée fort + classement forcé en signal secondaire), répétition des appels, score affiché en moyenne/fourchette. — **L**
- [x] **11. Modèle de données série temporelle** — table `citation_checks` (prompt × moteur × date × résultat) ; les analyses deviennent des agrégations. Fondation du suivi, des alertes, du Pixel. — **M**
- [x] **12. Surveillance automatique récurrente** — réanalyse planifiée (Inngest cron) selon le plan : mensuelle (free, score seul) / hebdo (payants). — **M**
- [x] **13. Alertes email** — "vous venez d'être cité", "score en baisse", "analyse terminée" (Resend, préférences par user). — **M**
- [x] **14. Onglet Suivi** — courbes des 4 scores + citations par moteur dans le temps, timeline annotée des actions. — **M**
- [x] **15. Rapport mensuel automatique par email** — synthèse simple : score, tendance, 3 actions du mois. — **M**
- [x] **16. Onglet Plan d'action** — kanban À faire/Fait/Vérifié, tri par ROI, bouton "J'ai corrigé" → revérification auto de la règle (re-crawl ciblé) → "✅ +3 pts", progression gamifiée, état connu du coach. — **L**
- [x] **17. Durcissement technique** — validation Zod des réponses moteurs, réservation des crédits avant déclenchement Inngest, messages d'erreur d'analyse contextualisés. — **M**
- [x] **18. Vulgarisation UI** — tooltips sur tous les titres d'issues (canonical, Schema.org…), légende du tableau citations, coût en crédits affiché sur chaque action, bandeau Discovery simplifié, onglet "GEO" renommé "Coach". — **M**
- [x] **19. Responsive mobile** — sidebar repliable (hamburger), passe complète iPhone SE/iPad. — **M**

## VAGUE 2 — ACQUISITION & CONVERSION

- [x] **20. Audit express public sans inscription** — URL sur la landing → mini-score en 60 s (cache par domaine, limite IP) → email pour le rapport complet. L'arme d'acquisition n°1. — **L**
- [x] **21. Landing enrichie** — 3 cas d'usage persona (artisan/PME/freelance), comparatif "GEO vs SEO/Ahrefs" en FAQ, équivalence crédits→analyses sur les cards, "pour qui" sur chaque plan. — **M**
- [x] **22. Contenu & E-E-A-T** — page À propos, llms.txt, blog avec 3-5 guides GEO ("être cité par ChatGPT en 5 étapes", "GEO vs SEO"…), dates de publication. — **L**
- [x] **23. Générateur llms.txt public gratuit** — page outil SEO-bait avec CTA vers l'audit. — **S**
- [x] **24. Export PDF** — standard (Pro) + white-label (Business) — déjà vendu dans le pricing, donc dette commerciale. — **L**
- [x] **25. Friction d'achat réduite** — essai Pro 7 jours, packs crédits livrés ou retirés ("Bientôt disponible" interdit), OAuth Google au signup. — **M**

## VAGUE 3 — DIFFÉRENCIATION (personne n'a ça à ce prix)

- [x] **26. Studio de correctifs** — génération un-clic : llms.txt, robots.txt, JSON-LD (Organization/LocalBusiness/FAQ/Article), metas réécrites, FAQ générée du contenu, page À propos pré-rédigée ; instructions par CMS détecté ; mode "envoyer à mon webmaster". — **L**
- [x] **27. Onglet Concurrents** — audit allégé des concurrents détectés, share of voice par prompt, "pourquoi lui est cité" → recommandations en miroir. — **L**
- [ ] **28. Google AI Overviews** — 5e moteur suivi (le plus vu par les clients FR). — **M**
- [x] **29. Pixel GeoMind v1 ("La Preuve")** — snippet + plugin WP : trafic referrers IA, actions (tel/formulaire), crawlers IA → "ce mois-ci les IA vous ont amené N visiteurs et X demandes". — **L**
- [ ] **30. Corrélations propriétaires** — mesurer règle par règle la corrélation corrections ↔ citations sur la base clients ; afficher comme preuve ("les sites avec FAQ sont cités 2,3× plus — données GeoMind"). — **M** (une fois la base suffisante)

## VAGUE 4 — EXPANSION (post-PMF, à re-prioriser ensemble)

- [x] **31. Onglet Réputation** — fact-check de ce que les IA disent (hallucinations sur horaires/adresse/prix), sentiment des mentions. — **L**
- [x] **32. Onglet Local** — prompts géolocalisés auto, checklist présence locale (Google Business, annuaires). — **M**
- [~] **33. Score Agent-Ready** — ~~un agent IA peut-il vous trouver, comprendre vos horaires, vous contacter, réserver ? Score + correctifs.~~ **Construit puis retiré le 2026-06-13** (trop en avance pour la cible TPE — voir AUDIT-STRATEGIE.md). — **L**
- [x] **34. Tarifs** — approche prudente validée : prix inchangés (0/19/59/149), pages tarifaires + landing rebranchées sur la valeur réelle (Studio, Pixel, Concurrents, Réputation, Local, surveillance). Hausse à 29/79/199 reportée post-traction (PROPOSITION-TARIFAIRE.md) — Découverte 0 / Essentiel 29 / Croissance 79 / Agence 199, axée fréquence+concurrents+automatisation (cf. AUDIT-STRATEGIE A6). — **M**
- [ ] **35. Plan Agence & partenaires** — multi-clients, white-label complet, programme prescripteurs webmasters. — **L**
- [ ] **36. Baromètre GEO France** — page publique de données agrégées par secteur (PR + moat). — **L**
- [ ] **37. Mistral Le Chat** — 6e moteur, argument 100 % français. — **M**
- [x] **38. Divers dette** (audit_logs fait ; refund prorata / split schema / circuit breaker écartés à dessein, voir commit) — refund prorata des analyses, split `schema.ts`, table `audit_logs`, circuit breaker OpenRouter. — **M**

---

## À FAIRE AVANT L'OUVERTURE DES PLANS PAYANTS

- [ ] **39. Perte d'historique d'autorité à l'édition des questions** — `authority_results.prompt_id`
  est déclaré `onDelete: cascade`. Supprimer une question de test efface donc **toutes les réponses
  qu'elle avait produites, dans toutes les analyses passées**. Deux conséquences : l'historique
  d'autorité est amputé sans que personne ne le sache, et la détection « les questions ont changé »
  (`lib/analysis/prompt-changes.ts`) ne peut pas voir une suppression, puisque la preuve disparaît
  avec le changement. Aujourd'hui l'impact est limité — seul le plan gratuit est ouvert, donc peu
  d'historique en jeu. **À traiter avant d'ouvrir les plans payants**, où l'historique devient une
  promesse vendue (90 jours sur Solo, 1 an sur Pro, illimité sur Business).

  Comparer deux solutions, retenir **la plus simple qui ne perde jamais d'historique** :

  1. **Figer le jeu de questions sur l'analyse.** Colonne dédiée sur `analyses` (jeu de questions
     ou empreinte), écrite au lancement. Avantage : la comparaison devient exacte, suppressions
     comprises. Coût : une migration, et un champ à maintenir à chaque évolution du format.
  2. **Archiver les questions au lieu de les supprimer.** `deletedAt` sur `prompts`, aucune
     suppression physique, cascade retirée. Avantage : rien ne se perd jamais, et les réponses
     passées restent rattachées à leur question. Coût : une migration aussi, plus tous les points
     de lecture à filtrer sur `deletedAt IS NULL`.

  La seconde paraît la plus proche de l'exigence « ne jamais perdre d'historique », mais elle touche
  plus de code. À trancher au moment de s'y mettre, pas avant. — **M**

- [ ] **40. Surveillance hebdomadaire réelle, coût chiffré par site** *(étape P8, demandé le
  2026-10-03)* — Les cartes Solo, Pro et Business annoncent « Surveillance hebdomadaire + alertes
  email ». **Elle n'a jamais tourné en production** : 0 mesure de surveillance en base depuis le
  début, crons non enregistrés chez Inngest de juin à septembre, puis `MONITORING_PAUSED` posé
  dans Vercel depuis le 19/09. À l'ouverture des plans payants, elle doit réellement tourner :

  1. retirer `MONITORING_PAUSED` en production, puis `pnpm inngest:sync` ;
  2. vérifier qu'un passage hebdomadaire écrit bien ses `citation_checks` (lignes sans
     `analysis_id`), et qu'une alerte email part sur un vrai changement ;
  3. **chiffrer le coût OpenRouter par site**, mesuré sur un passage réel et rapproché de la
     facture OpenRouter.

  Ordre de grandeur provisoire, à confirmer : un passage payant pose 3 questions
  (`PAID_PROMPT_SAMPLE`) aux 4 moteurs, soit 12 appels. Sur les 269 appels d'analyse en base au
  03/10, le coût moyen par question sur les 4 moteurs est de 0,059 $ — dont **0,040 $ pour Claude
  seul**, soit 68 %. D'où ≈ 0,18 $ par passage, ≈ 0,76 $ par site et par mois en hebdomadaire.
  Estimation tirée des analyses (mode forcé, réponses longues) : le mode réel de la surveillance
  doit être mesuré, pas supposé.

  Le test `tests/unit/marketing-promises.test.ts` interdit aujourd'hui toute promesse de
  surveillance active sur les pages publiques : il cassera volontairement au lancement, pour que
  les textes soient réécrits en connaissance de cause. — **M**

- [ ] **41. Résiliation de l'abonnement en ligne** *(étape P8, reporté le 2026-09-23)* — La page
  `/settings/billing` n'affiche ni portail Stripe, ni factures, ni bouton d'annulation pour un
  abonnement sans `stripe_customer_id`. `createPortalSession` existe bien dans le code : il reste à
  vérifier le parcours avec un vrai client Stripe. La FAQ Tarifs promet « annuler à tout moment »,
  et la résiliation en ligne doit être aussi simple que la souscription. — **S**

- [ ] **42. Schéma `profiles` : colonne `avatar_url` fantôme** *(noté le 2026-10-06, pendant S2.3)* —
  `lib/db/schema.ts` déclare `avatarUrl: text('avatar_url')`, absente de la base de production.
  Tout `select()` complet ou `.returning()` sans argument sur `profiles` échoue (« Failed
  query »). Le code actuel sélectionne toujours ses colonnes et n'est pas touché ;
  `scripts/chantiers/seed-oravis-hse.ts` a dû le contourner. Retirer la colonne du schéma, ou
  l'ajouter en base par une migration idempotente, et figer la liste des colonnes par un test.
  — **S**

- [ ] **43. Test `db-client-pool` sensible à la charge** *(noté le 2026-10-06, pendant S2.3)* —
  `tests/unit/db-client-pool.test.ts` met ~1,4 s seul ; il a échoué une fois dans la suite
  complète lancée pendant un `next build`, et passe sinon. À rendre indépendant du temps machine
  (délai explicite plus large, ou suppression de ce qui est lent). — **S**

- [ ] **44. Retirer TRUNCATE aux rôles publics sur les autres tables** *(noté le 2026-10-07, audit de
  sécurité de l'espace chantier)* — Supabase accorde par défaut tous les privilèges aux rôles `anon`
  et `authenticated`, `TRUNCATE` compris, sur les tables publiques (`sites`, `analyses`,
  `profiles`, `credit_*`, etc.). RLS filtre les lignes mais **`TRUNCATE` l'ignore**. Aucune route ne
  l'expose aujourd'hui (ni PostgREST, ni GraphQL, ni fonction SQL dynamique), c'est une défense en
  profondeur. Faire comme la migration 0024 pour `subscriptions` et 0026 pour les tables chantier :
  retirer `TRUNCATE` (et les écritures inutiles) à `anon` / `authenticated`, en vérifiant que le
  client ne lit ni n'écrit ces tables par le SDK Supabase ; preuve par simulation SQL en transaction
  annulée. — **S**

- [ ] **45. Test Playwright de bout en bout de l'espace chantier** *(noté le 2026-10-07, à faire
  avant le prochain client)* — Le parcours a été vérifié à la main en production (S2.4 à S2.7 et
  audit de sécurité : navigateur mobile 390 px et ordinateur, plus un vrai iPhone avec dépôt de
  photo), mais aucun test automatisé ne le rejoue. À couvrir : ouverture du lien (cookie, adresse
  sans le lien), saisie et enregistrement automatique, coupure réseau, dépôt de fichier, « J'ai
  terminé », liens expiré / révoqué / fermé, vue admin (lien, export). Sur un chantier de test
  créé puis supprimé par `scripts/chantiers/test-chantier.ts`, jamais sur un vrai chantier. — **M**

- [ ] **46. Vérifier les libellés WordPress de l'assistant de l'espace chantier** *(noté le
  2026-10-08, Andrea, au premier accès à un des sites Oravis / Home Sweet Event)* — L'étape
  « WordPress : compte administrateur créé pour GeoMind » (aide affichée dans
  `lib/chantiers/fields.ts`, chemin du bot dans `OFFICIAL_GUIDES['access.wordpress']` de
  `lib/chantiers/assistant.ts`) repose sur la seule documentation officielle, en anglais et datée de
  2019 (« Users » › « Add New User »). À relever sur un vrai WordPress en français : nom du menu
  (« Comptes » ?), bouton d'ajout, case d'envoi de l'e-mail au nouveau compte, rôle
  « Administrateur ». Corriger les deux endroits, puis incrémenter
  `CHANTIER_ASSISTANT_PROMPT_VERSION` pour vider le cache des réponses. — **S**

- [ ] **47. Contrôler la purge à 30 jours des échanges avec l'assistant chantier** *(noté le
  2026-10-08, à faire début novembre : premiers échanges réels vers le 8 novembre)* — L'étape
  `delete-old-assistant-exchanges` de la fonction Inngest `chantier-files-maintenance` (toutes les
  heures à :20) supprime les lignes de `chantier_assistant_exchanges` de plus de 30 jours. Testée
  en unitaire, jamais vue tourner en production : à la clôture, l'API Inngest a refusé la clé de
  signature (**401** sur `GET https://api.inngest.com/v1/events/{id}/runs`, à regarder à ce
  moment-là : type de clé attendu, clé d'API dédiée ?), et le réseau bloquait Postgres. Vérifier
  qu'aucun échange de plus de 30 jours ne reste en base (`select min(created_at) from
  chantier_assistant_exchanges`) et que les exécutions de la fonction sont vertes dans Inngest,
  sans alerte Sentry `chantier-files-maintenance`. — **S**

- [ ] **48. Une recommandation refusée fait échouer toute l'analyse, et aucun appel OpenRouter
  n'est borné** *(noté le 2026-10-08, diagnostic des échecs du compte qa-dentiste, ticket T-05)* —
  Les 9 analyses en échec depuis le 15/09 portent toutes « Un service tiers utilisé par l'analyse
  est indisponible », c'est-à-dire un **402 d'OpenRouter**. Deux défauts se combinent :

  1. **`generateRecommendations` n'accepte aucun échec** (`lib/analysis/recommendations.ts:97`) :
     `runWithPool` attend toutes les tâches, et `callStructured` lève sur tout 4xx. Un seul appel
     refusé fait tomber l'étape, puis toute l'analyse, alors que les réponses IA, la technique et
     le contenu sont déjà en base (cas de maselectricite.fr le 19/09 : 34 réponses sur 40, 80
     constats, 0 recommandation). L'étape des réponses IA, elle, tolère ses échecs depuis le 23/09.
  2. **Aucun appel OpenRouter ne fixe de longueur maximale de réponse** (`lib/ai/structured.ts`, les
     4 connecteurs de `lib/ai/connectors/`). OpenRouter réserve alors sur le solde le prix de la
     réponse la plus longue que le modèle peut produire (≈ 0,30 $ par appel Haiku 4.5 en vol). Plus
     le solde baisse, ou plus il y a d'analyses simultanées, plus le 402 arrive tôt : le 15/09,
     10 analyses lancées en deux salves de 5 ont toutes échoué.

  À corriger avant d'ouvrir les plans payants : borner chaque appel (`max_tokens` adapté à chaque
  usage), et laisser l'étape recommandations finir avec les recommandations obtenues en
  journalisant les manquantes, comme `authority_failures`. — **S**

- [ ] **49. Faire valider par le client les 10 questions avant la mesure J0** *(noté le 2026-10-08,
  Andrea, ticket T-05 Oravis / Home Sweet Event)* — Les questions qui servent à la mesure d'état
  zéro sont aujourd'hui choisies par nous (questions de référence + variantes), puis validées par
  Andrea seule. Le client connaît mieux que nous ce que ses prospects demandent : la liste des 10
  questions doit lui être soumise, et validée par écrit, avant le lancement de la mesure J0. Sans
  cela, une mesure J0 peut être contestée après coup (« ce n'est pas ce que mes clients
  cherchent »), et les mesures suivantes, qui reprennent les mêmes questions, avec elle. — **S**

- [ ] **50. Formulaire chantier : types d'événements loués, et lequel compte le plus** *(noté le
  2026-10-08, Andrea, ticket T-05)* — Ajouter au formulaire de l'espace chantier une question
  « Quels types d'événements accueillez-vous ou équipez-vous (mariage, séminaire, réception
  privée, événement public…) ? Lequel compte le plus pour vous ? ». La réponse oriente le choix
  des questions de mesure (point 49) et la priorité des pages à travailler. Champ à ajouter dans
  `lib/chantiers/fields.ts`, avec son aide et, si besoin, son chemin dans l'assistant. — **S**

- [ ] **51. L'échec de `map()` pendant la découverte n'est signalé nulle part** *(noté le
  2026-10-08, ticket T-05, découverte d'Oravis)* — Dans `scrapeForDiscovery`
  (`lib/crawl/firecrawl.ts:107`), un `map()` qui échoue ou dépasse `MAP_TIMEOUT_MS` (15 s) tombe
  dans un `catch {}` vide : la découverte se rabat sur la seule page d'accueil, sans log ni
  Sentry. Seule trace : `crawlTruncated = true` sur une page unique dans `firecrawl_pages`. Le
  08/10, la découverte d'oravis.com n'a lu que l'accueil (2 crédits au lieu de 6), et il a été
  impossible de dire si c'était un délai dépassé ou une erreur Firecrawl. Même défaut au scrape de
  chaque page (`:138`). Contraire à la règle CLAUDE.md « jamais de `catch {}` silencieux » :
  journaliser le motif et le remonter à Sentry (`lib/monitoring.ts`), sans changer le repli sur
  l'accueil. — **S**

- [ ] **52. Une adresse écrite dans la réponse n'est pas comptée comme citation** *(noté le
  2026-10-09, ticket T-05, mesure J0 de Mas de Florette)* — Perplexity a répondu « Mas de Florette
  — indique explicitement un mariage sur 3 jours et 3 nuits. Site officiel : https://masdeflorette.com/ »,
  mais `masdeflorette.com` ne figurait pas dans ses sources structurées : GeoMind n'a compté ni la
  citation ni la part de voix. Cause : dans `parseSources` (`lib/ai/parse.ts`), les liens du texte
  (`parseMarkdownLinks`) ne servent que de **repli quand aucune source structurée n'existe** ; dès
  qu'il y a des annotations, les adresses écrites dans la réponse sont ignorées. La logique est
  commune aux quatre moteurs : le cas a été vu sur Perplexity, mais rien n'empêche qu'il touche
  les autres. À corriger dans la détection : fusionner sources structurées et liens du texte
  (dédoublonnés par URL), avec un test sur cette réponse réelle. **Attention à la comparabilité** :
  la correction change la mesure — les analyses J0 du 08/10 (Oravis / Home Sweet Event) devront être
  recalculées avec la même règle, ou la comparaison J30 signalée comme faite sur une autre
  méthode (`rules_version`). — **S**

---

**Effort total estimé** : Vague 0 ≈ 1 semaine · Vague 1 ≈ 3-4 semaines · Vague 2 ≈ 2-3 semaines · Vague 3 ≈ 4-6 semaines · Vague 4 = continu.
**North-star metric** : sites surveillés actifs par semaine.
