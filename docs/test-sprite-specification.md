# Zap Sucatas - Especificacao para Geracao de Testes na Test Sprite

## 1. Objetivo do documento

Este documento descreve o comportamento funcional da plataforma Zap Sucatas para apoiar a geracao automatica de testes na plataforma Test Sprite.

O foco e cobrir o fluxo real do produto no MVP:

- area publica;
- dashboard do anunciante;
- painel administrativo;
- notificacoes em tempo real;
- suporte por ticket;
- moderação de anuncios;
- blog;
- tabela de precos;
- configuracoes globais.

## 2. Contexto do produto

Zap Sucatas e um marketplace web de sucatas e maquinarios com publicacao moderada.

Fluxo central:

1. o anunciante cria um anuncio;
2. o anuncio pode ser salvo como rascunho ou enviado para revisao;
3. o admin aprova ou rejeita;
4. apenas anuncios aprovados ficam publicos.

O sistema usa:

- React + TypeScript + Vite;
- Tailwind CSS + Radix UI + shadcn/ui;
- React Router;
- TanStack React Query;
- Supabase Auth;
- PostgreSQL no Supabase;
- Supabase Storage;
- Supabase Edge Functions;
- Vercel.

## 3. Ambientes e cuidados para teste

### 3.1 Ambientes

- ambiente local de desenvolvimento;
- ambiente publicado em producao;
- Supabase remoto como fonte de verdade dos dados.

### 3.2 Regras de seguranca para testes

- usar contas de teste quando possivel;
- nao apagar dados reais fora de testes controlados;
- nao arquivar, excluir ou rejeitar anuncios reais sem necessidade;
- nao alterar configuracoes globais em producao sem validar o impacto;
- notificacoes, tickets e perguntas precisam respeitar o contexto do usuario logado.

### 3.3 Contas de teste conhecidas

Use estas contas de QA quando disponiveis:

- usuario: `qa-user@zapsucatas.local`
- senha: `ZapSucatas@2026!User`
- admin: `qa-admin@zapsucatas.local`
- senha: `ZapSucatas@2026!Admin`

Se uma conta nao estiver disponivel, o teste deve falhar com erro claro.

## 4. Areas do sistema

### 4.1 Area publica

Rotas principais:

- `/`
- `/anuncios`
- `/anuncios/:slug`
- `/categorias`
- `/categorias/:slug`
- `/tabela-de-precos`
- `/blog`
- `/blog/:slug`
- `/sobre`
- `/contato`
- `/login`
- `/cadastro`
- `/recuperar-senha`

### 4.2 Dashboard do anunciante

Rotas principais:

- `/app`
- `/app/anuncios`
- `/app/anuncios/novo`
- `/app/anuncios/:id/editar`
- `/app/perguntas`
- `/app/notificacoes`
- `/app/suporte`
- `/app/perfil`
- `/app/configuracoes`

### 4.3 Painel administrativo

Rotas principais:

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
- `/admin/notificacoes`
- `/admin/suporte`

## 5. Entidades principais

### 5.1 Profiles

Tabela de perfis autenticados com papel e status.

Campos relevantes:

- `id`
- `auth_user_id`
- `full_name`
- `email`
- `role`
- `is_admin`
- `status`

### 5.2 Listings

Anuncios da plataforma.

Campos relevantes:

- `id`
- `user_id`
- `title`
- `slug`
- `status`
- `category_id`
- `primary_material_id`
- `summary`
- `description`
- `state`
- `city`
- `contact_name`
- `contact_phone`
- `contact_phone_is_whatsapp`
- `price_label`
- `is_featured`
- `published_at`
- `rejection_reason`

### 5.3 Listing images

Imagens do anuncio, com ordenacao e capa.

Campos relevantes:

- `id`
- `listing_id`
- `storage_path`
- `is_cover`
- `sort_order`
- `alt_text`

### 5.4 Questions and answers

Perguntas do anuncio e respostas associadas.

