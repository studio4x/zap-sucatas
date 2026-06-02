# CHECKLIST DE IMPLEMENTACAO E TESTES - ZAP SUCATAS

Data de referência: 2026-04-27
Objetivo: servir como checklist unico para validar o que ja foi implementado, executar testes funcionais e identificar lacunas de escopo.

## 1) Legenda

- [x] `CHK-001` Implementado no codigo
- [ ] `CHK-002` Pendente de validação funcional/QA
- [ ] `CHK-003` Não implementado (ou fora do escopo atual)

## 2) Resumo executivo do estado atual

- [x] `CHK-004` Estrutura principal do MVP implementada com separação de areas: pública, dashboard e admin.
- [x] `CHK-005` Autenticação com Supabase Auth e guards de rota implementados.
- [x] `CHK-006` Catálogo, anúncios, perguntas e moderação admin implementados.
- [x] `CHK-007` Blog público/admin implementado.
- [x] `CHK-008` Tabela de preços (manual + snapshots) implementada.
- [x] `CHK-009` Modulo de tickets de suporte implementado.
- [x] `CHK-010` Modulo de notificações implementado (envio admin, fila, histórico e central do usuário).
- [x] `CHK-011` Modulo de analytics admin implementado (eventos + dashboard).
- [x] `CHK-012` Configurações globais implementadas, incluindo aba de definições visuais.
- [x] `CHK-013` Upload de logos/favicons implementado e consumo no frontend público (header/rodapé/favicon) implementado.

## 3) Rotas e páginas implementadas

### 3.1 Público

- [x] `CHK-014` `/`
- [x] `CHK-015` `/anúncios`
- [x] `CHK-016` `/anúncios/:slug`
- [x] `CHK-017` `/categorias`
- [x] `CHK-018` `/categorias/:slug`
- [x] `CHK-019` `/tabela-de-precos`
- [x] `CHK-020` `/blog`
- [x] `CHK-021` `/blog/:slug`
- [x] `CHK-022` `/sobre`
- [x] `CHK-023` `/contato`
- [x] `CHK-024` `/suporte`
- [x] `CHK-025` `/login`
- [x] `CHK-026` `/cadastro`
- [x] `CHK-027` `/recuperar-senha`

### 3.2 Dashboard do usuário

- [x] `CHK-028` `/app`
- [x] `CHK-029` `/app/anúncios`
- [x] `CHK-030` `/app/anúncios/novo`
- [x] `CHK-031` `/app/anúncios/:id/editar`
- [x] `CHK-032` `/app/perguntas`
- [x] `CHK-033` `/app/notificacoes`
- [x] `CHK-034` `/app/suporte`
- [x] `CHK-035` `/app/suporte/:id`
- [x] `CHK-036` `/app/perfil`
- [x] `CHK-037` `/app/configuracoes`

### 3.3 Admin

- [x] `CHK-038` `/admin`
- [x] `CHK-039` `/admin/anúncios`
- [x] `CHK-040` `/admin/anúncios/novo`
- [x] `CHK-041` `/admin/anúncios/:id/editar`
- [x] `CHK-042` `/admin/anúncios/:id`
- [x] `CHK-043` `/admin/perguntas`
- [x] `CHK-044` `/admin/usuários`
- [x] `CHK-045` `/admin/estatisticas`
- [x] `CHK-046` `/admin/contato`
- [x] `CHK-047` `/admin/suporte`
- [x] `CHK-048` `/admin/suporte/:id`
- [x] `CHK-049` `/admin/notificacoes`
- [x] `CHK-050` `/admin/categorias`
- [x] `CHK-051` `/admin/materiais`
- [x] `CHK-052` `/admin/localidades`
- [x] `CHK-053` `/admin/blog`
- [x] `CHK-054` `/admin/preços`
- [x] `CHK-055` `/admin/configuracoes`
- [x] `CHK-056` `/admin/logs`

## 4) Checklist funcional por modulo

