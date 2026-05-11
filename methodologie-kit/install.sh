#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════╗
# ║  Installation automatique du kit méthodologie          ║
# ║                                                          ║
# ║  Usage :                                                ║
# ║    1. Dézipper le kit à la racine du projet cible       ║
# ║    2. cd <projet> && bash methodologie-kit/install.sh   ║
# ║                                                          ║
# ║  Le script :                                            ║
# ║    - Copie tous les fichiers méthodologie               ║
# ║    - Demande interactivement les variables sensibles    ║
# ║    - Initialise PROGRESS.md, docs/tickets/              ║
# ║    - Seed la mémoire utilisateur Claude Code            ║
# ║    - Crée .env.audit et l'ajoute au .gitignore          ║
# ║    - Affiche les 3 étapes manuelles restantes           ║
# ╚══════════════════════════════════════════════════════════╝
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(pwd)"

# ── Couleurs ─────────────────────────────────────────────────────────
green()  { printf "\033[32m%s\033[0m" "$1"; }
red()    { printf "\033[31m%s\033[0m" "$1"; }
yellow() { printf "\033[33m%s\033[0m" "$1"; }
bold()   { printf "\033[1m%s\033[0m" "$1"; }
blue()   { printf "\033[34m%s\033[0m" "$1"; }

ask() {
    local prompt="$1" default="${2:-}" answer
    if [ -n "$default" ]; then
        read -p "$(blue '?') ${prompt} [${default}] : " answer
        echo "${answer:-$default}"
    else
        read -p "$(blue '?') ${prompt} : " answer
        echo "$answer"
    fi
}

confirm() {
    local prompt="$1" answer
    read -p "$(blue '?') ${prompt} [y/N] : " answer
    [[ "$answer" =~ ^[yY] ]]
}

step() {
    echo ""
    echo "$(bold "━━━ $1 ━━━")"
}

# ── Sanity checks ────────────────────────────────────────────────────
echo ""
echo "$(bold '╔══════════════════════════════════════════════════════════╗')"
echo "$(bold '║       Installation du kit méthodologie Claude Code      ║')"
echo "$(bold '╚══════════════════════════════════════════════════════════╝')"
echo ""
echo "  Projet cible : ${PROJECT_DIR}"
echo "  Source kit   : ${SCRIPT_DIR}"
echo ""

if [ ! -d "${SCRIPT_DIR}/.claude" ]; then
    echo "$(red '✗ Le dossier methodologie-kit/.claude est introuvable.')"
    echo "  Vérifie que tu lances ce script depuis la racine du projet"
    echo "  et que methodologie-kit/ contient bien le kit complet."
    exit 1
fi

if [ ! -d "${PROJECT_DIR}/.git" ]; then
    echo "$(yellow '⚠ Aucun repo Git détecté dans ce dossier.')"
    if confirm "Lancer 'git init' maintenant ?"; then
        git init
    else
        echo "$(red 'Abandon — un repo Git est requis.')"
        exit 1
    fi
fi

if ! confirm "Confirmer l'installation dans ${PROJECT_DIR} ?"; then
    echo "Abandon."
    exit 0
fi

# ── Saisie interactive ───────────────────────────────────────────────
step "Configuration interactive"

PROJECT_NAME=$(ask "Nom du projet (pour CLAUDE.md, PROGRESS.md)" "$(basename "${PROJECT_DIR}")")
PROD_API_URL=$(ask "URL API prod (laisser vide si pas encore déployé)" "")
PROD_WEB_URL=$(ask "URL Web prod (laisser vide si pas encore déployé)" "")
ADMIN_TOKEN=$(ask "Token admin pour endpoints /dev/* (généré si vide)" "$(openssl rand -hex 16 2>/dev/null || echo 'change-me-$(date +%s)')")
E2E_CMD=$(ask "Commande de lancement des tests E2E" "python3 -m pytest tests/e2e/ -v --tb=short")

