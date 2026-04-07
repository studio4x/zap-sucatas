# Zap Sucatas — Blueprint Técnico de Execução MVP

## 1. Resumo executivo

Este documento traduz a proposta comercial da Zap Sucatas em um plano técnico executável no padrão HomeCare Match.

Objetivo do produto:
- reconstruir o site atual como uma plataforma web de classificados e marketplace de sucatas e maquinários;
- operar com área pública, dashboard do anunciante e painel admin;
- garantir publicação moderada, busca com filtros, perguntas e respostas, blog e tabela de preços;
- preparar a base para monetização futura com anúncios em destaque e assinatura.

Stack padrão adotada:
- Frontend: React + TypeScript + Vite
- UI: Tailwind CSS + Radix UI + shadcn/ui
- Dados e cache: TanStack React Query
- Roteamento: React Router
- Backend: Supabase
- Banco: PostgreSQL com migrations SQL
- Auth: Supabase Auth
- Funções sensíveis: Supabase Edge Functions
- Storage: Supabase Storage
- Deploy: Vercel

---

## 2. MVP real do projeto

### 2.1 Módulos incluídos no MVP

1. Área pública comercial
2. Catálogo/listagem de anúncios
3. Detalhe do anúncio
4. Cadastro e login
5. Dashboard do anunciante
6. Publicação de anúncios com moderação
7. Perguntas e respostas por anúncio
8. Painel administrativo
9. Blog nativo
10. Tabela de preços
11. Configurações globais básicas
12. Analytics básico

### 2.2 Módulos preparados, mas não ativados neste MVP

1. Planos de assinatura
2. Anúncios em destaque pagos
3. Cobrança/gateway de pagamento
4. WhatsApp automatizado
5. Regras avançadas de reputação
6. Favoritos, alertas e leads avançados

### 2.3 Fora de escopo inicial

1. App nativo publicado em lojas
2. Billing recorrente
3. CRM comercial completo
4. Moderação operacional diária feita pelo fornecedor
5. Campanhas de mídia paga

---

## 3. Mapa de páginas

## 3.1 Área pública

### `/`
Home comercial com:
- hero com proposta de valor;
- CTA para ver anúncios;
- CTA para anunciar;
- blocos de categorias;
- benefícios da plataforma;
- como funciona;
- destaques recentes;
- tabela de preços resumida;
- bloco de artigos recentes;
- FAQ;
- footer institucional.

### `/anuncios`
Listagem pública com:
- busca por termo;
- filtros por categoria, material, estado e cidade;
- ordenação;
- paginação;
- cards de anúncios.

### `/anuncios/:slug`
Detalhe do anúncio com:
- galeria de imagens;
- ficha técnica;
- descrição completa;
- localização;
- dados comerciais permitidos;
- bloco de perguntas e respostas;
- anúncios relacionados.

### `/categorias`
Página com categorias principais.

### `/categorias/:slug`
Landing de categoria com SEO próprio.

### `/tabela-de-precos`
Página pública com:
- preços internos de sucatas;
- bloco de metais LME;
- data de atualização.

### `/blog`
Listagem de posts.

### `/blog/:slug`
Detalhe do post.

### `/sobre`
Institucional.

### `/contato`
Contato comercial.

### `/login`
Login.

### `/cadastro`
Cadastro.

### `/recuperar-senha`
Recuperação de senha.

---

## 3.2 Dashboard do anunciante

### `/app`
Visão geral com:
- total de anúncios;
- anúncios ativos;
- pendentes;
- reprovados;
- perguntas sem resposta;
- atalhos principais.

### `/app/anuncios`
Listagem dos anúncios do usuário.

### `/app/anuncios/novo`
Formulário de criação.

### `/app/anuncios/:id/editar`
Edição do anúncio.

### `/app/perguntas`
Central de perguntas recebidas.

### `/app/perfil`
Dados do anunciante.

### `/app/configuracoes`
Preferências básicas.

---

## 3.3 Painel administrativo

### `/admin`
Overview operacional com:
- anúncios pendentes;
- anúncios publicados;
- usuários cadastrados;
- perguntas pendentes de moderação;
- posts publicados;
- indicadores rápidos.

### `/admin/anuncios`
Gestão completa dos anúncios.

