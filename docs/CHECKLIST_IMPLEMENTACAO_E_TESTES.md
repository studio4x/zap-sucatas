# CHECKLIST DE IMPLEMENTACAO E TESTES - ZAP SUCATAS

Data de referencia: 2026-04-27
Objetivo: servir como checklist unico para validar o que ja foi implementado, executar testes funcionais e identificar lacunas de escopo.

## 1) Legenda

- [x] `CHK-001` Implementado no codigo
- [ ] `CHK-002` Pendente de validacao funcional/QA
- [ ] `CHK-003` Nao implementado (ou fora do escopo atual)

## 2) Resumo executivo do estado atual

- [x] `CHK-004` Estrutura principal do MVP implementada com separacao de areas: publica, dashboard e admin.
- [x] `CHK-005` Autenticacao com Supabase Auth e guards de rota implementados.
- [x] `CHK-006` Catalogo, anuncios, perguntas e moderacao admin implementados.
- [x] `CHK-007` Blog publico/admin implementado.
- [x] `CHK-008` Tabela de precos (manual + snapshots) implementada.
- [x] `CHK-009` Modulo de tickets de suporte implementado.
- [x] `CHK-010` Modulo de notificacoes implementado (envio admin, fila, historico e central do usuario).
- [x] `CHK-011` Modulo de analytics admin implementado (eventos + dashboard).
- [x] `CHK-012` Configuracoes globais implementadas, incluindo aba de definicoes visuais.
- [x] `CHK-013` Upload de logos/favicons implementado e consumo no frontend publico (header/rodape/favicon) implementado.

## 3) Rotas e paginas implementadas

### 3.1 Publico

- [x] `CHK-014` `/`
- [x] `CHK-015` `/anuncios`
- [x] `CHK-016` `/anuncios/:slug`
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

### 3.2 Dashboard do usuario

- [x] `CHK-028` `/app`
- [x] `CHK-029` `/app/anuncios`
- [x] `CHK-030` `/app/anuncios/novo`
- [x] `CHK-031` `/app/anuncios/:id/editar`
- [x] `CHK-032` `/app/perguntas`
- [x] `CHK-033` `/app/notificacoes`
- [x] `CHK-034` `/app/suporte`
- [x] `CHK-035` `/app/suporte/:id`
- [x] `CHK-036` `/app/perfil`
- [x] `CHK-037` `/app/configuracoes`

### 3.3 Admin

- [x] `CHK-038` `/admin`
- [x] `CHK-039` `/admin/anuncios`
- [x] `CHK-040` `/admin/anuncios/novo`
- [x] `CHK-041` `/admin/anuncios/:id/editar`
- [x] `CHK-042` `/admin/anuncios/:id`
- [x] `CHK-043` `/admin/perguntas`
- [x] `CHK-044` `/admin/usuarios`
- [x] `CHK-045` `/admin/estatisticas`
- [x] `CHK-046` `/admin/contato`
- [x] `CHK-047` `/admin/suporte`
- [x] `CHK-048` `/admin/suporte/:id`
- [x] `CHK-049` `/admin/notificacoes`
- [x] `CHK-050` `/admin/categorias`
- [x] `CHK-051` `/admin/materiais`
- [x] `CHK-052` `/admin/localidades`
- [x] `CHK-053` `/admin/blog`
- [x] `CHK-054` `/admin/precos`
- [x] `CHK-055` `/admin/configuracoes`
- [x] `CHK-056` `/admin/logs`

## 4) Checklist funcional por modulo

## 4.1 Autenticacao e controle de acesso

### 4.1.1 Implementacao

- [x] `CHK-057` Login com email/senha.
- [x] `CHK-058` Cadastro de usuario.
- [x] `CHK-059` Recuperacao de senha.
- [x] `CHK-060` Guards de autenticacao (`AuthGuard`, `GuestGuard`, `RoleGuard`).
- [x] `CHK-061` Separacao de acesso admin vs usuario comum.

### 4.1.2 Testes sugeridos - BLK-AUTH-ACESSO

1. [OK] `AUTH-01` Acessar `/app` sem login deve redirecionar para login.
2. [OK] `AUTH-02` Acessar `/admin` com usuario nao-admin deve bloquear acesso.
3. [OK] `AUTH-03` Criar conta nova e confirmar sessao no dashboard.
4. [OK] `AUTH-04` Solicitar recuperacao de senha e validar fluxo completo.
5. [OK] `AUTH-05` Logout deve encerrar sessao e restringir rotas privadas.

