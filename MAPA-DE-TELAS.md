# MAPA DE TELAS — GLOBAL SHARED STOCK

Versão de planejamento: 0.3
Etapa: Dia 3 do Desafio dos 10 Dias  
Este documento organiza as telas e os caminhos de navegação. Ele não cria nem modifica páginas do site.

## 1. Objetivo

O mapa define:

- quais telas qualquer visitante pode abrir;
- quais telas exigem uma pessoa identificada e autorizada;
- como comprador, vendedor e Administrador percorrem o sistema;
- em quais momentos o sistema apresenta bloqueios e seus motivos;
- como as telas conversarão com o Supabase e, futuramente, com a função protegida da inteligência artificial.

As telas serão construídas primeiro para celular. No computador, o conteúdo poderá ocupar mais espaço, mas o caminho e as funções serão os mesmos.

## 2. Divisão entre público e protegido

| PÚBLICO — qualquer pessoa pode abrir | PROTEGIDO — exige acesso autorizado |
|---|---|
| Página inicial e apresentação da plataforma | Área da empresa |
| Pesquisa e vitrine de materiais publicados | Dados e usuários da empresa |
| Detalhes públicos de um anúncio | Cadastro e edição de materiais |
| Cadastro da empresa e leitura dos Termos Gerais | Arquivos, certificados e fotografias dos materiais |
| Entrada da empresa | Interesses enviados ou recebidos |
| Entrada administrativa, em acesso discreto e separado | Negociações e histórico de mensagens |
| Solicitação de recuperação de senha | Aceites dos Termos Específicos da negociação |
| Redefinição por link seguro e temporário | Envio da Ordem de Compra da comissão |
| Confirmação do e-mail por link seguro e temporário | Materiais vendidos e negociações encerradas |
| Mensagens de acesso negado ou pendente | Painel administrativo e suas validações |

Uma tela pública pode apresentar informações diferentes conforme a situação. O visitante vê “Preço disponível para empresas cadastradas”, enquanto uma empresa compradora aprovada pode visualizar o preço. Antes da garantia da comissão, o anúncio mostra somente o país e o estado do material, nunca a cidade, o endereço completo ou os contatos.

## 3. Cabeçalho e identificação

Todas as áreas protegidas mostrarão, no canto superior direito:

- **Administrador**, quando a sessão administrativa estiver aberta;
- o nome da empresa, quando um usuário empresarial estiver conectado.

O cabeçalho também permitirá sair com segurança. O acesso administrativo permanecerá separado e discreto na página inicial, sem ser confundido com a entrada das empresas.

## 4. Caminho público

```text
PÁGINA INICIAL
        │
        ├── Pesquisar materiais
        │       └── Abrir anúncio
        │               ├── visitante: vê informações públicas
        │               └── empresa autorizada: vê preço e pode demonstrar interesse
        │
        ├── Cadastrar empresa
        │       └── Preencher dados e anexar documentos
        │               └── Ler e aceitar os Termos Gerais aplicáveis
        │                       └── Revisar e enviar a solicitação
        │
        ├── Entrar como empresa
        │       ├── Informar e-mail e senha
        │       ├── Recuperar senha
        │       └── Confirmar e-mail por link seguro
        │
        └── Acesso administrativo discreto
                └── Informar credenciais administrativas
```

## 5. Cadastro e ativação da empresa

```text
CADASTRO DA EMPRESA
        │
        ├── Dados empresariais e perfil comercial
        ├── Contato principal
        ├── Contatos comerciais
        ├── Endereço e locais de estoque reutilizáveis
        │       └── escolher local padrão para novos materiais
        ├── Cartão CNPJ
        └── Contrato social
        │
        ▼
TERMOS GERAIS DEFINIDOS PELO PERFIL
        │
        ├── vendedora: aceita o Termo Geral do Vendedor
        ├── compradora: aceita o Termo Geral do Comprador
        └── perfil duplo: aceita os dois Termos Gerais
        │
        ▼
REVISAR SOLICITAÇÃO
        │
        ├── Corrigir dados
        └── Confirmar envio
        │
        ▼
ANÁLISE ADMINISTRATIVA
        │
        ├── rejeitada: mostra motivo e orientação
        └── aprovada: segue para ativação do acesso
```

