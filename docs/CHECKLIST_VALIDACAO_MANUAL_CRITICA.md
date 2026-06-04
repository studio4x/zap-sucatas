# CHECKLIST DE VALIDACAO MANUAL CRITICA - ZAP SUCATAS

Data de referência: 2026-06-04
Objetivo: concentrar verificações manuais que cobrem o fluxo real do cliente e a rotina diária do admin no MVP.

## 1) Legenda

- [ ] Pendente de validação manual
- [OK] Validado manualmente com sucesso
- [NOK] Falhou na validação manual

## 2) Fluxo do cliente

1. [ ] `MAN-01` Criar conta com e-mail e senha, concluir login e cair na área correta do papel do usuário.
2. [ ] `MAN-02` Entrar com uma conta existente, sair da sessão e conseguir autenticar novamente sem erro.
3. [ ] `MAN-03` Recuperar senha do início ao fim, receber o fluxo de redefinição e voltar a acessar a conta.
4. [ ] `MAN-04` Criar um anúncio novo, salvar como rascunho e confirmar que o registro persiste após recarregar.
5. [ ] `MAN-05` Editar um anúncio existente, alterar campos principais e ver os dados persistidos depois do salvamento.
6. [ ] `MAN-06` Enviar o anúncio para revisão e verificar a mudança visual de status no dashboard do anunciante.
7. [ ] `MAN-07` Subir imagens do anúncio, reorganizar a ordem e confirmar que a exibição respeita a ordenação salva.
8. [ ] `MAN-08` Abrir a lista de anúncios do cliente e conferir os estados `rascunho`, `pendente`, `aprovado`, `rejeitado` e `arquivado` quando existirem.
9. [ ] `MAN-09` Acessar um anúncio aprovado na área pública via `slug` e conferir título, mídia, descrição e CTA de contato.
10. [ ] `MAN-10` Filtrar a listagem pública por categoria e material e confirmar que os resultados mudam de forma coerente.
11. [ ] `MAN-11` Abrir a página de Preço das Sucatas pública e validar se os valores e quantidades aparecem com formatação legível.
12. [ ] `MAN-12` Enviar uma pergunta a partir do fluxo público ou autenticado e conferir se ela aparece na central do anunciante.
13. [ ] `MAN-13` Responder uma pergunta no dashboard do anunciante e confirmar que a resposta volta para o contexto correto do anúncio.
14. [ ] `MAN-14` Abrir a central de notificações do cliente e marcar uma notificação como lida sem quebrar a navegação.
15. [ ] `MAN-15` Abrir tickets de suporte no dashboard do cliente, visualizar o detalhe e registrar uma nova interação sem perder histórico.

## 3) Fluxo do admin

1. [ ] `MAN-16` Entrar como admin e cair em `/admin` com os atalhos, menu lateral e dados da conta corretos.
2. [ ] `MAN-17` Aprovar um anúncio pendente e confirmar a publicação pública com `slug` e `published_at` válidos.
3. [ ] `MAN-18` Rejeitar um anúncio pendente e confirmar que o motivo fica visível para o usuário correto.
4. [ ] `MAN-19` Arquivar ou alterar o status de um anúncio e confirmar que o estado refletido no dashboard muda imediatamente.
5. [ ] `MAN-20` Responder, ocultar ou moderar perguntas no painel admin sem perder o vínculo com o anúncio.
6. [ ] `MAN-21` Abrir `/admin/materiais`, criar um material com acentuação correta, editar e inativar o item sem quebrar a listagem.
7. [ ] `MAN-22` Abrir `/admin/categorias`, criar ou editar uma categoria e confirmar que slug, nome e ordenação persistem corretamente.
8. [ ] `MAN-23` Abrir `/admin/localidades` e validar criação, edição e exclusão com feedback claro e sem travar a navegação.
9. [ ] `MAN-24` Abrir `/admin/precos`, cadastrar e editar preços manuais e confirmar reflexo na área pública de preço/LME.
10. [ ] `MAN-25` Abrir `/admin/preco-das-sucatas`, exportar XLSX, importar a planilha editada e confirmar que os preços entram com a formatação correta.
11. [ ] `MAN-26` Abrir `/admin/blog`, criar rascunho, publicar e validar o conteúdo na página pública com `slug` funcional.
12. [ ] `MAN-27` Abrir `/admin/usuarios`, buscar um usuário, ajustar estado/role quando permitido e confirmar que o acesso é refletido.
13. [ ] `MAN-28` Abrir `/admin/configuracoes`, alterar uma configuração global e confirmar reflexo em uma área pública ou privada dependente.
14. [ ] `MAN-29` Abrir `/admin/logs`, localizar uma ação crítica recente e confirmar que o registro de auditoria existe com dados suficientes.
15. [ ] `MAN-30` Abrir `/admin/notificacoes` ou fila equivalente e validar envio, leitura e reprocessamento sem duplicar eventos.

## 4) Operação diária e estados críticos

1. [ ] `MAN-31` Cada tela crítica mostra loading claro durante o carregamento inicial.
2. [ ] `MAN-32` Cada tela crítica mostra estado vazio útil com orientação do próximo passo.
3. [ ] `MAN-33` Cada falha relevante exibe mensagem compreensível e não derruba a navegação.
4. [ ] `MAN-34` O fluxo principal continua utilizável em viewport mobile, inclusive criação e edição básica.
5. [ ] `MAN-35` Textos acentuados, nomes de materiais, categorias e mensagens do sistema aparecem corretamente em português.
6. [ ] `MAN-36` A versão de build aparece no rodapé público, no dashboard e no admin com o formato esperado.
7. [ ] `MAN-37` A navegação entre áreas pública, anunciante e admin mantém a sessão e não perde contexto crítico.
8. [ ] `MAN-38` Ações sensíveis exigem permissão adequada e negam acesso quando o papel do usuário não é suficiente.

## 5) Observações

- Este arquivo é propositalmente focado em cenários que fazem parte da operação normal do cliente e do admin.
- Se algum item falhar, registrar o passo exato, a tela impactada, o dado usado e a condição observada antes de marcar como `NOK`.
- Quando um fluxo for alterado por nova funcionalidade, este checklist deve ser atualizado no mesmo ciclo da entrega.
