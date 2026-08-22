# NutriCare — Deploy e Instalação no Celular

## Stack do Projeto

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS v4 |
| Backend | Next.js API Routes (serverless) |
| Banco de dados | Supabase (PostgreSQL gratuito) |
| Hosting | Vercel (plano gratuito) |
| Mobile | PWA (Progressive Web App) |

---

## PASSO 1 — Criar projeto no Supabase (banco de dados gratuito)

1. Acesse [supabase.com](https://supabase.com) e crie uma conta (grátis)
2. Clique em **"New Project"**
3. Preencha:
   - **Name:** `nutricare`
   - **Database Password:** escolha uma senha forte
   - **Region:** South America (São Paulo)
4. Aguarde o projeto ser criado (~2 min)
5. No painel, vá em **SQL Editor** (menu lateral)
6. Cole TODO o conteúdo do arquivo `supabase/schema.sql` e clique em **"Run"**
7. Vá em **Settings → API** e copie:
   - **Project URL** (algo como `https://xxxxx.supabase.co`)
   - **anon public key** (eyJhbGciOiJIUzI1NiIs...)

---

## PASSO 2 — Fazer deploy no Vercel (hosting gratuito)

### Opção A: Via GitHub (recomendado)

1. Crie um repositório no GitHub e faça push do código
2. Acesse [vercel.com](https://vercel.com) e crie uma conta (grátis)
3. Clique em **"Add New Project"**
4. Selecione o repositório do GitHub
5. O Vercel detecta automaticamente o Next.js — mantenha os padrões
6. **IMPORTANTE:** antes de clicar em Deploy, expanda **"Environment Variables"** e adicione:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://xxxxx.supabase.co` (o URL do Passo 1)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOi...` (a chave do Passo 1)
7. Clique em **"Deploy"**
8. Aguarde ~2 min. O Vercel gera um link como `https://nutricare-xxx.vercel.app`

### Opção B: Via Vercel CLI (sem GitHub)

```bash
npm i -g vercel
vercel login
vercel --prod
# Responda as perguntas (Enter para padrão)
# Na pergunta sobre env vars, adicione as duas variáveis do Supabase
```

---

## PASSO 3 — Migrar dados do PC para a nuvem

1. Com o app rodando no PC (npm run dev), acesse `http://localhost:3000/migracao`
2. Clique em **"Verificar pacientes na nuvem"** (deve mostrar 0)
3. Clique em **"Migrar tudo para a nuvem"**
4. Confirme: seus pacientes, medidas custom e favoritos foram para o Supabase

---

## PASSO 4 — Instalar no celular

### Android (Chrome)

1. Abra o link do Vercel no Chrome do celular (ex: `https://nutricare-xxx.vercel.app`)
2. Toque no **menu ⋮** (canto superior direito)
3. Toque em **"Instalar app"** ou **"Adicionar à tela inicial"**
4. Confirme — o app aparece como ícone nativo

### iPhone (Safari)

1. Abra o link no Safari do iPhone
2. Toque no ícone de **Compartilhar** (quadrado com seta)
3. Role para baixo e toque em **"Adicionar à Tela de Início"**
4. Confirme — o app aparece como ícone nativo

---

## PASSO 5 — Testar

1. Abra o app instalado no celular
2. Crie um paciente novo — ele deve aparecer na nuvem
3. No PC, acesse o app — o paciente deve aparecer também
4. **Pronto:** funciona 24h sem o PC ligado

---

## Atualizações Futuras (Redeploy)

### Se usando GitHub + Vercel:
1. Faça push das mudanças para o GitHub
2. O Vercel faz deploy automático (~1 min)

### Se usando Vercel CLI:
```bash
vercel --prod
```

---

## Custos

| Serviço | Plano Gratuito | Limite |
|---------|---------------|--------|
| Supabase | Free | 500 MB de banco, 50.000 usuários/mês |
| Vercel | Free | 100 GB de bandwidth, deploy ilimitado |
| **Total** | **R$ 0/mês** | Suficiente para uso pessoal |

---

## Estrutura de Arquivos Nova

```
dieta calculadora site/
├── public/
│   ├── manifest.json          ← PWA manifest
│   ├── sw.js                  ← Service Worker (offline)
│   └── icons/                 ← Ícones do app
├── supabase/
│   └── schema.sql             ← SQL para criar as tabelas no Supabase
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── pacientes/route.ts   ← API de pacientes
│   │   │   ├── medidas/route.ts     ← API de medidas custom
│   │   │   └── favoritos/route.ts   ← API de favoritos
│   │   ├── migracao/page.tsx        ← Página para migrar dados
│   │   └── ...
│   ├── lib/
│   │   ├── supabase.ts              ← Cliente Supabase
│   │   ├── api.ts                   ← Camada de dados unificada
│   │   ├── pacientes.ts             ← Funções de paciente (async)
│   │   └── alimentos.ts             ← Medidas custom (sync + cloud sync)
│   └── components/
│       └── RegisterSW.tsx           ← Registra service worker
├── .env.local.example               ← Template de variáveis de ambiente
└── DEPLOY.md                        ← Este arquivo
```

---

## Funcionamento

- **Sem Supabase configurado:** app usa localStorage (igual antes, funciona no PC)
- **Com Supabase configurado:** dados ficam na nuvem, acessíveis de qualquer dispositivo
- **Fallback:** se a internet cair, o app continua funcionando com dados em cache (service worker)
