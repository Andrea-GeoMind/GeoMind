# QA interface — 23 septembre 2026

Parcours navigateur réel (Chromium, desktop 1440×900 et mobile 375×812), compte
`qa-dentiste@geomind.fr` (plan Business), site *Clinique Dentaire Laser* pour les
écrans remplis, *Cabinet Dentaire Bayard* pour les états vides.
Aucun appel OpenRouter, aucun crédit Firecrawl.

---

## Critique

### C1 — Le score Autorité est faux : il mélange deux unités
`lib/analysis/authority.ts:214`

```ts
clientCitationsFound += sourcesWithClientFlag.filter((s) => s.isClientDomain).length
```

Le numérateur compte des **sources citées**, le dénominateur (`successfulCalls`)
compte des **réponses**. Une réponse qui cite deux pages du domaine compte double.

Vérifié en base sur l'analyse `c5cb540a` :

| Mesure | Valeur |
|---|---|
| `authority_sources` avec `is_client_domain` | **13** |
| Réponses distinctes citant le client | **12** |
| Réponses exploitables | **32** |
| `authority_score` stocké | **41** |

13 / 32 = 40,6 → 41. La grille affichée juste dessous montre 12 / 32 = 38 %.
Les deux nombres sont sur le même écran, sous le même mot « taux de citation ».

Conséquences : le Score GEO Global (moyenne des 3 piliers) est contaminé ; le
score n'est pas reproductible depuis les données stockées, ce qui viole la règle
9 de CLAUDE.md (« calcul de scores idempotent ») ; et l'écart grandit avec le
nombre de pages citées par réponse.

### C2 — Deux questions sur dix disparaissent sans un mot
Le site a **10 prompts**, tous neutres, tous créés à 13:10:50, soit avant
l'analyse lancée à 13:12:56. Les huit premiers ont 4 réponses chacun ; **les deux
derniers en ont zéro**. Le compte est en Business, donc le plafond
`FREE_TIER_FORCED_PROMPTS = 3` ne s'applique pas.

Nulle part l'interface ne dit que deux questions ont échoué. L'onglet Découverte
affiche « Prompts 10/10 neutres », l'onglet Autorité en montre 8, l'onglet Suivi
écrit « 10 questions × 4 moteurs lors d'une analyse ». Le client croit mesurer ce
qu'il a configuré.

Cause probable : les appels en échec ne produisent aucune ligne et ne sont pas
remontés ; l'analyse se termine en `success` avec un jeu incomplet.

---

## Majeur

### M1 — L'accueil vend un essai de 7 jours qui n'existe pas
`app/(marketing)/page.tsx:520-575`

L'accueil affiche « Essayer Pro — 7 jours offerts », « Essayer Solo »,
« Essayer Business ». Ces boutons mènent à `/pricing`, où les trois plans
affichent « **BIENTÔT DISPONIBLE — Rejoindre la liste d'attente** ». Aucun essai
n'est configuré nulle part.

Cause : l'accueil duplique les cartes de plan au lieu de réutiliser
`components/features/marketing/pricing-plans.tsx`, qui est le seul à connaître
l'état « liste d'attente ». Deux sources de vérité pour la même information.

### M2 — Une ou deux analyses offertes ? La page tarifs dit les deux
Sur `/pricing`, dans la **même carte** : « 1 000 crédits de bienvenue —
≈ **2 analyses complètes** », puis « **1 analyse complète offerte** ». Le tableau
comparatif reprend « 1 offerte ». L'accueil dit « 1 analyse offerte ».

`WELCOME_BONUS_CREDITS = 1 000` et `CREDIT_COSTS.fullAnalysis = 400` : la réalité
est 2. Le produit se sous-vend et se contredit dans le même écran.

### M3 — Les pénalités affichées ne correspondent à aucun score
| Écran | Affiché | Score |
|---|---|---|
| Technique | 12 points faibles · **−45 pts** | 87/100 |
| Contenu | 19 points faibles · **−63 pts** | 84/100 |
| Plan d'action | « Encore **108 points de pénalité** à récupérer » | — |

