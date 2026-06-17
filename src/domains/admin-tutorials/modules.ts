export type AdminTutorialModule = {
  description: string
  key: string
  title: string
}

export const ADMIN_TUTORIAL_MODULES: AdminTutorialModule[] = [
  {
    key: 'primeiros-passos',
    title: 'Primeiros passos',
    description: 'Uso básico do painel, acesso ao widget e leitura inicial da interface.',
  },
  {
    key: 'anuncios',
    title: 'Anúncios',
    description: 'Criação, edição, revisão, aprovação, rejeição e organização dos anúncios.',
  },
  {
    key: 'relacionamento',
    title: 'Relacionamento',
    description: 'Perguntas, respostas, suporte e rotina de contato com o público.',
  },
  {
    key: 'usuarios',
    title: 'Usuários',
    description: 'Leitura de perfis, acesso, status e ações sobre contas cadastradas.',
  },
  {
    key: 'conteudo',
    title: 'Conteúdo e páginas',
    description: 'Blog, páginas institucionais e materiais que alimentam o site.',
  },
  {
    key: 'cadastros',
    title: 'Catálogo e cadastros',
    description: 'Categorias, materiais e localidades que organizam a operação.',
  },
  {
    key: 'precos',
    title: 'Preços',
    description: 'Tabela de preços, snapshots e atualização de referência comercial.',
  },
  {
    key: 'configuracoes',
    title: 'Configurações',
    description: 'Contatos, textos, identidade visual e parâmetros globais.',
  },
  {
    key: 'operacao',
    title: 'Operação e diagnóstico',
    description: 'Logs, notificações e leitura do que precisa de atenção no dia a dia.',
  },
]