### `/admin/anuncios/:id`
Detalhe administrativo com timeline e ações.

### `/admin/perguntas`
Gestão de perguntas e respostas.

### `/admin/usuarios`
Gestão de usuários.

### `/admin/categorias`
CRUD de categorias.

### `/admin/materiais`
CRUD de materiais.

### `/admin/localidades`
Gestão de estados e cidades suportadas.

### `/admin/blog`
CRUD de posts e categorias do blog.

### `/admin/precos`
Gestão da tabela de preços manual e do histórico LME.

### `/admin/configuracoes`
Configuração global do site.

### `/admin/logs`
Logs e auditoria.

---

## 4. Fluxos críticos do MVP

## 4.1 Fluxo de publicação moderada

1. usuário faz login;
2. cria anúncio;
3. envia imagens;
4. salva rascunho ou envia para revisão;
5. sistema valida campos obrigatórios;
6. status vira `pending_review`;
7. admin aprova ou rejeita;
8. se aprovado, anúncio ganha slug público e `published_at`.

## 4.2 Fluxo de pergunta pública

1. visitante ou usuário autenticado acessa o anúncio;
2. envia pergunta conforme regra final de autenticação;
3. pergunta fica com status controlado;
4. anunciante responde pelo dashboard;
5. admin pode ocultar conteúdo inadequado.

## 4.3 Fluxo de preço/LME

1. admin atualiza tabela manual ou aciona sincronização;
2. sistema registra histórico;
3. página pública mostra valor e data da última atualização.

## 4.4 Fluxo de blog

1. admin cria rascunho;
2. edita conteúdo;
3. publica com slug e SEO;
4. post aparece no blog público.

---

## 5. Estrutura recomendada de pastas

```txt
zapsucatas/
├─ public/
│  ├─ favicon.ico
│  ├─ manifest.webmanifest
│  └─ images/
├─ src/
│  ├─ app/
│  │  ├─ providers/
│  │  ├─ router/
│  │  └─ guards/
│  ├─ components/
│  │  ├─ ui/
│  │  ├─ layout/
│  │  ├─ public/
│  │  ├─ dashboard/
│  │  ├─ admin/
│  │  ├─ forms/
│  │  └─ shared/
│  ├─ domains/
│  │  ├─ auth/
│  │  ├─ profiles/
│  │  ├─ listings/
│  │  ├─ questions/
│  │  ├─ blog/
│  │  ├─ pricing/
│  │  ├─ categories/
│  │  ├─ locations/
│  │  └─ settings/
│  ├─ hooks/
│  ├─ integrations/
│  │  └─ supabase/
│  ├─ lib/
│  │  ├─ utils/
│  │  ├─ constants/
│  │  ├─ validators/
│  │  ├─ seo/
│  │  └─ guards/
│  ├─ pages/
│  │  ├─ public/
│  │  ├─ app/
│  │  ├─ admin/
│  │  └─ auth/
│  ├─ styles/
│  ├─ types/
│  ├─ main.tsx
│  └─ vite-env.d.ts
├─ supabase/
│  ├─ functions/
│  │  ├─ _shared/
│  │  ├─ submit-listing-for-review/
│  │  ├─ approve-listing/
│  │  ├─ reject-listing/
│  │  ├─ answer-listing-question/
│  │  ├─ sync-lme-prices/
│  │  └─ notify-listing-status/
│  ├─ migrations/
│  ├─ seed.sql
│  └─ config.toml
├─ .env.example
├─ package.json
├─ tsconfig.json
├─ tailwind.config.ts
├─ postcss.config.js
├─ vite.config.ts
└─ README.md
```

### Observação estrutural

Para manter escalabilidade real, o ideal é organizar a lógica por domínio dentro de `src/domains`, mesmo usando `src/pages`, `src/components` e `src/lib`.

---

## 6. Mapa de domínios do frontend

## 6.1 `domains/auth`
Responsável por:
- sessão;
- login;
- cadastro;
- logout;
- recuperação de senha;
- guards de rota.

## 6.2 `domains/profiles`
Responsável por:
- leitura e atualização do perfil;
- papel do usuário;
- status operacional.

## 6.3 `domains/listings`
Responsável por:
- criação e edição de anúncios;
- upload e ordenação de imagens;
- listagem pública;
- detalhe do anúncio;
- filtros;
- status e ações do anúncio.

