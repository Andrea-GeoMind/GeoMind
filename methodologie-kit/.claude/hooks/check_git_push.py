#!/usr/bin/env python3
"""Hook PreToolUse : bloque git push si l'audit n'a pas été lancé.

Lit le JSON stdin de Claude Code pour détecter les commandes git push.
Si .audit_passed n'existe pas → exit 2 (bloque).
Si .audit_passed existe → le supprime (usage unique) et exit 0.
"""
import sys
import json
import os

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
AUDIT_FLAG = os.path.join(PROJECT_DIR, ".audit_passed")


def main():
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        sys.exit(0)

    # Récupérer la commande bash
    tool_input = data.get("tool_input", {})
    command = tool_input.get("command", "")

    # Vérifier si c'est un git push
    if "git push" not in command:
        sys.exit(0)

    # Vérifier si l'audit a été passé
    if os.path.exists(AUDIT_FLAG):
        # Supprimer le flag (usage unique — il faudra relancer l'audit avant le prochain push)
        os.remove(AUDIT_FLAG)
        sys.exit(0)
    else:
        print(json.dumps({
            "decision": "block",
            "reason": "⛔ Lance /full-audit avant de pusher. L'audit doit être vert pour autoriser le push."
        }))
        sys.exit(2)


if __name__ == "__main__":
    main()
