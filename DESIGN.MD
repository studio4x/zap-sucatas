# DESIGN.MD

## Objetivo
Este documento detalha a homepage atual da Zap Sucatas e define a direcao para redesenhar **somente a estrutura de layout**.

Premissas:
- manter paleta de cores atual;
- manter tipografia atual;
- manter identidade comercial do MVP;
- alterar hierarquia, composicao e fluxo dos blocos da Home.

## Fontes de verdade
- `docs/architecture/zapsucatas_blueprint_execucao_mvp.md`
- `docs/architecture/ADMIN_SPEC.md` (apenas como referencia de consistencia visual do ecossistema)

A Home deve continuar aderente ao MVP: hero, CTA para anuncios, CTA para anunciar, categorias, beneficios, como funciona, destaques recentes, resumo da tabela de precos, artigos recentes, FAQ e footer institucional.

## Home atual (inventario)
Arquivo principal:
- `src/pages/public/home-page.tsx`

Secoes atuais na ordem:
1. `HeroSearchSection` (headline, busca, quick searches, CTAs, bloco de confianca)
2. Faixa de indicadores (`marketStrip` com 4 metricas)
3. Bloco institucional "Posicionamento" (3 cards de mensagem)
4. `CategoryHighlights` (top 4 categorias)
5. `FeaturedListingsSection` (vitrine de anuncios)
6. Bloco de precos (cards de series + card de atualizacao)
7. Bloco de blog (3 posts)
8. `FaqSection`
9. `CtaBanner`

Shell publico:
- Header fixo (`SiteHeader`)
- Container central max `1440px`
- Footer institucional (`SiteFooter`)

## Padrao visual atual (manter)
Origem: `src/index.css`

### Cores base (public-theme)
- Background: `#f3f4ef`
- Foreground: `#132117`
- Primary: `#166246`
- Primary foreground: `#f8fbf8`
- Secondary: `#e8ede7`
- Muted: `#eff2eb`
- Border/Input: `#d8dfd4`
- Accent: `#d6e5d6`

### Tipografia
- Fonte base: `IBM Plex Sans`
- Fonte display: `Space Grotesk`
- Base semantica: corpo em sans, titulos de destaque com `.font-display`

### Linguagem de superficie
- Cards claros com borda suave
- Raios arredondados altos (look organico/comercial)
- Gradientes suaves em secoes hero e CTA
- Contraste moderado, leitura limpa

## Lacunas estruturais da Home atual
1. Topo com alta carga de informacao (hero + signals + metricas + posicionamento em sequencia).
2. Repeticao de mensagens institucionais antes de aprofundar descoberta de catalogo.
3. "Como funciona" nao aparece como secao dedicada, apesar de previsto no blueprint.
4. Ordem pode priorizar mais cedo o que gera acao (buscar/ver anuncios/anunciar).

## Proposta de nova estrutura (layout alvo)
Manter os mesmos dados e identidade visual, reorganizando em narrativa comercial objetiva:

1. Hero de conversao
- Headline curta + subheadline
- Busca principal
- 2 CTAs: "Explorar anuncios" e "Anunciar agora"
- Microprovas de confianca (chips curtos)

2. Como funciona (novo bloco explicito)
- 3 passos:
  1. Buscar ou publicar
  2. Moderacao e validacao
  3. Negociacao com contexto comercial
- Bloco curto e escaneavel

3. Categorias estrategicas
- Grid de categorias com link direto para landing de categoria
- Prioridade para navegacao por segmento

4. Vitrine de anuncios recentes
- Cards de anuncios com CTA para catalogo completo

5. Inteligencia de mercado
- Resumo de precos (series + ultima atualizacao)
- Bloco visual unico com leitura rapida

6. Conteudo editorial (blog)
- 3 ultimos artigos
- CTA "Ver conteudo"

7. FAQ
- Perguntas principais do portal

8. CTA final
- Conversao para cadastro/publicacao
- Acao secundaria para contato

9. Footer institucional
- Sem mudanca estrutural relevante

## Regras para o redesign no Stitch
1. Nao alterar cores/tokens/typography.
2. Nao remover busca principal da dobra inicial.
3. Nao remover CTA de anunciar no topo e no fim da pagina.
4. Manter Home focada em descoberta comercial (nao virar pagina institucional pura).
5. Garantir responsividade real (mobile-first com leitura por blocos).
6. Manter estados de carregamento/vazio para categorias, anuncios, precos e blog.
7. Preservar aderencia ao mapa de paginas e escopo do MVP.

## Brief pronto para enviar ao Stitch
"Redesenhar a homepage da Zap Sucatas mantendo exatamente a identidade visual atual (cores, tipografia, estilo de componentes) e alterando apenas a arquitetura de layout. A nova Home deve seguir esta ordem: Hero com busca e CTAs, Como funciona em 3 passos, Categorias, Anuncios em destaque, Bloco de precos/mercado, Blog, FAQ, CTA final e footer. Priorizar clareza comercial, escaneabilidade e conversao para explorar anuncios e anunciar."

## Referencias tecnicas
- `src/pages/public/home-page.tsx`
- `src/components/public/hero-search-section.tsx`
- `src/components/public/category-highlights.tsx`
- `src/components/public/featured-listings-section.tsx`
- `src/components/public/faq-section.tsx`
- `src/components/public/cta-banner.tsx`
- `src/components/public/site-header.tsx`
- `src/components/public/site-footer.tsx`
- `src/index.css`