Campos relevantes:

- `listing_questions.id`
- `listing_questions.listing_id`
- `listing_questions.question_text`
- `listing_questions.status`
- `listing_answers.answer_text`
- `listing_answers.responder_user_id`

### 5.5 Notifications

Notificacoes in-app e fila transacional.

Tabelas:

- `notifications`
- `notification_queue`
- `notification_preferences`
- `notification_delivery_logs`

### 5.6 Support tickets

Tickets de suporte sao exibidos no painel do anunciante e no admin.

Estados relevantes:

- aberto;
- em atendimento;
- respondido;
- encerrado;
- pausado.

### 5.7 Configuracoes globais

Tabela `system_settings` controla:

- nome do site;
- email de suporte;
- email administrativo para notificacoes;
- manutencao;
- perguntas anonimas;
- blog habilitado;
- pagamentos em destaque;
- configuracoes de retenção de notificacoes;
- assets visuais.

## 6. Fluxos criticos para teste

### 6.1 Autenticacao

Validar:

- login com senha;
- logout;
- redirecionamento por role;
- recuperacao de senha;
- acesso negado para usuario comum em rotas admin;
- acesso negado sem login para rotas privadas.

### 6.2 Anuncios

Validar:

- criar anuncio;
- salvar rascunho;
- enviar para revisao;
- editar anuncio;
- reorganizar imagens por drag and drop;
- definir imagem de capa;
- remover imagem;
- aprovar anuncio no admin;
- rejeitar anuncio no admin;
- pausar e arquivar anuncio;
- exibir anuncio aprovado no publico;
- esconder anuncio pausado/arquivado no publico.

### 6.3 Perguntas e respostas

Validar:

- enviar pergunta no detalhe do anuncio;
- respeitar regra de perguntas anonimas;
- anunciante responder pergunta;
- admin moderar pergunta;
- atualizacao em tempo real quando possivel.

### 6.4 Notificacoes

Validar:

- widget do cliente exibe notificacoes do proprio perfil;
- widget do admin exibe o feed amplo de notificacoes da plataforma;
- notificacoes aparecem em tempo real;
- abrir item leva para a rota correta;
- marcar como lida funciona;
- limpar widget oculta apenas localmente;
- excluir todas remove notificacoes de verdade quando acionado no admin;
- configuracao de retencao automatica funciona.

### 6.5 Suporte

Validar:

- abrir ticket;
- listar tickets;
- responder ticket;
- realtime das mensagens;
- nome do atendente no admin;
- persistencia do nome do atendente;
- SLA e metadados no ticket;
- fechamento e estado final.

### 6.6 Blog

Validar:

- criar post em rascunho;
- publicar post;
- editar SEO;
- arquivar post;
- listagem publica refletir status.

### 6.7 Tabela de precos

Validar:

- visualizar pagina publica;
- atualizar valor manualmente no admin;
- importar planilha `.xlsx`;
- exportar planilha `.xlsx`;
- formatacao monetaria manter `R$ 4,11`;
- sincronizacao historica LME;
- pagina publica refletir ultima atualizacao.

### 6.8 Configuracoes

Validar:

- alterar nome do site;
- alterar email de suporte;
- alterar email administrativo;
- alternar modo manutencao;
- alternar perguntas anonimas;
- alternar blog habilitado;
- alternar pagamentos em destaque;
- ajustar retenção automatica de notificacoes.

## 7. Estados de UI que os testes devem cobrir

Cada tela relevante deve ser validada nestes estados:

- loading;
- vazio;
- erro;
- sucesso;
- pagina com dados reais;
- pagina responsiva em desktop;
- pagina responsiva em mobile quando aplicavel.

## 8. Regras de negocio importantes

### 8.1 Anuncios

