# AGENTS.md

## Projeto

Zap Sucatas e uma plataforma web de classificados e marketplace de sucatas e maquinarios.

Este repositorio deve seguir os documentos-base abaixo:

- `docs/architecture/zapsucatas-blueprint-mvp.md`
- `docs/architecture/admin-spec.md`

Esse arquivo e a principal fonte de verdade do MVP.

---

## Regra principal

Antes de implementar qualquer modulo, leia integralmente:

- `docs/architecture/zapsucatas-blueprint-mvp.md`
- `docs/architecture/admin-spec.md`

Use esses arquivos como referencia para:

- escopo do MVP;
- mapa de paginas;
- dominios do sistema;
- modelagem inicial do banco;
- Edge Functions;
- regras de seguranca;
- ordem de implementacao;
- direcao visual e estrutural do admin.

Nao invente modulos fora do escopo sem sinalizar isso claramente.

Quando houver lacuna no blueprint:
- adote a opcao mais segura e escalavel;
- explicite a premissa adotada;
- mantenha aderencia ao MVP.

---

## Stack obrigatoria

Salvo instrucao contraria explicita, usar:

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

## Arquitetura obrigatoria

Separar claramente:

- area publica;
- dashboard do usuario;
- painel admin;
- backend sensivel em Edge Functions;
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

Preferir organizacao por dominio para regras, hooks, queries, mutations, tipos e componentes especificos.

---

## Modo de trabalho

Antes de sair criando arquivos, sempre:

1. ler o blueprint;
2. resumir o que sera implementado;
3. identificar entidades afetadas;
4. identificar impacto em frontend, backend, banco e seguranca;
5. implementar por etapas pequenas e coerentes.

Sempre que a tarefa for ampla, primeiro produzir:
- plano curto de execucao;
- lista dos arquivos a criar/alterar;
- dependencias tecnicas da etapa.

---

## Seguranca obrigatoria

Nunca concentrar regra critica apenas no frontend.

Sempre considerar:

- autenticacao obrigatoria em areas privadas;
- autorizacao por `role`, `is_admin` e status operacional;
- RLS em tabelas sensiveis;
- validacao dupla em fluxos criticos;
- Edge Functions para acoes administrativas e integracoes externas;
- segredos nunca expostos no cliente;
- logs/auditoria para acoes criticas.

Leitura publica so quando realmente necessaria.

---

## Banco de dados

O banco deve ser mantido por migrations SQL versionadas.

Toda mudanca estrutural relevante deve gerar migration.

Sempre prever quando fizer sentido:

- foreign keys;
- indices;
- constraints;
- `created_at`;
- `updated_at`;
- status explicitos;
- trigger de `updated_at`;
- RLS;
- policies;
- logs de auditoria;
- idempotencia para automacoes.

Nao depender de configuracao manual no painel como fonte oficial da estrutura.

---

## Edge Functions

Usar Edge Functions para:

- aprovacao/reprovacao administrativa;
- notificacoes;
- integracoes externas;
- sincronizacoes;
- rotinas agendadas;
- qualquer operacao que exija service role ou segredo.

Cada funcao deve ter responsabilidade clara, validacao explicita e logs uteis.

---

## UI/UX

A interface deve seguir padrao profissional, limpo, comercial e escalavel.

Prioridades:

- responsividade real;
- clareza de navegacao;
- estados de loading, erro, vazio e sucesso;
- consistencia entre publico, dashboard e admin;
- formularios bem agrupados;
- tabelas e filtros operacionais no admin;
- foco em acao no dashboard.

Evitar aparencia generica e improvisada.

---

## Sequencia preferida de implementacao

Seguir preferencialmente esta ordem:

1. fundacao do projeto;
2. auth e perfis;
3. catalogo e anuncios;
4. moderacao admin;
5. perguntas e respostas;
6. blog;
7. tabela de precos;
8. integracoes e automacoes;
9. hardening de seguranca, SEO e UX final.

---

## Regras para implementacao

Ao implementar:

- nao apagar estrutura existente sem motivo claro;
- nao introduzir dependencia desnecessaria;
- nao criar abstracao excessiva cedo demais;
- nao deixar TODO generico sem contexto;
- nao usar mocks permanentes em fluxo real.

Se criar placeholder, ele deve ser curto, explicito e facil de substituir.

---

## Publicacao obrigatoria

Ao concluir uma tarefa:

- sempre fazer `commit` e `push` no GitHub;
- sempre aplicar deploy no Supabase quando houver mudanca relevante em migrations, Edge Functions, policies, storage ou qualquer backend sensivel associado a entrega;
- nao deixar alteracoes prontas apenas no workspace local quando a entrega depender de publicacao para funcionar.

---

## Regras para resposta dentro do repositorio

Quando receber uma tarefa, responder de forma objetiva e tecnica.

Sempre que util, informar:
- o que foi entendido;
- o que sera alterado;
- quais arquivos serao criados/editados;
- quais premissas foram assumidas;
- quais riscos ou lacunas existem.

---

## Fonte de verdade do MVP

Se houver conflito entre implementacao ad hoc e o blueprint:

- priorizar `zapsucatas_blueprint_execucao_mvp`;
- se o blueprint estiver insuficiente, registrar a premissa adotada no codigo ou na resposta;
- nao expandir escopo sem avisar.

---

## Revisao textual obrigatoria

Antes de concluir qualquer entrega que altere interface visivel, sempre revisar os textos das areas afetadas para corrigir acentuacao, ortografia e microcopy.

Essa revisao deve acontecer obrigatoriamente no dashboard do usuario e no painel admin antes de considerar a tarefa pronta.
