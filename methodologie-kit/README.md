# Kit Méthodologie Claude Code

Kit transférable pour propager la méthodologie de travail Claude Code (TDD, audit pre-push, tickets versionnés, mémoire persistante) vers un nouveau projet — agnostique de la stack.

## Installation rapide

```bash
# 1. Dézipper le kit à la racine du projet cible
cd /chemin/vers/nouveau-projet
unzip diaphane-methodologie-kit.zip

# 2. Lancer l'installation interactive
bash methodologie-kit/install.sh

# 3. Compléter les 3 étapes manuelles affichées en fin de script
```

L'installation prend **5 minutes** (3 si tu connais déjà tes URLs prod).

## Ce que fait `install.sh`

- ✅ Copie skills + hook + settings dans `.claude/`
- ✅ Copie scripts d'audit dans `scripts/`
- ✅ Initialise `PROGRESS.md` et `docs/tickets/`
- ✅ Crée `.env.audit` avec tes vraies URLs et l'ajoute au `.gitignore`
- ✅ Seed la mémoire utilisateur (12 feedbacks)
- ✅ Crée un squelette `CLAUDE.md`
- ✅ Installe le middleware backend FastAPI (si applicable)
- ✅ Liste les 3 étapes manuelles restantes

## Les 3 étapes manuelles (irréductibles)

1. **Compléter `CLAUDE.md`** — contexte métier + stack (Claude ne peut pas le deviner)
2. **Personnaliser `scripts/audit-prod.sh`** — lister les vrais endpoints de ton API
3. **Brancher le middleware backend** — adapter à ta stack (FastAPI auto, sinon transposer)

## Documentation

- `METHODOLOGIE_TRANSFERT.md` — la constitution (à lire en premier, 15 min)
- `INSTALL.md` — procédure détaillée pas-à-pas (utile si l'installation auto ne marche pas)
- `install.sh` — script d'installation automatique

## Structure du kit

```
methodologie-kit/
├── README.md                            # ← ce fichier
├── install.sh                           # ← installation auto
├── METHODOLOGIE_TRANSFERT.md            # ← constitution
├── INSTALL.md                           # ← procédure manuelle détaillée
├── .claude/
│   ├── settings.example.json
│   ├── hooks/check_git_push.py
│   └── skills/
│       ├── close-ticket/SKILL.md
│       └── full-audit/SKILL.md
├── scripts/
│   ├── full-audit.sh                    # audit pre-push
│   ├── audit-prod.sh                    # curl tous endpoints
│   └── audit-logs.sh                    # erreurs prod
├── backend-snippets/
│   └── error_capture_middleware.py      # FastAPI prêt
├── exemplars/
│   ├── PROGRESS.example.md
│   ├── tickets-README.example.md
│   └── TKT-001-EXEMPLE.md
└── memory-seed/                         # 12 feedbacks
    ├── MEMORY.md
    └── feedback_*.md
```
