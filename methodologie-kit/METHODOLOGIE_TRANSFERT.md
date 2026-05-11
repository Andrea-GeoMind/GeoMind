# Méthodologie de travail Claude Code — Brief de transfert

> **À coller dans `CLAUDE.md` du nouveau projet (ou à lire en premier message).**
> Ce document est **agnostique de la stack** (frontend, backend, BDD, hébergement). Il décrit *comment travailler*, pas *avec quoi*. Adapte uniquement les sections marquées `[À ADAPTER]`.

---

## 0. Principe directeur

> **Les règles décident, l'IA assiste, l'humain arbitre les cas sensibles.**
>
> Aucune ligne de code ne va en production sans :
> 1. un ticket écrit,
> 2. un test échouant rédigé avant le code,
> 3. une trace dans `PROGRESS.md`,
> 4. un audit qui passe au vert.

Tout le reste de ce document n'est qu'une instanciation opérationnelle de cette règle.

---

## 1. 🛑 Pré-vol obligatoire (anti-dérive)

**AVANT toute action sur le projet — planification, spec, ticket, implémentation, audit, refactor — exécuter cette checklist. Aucune exception.**

```bash
# 1. État d'avancement réel (source de vérité)
cat PROGRESS.md | head -100

# 2. Tickets existants
ls docs/tickets/ | sort -V

# 3. LOTs déjà utilisés (interdit d'en créer un en collision)
grep -h "^## Lot\|^## LOT" PROGRESS.md docs/tickets/README.md

# 4. Codes de tickets en vol dans l'historique git
git log --oneline -50

# 5. Spec produit / cahier des charges liés au sujet
ls docs/specs/   # [À ADAPTER] selon ton dossier de specs
```

**Si tu n'as pas lu `PROGRESS.md`, tu n'es PAS prêt à proposer un plan.**

Avant de spécifier une nouvelle feature, vérifier qu'elle n'est pas déjà en place :

```bash
grep -ri "<concept>" backend/ frontend/    # adapter au layout
ls backend/services/ | grep -i "<concept>"
```

**Règle d'or** : aucune proposition de plan, de ticket ou d'architecture sans avoir d'abord vérifié que ce n'est pas déjà fait.

---

## 2. Conventions de tickets et roadmap

### Ordre de lecture pour un nouveau chantier

1. **`PROGRESS.md`** — source de vérité d'avancement (faits / en cours / planifiés). Toujours ouvert en premier.
2. **`docs/tickets/README.md`** — index global des chantiers et lots actifs.
3. **Specs produit** (cahier des charges, PRD, matrices de règles).
4. **`git log --oneline -50`** — repérer les codes de tickets en vol.

### Codes de tickets (peuvent coexister, ne pas en inventer un nouveau sans raison)

| Code | Scope | Stockage |
|------|-------|----------|
| `TKT-NNN` | Chantiers feature majeurs | **Un fichier `.md` par ticket** dans `docs/tickets/` |
| `T-NNN` | Tâches métier transverses légères | Inline dans `PROGRESS.md` |
| `SEC-N` | Sécurité | Commit + tests dédiés |
| `PERF-N`, `FIX-NNN`, `UX-NNN`, `E2E-NNN` | Sprints thématiques | Inline dans `PROGRESS.md` |

**Numérotation des LOTs : globale, jamais par chantier.** Vérifier les LOTs déjà utilisés avant d'en attribuer un. Un LOT regroupe plusieurs tickets liés par un objectif commun.

### Gabarit de ticket obligatoire (`docs/tickets/TKT-NNN-slug.md`)

```markdown
| Lot | Statut | Estimation | Dépendances |
|-----|--------|------------|-------------|
| 11  | À faire | 4h | TKT-042 |

## Contexte
<pourquoi ce ticket existe, quel problème il résout>

## Critères d'acceptation
- [ ] <critère testable 1>
- [ ] <critère testable 2>

## Détail technique
<fichiers touchés, approche, points d'attention>

## Tests
<TDD obligatoire — quels tests écrire en premier, où>

## Tests prod
<commandes curl, scénarios E2E à exécuter APRÈS push>

## Dépendances
<tickets, services externes, migrations>
```

