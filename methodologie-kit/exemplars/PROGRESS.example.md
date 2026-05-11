# PROGRESS — `<Nom du projet>`

Fichier d'état persistant. **Source de vérité** : cocher ici = ticket terminé, committé, pushé, audité.

---

## État global

<résumé en 3-5 lignes — où on en est, ce qui est en cours, ce qui bloque>

---

## LOT 1 — `<thème du lot>` (YYYY-MM-DD)

### Décisions arbitrées (YYYY-MM-DD)

| # | Décision | Conséquence |
|---|----------|-------------|
| 1 | <choix structurant> | <impact concret> |
| 2 | <choix structurant> | <impact concret> |

### Tickets

- [x] **TKT-001** — Initialisation projet (CI, lint, premier endpoint)
- [x] **TKT-002** — Authentification + sessions
- [ ] **TKT-003** — CRUD ressource principale
- [ ] **TKT-004** — UI liste avec pagination
- [ ] **E2E-LOT1** — Tests E2E parcours nominal

---

## LOT 2 — `<thème suivant>`

- [ ] **TKT-005** — ...
- [ ] **TKT-006** — ...

---

## Journal d'exécution

| Ticket | Statut | Date | Notes |
|--------|--------|------|-------|
| TKT-001 | ✅ | 2026-05-08 | Setup initial — 12 tests verts, CI ok |
| TKT-002 | ✅ | 2026-05-09 | Auth JWT + tests d'intégration (8 tests) |

---

## Travaux non ticketés

- 2026-05-09 : refacto `services/db.py` — extraction du pool de connexions (lié à TKT-002)

---

## Gaps fonctionnels résolus (hotfixes sans ticket préalable)

- 2026-05-10 : `FIX-HOTFIX-001` — bug encodage UTF-8 sur export CSV (1 caractère cassait toute la ligne)

---

## Tickets archivés / annulés

- ~~TKT-XXX — `<titre>`~~ — annulé le YYYY-MM-DD : `<raison>`
