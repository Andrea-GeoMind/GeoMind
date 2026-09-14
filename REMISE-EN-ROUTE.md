# REMISE EN ROUTE — compte-rendu

**Date** : 14-15 septembre 2026 · **Branche** : poussée sur `main` (8 commits) · **Prod** : déployée et vérifiée

---

## 1. ✅ Ce qui est fait et vérifié en production

### La base est revenue — et tout le produit avec
Le projet Supabase était **restaurable** (même référence `jiuruhae…`, données intactes) : 33 tables, RLS active sur toutes, 44 comptes utilisateurs préservés. Tes nouvelles clés sont en place partout.

**Migration de code : aucune n'a été nécessaire.** J'ai vérifié avant d'agir — `@supabase/supabase-js` 2.105 et `@supabase/ssr` 0.10 acceptent les nouvelles clés `sb_publishable_` / `sb_secret_` en remplacement direct des anciens JWT, et `lib/env.ts` ne valide que la présence, jamais le format. `lib/supabase/admin.ts` fonctionne tel quel avec la clé secret.

| Vérification | Résultat |
|---|---|
| Connexion DB (pooler + directe) | ✅ 33 tables, 0 table sans RLS |
| Auth Supabase (publishable) | ✅ 200 |
| API REST (secret) | ✅ 200 |
| Inscription **en local** | ✅ compte créé, email de confirmation envoyé |
| Connexion **en prod** | ✅ `checkup-remise@test.geomind.fr` → dashboard |
| Audit express **en prod** | ✅ doctolib.fr → score 73 |
| Analyse complète **en prod** | ✅ lancée → `success` en 4 min |
| `/settings` **en prod** | ✅ redirige vers Compte (plus de 404) |
| Liste d'attente **en prod** | ✅ email capturé, ligne écrite en base (test nettoyé depuis) |
| typecheck / lint / tests / build | ✅ 0 erreur · **587 tests verts** · build OK |

### Le pipeline d'analyse tourne vraiment de bout en bout
Testé en réel sur geomind.fr : crawl Firecrawl → découverte (description, mots-clés, 7 concurrents, 10 prompts neutres) → interrogation des IA → scores → recommandations. Résultat : **Global 60, Technique 85, Contenu 94, Autorité 0**.

**Le 0 en Autorité est un vrai résultat, pas un bug** — j'ai vérifié les 9 réponses IA stockées : aucune ne mentionne geomind.fr. C'est exactement ce que ton produit est censé mesurer, et c'est normal pour un site qui vient de naître.

### Une panne que le check-up n'avait pas pu voir
**ChatGPT ne répondait plus du tout.** OpenRouter a retiré `gpt-4o-mini-search-preview` (404 « No endpoints found ») : le connecteur échouait sur *chaque* prompt, silencieusement, depuis des semaines. Basculé sur `openai/gpt-5-mini` + plugin `web`, testé en réel : 6 sources extraites, ~0,01 $ l'appel. **3 moteurs sur 4 fonctionnent maintenant** (ChatGPT, Gemini, Claude).

### Environnement Vercel — un piège à signaler
`vercel env add` en lui passant la valeur par stdin **enregistrait des variables vides** sans jamais le dire. Trois variables étaient dans cet état : `DATABASE_URL`, `DIRECT_DATABASE_URL`, `PERPLEXITY_API_KEY` — et `NEXT_PUBLIC_SITE_URL` l'était déjà avant mon passage (probablement la cause de redirections d'auth cassées). Corrigé via l'API REST Vercel, valeurs relues et vérifiées non vides. **`DATABASE_URL` est désormais présente en Preview** — le blocage du `MERGE_BLOCKER.md` de mai est levé.

---

## 2. 🔧 Les 8 commits

| Commit | Ce qu'il corrige |
|---|---|
| `docs(checkup)` | Le rapport d'état complet |
| `fix(ai)` | Modèle ChatGPT retiré d'OpenRouter → `gpt-5-mini` + plugin web |
| `fix(auth)` | Plus jamais de « fetch failed » brut : mapping des erreurs GoTrue vers des messages français, fallback « Service momentanément indisponible », erreur d'origine loggée serveur. **4 tests unitaires** |
| `fix(marketing)` | Menu hamburger mobile + header qui ne déborde plus à 375 px |
| `fix(authority)` | Libellé honnête sur la relance (voir §3) |
| `fix(settings)` | `/settings` → `/settings/account` |
| `security(secrets)` | Suppression des 3 fichiers de test aux secrets + hook pre-commit gitleaks |
| `feat(waitlist)` | Lancement freemium complet |

### Lancement freemium — comment c'est fait
- **Page tarifs** : chaque plan payant affiche « BIENTÔT DISPONIBLE » + champ email + « Rejoindre la liste d'attente ». Le plan Gratuit garde son bouton d'inscription normal.
- **Page facturation (dans l'app)** : inscription en un clic (l'email de session est utilisé côté serveur, pas de re-saisie). Section packs de crédits retirée. Le portail Stripe reste accessible aux abonnés existants.
- **Stockage** : table `waitlist_signups` (migration `0020` appliquée), RLS activée sans policy — donc **inaccessible depuis la clé publique**, insertion serveur uniquement. Déduplication sur (email, plan). Événement PostHog `waitlist_joined`.
- Aucun chemin vers un checkout Stripe ne subsiste dans l'UI.

