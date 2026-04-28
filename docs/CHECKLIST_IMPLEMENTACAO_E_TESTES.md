# CHECKLIST DE IMPLEMENTACAO E TESTES - ZAP SUCATAS

Data de referencia: 2026-04-27
Objetivo: servir como checklist unico para validar o que ja foi implementado, executar testes funcionais e identificar lacunas de escopo.

## 1) Legenda

- [x] Implementado no codigo
- [ ] Pendente de validacao funcional/QA
- [ ] Nao implementado (ou fora do escopo atual)

## 2) Resumo executivo do estado atual

- [x] Estrutura principal do MVP implementada com separacao de areas: publica, dashboard e admin.
- [x] Autenticacao com Supabase Auth e guards de rota implementados.
- [x] Catalogo, anuncios, perguntas e moderacao admin implementados.
- [x] Blog publico/admin implementado.
- [x] Tabela de precos (manual + snapshots) implementada.
- [x] Modulo de tickets de suporte implementado.
- [x] Modulo de notificacoes implementado (envio admin, fila, historico e central do usuario).
- [x] Modulo de analytics admin implementado (eventos + dashboard).
- [x] Configuracoes globais implementadas, incluindo aba de definicoes visuais.
- [x] Upload de logos/favicons implementado e consumo no frontend publico (header/rodape/favicon) implementado.

## 3) Rotas e paginas implementadas

### 3.1 Publico

- [x] `/`
- [x] `/anuncios`
- [x] `/anuncios/:slug`
- [x] `/categorias`
- [x] `/categorias/:slug`
- [x] `/tabela-de-precos`
- [x] `/blog`
- [x] `/blog/:slug`
- [x] `/sobre`
- [x] `/contato`
- [x] `/suporte`
- [x] `/login`
- [x] `/cadastro`
- [x] `/recuperar-senha`

### 3.2 Dashboard do usuario

- [x] `/app`
- [x] `/app/anuncios`
- [x] `/app/anuncios/novo`
- [x] `/app/anuncios/:id/editar`
- [x] `/app/perguntas`
- [x] `/app/notificacoes`
- [x] `/app/suporte`
- [x] `/app/suporte/:id`
- [x] `/app/perfil`
- [x] `/app/configuracoes`

### 3.3 Admin

- [x] `/admin`
- [x] `/admin/anuncios`
- [x] `/admin/anuncios/novo`
- [x] `/admin/anuncios/:id/editar`
- [x] `/admin/anuncios/:id`
- [x] `/admin/perguntas`
- [x] `/admin/usuarios`
- [x] `/admin/estatisticas`
- [x] `/admin/contato`
- [x] `/admin/suporte`
- [x] `/admin/suporte/:id`
- [x] `/admin/notificacoes`
- [x] `/admin/categorias`
- [x] `/admin/materiais`
- [x] `/admin/localidades`
- [x] `/admin/blog`
- [x] `/admin/precos`
- [x] `/admin/configuracoes`
- [x] `/admin/logs`

## 4) Checklist funcional por modulo

## 4.1 Autenticacao e controle de acesso

### Implementacao

- [x] Login com email/senha.
- [x] Cadastro de usuario.
- [x] Recuperacao de senha.
- [x] Guards de autenticacao (`AuthGuard`, `GuestGuard`, `RoleGuard`).
- [x] Separacao de acesso admin vs usuario comum.

### Testes sugeridos

1. [ ] Acessar `/app` sem login deve redirecionar para login.
2. [ ] Acessar `/admin` com usuario nao-admin deve bloquear acesso.
3. [ ] Criar conta nova e confirmar sessao no dashboard.
4. [ ] Solicitar recuperacao de senha e validar fluxo completo.
5. [ ] Logout deve encerrar sessao e restringir rotas privadas.

## 4.2 Catalogo e anuncios

### Implementacao

- [x] Listagem publica com busca e filtros.
- [x] Detalhe publico de anuncio por slug.
- [x] CRUD de anuncios no dashboard.
- [x] CRUD de anuncios no admin (inclui novo/editar/detalhe).
- [x] Upload e ordenacao de imagens.
- [x] Estados operacionais de anuncio (draft/review/approved/rejected etc.).

### Testes sugeridos

1. [ ] Criar anuncio no dashboard e salvar como rascunho.
2. [ ] Enviar anuncio para revisao e validar mudanca de status.
3. [ ] Aprovar anuncio no admin e validar exibicao publica.
4. [ ] Reprovar anuncio no admin e validar motivo/feedback ao usuario.
5. [ ] Editar anuncio aprovado e validar consistencia dos dados.
6. [ ] Validar filtros publicos por categoria/material/localidade.