## 4.2 Catalogo e anuncios

### 4.2.1 Implementacao

- [x] `CHK-062` Listagem publica com busca e filtros.
- [x] `CHK-063` Detalhe publico de anuncio por slug.
- [x] `CHK-064` CRUD de anuncios no dashboard.
- [x] `CHK-065` CRUD de anuncios no admin (inclui novo/editar/detalhe).
- [x] `CHK-066` Upload e ordenacao de imagens.
- [x] `CHK-067` Estados operacionais de anuncio (draft/review/approved/rejected etc.).

### 4.2.2 Testes sugeridos - BLK-CATALOGO-ANUNCIOS

1. [OK] `CAT-01` Criar anuncio no dashboard e salvar como rascunho.
2. [OK] `CAT-02` Enviar anuncio para revisao e validar mudanca de status.
3. [OK] `CAT-03` Aprovar anuncio no admin e validar exibicao publica.
4. [OK] `CAT-04` Reprovar anuncio no admin e validar motivo/feedback ao usuario.
5. [OK] `CAT-05` Editar anuncio aprovado e validar consistencia dos dados.
6. [OK] `CAT-06` Validar filtros publicos por categoria/material/localidade.

## 4.3 Perguntas e respostas

### 4.3.1 Implementacao

- [x] `CHK-068` Perguntas no anuncio publico.
- [x] `CHK-069` Caixa de perguntas do anunciante no dashboard.
- [x] `CHK-070` Moderacao de perguntas no admin.

### 4.3.2 Testes sugeridos - BLK-PERGUNTAS-RESPOSTAS

1. [OK] `QNA-01` Enviar pergunta em anuncio publicado.
2. [OK] `QNA-02` Responder pergunta no dashboard do anunciante.
3. [OK] `QNA-03` Moderar pergunta no admin (publicar/ocultar/bloquear conforme regra).
4. [OK] `QNA-04` Validar exibicao da resposta no anuncio publico.

## 4.4 Blog

### 4.4.1 Implementacao

- [x] `CHK-071` Listagem publica de posts.
- [x] `CHK-072` Detalhe publico de post.
- [x] `CHK-073` CRUD de posts no admin.
- [x] `CHK-074` Gestao de categorias/tags de blog no admin.

### 4.4.2 Testes sugeridos - BLK-BLOG

1. [ ] `BLOG-01` Criar post em rascunho no admin.
2. [ ] `BLOG-02` Publicar post e validar rota publica por slug.
3. [ ] `BLOG-03` Editar SEO do post e validar metadados na pagina.
4. [ ] `BLOG-04` Arquivar/remover post e validar que sai da listagem publica.

## 4.5 Tabela de precos

### 4.5.1 Implementacao

- [x] `CHK-075` Pagina publica de tabela de precos.
- [x] `CHK-076` Operacao admin para precos manuais.
- [x] `CHK-077` Estrutura para snapshots/sincronizacao de precos.

### 4.5.2 Testes sugeridos - BLK-PRECOS

1. [ ] `PRC-01` Inserir preco manual no admin e validar na pagina publica.
2. [ ] `PRC-02` Editar/remover registro e validar historico/resultado.
3. [ ] `PRC-03` Rodar rotina de sincronizacao (quando aplicavel) e validar logs.

## 4.6 Notificacoes

### 4.6.1 Implementacao

- [x] `CHK-078` Central de notificacoes no dashboard (`/app/notificacoes`).
- [x] `CHK-079` Hub admin de notificacoes (`/admin/notificacoes`).
- [x] `CHK-080` Envio manual em massa (canais in-app/email/push/whatsapp).
- [x] `CHK-081` Fila de notificacao com status e reprocessamento/cancelamento.
- [x] `CHK-082` Aba de registro consolidado de envios (manual + automatico quando identificado).
- [x] `CHK-083` Contadores no menu admin/dashboard.

### 4.6.2 Testes sugeridos - BLK-NOTIFICACOES

1. [ ] `NTF-01` Disparar envio manual para usuarios especificos.
2. [ ] `NTF-02` Validar criacao em `notifications` e `notification_queue`.
3. [ ] `NTF-03` Processar fila e validar transicao de status.
4. [ ] `NTF-04` Testar reprocessamento e cancelamento por item.
5. [ ] `NTF-05` Validar notificacao aparecendo no widget/central do usuario.
6. [ ] `NTF-06` Validar aba "Registro de envios" com filtros por canal/status/origem.

