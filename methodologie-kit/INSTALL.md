# Installation du kit méthodologie dans un nouveau projet

> Ce kit transmet la méthodologie de travail Claude Code éprouvée sur Diaphane-DBA vers un nouveau projet — **agnostique de la stack** (frontend, backend, BDD, hébergement).
>
> Temps d'installation : ~30 minutes.

---

## Prérequis

- Repo Git initialisé (`git init` si besoin)
- Claude Code installé et opérationnel (`claude` dans le terminal)
- Python 3 disponible (pour les hooks)
- `gh` CLI installé et authentifié (pour le rituel `/close-ticket`)

---

## Étape 1 — Extraction du kit à la racine du projet cible

Dézipper le kit à la racine du nouveau projet :

```bash
cd /chemin/vers/nouveau-projet
unzip /chemin/vers/methodologie-kit.zip
```

Tu dois voir apparaître :

```
nouveau-projet/
├── methodologie-kit/        # ← le kit complet
│   ├── METHODOLOGIE_TRANSFERT.md
│   ├── INSTALL.md           # ← ce fichier
│   ├── .claude/...
│   ├── scripts/...
│   ├── backend-snippets/...
│   ├── exemplars/...
│   └── memory-seed/...
└── <reste du projet>
```

---

## Étape 2 — Lecture du document central

**Avant toute installation, lire intégralement `methodologie-kit/METHODOLOGIE_TRANSFERT.md`** (environ 15 min). C'est la constitution du projet — règles, principes, conventions. Tout ce qui suit n'est que l'outillage qui rend cette méthodologie opérationnelle.

---

## Étape 3 — Création du `CLAUDE.md` du projet

À la racine du projet cible, créer un `CLAUDE.md` qui contient :

1. **Contexte métier** — quoi, pour qui, pourquoi
2. **Architecture** — stack technique, déploiement, services
3. **Référence à la méthodologie** :

```markdown
## Méthodologie de travail

Voir `methodologie-kit/METHODOLOGIE_TRANSFERT.md` pour les règles complètes.

### Règles non négociables — résumé
- 🛑 Pré-vol obligatoire avant tout chantier (lire PROGRESS.md)
- TDD : test rouge → code → refactor, jamais l'inverse
- Audit pre-push obligatoire (`bash scripts/full-audit.sh`)
- PROGRESS.md mis à jour à chaque fin de ticket
- Branche au nom significatif (jamais aléatoire), supprimée après merge
- Logs avant fixes spéculatifs en prod
```

---

## Étape 4 — Installation des fichiers méthodologie

Depuis la racine du projet cible :

```bash
# Skills custom (project-level — versionnées avec le repo)
mkdir -p .claude/skills/close-ticket .claude/skills/full-audit
cp methodologie-kit/.claude/skills/close-ticket/SKILL.md .claude/skills/close-ticket/
cp methodologie-kit/.claude/skills/full-audit/SKILL.md .claude/skills/full-audit/

# Hook pre-push (bloque git push tant que l'audit n'est pas vert)
mkdir -p .claude/hooks
cp methodologie-kit/.claude/hooks/check_git_push.py .claude/hooks/

# Configuration Claude Code (versionnée)
cp methodologie-kit/.claude/settings.example.json .claude/settings.json

# Scripts d'audit
mkdir -p scripts
cp methodologie-kit/scripts/*.sh scripts/
chmod +x scripts/*.sh

# Exemplars (à utiliser comme modèles)
mkdir -p docs/tickets
cp methodologie-kit/exemplars/PROGRESS.example.md PROGRESS.md
cp methodologie-kit/exemplars/tickets-README.example.md docs/tickets/README.md
cp methodologie-kit/exemplars/TKT-001-EXEMPLE.md docs/tickets/TKT-001-EXEMPLE.md
```

---

## Étape 5 — Paramétrage des scripts d'audit

Les scripts utilisent des variables d'environnement pour rester portables. Créer un fichier `.env.audit` (gitignored) à la racine :

