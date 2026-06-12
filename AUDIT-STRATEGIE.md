# AUDIT STRATÉGIQUE GEOMIND — Business plan & vision produit

> **Complément à [AUDIT.md](AUDIT.md)** (qui couvre l'existant : conversion, UX, sécurité, SEO).
> Ce document challenge le **modèle économique** et propose la **vision produit étendue** : nouveaux onglets, nouveaux outils, nouvelles sources de revenus.
> Chiffres ancrés dans le code réel (`lib/plans.ts`, `lib/credits-shared.ts`) et le cahier des charges (§4).

---

## PARTIE A — CHALLENGE DU BUSINESS PLAN

### A1. Le problème structurel n°1 : vous vendez de l'audit, pas de l'abonnement

Un audit est un achat **ponctuel**. Un abonnement se justifie par une valeur **récurrente**. Aujourd'hui, le parcours type d'un client Solo :

1. Mois 1 : il lance son analyse, lit ses 15 points faibles, corrige 3-4 trucs (ou pas).
2. Mois 2 : il relance une analyse, le score a bougé de quelques points. Bof.
3. Mois 3 : **il résilie** — "j'ai eu mon diagnostic, merci".

Rien dans le produit actuel ne le fait **revenir** : pas d'alertes, pas de suivi automatique, pas de "il s'est passé quelque chose cette semaine". Le coach est génial mais réactif (il faut venir lui parler). **Tout ce qui crée de la récurrence est aujourd'hui absent** : monitoring continu, alertes "vous venez d'être cité", rapport mensuel automatique, veille concurrents.

> **Verdict ❌ P0 stratégique** : sans boucle récurrente, le churn mensuel sera de 10-20 % et la LTV s'effondre (à 15 %/mois : LTV Solo ≈ 19 € × 6,7 mois ≈ **127 €** — difficile de rentabiliser n'importe quel CAC payant). C'est plus important que n'importe quelle feature d'audit supplémentaire.

### A2. L'échelle de prix monétise le mauvais axe

Les plans se différencient principalement par le **nombre de sites** (1 → 2 → 5 → 15). Or votre persona cœur (patron de TPE) a **UN site**. Pour lui, l'échelle actuelle ne propose aucune raison de monter en gamme :

| Ce que paie un TPE mono-site en passant Solo → Pro (+40 €/mois) | Sa réaction |
|---|---|
| 3 sites en plus | "J'en ai un seul" |
| 15 000 crédits en plus | "Je n'épuise déjà pas les 5 000" |
| Recommandations complètes (Sonnet) | Seul vrai argument — mais invisible avant d'acheter |
| PDF standard | "Pour l'envoyer à qui ?" |

**Le bon axe de monétisation pour un mono-site, c'est la profondeur et l'automatisation** : fréquence de surveillance (mensuelle → hebdo → quotidienne), nombre de prompts suivis, veille concurrents, correctifs générés, alertes. Le nombre de sites, lui, monétise un autre persona : **l'agence/freelance** — qui mérite son propre plan assumé (voir A5).

> **Verdict ⚠️ P1** : repenser la grille non pas en "combien de sites" mais en "à quelle profondeur on surveille et on agit". Proposition en A6.

### A3. Le plan Gratuit donne le cœur du produit (et contredit la landing)

Le code dit : **free = 500 crédits/mois, reset chaque mois calendaire** ([plans.ts:10](lib/plans.ts), [credits-shared.ts:45](lib/credits-shared.ts)). Une analyse complète = 400 crédits. Donc **un utilisateur gratuit a droit à 1 audit complet par mois, pour toujours** (+ 1 000 crédits de bienvenue). La landing, elle, promet "1 analyse à vie".

Trois problèmes :