## 6.4 `domains/questions`
Responsável por:
- perguntas públicas;
- respostas do anunciante;
- moderação.

## 6.5 `domains/blog`
Responsável por:
- posts;
- categorias;
- SEO de conteúdo.

## 6.6 `domains/pricing`
Responsável por:
- tabela de preços;
- snapshots LME;
- atualização manual;
- sincronização futura.

## 6.7 `domains/settings`
Responsável por:
- configurações globais;
- contatos;
- textos institucionais;
- toggles operacionais.

---

## 7. Modelagem inicial do banco

## 7.1 Identidade e perfil

### `profiles`
- `id uuid primary key default gen_random_uuid()`
- `auth_user_id uuid unique not null`
- `full_name text not null`
- `phone text`
- `role text not null default 'user'`
- `is_admin boolean not null default false`
- `status text not null default 'active'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Checks:
- `role in ('user', 'admin')`
- `status in ('active', 'suspended', 'under_review')`

## 7.2 Catálogo

### `listing_categories`
- `id uuid primary key`
- `name text not null`
- `slug text not null unique`
- `description text`
- `is_active boolean not null default true`
- `sort_order int not null default 0`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `listing_materials`
- `id uuid primary key`
- `name text not null`
- `slug text not null unique`
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

## 7.3 Marketplace

### `listings`
- `id uuid primary key`
- `user_id uuid not null references profiles(id)`
- `category_id uuid not null references listing_categories(id)`
- `primary_material_id uuid references listing_materials(id)`
- `title text not null`
- `slug text unique`
- `summary text`
- `description text not null`
- `condition_type text`
- `price_label text`
- `contact_name text`
- `contact_phone text`
- `city text not null`
- `state text not null`
- `status text not null default 'draft'`
- `rejection_reason text`
- `is_featured boolean not null default false`
- `published_at timestamptz`
- `expires_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Checks:
- `status in ('draft', 'pending_review', 'approved', 'rejected', 'paused', 'archived', 'expired')`

### `listing_images`
- `id uuid primary key`
- `listing_id uuid not null references listings(id) on delete cascade`
- `storage_path text not null`
- `sort_order int not null default 0`
- `alt_text text`
- `is_cover boolean not null default false`
- `created_at timestamptz not null default now()`

### `listing_attributes`
- `id uuid primary key`
- `listing_id uuid not null references listings(id) on delete cascade`
- `attribute_key text not null`
- `attribute_label text not null`
- `attribute_value text not null`
- `created_at timestamptz not null default now()`

## 7.4 Perguntas e respostas

### `listing_questions`
- `id uuid primary key`
- `listing_id uuid not null references listings(id) on delete cascade`
- `author_user_id uuid references profiles(id)`
- `guest_name text`
- `guest_email text`
- `question_text text not null`
- `status text not null default 'published'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Checks:
- `status in ('published', 'hidden', 'blocked')`

### `listing_answers`
- `id uuid primary key`
- `question_id uuid not null unique references listing_questions(id) on delete cascade`
- `responder_user_id uuid not null references profiles(id)`
- `answer_text text not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

## 7.5 Blog