```bash
# .env.audit
export PROD_API_URL="https://api.<ton-projet>.<plateforme>"
export PROD_WEB_URL="https://<ton-projet>.<plateforme>"
export ADMIN_TOKEN="<un-token-aléatoire-fort>"
export E2E_CMD="python3 -m pytest tests/e2e/ -v --tb=short"   # adapter à ta stack de tests E2E
```

Charger avant chaque audit :

```bash
source .env.audit && bash scripts/full-audit.sh
```

Ajouter `.env.audit` au `.gitignore`.

### Personnalisation de `scripts/audit-prod.sh`

Ce script est un **template**. Ouvrir le fichier et ajouter dans la section "LISTE DES ENDPOINTS À AUDITER" les vrais endpoints du projet :

```bash
check GET  "/api/v1/resources"           200 "Liste ressources"
check GET  "/api/v1/resources/123"       200 "Détail ressource"
# etc.
```

---

## Étape 6 — Backend : middleware de capture d'erreurs

Le script `audit-logs.sh` consomme deux endpoints qui doivent exister côté backend :
- `GET /dev/recent-errors` (avec auth admin)
- `GET /dev/request-log` (avec auth admin)

### Si stack FastAPI

```bash
mkdir -p backend/app/middleware
cp methodologie-kit/backend-snippets/error_capture_middleware.py backend/app/middleware/
```

Dans `backend/app/main.py` :

```python
from app.middleware.error_capture_middleware import register_audit_endpoints

app = FastAPI()
register_audit_endpoints(app)
# (puis include_router, etc.)
```

### Si autre stack (Express, Django, Rails, etc.)

Le snippet sert de référence conceptuelle. Implémenter l'équivalent :
- Un ring buffer en mémoire (limité à ~500 entrées)
- Un middleware qui logge chaque requête, capture les 4xx/5xx
- Deux endpoints HTTP exposant ce buffer, protégés par `X-Admin-Token`

Sans ces endpoints, `audit-logs.sh` ne pourra pas fonctionner.

---

## Étape 7 — Mémoire utilisateur (seed)

Identifier le chemin de mémoire utilisateur pour ce projet :

```bash
# Le chemin suit le pattern :
# ~/.claude/projects/<slug-du-chemin-projet>/memory/
# Exemple : projet à /Users/me/Desktop/MonProjet
#       → ~/.claude/projects/-Users-me-Desktop-MonProjet/memory/
```

Créer le dossier et copier le seed :

```bash
PROJECT_SLUG=$(pwd | sed 's|/|-|g')
MEMORY_DIR="$HOME/.claude/projects/${PROJECT_SLUG}/memory"
mkdir -p "$MEMORY_DIR"
cp methodologie-kit/memory-seed/*.md "$MEMORY_DIR/"
```

Au démarrage de la prochaine session Claude Code dans ce projet, ces 11 feedbacks seront chargés automatiquement et Claude appliquera ces règles sans qu'on ait à les redonner.

---

## Étape 8 — Initialisation du suivi de tickets