## 4.7 Suporte por tickets

### 4.7.1 Implementacao

- [x] `CHK-084` Lista de tickets no dashboard e no admin.
- [x] `CHK-085` Detalhe de ticket compartilhado por rota `/app/suporte/:id` e `/admin/suporte/:id`.
- [x] `CHK-086` Conversa/mensagens no ticket.
- [x] `CHK-087` Estados operacionais e indicacoes de SLA no admin.

### 4.7.2 Testes sugeridos - BLK-SUPORTE-TICKETS

1. [ ] `SUP-01` Abrir ticket como usuario.
2. [ ] `SUP-02` Responder ticket como admin.
3. [ ] `SUP-03` Validar alteracao de status e SLA.
4. [ ] `SUP-04` Validar atualizacao no detalhe para usuario e admin.
5. [ ] `SUP-05` Encerrar ticket e validar estado final.

## 4.8 Analytics admin

### 4.8.1 Implementacao

- [x] `CHK-088` Coleta de eventos de analytics no frontend (page_view, click, page_leave).
- [x] `CHK-089` Persistencia em `analytics_events`.
- [x] `CHK-090` Dashboard em `/admin/estatisticas` com:
  - [x] `CHK-091` acessos
  - [x] `CHK-092` cliques
  - [x] `CHK-093` CTR
  - [x] `CHK-094` tempo medio
  - [x] `CHK-095` usuarios novos
  - [x] `CHK-096` usuarios recorrentes
  - [x] `CHK-097` sessoes unicas
  - [x] `CHK-098` mix de dispositivos
  - [x] `CHK-099` top paginas e top cliques
  - [x] `CHK-100` localidade operacional

### 4.8.2 Testes sugeridos - BLK-ANALYTICS

1. [ ] `ANL-01` Navegar em paginas publicas/dashboard/admin para gerar eventos.
2. [ ] `ANL-02` Validar gravacao em `analytics_events`.
3. [ ] `ANL-03` Validar filtros por periodo no admin analytics.
4. [ ] `ANL-04` Conferir consistencia entre eventos e KPIs exibidos.

## 4.9 Configuracoes globais e definicoes visuais

### 4.9.1 Implementacao

- [x] `CHK-101` Configuracoes operacionais em `/admin/configuracoes` (site, suporte, SEO, toggles).
- [x] `CHK-102` Aba de "Definicoes visuais" com upload para:
  - [x] `CHK-103` logo light
  - [x] `CHK-104` logo dark
  - [x] `CHK-105` favicon
- [x] `CHK-106` Preview dos assets na pagina admin.
- [x] `CHK-107` Consumo dos assets no frontend publico:
  - [x] `CHK-108` header (logo dark)
  - [x] `CHK-109` rodape (logo light)
  - [x] `CHK-110` favicon dinamico

### 4.9.2 Testes sugeridos - BLK-SETTINGS-VISUAL

1. [ ] `SET-01` Fazer upload de logo dark e validar no header publico.
2. [ ] `SET-02` Fazer upload de logo light e validar no rodape publico.
3. [ ] `SET-03` Fazer upload de favicon e validar na aba do navegador.
4. [ ] `SET-04` Atualizar nome do site/SEO e validar reflexo onde aplicavel.
5. [ ] `SET-05` Validar fallback visual caso asset esteja ausente/corrompido.

## 4.10 Contato

### 4.10.1 Implementacao

- [x] `CHK-111` Pagina publica de contato.
- [x] `CHK-112` Captura de mensagens de contato.
- [x] `CHK-113` Gestao administrativa em `/admin/contato`.

### 4.10.2 Testes sugeridos - BLK-CONTATO

1. [ ] `CTT-01` Enviar mensagem no formulario publico.
2. [ ] `CTT-02` Validar entrada no admin de contato.
3. [ ] `CTT-03` Alterar status da mensagem no admin e validar persistencia.

## 4.11 Logs e auditoria

### 4.11.1 Implementacao

- [x] `CHK-114` Pagina admin de logs (`/admin/logs`).
- [x] `CHK-115` Tabelas de auditoria/integração no banco.
- [x] `CHK-116` Registro de eventos criticos em funcoes sensiveis.

### 4.11.2 Testes sugeridos - BLK-LOGS-AUDITORIA

