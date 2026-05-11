#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════╗
# ║  Audit API Production — template générique             ║
# ║  Teste tous les endpoints GET + actions POST critiques ║
# ║                                                          ║
# ║  Variables :                                            ║
# ║    PROD_API_URL   — URL backend (1er argv prioritaire)  ║
# ║    ADMIN_TOKEN    — token /dev/* (X-Admin-Token)        ║
# ║                                                          ║
# ║  À PERSONNALISER : la liste des endpoints en bas du     ║
# ║  fichier. Garde la fonction check() telle quelle.       ║
# ╚══════════════════════════════════════════════════════════╝
set -euo pipefail

BASE_URL="${1:-${PROD_API_URL:?PROD_API_URL non défini}}"
ADMIN_HEADER="X-Admin-Token: ${ADMIN_TOKEN:-change-me}"

# Caractères spéciaux pour tester l'encodage (UTF-8, devis, etc.)
SPECIAL_CHARS='Rénovation complète — devis n°42 «test» à l'\''étage'

PASS=0
FAIL=0
TOTAL=0
FAILURES=""

green()  { printf "\033[32m%s\033[0m" "$1"; }
red()    { printf "\033[31m%s\033[0m" "$1"; }
yellow() { printf "\033[33m%s\033[0m" "$1"; }

check() {
    local method="$1" path="$2" expected="$3" desc="$4"
    TOTAL=$((TOTAL + 1))

    local url="${BASE_URL}${path}"
    local body status

    if [ "$method" = "GET" ]; then
        body=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null)
    elif [ "$method" = "POST" ]; then
        local data="${5:-{}}"
        body=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$url" 2>/dev/null)
    elif [ "$method" = "PUT" ]; then
        local data="${5:-{}}"
        body=$(curl -s -w "\n%{http_code}" -X PUT -H "Content-Type: application/json" -d "$data" "$url" 2>/dev/null)
    elif [ "$method" = "DELETE" ]; then
        body=$(curl -s -w "\n%{http_code}" -X DELETE "$url" 2>/dev/null)
    fi

    status=$(echo "$body" | tail -1)

    if [ "$status" = "$expected" ]; then
        PASS=$((PASS + 1))
        printf "  $(green '✓') %-6s %-50s [%s] %s\n" "$method" "$path" "$status" "$desc"
    else
        FAIL=$((FAIL + 1))
        FAILURES="${FAILURES}\n  $method $path → expected $expected got $status ($desc)"
        printf "  $(red '✗') %-6s %-50s [%s] %s\n" "$method" "$path" "$status" "$desc"
    fi
}

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  AUDIT API — ${BASE_URL}"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ══════════════════════════════════════════════════════════
#  LISTE DES ENDPOINTS À AUDITER — À PERSONNALISER
# ══════════════════════════════════════════════════════════
# Format : check METHOD PATH EXPECTED_STATUS "Description" [DATA]

# Healthchecks (toujours présents)
check GET  "/health/live"   200 "Healthcheck live (ne touche pas la BDD)"
check GET  "/health/ready"  200 "Healthcheck ready (vérifie la BDD)"

# Exemples d'endpoints métier — à remplacer par les tiens
# check GET  "/api/v1/resources"           200 "Liste ressources"
# check GET  "/api/v1/resources/123"       200 "Détail ressource"
# check POST "/api/v1/resources"           201 "Création" '{"name":"test"}'
# check GET  "/api/v1/inexistant"          404 "404 attendu sur route inconnue"

# ══════════════════════════════════════════════════════════
#  RAPPORT
# ══════════════════════════════════════════════════════════
echo ""
echo "  Résultat : $PASS/$TOTAL OK"

if [ "$FAIL" -gt 0 ]; then
    echo ""
    echo "$(red '  ❌ Échecs :')"
    echo -e "$FAILURES"
    exit 1
fi

echo "  $(green '✅ Tous les endpoints sont OK')"
exit 0
