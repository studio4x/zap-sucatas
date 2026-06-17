import type { AdminTutorial } from '@/domains/admin-tutorials/types'

export const ADMIN_TUTORIALS_STORAGE_KEY = 'genflix-admin-tutorials'

function makeTutorial(tutorial: AdminTutorial) {
  return tutorial
}

export const ADMIN_TUTORIALS_DEFAULTS: AdminTutorial[] = [
  makeTutorial({
    id: 'primeiros-passos-visao-geral',
    title: 'Entender o painel admin',
    summary: 'Visão rápida para reconhecer as áreas principais do painel e começar pelo lugar certo.',
    estimatedMinutes: 3,
    category: 'Primeiros passos',
    steps: [
      {
        title: 'Leia a visão geral antes de agir',
        description:
          '<p>Comece pela tela inicial do admin para entender o que precisa de atenção agora.</p><p>Os cards e atalhos mostram a fila operacional do momento.</p>',
      },
      {
        title: 'Use o menu para entrar no módulo certo',
        description:
          '<p>Cada item do menu leva para uma área de trabalho específica, como anúncios, perguntas, usuários ou configurações.</p><p>Evite procurar pelo sistema inteiro de uma vez.</p>',
      },
      {
        title: 'Confirme o que ficou salvo',
        description:
          '<p>Depois de qualquer ajuste, confira se a informação voltou para a lista, para o preview ou para a tela correspondente.</p>',
      },
    ],
    notes: [
      'Se tiver dúvida, volte para a visão geral antes de continuar.',
      'O painel foi pensado para operação direta, não para navegação técnica.',
      'Cada área tem seu próprio fluxo e suas próprias confirmações.',
    ],
  }),
  makeTutorial({
    id: 'primeiros-passos-widget-ajuda',
    title: 'Abrir e fechar o widget de ajuda',
    summary: 'Como usar o painel flutuante com o tutorial ativo sem sair da tela atual.',
    estimatedMinutes: 2,
    category: 'Primeiros passos',
    steps: [
      {
        title: 'Abra o widget pela pílula flutuante',
        description:
          '<p>No canto inferior direito, clique em <strong>Ajuda rápida</strong> para abrir o tutorial ativo.</p>',
      },
      {
        title: 'Troque de tutorial sem perder contexto',
        description:
          '<p>Use o seletor interno do widget para mudar o conteúdo exibido sem fechar o painel.</p>',
      },
      {
        title: 'Minimize quando não estiver lendo',
        description:
          '<p>Se o widget estiver ocupando espaço, reduza para a pílula e volte depois com um clique.</p>',
      },
    ],
    notes: [
      'O widget sempre mostra o tutorial ativo.',
      'A minimização serve para não atrapalhar o trabalho do admin.',
      'Fechar o widget não apaga o conteúdo salvo.',
    ],
  }),
  makeTutorial({
    id: 'primeiros-passos-acesso-seguranca',
    title: 'Acesso e segurança no admin',
    summary: 'O que observar para trabalhar no painel com segurança e sem expor áreas que não são do admin.',
    estimatedMinutes: 4,
    category: 'Primeiros passos',
    steps: [
      {
        title: 'Entre sempre com a conta correta',
        description:
          '<p>O acesso aos tutoriais e ao painel administrativo depende de login e permissão de admin.</p>',
      },
      {
        title: 'Não compartilhe telas com dados sensíveis',
        description:
          '<p>Evite expor e-mails, telefones e informações operacionais quando estiver revisando usuários, mensagens ou logs.</p>',
      },
      {
        title: 'Confirme antes de executar ações críticas',
        description:
          '<p>Aprovar, rejeitar, excluir ou alterar dados importantes pede leitura cuidadosa antes do clique final.</p>',
      },
    ],
    notes: [
      'Este painel é de operação interna e não deve ser usado por visitantes.',
      'Se algo parecer estranho, pare e leia o tutorial correspondente antes de agir.',
      'A verificação visual ajuda a evitar cliques errados.',
    ],
  }),
  makeTutorial({
    id: 'anuncios-criar-novo',
    title: 'Criar um anúncio novo',
    summary: 'Passo a passo para iniciar um anúncio e deixar a publicação pronta para revisão.',
    estimatedMinutes: 5,
    category: 'Anúncios',
    steps: [
      {
        title: 'Abra o formulário de criação',
        description:
          '<p>Entre em anúncios e escolha a opção de criar novo registro.</p><p>Use títulos simples e diretos para facilitar a leitura interna.</p>',
      },
      {
        title: 'Preencha título, resumo e localização',
        description:
          '<p>Esses campos ajudam o admin e o público a entenderem o que está sendo ofertado.</p>',
      },
      {
        title: 'Revise antes de salvar',
        description:
          '<p>Confira se as imagens, a descrição e os dados comerciais fazem sentido antes de concluir.</p>',
      },
    ],
    notes: [
      'Um anúncio bem preenchido reduz retrabalho na moderação.',
      'Resumo curto e objetivo funciona melhor do que texto longo demais.',
      'Se houver dúvida, salve como rascunho primeiro.',
    ],
  }),
  makeTutorial({
    id: 'anuncios-editar-existente',
    title: 'Editar um anúncio existente',
    summary: 'Como corrigir informações de um anúncio sem quebrar o fluxo de moderação.',
    estimatedMinutes: 4,
    category: 'Anúncios',
    steps: [
      {
        title: 'Localize o anúncio na lista',
        description:
          '<p>Use a busca e os filtros para encontrar o item certo antes de alterar qualquer dado.</p>',
      },
      {
        title: 'Abra a edição e revise com calma',
        description:
          '<p>Compare o que está salvo com o que precisa ser corrigido. Ajuste apenas o necessário.</p>',
      },
      {
        title: 'Salve e confira o retorno',
        description:
          '<p>Depois de salvar, verifique se o conteúdo voltou para a lista e se a atualização apareceu no preview.</p>',
      },
    ],
    notes: [
      'Editar sem checar o item pode gerar alteração no anúncio errado.',
      'Alterações pequenas devem ser feitas com a mesma atenção de uma criação nova.',
      'A confirmação visual evita erros de cadastro.',
    ],
  }),
  makeTutorial({
    id: 'anuncios-revisar-pendente',
    title: 'Revisar um anúncio pendente',
    summary: 'Como ler o que está aguardando análise e decidir com mais segurança.',
    estimatedMinutes: 4,
    category: 'Anúncios',
    steps: [
      {
        title: 'Abra a fila de pendências',
        description:
          '<p>Os anúncios pendentes pedem leitura criteriosa antes de qualquer decisão.</p>',
      },
      {
        title: 'Leia título, resumo e imagens',
        description:
          '<p>Veja se o conteúdo é coerente com o produto anunciado e se não há inconsistência visível.</p>',
      },
      {
        title: 'Escolha a ação correta',
        description:
          '<p>Se estiver correto, aprovar. Se estiver incompleto ou confuso, devolver para ajuste ou rejeitar conforme o caso.</p>',
      },
    ],
    notes: [
      'O objetivo é manter qualidade e clareza no catálogo.',
      'Se faltar contexto, devolver para ajuste costuma ser a melhor saída.',
      'Evite aprovar anúncios com sinal de informação incompleta.',
    ],
  }),
  makeTutorial({
    id: 'anuncios-aprovar',
    title: 'Aprovar um anúncio',
    summary: 'Fluxo curto para liberar um anúncio com segurança para a área pública.',
    estimatedMinutes: 3,
    category: 'Anúncios',
    steps: [
      {
        title: 'Confirme se o conteúdo está coerente',
        description:
          '<p>Confira se o anúncio apresenta o produto, a categoria e a condição de forma compreensível.</p>',
      },
      {
        title: 'Valide os dados comerciais permitidos',
        description:
          '<p>Reveja contato, localização e demais campos autorizados antes de liberar o item.</p>',
      },
      {
        title: 'Finalize a aprovação',
        description:
          '<p>Depois da liberação, confira se o anúncio passou a aparecer na área pública como esperado.</p>',
      },
    ],
    notes: [
      'A aprovação deve ser simples, mas nunca apressada.',
      'Se houver dúvida em qualquer parte do anúncio, pause e revise.',
      'A qualidade da aprovação define a qualidade do catálogo.',
    ],
  }),
  makeTutorial({
    id: 'anuncios-rejeitar',
    title: 'Rejeitar um anúncio',
    summary: 'Quando o conteúdo não atende o padrão, como devolver ou reprovar com clareza.',
    estimatedMinutes: 3,
    category: 'Anúncios',
    steps: [
      {
        title: 'Identifique o problema principal',
        description:
          '<p>Marque o que impede a publicação, como falta de informação, inconsistência ou conteúdo inadequado.</p>',
      },
      {
        title: 'Registre a decisão com objetividade',
        description:
          '<p>Explique em linguagem simples o que precisa ser corrigido para que o anunciante entenda o próximo passo.</p>',
      },
      {
        title: 'Confira se o item saiu da fila de liberação',
        description:
          '<p>Depois da ação, confirme o novo estado do anúncio para evitar retrabalho.</p>',
      },
    ],
    notes: [
      'Rejeitar com clareza ajuda o anunciante a corrigir mais rápido.',
      'Evite mensagens vagas como "ajustar dados" sem explicar o que falta.',
      'Uma boa justificativa economiza tempo do suporte e do anunciante.',
    ],
  }),
  makeTutorial({
    id: 'anuncios-excluir-arquivar',
    title: 'Excluir ou arquivar um anúncio',
    summary: 'Como remover um anúncio da operação sem perder o histórico interno.',
    estimatedMinutes: 3,
    category: 'Anúncios',
    steps: [
      {
        title: 'Confirme se a remoção é mesmo necessária',
        description:
          '<p>Antes de excluir, verifique se o anúncio só precisa ser ajustado ou arquivado.</p>',
      },
      {
        title: 'Leia a confirmação com atenção',
        description:
          '<p>O sistema pede confirmação para evitar exclusões acidentais.</p>',
      },
      {
        title: 'Valide o resultado na lista',
        description:
          '<p>Depois da ação, confira se o item saiu da operação ou foi para o estado correto.</p>',
      },
    ],
    notes: [
      'Excluir não é o mesmo que corrigir.',
      'Se houver dúvida, prefira arquivar ou ajustar antes de remover.',
      'A confirmação existe para proteger a operação.',
    ],
  }),
  makeTutorial({
    id: 'relacionamento-responder-perguntas',
    title: 'Responder perguntas dos anúncios',
    summary: 'Como responder dúvidas sem travar a fila e sem perder contexto comercial.',
    estimatedMinutes: 4,
    category: 'Relacionamento',
    steps: [
      {
        title: 'Abra a pergunta certa',
        description:
          '<p>Localize a pergunta pela lista e leia o histórico antes de escrever.</p>',
      },
      {
        title: 'Escreva uma resposta curta e clara',
        description:
          '<p>Use linguagem simples, direta e útil para quem está negociando.</p>',
      },
      {
        title: 'Confirme se a conversa avançou',
        description:
          '<p>Depois de responder, veja se a thread ficou organizada e pronta para novo retorno.</p>',
      },
    ],
    notes: [
      'Respostas objetivas reduzem retrabalho.',
      'Quando faltar informação, vale dizer isso com clareza em vez de improvisar.',
      'A pergunta serve para aproximar a conversa, não para gerar confusão.',
    ],
  }),
  makeTutorial({
    id: 'relacionamento-moderar-perguntas',
    title: 'Moderar perguntas inadequadas',
    summary: 'Como agir quando a pergunta precisa ser ocultada, bloqueada ou revisada.',
    estimatedMinutes: 3,
    category: 'Relacionamento',
    steps: [
      {
        title: 'Leia o conteúdo completo',
        description:
          '<p>Não bloqueie por impulso. Veja se o problema é linguagem, spam ou assunto fora da regra.</p>',
      },
      {
        title: 'Escolha a moderação correta',
        description:
          '<p>Pode ser ocultar, bloquear ou apenas deixar para acompanhamento interno.</p>',
      },
      {
        title: 'Registre a decisão',
        description:
          '<p>Se a plataforma tiver histórico, use-o para deixar claro por que a pergunta foi moderada.</p>',
      },
    ],
    notes: [
      'A moderação protege a qualidade da interação.',
      'Leia antes de agir para não esconder conteúdo válido.',
      'Quando a dúvida persistir, encaminhe para revisão.',
    ],
  }),
  makeTutorial({
    id: 'relacionamento-suporte-tickets',
    title: 'Ler e tratar chamados de suporte',
    summary: 'Guia para ver a fila de suporte e entender o que precisa de resposta primeiro.',
    estimatedMinutes: 4,
    category: 'Relacionamento',
    steps: [
      {
        title: 'Abra a central de atendimento',
        description:
          '<p>Veja os chamados por ordem de urgência e identifique o que está parado.</p>',
      },
      {
        title: 'Leia o assunto e o histórico',
        description:
          '<p>Confira o contexto antes de responder ou encaminhar o chamado.</p>',
      },
      {
        title: 'Responda ou encaminhe',
        description:
          '<p>Depois de entender o problema, decida se a resposta pode ser dada agora ou se precisa de outra área.</p>',
      },
    ],
    notes: [
      'A fila do suporte deve ser tratada com prioridade diária.',
      'Uma resposta rápida costuma resolver mais do que uma resposta longa.',
      'Evite deixar chamados sem leitura por muito tempo.',
    ],
  }),
  makeTutorial({
    id: 'usuarios-localizar-perfil',
    title: 'Localizar um usuário rapidamente',
    summary: 'Como encontrar um perfil e abrir os dados certos sem navegar em excesso.',
    estimatedMinutes: 3,
    category: 'Usuários',
    steps: [
      {
        title: 'Use a busca para reduzir a lista',
        description:
          '<p>Pesquise por nome, e-mail ou trecho do cadastro para chegar ao perfil certo.</p>',
      },
      {
        title: 'Abra o perfil antes de alterar qualquer coisa',
        description:
          '<p>Veja o histórico e o status do usuário para entender a situação atual.</p>',
      },
      {
        title: 'Confirme o registro correto',
        description:
          '<p>Verifique se a conta aberta é mesmo a que você queria tratar antes de continuar.</p>',
      },
    ],
    notes: [
      'Trocar de usuário por engano pode gerar ajuste indevido.',
      'Nome e e-mail ajudam a localizar o perfil com segurança.',
      'A busca é a forma mais rápida de chegar ao cadastro certo.',
    ],
  }),
  makeTutorial({
    id: 'usuarios-ajustar-acesso',
    title: 'Ajustar acesso e recuperar senha',
    summary: 'Como lidar com usuário com acesso incorreto ou com necessidade de recuperação.',
    estimatedMinutes: 4,
    category: 'Usuários',
    steps: [
      {
        title: 'Confirme o motivo da intervenção',
        description:
          '<p>Veja se o problema é acesso, status da conta ou necessidade de redefinição.</p>',
      },
      {
        title: 'Aplique apenas o ajuste necessário',
        description:
          '<p>Evite mudar mais campos do que o necessário para não afetar outras configurações.</p>',
      },
      {
        title: 'Avise o usuário ou registre a ação',
        description:
          '<p>Depois da correção, deixe a operação rastreável para não perder o histórico.</p>',
      },
    ],
    notes: [
      'A recuperação de acesso pede confirmação de identidade operacional.',
      'Mantenha a alteração o mais objetiva possível.',
      'Registros ajudam em futuras dúvidas sobre a conta.',
    ],
  }),
  makeTutorial({
    id: 'conteudo-criar-post-blog',
    title: 'Criar um post do blog',
    summary: 'Como produzir conteúdo editorial simples para o blog da plataforma.',
    estimatedMinutes: 5,
    category: 'Conteúdo e páginas',
    steps: [
      {
        title: 'Abra o editor de post',
        description:
          '<p>Escolha um título fácil de entender e um resumo que explique a ideia principal.</p>',
      },
      {
        title: 'Escreva com foco comercial e educativo',
        description:
          '<p>O texto deve ajudar o leitor a entender o mercado, o produto ou o funcionamento da plataforma.</p>',
      },
      {
        title: 'Revise antes de publicar',
        description:
          '<p>Cheque ortografia, imagens e trecho de destaque antes de liberar o conteúdo.</p>',
      },
    ],
    notes: [
      'Post bom é post claro e direto.',
      'Resumo forte ajuda na leitura pública e no SEO.',
      'Nunca publique sem revisar o resultado final.',
    ],
  }),
  makeTutorial({
    id: 'conteudo-publicar-arquivar-blog',
    title: 'Publicar ou arquivar um post',
    summary: 'Quando o conteúdo já está pronto, como colocá-lo no ar ou tirá-lo de circulação.',
    estimatedMinutes: 3,
    category: 'Conteúdo e páginas',
    steps: [
      {
        title: 'Verifique o estado do conteúdo',
        description:
          '<p>Antes de publicar, confira se o texto já está completo e coerente.</p>',
      },
      {
        title: 'Escolha o status correto',
        description:
          '<p>Use publicado quando o material estiver pronto. Arquive quando ele não fizer mais sentido na vitrine.</p>',
      },
      {
        title: 'Confira a página pública',
        description:
          '<p>Abra a visualização pública para confirmar que o texto exibido bate com o que foi salvo.</p>',
      },
    ],
    notes: [
      'Arquivar é melhor do que apagar quando o histórico importa.',
      'Publicação sem revisão costuma gerar retrabalho.',
      'O status certo evita conteúdo fora do ar no momento errado.',
    ],
  }),
  makeTutorial({
    id: 'conteudo-atualizar-paginas',
    title: 'Atualizar páginas institucionais',
    summary: 'Como editar páginas do site sem quebrar a navegação do usuário.',
    estimatedMinutes: 4,
    category: 'Conteúdo e páginas',
    steps: [
      {
        title: 'Abra a página que precisa de ajuste',
        description:
          '<p>Identifique se o conteúdo é institucional, de contato ou de explicação operacional.</p>',
      },
      {
        title: 'Edite o texto com clareza',
        description:
          '<p>Mantenha a linguagem simples para que o visitante entenda a plataforma rapidamente.</p>',
      },
      {
        title: 'Salve e valide a exibição',
        description:
          '<p>Depois do salvamento, confira se a página pública refletiu a alteração corretamente.</p>',
      },
    ],
    notes: [
      'Páginas institucionais precisam ser fáceis de ler.',
      'Atualização visual e textual deve caminhar junto.',
      'Evite termos técnicos quando o texto é para o público final.',
    ],
  }),
  makeTutorial({
    id: 'cadastros-criar-categoria',
    title: 'Criar uma categoria nova',
    summary: 'Como organizar a base do catálogo com uma categoria simples e útil.',
    estimatedMinutes: 4,
    category: 'Catálogo e cadastros',
    steps: [
      {
        title: 'Defina o nome da categoria',
        description:
          '<p>Escolha um nome que o usuário entenda sem esforço.</p>',
      },
      {
        title: 'Revise a descrição e o uso',
        description:
          '<p>A categoria precisa ajudar na organização do catálogo e nos filtros públicos.</p>',
      },
      {
        title: 'Salve e valide a ordem',
        description:
          '<p>Depois de salvar, confira se a categoria apareceu na lista correta.</p>',
      },
    ],
    notes: [
      'Categoria boa é a que resolve a navegação, não a que complica.',
      'Nome claro é melhor do que nome bonito.',
      'Se a dúvida for grande, simplifique o agrupamento.',
    ],
  }),
  makeTutorial({
    id: 'cadastros-criar-material',
    title: 'Criar um material',
    summary: 'Como cadastrar materiais para organizar anúncios e filtros da plataforma.',
    estimatedMinutes: 3,
    category: 'Catálogo e cadastros',
    steps: [
      {
        title: 'Escolha um nome objetivo',
        description:
          '<p>O material precisa ser reconhecido facilmente por quem usa a plataforma.</p>',
      },
      {
        title: 'Evite duplicar termos parecidos',
        description:
          '<p>Verifique se já existe um material semelhante antes de criar outro.</p>',
      },
      {
        title: 'Confirme se ele aparece no catálogo',
        description:
          '<p>Depois do salvamento, veja se o novo material pode ser usado nas áreas corretas do sistema.</p>',
      },
    ],
    notes: [
      'Duplicidade gera confusão na operação.',
      'Nome simples reduz erro de cadastro.',
      'O material serve para facilitar a leitura do catálogo.',
    ],
  }),
  makeTutorial({
    id: 'cadastros-localidades',
    title: 'Manter localidades e filtros',
    summary: 'Como revisar estados e cidades usados nos anúncios e na busca pública.',
    estimatedMinutes: 4,
    category: 'Catálogo e cadastros',
    steps: [
      {
        title: 'Revise o que está aparecendo na busca',
        description:
          '<p>Confira se as localidades disponíveis continuam coerentes com a operação atual.</p>',
      },
      {
        title: 'Corrija nomes e grafias quando necessário',
        description:
          '<p>Uma grafia errada atrapalha tanto a listagem pública quanto o filtro do admin.</p>',
      },
      {
        title: 'Valide se o filtro ficou útil',
        description:
          '<p>Depois de qualquer ajuste, veja se o usuário vai encontrar a localidade com facilidade.</p>',
      },
    ],
    notes: [
      'Localidade boa é localidade fácil de achar.',
      'Padronização evita bagunça no catálogo.',
      'Se a lista crescer demais, mantenha a organização em dia.',
    ],
  }),
  makeTutorial({
    id: 'precos-atualizar-tabela',
    title: 'Atualizar a tabela de preços',
    summary: 'Como mexer nos preços visíveis ao público sem gerar dúvida na leitura.',
    estimatedMinutes: 5,
    category: 'Preços',
    steps: [
      {
        title: 'Abra a entrada correta',
        description:
          '<p>Selecione o material certo antes de alterar qualquer valor.</p>',
      },
      {
        title: 'Atualize preço, unidade e data',
        description:
          '<p>Esses três pontos precisam andar juntos para que a leitura fique confiável.</p>',
      },
      {
        title: 'Confira o reflexo na página pública',
        description:
          '<p>Depois do salvamento, veja se a tabela publicada está mostrando o valor novo.</p>',
      },
    ],
    notes: [
      'Atualização de preço precisa de revisão dupla.',
      'Valor errado atrapalha a negociação do visitante.',
      'Data visível ajuda a dar confiança ao conteúdo.',
    ],
  }),
  makeTutorial({
    id: 'precos-validar-snapshots',
    title: 'Conferir histórico e snapshots de preço',
    summary: 'Como entender o histórico para saber se o valor publicado faz sentido.',
    estimatedMinutes: 4,
    category: 'Preços',
    steps: [
      {
        title: 'Abra o histórico disponível',
        description:
          '<p>Olhe o que foi registrado antes de mudar qualquer referência.</p>',
      },
      {
        title: 'Compare a nova leitura com a anterior',
        description:
          '<p>Veja se o valor atual realmente precisa de atualização.</p>',
      },
      {
        title: 'Use o snapshot como prova de revisão',
        description:
          '<p>Quando houver dúvida, o histórico ajuda a justificar a decisão tomada.</p>',
      },
    ],
    notes: [
      'Histórico reduz erro de publicação.',
      'Snapshot serve como referência de confiança.',
      'Se a mudança estiver estranha, revise a origem do dado.',
    ],
  }),
  makeTutorial({
    id: 'configuracoes-contatos-textos',
    title: 'Ajustar contatos e textos da plataforma',
    summary: 'Como alterar informações institucionais sem mexer no restante da operação.',
    estimatedMinutes: 4,
    category: 'Configurações',
    steps: [
      {
        title: 'Abra a área de configurações',
        description:
          '<p>Localize os dados institucionais que precisam de ajuste.</p>',
      },
      {
        title: 'Edite apenas o necessário',
        description:
          '<p>Atualize e-mail, telefone e textos sem alterar parâmetros que você não pretende tocar.</p>',
      },
      {
        title: 'Salve e valide o reflexo público',
        description:
          '<p>Confira se o site mostra a informação nova depois da atualização.</p>',
      },
    ],
    notes: [
      'Mudança institucional deve ser precisa e revisada.',
      'Telefone ou e-mail errado atrapalha o contato com a loja.',
      'Menos alteração significa menos risco operacional.',
    ],
  }),
  makeTutorial({
    id: 'configuracoes-branding',
    title: 'Atualizar logos e identidade visual',
    summary: 'Como trocar arquivos de marca sem perder a consistência do site.',
    estimatedMinutes: 4,
    category: 'Configurações',
    steps: [
      {
        title: 'Escolha o arquivo certo',
        description:
          '<p>Envie a versão correta da marca para a área que você quer atualizar.</p>',
      },
      {
        title: 'Confira fundo, contraste e proporção',
        description:
          '<p>Uma imagem boa precisa funcionar em telas claras e escuras se houver variação visual.</p>',
      },
      {
        title: 'Verifique o resultado no rodapé e no topo',
        description:
          '<p>Depois do upload, veja se o novo logo aparece como esperado.</p>',
      },
    ],
    notes: [
      'Imagem errada faz a marca parecer desalinhada.',
      'Arquivos limpos deixam o site mais profissional.',
      'Valide a leitura visual antes de considerar pronto.',
    ],
  }),
  makeTutorial({
    id: 'operacao-logs-auditoria',
    title: 'Ler logs e auditoria',
    summary: 'Como procurar um evento e entender o que aconteceu quando algo sai do esperado.',
    estimatedMinutes: 5,
    category: 'Operação e diagnóstico',
    steps: [
      {
        title: 'Abra a tela de logs',
        description:
          '<p>Use os filtros para localizar a área ou a ação que você quer investigar.</p>',
      },
      {
        title: 'Leia origem, data e severidade',
        description:
          '<p>Esses três dados ajudam a entender o tamanho do problema e onde ele começou.</p>',
      },
      {
        title: 'Use o histórico para orientar a próxima ação',
        description:
          '<p>O objetivo do log é mostrar o caminho para resolver, não apenas registrar o erro.</p>',
      },
    ],
    notes: [
      'Logs são úteis quando lidos com contexto.',
      'Se o evento é recorrente, pode ser sinal de falha maior.',
      'A auditoria ajuda a preservar rastreabilidade.',
    ],
  }),
  makeTutorial({
    id: 'operacao-notificacoes',
    title: 'Acompanhar notificações e alertas',
    summary: 'Como ler o sino, revisar o histórico e não deixar mensagens importantes para depois.',
    estimatedMinutes: 4,
    category: 'Operação e diagnóstico',
    steps: [
      {
        title: 'Abra o sino de notificações',
        description:
          '<p>Veja o que chegou por último e quais itens ainda estão pendentes.</p>',
      },
      {
        title: 'Priorize o que exige ação',
        description:
          '<p>Nem toda notificação precisa de resposta imediata, mas algumas pedem atenção rápida.</p>',
      },
      {
        title: 'Limpe ou marque o que já foi tratado',
        description:
          '<p>Isso mantém o painel mais claro para a próxima pessoa que entrar.</p>',
      },
    ],
    notes: [
      'Notificação parada vira ruído de operação.',
      'Histórico limpo ajuda a encontrar o que importa.',
      'O aviso certo no momento certo evita atraso no atendimento.',
    ],
  }),
]