### Primeiro usuário principal

- torna-se obrigatoriamente o usuário principal depois da aprovação;
- confirma o e-mail pelo link recebido;
- aguarda a aprovação do Administrador;
- depois da aprovação, entra na área da empresa.

### Usuários seguintes

- confirmam o e-mail pelo link recebido;
- aguardam a aprovação do usuário principal;
- aguardam a aprovação do Administrador;
- entram somente depois das três confirmações.

Enquanto faltar uma confirmação, a tela informa exatamente qual etapa está pendente.

### Transferência posterior do usuário principal

```text
USUÁRIO PRINCIPAL ATUAL SOLICITA A TRANSFERÊNCIA
        │
        ▼
NOVO PRINCIPAL CONFIRMA
        │
        ▼
ADMINISTRADOR APROVA
```

Em situação excepcional, o Administrador poderá transferir a função sem a participação do principal anterior, informando o motivo. A empresa nunca ficará sem um usuário principal.

Quando uma nova versão relevante dos Termos Gerais entrar em vigor, o principal deverá abri-la e aceitá-la em nome da empresa. O histórico continuará acessível, mas as novas operações afetadas ficarão bloqueadas até o novo aceite. A tela mostrará o documento pendente e o prazo definido pelo Administrador.

## 6. Entrada e recuperação de senha

```text
ENTRADA DA EMPRESA
        │
        ├── acesso confirmado: abre a área da empresa
        ├── senha esquecida: envia link seguro de recuperação
        └── acesso pendente ou bloqueado: mostra o motivo
```

O link de recuperação será individual, terá prazo de validade e funcionará somente uma vez.

## 7. Área da empresa

| Aba | Conteúdo |
|---|---|
| **Materiais** | Rascunhos, materiais enviados, correções, aprovações e publicações. |
| **Interesses** | Interesses enviados pela compradora e solicitações recebidas pela vendedora. |
| **Negociações** | Produtos em negociação, novas movimentações e históricos individuais. |
| **Concluídos** | Materiais vendidos, negociações encerradas e respectivos resultados. |

A área **Dados da empresa** permitirá administrar contatos comerciais, locais de estoque, usuários, transferência do usuário principal, Termos Gerais pendentes e solicitações de alteração do perfil comercial.

As funções exibidas dependem do perfil comercial. Uma empresa exclusivamente vendedora não terá ações de compra. Uma tentativa por endereço direto também será bloqueada e explicada pelo servidor.

## 8. Caminho da empresa vendedora — materiais

```text
ÁREA DA EMPRESA
        │
        ▼
ABA MATERIAIS
        │
        ├── Novo material
        │       ├── dados técnicos e classificação
        │       ├── condição, quantidade e unidade
        │       ├── local de estoque, usando o padrão ou outro local cadastrado
        │       ├── preço final e líquido estimado
        │       ├── fotografias
        │       └── certificado, quando houver
        │
        ├── Editar material ainda não enviado
        ├── Salvar lista provisória no aparelho
        └── Revisar e enviar para análise
                ├── correção solicitada: editar e reenviar
                ├── rejeitado: ver motivo
                └── aprovado e publicado: anúncio aparece na pesquisa
```

Pressionar a tecla Enter não adicionará um material à lista. A inclusão dependerá do botão **Adicionar à lista**.

Cada material publicado mostrará as quantidades total atual, reservada, vendida e disponível. O vendedor poderá solicitar alteração, suspensão ou retirada do anúncio. Enquanto a alteração estiver em análise, a versão já publicada continuará válida. Uma redução de quantidade nunca poderá ficar abaixo da soma reservada e vendida.

Se houver negociação ativa, uma retirada dependerá da decisão do Administrador. A suspensão poderá impedir novos interesses enquanto as negociações existentes são resolvidas.

## 9. Validação administrativa do material

```text
PAINEL ADMINISTRATIVO
        │
        ▼
VALIDAÇÃO DE MATERIAIS
        │
        └── Abrir resumo do material
                ├── conferir dados, fotografias e certificado
                ├── solicitar correção com motivo
                ├── rejeitar com motivo
                └── aprovar e publicar em uma única ação
                        ├── material aprovado
                        ├── anúncio criado
                        └── anúncio aparece na pesquisa
```

