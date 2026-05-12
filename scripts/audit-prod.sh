#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════╗
# ║  Audit routes Next.js — GEOMIND                         ║
# ║  Teste les routes publiques (marketing + auth) et        ║
# ║  vérifie que les routes app/* redirigent correctement.   ║
# ║                                                          ║
# ║  Variables :                                            ║
# ║    BASE_URL — URL cible (localhost:3000 en dev)          ║
# ╚══════════════════════════════════════════════════════════╝
set -euo pipefail

BASE_URL="${1:-${PROD_API_URL:-http://localhost:3000}}"

PASS=0
FAIL=0
TOTAL=0
FAILURES=""

green()  { printf "\033[32m%s\033[0m" "$1"; }
red()    { printf "\033[31m%s\033[0m" "$1"; }

check() {
    local method="$1" path="$2" expected="$3" desc="$4"
    TOTAL=$((TOTAL + 1))

    local url="${BASE_URL}${path}"
    local body status

    body=$(curl -s -L -w "\n%{http_code}" -o /dev/null "${url}" 2>/dev/null)
    status=$(echo "$body" | tail -1)

    if [ "$status" = "$expected" ]; then
        PASS=$((PASS + 1))
        printf "  $(green '✓') %-6s %-45s [%s] %s\n" "$method" "$path" "$status" "$desc"
    else
        FAIL=$((FAIL + 1))
        FAILURES="${FAILURES}\n  $method $path → attendu $expected, reçu $status ($desc)"
        printf "  $(red '✗') %-6s %-45s [%s] %s\n" "$method" "$path" "$status" "$desc"
    fi
}

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  AUDIT ROUTES — ${BASE_URL}"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── Routes marketing publiques ──
echo "  ── Marketing (public) ──"
check GET "/"                     200 "Landing page"
check GET "/pricing"              200 "Page tarifs"
check GET "/legal/cgv"            200 "CGV"
check GET "/legal/privacy"        200 "Politique de confidentialité"
check GET "/legal/mentions"       200 "Mentions légales"
check GET "/legal/cookies"        200 "Politique cookies"

# ── Routes auth ──
echo ""
echo "  ── Auth ──"
check GET "/login"                200 "Page connexion"
check GET "/signup"               200 "Page inscription"
check GET "/reset-password"       200 "Page reset password"

# ── Routes app (redirigées vers /login si non connecté) ──
echo ""
echo "  ── App (redirige vers /login) ──"
check GET "/dashboard"            200 "Dashboard → /login (avec -L)"
# /onboarding — à activer après TKT-009
# check GET "/onboarding"           200 "Onboarding → /login (avec -L)"
check GET "/settings/account"     200 "Settings → /login (avec -L)"

# ── Assets statiques ──
echo ""
echo "  ── Assets statiques ──"
check GET "/logo.svg"             200 "Logo wordmark SVG"
check GET "/logo-mark.svg"        200 "Logo mark SVG"

# ── Route 404 ──
echo ""
echo "  ── Erreurs ──"
check GET "/cette-route-nexiste-vraiment-pas-du-tout" 404 "404 sur route inexistante"

# ── Rapport ──
echo ""
echo "  Résultat : $PASS/$TOTAL OK"

if [ "$FAIL" -gt 0 ]; then
    echo ""
    echo "$(red '  ❌ Échecs :')"
    echo -e "$FAILURES"
    exit 1
fi

echo "  $(green '✅ Toutes les routes sont OK')"
exit 0