## 4.1 Autenticação e controle de acesso

### 4.1.1 Implementação

- [x] `CHK-057` Login com email/senha.
- [x] `CHK-058` Cadastro de usuário.
- [x] `CHK-059` Recuperação de senha.
- [x] `CHK-060` Guards de autenticação (`AuthGuard`, `GuestGuard`, `RoleGuard`).
- [x] `CHK-061` Separação de acesso admin vs usuário comum.

### 4.1.2 Testes sugeridos - BLK-AUTH-ACESSO

1. [OK] `AUTH-01` Acessar `/app` sem login deve redirecionar para login.
2. [OK] `AUTH-02` Acessar `/admin` com usuário não-admin deve bloquear acesso.
3. [OK] `AUTH-03` Criar conta nova e confirmar sessão no dashboard.
4. [OK] `AUTH-04` Solicitar recuperação de senha e validar fluxo completo.
5. [OK] `AUTH-05` Logout deve encerrar sessão e restringir rotas privadas.

## 4.2 Catálogo e anúncios

### 4.2.1 Implementação

- [x] `CHK-062` Listagem pública com busca e filtros.
- [x] `CHK-063` Detalhe público de anúncio por slug.
- [x] `CHK-064` CRUD de anúncios no dashboard.
- [x] `CHK-065` CRUD de anúncios no admin (inclui novo/editar/detalhe).
- [x] `CHK-066` Upload e ordenação de imagens.
- [x] `CHK-067` Estados operacionais de anúncio (draft/review/approved/rejected etc.).

### 4.2.2 Testes sugeridos - BLK-CATALOGO-ANUNCIOS

1. [OK] `CAT-01` Criar anúncio no dashboard e salvar como rascunho.
2. [OK] `CAT-02` Enviar anúncio para revisao e validar mudanca de status.
3. [OK] `CAT-03` Aprovar anúncio no admin e validar exibição pública.
4. [OK] `CAT-04` Reprovar anúncio no admin e validar motivo/feedback ao usuário.
5. [OK] `CAT-05` Editar anúncio aprovado e validar consistência dos dados.
6. [OK] `CAT-06` Validar filtros públicos por categoria/material/localidade.

## 4.3 Perguntas e respostas

### 4.3.1 Implementação

- [x] `CHK-068` Perguntas no anúncio público.
- [x] `CHK-069` Caixa de perguntas do anunciante no dashboard.
- [x] `CHK-070` Moderação de perguntas no admin.

### 4.3.2 Testes sugeridos - BLK-PERGUNTAS-RESPOSTAS

1. [OK] `QNA-01` Enviar pergunta em anúncio publicado.
2. [OK] `QNA-02` Responder pergunta no dashboard do anunciante.
3. [OK] `QNA-03` Moderar pergunta no admin (publicar/ocultar/bloquear conforme regra).
4. [OK] `QNA-04` Validar exibição da resposta no anúncio público.

## 4.4 Blog

### 4.4.1 Implementação

- [x] `CHK-071` Listagem pública de posts.
- [x] `CHK-072` Detalhe público de post.
- [x] `CHK-073` CRUD de posts no admin.
- [x] `CHK-074` Gestão de categorias/tags de blog no admin.

### 4.4.2 Testes sugeridos - BLK-BLOG

1. [OK] `BLOG-01` Criar post em rascunho no admin.
2. [OK] `BLOG-02` Publicar post e validar rota pública por slug.
3. [OK] `BLOG-03` Editar SEO do post e validar metadados na página.
4. [OK] `BLOG-04` Arquivar/remover post e validar que sai da listagem pública.

## 4.5 Tabela de preços

### 4.5.1 Implementação

- [x] `CHK-075` Página pública de tabela de preços.
- [x] `CHK-076` Operação admin para preços manuais.
- [x] `CHK-077` Estrutura para snapshots/sincronização de preços.

### 4.5.2 Testes sugeridos - BLK-PRECOS