1. [ ] `LOG-01` Executar operacoes criticas (aprovacao/reprovacao/envios).
2. [ ] `LOG-02` Validar rastros em logs administrativos.
3. [ ] `LOG-03` Confirmar se payloads e status estao coerentes com a acao.

## 5) Banco de dados, migrations e seguranca

## 5.1 Migrations existentes

- [x] `0001` ate `0027` versionadas no repositorio.
- [x] `CHK-117` Modulos principais cobertos: auth/perfis, catalogo, blog, precos, settings, contato, suporte, notificacoes, analytics.

## 5.2 Storage

- [x] `CHK-118` Buckets previstos em policy (`listing-media`, `blog-media`, `site-assets`).
- [x] `CHK-119` Leitura publica para buckets permitidos.
- [x] `CHK-120` Escrita administrativa para assets editoriais via policy.

## 5.3 RLS e policies

- [x] `CHK-121` RLS habilitado em tabelas sensiveis.
- [x] `CHK-122` Policies de acesso por owner/admin/public conforme contexto.
- [x] `CHK-123` `system_settings` com leitura publica e escrita admin.

## 5.4 Testes sugeridos de seguranca - BLK-SEG-RLS-POLICIES

1. [ ] `SEC-01` Usuario comum tentar editar dado admin deve falhar.
2. [ ] `SEC-02` Usuario anonimo tentar escrever em tabela privada deve falhar.
3. [ ] `SEC-03` Usuario owner deve acessar somente seus dados privados.
4. [ ] `SEC-04` Admin deve conseguir operacao total em modulos administrativos.

## 5.5 Validacao estrutural obrigatoria por migration/tabela sensivel - BLK-DB-ESTRUTURA

1. [ ] `DB-01` Todas as tabelas sensiveis possuem `created_at`.
2. [ ] `DB-02` Todas as tabelas sensiveis possuem `updated_at` quando aplicavel.
3. [ ] `DB-03` Trigger de `updated_at` ativo nas tabelas com `updated_at`.
4. [ ] `DB-04` Foreign keys presentes e coerentes com o dominio.
5. [ ] `DB-05` Constraints de integridade (checks, uniques) aplicadas conforme regra de negocio.
6. [ ] `DB-06` Indices essenciais criados para filtros e consultas operacionais.
7. [ ] `DB-07` RLS habilitado em todas as tabelas privadas/sensiveis.
8. [ ] `DB-08` Policies de owner/admin/public validadas por teste positivo e negativo.

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

1. [ ] `EF-01` Validar cada funcao com perfil/permissao correta.
2. [ ] `EF-02` Validar respostas de erro para payload invalido.
3. [ ] `EF-03` Validar trilha de logs das funcoes sensiveis.

### 6.2 Testes obrigatorios de autenticacao/autorizacao (Edge Functions sensiveis) - BLK-EF-AUTHZ

1. [ ] `EFA-01` Requisicao sem `Authorization: Bearer <access_token>` retorna `401`.
2. [ ] `EFA-02` Requisicao com token invalido/expirado retorna `401`.
3. [ ] `EFA-03` Requisicao com usuario sem permissao admin retorna `403` quando aplicavel.
4. [ ] `EFA-04` Funcoes administrativas validam `profiles.is_admin` ou `profiles.role = 'admin'`.
5. [ ] `EFA-05` Respostas de erro retornam JSON claro e consistente (`401`/`403`/`400`).

## 6.1 Segredos e uso de service role - BLK-SEG-SEGREDOS

1. [ ] `SEG-01` Nao ha segredo exposto no frontend (incluindo chaves administrativas).
2. [ ] `SEG-02` `service_role` usado apenas no backend/Edge Functions.
3. [ ] `SEG-03` Variaveis de ambiente publicas contem apenas dados seguros para cliente.
4. [ ] `SEG-04` Fluxos sensiveis nao dependem de permissao apenas no frontend.

## 7) Itens fora de escopo atual / nao encontrados como concluidos

- [ ] `CHK-142` Billing recorrente e assinatura ativa no produto.
- [ ] `CHK-143` Gateway de pagamento operacional para monetizacao.
- [ ] `CHK-144` Favoritos/alertas avancados de leads.
- [ ] `CHK-145` App nativo publicado em lojas.
- [ ] `CHK-146` CRM comercial completo.
- [ ] `CHK-147` Automacoes avancadas (A/B testing de notificacao, agendamento futuro completo etc.).

## 8) Checklist final de regressao (smoke test) - BLK-SMOKE-GERAL

