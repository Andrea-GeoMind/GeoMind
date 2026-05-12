-- ============================================================
-- Trigger : auth.users → public.profiles
-- À exécuter UNE SEULE FOIS dans le SQL Editor de Supabase.
-- Ce fichier sert de documentation et de source de vérité.
-- ============================================================

-- 1. Fonction déclenchée à chaque nouvel utilisateur Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. Trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