100 − 45 ≠ 87. Les scores appliquent le plafond de 30 points par catégorie et la
proratisation des règles de page (`computeIssuesScore`), les libellés affichent
la somme brute. Un client qui corrige tout gagnera ~29 points, pas 108.

### M4 — Le rapport PDF client porte la contradiction
Le rapport affiche « 41/100 Autorité (citations IA) » et, deux lignes plus bas,
« Taux de citation moyen sur 30 jours : 38 % (12/32 mesures) ». C'est le document
qu'on envoie à un prospect.

### M5 — Aucun moyen de résilier son abonnement
`/settings/billing` affiche le plan, les crédits et la date de renouvellement.
Pas de portail Stripe, pas d'historique de factures, pas de bouton d'annulation
ni de changement de plan. La FAQ de `/pricing` promet « Puis-je annuler à tout
moment ? ». En France, la résiliation en ligne d'un abonnement souscrit en ligne
doit être aussi simple que la souscription.

### M6 — L'inscription ne mentionne aucune condition
`/signup` ne contient aucun lien vers les CGV, les CGU ou la politique de
confidentialité, et aucune case de consentement. Seuls liens présents :
`/` , `/login`, et `/legal/cookies` via la bannière. Le formulaire d'audit
public, lui, renvoie bien à la politique de confidentialité.

---

## Moyen

### Y1 — Pas de reconnexion possible par lien magique
`app/(auth)` ne contient aucun `signInWithOtp` ni option « recevoir un lien ».
Or le tunnel d'audit public crée des comptes **sans mot de passe** via
`generateLink`. Revenu le lendemain, ce client trouve un formulaire email +
mot de passe pour un mot de passe qu'il n'a jamais choisi. Le détour existe
(« Mot de passe oublié ? »), mais il est contre-intuitif.
Bon point : le lien expiré affiche un message clair et correct.

### Y2 — « 10 questions × 4 moteurs » écrit en dur dans Suivi
Le texte annonce 40 mesures par analyse. L'analyse en a produit 32. Le nombre
devrait venir du jeu de prompts réel.

### Y3 — Présence off-site affirme « 0 / 12 » sans le savoir
Trois plateformes sont marquées « À vérifier » (Google Business Profile, X,
Pages Jaunes), donc non mesurées — mais le compteur les compte comme absentes.
Un cabinet qui a une fiche Google lit « 0 / 12 » et cesse de faire confiance.

### Y4 — La checklist off-site n'est pas sectorisée
Pour un cabinet dentaire, l'écran pousse **G2** (« avis logiciels »),
**Crunchbase** (« requêtes B2B/SaaS ») et LinkedIn présenté comme « signal
d'entité B2B n°1 ». Le cœur de cible du produit, ce sont des TPE et des commerces
locaux.

### Y5 — Points faibles affichés en double, sans l'URL concernée
- Technique : « H1 dupliqué » apparaît deux fois, texte identique, sans dire sur
  quelle page (l'info existe plus bas, dans « analyse page par page »).
- Contenu : « Contenu sans signe de fraîcheur » apparaît deux fois — une fois
  dans le bloc « Commencez ici », une fois dans sa catégorie ; et « Page longue
  sans conclusion ni résumé » trois fois d'affilée.

Le bloc « Commencez ici » est une sélection re-affichée ensuite : le lecteur
compte deux fois le même défaut.

### Y6 — `/settings/billing` porte le titre de la page d'accueil
Onglet navigateur : « GEOMIND — Êtes-vous cité par ChatGPT ?… » au lieu de
« Facturation — GEOMIND ». `export const metadata` manquant. Les autres pages de
réglages sont correctes.

### Y7 — On renvoie vers un « onglet Découverte » qui n'est pas dans la navigation
L'onglet Local écrit « précisez votre ville dans la description (onglet
Découverte) ». La barre latérale ne contient pas Découverte. La page existe et
est atteignable par « Modifier les questions testées », mais pas sous ce nom.