1. **Incohérence** code ↔ marketing (encore une) — laquelle est la politique voulue ?
2. **Si c'est 1/mois à vie** : le gratuit couvre le besoin du TPE peu engagé ("je re-checke de temps en temps") → il ne passera jamais à Solo. Vous donnez la valeur cœur et vendez des périphériques.
3. **Si c'est 1 à vie** : très agressif pour l'acquisition mais cohérent — le gratuit devient une démo, pas un plan.

> **Recommandation** : gratuit = **1 audit complet à vie + surveillance dégradée** (score mis à jour mensuellement mais détails floutés + alertes basiques). Le gratuit doit faire *saliver* (il voit que son score bouge, que son concurrent est cité) sans *nourrir*. C'est le modèle qui convertit le mieux dans cette catégorie.

### A4. Les marges du cahier des charges sont obsolètes et trop optimistes

Le CDC (§4.3) calcule : "Pro : 49 € − (4 × 1,24 €) = marge 92 %". Mais :

- Les prix ont changé (Pro = 59 €), les quotas sont devenus des crédits — **le calcul n'a jamais été refait pour la V2**.
- 20 000 crédits Pro = jusqu'à **50 analyses/mois**. Coût réel ~1,24 € chacune → pire cas **62 € de coûts pour 59 € de revenu = marge négative**. Improbable (personne ne lance 50 audits), mais le modèle de crédits n'a **aucun garde-fou de marge** : le prix du crédit implicite (Solo : 19 €/5 000 cr → une analyse "vaut" 1,52 €) laisse ~20 % de marge brute seulement sur l'usage intensif d'analyses, alors que les messages coach Haiku (10 cr ≈ 0,04 € facturés ~0,001 € de coût) ont une marge >95 %.
- Le CDC affiche des prix **TTC**, les CGV parlent **HT**. Pour du B2B, affichez HT partout (les pros raisonnent HT, et 59 € TTC = 49,17 € HT, encore une source de confusion).

