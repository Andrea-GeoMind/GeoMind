#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════╗
# ║  Audit Logs Production — template générique             ║
# ║  Analyse les erreurs capturées par le middleware         ║
# ║  Idéal APRÈS un run E2E pour voir les vrais bugs        ║
# ║                                                          ║
# ║  Requiert un backend exposant :                          ║
# ║    GET /dev/recent-errors  (X-Admin-Token requis)        ║
# ║    GET /dev/request-log    (X-Admin-Token requis)        ║
# ║  Voir backend-snippets/ pour l'implémentation FastAPI.   ║
# ╚══════════════════════════════════════════════════════════╝
set -euo pipefail

BASE_URL="${1:-${PROD_API_URL:?PROD_API_URL non défini}}"
ADMIN_HEADER="X-Admin-Token: ${ADMIN_TOKEN:-change-me}"

green()  { printf "\033[32m%s\033[0m" "$1"; }
red()    { printf "\033[31m%s\033[0m" "$1"; }
yellow() { printf "\033[33m%s\033[0m" "$1"; }

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  AUDIT LOGS — ${BASE_URL}"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── Erreurs récentes ──
echo "=== Erreurs récentes (depuis dernier clear) ==="
ERRORS_JSON=$(curl -s -H "$ADMIN_HEADER" "${BASE_URL}/dev/recent-errors" 2>/dev/null)
TOTAL_ERRORS=$(echo "$ERRORS_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['total_errors'])" 2>/dev/null || echo "?")

if [ "$TOTAL_ERRORS" = "0" ]; then
    echo "  $(green '✅ Aucune erreur détectée')"
    echo ""
elif [ "$TOTAL_ERRORS" = "?" ]; then
    echo "  $(yellow '⚠ Endpoint /dev/recent-errors non disponible — vérifier le middleware backend')"
    echo ""
    exit 1
else
    echo "  $(red "❌ ${TOTAL_ERRORS} erreur(s) capturée(s)")"
    echo ""
    echo "=== Détail (top 10) ==="
    echo "$ERRORS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for e in data['errors'][-10:]:
    print(f\"  [{e.get('status','?')}] {e.get('method','?'):6} {e.get('path','?')}\")
    if 'error' in e:
        print(f\"       → {e['error'][:120]}\")
" 2>/dev/null
    echo ""
    exit 1
fi

# ── Stats requêtes globales ──
echo "=== Activité (200 dernières requêtes) ==="
LOG_JSON=$(curl -s -H "$ADMIN_HEADER" "${BASE_URL}/dev/request-log?last=200" 2>/dev/null)
echo "$LOG_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
entries = data.get('entries', [])
total = len(entries)
by_status = {}
slow = []
for e in entries:
    s = e.get('status', 0) // 100
    by_status[f'{s}xx'] = by_status.get(f'{s}xx', 0) + 1
    if e.get('duration_ms', 0) > 1000:
        slow.append(e)
print(f'  Total : {total}')
for k in sorted(by_status):
    print(f'    {k}: {by_status[k]}')
if slow:
    print(f'  ⚠ {len(slow)} requête(s) > 1s :')
    for e in slow[:5]:
        print(f\"    {e['duration_ms']}ms — {e['method']} {e['path']}\")
" 2>/dev/null

echo ""
exit 0