- apenas anuncios aprovados devem ser publicos;
- anuncios em rascunho, revisao, rejeitados, pausados ou arquivados nao devem aparecer no catalogo publico;
- o slug publico deve ser mantido apenas para anuncios publicados;
- a capa pode mudar, mas a imagem principal precisa ser consistente com a ordem das imagens;
- a ordenacao das imagens deve persistir.

### 8.2 Notificacoes

- o cliente ve somente suas notificacoes;
- o admin ve o feed completo da plataforma no widget;
- o widget deve atualizar sem refresh quando houver realtime;
- excluir todas deve afetar somente os registros reais, nao apenas a UI;
- limpar widget nao deve apagar notificacoes do banco;
- a retencao automatica deve respeitar o limite em dias configurado.

### 8.3 Suporte

- o nome do atendente salvo no ticket nao deve mudar depois da primeira resposta;
- mensagens devem sincronizar em tempo real para os dois lados;
- anexos e mensagens antigas devem permanecer visiveis no historico.

### 8.4 Configuracoes

- alteracoes globais devem persistir no Supabase;
- configuracoes de retencao de notificacoes devem ser editaveis no admin;
- qualquer mudança de configuracao deve refletir nos componentes que leem system settings.

## 9. Seletores e rotas estaveis para automacao

Se a Test Sprite precisar localizar elementos, priorizar estes pontos:

- campos com `label` visivel;
- botoes com texto explicito;
- rotas canonicas ja existentes;
- tabelas com linhas identificaveis por texto unico do item;
- dialogs com titulo e botao de confirmacao.

Exemplos de alvos estaveis:

- `#listing-title`
- `#listing-category`
- `#listing-material`
- `#listing-summary`
- `#listing-description`
- `#login-email`
- `#login-password`
- `#notification-retention-days`

## 10. Casos prioritarios de teste

### 10.1 Smoke publico

- abrir home;
- navegar para anuncios;
- abrir um anuncio publicado;
- validar pagina de categoria;
- validar blog e contato.

### 10.2 Smoke do anunciante

- login;
- criar anuncio;
- salvar rascunho;
- enviar para revisao;
- editar anuncio;
- ver notificacao e perguntas;
- abrir suporte.

### 10.3 Smoke do admin

- login;
- abrir dashboard;
- abrir widget de notificacoes;
- abrir central de notificacoes;
- moderar anuncio;
- moderar pergunta;
- responder ticket;
- atualizar configuracoes;
- limpar notificacoes;
- configurar retenção automatica.

### 10.4 Regressao critica

- anuncio enviado para revisao gera notificacao no admin;
- resposta no suporte chega em realtime para ambos os lados;
- anuncio aprovado aparece no publico;
- anuncio pausado sai do publico;
- notificacao nova aparece sem atualizar a pagina;
- exclusao de notificacoes funciona por backend;
- retenção automatica pode ser salva e executada.

## 11. Dados de teste sugeridos

Usar valores unicos para evitar colisao entre execucoes:

- titulo de anuncio: `QA anuncio <timestamp>`;
- pergunta: `QA pergunta <timestamp>`;
- ticket: `QA ticket <timestamp>`;
- post de blog: `QA post <timestamp>`;
- notificacao manual: `QA notificacao <timestamp>`.

Imagens sugeridas:

- usar um arquivo real do repositorio quando o teste envolver upload;
- confirmar que o upload permanece visivel no anuncio e no card.

## 12. Critérios de sucesso esperados

Um conjunto de testes gerado a partir deste documento deve:

- cobrir os fluxos principais do MVP;
- validar autorizacao por role;
- validar persistencia real no Supabase;
- validar realtime quando existir;
- evitar falsos positivos por depender apenas da UI;
- não apagar dados reais sem contexto de teste;
- refletir os labels e rotas atuais da aplicação.

## 13. Observacoes finais

Este documento deve ser tratado como base funcional para geração de testes automatizados e manuais.

Se houver divergencia entre este arquivo e a implementacao real, a implementacao atual da aplicação e os blueprints do projeto continuam sendo a fonte de verdade.