echo ""
echo "Stack backend (pour décider d'installer le middleware FastAPI) :"
echo "  1) FastAPI (Python)"
echo "  2) Autre (Express, Django, Rails…) — middleware à transposer manuellement"
BACKEND_CHOICE=$(ask "Choix" "1")

# ── Copie des fichiers ───────────────────────────────────────────────
step "Copie des fichiers méthodologie"

mkdir -p "${PROJECT_DIR}/.claude/skills/close-ticket" \
         "${PROJECT_DIR}/.claude/skills/full-audit" \
         "${PROJECT_DIR}/.claude/hooks" \
         "${PROJECT_DIR}/scripts" \
         "${PROJECT_DIR}/docs/tickets"

cp "${SCRIPT_DIR}/.claude/skills/close-ticket/SKILL.md" "${PROJECT_DIR}/.claude/skills/close-ticket/"
cp "${SCRIPT_DIR}/.claude/skills/full-audit/SKILL.md" "${PROJECT_DIR}/.claude/skills/full-audit/"
cp "${SCRIPT_DIR}/.claude/hooks/check_git_push.py" "${PROJECT_DIR}/.claude/hooks/"

if [ -f "${PROJECT_DIR}/.claude/settings.json" ]; then
    echo "  $(yellow '⚠') .claude/settings.json existe déjà — sauvegardé en .claude/settings.json.bak"
    cp "${PROJECT_DIR}/.claude/settings.json" "${PROJECT_DIR}/.claude/settings.json.bak"
fi
cp "${SCRIPT_DIR}/.claude/settings.example.json" "${PROJECT_DIR}/.claude/settings.json"

cp "${SCRIPT_DIR}/scripts/"*.sh "${PROJECT_DIR}/scripts/"
chmod +x "${PROJECT_DIR}/scripts/"*.sh

echo "  $(green '✓') Skills, hook, settings, scripts installés"

# ── PROGRESS.md et tickets ───────────────────────────────────────────
if [ -f "${PROJECT_DIR}/PROGRESS.md" ]; then
    echo "  $(yellow '⚠') PROGRESS.md existe déjà — non écrasé"
else
    sed "s|<Nom du projet>|${PROJECT_NAME}|g" "${SCRIPT_DIR}/exemplars/PROGRESS.example.md" > "${PROJECT_DIR}/PROGRESS.md"
    echo "  $(green '✓') PROGRESS.md créé"
fi

if [ -f "${PROJECT_DIR}/docs/tickets/README.md" ]; then
    echo "  $(yellow '⚠') docs/tickets/README.md existe déjà — non écrasé"
else
    cp "${SCRIPT_DIR}/exemplars/tickets-README.example.md" "${PROJECT_DIR}/docs/tickets/README.md"
    cp "${SCRIPT_DIR}/exemplars/TKT-001-EXEMPLE.md" "${PROJECT_DIR}/docs/tickets/TKT-001-EXEMPLE.md"
    echo "  $(green '✓') docs/tickets/ initialisé (README + TKT-001-EXEMPLE)"
fi

# ── Middleware backend si FastAPI ────────────────────────────────────
if [ "$BACKEND_CHOICE" = "1" ]; then
    step "Installation middleware FastAPI"
    BACKEND_PATH=$(ask "Chemin du dossier backend" "backend/app")
    MIDDLEWARE_DIR="${PROJECT_DIR}/${BACKEND_PATH}/middleware"
    if [ -d "${PROJECT_DIR}/${BACKEND_PATH}" ]; then
        mkdir -p "${MIDDLEWARE_DIR}"
        cp "${SCRIPT_DIR}/backend-snippets/error_capture_middleware.py" "${MIDDLEWARE_DIR}/"
        echo "  $(green '✓') Middleware copié dans ${BACKEND_PATH}/middleware/"
        echo ""
        echo "  $(yellow 'À FAIRE :') ajouter dans ${BACKEND_PATH}/main.py :"
        echo ""
        echo "    from app.middleware.error_capture_middleware import register_audit_endpoints"
        echo "    register_audit_endpoints(app)"
    else
        echo "  $(yellow '⚠') Dossier ${BACKEND_PATH} introuvable — middleware non installé"
        echo "       Tu le trouveras dans methodologie-kit/backend-snippets/"
    fi