Se qualquer parte dessa ação falhar, nenhuma das três etapas será confirmada. Não haverá estado intermediário de material aprovado aguardando publicação.

## 10. Caminho da empresa compradora — pesquisa e interesse

```text
PESQUISA DE MATERIAIS
        │
        ├── pesquisar por descrição, Part number ou classificação
        ├── aplicar filtros
        └── abrir anúncio
                │
                ├── visitante: convidado a cadastrar ou entrar
                ├── empresa somente vendedora: bloqueada com explicação
                ├── dona do anúncio: bloqueada com explicação
                └── compradora autorizada
                        └── Tenho interesse
                                ├── quantidade
                                ├── prazo desejado
                                ├── assunto
                                └── observação sem contato direto
```

Depois do envio, o interesse aparece na aba **Interesses** da compradora com sua situação atual.

## 11. Validação do interesse

```text
INTERESSE ENVIADO
        │
        ▼
ADMINISTRADOR CONFERE
        │
        ├── rejeitar com motivo
        │       └── comprador pode corrigir e reenviar
        ├── solicitar correção com motivo
        │       └── comprador edita e reenvia
        └── aprovar
                └── encaminhar à empresa vendedora
```

Telefone, e-mail e endereços eletrônicos serão bloqueados antes da liberação formal dos contatos. A mensagem explicará por que o conteúdo não pode ser enviado.

## 12. Negociações separadas por produto

Cada negociação ficará vinculada a um único produto. A aba **Negociações** mostrará cartões resumidos em vez de todos os históricos abertos ao mesmo tempo.

```text
ABA NEGOCIAÇÕES
        │
        ├── Produto A — nova movimentação
        ├── Produto B
        └── Produto C — nova movimentação
                │
                ▼
        ABRIR NEGOCIAÇÃO DO PRODUTO
                ├── histórico de mensagens
                ├── situação atual
                ├── ação necessária
                └── resumo das condições vigentes
```

Quando houver novidade, o cartão usará uma cor de destaque e indicará a quantidade de registros ainda não vistos. Ao abrir o produto, o sistema marcará a movimentação como lida para aquele destinatário.

## 13. Histórico da negociação

As mensagens serão exibidas como uma conversa, com lados diferentes conforme quem estiver olhando.

| Visão | Lado esquerdo | Lado direito |
|---|---|---|
| Administrador | vendedor | comprador |
| Vendedor | comprador | vendedor |
| Comprador | vendedor | comprador |

Ao final do histórico aparecerá um resumo com quantidade confirmada, disponibilidade, prazo, preço vigente, documentação disponível, decisão mais recente e próxima ação necessária.

## 14. Propostas e aprovações

```text
VENDEDOR RESPONDE
        ├── disponibilidade, quantidade e prazo
        ├── preço final
        └── documentação
                │
                ▼
ADMINISTRADOR CONFERE E ENCAMINHA
                │
                ▼
COMPRADOR DECIDE
        ├── rejeitar
        ├── aceitar
        └── solicitar ajuste
                │
                ▼
ADMINISTRADOR CONFERE O AJUSTE
                │
                ▼
VENDEDOR DECIDE
        ├── rejeitar
        ├── aceitar
        └── apresentar contraproposta
                │
                ▼
ADMINISTRADOR CONFERE E ENCAMINHA
                │
                ▼
ACORDO CONFIRMADO OU NOVA RODADA
```

Cada rejeição ou pedido de correção mostrará o motivo. As versões anteriores permanecerão no histórico.

O interesse inicial não compromete estoque. Depois que o vendedor confirmar a quantidade e o Administrador validar a negociação, o sistema reservará o saldo correspondente. Os cartões do material e da negociação mostrarão a quantidade reservada. Ajustes somente serão aceitos quando houver saldo; cancelamento, rejeição ou expiração liberarão a reserva.

## 15. Quatro Termos, comissão e Ordem de Compra

### Termos aceitos durante o cadastro

- **Termo Geral do Vendedor:** regras gerais de negociação, forma de cálculo da comissão e responsabilidade pelo material anunciado e vendido.
- **Termo Geral do Comprador:** regras gerais de negociação, compromisso de pagamento e responsabilidade pela retirada do material no prazo determinado.
- empresa com perfil duplo aceita os dois documentos.