### Format de commit conventionnel obligatoire

`scope(TICKET): description`

Scopes : `feat`, `fix`, `sec`, `perf`, `test`, `chore`, `refactor`, `docs`.

Exemples :
- `feat(TKT-042): création de devis avec lignes multiples`
- `sec(SEC-4): rate limit sur /api/auth/login`
- `perf(PERF-5): verrou advisory sur le scheduler`

### Décisions produit / arbitrages

Tableau `| # | Décision | Conséquence |` daté `(YYYY-MM-DD)` dans le header de section concernée. Si la décision est structurante (impact architecture, scope, contraintes), elle doit aussi être tracée comme mémoire persistante.

---

## 3. ✅ Post-implémentation obligatoire (anti-trou doc)

**À la fin de tout chantier implémenté, AVANT de passer au suivant :**

1. **Cocher dans `PROGRESS.md`** la ligne `[x] TKT-XXX`
2. **Ajouter une ligne au Journal d'exécution** de `PROGRESS.md` :
   `| TKT-XXX | ✅ | YYYY-MM-DD | <résumé technique + nb tests ajoutés> |`
3. **Si l'implémentation s'écarte de la spec** (scope étendu, choix différent) → ajouter une section **"Notes d'implémentation"** datée dans le fichier `TKT-XXX-*.md`
4. **Hotfix urgent sans ticket préalable** → créer rétroactivement un fichier `TKT-XXX-hotfix-<sujet>.md` AVANT de committer, ou minimum une ligne dans PROGRESS.md "Gaps fonctionnels résolus"
5. **Code ajouté sans ticket** (refactor discret, optimisation) → ticket rétroactif OU section "Travaux non ticketés" dans PROGRESS.md

**Règle d'or** : aucune ligne de code en production sans trace écrite dans `PROGRESS.md`. Le commit ne suffit pas — il faut un index humainement lisible.

---

## 4. TDD obligatoire — Red / Green / Refactor

**Aucune exception.** Pour tout code applicatif (backend ET frontend testable) :

1. **Red** — écrire le test qui échoue, vérifier qu'il échoue pour la bonne raison
2. **Green** — écrire le code minimal pour le passer
3. **Refactor** — nettoyer sans casser

**Interdictions :**
- ❌ Écrire le code avant le test
- ❌ Modifier un test pour le faire passer (corriger le code applicatif à la place)
- ❌ Désactiver / skipper un test cassé sans ouvrir un ticket pour le réparer
- ❌ Mocker ce qui devrait être testé en intégration (BDD, auth, paiement…)

**Pyramide de tests :**
- Tests unitaires (rapides, isolés) : moteur de règles, helpers, validations
- Tests d'intégration (BDD réelle, pas de mock) : services, transactions, contraintes
- Tests E2E (navigateur réel) : parcours utilisateur complets — **obligatoires sur tout écran livré**

---

## 5. Audit avant push (NON NÉGOCIABLE)

**JAMAIS de `git push` sans audit vert préalable.**

Mettre en place un script unique `scripts/full-audit.sh` qui enchaîne :

1. Linters & typecheck (frontend + backend)
2. Tests unitaires & intégration
3. Tests E2E (navigateur headless) sur instance locale
4. Audit API (curl sur tous les endpoints)
5. Analyse des logs (erreurs capturées, warnings)

Le script doit créer un marqueur `.audit_passed` (avec timestamp) **seulement si tout est vert**. Le hook pre-push ou la CI refuse le push si le marqueur est absent ou périmé.

**Commandes d'audit à exposer :**

| Commande | Description |
|----------|-------------|
| `bash scripts/full-audit.sh` | Audit complet — gate avant push |
| `bash scripts/audit-api.sh [URL]` | curl sur tous les endpoints (local ou prod) |
| `bash scripts/audit-logs.sh [URL]` | Analyse des erreurs capturées en prod |
| Tests E2E navigateur | Sur tous les écrans livrés |