1. [OK] `PRC-01` Inserir preço manual no admin e validar na página pública.
2. [OK] `PRC-02` Editar/remover registro e validar histórico/resultado.
3. [OK] `PRC-03` Rodar rotina de sincronização (quando aplicável) e validar logs.

## 4.6 Notificações

### 4.6.1 Implementação

- [x] `CHK-078` Central de notificações no dashboard (`/app/notificacoes`).
- [x] `CHK-079` Hub admin de notificações (`/admin/notificacoes`).
- [x] `CHK-080` Envio manual em massa (canais in-app/email/push/whatsapp).
- [x] `CHK-081` Fila de notificação com status e reprocessamento/cancelamento.
- [x] `CHK-082` Aba de registro consolidado de envios (manual + automático quando identificado).
- [x] `CHK-083` Contadores no menu admin/dashboard.

### 4.6.2 Testes sugeridos - BLK-NOTIFICACOES

1. [OK] `NTF-01` Disparar envio manual para usuários especificos.
2. [OK] `NTF-02` Validar criação em `notifications` e `notification_queue`.
3. [OK] `NTF-03` Processar fila e validar transicao de status.
4. [OK] `NTF-04` Testar reprocessamento e cancelamento por item.
5. [OK] `NTF-05` Validar notificação aparecendo no widget/central do usuário.
6. [OK] `NTF-06` Validar aba "Registro de envios" com filtros por canal/status/origem.

## 4.7 Suporte por tickets

### 4.7.1 Implementação

- [x] `CHK-084` Lista de tickets no dashboard e no admin.
- [x] `CHK-085` Detalhe de ticket compartilhado por rota `/app/suporte/:id` e `/admin/suporte/:id`.
- [x] `CHK-086` Conversa/mensagens no ticket.
- [x] `CHK-087` Estados operacionais e indicações de SLA no admin.

### 4.7.2 Testes sugeridos - BLK-SUPORTE-TICKETS

1. [OK] `SUP-01` Abrir ticket como usuário.
2. [OK] `SUP-02` Responder ticket como admin.
3. [OK] `SUP-03` Validar alteração de status e SLA.
4. [OK] `SUP-04` Validar atualização no detalhe para usuário e admin.
5. [OK] `SUP-05` Encerrar ticket e validar estado final.

## 4.8 Analytics admin

### 4.8.1 Implementação

- [x] `CHK-088` Coleta de eventos de analytics no frontend (page_view, click, page_leave).
- [x] `CHK-089` Persistencia em `analytics_events`.
- [x] `CHK-090` Dashboard em `/admin/estatisticas` com:
  - [x] `CHK-091` acessos
  - [x] `CHK-092` cliques
  - [x] `CHK-093` CTR
  - [x] `CHK-094` tempo médio
  - [x] `CHK-095` usuários novos
  - [x] `CHK-096` usuários recorrentes
  - [x] `CHK-097` sessões unicas
  - [x] `CHK-098` mix de dispositivos
  - [x] `CHK-099` top páginas e top cliques
  - [x] `CHK-100` localidade operacional

### 4.8.2 Testes sugeridos - BLK-ANALYTICS

1. [OK] `ANL-01` Navegar em páginas públicas/dashboard/admin para gerar eventos.
2. [OK] `ANL-02` Validar gravação em `analytics_events`.
3. [OK] `ANL-03` Validar filtros por período no admin analytics.
4. [OK] `ANL-04` Conferir consistência entre eventos e KPIs exibidos.

## 4.9 Configurações globais e definições visuais

### 4.9.1 Implementação

- [x] `CHK-101` Configurações operacionais em `/admin/configuracoes` (site, suporte, SEO, toggles).
- [x] `CHK-102` Aba de "Definicoes visuais" com upload para:
  - [x] `CHK-103` logo light
  - [x] `CHK-104` logo dark
  - [x] `CHK-105` favicon