### `blog_categories`
- `id uuid primary key`
- `name text not null`
- `slug text not null unique`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `blog_posts`
- `id uuid primary key`
- `category_id uuid references blog_categories(id)`
- `author_user_id uuid references profiles(id)`
- `title text not null`
- `slug text not null unique`
- `excerpt text`
- `content jsonb not null`
- `cover_image_path text`
- `seo_title text`
- `seo_description text`
- `status text not null default 'draft'`
- `published_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Checks:
- `status in ('draft', 'published', 'archived')`

## 7.6 Preços

### `scrap_price_entries`
- `id uuid primary key`
- `material_name text not null`
- `region_name text`
- `price_label text not null`
- `price_numeric numeric(12,2)`
- `price_unit text`
- `source_type text not null default 'manual'`
- `effective_date date not null`
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `lme_price_snapshots`
- `id uuid primary key`
- `metal_code text not null`
- `metal_name text not null`
- `currency_code text not null`
- `price_value numeric(14,4) not null`
- `quoted_at timestamptz not null`
- `source_payload jsonb`
- `created_at timestamptz not null default now()`

## 7.7 Configuração e operação

### `system_settings`
- `id uuid primary key`
- `site_name text not null`
- `support_email text`
- `support_phone text`
- `seo_title_default text`
- `seo_description_default text`
- `allow_guest_questions boolean not null default false`
- `maintenance_mode boolean not null default false`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `admin_audit_logs`
- `id uuid primary key`
- `actor_user_id uuid references profiles(id)`
- `action text not null`
- `entity_type text not null`
- `entity_id uuid`
- `before_data jsonb`
- `after_data jsonb`
- `created_at timestamptz not null default now()`

### `integration_logs`
- `id uuid primary key`
- `integration_name text not null`
- `status text not null`
- `message text`
- `payload jsonb`
- `created_at timestamptz not null default now()`

---

## 8. Índices mínimos

Criar índices para:
- `profiles(auth_user_id)` unique
- `listings(user_id, status)`
- `listings(category_id, status)`
- `listings(state, city)`
- `listings(slug)` unique
- `listings(published_at desc)`
- `listing_images(listing_id, sort_order)`
- `listing_questions(listing_id, status)`
- `blog_posts(slug)` unique
- `blog_posts(status, published_at desc)`
- `lme_price_snapshots(metal_code, quoted_at desc)`

---

## 9. Buckets de storage

## 9.1 Buckets sugeridos

### `listing-media`
- imagens dos anúncios;
- acesso público controlado por padrão do projeto.

### `blog-media`
- capas e imagens do blog.

### `site-assets`
- assets institucionais e branding.

## 9.2 Padrão de path

### anúncios
`users/{user_id}/listings/{listing_id}/{filename}`

### blog
`blog/{post_id}/{filename}`

### site
`site/{asset_type}/{filename}`

---

## 10. Segurança e autorização

## 10.1 Regras centrais

1. login obrigatório para publicar anúncio;
2. usuário só altera os próprios anúncios;
3. leitura pública de anúncio apenas quando `status = 'approved'`;
4. admin opera por role e policy específica;
5. tabelas privadas com RLS habilitado;
6. funções sensíveis via Edge Functions;
7. segredos nunca no frontend.

## 10.2 Tabelas com RLS obrigatório

- `profiles`
- `listings`
- `listing_images`
- `listing_attributes`
- `listing_questions`
- `listing_answers`
- `blog_posts` (escrita/admin)
- `system_settings`
- `admin_audit_logs`
- `integration_logs`

## 10.3 Policies mínimas esperadas

### `profiles`
- usuário lê próprio perfil;
- admin lê todos;
- usuário atualiza próprio perfil em campos permitidos.

### `listings`
- usuário lê próprios anúncios;
- usuário cria anúncio próprio;
- usuário edita anúncio próprio quando não arquivado;
- leitura pública apenas de anúncios aprovados;
- admin lê e altera todos.

### `listing_questions`
- leitura pública apenas quando vinculada a anúncio aprovado e pergunta publicada;
- criação conforme regra de autenticação definida;
- admin modera;
- anunciante consulta perguntas do próprio anúncio.

---

## 11. Edge Functions do MVP

## 11.1 `submit-listing-for-review`
Responsabilidade:
- validar anúncio;
- confirmar ownership;
- trocar status para `pending_review`;
- registrar log;
- disparar notificação.

## 11.2 `approve-listing`
Responsabilidade:
- validar admin;
- aprovar anúncio;
- preencher `published_at`;
- gerar slug se faltar;
- registrar auditoria;
- notificar anunciante.

## 11.3 `reject-listing`
Responsabilidade:
- validar admin;
- registrar motivo;
- alterar status para `rejected`;
- registrar auditoria;
- notificar anunciante.

## 11.4 `answer-listing-question`
Responsabilidade:
- validar ownership do anúncio ou admin;
- gravar resposta;
- atualizar status de moderação se necessário.

## 11.5 `sync-lme-prices`
Responsabilidade:
- chamar API externa;
- validar retorno;
- salvar snapshot;
- registrar log.

## 11.6 `notify-listing-status`
Responsabilidade:
- enviar e-mail para mudança de status;
- centralizar templates.

---

## 12. Migrations iniciais recomendadas

### `0001_extensions_and_helpers.sql`
- extensões;
- helper `set_updated_at()`.

### `0002_profiles.sql`
- tabela `profiles`;
- trigger de `updated_at`.

### `0003_catalog.sql`
- categorias e materiais.

### `0004_listings.sql`
- `listings`, `listing_images`, `listing_attributes`.

### `0005_questions.sql`
- perguntas e respostas.

### `0006_blog.sql`
- categorias e posts.

### `0007_pricing.sql`
- tabela manual e snapshots LME.

### `0008_settings_and_logs.sql`
- settings, audit e integration logs.

### `0009_rls_policies.sql`
- RLS e policies.

### `0010_seed_core_data.sql`
- seeds básicos.

---

## 13. Seeds iniciais

Criar seed com:
- categorias principais;
- materiais principais;
- setting global base;
- usuário admin inicial via script operacional;
- textos base do site se necessário.

Categorias iniciais sugeridas:
- metais ferrosos
- metais não ferrosos
- papel e papelão
- plástico
- eletrônicos
- baterias
- maquinários
- equipamentos industriais

---

## 14. Rotas do frontend

## 14.1 Rotas públicas

```ts
/
/anuncios
/anuncios/:slug
/categorias
/categorias/:slug
/tabela-de-precos
/blog
/blog/:slug
/sobre
/contato
/login
/cadastro
/recuperar-senha
```

## 14.2 Rotas privadas do usuário

```ts
/app
/app/anuncios
/app/anuncios/novo
/app/anuncios/:id/editar
/app/perguntas
/app/perfil
/app/configuracoes
```

## 14.3 Rotas admin

```ts
/admin
/admin/anuncios
/admin/anuncios/:id
/admin/perguntas
/admin/usuarios
/admin/categorias
/admin/materiais
/admin/localidades
/admin/blog
/admin/precos
/admin/configuracoes
/admin/logs
```

---

## 15. Componentes principais

## 15.1 Público
- `PublicLayout`
- `Header`
- `Footer`
- `HeroSection`
- `CategoryGrid`
- `ListingCard`
- `ListingFilters`
- `ListingGallery`
- `QuestionList`
- `QuestionForm`
- `PriceTable`
- `BlogPostCard`

## 15.2 Dashboard
- `AppLayout`
- `AppSidebar`
- `AppHeader`
- `UserStatsCards`
- `UserListingsTable`
- `ListingForm`
- `ImageUploader`
- `QuestionInbox`

## 15.3 Admin
- `AdminLayout`
- `AdminSidebar`
- `AdminStatsCards`
- `ModerationQueue`
- `ListingModerationDialog`
- `AdminDataTable`
- `AuditLogTable`
- `SettingsForm`

---

## 16. Contratos funcionais principais

## 16.1 Criar anúncio

Entrada:
- título;
- categoria;
- descrição;
- localização;
- dados de contato;
- imagens.

Saída:
- `listing_id`;
- `status`;
- mensagem de sucesso.

## 16.2 Enviar para revisão

Entrada:
- `listing_id`

Saída:
- `status = pending_review`

## 16.3 Aprovar anúncio

Entrada:
- `listing_id`

Saída:
- `status = approved`
- `published_at`
- `slug`

## 16.4 Reprovar anúncio

Entrada:
- `listing_id`
- `reason`

Saída:
- `status = rejected`

## 16.5 Responder pergunta

Entrada:
- `question_id`
- `answer_text`

Saída:
- resposta criada.

---

## 17. Checklist de UX para MVP

### Área pública
- hero forte e direto;
- busca visível logo acima da dobra;
- cards limpos;
- filtros claros;
- CTA “Anunciar” sempre acessível.

### Dashboard
- foco em tarefa;
- título contextual por página;
- indicadores rápidos;
- estado vazio bem resolvido;
- formulário em blocos.

### Admin
- tabelas com filtro e busca;
- ações rápidas por linha;
- badges por status;
- dialogs de confirmação;
- log e rastreabilidade.

---

## 18. Ordem prática de implementação

## Fase 1 — setup base
1. criar repositório;
2. criar app Vite React TS;
3. instalar Tailwind, shadcn, React Router, React Query, Zod, RHF;
4. configurar Supabase;
5. estruturar layouts e roteamento base.

## Fase 2 — auth e perfis
1. login/cadastro;
2. profile bootstrap;
3. guards de rota;
4. roles admin/user.

## Fase 3 — catálogo e anúncios
1. categorias e materiais;
2. listagem pública;
3. detalhe do anúncio;
4. dashboard de anúncios;
5. upload de imagens.

## Fase 4 — moderação
1. fila admin;
2. aprovação/rejeição;
3. auditoria;
4. notificações.

## Fase 5 — perguntas e respostas
1. pergunta pública;
2. resposta do anunciante;
3. moderação.

## Fase 6 — blog e preços
1. blog admin/público;
2. tabela de preços manual;
3. preparação LME.

## Fase 7 — hardening
1. revisar RLS;
2. revisar storage;
3. revisar SEO;
4. estados vazios/erros/loading;
5. homologação.

---

## 19. Prompt pack para usar com Codex

## 19.1 Prompt 1 — bootstrap do projeto

```txt
Crie o esqueleto inicial deste projeto em React + TypeScript + Vite com Tailwind, shadcn/ui, React Router e TanStack React Query.