else
    echo ""
    echo "  $(yellow 'À FAIRE manuellement :') transposer methodologie-kit/backend-snippets/error_capture_middleware.py"
    echo "       sur ta stack — implémenter un ring buffer + middleware + 2 endpoints"
    echo "       /dev/recent-errors et /dev/request-log protégés par X-Admin-Token."
fi

# ── .env.audit ───────────────────────────────────────────────────────
step "Configuration .env.audit"

cat > "${PROJECT_DIR}/.env.audit" <<EOF
# Variables d'audit (gitignored)
# Chargées avant les scripts : source .env.audit && bash scripts/full-audit.sh

export PROD_API_URL="${PROD_API_URL}"
export PROD_WEB_URL="${PROD_WEB_URL}"
export ADMIN_TOKEN="${ADMIN_TOKEN}"
export E2E_CMD="${E2E_CMD}"
EOF
echo "  $(green '✓') .env.audit créé"

# Ajout au .gitignore
if [ ! -f "${PROJECT_DIR}/.gitignore" ] || ! grep -q "^\.env\.audit$" "${PROJECT_DIR}/.gitignore"; then
    echo "" >> "${PROJECT_DIR}/.gitignore"
    echo "# Méthodologie kit" >> "${PROJECT_DIR}/.gitignore"
    echo ".env.audit" >> "${PROJECT_DIR}/.gitignore"
    echo ".audit_passed" >> "${PROJECT_DIR}/.gitignore"
    echo "  $(green '✓') .env.audit et .audit_passed ajoutés au .gitignore"
fi

# ── Mémoire utilisateur ──────────────────────────────────────────────
step "Seed de la mémoire utilisateur Claude Code"

PROJECT_SLUG=$(echo "${PROJECT_DIR}" | sed 's|/|-|g')
MEMORY_DIR="${HOME}/.claude/projects/${PROJECT_SLUG}/memory"

mkdir -p "${MEMORY_DIR}"

if [ -f "${MEMORY_DIR}/MEMORY.md" ]; then
    echo "  $(yellow '⚠') Mémoire existante détectée — sauvegardée en MEMORY.md.bak"
    cp "${MEMORY_DIR}/MEMORY.md" "${MEMORY_DIR}/MEMORY.md.bak"
fi

cp "${SCRIPT_DIR}/memory-seed/"*.md "${MEMORY_DIR}/"
echo "  $(green '✓') 12 fichiers de mémoire copiés dans ${MEMORY_DIR}"

# ── CLAUDE.md ────────────────────────────────────────────────────────
step "Création CLAUDE.md (squelette)"

if [ -f "${PROJECT_DIR}/CLAUDE.md" ]; then
    echo "  $(yellow '⚠') CLAUDE.md existe déjà — non écrasé"
    echo "       Ajouter manuellement la section 'Méthodologie de travail' (voir INSTALL.md § 3)"
else
    cat > "${PROJECT_DIR}/CLAUDE.md" <<EOF
# ${PROJECT_NAME} — CLAUDE.md

## Contexte métier

<À COMPLÉTER : quoi, pour qui, pourquoi>

## Architecture

<À COMPLÉTER : stack technique, services, déploiement>

## Méthodologie de travail