**Endpoints de debug à exposer côté backend (dev/staging uniquement) :**
- `GET /dev/recent-errors` — erreurs récentes capturées par le middleware (avec `?clear=true`)
- `GET /dev/request-log?last=N` — N dernières requêtes (`?errors_only=true` pour filtrer)

---

## 6. Tests d'intégration prod après chaque push

**Un 200 sur l'API NE GARANTIT PAS que l'UI fonctionne.** Après chaque push qui déclenche un déploiement :

1. Curl tous les endpoints critiques sur l'URL de prod
2. Tests E2E navigateur contre l'URL de prod (au moins les parcours clés)
3. Analyse des logs prod sur 5 minutes après déploiement (`scripts/audit-logs.sh`)
4. Si erreur → rollback ou hotfix immédiat, jamais "on verra demain"

**Règle absolue** : ne jamais débugger un problème prod à l'aveugle. **Demander/lire les logs AVANT de pousser une correction.** Une correction spéculative qui ne se base pas sur les logs est un pari, pas un fix.

---

## 7. Outils de preview / dev server

Les outils de capture d'écran et de navigation programmatique (type `preview_*`, Playwright local) **ne fonctionnent qu'avec des URLs `localhost`**. Ne jamais les appeler avec une URL de production.

| Contexte | Outil correct |
|----------|---------------|
| Vérification UI en local (dev server) | `preview_start` → `preview_screenshot` |
| Vérification prod frontend | Playwright E2E avec URL prod |
| Vérification prod backend | curl / `audit-prod.sh` |

---

## 8. Déploiement

Discipline indépendante de la plateforme cible.

- **Déployer systématiquement** : ne jamais laisser du code mergé non déployé. Push = déploiement = vérification post-déploiement.
- **Healthcheck léger** : exposer un endpoint qui ne touche pas la BDD (ex. `/health/live`). Le healthcheck du provider doit pointer dessus, pas sur un endpoint qui fait une requête SQL.
- **Variables d'environnement** : documenter explicitement quelles variables doivent être configurées sur chaque service (frontend, backend, BDD), avec exemples.
- **Migrations BDD** : jamais de modification de schéma sans test sur staging ET vérification que la migration tourne idempotemment.
- **Caractères spéciaux** : tout générateur de document (PDF, email, export) doit être testé avec données contenant `é è ê à ù ç — " '` etc.

---

## 9. Skill `/close-ticket` — fin de ticket scriptée

Mettre en place une commande/skill `/close-ticket` qui exécute en un seul appel le rituel de fin :