### Y8 — La checklist Local n'est pas cochable
« Cochez mentalement ce qui est déjà fait. » `/pricing` vend pourtant
« Local : questions géolocalisées + **checklist** ». Rien n'est enregistré, rien
ne se coche — contrairement au Plan d'action, qui a un vrai bouton « J'ai
corrigé ».

---

## Mineur

- **N1** — `profiles.subscription_plan` vaut `free` et `subscription_status`
  `inactive`, alors que `subscriptions` dit `business` / `active`. Aucun code ne
  lit ces colonnes (vérifié), mais elles sont fausses et piègent le prochain
  lecteur.
- **N2** — L'accueil affiche « HT/mois », `/pricing` affiche « /mois ». En B2B,
  il faut choisir.
- **N3** — `app/(marketing)/page.tsx` définit `trialNote` pour Pro puis le jette
  au destructuring du `.map` (ligne 574) : code mort.
- **N4** — Plan d'action : « 0/31 actions traitée » (accord manquant).
- **N5** — Audit express : « 70/100 » est affiché à côté de « 6 des 12
  vérifications de base passent ». La pondération (un blocage robots pèse 45)
  n'est expliquée qu'ailleurs sur la page.
- **N6** — Découverte : le champ Description est vide, alors que l'onglet Local
  invite explicitement à y préciser la ville.
- **N7** — Découverte : « Dr Maleca » figure dans les mots-clés, alors que la
  page met en garde contre les noms de marque dans les questions.
- **N8** — Le tableau de bord ne montre ni score, ni date de dernière analyse,
  ni statut par site — seulement nom, URL, « Voir l'analyse », « Supprimer ».
- **N9** — Commentaires périmés : `scripts/prospection/*` parle de
  « 11 vérifications HTTP », `EXPRESS_CHECK_COUNT` vaut 12.

---

## Ce qui marche bien

- Protection des routes : `/dashboard`, `/sites`, `/settings`, `/sites/[id]/*`
  redirigent tous en 307 vers `/login` hors session.
- Lien magique : `/auth/confirm` pose la session correctement, et le lien
  consommé affiche « Le lien a expiré ou est invalide. Réessayez. »
- Cohérences justes : Global = moyenne des 3 piliers (71 = (41+87+84)/3) ;
  crédits (87 765 / 400 = 219 analyses) ; part de voix = 12/32 = 38 % ;
  `6 + 6 = 12` vérifications express.
- `/verifier-visibilite-chatgpt` est honnête : il dit explicitement ce qu'il ne
  mesure pas, et annonce « un pilier sur trois ».
- États vides soignés : Réputation, Pixel, Suivi (« il faut deux analyses pour
  tracer une tendance »), et l'analyse en échec affiche le remboursement.
- Mobile 375 px : aucun débordement horizontal sur l'accueil, la vue d'ensemble
  ni l'inscription ; les onglets défilent latéralement comme prévu.
- `/publishers`, route orpheline, redirige proprement vers `/presence`.
- 404 corrects sur `/blog/*`, `/comparatif/*`, `/secteurs/*` inexistants.

---

## Non testé

À signaler franchement, pour que la liste ne passe pas pour exhaustive :

- **Conversation avec le Coach** — chaque message appelle OpenRouter. Seul le
  message d'accueil a été vérifié (il cite le bon score et le bon pilier faible).
- **Lancer une analyse**, **Relancer**, **Analyser ma réputation** — OpenRouter
  et Firecrawl.
- **Parcours Stripe** — les trois plans payants sont en liste d'attente.
- **Suppression de compte et de site** — actions destructives sur des données
  de production.
- **Onboarding** et **ajout d'un site** — non parcourus (créeraient un site et
  déclencheraient un crawl).
- **Envoi du rapport par email** depuis l'audit public.
- `/about`, `/glossaire`, `/outils/generateur-llms-txt`, `/comparatif/*`,
  `/secteurs/*`, `/legal/*` — répondent en 200, contenu non relu en détail.