---

## 3. ⚠️ Deux décisions que j'ai prises — à valider

**1. Bouton « Relancer l'autorité » : libellé honnête plutôt que vraie relance partielle.**
Tu m'avais dit « la vraie relance à 150 crédits si c'est propre, sinon libellé honnête ». Ce n'était pas propre : la fonction Inngest `run-authority-analysis` existe mais **son événement `site.analysis.requested` n'est émis nulle part** dans le code, et surtout la vue d'ensemble recalcule le score global à partir des trois piliers — une analyse partielle laisserait des scores incohérents entre onglets. J'ai donc assumé le libellé : « Relancer l'analyse complète (400 crédits) » et la description dit maintenant qu'elle couvre autorité + technique + contenu. Le bouton faisait déjà ça ; il le dit enfin. Une vraie relance partielle est un chantier à part (gestion des scores mixtes).

**2. Base locale sur connexion directe.** Ton routeur/DNS renvoie NXDOMAIN par intermittence sur le CNAME du pooler Supabase (`aws-0-eu-west-1.pooler.supabase.com`) — reproduit plusieurs fois, y compris hors sandbox, alors que `dns.resolve4` trouve bien les IP. En local, `.env.local` utilise donc la connexion directe `db.<ref>.supabase.co`. **Vercel garde le pooler** (le bon choix en serverless). Rien à faire, mais à savoir si tu vois des `ENOTFOUND` en dev.

---

## 4. 🚨 Ce qui reste bloqué de ton côté

### a. Purge de l'historique git — commande à valider avant exécution
Les fichiers sont supprimés de `HEAD`, mais la clé service_role et le mot de passe Postgres de l'**ancien** projet restent dans l'historique. Ils sont **inertes** (projet différent, credentials remplacées), donc ce n'est plus une urgence — mais à faire proprement :

```bash
brew install git-filter-repo
cd "/Users/hophophop/Desktop/GeoMind 2.0"
git filter-repo --invert-paths --path tests/final-audit.ts --path tests/debug-cookies.ts --path tests/take-screenshots.ts --force
git remote add origin https://github.com/Andrea-GeoMind/GeoMind.git
git push origin --force --all
```

⚠️ Réécrit tout l'historique : ferme les autres sessions Claude et supprime les worktrees avant, sinon ils divergent. **Dis-moi quand tu veux, je le fais** — je ne l'ai pas lancé sans ton feu vert.

Le hook gitleaks est déjà actif sur ce worktree. Pour l'activer sur ton dépôt principal :
```bash
cd "/Users/hophophop/Desktop/GeoMind 2.0" && git config core.hooksPath .githooks
```

### b. Placeholders des mentions légales — la liste complète
Il n'y en a que **deux**, tous les deux le SIRET :

| Fichier | Ligne | Contenu affiché en prod |
|---|---|---|
| `app/(marketing)/legal/mentions/page.tsx` | 28 | `SIRET : [à compléter après inscription auto-entrepreneur]` |
| `app/(marketing)/legal/privacy/page.tsx` | 23 | `(SIRET : [à compléter])` |

Le reste est complet et conforme : dénomination, statut micro-entrepreneur, directeur de publication (Andrea Schwertz), contact, hébergeur Vercel avec adresse, médiation de la consommation, droits RGPD. **Une seule zone grise** : l'adresse est « France » — la loi demande l'adresse du siège. Pour un micro-entrepreneur à domicile, tu peux déclarer une adresse de domiciliation.

C'est le **seul blocant légal** au lancement, et il se règle en une ligne dès que tu as le SIRET.

### c. Le reste
| Point | État |
|---|---|
| **Clé Perplexity** | Morte (401). `pplx-placeholder` en attendant. Soit tu régénères, soit tu passes la promesse à « 3 IA » sur la landing (elle dit « 4 IA » partout) |
| **Stripe live** | Bloqué par le SIRET — sans objet tant qu'on lance en freemium |
| **DNS www** | `www.geomind.fr` ne résout toujours pas : ajouter le CNAME chez ton registrar + le domaine dans Vercel |
| **Compte de test** | `checkup-remise@test.geomind.fr` existe en prod avec 1 site et 2 analyses — dis-moi si tu veux que je le supprime |

---

## 5. 💡 Après le lancement (rappel du CHECKUP)

Par ordre d'urgence : mettre à jour Next.js et `@sentry/nextjs` (les 4 vulnérabilités critiques), ajouter les headers de sécurité (CSP, `X-Frame-Options`), revalider chaque saut de redirection dans l'audit public (SSRF), versionner les policies RLS en migration numérotée, et décider du sort de `historyDays` (rétention par plan annoncée mais jamais appliquée).

---

*Vérifications faites en conditions réelles sur geomind.fr — pas en local, pas en théorie.*
