# Especificação do MVP — Global Shared Stock

## 1. O PROBLEMA

Equipes de Compras do setor de óleo e gás podem levar semanas ou meses para localizar uma peça crítica sem estoque no fabricante.
Enquanto procuram, equipamentos e plataformas podem permanecer parados, gerando custos elevados e perda de produção.
Ao mesmo tempo, outras empresas podem ter a peça disponível em estoques parados ou de baixa movimentação, mas não existe um meio rápido de encontrá-la e negociar com segurança.

## 2. QUEM USA

- O profissional de Compras ou Supply Chain entra para pesquisar materiais e sair tendo encontrado uma peça disponível e registrado seu interesse sem descobrir a identidade do vendedor.
- A empresa vendedora entra para cadastrar manualmente os materiais que escolheu disponibilizar e sair com seus anúncios enviados para aprovação.
- O administrador da plataforma entra para aprovar empresas e anúncios, receber os registros de interesse e conduzir manualmente a intermediação por e-mail, sem revelar inicialmente as partes.
- Cada empresa tem um contato principal com acesso; até dois e-mails adicionais recebem as notificações em cópia.

**Regra permanente:** tudo precisa funcionar primeiro no celular. O site também deve funcionar no computador, mas nenhuma etapa pode depender de uma tela grande.

## 3. O QUE A PESSOA FAZ HOJE

O profissional de Compras procura primeiro o fabricante, depois os representantes locais, nacionais e globais. Quando não encontra a peça, tenta descobrir quais outras empresas utilizam o mesmo equipamento e podem ter o material em estoque. Ao localizar alguém, inicia uma negociação diretamente, processo que pode levar meses e exigir interferência gerencial.

## 4. O QUE É SUCESSO

No teste final, usando um celular, um profissional de Compras deve encontrar pelo menos um anúncio disponível e registrar seu interesse em até **1 minuto**, com **1 empresa real cadastrada** e **20 anúncios publicados**.

## 5. A FEATURE DE IA

Mais para a frente, a inteligência artificial lerá o extrato de estoque em Excel enviado pelo vendedor, identificará os campos relevantes e os transformará em anúncios padronizados, sempre com conferência humana antes de salvar e publicar.

## 6. FORA DE ESCOPO

- Inteligência artificial e padronização automática dos extratos de estoque durante estes dez dias.
- Importação automática de arquivos de estoque; os 20 anúncios do teste serão cadastrados manualmente.
- Chat ou troca de mensagens dentro da plataforma; a intermediação será feita manualmente pelo administrador por e-mail.
- Fluxo automático de acordo, ordens de compra, comprovante de pagamento e liberação dos dados de coleta; esses controles serão manuais durante o teste.
- Pagamento processado dentro da plataforma.
- Transporte, cálculo de frete, rastreamento e confirmação de entrega.
- Emissão de documentos fiscais.
- Integração automática com os sistemas de estoque das empresas.
- Aplicativo instalável; será um site que funciona no navegador.
- Conversão de moedas e painel de cotações; todos os valores serão em dólar.
- Inteligência artificial na busca de materiais.
- Cadastro de empresas internacionais e materiais localizados fora do Brasil.
- Importação de PDF, imagens ou outros formatos de extrato; quando a função futura de IA for construída, o primeiro formato aceito será `.xlsx`.
- Percentuais variáveis de comissão; o MVP usará 10%.
- Exibição pública de cidade, estado, unidade, endereço ou identidade do vendedor.
- Contato direto entre comprador e vendedor antes da formalização.
- Confirmação de pagamento e entrega feita automaticamente por banco ou transportadora.

## 7. CASOS DE BORDA

- **Salvar um cadastro sem nenhum material:** não salvar o registro e informar que é necessário incluir pelo menos um material.
- **Quantidade zero ou negativa:** não salvar o anúncio e pedir uma quantidade disponível maior que zero.
- **Nome obrigatório em branco:** não salvar e destacar o campo obrigatório que precisa ser preenchido.
- **Dois toques rápidos no botão de salvar:** aceitar somente o primeiro toque, mostrar que o salvamento está em andamento e criar apenas um registro.
