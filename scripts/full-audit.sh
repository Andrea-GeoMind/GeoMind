#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════╗
# ║  AUDIT COMPLET — template générique                     ║
# ║  1. Audit API prod (curl tous les endpoints)            ║
# ║  2. Tests E2E navigateur (contre frontend prod)         ║
# ║  3. Audit logs prod (erreurs post-E2E)                  ║
# ║                                                          ║
# ║  Variables requises (à définir avant exécution) :       ║
# ║    PROD_API_URL    — URL backend prod                   ║
# ║    PROD_WEB_URL    — URL frontend prod                  ║
# ║    ADMIN_TOKEN     — token pour les endpoints /dev/*    ║
# ║    E2E_CMD         — commande de lancement des tests    ║
# ║                      E2E (ex: python3 -m pytest         ║
# ║                      tests/e2e/ -v --tb=short)          ║
# ╚══════════════════════════════════════════════════════════╝
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# ── Charger les credentials locaux pour les fixtures E2E (Supabase, etc.) ──
if [ -f "$PROJECT_DIR/.env.local" ]; then
  set -o allexport
  # shellcheck disable=SC1090
  source "$PROJECT_DIR/.env.local"
  set +o allexport
fi

# ── Configuration (override via env ou argv) ──
BASE_URL="${1:-${PROD_API_URL:?PROD_API_URL non défini — exporter ou passer en argv}}"
WEB_URL="${PROD_WEB_URL:-$BASE_URL}"
ADMIN_TOKEN="${ADMIN_TOKEN:-change-me}"
# webkit non supporté sur macOS 12 → chromium uniquement
E2E_CMD="${E2E_CMD:-PLAYWRIGHT_BASE_URL=${WEB_URL} pnpm playwright test --project=chromium --reporter=line}"

green()  { printf "\033[32m%s\033[0m" "$1"; }
red()    { printf "\033[31m%s\033[0m" "$1"; }
yellow() { printf "\033[33m%s\033[0m" "$1"; }
bold()   { printf "\033[1m%s\033[0m" "$1"; }

API_OK=true
E2E_OK=true
LOGS_OK=true

echo ""
echo "$(bold '╔══════════════════════════════════════════════════════════╗')"
echo "$(bold '║                  AUDIT COMPLET                          ║')"
echo "$(bold '╚══════════════════════════════════════════════════════════╝')"
echo ""
echo "  Cible API:       ${BASE_URL}"
echo "  Cible Frontend:  ${WEB_URL}"
echo "  Date:            $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# ── Vider le buffer d'erreurs avant le run ──
curl -s -H "X-Admin-Token: ${ADMIN_TOKEN}" "${BASE_URL}/dev/recent-errors?clear=true" > /dev/null 2>&1

# ══════════════════════════════════════════════════════════
#  PHASE 1 : AUDIT API
# ══════════════════════════════════════════════════════════
echo "$(bold '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')"
echo "$(bold '  PHASE 1/3 : AUDIT API')"
echo "$(bold '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')"
echo ""

if ! bash "$SCRIPT_DIR/audit-prod.sh" "$BASE_URL"; then
    API_OK=false
    echo ""
    echo "  $(red '⛔ AUDIT API : des endpoints échouent')"
    echo "  $(yellow 'On continue quand même avec les tests E2E...')"
fi

# ══════════════════════════════════════════════════════════
#  PHASE 2 : TESTS E2E
# ══════════════════════════════════════════════════════════
echo ""
echo "$(bold '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')"
echo "$(bold '  PHASE 2/3 : TESTS E2E')"
echo "$(bold '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')"
echo ""

cd "$PROJECT_DIR"
if eval "$E2E_CMD" 2>&1; then
    echo ""
    echo "  $(green '✅ Tests E2E : tous passés')"
else
    E2E_OK=false
    echo ""
    echo "  $(red '❌ Tests E2E : des tests échouent')"
fi

# ══════════════════════════════════════════════════════════
#  PHASE 3 : AUDIT LOGS (POST-E2E)
# ══════════════════════════════════════════════════════════
echo ""
echo "$(bold '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')"
echo "$(bold '  PHASE 3/3 : AUDIT LOGS PROD (post-E2E)')"
echo "$(bold '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')"
echo ""

if ! bash "$SCRIPT_DIR/audit-logs.sh" "$BASE_URL"; then
    LOGS_OK=false
fi

# ══════════════════════════════════════════════════════════
#  RAPPORT FINAL
# ══════════════════════════════════════════════════════════
echo ""
echo "$(bold '╔══════════════════════════════════════════════════════════╗')"
echo "$(bold '║                    RAPPORT FINAL                        ║')"
echo "$(bold '╚══════════════════════════════════════════════════════════╝')"
echo ""

$API_OK  && echo "  $(green '✅') Audit API     : $(green 'PASS')" || echo "  $(red '❌') Audit API     : $(red 'FAIL')"
$E2E_OK  && echo "  $(green '✅') Tests E2E     : $(green 'PASS')" || echo "  $(red '❌') Tests E2E     : $(red 'FAIL')"
$LOGS_OK && echo "  $(green '✅') Audit Logs    : $(green 'PASS')" || echo "  $(red '❌') Audit Logs    : $(red 'FAIL')"

echo ""

if $API_OK && $E2E_OK && $LOGS_OK; then
    echo "$(green '══════════════════════════════════════════════════════════')"
    echo "  $(green '✅ AUDIT COMPLET : TOUT EST VERT')"
    echo "$(green '══════════════════════════════════════════════════════════')"
    touch "$PROJECT_DIR/.audit_passed"
    echo ""
    echo "  Fichier .audit_passed créé → git push autorisé"
    exit 0
else
    echo "$(red '══════════════════════════════════════════════════════════')"
    echo "  $(red '❌ AUDIT COMPLET : DES PROBLÈMES DÉTECTÉS')"
    echo "$(red '══════════════════════════════════════════════════════════')"
    rm -f "$PROJECT_DIR/.audit_passed"
    echo ""
    echo "  $(yellow '⛔ git push bloqué tant que l'\''audit ne passe pas')"
    exit 1
fi