1. **Tests** — `full-audit.sh` doit passer
2. **Merge** sur `main` (sans demander confirmation supplémentaire si l'utilisateur a déjà approuvé le ticket)
3. **Push** → déploiement automatique frontend + backend
4. **Vérification prod** — curl endpoints + tests E2E sur URL prod
5. **Documentation** — cocher `PROGRESS.md` + ajouter ligne au Journal d'exécution
6. **Mise à jour ticket** — section "Notes d'implémentation" si écart avec la spec
7. **Nettoyage branche** — suppression locale ET distante de la branche feature
8. **Complétude** — vérifier les 8 catégories (tests, doc, prod, mémoire si décision structurante…)

Ce rituel répété en fin de chaque ticket évite que la dette documentaire s'accumule.

---

## 10. Discipline sur les branches Git

- **Nommage significatif obligatoire** : `T-NNN-sujet`, `feat/<sujet>`, `fix/<sujet>`. **Jamais** d'identifiant aléatoire (`claude/blissful-shtern-637bfa` est un anti-pattern).
- **Une branche = un ticket** (ou un lot cohérent de petits tickets liés).
- **Nettoyage immédiat après merge** : supprimer la branche en local ET sur le remote. Aucun reliquat toléré.
- **Pas de force-push sur `main`**, jamais.

---

## 11. Documentation finale ≠ tickets

Quand on doit produire une documentation complète du projet, **ne pas se baser uniquement sur les tickets**. Les tickets décrivent ce qui a été *demandé*, pas ce qui est en *production*.

Toujours :

1. **Lire le code applicatif** (`backend/`, `frontend/`) — source de vérité unique
2. Utiliser les tickets comme **index/contexte**, pas comme source
3. Croiser avec `PROGRESS.md` (journal de décisions)
4. Croiser avec `git log` (hotfixes et refactos non ticketés)
5. Flagger explicitement les zones où code et tickets divergent

Si le code contient un service `xyz_service.py` sans ticket dédié, il doit quand même apparaître dans la doc finale. **Le ticket n'est pas une condition d'existence du code.**

---

## 12. Rôle du LLM (Claude) dans le projet

Le LLM intervient **uniquement** sur les tâches souples :
- Formulation de libellés, copy, messages d'erreur
- Détection d'incohérences dans des données
- Lecture documentaire / OCR / extraction
- Rédaction de demandes d'informations manquantes
- Explication d'anomalies à un humain

**Interdit au LLM** : décision d'éligibilité, calcul fiscal/financier, émission de document légal, contournement d'une règle bloquante, génération de valeur monétaire non vérifiée.

Toute règle métier critique doit être codée en dur dans un moteur de règles déterministe, jamais déléguée au LLM.

---

## 13. Mémoire persistante (auto-memory Claude Code)

Utiliser le système de mémoire `~/.claude/projects/<projet>/memory/` pour persister :

- **Profil utilisateur** : rôle, contexte, préférences durables
- **Décisions structurantes** : choix d'architecture, arbitrages produit (datés)
- **Feedback de comportement** : "fais X / ne fais pas Y" appris en conversation
- **Références externes** : URLs de services, dashboards, projets BDD, IDs cloud
- **URLs à mémoriser immédiatement** : dès qu'une URL apparaît (Vercel, dashboard cloud, repo, etc.), la stocker. Ne jamais dire "je n'ai pas l'URL".

**Ne pas mémoriser** : conventions de code (lisibles dans le repo), historique git, état éphémère de la conversation courante.

---

## 14. Autonomie et style d'exécution

Comportement attendu de Claude dans ce projet :

- **Avancer sans demander validation** sur les tâches techniques claires. Questions uniquement pour les vrais arbitrages produit.
- **Merger sans demander confirmation supplémentaire** dès qu'un ticket est approuvé.
- **Toujours déployer après une modification** — pas de code mergé qui dort.
- **Logs avant fixes spéculatifs** — si prod down, lire les logs avant de pousser quoi que ce soit.
- **Ton concis** — pas de résumé creux en fin de réponse, pas de narration de pensée. Le diff parle.
- **[À ADAPTER selon la langue du projet]** Français avec accents corrects dans toute UI livrée (é, è, ê, à, ù, ç).

---

## 15. Règles non négociables — résumé exécutif

- ❌ **JAMAIS** de `git push` sans audit vert préalable
- ❌ **JAMAIS** de modification de schéma BDD sans migration testée
- ❌ **JAMAIS** modifier un test pour le faire passer — corriger le code
- ❌ **JAMAIS** débugger un problème prod sans lire les logs d'abord
- ❌ **JAMAIS** de code en production sans ligne correspondante dans `PROGRESS.md`
- ❌ **JAMAIS** de branche au nom aléatoire — toujours `T-NNN-sujet` ou `feat/sujet`
- ❌ **JAMAIS** de feature inventée — vérifier d'abord qu'elle n'existe pas déjà
- ✅ **TOUJOURS** TDD : test rouge → code → refactor
- ✅ **TOUJOURS** tester en prod après push (UI + API + logs)
- ✅ **TOUJOURS** cocher `PROGRESS.md` + Journal d'exécution en fin de ticket
- ✅ **TOUJOURS** nettoyer la branche après merge (local + remote)

---

## 16. Skills Claude Code à activer

Ces skills sont des **comportements outillés** de Claude Code qui supportent la méthodologie. À activer dès le bootstrap du projet (les builtins sont disponibles partout, les customs sont à créer dans `.claude/skills/`).

### 🔥 Skills à invoquer en permanence — la boucle quotidienne

Ces skills doivent être **réflexes**, pas optionnels. Si tu ne les invoques pas, tu travailles mal.

| Skill | Déclencheur réflexe | Fréquence |
|-------|---------------------|-----------|
| `using-superpowers` | **Tout début de conversation, AVANT toute autre réponse** (même les questions de clarification) | À chaque session |
| `brainstorming` | "Je veux faire X / créer Y / ajouter Z" | À chaque nouvelle feature |
| `writing-plans` | Tâche multi-étapes, multi-fichiers, ou >5 tool calls anticipés | À chaque ticket non trivial |
| `test-driven-development` | "Implémenter X" / "Corriger le bug Y" | À chaque code applicatif touché |
| `systematic-debugging` | Bug, test rouge, comportement inattendu, erreur prod | À chaque anomalie |
| `verification-before-completion` | Avant de dire "c'est fait / ça passe / ça marche" | Avant chaque claim de succès |
| `/full-audit` (custom) | Avant `git push` | Avant chaque push |
| `/close-ticket` (custom) | Implémentation terminée, prête à intégrer | Fin de chaque ticket |

**Règle mnémotechnique** : `brainstorm → plan → TDD → code → verify → audit → close`. Chaque flèche correspond à une skill invoquée.

### 🛠️ Skills d'outillage méta — à utiliser périodiquement

| Skill | Quand l'invoquer |
|-------|------------------|
| `anthropic-skills:skill-creator` | Pour créer une nouvelle skill custom (ex. ton `/close-ticket`, `/full-audit`) ou en améliorer une existante. À utiliser dès qu'un rituel se répète ≥3 fois. |
| `anthropic-skills:consolidate-memory` | Passage réflexif sur les mémoires — fusion des doublons, correction des faits périmés, nettoyage de l'index. À lancer ~tous les 15 jours ou quand `MEMORY.md` dépasse 30 lignes. |
| `anthropic-skills:schedule` | Création de tâches planifiées (cron) — audits hebdo, vérifs périodiques, rappels. |
| `writing-skills` | Quand tu modifies ou crées une skill — assure le bon format de frontmatter et de description. |
| `using-git-worktrees` | Avant feature qui doit s'isoler du workspace courant (review en cours sur main, hotfix simultané). |
| `finishing-a-development-branch` | Implémentation terminée — propose merge/PR/cleanup structuré (souvent enchaîné avec `/close-ticket`). |
| `dispatching-parallel-agents` | ≥2 lectures/recherches indépendantes — gain de temps massif. |
| `requesting-code-review` + `receiving-code-review` | Avant merge d'une feature critique + à réception du feedback. |

### 🎨 Skills domaine — à activer selon la nature du projet

| Domaine | Skills | Cas d'usage |
|---------|--------|-------------|
| **UI / Design** | `frontend-design`, `refactoring-ui`, `ui-ux-pro-max`, `ux-heuristics`, `design:design-critique`, `design:design-system`, `design:design-handoff`, `design:ux-copy` | Tout écran livré au utilisateur final. `design:ux-copy` notamment pour rédiger boutons, erreurs, empty states. |
| **Accessibilité** | `accessibility`, `design:accessibility-review` | Audit avant livraison de toute page publique. |
| **Performance / SEO** | `performance`, `core-web-vitals`, `web-quality-audit`, `seo` | Avant mise en prod publique. |
| **Recherche utilisateur** | `design:user-research`, `design:research-synthesis` | Avant gros chantiers produit, pour ancrer dans le réel. |
| **Architecture** | `clean-architecture`, `domain-driven-design`, `clean-code`, `refactoring-patterns` | Refactor de fond, découpage en modules/services. |
| **Sécurité** | `security-review`, `best-practices` | Avant push de tout endpoint exposé, toute manipulation d'auth/paiement. |
| **API Anthropic** | `claude-api` | Si le projet intègre l'API Claude directement (au-delà de Claude Code lui-même). |
| **Documents** | `anthropic-skills:pptx`, `xlsx`, `docx`, `pdf` | Manipulation de fichiers bureautiques (génération factures PDF, exports XLSX, etc.). |
| **Habitudes produit** | `hooked-ux` | Conception de boucles d'engagement (notifications, rétention). |

### Skills builtins indispensables (déjà disponibles dans Claude Code)

| Skill | Quand l'invoquer | Rôle dans la méthodologie |
|-------|------------------|---------------------------|
| `brainstorming` | **Avant toute création de feature, composant, ou modification de comportement** | Explore intention, exigences, design AVANT d'écrire du code. Bloque l'implémentation prématurée. |
| `writing-plans` | Dès qu'une tâche fait >5 tool calls ou touche plusieurs fichiers | Produit un plan écrit qu'on peut relire et corriger avant d'agir. |
| `planning-with-files` | Projets multi-étapes avec recherche / synthèse | Crée `task_plan.md`, `findings.md`, `progress.md` — survit à `/clear`. |
| `test-driven-development` | **Avant toute implémentation feature ou bugfix** | Force Red/Green/Refactor — pilier du § 4. |
| `systematic-debugging` | À chaque bug, test failure, comportement inattendu, AVANT de proposer un fix | Force le diagnostic avant la correction — pilier du § 6 (logs avant fixes). |
| `verification-before-completion` | **Avant toute affirmation "c'est fait / ça passe"**, avant commit, avant PR | Exige une commande de vérification + sortie observée — pilier du § 5. |
| `executing-plans` | Une fois le plan validé, pour l'exécuter avec checkpoints | Implémentation disciplinée d'un plan écrit. |
| `subagent-driven-development` | Plans avec tâches indépendantes parallélisables | Délégation à des subagents pour gain de temps. |
| `dispatching-parallel-agents` | ≥2 tâches indépendantes sans état partagé | Parallélisation des lectures / recherches. |
| `using-git-worktrees` | Avant feature ayant besoin d'isolation du workspace courant | Crée un worktree isolé — évite de polluer la branche en cours. |
| `finishing-a-development-branch` | Implémentation terminée, tests verts, prêt à intégrer | Propose les options merge/PR/cleanup de manière structurée. |
| `requesting-code-review` | Avant merge d'une feature majeure | Auto-review structurée contre les exigences du ticket. |
| `receiving-code-review` | À réception de feedback de review | Évite l'acceptation aveugle — vérifie chaque suggestion. |
| `clean-code` | Lors de refactor ou review de lisibilité | SRP, naming, fonctions courtes, commentaires disciplinés. |
| `refactoring-patterns` | Pour appliquer une transformation nommée sans changer le comportement | Extract method, replace conditional, etc. — refactor safe. |

### Skills customs à créer dans `.claude/skills/`

| Skill custom | Action | Description courte |
|--------------|--------|--------------------|
| `close-ticket` | Fin de ticket scripté (§ 9) | merge + push + deploy + doc + nettoyage branche + vérif complétude |
| `full-audit` | Audit pre-push (§ 5) | linters + typecheck + tests + E2E + audit API + logs |
| `pre-flight` _(optionnel)_ | Pré-vol (§ 1) | lit PROGRESS.md, liste tickets, LOTs, git log récent |

**Squelette minimal d'un skill custom** (`.claude/skills/close-ticket/SKILL.md`) :

```markdown
---
name: close-ticket
description: Fin de ticket — tests, merge, push, deploy, doc PROGRESS.md, nettoyage branche.
---

# /close-ticket

Étapes à exécuter dans l'ordre, sans demander de confirmation supplémentaire :

1. Vérifier que `full-audit.sh` passe au vert (sinon stop)
2. `git checkout main && git pull && git merge --no-ff <branche>`
3. `git push` (déclenche déploiement auto)
4. Vérifier prod : curl endpoints critiques + tests E2E sur URL prod
5. Cocher `[x]` dans `PROGRESS.md` pour le ticket fermé
6. Ajouter ligne au Journal d'exécution : `| TKT-XXX | ✅ | YYYY-MM-DD | <résumé> |`
7. Si écart avec la spec → section "Notes d'implémentation" dans `TKT-XXX-*.md`
8. Supprimer la branche : `git branch -d <branche> && git push origin --delete <branche>`

Stopper et alerter si une étape échoue.
```

### Skills domaine selon le projet (à activer si pertinent)

À installer selon la nature du produit :

- **UI / front lourd** : `frontend-design`, `refactoring-ui`, `ui-ux-pro-max`, `ux-heuristics`, `accessibility`
- **Performance web** : `performance`, `core-web-vitals`, `web-quality-audit`, `seo`
- **Architecture / domaine** : `clean-architecture`, `domain-driven-design`, `software-design-philosophy`
- **Sécurité** : `security-review` (builtin), `best-practices`
- **API Anthropic / agents** : `claude-api`
- **Documents bureautiques** : `pptx`, `xlsx`, `docx`, `pdf`

### Hooks recommandés (`.claude/settings.json`)

Pour automatiser la discipline plutôt que de la rappeler à chaque session :

- **Pre-push hook** : refuser le push si `.audit_passed` absent ou daté de plus de N minutes
- **Post-tool hook sur Write/Edit** : si fichier modifié dans `backend/` ou `frontend/src/`, rappeler "test associé écrit en premier ?"
- **SessionStart hook** : afficher `PROGRESS.md | head -30` automatiquement

---

## 17. Fichiers à créer en bootstrap

Au démarrage du nouveau projet, créer ces fichiers vides ou avec un squelette :

```
CLAUDE.md                          # Ce document + contexte métier projet
PROGRESS.md                        # Source de vérité d'avancement
docs/
  tickets/
    README.md                      # Index global des tickets et LOTs
    TKT-001-<premier-ticket>.md    # Premier ticket (utilise le gabarit § 2)
  specs/                           # [À ADAPTER] PRD, matrices de règles, etc.
scripts/
  full-audit.sh                    # Audit complet — gate pre-push
  audit-api.sh                     # curl tous endpoints
  audit-logs.sh                    # Analyse logs prod
.claude/
  skills/
    close-ticket/                  # Skill du § 9
```

Squelette `PROGRESS.md` :

```markdown
# PROGRESS — <Nom du projet>

## État global
<résumé en 5 lignes de où on en est>

## Tickets

### Lot 1 — <thème>
- [ ] TKT-001 — <titre> — <statut>
- [ ] TKT-002 — <titre> — <statut>

## Journal d'exécution

| Ticket | Statut | Date | Notes |
|--------|--------|------|-------|
|        |        |      |       |

## Décisions produit

| # | Décision | Conséquence | Date |
|---|----------|-------------|------|
|   |          |             |      |

## Travaux non ticketés
<refactors, optimisations sans ticket préalable>

## Gaps fonctionnels résolus
<hotfixes sans ticket préalable>
```

---

## 18. Pourquoi cette méthodologie fonctionne

- **PROGRESS.md évite la double implémentation** — pas de feature refaite parce qu'oubliée
- **TDD évite les régressions** — chaque bug devient un test pérenne
- **Audit pre-push évite les déploiements rouges** — la CI n'est pas la première ligne de défense
- **Test en prod systématique évite les "ça marchait en local"** — l'environnement réel est la vérité
- **Tickets `.md` versionnés évitent la dérive entre spec et code** — la trace écrite force la cohérence
- **`/close-ticket` évite la dette documentaire** — le rituel est scripté, pas optionnel
- **Logs avant fix évite les fausses corrections** — on ne tire pas dans le noir
- **Mémoire persistante évite la répétition** — Claude apprend de session en session

C'est la **discipline du processus** qui produit la qualité, pas le talent du moment.
