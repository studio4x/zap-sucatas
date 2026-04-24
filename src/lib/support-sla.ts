import type {
  SupportBusinessHoursConfig,
  SupportConfig,
  SupportSlaCategoryConfig,
  SupportSlaStatus,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
} from '@/domains/support/types'

export const defaultSupportCategories: SupportSlaCategoryConfig[] = [
  {
    key: 'payment',
    label: 'Pagamentos',
    firstResponseHours: 2,
    position: 1,
    description: 'Primeira resposta em ate 2 horas uteis.',
  },
  {
    key: 'technical',
    label: 'Problema tecnico',
    firstResponseHours: 24,
    position: 2,
    description: 'Primeira resposta em ate 24 horas uteis.',
  },
  {
    key: 'account',
    label: 'Conta e acesso',
    firstResponseHours: 24,
    position: 3,
    description: 'Primeira resposta em ate 24 horas uteis.',
  },
  {
    key: 'general',
    label: 'Duvida geral',
    firstResponseHours: 24,
    position: 4,
    description: 'Primeira resposta em ate 24 horas uteis.',
  },
]

export const defaultSupportBusinessHours: SupportBusinessHoursConfig = {
  timezone: 'America/Sao_Paulo',
  daysOfWeek: [1, 2, 3, 4, 5],
  startHour: 8,
  endHour: 18,
}

export const defaultSupportConfig: SupportConfig = {
  categories: defaultSupportCategories,
  businessHours: defaultSupportBusinessHours,
  publicNote:
    'Os prazos acima se referem ao tempo da primeira resposta humana da equipe. Nao representam prazo de resolucao final.',
  crisisNote:
    'Se houver risco, fraude ou situacao critica, abra o chamado e registre o contexto com o maximo de detalhe.',
}

export const supportFaqItems = [
  {
    id: 'faq-1',
    category: 'payment' as SupportTicketCategory,
    question: 'Como envio uma duvida sobre pagamento ou cobranca?',
    answer:
      'Abra um chamado na categoria Pagamentos e informe o anuncio, a etapa da negociacao e qualquer comprovante que ajude a equipe a analisar o caso.',
  },
  {
    id: 'faq-2',
    category: 'technical' as SupportTicketCategory,
    question: 'O que devo incluir em um problema tecnico?',
    answer:
      'Descreva a tela, a acao executada, o horario aproximado, a mensagem exibida e anexe imagem se isso ajudar a reproduzir o erro.',
  },
  {
    id: 'faq-3',
    category: 'account' as SupportTicketCategory,
    question: 'Como resolver bloqueio de conta ou acesso restrito?',
    answer:
      'Use a categoria Conta e acesso para registrar o contexto do bloqueio. Esse canal continua disponivel mesmo quando o restante do dashboard estiver temporariamente restrito.',
  },
  {
    id: 'faq-4',
    category: 'general' as SupportTicketCategory,
    question: 'Posso pedir orientacao para publicar um anuncio melhor?',
    answer:
      'Sim. A equipe pode orientar sobre cadastro, estrutura do anuncio, dados comerciais e melhores praticas de preenchimento.',
  },
]

export const supportStatusOptions: Array<{ label: string; value: SupportTicketStatus }> = [
  { value: 'open', label: 'Aberto' },
  { value: 'in_progress', label: 'Em atendimento' },
  { value: 'closed', label: 'Fechado' },
]

export const supportPriorityOptions: Array<{ label: string; value: SupportTicketPriority }> = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

export function getSupportCategoryMeta(config: SupportConfig, category: SupportTicketCategory) {
  return config.categories.find((entry) => entry.key === category) ?? defaultSupportCategories.find((entry) => entry.key === category)!
}

export function getSupportStatusMeta(status: SupportTicketStatus) {
  switch (status) {
    case 'open':
      return { label: 'Aberto', tone: 'info' as const }
    case 'in_progress':
      return { label: 'Em atendimento', tone: 'warning' as const }
    default:
      return { label: 'Fechado', tone: 'neutral' as const }
  }
}

export function getSupportSlaStatusMeta(status: SupportSlaStatus) {
  switch (status) {
    case 'answered':
      return { label: 'Respondido', tone: 'success' as const }
    case 'at_risk':
      return { label: 'Em risco', tone: 'warning' as const }
    case 'overdue':
      return { label: 'Atrasado', tone: 'danger' as const }
    default:
      return { label: 'No prazo', tone: 'info' as const }
  }
}

export function getSupportPriorityMeta(priority: SupportTicketPriority) {
  switch (priority) {
    case 'urgent':
      return { label: 'Urgente', rowClassName: 'bg-[#fff1ee]', tone: 'danger' as const }
    case 'high':
      return { label: 'Alta', rowClassName: 'bg-[#fff6ec]', tone: 'warning' as const }
    case 'medium':
      return { label: 'Media', rowClassName: 'bg-[#fffaf0]', tone: 'warning' as const }
    default:
      return { label: 'Baixa', rowClassName: 'bg-[#f1f7f2]', tone: 'success' as const }
  }
}

export function formatSupportDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatSupportDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

export function formatBusinessHours(config: SupportBusinessHoursConfig) {
  const dayLabels = config.daysOfWeek.map((day) => {
    switch (day) {
      case 1:
        return 'seg'
      case 2:
        return 'ter'
      case 3:
        return 'qua'
      case 4:
        return 'qui'
      case 5:
        return 'sex'
      case 6:
        return 'sab'
      default:
        return 'dom'
    }
  })

  return `${dayLabels.join(', ')} · ${String(config.startHour).padStart(2, '0')}:00 as ${String(config.endHour).padStart(2, '0')}:00`
}