1. [ ] `SMK-01` Build local (`npm run build`) sem erros.
2. [ ] `SMK-02` Login admin e acesso a todas as rotas `/admin`.
3. [ ] `SMK-03` Login usuario e acesso a todas as rotas `/app`.
4. [ ] `SMK-04` Home publica renderizando corretamente em desktop e mobile.
5. [ ] `SMK-05` Header e rodape exibindo logos corretos apos upload.
6. [ ] `SMK-06` Notificacoes chegando no centro do usuario.
7. [ ] `SMK-07` Criacao e moderacao de anuncio ponta a ponta.
8. [ ] `SMK-08` Ticket de suporte ponta a ponta.
9. [ ] `SMK-09` Dashboard de analytics com dados recentes.
10. [ ] `SMK-10` Deploy em producao refletindo a `BUILD_VERSION` mais recente.

## 8.1 Build version e rastreabilidade - BLK-BUILD-VERSION

1. [ ] `BLD-01` `src/lib/build-version.ts` revisado e incrementado na entrega.
2. [ ] `BLD-02` Rodape da area publica exibindo `Build <BUILD_VERSION>-<COMMIT_SHA_CURTO>`.
3. [ ] `BLD-03` Rodape do dashboard (`/app`) exibindo `Build <BUILD_VERSION>-<COMMIT_SHA_CURTO>`.
4. [ ] `BLD-04` Rodape do admin (`/admin`) exibindo `Build <BUILD_VERSION>-<COMMIT_SHA_CURTO>`.
5. [ ] `BLD-05` `COMMIT_SHA_CURTO` exibido corresponde ao commit publicado.

## 8.2 Validacao obrigatoria de deploy em producao - BLK-DEPLOY-PROD

1. [ ] `DEP-01` Deploy mais recente em estado `READY`.
2. [ ] `DEP-02` Dominio canonico apontando para o deploy mais recente.
3. [ ] `DEP-03` Revisao ativa em producao corresponde ao `HEAD` atual.
4. [ ] `DEP-04` Em caso de divergencia (HEAD/deploy/dominio), alias corrigido antes do encerramento.

## 8.3 Fluxo critico ponta a ponta com auditoria - BLK-FLUXO-E2E-AUDIT

1. [ ] `E2E-01` Usuario cria anuncio e salva em rascunho.
2. [ ] `E2E-02` Usuario envia anuncio para revisao (`pending_review`).
3. [ ] `E2E-03` Admin aprova anuncio e valida `slug` + `published_at` + exibicao publica.
4. [ ] `E2E-04` Admin rejeita anuncio e valida motivo + bloqueio de exibicao publica.
5. [ ] `E2E-05` Cada acao critica gera rastreabilidade em logs/auditoria.

## 8.4 Storage e permissoes por bucket - BLK-STORAGE-PERMISSOES

1. [ ] `STR-01` Upload de imagens de anuncio funcional em `listing-media`.
2. [ ] `STR-02` Upload de assets de blog funcional em `blog-media`.
3. [ ] `STR-03` Upload de logos/favicon funcional em `site-assets`.
4. [ ] `STR-04` Leitura publica apenas onde previsto por policy.
5. [ ] `STR-05` Tentativa de escrita indevida por usuario sem permissao falha.

## 8.5 Estados de UX obrigatorios (telas criticas) - BLK-UX-ESTADOS

1. [ ] `UX-01` Estados de loading validados nas telas principais (publico, `/app`, `/admin`).
2. [ ] `UX-02` Estados de erro com mensagem clara e recuperacao basica.
3. [ ] `UX-03` Estados vazios com orientacao de proximo passo.
4. [ ] `UX-04` Estados de sucesso com feedback visivel ao usuario.

## 9) Observacoes para uso deste documento

- Este checklist mistura estado de implementacao (codigo) e validacao funcional (QA).
- Sempre que um item for retestado, registrar data, ambiente e responsavel.
- Para auditoria de release, anexar evidencias (prints, logs, ids de registro e build version).
- Documento recomendado para validacao de Go/No-Go antes de publicacao critica.

## 10) Higiene documental (fonte de verdade)

- [ ] `CHK-148` Confirmar que os caminhos dos documentos-base referenciados no AGENTS.md existem e estao atualizados.
- [ ] `CHK-149` Em caso de renomeacao/movimentacao de arquivos de arquitetura, atualizar referencias internas antes da release.
