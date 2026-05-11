# PROGRESS — `GEOMIND`

Fichier d'état persistant. **Source de vérité** : cocher ici = ticket terminé, committé, pushé, audité.

---

## État global

Sprint 1 en cours. TKT-001 et TKT-002 terminés. Prochaine étape : TKT-003 (Supabase + Drizzle + schéma initial + RLS) — nécessite de créer le projet Supabase en amont.

---

## Sprint 1 — Fondations (Semaine 1)

### Décisions arbitrées (2026-05-11)

| # | Décision | Conséquence |
|---|----------|-------------|
| 1 | pnpm installé via corepack (v11.0.9) | Pas de conflit avec le node_modules global |
| 2 | Composants shadcn/ui créés manuellement (CLI bloqué par nom de dossier) | components.json présent, shadcn CLI utilisable pour la suite |
| 3 | `typedRoutes` déplacé de `experimental` vers root config (Next.js 15.5) | Supprime le warning au démarrage |

### Tickets

- [x] **TKT-001** — Setup initial (Next.js 15, TypeScript strict, Tailwind, shadcn/ui, ESLint, Prettier, pnpm)
- [x] **TKT-002** — Validation des variables d'environnement (Zod + lib/env.ts + .env.example)
- [ ] **TKT-003** — Setup Supabase + Drizzle + schéma initial + RLS
- [ ] **TKT-004** — Supabase Auth + clients SSR + Resend transactionnel

---

## Journal d'exécution

| Ticket | Statut | Date | Notes |
|--------|--------|------|-------|
| TKT-001 | ✅ | 2026-05-11 | typecheck 0 err, lint 0 err, 3 tests verts, dev → 200 — commit 49aa210 sur main |
| TKT-002 | ✅ | 2026-05-11 | lib/env.ts Zod v4 (17 vars), .env.example, 8 tests — 11 tests total — commit d42fdfd |