> **Verdict ⚠️ P1** : refaire la table de marges V2 (coût réel par opération × mix d'usage observé via PostHog), fixer un coût-plancher du crédit, et trancher TTC/HT. Effort S, c'est un tableur — mais il pilote tout le pricing.

### A5. Il manque la moitié du business plan : acquisition et canaux

Le CDC décrit le produit et les marges mais **rien sur comment les clients arrivent**. Or pour des TPE françaises non-expertes, personne ne cherche "outil GEO" sur Google (le marché ne sait pas que ça existe). Les canaux réalistes, par ordre de ROI probable :

1. **Le produit comme aimant** : audit express public **sans inscription** sur la landing (URL → mini-score en 60 s → email pour le détail). C'est l'outil d'acquisition n°1 de cette catégorie (HubSpot Website Grader a construit HubSpot). Aujourd'hui, il faut créer un compte avant de voir quoi que ce soit. ➕ **P0 acquisition**.
2. **Contenu / SEO-GEO** : être soi-même cité par ChatGPT quand on demande "comment être visible dans ChatGPT" (cf. AUDIT.md §6 — le site n'a même pas de sitemap). Blog + outils gratuits (générateur llms.txt, vérificateur de fiche) comme pages d'atterrissage.
3. **Effet de réseau B2B local** : programme partenaires pour les **webmasters freelance et petites agences** qui gèrent les sites des TPE. Ce sont eux les prescripteurs — un freelance amène 10-20 TPE. White-label Business = ce produit, mais il n'est ni nommé ni marketé comme tel.
4. **PR / data** : "Baromètre de la visibilité IA des PME françaises" (vous avez les données !) — communiqués sectoriels ("seuls 9 % des restaurateurs lyonnais sont cités par ChatGPT") = presse locale + backlinks + autorité.
5. **Publicité payante** : à éviter en V1 (LTV trop incertaine, audience qui ne connaît pas la catégorie).

> **Verdict ➕ P0/P1** : le business plan doit nommer ses canaux. Mes recommandations : audit public sans inscription (P0), programme agences (P1), baromètre data (P2).

### A6. Proposition de grille repensée (à discuter, pas à implémenter telle quelle)

| | **Découverte** 0 € | **Essentiel** ~29 € | **Croissance** ~79 € | **Agence** ~199 € |
|---|---|---|---|---|
| Cible | Curieux | TPE mono-site | PME / multi-sites | Freelances & agences |
| Audit complet | 1 à vie | 1/mois auto | 1/semaine auto | par client |
| Surveillance & alertes | score seul | citations + score | + concurrents + sentiment | + tous clients |
| Prompts suivis | 3 | 10 | 25 | 25/client |
| Correctifs générés | aperçu | ✅ | ✅ | ✅ |
| Veille concurrents scorée | ❌ | 1 concurrent | 5 concurrents | 5/client |
| Rapport | — | email mensuel | PDF + email hebdo | PDF white-label |
| Sites | 1 | 1 | 5 | 15+ |

Logique : chaque palier vend **plus de fréquence, plus de concurrents, plus d'automatisation** — pas "plus de crédits". Les crédits restent en coulisse (métering interne + packs de dépannage), mais le client achète des bénéfices nommés. Prix d'entrée remonté de 19 → 29 € : vous êtes 40 % moins cher que BotRank avec un produit plus pédagogue, inutile de brader ; et l'écart 29 → 79 est plus franchissable que 19 → 59.

### A7. Sources de revenus absentes du plan

| ➕ Source | Description | Potentiel | Effort |
|---|---|---|---|
| **Done-for-you ("GeoMind s'en occupe")** | Upsell ponctuel 149-399 € : on applique les correctifs pour vous (IA + validation humaine). Répond à LA réalité du patron : "même avec le plan d'action, je n'ai pas le temps" | Très fort (panier moyen ×5, marge élevée) | M-L |
| **Plan Agence assumé + programme partenaires** | Commission ou tarif dégressif pour les webmasters qui gèrent N clients | Fort (canal + revenu) | M |
| **Marketplace de mise en relation** | Le client qui ne veut pas faire lui-même → freelances certifiés "GeoMind Ready" (commission 15-20 %) | Moyen, long terme | L |
| **API** | Pour agences/outils tiers (audit GEO en marque blanche) | Faible court terme | M |

### A8. TAM honnête (France, V1)

- ~4,2 M de TPE/PME en France, dont ~2 M avec un site web actif.
- Segment atteignable (sensibles au digital, dépensent déjà en SEO/site) : ~300-500 k.
- Objectif réaliste 12 mois pour un solo-dev avec freemium : **300-1 500 payants** → à ARPU ~35 € : **10-50 k€ MRR**. C'est un excellent business solo-dev ; ce n'est pas une licorne — et la fenêtre est de 12-24 mois avant que les suites SEO (Semrush/Adobe, HubSpot AEO à 50 $/mois) ne descendent en gamme. **La vitesse d'exécution sur la niche FR est votre seul moat durable**, avec les données accumulées (baromètre) et la marque.

---

## PARTIE B — VISION PRODUIT : LE SITE "SUPER COMPLET"

Vision cible : passer de **"un outil d'audit"** à **"le cockpit de visibilité IA du patron de TPE"** — il ouvre GeoMind chaque semaine comme il ouvre sa banque. Trois horizons : H1 = ce qui crée la récurrence, H2 = ce qui différencie, H3 = ce qui verrouille le marché.

### B1. Nouveaux ONGLETS par site (l'app passe de 6 à 10 onglets — progressivement !)

#### ➕ Onglet « Concurrents » — H1, effort L, le plus gros levier émotionnel
Les concurrents sont **déjà détectés** par la découverte mais inexploités. L'onglet :
- Score GEO de chaque concurrent (audit allégé : autorité + quelques règles site-scope, ~80 crédits/concurrent).
- **Share of voice** : sur vos 10 prompts suivis, qui est cité ? Vous 2 fois, le concurrent A 7 fois.
- « Pourquoi lui ? » : analyse des pages du concurrent qui sont citées (il a une FAQ, des stats, une page À propos…) → recommandations en miroir ("Durand Plomberie est cité parce qu'il a 12 avis détaillés sur PagesJaunes — voici comment faire pareil").
- Rien ne motive plus un patron que "ton concurrent te bat". C'est aussi le meilleur déclencheur d'upgrade.

#### ➕ Onglet « Suivi » (tendances) — H1, effort S-M
- Courbes des 4 scores dans le temps (données déjà en base !).
- Timeline annotée : "12 juin : correction FAQ appliquée" → on **voit** l'effet des actions.
- Citations par moteur par semaine. Tendance 30 jours mise en avant (réponse honnête au non-déterminisme des LLM).

#### ➕ Onglet « Plan d'action » — H1, effort M, transforme l'audit en programme
Aujourd'hui les issues sont une *liste* ; il faut une *checklist vivante* :
- Kanban simple : À faire / Fait / Vérifié. Tri par ROI (impact ÷ effort).
- Bouton "J'ai corrigé" → GeoMind **revérifie automatiquement** la règle (re-crawl de la page, 8 crédits) → ✅ "Vérifié, +3 pts" → dopamine, boucle d'engagement.
- Le coach connaît l'état du kanban (ferme la boucle de feedback identifiée dans AUDIT.md).
- Progression gamifiée : "7/15 actions — score projeté si tout est corrigé : 84/100".

#### ➕ Onglet « Studio » (correctifs générés) — H1, effort M-L, LE différenciateur
Le passage de "voici ce qui ne va pas" à **"voici le fichier corrigé"** :
- Générateurs un-clic : `llms.txt`, `robots.txt`, JSON-LD (Organization, LocalBusiness, FAQ, Article), meta title/description réécrits par page, FAQ générée à partir du contenu existant, page À propos pré-rédigée.
- Chaque correctif avec **instructions par CMS** ("Vous êtes sur WordPress ? Collez ceci dans Yoast → Outils") — détecter le CMS au crawl, c'est facile.
- Mode "envoyer à mon webmaster" : email pré-rédigé avec les fichiers joints. (Le patron ne touche pas au code — son prestataire reçoit un brief parfait.)

#### ➕ Onglet « Réputation » (ce que les IA disent de vous) — H2, effort M-L, quasi personne ne le fait en SMB
Au-delà de "suis-je cité" : **"que disent-ils de moi, et est-ce vrai ?"**
- Fact-check automatique : on demande aux 4 moteurs "parle-moi de {entreprise}" → extraction des affirmations (adresse, horaires, prix, services) → le client valide/corrige → alertes sur les **hallucinations** ("⚠️ ChatGPT dit que vous êtes fermé le lundi — vrai ?").
- Sentiment des mentions (positif/neutre/négatif) — table stakes chez les concurrents, absent chez vous.
- Pour une TPE locale, une IA qui donne de **fausses infos** est plus grave qu'une absence de citation. Use case très vendeur et très concret.

#### ➕ Onglet « Local » (pour les commerces/artisans) — H2, effort M
- Prompts géolocalisés automatiques ("meilleur {métier} à {ville}", "{métier} ouvert dimanche {ville}").
- Checklist presence locale : Google Business Profile, PagesJaunes, avis — les sources que les IA citent pour le local.
- Personne (même BotRank) ne traite le GEO **local** sérieusement. Pour votre cible, c'est LE cas d'usage.

#### ➕ Onglet « Crawlers IA » — H2-H3, effort L
- Petit script/pixel à installer (ou intégration Cloudflare/Vercel, ou upload de logs) → "GPTBot a visité 14 pages cette semaine, ClaudeBot jamais".
- Preuve tangible que le GEO "travaille" ; différenciateur Profound/Scrunch encore rare en SMB (seul Qwairy le fait en France).

### B2. Nouveaux OUTILS PUBLICS (acquisition — chacun est une landing page gratuite)

| ➕ Outil | Description | Pourquoi | Effort |
|---|---|---|---|
| **Audit express sans inscription** | URL → score teaser en 60 s sur la landing → email pour le rapport | L'arme d'acquisition n°1 (modèle HubSpot Grader). Limiter : 1/IP/jour, cache par domaine | M |
| **« Demandez aux IA »** (simulateur live) | Le visiteur tape une question, voit les réponses des 4 moteurs côte à côte + qui est cité | Effet démo wahou ; fait *comprendre* le GEO en 10 secondes mieux que tout pitch | M |
| **Générateur llms.txt gratuit** | Formulaire → fichier téléchargeable + explication | SEO-bait classique (requêtes "générateur llms.txt" en croissance), backlinks | S |
| **« Que sait ChatGPT de votre entreprise ? »** | Nom d'entreprise → fiche extraite + erreurs détectées | Très partageable, joue sur la curiosité/peur | M |
| **Baromètre GEO France** | Page publique : visibilité IA moyenne par secteur/région, mise à jour mensuelle avec vos données agrégées | PR, presse locale, autorité, data moat | M-L |

### B3. Moteurs & couverture — arbitrage

| Moteur | Verdict | Pourquoi |
|---|---|---|
| **Google AI Overviews / AI Mode** | ➕ **prioritaire H1-H2** | C'est ce que vos clients TPE *voient réellement* (Google = 90 % du search FR). Tous les comparatifs le classent table stakes 2026. Plus important que Claude pour votre cible |
| **Mistral Le Chat** | ➕ H2 | Cohérence "100 % français", seul BotRank le fait, et Le Chat monte en France |
| Copilot, Grok, DeepSeek… | ❌ | Course aux armements sans valeur pour la cible |

### B4. Idées folles (H3 — à garder en tête, pas au backlog)

1. **L'agent qui corrige tout seul** : connexion WordPress (plugin) → les correctifs validés dans le Studio s'appliquent en un clic depuis GeoMind. Le "done-with-you" devient "done-for-you" logiciel. C'est la destination finale de la catégorie (Adobe LLM Optimizer le fait en enterprise) — et un solo-dev peut le faire sur WordPress, qui équipe 40 % des sites FR.
2. **Garantie résultat** : "Cité dans au moins une IA en 90 jours ou remboursé" — possible une fois les correctifs auto + publishers en place ; marketing dévastateur, à tester sur un segment.
3. **HARO français inversé** : place de marché où les médias/blogs FR cherchent des sources expertes → vos clients répondent → citations. Crée l'autorité que l'audit ne fait que mesurer.
4. **GeoMind Certified** : badge/certification pour webmasters et agences (formation courte payante) → réseau de prescripteurs + revenu formation.

### B5. Ce que je retirerais ou repousserais (focus solo-dev)

- **PWA Serwist** : aucune valeur identifiable pour la cible (qui n'installe pas une app d'audit). À retirer si PostHog confirme zéro usage. −1 dépendance, −1 surface de bugs.
- **Page `/design`** : page interne exposée en production, sans metadata — à retirer du routing public.
- **4 plans** : simplifier (cf. A6).
- **Multi-langue / international** : pas avant le product-market fit FR. C'est votre moat, pas votre frein.

---

## PARTIE C — SÉQUENCEMENT RECOMMANDÉ (vue fusionnée avec AUDIT.md)

**North-star metric proposée** : *sites surveillés actifs par semaine* (un site dont le propriétaire a vu un rapport/alerte dans les 7 jours). Toutes les priorités ci-dessous la servent.

| Vague | Contenu | Objectif |
|---|---|---|
| **0. Assainir** (1 sem) | Les P0 d'AUDIT.md : cohérence pricing/CGV, RLS, robots/sitemap/JSON-LD, timeouts onboarding, disclaimer méthodo | Vendable et sûr |
| **1. Récurrence** (3-4 sem) | Suivi auto + alertes email + onglet Suivi + rapport mensuel + onglet Plan d'action | Churn ↓, l'abonnement se justifie |
| **2. Acquisition** (2-3 sem) | Audit express public sans inscription + comparatif GEO/SEO + cas d'usage + blog 5 articles + outils gratuits (llms.txt) | Pipeline entrant |
| **3. Différenciation** (4-6 sem) | Studio correctifs + onglet Concurrents + Google AI Overviews | Personne en France n'a ça à ce prix |
| **4. Expansion** (continu) | Réputation/fact-check, Local, plan Agence + partenaires, done-for-you, baromètre | Revenus additionnels + moat |

---

## PARTIE E — REMISE EN QUESTION DU FONCTIONNEMENT CŒUR

> Ajouté suite au challenge : non, tout n'est pas OK. Voici ce qui, dans la **mécanique même du produit**, est contestable — pas des détails d'UX, le moteur.

### E1. ❌ La note GEO globale est statistiquement vide de sens

Le chiffre central du produit — celui du hero de l'overview — est calculé sur **3 prompts × 4 moteurs = 12 réponses**. Avec un taux de citation réel de 25 %, l'erreur type est de ±12,5 pts (≈ **±25 pts à 95 % de confiance**). Concrètement : le même site, le même jour, peut scorer 17 ou 42 sans qu'absolument rien n'ait changé. Et le produit affiche fièrement "−2 pts vs analyse précédente" comme si c'était un signal.

**Conséquence produit** : la feature centrale ("votre note") est un générateur de fausses joies et de fausses paniques. Le fix n'est pas cosmétique :
- Passer à **10-15 prompts** minimum (coût ×3-4 sur la partie autorité, soutenable : ~0,8-1,2 €/analyse) ;
- **Répéter** chaque prompt 2-3 fois et moyenner ;
- Afficher la note comme une **fourchette ou une moyenne glissante 30 jours**, jamais comme un entier précis ;
- Ne déclencher "votre score a bougé" qu'au-delà du bruit mesuré.

### E2. ❌ Le suffixe "liste 10 acteurs" fausse la mesure à la racine

[authority.ts:99-101](lib/analysis/authority.ts) ajoute à chaque prompt neutre : *"IMPORTANT : ta réponse doit impérativement lister au moins 10 acteurs différents (...) accompagné de son site web officiel"*.

Aucun vrai client ne demande ça à ChatGPT. On ne mesure donc **pas** "suis-je cité quand on pose ma question ?" mais "suis-je dans le top-10 quand on force l'IA à énumérer ?" — ce qui **gonfle artificiellement** les taux de citation et déconnecte la mesure de la réalité vécue. C'est un choix compréhensible (sans lui, beaucoup de réponses n'ont aucune URL exploitable) mais il doit être repensé :
- Mesurer **les deux** : réponse naturelle (citation spontanée = la vraie visibilité, pondérée fort) ET réponse forcée (position dans le classement = signal secondaire) ;
- À défaut, l'assumer dans l'UI ("position dans le top 10 des IA" plutôt que "citations").

### E3. ❌ Rien ne prouve que corriger les règles fait gagner des citations

Le produit vend implicitement une causalité : "corrige tes 15 points faibles → tu seras cité". Or les notes Technique/Contenu sont des pénalités de règles **jamais corrélées** au résultat (les citations). Si un client corrige tout et n'est toujours pas cité après 3 mois, le produit n'a aucune réponse — et il aura raison d'être furieux.

**Le fix est une opportunité en or** (personne ne l'a) : avec une base de clients qui grandit, **mesurer la corrélation règle par règle** ("les sites avec FAQ + schema sont cités 2,3× plus dans notre base") et l'afficher comme preuve. Vos règles passeraient d'opinions à **données propriétaires** — un vrai moat.

### E4. ⚠️ Les 3 prompts sont devinés, jamais validés par la réalité

La découverte fait *générer* les questions par Haiku à partir du contenu du site. Personne ne vérifie que ce sont les questions que les **vrais clients** posent. Profound a levé 155 M$ en partie sur ce point précis (Prompt Volumes : données de panel réelles). À votre échelle : laisser le client noter/remplacer les prompts ("vos clients vous demandent quoi au téléphone ?"), suggérer des variantes géolocalisées, et — voir Partie F — **collecter les vraies questions** via les outils publics.

### E5. ⚠️ L'architecture "analyse instantanée" est le mauvais modèle de données

Tout est structuré autour d'un événement ponctuel (une `analysis` avec un statut), alors que la valeur réelle est une **série temporelle** (le prompt P sur le moteur M au temps T → cité ou non). Tant que le modèle de données pense "audit", les features de la vague Récurrence (tendances, alertes, baromètre) se construiront sur des fondations tordues. À anticiper **avant** de construire le suivi automatique : une table `citation_checks` (prompt × moteur × date × résultat), dont les analyses ne sont qu'une agrégation.

### E6. ⚠️ Le crawl voit une fraction du site et personne ne le sait

20 pages max, pas de rendu JavaScript, sélection round-robin. Pour un site WordPress de 150 pages ou une boutique Shopify, l'audit juge ~13 % du site — et l'UI présente le résultat comme "votre site". Minimum : transparence ("20 pages analysées sur 147 détectées") ; mieux : laisser le client choisir ses pages stratégiques.

### E7. ⚠️ Le produit fait travailler le client (alors que la cible a signé pour l'inverse)

Le flux actuel : on te montre 15 problèmes → tu lis → tu comprends (peut-être) → tu corriges (rarement) → tu relances une analyse (parfois). Chaque flèche perd 50 % des utilisateurs. Pour des non-experts, le produit devrait **inverser la charge** : chaque semaine, GeoMind choisit LA prochaine action, la prépare (correctif généré), la fait vérifier, célèbre le progrès. Le client ne navigue plus dans des onglets d'expert — il répond à "fais-le" ou "explique-moi d'abord". (Les onglets restent pour les Karim/agences ; le mode guidé devient l'expérience par défaut des TPE.)

---

## PARTIE F — L'IDÉE SIGNATURE : « LA PREUVE »

> La question posée : qu'est-ce qui démarquerait GeoMind de TOUTE la concurrence ?

### Le constat que tout le marché esquive

Tous les outils GEO — Profound à 2 000 $/mois comme BotRank à 75 € — vendent la même chose : *de la visibilité*. Des scores, des mentions, des dashboards. **Aucun ne répond à la seule question que pose un patron : "et ça me rapporte combien ?"** C'est le talon d'Achille de toute la catégorie, documenté dans les avis clients ("tracking, not outcomes").

### L'idée : GeoMind devient le seul outil qui montre l'argent

**Un snippet une-ligne (+ plugin WordPress un-clic) : le Pixel GeoMind.** Posé sur le site du client, il capte trois choses qu'aucun outil SMB ne réunit :

1. **Le trafic venant des IA** : visiteurs arrivant avec un referrer `chatgpt.com`, `perplexity.ai`, `gemini.google.com`, `copilot.microsoft.com` — données réelles, pas simulées.
2. **Les actes** : ce visiteur IA a appelé (clic `tel:`), envoyé le formulaire, pris RDV → **"Ce mois-ci, les IA vous ont amené 14 visiteurs et 3 demandes de devis."** En euros si le client renseigne son panier moyen.
3. **Les crawlers IA** : GPTBot, ClaudeBot, PerplexityBot passent-ils ? (la fondation de l'onglet Crawlers, gratuite au passage).

La boucle devient imbattable : *audit → correctifs (Studio) → citations (suivi) → **clients réels (Pixel)*** . GeoMind n'est plus un outil de scores, c'est l'outil qui prouve le ROI — exactement ce que Profound fait pour les Fortune 500 via Cloudflare, mais que personne n'a packagé en copier-coller pour une TPE.

**Et l'effet réseau caché** : chaque pixel installé alimente le Baromètre GEO France avec des données de trafic IA *réelles* par secteur — un jeu de données que ni Semrush ni personne n'a sur le marché français. Au bout de 12 mois : "les restaurants français reçoivent en moyenne 4,2 % de leur trafic depuis les IA, +180 % sur un an — source GeoMind" repris dans la presse. C'est un moat qui se renforce à chaque client, qu'aucun concurrent ne peut copier sans votre base installée.

**Faisabilité solo-dev** : un endpoint de collecte + un script de 3 Ko + détection de referrers/user-agents + un plugin WP minimal. C'est dans vos cordes (M-L). Conformité : pas de cookies tiers nécessaires, compteurs agrégés anonymes = RGPD-friendly, argument "100 % français, hébergé en Europe" en prime.

### Le coup d'après (même famille, encore plus loin) : le Score Agent-Ready

2026 = commerce agentique : les IA ne se contentent plus de répondre, elles **agissent** (réservent, contactent, achètent). La question de demain n'est pas "suis-je cité ?" mais **"une IA peut-elle me trouver ET me choisir ET me contacter sans humain ?"**. Test concret : un agent IA cherche un plombier à Lyon, trouve le site du client — arrive-t-il à extraire le téléphone, comprendre les horaires, soumettre le formulaire de contact, trouver le lien de réservation ? GeoMind le simule (agent headless + règles : `tel:` cliquable, formulaire parsable, horaires en schema.org, lien de RDV) et rend un **Score Agent-Ready** avec ses correctifs. Personne — pas même Profound — ne propose ça en SMB aujourd'hui. C'est l'onglet qui fait dire "ces gens ont deux ans d'avance", pour un coût de construction modéré (L).

### Pourquoi c'est LE positionnement

- **Pixel** = la preuve que ça rapporte (passé).
- **Audit + Studio** = le travail fait pour vous (présent).
- **Agent-Ready** = prêt pour ce qui arrive (futur).

Slogan possible : *« Les autres vous donnent un score. GeoMind vous amène des clients — et le prouve. »*

---

## PARTIE G — QUESTIONS DE FOND À TRANCHER

1. **Gratuit : 1 audit/mois (code actuel) ou 1 à vie (landing) ?** Ma reco : 1 à vie + surveillance dégradée (A3).
2. **Refonte de la grille tarifaire (A6) : maintenant ou après la vague Récurrence ?** Ma reco : après — on refond le pricing quand on a la valeur récurrente à vendre. Mais on corrige les incohérences tout de suite.
3. **Ambition** : objectif lifestyle business rentable (10-50 k€ MRR) ou course à la levée ? Ça change le rythme (le marché se consolide vite : Trajaan, français, déjà racheté par Cision).
4. **Done-for-you** : êtes-vous prêt à mettre de l'humain (vous, un freelance partenaire) dans la boucle, ou 100 % logiciel ?
5. **Google AI Overviews** : OK pour le prioriser au-dessus de Mistral ? (Mon avis : oui, nettement.)
6. **Combien d'heures/semaine et quel budget LLM/mois** pouvez-vous soutenir ? Le séquencement (Partie C) suppose un solo-dev à temps plein assisté par IA ; sinon, étaler les vagues.
7. **Fiabilité du score (E1/E2)** : acceptez-vous de multiplier par ~3 le coût de la partie autorité (10-15 prompts, mesure spontanée + forcée) pour que le chiffre central du produit veuille dire quelque chose ? Mon avis : non négociable avant de scaler.
8. **Le Pixel GeoMind (Partie F)** : on l'inscrit comme cap produit (vague Différenciation/Expansion) ? Il conditionne le modèle de données (E5) et le positionnement marketing — autant le décider tôt.
