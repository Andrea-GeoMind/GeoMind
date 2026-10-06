-- ============================================================
-- 0026 — Droits SQL des tables chantier resserrés (audit du 07/10/2026).
--
-- Supabase accorde par défaut tous les privilèges aux rôles anon et
-- authenticated, TRUNCATE compris. RLS filtre les lignes, mais TRUNCATE
-- l'ignore : un TRUNCATE chantiers CASCADE viderait tous les chantiers.
-- Aucune route ne l'expose aujourd'hui (ni PostgREST, ni GraphQL, ni
-- fonction SQL dynamique) ; on ne garde que ce qui sert :
--   - anon : rien ;
--   - authenticated : SELECT sur les 5 tables à policy « owner read ».
-- Toutes les écritures passent par le serveur (rôle postgres).
--
-- Appliquée par scripts/apply-sql-migration.ts. Idempotent.
-- ============================================================

REVOKE ALL ON
  public.chantiers,
  public.chantier_establishments,
  public.chantier_answers,
  public.chantier_answer_revisions,
  public.chantier_files,
  public.chantier_access_logs,
  public.rate_limits
FROM anon;

REVOKE ALL ON
  public.chantier_access_logs,
  public.rate_limits
FROM authenticated;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON
  public.chantiers,
  public.chantier_establishments,
  public.chantier_answers,
  public.chantier_answer_revisions,
  public.chantier_files
FROM authenticated;

GRANT SELECT ON
  public.chantiers,
  public.chantier_establishments,
  public.chantier_answers,
  public.chantier_answer_revisions,
  public.chantier_files
TO authenticated;