## 4.3 Perguntas e respostas

### Implementacao

- [x] Perguntas no anuncio publico.
- [x] Caixa de perguntas do anunciante no dashboard.
- [x] Moderacao de perguntas no admin.

### Testes sugeridos

1. [ ] Enviar pergunta em anuncio publicado.
2. [ ] Responder pergunta no dashboard do anunciante.
3. [ ] Moderar pergunta no admin (publicar/ocultar/bloquear conforme regra).
4. [ ] Validar exibicao da resposta no anuncio publico.

## 4.4 Blog

### Implementacao

- [x] Listagem publica de posts.
- [x] Detalhe publico de post.
- [x] CRUD de posts no admin.
- [x] Gestao de categorias/tags de blog no admin.

### Testes sugeridos

1. [ ] Criar post em rascunho no admin.
2. [ ] Publicar post e validar rota publica por slug.
3. [ ] Editar SEO do post e validar metadados na pagina.
4. [ ] Arquivar/remover post e validar que sai da listagem publica.

## 4.5 Tabela de precos

### Implementacao

- [x] Pagina publica de tabela de precos.
- [x] Operacao admin para precos manuais.
- [x] Estrutura para snapshots/sincronizacao de precos.

### Testes sugeridos

1. [ ] Inserir preco manual no admin e validar na pagina publica.
2. [ ] Editar/remover registro e validar historico/resultado.
3. [ ] Rodar rotina de sincronizacao (quando aplicavel) e validar logs.

## 4.6 Notificacoes

### Implementacao

- [x] Central de notificacoes no dashboard (`/app/notificacoes`).
- [x] Hub admin de notificacoes (`/admin/notificacoes`).
- [x] Envio manual em massa (canais in-app/email/push/whatsapp).
- [x] Fila de notificacao com status e reprocessamento/cancelamento.
- [x] Aba de registro consolidado de envios (manual + automatico quando identificado).
- [x] Contadores no menu admin/dashboard.

### Testes sugeridos

1. [ ] Disparar envio manual para usuarios especificos.
2. [ ] Validar criacao em `notifications` e `notification_queue`.
3. [ ] Processar fila e validar transicao de status.
4. [ ] Testar reprocessamento e cancelamento por item.
5. [ ] Validar notificacao aparecendo no widget/central do usuario.
6. [ ] Validar aba "Registro de envios" com filtros por canal/status/origem.

## 4.7 Suporte por tickets

### Implementacao

- [x] Lista de tickets no dashboard e no admin.
- [x] Detalhe de ticket compartilhado por rota `/app/suporte/:id` e `/admin/suporte/:id`.
- [x] Conversa/mensagens no ticket.
- [x] Estados operacionais e indicacoes de SLA no admin.

### Testes sugeridos

1. [ ] Abrir ticket como usuario.
2. [ ] Responder ticket como admin.
3. [ ] Validar alteracao de status e SLA.
4. [ ] Validar atualizacao no detalhe para usuario e admin.
5. [ ] Encerrar ticket e validar estado final.

## 4.8 Analytics admin

### Implementacao

- [x] Coleta de eventos de analytics no frontend (page_view, click, page_leave).
- [x] Persistencia em `analytics_events`.
- [x] Dashboard em `/admin/estatisticas` com:
  - [x] acessos
  - [x] cliques
  - [x] CTR
  - [x] tempo medio
  - [x] usuarios novos
  - [x] usuarios recorrentes
  - [x] sessoes unicas
  - [x] mix de dispositivos
  - [x] top paginas e top cliques
  - [x] localidade operacional

### Testes sugeridos

1. [ ] Navegar em paginas publicas/dashboard/admin para gerar eventos.
2. [ ] Validar gravacao em `analytics_events`.
3. [ ] Validar filtros por periodo no admin analytics.
4. [ ] Conferir consistencia entre eventos e KPIs exibidos.

## 4.9 Configuracoes globais e definicoes visuais

### Implementacao

- [x] Configuracoes operacionais em `/admin/configuracoes` (site, suporte, SEO, toggles).
- [x] Aba de "Definicoes visuais" com upload para:
  - [x] logo light
  - [x] logo dark
  - [x] favicon
- [x] Preview dos assets na pagina admin.
- [x] Consumo dos assets no frontend publico:
  - [x] header (logo dark)
  - [x] rodape (logo light)
  - [x] favicon dinamico

### Testes sugeridos