Quero a estrutura:
- src/app
- src/components
- src/domains
- src/pages
- src/hooks
- src/lib
- src/integrations/supabase
- supabase/functions
- supabase/migrations

Crie layouts separados para:
- área pública
- dashboard do usuário
- painel admin

Não implemente regras de negócio ainda. Apenas a fundação estrutural, providers, router e páginas placeholder.
```

## 19.2 Prompt 2 — autenticação e perfis

```txt
Implemente autenticação com Supabase Auth usando email/senha.

Requisitos:
- provider de sessão
- páginas de login, cadastro e recuperação de senha
- route guards para /app e /admin
- redirecionamento por role
- leitura do perfil em tabela profiles
- admin separado por is_admin e role

Use React Query para leitura do perfil e Zod + React Hook Form nos formulários.
```

## 19.3 Prompt 3 — motor de anúncios

```txt
Implemente o domínio de anúncios.

Quero:
- tabela listings no frontend tipada
- tabela listing_images
- tela /anuncios com filtros
- tela /anuncios/:slug
- tela /app/anuncios
- formulário /app/anuncios/novo
- formulário /app/anuncios/:id/editar
- upload de imagens para Supabase Storage
- status draft e pending_review

Separe hooks, queries, mutations, types e componentes por domínio.
```

## 19.4 Prompt 4 — admin de moderação

```txt
Implemente a área admin para moderação de anúncios.

