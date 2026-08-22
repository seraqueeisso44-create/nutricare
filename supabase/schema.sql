-- ============================================
-- NutriCare — Supabase Schema
-- Execute este SQL no SQL Editor do painel Supabase
-- ============================================

-- Tabela principal de pacientes
-- Todos os dados aninhados ficam em JSONB para manter compatibilidade
-- com a estrutura atual do app
CREATE TABLE IF NOT EXISTS pacientes (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT DEFAULT '',
  telefone TEXT DEFAULT '',
  sexo TEXT NOT NULL DEFAULT 'masculino',
  data_nascimento TEXT NOT NULL DEFAULT '',
  cpf TEXT DEFAULT '',
  profissao TEXT DEFAULT '',
  peso NUMERIC DEFAULT 0,
  altura NUMERIC DEFAULT 0,
  objetivo TEXT DEFAULT '',
  observacoes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'ativo',
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL,
  anamnese JSONB DEFAULT NULL,
  exames JSONB DEFAULT '[]',
  fotos JSONB DEFAULT '[]',
  antropometria JSONB DEFAULT '[]',
  calculos JSONB DEFAULT '[]',
  dietas JSONB DEFAULT '[]',
  orientacoes TEXT DEFAULT '',
  historico_anamnese JSONB DEFAULT '[]'
);

-- Medidas caseiras customizadas por usuário
CREATE TABLE IF NOT EXISTS medidas_custom (
  id TEXT PRIMARY KEY,
  alimento_id TEXT NOT NULL,
  rotulo TEXT NOT NULL,
  gramas NUMERIC NOT NULL
);

-- Favoritos de substitutos
CREATE TABLE IF NOT EXISTS favoritos_substitutos (
  id SERIAL PRIMARY KEY,
  chave TEXT NOT NULL DEFAULT 'default',
  grupos JSONB NOT NULL DEFAULT '[]',
  atualizado_em TEXT NOT NULL DEFAULT (now()::text)
);

-- RLS (Row Level Security) — desabilitado por enquanto
-- Habilitar quando adicionar autenticação
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE medidas_custom ENABLE ROW LEVEL SECURITY;
ALTER TABLE favoritos_substitutos ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (app sem auth por enquanto)
CREATE POLICY "Allow all on pacientes" ON pacientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on medidas_custom" ON medidas_custom FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on favoritos" ON favoritos_substitutos FOR ALL USING (true) WITH CHECK (true);