- [x] `CHK-106` Preview dos assets na página admin.
- [x] `CHK-107` Consumo dos assets no frontend público:
  - [x] `CHK-108` header (logo dark)
  - [x] `CHK-109` rodapé (logo light)
  - [x] `CHK-110` favicon dinâmico

### 4.9.2 Testes sugeridos - BLK-SETTINGS-VISUAL

1. [OK] `SET-01` Fazer upload de logo dark e validar no header público.
2. [OK] `SET-02` Fazer upload de logo light e validar no rodapé público.
3. [OK] `SET-03` Fazer upload de favicon e validar na aba do navegador.
4. [OK] `SET-04` Atualizar nome do site/SEO e validar reflexo onde aplicável.
5. [OK] `SET-05` Validar fallback visual caso asset esteja ausente/corrompido.

## 4.10 Contato

### 4.10.1 Implementação

- [x] `CHK-111` Página pública de contato.
- [x] `CHK-112` Captura de mensagens de contato.
- [x] `CHK-113` Gestão administrativa em `/admin/contato`.

### 4.10.2 Testes sugeridos - BLK-CONTATO

1. [OK] `CTT-01` Enviar mensagem no formulário público.
2. [OK] `CTT-02` Validar entrada no admin de contato.
3. [OK] `CTT-03` Alterar status da mensagem no admin e validar persistência.

## 4.11 Logs e auditoria

### 4.11.1 Implementação

- [x] `CHK-114` Página admin de logs (`/admin/logs`).
- [x] `CHK-115` Tabelas de auditoria/integração no banco.
- [x] `CHK-116` Registro de eventos críticos em funções sensíveis.

### 4.11.2 Testes sugeridos - BLK-LOGS-AUDITORIA

1. [OK] `LOG-01` Executar operações criticas (aprovação/reprovacao/envios).
2. [OK] `LOG-02` Validar rastros em logs administrativos.
3. [OK] `LOG-03` Confirmar se payloads e status estao coerentes com a ação.

## 5) Banco de dados, migrations e seguranca

## 5.1 Migrations existentes

- [x] `0001` ate `0027` versionadas no repositorio.
- [x] `CHK-117` Módulos principais cobertos: auth/perfis, catálogo, blog, preços, settings, contato, suporte, notificações, analytics.

## 5.2 Storage

- [x] `CHK-118` Buckets previstos em policy (`listing-media`, `blog-media`, `site-assets`).
- [x] `CHK-119` Leitura pública para buckets permitidos.
- [x] `CHK-120` Escrita administrativa para assets editoriais via policy.

## 5.3 RLS e policies

- [x] `CHK-121` RLS habilitado em tabelas sensíveis.
- [x] `CHK-122` Policies de acesso por owner/admin/public conforme contexto.
- [x] `CHK-123` `system_settings` com leitura pública e escrita admin.

## 5.4 Testes sugeridos de seguranca - BLK-SEG-RLS-POLICIES

1. [OK] `SEC-01` Usuário comum tentar editar dado admin deve falhar.
2. [OK] `SEC-02` Usuário anonimo tentar escrever em tabela privada deve falhar.
3. [OK] `SEC-03` Usuário owner deve acessar somente seus dados privados.
4. [OK] `SEC-04` Admin deve conseguir operação total em módulos administrativos.

## 5.5 Validação estrutural obrigatoria por migration/tabela sensivel - BLK-DB-ESTRUTURA

1. [OK] `DB-01` Todas as tabelas sensíveis possuem `created_at`.
2. [OK] `DB-02` Todas as tabelas sensíveis possuem `updated_at` quando aplicável.
3. [OK] `DB-03` Trigger de `updated_at` ativo nas tabelas com `updated_at`.
4. [OK] `DB-04` Foreign keys presentes e coerentes com o dominio.
5. [OK] `DB-05` Constraints de integridade (checks, uniques) aplicadas conforme regra de negocio.
6. [OK] `DB-06` Indices essenciais criados para filtros e consultas operacionais.
7. [OK] `DB-07` RLS habilitado em todas as tabelas privadas/sensíveis.
8. [OK] `DB-08` Policies de owner/admin/public validadas por teste positivo e negativo.