O cadastro não pode ser enviado enquanto faltar um Termo Geral exigido pelo perfil escolhido.

### Termos gerados depois do acordo

```text
ACORDO CONFIRMADO
        │
        ▼
SISTEMA GERA DUAS VERSÕES ESPECÍFICAS E IMUTÁVEIS
        │
        ├── Termo Específico do Vendedor
        │       ├── condições daquela venda
        │       ├── comissão em percentual e valor
        │       └── responsabilidade sobre o material
        │
        └── Termo Específico do Comprador
                ├── condições daquela compra
                ├── compromisso de pagamento
                └── responsabilidade pela retirada no prazo
        │
        ▼
VENDEDOR E COMPRADOR ABREM SEUS DOCUMENTOS E LEEM ATÉ O FINAL
        │
        ▼
CADA EMPRESA ACEITA SEU TERMO ESPECÍFICO
        │
        ▼
VENDEDOR ANEXA A ORDEM DE COMPRA DA COMISSÃO
        │
        ▼
ADMINISTRADOR CONFERE
        ├── solicitar correção com motivo
        ├── rejeitar com motivo
        └── aprovar
                │
                ▼
COMISSÃO GARANTIDA E CONTATOS LIBERADOS
```

Cada campo de aceite só será liberado depois da abertura e da chegada ao final do respectivo documento. O sistema registrará a versão, a empresa, o usuário e o momento do aceite.

O percentual e o valor da comissão serão calculados pela regra administrativa vigente e aparecerão no Termo Específico do Vendedor e na Ordem de Compra. O vendedor não poderá alterar esse cálculo. Mudanças futuras na configuração não modificarão silenciosamente a negociação em andamento.

Se uma condição da negociação mudar, novas versões dos dois Termos Específicos serão geradas e as duas empresas deverão aceitá-las novamente.

## 16. Liberação dos contatos e encerramento

```text
ORDEM DE COMPRA APROVADA
        │
        ▼
Comprador e vendedor recebem os contatos autorizados
        ├── contatos comerciais autorizados
        ├── cidade e endereço completo do material
        └── instruções de retirada
        │
        ▼
Partes concluem a etapa comercial direta
        │
        ▼
Administrador registra o resultado
        ├── encerrado sem venda
        └── venda concluída
                ├── reserva vira quantidade vendida
                ├── ainda existe saldo: anúncio permanece publicado
                └── saldo igual a zero
                        ├── anúncio recebe a indicação “Vendido”
                        └── permanece na vitrine por cinco dias
                                └── arquivamento
```

O encerramento não dependerá de uma confirmação final do comprador ou do vendedor. O Administrador determinará o resultado com base nas informações disponíveis.

## 17. Alterações da empresa e dos anúncios

```text
USUÁRIO PRINCIPAL
        │
        ├── solicita mudança do perfil comercial
        │       ├── mantém o perfil atual durante a análise
        │       ├── aceita o novo Termo Geral, quando necessário
        │       └── aguarda aprovação, correção ou rejeição do Administrador
        │
        └── solicita alteração, suspensão ou retirada de anúncio
                ├── versão publicada permanece durante a análise
                └── Administrador aprova, pede correção ou rejeita
```

A retirada de um perfil comercial aguardará a solução das operações ativas daquele perfil. Todo histórico continuará preservado. Uma alteração aprovada no anúncio criará nova versão publicada sem apagar a anterior nem modificar silenciosamente negociações existentes.

## 18. Painel administrativo

O painel será organizado em áreas resumidas. Cada registro abrirá seus detalhes somente quando o Administrador selecionar o item.

| Aba | Conteúdo e ações principais |
|---|---|
| **Validação de empresas** | Conferir cadastros e documentos; aprovar, rejeitar ou suspender com motivo. |
| **Validação de materiais** | Conferir dados e arquivos; aprovar e publicar em uma única ação, solicitar correção ou rejeitar. |
| **Interesses e negociações** | Validar mensagens, propostas, respostas, acordos e documentos comerciais. |
| **Usuários e acessos** | Aprovar usuários, transferir usuário principal, alterar e-mail autorizado e bloquear acesso. |
| **Alterações solicitadas** | Analisar perfil comercial, dados, documentos, suspensão, retirada e nova versão de anúncio. |
| **Comissões e Termos** | Manter regras versionadas de comissão, vigências dos Termos Gerais e exigências de novo aceite. |
| **Concluídos** | Consultar vendas, encerramentos, comissão, prazo de conservação e histórico. |