Requisitos:
- lista de anúncios com filtros por status
- detalhe administrativo do anúncio
- ações de aprovar e rejeitar
- dialog para rejeição com motivo obrigatório
- badges de status
- cards resumo no topo
- uso de Edge Functions para ações sensíveis
```

## 19.5 Prompt 5 — migrations SQL

```txt
Gere as migrations SQL iniciais para este projeto no Supabase.

Inclua:
- profiles
- listing_categories
- listing_materials
- listings
- listing_images
- listing_attributes
- listing_questions
- listing_answers
- blog_categories
- blog_posts
- scrap_price_entries
- lme_price_snapshots
- system_settings
- admin_audit_logs
- integration_logs

Também gere:
- índices
- triggers de updated_at
- RLS
- policies iniciais coerentes
```

---

## 20. Kickoff operacional no VS Code

### Passo 1
Criar o repositório e abrir no VS Code.

### Passo 2
Executar o bootstrap do frontend.

### Passo 3
Inicializar Supabase local ou conectar ao projeto remoto.

### Passo 4
Criar `.env.example` com todas as variáveis obrigatórias.

### Passo 5
Rodar o primeiro prompt no Codex para gerar a base estrutural.

### Passo 6
Commitar a base.

### Passo 7
Avançar por domínio, um módulo por vez.

---

## 21. Definition of Done do MVP

O MVP estará pronto quando:
- usuário conseguir criar conta e publicar anúncio para revisão;
- admin conseguir aprovar e rejeitar anúncios;
- anúncios aprovados estiverem públicos com boa navegação e filtros;
- perguntas e respostas estiverem funcionais;
- blog estiver operacional;
- tabela de preços estiver gerenciável;
- RLS estiver aplicada nas tabelas sensíveis;
- painel admin estiver utilizável para operação diária;
- projeto estiver homologado para troca do site atual.

