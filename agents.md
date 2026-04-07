# AGENTS.md

## Projeto

Zap Sucatas é uma plataforma web de classificados e marketplace de sucatas e maquinários.

Este repositório deve seguir o blueprint funcional e arquitetural definido no arquivo:

- `zapsucatas_blueprint_execucao_mvp`

Esse arquivo é a principal fonte de verdade do MVP.

---

## Regra principal

Antes de implementar qualquer módulo, leia integralmente `zapsucatas_blueprint_execucao_mvp` e use-o como referência para:

- escopo do MVP;
- mapa de páginas;
- domínios do sistema;
- modelagem inicial do banco;
- Edge Functions;
- regras de segurança;
- ordem de implementação.

Não invente módulos fora do escopo sem sinalizar isso claramente.

Quando houver lacuna no blueprint:
- adote a opção mais segura e escalável;
- explicite a premissa adotada;
- mantenha aderência ao MVP.

---

## Stack obrigatória

Salvo instrução contrária explícita, usar:

- React
- TypeScript
- Vite
- Tailwind CSS
- Radix UI
- shadcn/ui
- React Router
- TanStack React Query
- Supabase Auth
- PostgreSQL no Supabase
- Supabase Storage
- Supabase Edge Functions
- Vercel

---

## Arquitetura obrigatória

Separar claramente:

- área pública;
- dashboard do usuário;
- painel admin;
- backend sensível em Edge Functions;
- banco como fonte central da regra persistida;
- storage organizado por contexto.

Estrutura alvo:

- `src/app`
- `src/components`
- `src/domains`
- `src/pages`
- `src/hooks`
- `src/lib`
- `src/integrations/supabase`
- `supabase/functions`
- `supabase/migrations`

Preferir organização por domínio para regras, hooks, queries, mutations, tipos e componentes específicos.

---

## Modo de trabalho

Antes de sair criando arquivos, sempre:

1. ler o blueprint;
2. resumir o que será implementado;
3. identificar entidades afetadas;
4. identificar impacto em frontend, backend, banco e segurança;
5. implementar por etapas pequenas e coerentes.

Sempre que a tarefa for ampla, primeiro produzir:
- plano curto de execução;
- lista dos arquivos a criar/alterar;
- dependências técnicas da etapa.

---

## Segurança obrigatória

Nunca concentrar regra crítica apenas no frontend.

Sempre considerar:

- autenticação obrigatória em áreas privadas;
- autorização por `role`, `is_admin` e status operacional;
- RLS em tabelas sensíveis;
- validação dupla em fluxos críticos;
- Edge Functions para ações administrativas e integrações externas;
- segredos nunca expostos no cliente;
- logs/auditoria para ações críticas.

Leitura pública só quando realmente necessária.

---

## Banco de dados

O banco deve ser mantido por migrations SQL versionadas.

Toda mudança estrutural relevante deve gerar migration.

Sempre prever quando fizer sentido:

- foreign keys;
- índices;
- constraints;
- `created_at`;
- `updated_at`;
- status explícitos;
- trigger de `updated_at`;
- RLS;
- policies;
- logs de auditoria;
- idempotência para automações.

Não depender de configuração manual no painel como fonte oficial da estrutura.

---

## Edge Functions

Usar Edge Functions para:

- aprovação/reprovação administrativa;
- notificações;
- integrações externas;
- sincronizações;
- rotinas agendadas;
- qualquer operação que exija service role ou segredo.

Cada função deve ter responsabilidade clara, validação explícita e logs úteis.

---

## UI/UX

A interface deve seguir padrão profissional, limpo, comercial e escalável.

Prioridades:

- responsividade real;
- clareza de navegação;
- estados de loading, erro, vazio e sucesso;
- consistência entre público, dashboard e admin;
- formulários bem agrupados;
- tabelas e filtros operacionais no admin;
- foco em ação no dashboard.

Evitar aparência genérica e improvisada.

---

## Sequência preferida de implementação

Seguir preferencialmente esta ordem:

1. fundação do projeto;
2. auth e perfis;
3. catálogo e anúncios;
4. moderação admin;
5. perguntas e respostas;
6. blog;
7. tabela de preços;
8. integrações e automações;
9. hardening de segurança, SEO e UX final.

---

## Regras para implementação

Ao implementar:

- não apagar estrutura existente sem motivo claro;
- não introduzir dependência desnecessária;
- não criar abstração excessiva cedo demais;
- não deixar TODO genérico sem contexto;
- não usar mocks permanentes em fluxo real.

Se criar placeholder, ele deve ser curto, explícito e fácil de substituir.

---

## Regras para resposta dentro do repositório

Quando receber uma tarefa, responder de forma objetiva e técnica.

Sempre que útil, informar:
- o que foi entendido;
- o que será alterado;
- quais arquivos serão criados/editados;
- quais premissas foram assumidas;
- quais riscos ou lacunas existem.

---

## Fonte de verdade do MVP

Se houver conflito entre implementação ad hoc e o blueprint:

- priorizar `zapsucatas_blueprint_execucao_mvp`;
- se o blueprint estiver insuficiente, registrar a premissa adotada no código ou na resposta;
- não expandir escopo sem avisar.

