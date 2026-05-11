# Index global des tickets

Ce fichier indexe tous les chantiers `TKT-NNN` du projet. État d'avancement réel : voir [`PROGRESS.md`](../../PROGRESS.md).

## Convention de ticket

Chaque ticket contient :
- **Tableau de tête** : `Lot` / `Statut` / `Estimation` / `Dépendances`
- **Contexte** — pourquoi ce ticket existe
- **Critères d'acceptation** — checklist objective de fin
- **Détail technique** — pistes d'implémentation, fichiers concernés
- **Tests** — quoi tester (TDD obligatoire côté backend)
- **Tests prod** — commandes `curl` ou E2E à exécuter après push

---

## LOT 1 — `<thème>`

### Décisions arbitrées (YYYY-MM-DD)

| # | Décision |
|---|----------|
| 1 | <choix structurant> |
| 2 | <choix structurant> |

### Tickets

- [TKT-001 — Setup initial](TKT-001-setup-initial.md)
- [TKT-002 — Auth + sessions](TKT-002-auth-sessions.md)
- [TKT-003 — CRUD ressource](TKT-003-crud-ressource.md)

---

## LOT 2 — `<thème>`

- [TKT-005 — ...](TKT-005-xxx.md)

---

## LOTs déjà utilisés

Numérotation globale, jamais par chantier. Vérifier avant d'attribuer un numéro.

| LOT | Thème | Statut |
|-----|-------|--------|
| 1 | Setup + auth | ✅ terminé |
| 2 | Ressource principale | 🚧 en cours |
| 3 | _disponible_ | — |