Ouvrir `PROGRESS.md` (copié à l'étape 4) et l'adapter au projet :
- Mettre à jour la section "État global"
- Renommer "LOT 1" avec le premier thème du projet
- Lister les premiers tickets prévus

Ouvrir `docs/tickets/README.md` et lister les tickets initiaux.

Renommer `docs/tickets/TKT-001-EXEMPLE.md` en premier vrai ticket du projet (ex : `TKT-001-setup-initial.md`) et l'adapter.

---

## Étape 9 — Premier commit du kit

```bash
git add CLAUDE.md PROGRESS.md docs/tickets/ scripts/ .claude/settings.json .claude/skills/ .claude/hooks/ backend/app/middleware/  # adapter selon la stack
git commit -m "chore: bootstrap méthodologie Claude Code (kit transféré de Diaphane-DBA)"
git push
```

---

## Étape 10 — Vérification du hook pre-push

Tester que le hook bloque bien un push sans audit :

```bash
# Sans .audit_passed, le hook doit bloquer :
touch test.txt
git add test.txt && git commit -m "test"
git push
# → ⛔ Lance /full-audit avant de pusher.
```

Puis lancer un audit :

```bash
source .env.audit && bash scripts/full-audit.sh
# → crée .audit_passed
git push
# → ce push passe, et consomme le flag (push suivant rebloqué jusqu'au prochain audit)
```

Rollback :

```bash
git reset --hard HEAD~1
git push --force origin <branche-test>   # ⚠ seulement si branche de test
```

---

## Étape 11 — Test des skills

Ouvrir une session Claude Code dans le projet :

```bash
cd /chemin/vers/nouveau-projet
claude
```

Vérifier que :
- `/close-ticket` apparaît dans `/skills` ou en autocomplete
- `/full-audit` est invocable
- Les feedbacks de mémoire sont actifs (Claude doit, sans qu'on lui demande, parler TDD, audit pre-push, etc.)

Test simple — demander à Claude :
> "Je veux ajouter un endpoint GET /api/health. Comment procèdes-tu ?"

Réponse attendue : Claude devrait évoquer TDD (test d'abord), la création d'un ticket, et le flow audit/push/PROGRESS.md.

---

## Étape 12 — Plugins / skills builtins recommandés

Installer les plugins Claude Code utiles (selon la nature du projet) :

```bash
# Dans Claude Code, taper :
/plugin install anthropic-skills
/plugin install design   # si projet UI
```

Skills à activer/avoir disponibles (cf. METHODOLOGIE § 16) :
- `using-superpowers`, `brainstorming`, `writing-plans`
- `test-driven-development`, `systematic-debugging`, `verification-before-completion`
- `requesting-code-review`, `using-git-worktrees`, `finishing-a-development-branch`
- `anthropic-skills:skill-creator`, `anthropic-skills:consolidate-memory`

---

## Récapitulatif des fichiers déployés

Après installation, l'arborescence doit ressembler à :

```
nouveau-projet/
├── CLAUDE.md                                   ← contexte projet + référence méthodologie
├── PROGRESS.md                                 ← source de vérité d'avancement
├── .audit_passed                               ← marqueur (créé/supprimé par scripts)
├── .env.audit                                  ← variables d'env (gitignored)
├── .claude/
│   ├── settings.json                           ← hooks
│   ├── hooks/
│   │   └── check_git_push.py                   ← bloque push sans audit
│   └── skills/
│       ├── close-ticket/SKILL.md
│       └── full-audit/SKILL.md
├── docs/
│   └── tickets/
│       ├── README.md                           ← index global
│       └── TKT-001-<premier-ticket>.md
├── scripts/
│   ├── full-audit.sh
│   ├── audit-prod.sh
│   └── audit-logs.sh
├── backend/
│   └── app/middleware/
│       └── error_capture_middleware.py         ← si FastAPI ; sinon transposer
└── methodologie-kit/                           ← peut être supprimé après install,
                                                  ou gardé comme référence
```

---

## Checklist d'installation

- [ ] `METHODOLOGIE_TRANSFERT.md` lu intégralement
- [ ] `CLAUDE.md` créé à la racine avec contexte projet
- [ ] Skills `close-ticket` et `full-audit` installés
- [ ] Hook `check_git_push.py` actif (testé sur un push de démo)
- [ ] Scripts d'audit installés et personnalisés (endpoints réels listés)
- [ ] `.env.audit` créé et chargé
- [ ] Middleware backend de capture d'erreurs en place
- [ ] Endpoints `/dev/recent-errors` et `/dev/request-log` répondent
- [ ] `PROGRESS.md` initialisé avec premiers tickets
- [ ] `docs/tickets/README.md` initialisé
- [ ] Au moins un fichier `TKT-NNN-*.md` créé en suivant le gabarit
- [ ] Mémoire seed copiée dans `~/.claude/projects/<slug>/memory/`
- [ ] Plugins skills installés (anthropic-skills, design si pertinent)
- [ ] Premier commit poussé avec le kit
- [ ] Session Claude Code testée : skills + mémoire actives

Une fois cette checklist verte, le projet est en ordre de marche méthodologique. Premier ticket : peut démarrer.
