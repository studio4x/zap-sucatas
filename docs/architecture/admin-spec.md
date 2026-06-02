# Zap Sucatas Admin Spec

## Objetivo

Definir o comportamento funcional e operacional do painel administrativo da Zap Sucatas no MVP.

## Escopo

- moderação de anúncios;
- gestão de categorias, materiais, localidades e usuários;
- blog editorial;
- tabela de preços;
- notificações;
- suporte por tickets;
- analytics;
- logs e auditoria;
- configurações globais e visuais.

## Princípios

- Toda ação sensível deve exigir autenticação e autorização admin.
- Regras críticas não devem depender apenas do frontend.
- Operações de moderação e outras ações sensíveis devem passar por Edge Functions quando houver segredo, auditoria ou necessidade de service role.
- O painel deve sempre refletir o estado persistido no banco e nas policies.

## Rotas do admin

- `/admin`
- `/admin/anuncios`
- `/admin/anuncios/novo`
- `/admin/anuncios/:id`
- `/admin/blog`
- `/admin/contato`
- `/admin/estatisticas`
- `/admin/localidades`
- `/admin/logs`
- `/admin/notificacoes`
- `/admin/perfis`
- `/admin/perguntas`
- `/admin/precos`
- `/admin/suporte`
- `/admin/configuracoes`
- `/admin/materiais`
- `/admin/usuarios`

## Fluxos críticos

1. Aprovar, rejeitar ou arquivar anúncios.
2. Gerenciar categorias, materiais e localidades.
3. Publicar e remover posts do blog.
4. Operar notificações manuais e transacionais.
5. Responder tickets de suporte.
6. Consultar métricas e registros de auditoria.
7. Ajustar configurações globais e assets visuais.

## Critérios de aceitação

- painel acessível apenas para admin autenticado;
- ações críticas registradas em logs/auditoria;
- telas com estados de loading, erro, vazio e sucesso;
- consistência entre dados exibidos e dados persistidos;
- rotas e labels do admin estáveis para uso em QA e E2E.
