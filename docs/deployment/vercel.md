# Vercel via GitHub

## Fluxo recomendado

- conectar o repositorio `studio4x/zap-sucatas` ao projeto `zap-sucatas` na Vercel
- definir `main` como branch de produção
- deixar previews habilitados para pull requests
- não usar deploy manual por CLI

## Variaveis de ambiente na Vercel

### Production e Preview

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL`

### Valores recomendados

- Production:
  - `VITE_SUPABASE_URL=https://jrxccuxqucwrlccfhdrg.supabase.co`
  - `VITE_SUPABASE_ANON_KEY=<anon key do projeto>`
  - `VITE_APP_URL=https://zap-sucatas.vercel.app`

- Quando o dominio final estiver ativo:
  - atualizar `VITE_APP_URL` para `https://zapsucatas.com.br`
  - adicionar o dominio final no Supabase Auth redirects

## Supabase Auth redirects

Garantir no painel do Supabase:

- `Site URL`
  - `https://zap-sucatas.vercel.app`

- `Additional Redirect URLs`
  - `https://zap-sucatas.vercel.app`
  - `https://zap-sucatas.vercel.app/login`
  - `https://zap-sucatas.vercel.app/cadastro`
  - `https://zap-sucatas.vercel.app/recuperar-senha`
  - `https://zapsucatas.com.br`
  - `https://zapsucatas.com.br/login`
  - `https://zapsucatas.com.br/cadastro`
  - `https://zapsucatas.com.br/recuperar-senha`

## Segredos que não vao para Vercel

Estes valores ficam apenas no Supabase ou em execucao administrativa local:

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_ACCESS_TOKEN`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_SECURE`
- `LME_API_KEY`

## SMTP

Os e-mails do produto enviados pelas Edge Functions usam SMTP configurado nos secrets do Supabase.

Os e-mails de autenticação do Supabase Auth tambem devem usar SMTP customizado no proprio projeto Supabase.