## 6) Edge Functions existentes

- [x] `CHK-124` `submit-listing-for-review`
- [x] `CHK-125` `approve-listing`
- [x] `CHK-126` `reject-listing`
- [x] `CHK-127` `answer-listing-question`
- [x] `CHK-128` `moderate-listing-question`
- [x] `CHK-129` `manage-listing-lifecycle`
- [x] `CHK-130` `manage-listing-category`
- [x] `CHK-131` `manage-listing-material`
- [x] `CHK-132` `manage-user-account`
- [x] `CHK-133` `reorder-listing-images`
- [x] `CHK-134` `sync-lme-prices`
- [x] `CHK-135` `submit-contact-message`
- [x] `CHK-136` `notify-listing-status`
- [x] `CHK-137` `notify-support`
- [x] `CHK-138` `send-notification`
- [x] `CHK-139` `process-notifications`
- [x] `CHK-140` `get-notifications`
- [x] `CHK-141` `mark-notification-read`

### 6.1 Testes sugeridos - BLK-EF-GERAL

1. [OK] `EF-01` Validar cada função com perfil/permissão correta.
2. [OK] `EF-02` Validar respostas de erro para payload invalido.
3. [OK] `EF-03` Validar trilha de logs das funções sensíveis.

### 6.2 Testes obrigatórios de autenticação/autorização (Edge Functions sensíveis) - BLK-EF-AUTHZ

1. [OK] `EFA-01` Requisição sem `Authorization: Bearer <access_token>` retorna `401`.
2. [OK] `EFA-02` Requisição com token invalido/expirado retorna `401`.
3. [OK] `EFA-03` Requisição com usuário sem permissão admin retorna `403` quando aplicável.
4. [OK] `EFA-04` Funções administrativas validam `profiles.is_admin` ou `profiles.role = 'admin'`.
5. [OK] `EFA-05` Respostas de erro retornam JSON claro e consistente (`401`/`403`/`400`).

## 6.1 Segredos e uso de service role - BLK-SEG-SEGREDOS

1. [OK] `SEG-01` Não ha segredo exposto no frontend (incluindo chaves administrativas).
2. [OK] `SEG-02` `service_role` usado apenas no backend/Edge Functions.
3. [OK] `SEG-03` Variaveis de ambiente públicas contem apenas dados seguros para cliente.
4. [OK] `SEG-04` Fluxos sensíveis não dependem de permissão apenas no frontend.

## 7) Itens fora de escopo atual / não encontrados como concluidos

- [OK] `CHK-142` Billing recorrente e assinatura ativa no produto (validado como fora de escopo do MVP atual).
- [OK] `CHK-143` Gateway de pagamento operacional para monetizacao (validado como não ativo no escopo do MVP atual).
- [OK] `CHK-144` Favoritos/alertas avancados de leads (validado como fora de escopo do MVP atual).
- [OK] `CHK-145` App nativo publicado em lojas (validado como fora de escopo do MVP atual).
- [OK] `CHK-146` CRM comercial completo (validado como fora de escopo do MVP atual).
- [OK] `CHK-147` Automacoes avancadas (A/B testing de notificação, agendamento futuro completo etc.) (validado como fora de escopo do MVP atual).

## 8) Checklist final de regressao (smoke test) - BLK-SMOKE-GERAL

1. [OK] `SMK-01` Build local (`npm run build`) sem erros.
2. [OK] `SMK-02` Login admin e acesso a todas as rotas `/admin`.
3. [OK] `SMK-03` Login usuário e acesso a todas as rotas `/app`.
4. [OK] `SMK-04` Home pública renderizando corretamente em desktop e mobile.
5. [OK] `SMK-05` Header e rodapé exibindo logos corretos apos upload.
6. [OK] `SMK-06` Notificações chegando no centro do usuário.
7. [OK] `SMK-07` Criação e moderação de anúncio ponta a ponta.
8. [OK] `SMK-08` Ticket de suporte ponta a ponta.
9. [OK] `SMK-09` Dashboard de analytics com dados recentes.
10. [OK] `SMK-10` Deploy em produção refletindo a `BUILD_VERSION` mais recente.

