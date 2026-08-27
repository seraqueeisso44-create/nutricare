-- ===== TABELA PROFILES =====
-- Criada automaticamente via trigger quando usuário se registra no Supabase Auth

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT DEFAULT '',
  isento BOOLEAN DEFAULT false,
  stripe_customer_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  subscription_plan TEXT,
  subscription_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para criar profile automaticamente no registro
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome, isento)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    CASE WHEN NEW.email = 'manoelleonardo19@hotmail.com' THEN true ELSE false END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ===== RLS =====

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Service role pode tudo (para webhooks)
CREATE POLICY "Service role full access" ON profiles
  FOR ALL USING (true) WITH CHECK (true);

-- ===== ATUALIZAR TABELAS EXISTENTES COM user_id =====

-- Adicionar user_id nas tabelas existentes (se não existir)
DO $$ BEGIN
  ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE medidas_custom ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE favoritos_substitutos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ===== RLS ATUALIZADO PARA TABELAS EXISTENTES =====

-- Pacientes
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on pacientes" ON pacientes;
CREATE POLICY "Users manage own pacientes" ON pacientes
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Medidas custom
ALTER TABLE medidas_custom ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on medidas_custom" ON medidas_custom;
CREATE POLICY "Users manage own medidas" ON medidas_custom
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Favoritos
ALTER TABLE favoritos_substitutos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on favoritos" ON favoritos_substitutos;
CREATE POLICY "Users manage own favoritos" ON favoritos_substitutos
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
