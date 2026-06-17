import type { AdminTutorial } from '@/domains/admin-tutorials/types'

export const ADMIN_TUTORIALS_STORAGE_KEY = 'genflix-admin-tutorials'

export const ADMIN_TUTORIALS_DEFAULTS: AdminTutorial[] = [
  {
    id: 'guia-aprovacao-anuncios',
    title: 'Como revisar anúncios com segurança',
    summary: 'Checklist rápido para validar título, material, mídia e dados comerciais antes de aprovar um anúncio.',
    estimatedMinutes: 4,
    category: 'Moderação',
    steps: [
      {
        title: 'Leia o resumo operacional do anúncio',
        description:
          '<p>Confirme se o <strong>título</strong>, o <strong>resumo</strong> e a <strong>categoria</strong> descrevem com clareza o material ou equipamento anunciado.</p><p>Se houver ruído comercial, ajuste ou devolva para correção antes de publicar.</p>',
      },
      {
        title: 'Verifique as imagens e a consistência da oferta',
        description:
          '<p>Garanta que as imagens representam o item anunciado e que não existem arquivos quebrados, duplicados ou incompatíveis com a proposta.</p><ul><li>Cheque capa e ordem visual.</li><li>Observe sinais de conteúdo enganoso.</li></ul>',
      },
      {
        title: 'Confirme status e publicação final',
        description:
          '<p>Antes de aprovar, valide localização, condição e dados de contato permitidos. Quando tudo estiver consistente, finalize a decisão editorial.</p>',
      },
    ],
    notes: [
      'Se faltar contexto comercial, prefira devolver para ajuste antes de aprovar.',
      'Use a timeline administrativa para registrar o motivo da decisão.',
      'Evite publicar anúncios com fotos genéricas ou sem lastro visual.',
    ],
  },
  {
    id: 'guia-resposta-perguntas',
    title: 'Resposta rápida para perguntas pendentes',
    summary: 'Fluxo curto para localizar perguntas críticas, avaliar contexto e responder sem travar a fila do marketplace.',
    estimatedMinutes: 3,
    category: 'Relacionamento',
    steps: [
      {
        title: 'Priorize o que está bloqueando a jornada',
        description:
          '<p>Comece pelas perguntas que impedem avanço comercial imediato, como <strong>disponibilidade</strong>, <strong>material</strong> e <strong>condições de retirada</strong>.</p>',
      },
      {
        title: 'Padronize a resposta',
        description:
          '<p>Responda em tom direto, removendo ambiguidades e evitando promessas não confirmadas.</p><p>Se o anunciante precisar atuar, sinalize com clareza o próximo passo.</p>',
      },
      {
        title: 'Reveja publicação e moderação',
        description:
          '<p>Depois da resposta, confirme se a thread continua pública ou se precisa de intervenção administrativa por conteúdo inadequado.</p>',
      },
    ],
    notes: [
      'Mensagens objetivas reduzem retrabalho com o anunciante.',
      'Perguntas ofensivas ou suspeitas devem ser moderadas antes da resposta.',
      'Use a central administrativa para manter o histórico da conversa.',
    ],
  },
  {
    id: 'guia-operacao-precos',
    title: 'Atualização manual da tabela de preços',
    summary: 'Passo a passo para revisar referência, atualizar preço manual e validar a data exibida no site público.',
    estimatedMinutes: 5,
    category: 'Preços',
    steps: [
      {
        title: 'Confirme a referência da atualização',
        description:
          '<p>Antes de editar qualquer item, valide a fonte operacional e a <strong>data efetiva</strong> do valor que será publicado.</p>',
      },
      {
        title: 'Atualize valores e unidades',
        description:
          '<p>Revise <strong>preço</strong>, <strong>unidade</strong> e <strong>região</strong> com atenção para evitar leituras incorretas na área pública.</p><ul><li>Não misture valores de sucata e referência LME.</li><li>Padronize casas decimais quando necessário.</li></ul>',
      },
      {
        title: 'Valide o reflexo no frontend',
        description:
          '<p>Depois do salvamento, confira se a data de atualização e o conteúdo do card público correspondem ao ajuste recém-publicado.</p>',
      },
    ],
    notes: [
      'Atualizações manuais pedem validação dupla antes da publicação.',
      'Registre divergências de origem para auditoria futura.',
      'Quando houver dúvida, publique somente após confirmação da fonte.',
    ],
  },
  {
    id: 'guia-higiene-admin',
    title: 'Higiene operacional do painel',
    summary: 'Rotina breve para limpar pendências, revisar notificações e manter a operação do admin previsível.',
    estimatedMinutes: 2,
    category: 'Plataforma',
    steps: [
      {
        title: 'Revise os alertas do turno',
        description:
          '<p>Abra notificações, tickets e filas pendentes no começo do turno para identificar gargalos logo no início.</p>',
      },
      {
        title: 'Cheque módulos sensíveis',
        description:
          '<p>Faça uma passada curta por <strong>anúncios</strong>, <strong>perguntas</strong> e <strong>configurações</strong> para confirmar que não existe nada parado fora do SLA interno.</p>',
      },
      {
        title: 'Feche o turno com rastreabilidade',
        description:
          '<p>Antes de sair, confirme se ações críticas ficaram registradas em logs, tickets ou feedbacks operacionais do painel.</p>',
      },
    ],
    notes: [
      'Pendência pequena acumulada vira gargalo rápido no admin.',
      'Fechar o turno com histórico atualizado reduz dependência entre pessoas.',
      'Notificações em retry merecem atenção antes de virarem incidente.',
    ],
  },
]