## 8.1 Build version e rastreabilidade - BLK-BUILD-VERSION

1. [OK] `BLD-01` `src/lib/build-version.ts` revisado e incrementado na entrega.
2. [OK] `BLD-02` Rodape da area pública exibindo `Build <BUILD_VERSION>-<COMMIT_SHA_CURTO>`.
3. [OK] `BLD-03` Rodape do dashboard (`/app`) exibindo `Build <BUILD_VERSION>-<COMMIT_SHA_CURTO>`.
4. [OK] `BLD-04` Rodape do admin (`/admin`) exibindo `Build <BUILD_VERSION>-<COMMIT_SHA_CURTO>`.
5. [OK] `BLD-05` `COMMIT_SHA_CURTO` exibido corresponde ao commit publicado.

## 8.2 Validação obrigatoria de deploy em produção - BLK-DEPLOY-PROD

1. [OK] `DEP-01` Deploy mais recente em estado `READY`.
2. [OK] `DEP-02` Dominio canonico apontando para o deploy mais recente.
3. [OK] `DEP-03` Revisao ativa em produção corresponde ao `HEAD` atual.
4. [OK] `DEP-04` Em caso de divergencia (HEAD/deploy/dominio), alias corrigido antes do encerramento.

## 8.3 Fluxo crítico ponta a ponta com auditoria - BLK-FLUXO-E2E-AUDIT

1. [OK] `E2E-01` Usuário cria anúncio e salva em rascunho.
2. [OK] `E2E-02` Usuário envia anúncio para revisao (`pending_review`).
3. [OK] `E2E-03` Admin aprova anúncio e válida `slug` + `published_at` + exibição pública.
4. [OK] `E2E-04` Admin rejeita anúncio e válida motivo + bloqueio de exibição pública.
5. [OK] `E2E-05` Cada ação critica gera rastreabilidade em logs/auditoria.

## 8.4 Storage e permissões por bucket - BLK-STORAGE-PERMISSOES

1. [OK] `STR-01` Upload de imagens de anúncio funcional em `listing-media`.
2. [OK] `STR-02` Upload de assets de blog funcional em `blog-media`.
3. [OK] `STR-03` Upload de logos/favicon funcional em `site-assets`.
4. [OK] `STR-04` Leitura pública apenas onde previsto por policy.
5. [OK] `STR-05` Tentativa de escrita indevida por usuário sem permissão falha.

## 8.5 Estados de UX obrigatórios (telas criticas) - BLK-UX-ESTADOS

1. [OK] `UX-01` Estados de loading validados nas telas principais (público, `/app`, `/admin`).
2. [OK] `UX-02` Estados de erro com mensagem clara e recuperação basica.
3. [OK] `UX-03` Estados vazios com orientação de próximo passo.
4. [OK] `UX-04` Estados de sucesso com feedback visivel ao usuário.

## 9) Observacoes para uso deste documento

- Este checklist mistura estado de implementação (codigo) e validação funcional (QA).
- Sempre que um item for retestado, registrar data, ambiente e responsavel.
- Para auditoria de release, anexar evidencias (prints, logs, ids de registro e build version).
- Documento recomendado para validação de Go/No-Go antes de publicação critica.

## 10) Higiene documental (fonte de verdade)

- [ ] `CHK-148` Confirmar que os caminhos dos documentos-base referenciados no AGENTS.md existem e estao atualizados.
- [ ] `CHK-149` Em caso de renomeação/movimentação de arquivos de arquitetura, atualizar referências internas antes da release.