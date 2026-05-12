# AJUSTES_A_REALIZAR — organizado por chats

[OK] T1 - A seção de "anúncios em destaque" da home deverá ficar logo abaixo da seção hero da home. A seção de categorias deverá ficar logo abaixo da seção "anuncios em destaque". Depois da seção de categorias, deve vir a seção "como o zap sucatas funciona"

[OK] t2 - Remova a seção de artigos do blog da home

[OK] T3 - Precisamos implementar no crud de anuncios, a possibilidade do cliente pagar para ter o anuncio dele em destaque. Implemente tudo que precisará para que essa funcionalidade seja implementada, inclusive a parte de pagamento.. Para esta, vamos considerar integrar via api com o Asaas.

[OK] T4 - insira sombras nas seções da home para não ficar tudo um branco só.

[OK] T5 - Vamos ajustar a página de anúncios. Devemos ter uma barra lateral do lado esquerdo, com a listagem das categorias, estados e cidades. Uma exemplo de como deve ficar é o site https://www.mfrural.com.br/produtos. No inicio dos anuncios, deverá ter uma seção com os anuncios em destaques. Na hero da página de anuncios, vamos remover as informações de quantidades, e também os textos: Catalogo moderado para negociacao real, com foco em busca, filtragem setorial e leitura comercial rapida.
Moderacao antes da publicacao. Busca por categoria, material e localidade. Paginas de anuncio com contexto comercial. Mantenha o filtro de ordenação.

[OK] T6 - Na pagina /admin/anuncios/, deve ter uma coluna para mostrar quais anúncios devem ser marcados como destaques. a marcação deverá ser automática quando o cliente pagar pelo destaque. Mostre dentro do anuncio também as informações sobre o pagamento do destaque.

[OK] T7 - Na página "/admin/localidades", insira a possibilidade de remover e de adicionar novas localidades e também de clicar para ver todos os anuncios que utilizou cada localidade. A funcionalidade de adicionar nova localidade deverá abrir em um modal quando clicado no botão de adicionar, com o formulário para criar nova localidade.

[OK] t8 - Na página "/admin/categorias", deverá ter um botão de adicionar categoria e ao clicar, deverá abrir um modal com o formulário para criar nova categoria. Remova da página os cards "Categoria operacional" e "Regras desta base". Os cards do filtro e da listagem das categorias deverão ocupar 100% da alrgura da página.

[OK] t9 - Insira na aba de configurações asaas, a url do webhook a ser configurado no asaas.

[OK] t10 - precisamos criar uma página no site público semelhante a esta do site atual: https://zapsucatas.com.br/tabela-de-preco-do-ferro-velho/. Os produtos, preços e quantidade deverão ser preenchidos em um CRUD no painel admin. Vamos chamá-lo de "Preço  das Sucatas". 

[ ] t11 - No painel admin, altere o nome do menu "Preços" (página: https://zap-sucatas.vercel.app/admin/precos) para "Preços LME". Dentro da página, remova o card "Sem referências manuais" e o card "Filtros"