Voir [\`methodologie-kit/METHODOLOGIE_TRANSFERT.md\`](methodologie-kit/METHODOLOGIE_TRANSFERT.md) pour les règles complètes.

### Règles non négociables — résumé

- 🛑 **Pré-vol obligatoire** avant tout chantier : lire \`PROGRESS.md\` et l'index des tickets
- **TDD** : test rouge → code → refactor, jamais l'inverse
- **Audit pre-push obligatoire** : \`source .env.audit && bash scripts/full-audit.sh\`
- **PROGRESS.md** mis à jour à chaque fin de ticket (utiliser \`/close-ticket\`)
- **Branche au nom significatif** (jamais aléatoire), supprimée après merge
- **Logs avant fixes spéculatifs** en prod — ne jamais débugger à l'aveugle

### Commandes utiles

\`\`\`bash
# Audit complet (gate pre-push)
source .env.audit && bash scripts/full-audit.sh

# Audit API seul
bash scripts/audit-prod.sh

# Audit logs prod
bash scripts/audit-logs.sh
\`\`\`

### Endpoints d'audit (backend)

- \`GET /dev/recent-errors\` — erreurs récentes (X-Admin-Token requis)
- \`GET /dev/request-log\` — N dernières requêtes
EOF
    echo "  $(green '✓') CLAUDE.md créé (à compléter avec contexte métier + stack)"
fi

# ── Test du hook ─────────────────────────────────────────────────────
step "Vérification du hook pre-push"

if python3 -c "import sys" 2>/dev/null; then
    echo "  $(green '✓') Python 3 disponible — hook check_git_push.py opérationnel"
else
    echo "  $(red '✗') Python 3 introuvable — installer Python 3 avant d'utiliser le hook"
fi

# ── Rapport final ────────────────────────────────────────────────────
echo ""
echo "$(bold '╔══════════════════════════════════════════════════════════╗')"
echo "$(bold '║                  INSTALLATION TERMINÉE                  ║')"
echo "$(bold '╚══════════════════════════════════════════════════════════╝')"
echo ""
echo "$(green '✓ Fichiers installés :')"
echo "    .claude/skills/close-ticket/SKILL.md"
echo "    .claude/skills/full-audit/SKILL.md"
echo "    .claude/hooks/check_git_push.py"
echo "    .claude/settings.json"
echo "    scripts/full-audit.sh, audit-prod.sh, audit-logs.sh"
echo "    PROGRESS.md, docs/tickets/README.md, docs/tickets/TKT-001-EXEMPLE.md"
echo "    CLAUDE.md (squelette)"
echo "    .env.audit (gitignored)"
echo ""
echo "$(green '✓ Mémoire utilisateur seedée :')"
echo "    ${MEMORY_DIR}/ (12 fichiers)"
echo ""
echo "$(yellow '⚠ 3 étapes manuelles restantes (impossibles à automatiser) :')"
echo ""
echo "  $(bold '1.') Compléter $(blue 'CLAUDE.md') avec :"
echo "       - Contexte métier (quoi / pour qui / pourquoi)"
echo "       - Architecture (stack, déploiement)"
echo ""
echo "  $(bold '2.') Personnaliser $(blue 'scripts/audit-prod.sh') :"
echo "       - Ouvrir le fichier"
echo "       - Section 'LISTE DES ENDPOINTS À AUDITER'"
echo "       - Ajouter les vrais endpoints du projet"
echo ""
if [ "$BACKEND_CHOICE" = "1" ]; then
    echo "  $(bold '3.') Brancher le middleware dans $(blue "${BACKEND_PATH}/main.py") :"
    echo "       from app.middleware.error_capture_middleware import register_audit_endpoints"
    echo "       register_audit_endpoints(app)"
else
    echo "  $(bold '3.') Transposer le middleware d'erreurs sur ta stack backend"
    echo "       (voir methodologie-kit/backend-snippets/error_capture_middleware.py)"
fi
echo ""
echo "$(bold 'Puis :')"
echo "    git add . && git commit -m 'chore: bootstrap méthodologie Claude Code'"
echo "    source .env.audit && bash scripts/full-audit.sh   # premier audit"
echo "    git push                                          # passe si audit vert"
echo ""
echo "$(bold 'Et enfin :')"
echo "    claude   # nouvelle session Claude Code — la mémoire seedée sera active"
echo ""
echo "$(bold 'Documentation complète :') methodologie-kit/METHODOLOGIE_TRANSFERT.md"
echo "$(bold 'Procédure détaillée :')   methodologie-kit/INSTALL.md"
echo ""
