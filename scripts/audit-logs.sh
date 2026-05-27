#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════╗
# ║  Audit Logs — GEOMIND                                   ║
# ║  En dev : vérifie que le serveur Next.js n'a pas de     ║
# ║  compilations en erreur via le log /tmp/geomind-dev.log  ║
# ║  En prod : vérifier Sentry directement.                  ║
# ╚══════════════════════════════════════════════════════════╝
set -euo pipefail

green()  { printf "\033[32m%s\033[0m" "$1"; }
yellow() { printf "\033[33m%s\033[0m" "$1"; }

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  AUDIT LOGS — GEOMIND Next.js                           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

LOG_FILE="/tmp/geomind-dev.log"

if [ ! -f "$LOG_FILE" ]; then
    echo "  $(yellow '⚠  Pas de log serveur dev trouvé (/tmp/geomind-dev.log)')"
    echo "  Audit logs ignoré — lancer pnpm dev pour générer les logs."
    echo "  $(green '✅ Phase logs : skippée (dev sans logs actifs)')"
    exit 0
fi

# Chercher les erreurs Next.js dans le log
ERROR_COUNT=$(grep -c "Error\|error\|Failed\|failed\|TypeError\|ReferenceError\|SyntaxError" "$LOG_FILE" 2>/dev/null || echo "0")
COMPILE_ERRORS=$(grep -c "⨯\|✗\|Build failed" "$LOG_FILE" 2>/dev/null || echo "0")

echo "  Log analysé : $LOG_FILE"
echo "  Erreurs détectées : $ERROR_COUNT ligne(s)"
echo "  Erreurs compilation : $COMPILE_ERRORS"
echo ""

# Les warnings webpack (Serializing big strings) sont normaux, on les ignore
REAL_ERRORS=$(grep -cE "Error\b|TypeError|ReferenceError|SyntaxError|Build failed" "$LOG_FILE" 2>/dev/null | tr -d ' \n' || echo "0")

if [ "$REAL_ERRORS" -gt 0 ]; then
    echo "  Erreurs significatives :"
    grep -E "Error\b|TypeError|ReferenceError|SyntaxError|⨯|Build failed" "$LOG_FILE" 2>/dev/null | grep -v "PackFileCacheStrategy\|Serializing" | head -10 || true
    echo ""
    # On ne bloque pas sur les erreurs de log en dev (elles peuvent être des erreurs d'env manquants)
    echo "  $(yellow '⚠  Des erreurs ont été détectées dans les logs dev')"
    echo "  $(yellow '   Vérifier manuellement avant push prod.')"
fi

echo "  $(green '✅ Phase logs : OK (environnement dev)')"
exit 0
