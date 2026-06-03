# CHECKLIST DE VALIDACAO MANUAL CRITICA - ZAP SUCATAS

Data de referência: 2026-06-03
Objetivo: concentrar testes manuais de alto impacto que afetam a usabilidade da plataforma para usuários e admin.

## 1) Legenda

- [ ] Pendente de validação manual
- [OK] Validado manualmente com sucesso
- [NOK] Falhou na validação manual

## 2) Fluxos críticos do usuário

1. [OK] `MAN-01` Login com e-mail e senha e redirecionamento correto para `/app`.
2. [ ] `MAN-02` Criação de anúncio em rascunho sem erro de validação e salvamento bem-sucedido.
3. [ ] `MAN-03` Edição de anúncio existente com persistência correta dos dados alterados.
4. [ ] `MAN-04` Envio de anúncio para revisão e atualização visual clara do status.
5. [ ] `MAN-05` Visualização de anúncio aprovado na área pública com slug funcionando.
6. [ ] `MAN-06` Acesso ao detalhe de suporte em `/app/suporte/:id` com leitura e resposta funcionando.
7. [ ] `MAN-07` Central de notificações em `/app/notificacoes` exibindo itens novos e marcando como lidas.
8. [ ] `MAN-08` Recuperação de senha funcionando do início ao fim.

## 3) Fluxos críticos do admin

1. [ ] `MAN-09` Login admin e redirecionamento correto para `/admin`.
2. [ ] `MAN-10` Aprovação de anúncio em revisão com publicação pública após a decisão.
3. [ ] `MAN-11` Rejeição de anúncio com motivo visível para o usuário.
4. [ ] `MAN-12` Acesso e uso da fila de suporte em `/admin/suporte` sem travar navegação.
5. [ ] `MAN-13` Gerenciamento de usuários sem quebra de listagem, busca ou ações principais.
6. [ ] `MAN-14` Configurações globais salvando corretamente e refletindo no frontend.
7. [ ] `MAN-15` Página de pagamentos de destaque abrindo e respondendo à alternância de ativação.

## 4) Estados críticos de UX

1. [ ] `MAN-16` Telas críticas mostram estado de loading claro enquanto dados carregam.
2. [ ] `MAN-17` Erros críticos exibem mensagem compreensível e não quebram a navegação.
3. [ ] `MAN-18` Estados vazios orientam o próximo passo de forma clara.
4. [ ] `MAN-19` O fluxo principal funciona de forma aceitável em viewport mobile.
5. [ ] `MAN-20` Não há quebra visual por acentuação, caracteres inválidos ou textos truncados nas telas críticas.

## 5) Observações

- Este arquivo é propositalmente focado em cenários de uso que afetam a operação diária.
- Não substitui o checklist de implementação e testes automatizados.
- Se algum item falhar, registrar o passo exato, a tela impactada e a condição observada antes de marcar como `NOK`.