Os indicadores mostrarão quantidades pendentes, aprovações do dia e novas movimentações. Eles serão resumos; os detalhes serão carregados somente quando o Administrador abrir o item.

## 19. Mensagens obrigatórias de bloqueio

Nenhum bloqueio será silencioso. A tela explicará o motivo e, quando existir, a providência possível.

| Situação | Mensagem esperada em linguagem simples |
|---|---|
| Empresa exclusivamente vendedora tenta comprar | Sua empresa está cadastrada somente como vendedora e não pode demonstrar interesse em materiais. |
| Empresa tenta comprar o próprio material | Sua empresa não pode demonstrar interesse em um anúncio próprio. |
| Cadastro ainda não aprovado | O acesso está aguardando aprovação. A tela informa qual confirmação falta. |
| Novo Termo Geral pendente | Uma nova versão dos Termos precisa ser aceita pelo usuário principal antes desta operação. |
| Saldo insuficiente | A quantidade disponível mudou e não é suficiente para esta reserva. Revise a quantidade. |
| Redução abaixo do comprometido | A quantidade não pode ser menor que o total já reservado e vendido. |
| Perfil comercial incompatível | Esta operação não está disponível para o perfil comercial atual da empresa. |
| Tentativa de contato direto antes da liberação | Telefones, e-mails e endereços eletrônicos só podem ser compartilhados depois da garantia da comissão. |
| Arquivo inválido | A tela informa o formato ou o tamanho aceito. |
| Operação exclusiva do Administrador | Esta ação só pode ser realizada pelo Administrador. |
| Falha ao confirmar a permissão | Não foi possível confirmar sua autorização. Entre novamente ou tente mais tarde. |

## 20. Comunicação entre as telas e os serviços

```text
CELULAR OU COMPUTADOR
Página pública ou área protegida no Cloudflare Pages
                    │
                    │ identidade e solicitação
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
SUPABASE                FUNÇÃO PROTEGIDA
• confirma o acesso     • confirma a permissão
• protege cada dado     • executa tarefa sigilosa
• guarda os dados       • futuramente chama a IA
• guarda os arquivos    • guarda a chave da IA
```

A chave da IA não passa pelo navegador, não aparece nas telas e não é guardada em arquivo enviado ao Git.

## 21. Propriedade do dado

- cada tela protegida recebe a identidade confirmada do usuário;
- o banco identifica a empresa relacionada;
- a consulta retorna somente os registros permitidos para aquela empresa e aquele papel;
- cada gravação registra o `usuario_id` responsável;
- o Administrador também deixa histórico quando toma uma decisão;
- trocar um usuário não transfere nem apaga os dados pertencentes à empresa.

## 22. O que este documento não executa

Este mapa não:

- cria páginas ou botões;
- modifica a navegação atual;
- cria o banco do Supabase;
- envia e-mails;
- migra dados do Cloudflare;
- ativa a inteligência artificial;
- define novos requisitos além dos já confirmados.

## 23. Critério de aprovação

O `MAPA-DE-TELAS.md` estará aprovado quando você confirmar que:

- as áreas públicas e protegidas estão corretamente separadas;
- os caminhos do comprador, do vendedor e do Administrador estão completos;
- as negociações aparecem resumidas e separadas por produto;
- os bloqueios sempre apresentam uma explicação;
- os Termos Gerais são aceitos no cadastro conforme o perfil da empresa;
- versões gerais relevantes exigem novo aceite do usuário principal;
- os dois Termos Específicos e a Ordem de Compra antecedem a liberação dos contatos;
- o estoque reservado e o saldo disponível aparecem sem permitir dupla alocação;
- alterações de anúncios e de perfil comercial passam por aprovação administrativa;
- as regras de comissão são administradas e versionadas sem efeito retroativo silencioso;
- o Administrador determina o encerramento da negociação.