1. [ ] Fazer upload de logo dark e validar no header publico.
2. [ ] Fazer upload de logo light e validar no rodape publico.
3. [ ] Fazer upload de favicon e validar na aba do navegador.
4. [ ] Atualizar nome do site/SEO e validar reflexo onde aplicavel.
5. [ ] Validar fallback visual caso asset esteja ausente/corrompido.

## 4.10 Contato

### Implementacao

- [x] Pagina publica de contato.
- [x] Captura de mensagens de contato.
- [x] Gestao administrativa em `/admin/contato`.

### Testes sugeridos

1. [ ] Enviar mensagem no formulario publico.
2. [ ] Validar entrada no admin de contato.
3. [ ] Alterar status da mensagem no admin e validar persistencia.

## 4.11 Logs e auditoria

### Implementacao

- [x] Pagina admin de logs (`/admin/logs`).
- [x] Tabelas de auditoria/integração no banco.
- [x] Registro de eventos criticos em funcoes sensiveis.

### Testes sugeridos

1. [ ] Executar operacoes criticas (aprovacao/reprovacao/envios).
2. [ ] Validar rastros em logs administrativos.
3. [ ] Confirmar se payloads e status estao coerentes com a acao.

## 5) Banco de dados, migrations e seguranca

## 5.1 Migrations existentes

- [x] `0001` ate `0027` versionadas no repositorio.
- [x] Modulos principais cobertos: auth/perfis, catalogo, blog, precos, settings, contato, suporte, notificacoes, analytics.

## 5.2 Storage

- [x] Buckets previstos em policy (`listing-media`, `blog-media`, `site-assets`).
- [x] Leitura publica para buckets permitidos.
- [x] Escrita administrativa para assets editoriais via policy.

## 5.3 RLS e policies

- [x] RLS habilitado em tabelas sensiveis.
- [x] Policies de acesso por owner/admin/public conforme contexto.
- [x] `system_settings` com leitura publica e escrita admin.

## 5.4 Testes sugeridos de seguranca

1. [ ] Usuario comum tentar editar dado admin deve falhar.
2. [ ] Usuario anonimo tentar escrever em tabela privada deve falhar.
3. [ ] Usuario owner deve acessar somente seus dados privados.
4. [ ] Admin deve conseguir operacao total em modulos administrativos.

## 6) Edge Functions existentes

- [x] `submit-listing-for-review`
- [x] `approve-listing`
- [x] `reject-listing`
- [x] `answer-listing-question`
- [x] `moderate-listing-question`
- [x] `manage-listing-lifecycle`
- [x] `manage-listing-category`
- [x] `manage-listing-material`
- [x] `manage-user-account`
- [x] `reorder-listing-images`
- [x] `sync-lme-prices`
- [x] `submit-contact-message`
- [x] `notify-listing-status`
- [x] `notify-support`
- [x] `send-notification`
- [x] `process-notifications`
- [x] `get-notifications`
- [x] `mark-notification-read`

### Testes sugeridos

1. [ ] Validar cada funcao com perfil/permissao correta.
2. [ ] Validar respostas de erro para payload invalido.
3. [ ] Validar trilha de logs das funcoes sensiveis.

## 7) Itens fora de escopo atual / nao encontrados como concluidos

- [ ] Billing recorrente e assinatura ativa no produto.
- [ ] Gateway de pagamento operacional para monetizacao.
- [ ] Favoritos/alertas avancados de leads.
- [ ] App nativo publicado em lojas.
- [ ] CRM comercial completo.
- [ ] Automacoes avancadas (A/B testing de notificacao, agendamento futuro completo etc.).

## 8) Checklist final de regressao (smoke test)

1. [ ] Build local (`npm run build`) sem erros.
2. [ ] Login admin e acesso a todas as rotas `/admin`.
3. [ ] Login usuario e acesso a todas as rotas `/app`.
4. [ ] Home publica renderizando corretamente em desktop e mobile.
5. [ ] Header e rodape exibindo logos corretos apos upload.
6. [ ] Notificacoes chegando no centro do usuario.
7. [ ] Criacao e moderacao de anuncio ponta a ponta.
8. [ ] Ticket de suporte ponta a ponta.
9. [ ] Dashboard de analytics com dados recentes.
10. [ ] Deploy em producao refletindo a `BUILD_VERSION` mais recente.

## 9) Observacoes para uso deste documento

- Este checklist mistura estado de implementacao (codigo) e validacao funcional (QA).
- Sempre que um item for retestado, registrar data, ambiente e responsavel.
- Para auditoria de release, anexar evidencias (prints, logs, ids de registro e build version).
- Documento recomendado para validacao de Go/No-Go antes de publicacao critica.
