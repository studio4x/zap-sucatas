# AGENTS.md — Zap Sucatas

## Função deste arquivo

Este arquivo orienta o Codex dentro do repositório.

Ele NÃO deve repetir o blueprint do projeto.  
A fonte de verdade do MVP está em:

- `docs/architecture/zapsucatas-blueprint-mvp.md`
- `docs/architecture/admin-spec.md`
- `docs/mvp-execution-plan.md`

Antes de implementar qualquer tarefa relevante, consulte esses documentos.

---

## Projeto

Zap Sucatas é uma plataforma web de classificados e marketplace de sucatas e maquinários.

O MVP possui três áreas principais:

- área pública;
- dashboard do anunciante;
- painel administrativo.

O fluxo central é:

1. usuário cria anúncio;
2. anúncio fica em rascunho ou vai para revisão;
3. admin aprova ou rejeita;
4. apenas anúncios aprovados ficam públicos.

---

## Stack obrigatória

Usar, salvo instrução contrária:

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

## Estrutura esperada

Manter a organização por domínio:

- `src/app`
- `src/components`
- `src/domains`
- `src/pages`
- `src/hooks`
- `src/lib`
- `src/integrations/supabase`
- `supabase/functions`
- `supabase/migrations`

Sempre que possível, colocar regras, tipos, hooks, queries, mutations e componentes específicos dentro de `src/domains`.

---

## Modo de trabalho

Antes de implementar:

1. entenda a tarefa;
2. consulte os documentos base quando necessário;
3. identifique arquivos afetados;
4. implemente apenas o escopo solicitado;
5. evite alterações amplas sem necessidade.

Para tarefas grandes, primeiro apresente:

- resumo do que será feito;
- arquivos que serão criados/editados;
- dependências técnicas;
- riscos ou lacunas.

---

## Regras de escopo

Não criar funcionalidades fora do MVP sem avisar.

Se houver conflito:

1. priorizar o blueprint;
2. depois o execution plan;
3. depois a instrução direta do usuário.

Se o blueprint estiver incompleto:

- adote a solução mais segura;
- registre a premissa;
- não expanda o escopo silenciosamente.

---

## Segurança

Nunca colocar regra crítica apenas no frontend.

Sempre considerar:

- autenticação em áreas privadas;
- autorização por `role` e `is_admin`;
- RLS em tabelas sensíveis;
- Edge Functions para ações administrativas ou com segredo;
- service role apenas no backend;
- segredos nunca no cliente;
- auditoria para ações críticas.

---

## Banco de dados

Toda alteração estrutural deve ser feita via migration SQL em `supabase/migrations`.

Sempre avaliar:

- foreign keys;
- índices;
- constraints;
- `created_at`;
- `updated_at`;
- trigger de `updated_at`;
- RLS;
- policies;
- logs de auditoria.

Não depender de configuração manual no painel do Supabase como fonte oficial.

---

## Edge Functions

Usar Edge Functions para:

- aprovação de anúncio;
- rejeição de anúncio;
- envio para revisão;
- resposta de pergunta quando houver regra sensível;
- sincronizações;
- notificações;
- ações administrativas;
- operações com segredo ou service role.

Cada função deve ter:

- responsabilidade única;
- validação explícita;
- checagem de permissão;
- retorno JSON claro;
- logs úteis.

---

## UI/UX

A interface deve ser:

- limpa;
- responsiva;
- profissional;
- consistente entre público, dashboard e admin.

Sempre prever estados de:

- loading;
- erro;
- vazio;
- sucesso.

Antes de concluir qualquer tarefa visual, revisar textos, acentuação, ortografia e microcopy.

---

## Ordem preferencial de implementação

Seguir o `mvp-execution-plan.md`.

Resumo:

1. fundação;
2. banco e segurança;
3. auth e perfis;
4. catálogo público;
5. dashboard do anunciante;
6. admin e moderação;
7. acabamento operacional.

---

## Build version

Toda entrega que altere o produto deve atualizar:

- `src/lib/build-version.ts`

A versão deve aparecer discretamente no rodapé da área pública, dashboard e admin.
A exibição no rodapé deve incluir também o hash curto do commit atual, no formato:
`Build <BUILD_VERSION>-<COMMIT_SHA_CURTO>` (ex.: `Build 2026.04.28-004-11859c5f`).

Não concluir alteração de produto sem revisar e incrementar `BUILD_VERSION`.

---

## Publicação

Ao concluir tarefa que precise estar funcional fora do ambiente local:

- fazer commit;
- fazer push;
- aplicar migrations quando houver;
- fazer deploy de Edge Functions quando houver;
- validar impacto no Supabase/Vercel quando necessário.

Não considerar pronto algo que dependa de publicação e ficou apenas local.

### Validação de deploy em produção

Antes de encerrar qualquer entrega que afete o produto:

- confirmar que o deploy em produção está `READY`;
- confirmar que o domínio canônico aponta para o deploy mais recente;
- confirmar que a revisão ativa em produção corresponde ao `HEAD` atual;
- corrigir alias/domínio antes de encerrar se houver divergência entre `HEAD`, deploy e produção.

---

## Resposta esperada do Codex

Responder de forma objetiva.

Sempre que útil, informar:

- o que entendeu;
- o que alterou;
- arquivos criados/editados;
- premissas adotadas;
- pendências ou riscos.

Evitar explicações longas quando a tarefa for simples.

---

## Playbook: Edge Function 401 em ações admin

Se uma Edge Function admin retornar `401`:

1. verificar se o frontend envia sessão atualizada;
2. usar `supabase.auth.getSession()`;
3. se necessário, usar `supabase.auth.refreshSession()`;
4. enviar `Authorization: Bearer <access_token>`;
5. preferir `fetch` com headers explícitos em diagnóstico;
6. incluir fallback no body: `{ access_token }`.

Se o erro persistir no gateway:

1. publicar a função com `--no-verify-jwt`;
2. validar manualmente o token dentro da função;
3. usar `supabaseAdmin.auth.getUser(token)`;
4. checar `profiles.is_admin` ou `profiles.role === "admin"`;
5. retornar erros JSON claros:
   - `401 token ausente ou inválido`;
   - `403 acesso negado`.

Deploy:

```bash
npx supabase functions deploy <function-name> --project-ref <ref> --no-verify-jwt
