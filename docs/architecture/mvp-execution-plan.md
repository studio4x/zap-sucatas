# Zap Sucatas MVP Execution Plan

## Resumo consolidado do blueprint

O MVP da Zap Sucatas é uma plataforma web de classificados e marketplace de sucatas e maquinários com três áreas operacionais:

- área pública comercial com catálogo, detalhe, blog, preços e páginas institucionais;
- dashboard do anunciante para cadastro, edição, submissão e resposta de perguntas;
- painel admin para moderação, gestão de catálogo, blog, preços, configurações e auditoria.

O fluxo central do produto é publicação moderada. O usuário cria o anúncio, envia mídia, submete para revisão, e apenas anúncios aprovados ficam públicos com `slug` e `published_at`. Perguntas e respostas orbitam o anúncio; blog e tabela de preços completam o escopo do MVP.

## Módulos do MVP

- área pública comercial
- catálogo/listagem de anúncios
- detalhe do anúncio
- autenticação e recuperação de senha
- dashboard do anunciante
- publicação moderada de anúncios
- perguntas e respostas por anúncio
- painel administrativo
- blog nativo
- tabela de preços
- configurações globais básicas
- analytics básico

## Domínios do sistema

- `auth`
- `profiles`
- `listings`
- `questions`
- `blog`
- `pricing`
- `categories`
- `locations`
- `settings`

## Fluxos críticos

### Publicação moderada
- usuário autenticado cria anúncio
- mídia é enviada ao storage
- anúncio é salvo como `draft` ou submetido
- Edge Function válida o anúncio
- status muda para `pending_review`
- admin aprova ou rejeita
- aprovação define `slug` e `published_at`

### Perguntas e respostas
- visitante ou usuário autenticado envia pergunta
- pergunta nasce com status controlado
- anunciante responde no dashboard
- admin pode ocultar ou bloquear conteúdo

### Tabela de preços/LME
- admin atualiza preços manuais ou aciona sincronização
- snapshots são registrados
- frontend público exibe preço atual e data de atualização

### Blog
- admin cria rascunho
- pública com SEO e slug
- conteúdo aparece no blog público

## Áreas e rotas do MVP

### Públicas
- `/`
- `/anuncios`
- `/anuncios/:slug`
- `/categorias`
- `/categorias/:slug`
- `/tabela-de-preços`
- `/blog`
- `/blog/:slug`
- `/sobre`
- `/contato`
- `/login`
- `/cadastro`
- `/recuperar-senha`

### Usuário
- `/app`
- `/app/anuncios`
- `/app/anuncios/novo`
- `/app/anuncios/:id/editar`
- `/app/perguntas`
- `/app/perfil`
- `/app/configuracoes`

### Admin
- `/admin`
- `/admin/anuncios`
- `/admin/anuncios/:id`
- `/admin/perguntas`
- `/admin/usuarios`
- `/admin/categorias`
- `/admin/materiais`
- `/admin/localidades`
- `/admin/blog`
- `/admin/precos`
- `/admin/configuracoes`
- `/admin/logs`

## Entidades de banco

- `profiles`
- `listing_categories`
- `listing_materials`
- `listings`
- `listing_images`
- `listing_attributes`
- `listing_questions`
- `listing_answers`
- `blog_categories`
- `blog_posts`
- `scrap_price_entries`
- `lme_price_snapshots`
- `system_settings`
- `admin_audit_logs`
- `integration_logs`

## Buckets de storage

- `listing-media`
- `blog-media`
- `site-assets`

## Edge Functions do MVP

- `submit-listing-for-review`
- `approve-listing`
- `reject-listing`
- `answer-listing-question`
- `sync-lme-prices`
- `notify-listing-status`

## Segurança e autorização

- login obrigatório para publicar anúncio
- leitura pública apenas de anúncios `approved`
- usuário manipula apenas os próprios anúncios e dados relacionados
- admin opera por role/policy específica
- tabelas sensíveis usam RLS
- segredos ficam fora do frontend
- ações críticas vão para Edge Functions

## Lacunas e premissas adotadas

- `locations` aparece no admin, mas o blueprint não modela tabelas de estados e cidades. Premissa adotada: no MVP inicial, `state` e `city` ficam denormalizados em `listings`; catálogo estruturado de localidades pode entrar em iteração posterior.
- a regra final de perguntas por visitante está aberta. Premissa adotada: permitir pergunta anônima apenas quando `system_settings.allow_guest_questions = true`; caso contrário, exigir autenticação.
- o blueprint cita analytics básico, mas não define ferramenta nem eventos. Premissa adotada: preparar pontos de integração no frontend e postergar instrumentação real para fase dedicada.
- o blueprint cita notificações, mas não define provedor. Premissa adotada: Edge Functions centralizam a orquestração e o provedor de e-mail fica abstraído.

## Backlog técnico em fases

### Fase 1 — fundação
- consolidar estrutura de pastas por domínio
- configurar providers, layouts, router e guards
- padronizar UI base com Tailwind + shadcn/ui
- preparar variáveis de ambiente
- inicializar Supabase local/remoto e estrutura `supabase/`

### Fase 2 — banco e segurança
- criar migrations `0001` a `0010`
- aplicar RLS e policies
- criar buckets e políticas de storage
- semear catálogo base e settings

### Fase 3 — auth e perfis
- integrar Supabase Auth
- bootstrap de perfil em `profiles`
- guards reais por sessão e role
- fluxo de recuperação de senha

### Fase 4 — catálogo público e conteúdo
- listagem pública com filtros
- detalhe do anúncio
- categorias e landings
- blog público
- tabela de preços pública

### Fase 5 — dashboard do anunciante
- CRUD de anúncios
- upload e ordenação de imagens
- central de perguntas
- perfil e configurações básicas

### Fase 6 — painel admin e moderação
- overview operacional
- fila de moderação
- aprovação/rejeição com Edge Functions
- CRUDs de catálogo, blog e preços
- auditoria e configurações

### Fase 7 — acabamento operacional
- notificações
- observabilidade mínima
- SEO e metadata
- deploy Vercel e revisão de ambiente

## Primeiros arquivos recomendados

- `src/app/routes.tsx`
- `src/app/paths.ts`
- `src/app/providers/auth-provider.tsx`
- `src/domains/*/types.ts`
- `supabase/migrations/0001_extensions_and_helpers.sql`
- `supabase/migrations/0002_profiles.sql`
- `supabase/migrations/0009_rls_policies.sql`
- `supabase/seed.sql`
- `supabase/config.toml`