# MODELO DE DADOS — GLOBAL SHARED STOCK

Versão de planejamento: 0.3
Etapa: Dia 3 do Desafio dos 10 Dias  
Este documento descreve os dados. Ele não cria banco nem altera o site.

## 1. Princípio de propriedade dos dados

A Global Shared Stock é uma plataforma entre empresas. Por isso, a proprietária principal dos materiais, anúncios, interesses e negociações é a **empresa**, e não somente a pessoa que entrou no sistema.

Sempre que uma ação humana precisar ser identificada, também será registrado o **usuário responsável**. Assim:

- `empresa_id` identifica a empresa dona ou participante do dado;
- `usuario_id` identifica a pessoa que realizou a ação;
- dados administrativos pertencem à plataforma e registram `administrador_id` quando houver uma decisão;
- trocar o contato de acesso de uma empresa não transfere nem apaga seu histórico;
- comprador e vendedor só enxergam os dados permitidos para seu papel e para a etapa da negociação.

**Como ler os nomes técnicos:** os textos entre crases, como `empresa_id`, representam nomes internos que serão usados na construção do banco de dados. Por esse motivo, eles aparecem sem acentos e com sublinhados. Esses nomes não serão mostrados dessa forma nas telas utilizadas pelas empresas.

**Regra de propriedade:** o responsável nasce junto com cada dado porque um registro sem proprietário poderia ser visto, alterado ou assumido pela pessoa errada antes que a proteção fosse acrescentada posteriormente.

## 2. Listas fechadas compartilhadas

Estas opções não serão textos livres. O sistema aceitará somente valores previstos.

Na tela, uma lista fechada normalmente aparece como lista suspensa, botão de seleção ou caixa de marcação. Situações internas são alteradas pelo sistema. Campos descritivos, mensagens, observações e motivos continuam como texto livre. Quando houver a opção **Outra**, o detalhamento informado não passa automaticamente a integrar a lista oficial.

### Perfil comercial da empresa

- `compradora`
- `vendedora`
- `compradora_e_vendedora`

### Situação do cadastro da empresa

- `aguardando_analise`
- `aprovada`
- `rejeitada`
- `suspensa`

### Condição do material

- `novo`
- `usado`
- `recondicionado`
- `sucata`

### Unidades

- `unidade`
- `lote`
- `quilograma`
- `metro`
- `metro_quadrado`
- `metro_cubico`
- `litro`
- `outra`

### Situação do material

- `rascunho`
- `aguardando_analise`
- `correcao_solicitada`
- `aprovado`
- `rejeitado`

Esta lista controla somente a validação do material. Publicação pertence ao anúncio; negociação, reserva, venda parcial e esgotamento são calculados pelas quantidades e reservas.

### Situação do anúncio

- `publicado`
- `suspenso`
- `retirada_solicitada`
- `retirado`
- `vendido_em_exibicao`
- `arquivado`

### Situação da reserva de estoque

- `ativa`
- `liberada`
- `convertida_em_venda`
- `expirada`

### Situação do interesse e da negociação

- `recebido`
- `reenviado_para_avaliacao`
- `rejeitado`
- `em_intermediacao`
- `aguardando_vendedor`
- `resposta_do_vendedor_em_analise`
- `correcao_solicitada_ao_vendedor`
- `resposta_encaminhada_ao_comprador`
- `condicoes_aceitas_pelo_comprador`
- `ajuste_do_comprador_em_analise`
- `correcao_solicitada_ao_comprador`
- `ajuste_encaminhado_ao_vendedor`
- `resposta_ao_ajuste_em_analise`
- `acordo_confirmado`
- `ordem_de_compra_em_analise`
- `correcao_da_ordem_solicitada`
- `comissao_garantida`
- `encerrado_sem_venda`
- `vendido`

### Tipo de arquivo

- `cartao_cnpj`
- `contrato_social`
- `foto_material`
- `certificado_material`
- `ordem_compra_comissao`
- `planilha_estoque_xlsx`

### Tipo de Termo

- `geral_vendedor`
- `especifico_vendedor`
- `geral_comprador`
- `especifico_comprador`

## 3. Tabelas principais

### 3.1 EMPRESA

Guarda a organização cadastrada na plataforma.

| Campo | Tipo | Obrigatório | Finalidade |
|---|---|---:|---|
| `id` | identificador único | sim | Identificar a empresa sem depender de nome ou CNPJ. |
| `usuario_id` | identificador | sim | Pessoa responsável pela criação inicial do cadastro. |
| `razao_social` | texto | sim | Nome jurídico da empresa. |
| `cnpj` | texto com 14 números | sim | Identificação fiscal; deve ser único. |
| `inscricao_estadual` | texto | não | Registro estadual, quando aplicável. |
| `inscricao_municipal` | texto | não | Registro municipal, quando aplicável. |
| `perfil_comercial` | lista fechada | sim | Compradora, vendedora ou ambas. |
| `tamanho_estoque` | lista fechada | sim | Faixa informada no cadastro. |
| `contato_principal_nome` | texto | sim | Responsável principal. |
| `contato_principal_email` | e-mail | sim | E-mail principal e atual de acesso. |
| `email_copia_1` | e-mail | não | Primeiro destinatário adicional de notificações. |
| `email_copia_2` | e-mail | não | Segundo destinatário adicional de notificações. |
| `situacao` | lista fechada | sim | Situação do cadastro. |
| `motivo_rejeicao_ou_suspensao` | texto | não | Explicação obrigatória quando houver bloqueio. |
| `criada_em` | data e hora | sim | Momento do cadastro. |
| `avaliada_em` | data e hora | não | Momento da decisão administrativa. |
| `administrador_id` | identificador | não | Administrador responsável pela decisão. |

**Dono:** a própria empresa (`id`).  
**Visibilidade:** a empresa vê seus dados; o administrador vê todos; outras empresas não veem sua identidade antes da liberação formal dos contatos.

### 3.2 USUARIO

Guarda a pessoa autorizada a entrar em nome de uma empresa ou da administração.

| Campo | Tipo | Obrigatório | Finalidade |
|---|---|---:|---|
| `usuario_id` | identificador único | sim | Identificar a pessoa de acesso e a proprietária deste registro individual. |
| `empresa_id` | identificador | não | Empresa representada; vazio somente para administrador. |
| `nome` | texto | sim | Nome da pessoa. |
| `email` | e-mail corporativo | sim | Identificação individual usada para entrar no sistema; deve ser única. |
| `papel` | usuário principal, usuário comum ou administrador | sim | Definir a área e as permissões. |
| `senha_protegida` | texto protegido | sim | Resultado seguro da senha; nunca guardar a senha legível. |
| `situacao` | aguardando confirmação do e-mail, aguardando aprovações, ativo, rejeitado ou bloqueado | sim | Controlar a entrada de cada usuário. |
| `email_verificado_em` | data e hora | não | Comprovar que a pessoa abriu o link enviado ao endereço cadastrado. |
| `aprovado_pelo_usuario_principal_em` | data e hora | não | Aprovação obrigatória para os demais usuários da empresa. |
| `usuario_principal_aprovador_id` | identificador | não | Usuário principal responsável pela decisão. |
| `aprovado_pelo_administrador_em` | data e hora | não | Segunda aprovação obrigatória. |
| `administrador_aprovador_id` | identificador | não | Administrador da plataforma responsável pela decisão. |
| `motivo_rejeicao` | texto | não | Explicar ao solicitante por que o acesso foi negado. |
| `precisa_trocar_senha` | verdadeiro ou falso | sim | Controlar ativação ou recuperação. |
| `criado_em` | data e hora | sim | Momento da criação. |
| `ultimo_acesso_em` | data e hora | não | Última entrada confirmada no sistema. |

**Dono:** a empresa indicada em `empresa_id`; contas administrativas pertencem à plataforma.  
**Observação:** uma empresa pode possuir vários usuários. Cada pessoa se cadastra com seu próprio e-mail corporativo e sua própria senha. Os e-mails em cópia recebem notificações, mas não ganham acesso automaticamente sem um cadastro de usuário.

**Regra do primeiro usuário:** a primeira pessoa aprovada torna-se obrigatoriamente o usuário principal. A empresa nunca pode ficar sem um responsável principal.

**Transferência:** a transferência normal exige solicitação do responsável atual, confirmação do novo responsável ativo e aprovação administrativa. Em situação excepcional, o Administrador pode realizar a transferência sem a participação do responsável anterior, com motivo e histórico obrigatórios.

**Regra dos demais usuários:** depois que a empresa possui um usuário principal, cada novo usuário depende de três confirmações: validação do e-mail pelo link recebido, aprovação do usuário principal da empresa e aprovação do Administrador da Global Shared Stock. Enquanto qualquer uma estiver pendente, o acesso permanece bloqueado e o sistema informa o que falta.

### 3.2.1 VALIDACAO_EMAIL_USUARIO

Guarda o link seguro e temporário usado para comprovar o controle do e-mail.

| Campo | Tipo | Obrigatório | Finalidade |
|---|---|---:|---|
| `id` | identificador único | sim | Identificar a validação. |
| `usuario_id` | identificador | sim | Usuário que precisa confirmar o e-mail. |
| `empresa_id` | identificador | sim | Empresa solicitada no cadastro. |
| `codigo_protegido` | texto protegido | sim | Resultado seguro do código do link; o código legível não é guardado. |
| `enviado_para` | e-mail | sim | Endereço que recebeu o link. |
| `enviado_em` | data e hora | sim | Momento do envio. |
| `expira_em` | data e hora | sim | Prazo final de uso. |
| `utilizado_em` | data e hora | não | Impedir reutilização do link. |

**Dono:** usuário e empresa indicados.  
**Regra:** o link é individual, possui prazo de validade e só pode ser utilizado uma vez. A validação do e-mail não substitui as aprovações do usuário principal e do administrador.

### 3.3 DOCUMENTO_EMPRESA

Guarda os dados descritivos dos documentos cadastrais. O arquivo privado fica no armazenamento de arquivos.

| Campo | Tipo | Obrigatório | Finalidade |
|---|---|---:|---|
| `id` | identificador único | sim | Identificar o documento. |
| `empresa_id` | identificador | sim | Empresa dona do documento. |
| `usuario_id` | identificador | sim | Pessoa responsável pelo envio. |
| `tipo` | lista fechada | sim | Cartão CNPJ ou contrato social. |
| `nome_original` | texto | sim | Nome apresentado à pessoa. |
| `tipo_arquivo` | texto | sim | Formato técnico do arquivo. |
| `tamanho_bytes` | número | sim | Conferir o limite permitido. |
| `caminho_privado` | texto | sim | Localização interna; não é endereço público. |
| `enviado_em` | data e hora | sim | Momento do envio. |

**Dono:** empresa indicada por `empresa_id`.  
**Visibilidade:** empresa dona e administrador.

### 3.4 MATERIAL

Guarda o item oferecido pela empresa vendedora.

| Campo | Tipo | Obrigatório | Finalidade |
|---|---|---:|---|
| `id` | identificador único | sim | Identificar o material. |
| `empresa_id` | identificador | sim | Empresa vendedora dona do material. |
| `usuario_id` | identificador | sim | Pessoa responsável pela inclusão ou última versão enviada. |
| `descricao` | texto | sim | Nome ou descrição principal. |
| `part_number` | texto | não | Número de identificação da peça, quando existir. O nome permanece em inglês porque foi definido assim para a tela do produto. |
| `fabricante` | texto | não | Fabricante, quando relevante. |
| `classificacao` | lista controlada | sim | Categoria de pesquisa. |
| `outra_classificacao` | texto | não | Usado apenas se a opção for “outra”. |
| `condicao` | lista fechada | sim | Novo, usado, recondicionado ou sucata. |
| `quantidade_atual` | número maior ou igual a zero | sim | Estoque atual oferecido antes de descontar reservas e vendas. |
| `quantidade_reservada` | número calculado | sim | Soma das reservas ativas; não é digitada manualmente. |
| `quantidade_vendida` | número calculado | sim | Soma das reservas convertidas em venda. |
| `quantidade_disponivel` | número calculado | sim | Quantidade atual menos reservada e vendida; nunca pode ser negativa. |
| `local_estoque_id` | identificador | sim | Local reutilizável onde o material está disponível. |
| `unidade` | lista fechada | sim | Unidade de medida. |
| `outra_unidade` | texto | não | Usado apenas se a unidade for “outra”. |
| `preco_unitario_centavos` | número inteiro | sim | Preço em dólar, guardado em centavos para evitar erro de arredondamento. |
| `descricao_complementar` | texto | não | Informações técnicas e comerciais adicionais. |
| `possui_certificado` | verdadeiro ou falso | sim | Indicar a existência de certificado. |
| `situacao_validacao` | lista fechada | sim | Rascunho, análise, correção, rejeição ou aprovação. |
| `motivo_rejeicao` | texto | não | Explicação administrativa. |
| `criado_em` | data e hora | sim | Momento da inclusão. |
| `enviado_para_analise_em` | data e hora | não | Momento do envio. |
| `avaliado_em` | data e hora | não | Momento da decisão. |
| `administrador_id` | identificador | não | Responsável pela avaliação. |

**Dono:** empresa vendedora indicada por `empresa_id`.

### 3.5 ARQUIVO_MATERIAL

Guarda fotografias e certificado vinculados ao material.

| Campo | Tipo | Obrigatório | Finalidade |
|---|---|---:|---|
| `id` | identificador único | sim | Identificar o arquivo. |
| `empresa_id` | identificador | sim | Empresa dona. |
| `usuario_id` | identificador | sim | Pessoa responsável pelo envio. |
| `material_id` | identificador | sim | Material relacionado. |
| `tipo` | foto ou certificado | sim | Definir uso e validações. |
| `nome_original` | texto | sim | Nome do arquivo. |
| `tipo_arquivo` | texto | sim | PDF, JPG, PNG ou WebP, conforme o tipo. |
| `tamanho_bytes` | número | sim | Conferir limite. |
| `caminho_privado` | texto | sim | Localização no armazenamento privado. |
| `foto_capa` | verdadeiro ou falso | não | Identificar a foto principal. |
| `enviado_em` | data e hora | sim | Momento do envio. |

**Dono:** empresa indicada por `empresa_id`.  
**Regras:** no máximo seis fotos; um certificado por material; certificado aceita PDF ou imagem; acesso ao certificado somente para a empresa dona e o administrador durante a validação.

### 3.6 ANUNCIO

É a versão pública e aprovada de um material.

| Campo | Tipo | Obrigatório | Finalidade |
|---|---|---:|---|
| `id` | identificador único | sim | Identificar o anúncio. |
| `material_id` | identificador | sim | Material de origem. |
| `empresa_vendedora_id` | identificador | sim | Proprietária, mantida oculta do público. |
| `usuario_id` | identificador | sim | Administrador responsável pela publicação ou última alteração. |
| `situacao` | lista fechada de situação do anúncio | sim | Controlar somente a visibilidade na vitrine. |
| `versao_material_publicada_id` | identificador | sim | Fotografia imutável da versão aprovada que está visível. |
| `regra_comissao_versao_id` | identificador | sim | Regra de comissão vinculada no momento da publicação. |
| `publicado_em` | data e hora | sim | Início da publicação. |
| `vendido_em` | data e hora | não | Momento da venda. |
| `remover_da_vitrine_em` | data e hora | não | Cinco dias após a venda. |

**Dono:** empresa vendedora.  
**Visibilidade pública:** fotos, descrição, condição e disponibilidade. Preço somente para empresa compradora aprovada e conectada. Identidade do vendedor permanece oculta até a comissão estar garantida.

**Regra de publicação:** uma única operação administrativa aprova o material, cria o anúncio e o publica. Se qualquer parte falhar, toda a operação falha.

**Regra de conclusão:** venda parcial reduz o saldo e mantém o anúncio publicado. Somente quando o saldo remanescente for zero o anúncio passa para `vendido_em_exibicao`, permanece visível por cinco dias e depois é arquivado.

### 3.7 INTERESSE

Registra a solicitação inicial da empresa compradora.

| Campo | Tipo | Obrigatório | Finalidade |
|---|---|---:|---|
| `id` | identificador único | sim | Identificar o interesse e a futura negociação. |
| `anuncio_id` | identificador | sim | Anúncio escolhido. |
| `material_id` | identificador | sim | Material relacionado. |
| `empresa_compradora_id` | identificador | sim | Empresa que demonstrou interesse. |
| `empresa_vendedora_id` | identificador | sim | Empresa dona do anúncio, mantida em sigilo. |
| `usuario_id` | identificador | sim | Pessoa da empresa compradora que registrou o interesse. |
| `quantidade_desejada` | número maior que zero | sim | Quantidade solicitada. |
| `prazo_desejado` | lista fechada | sim | Imediato, 7, 15, 30 dias ou flexível. |
| `assunto` | lista fechada | sim | Disponibilidade, questão técnica, comercial, documentação ou outro. |
| `observacao_comprador` | texto | não | Mensagem inicial sem contato direto. |
| `situacao` | lista fechada | sim | Etapa atual do fluxo. |
| `motivo_rejeicao` | texto | não | Motivo informado pelo administrador. |
| `criado_em` | data e hora | sim | Momento do interesse. |
| `revisado_em` | data e hora | não | Última correção pelo comprador. |
| `comprador_leu_em` | data e hora | não | Controle de notificação. |
| `vendedor_leu_em` | data e hora | não | Controle de notificação. |

**Dono:** empresa compradora.  
**Participante protegido:** empresa vendedora.  
**Regras:** empresa exclusivamente vendedora não pode comprar; empresa não pode demonstrar interesse no próprio anúncio; todo bloqueio apresenta o motivo.

### 3.8 RESPOSTA_VENDEDOR

Guarda cada resposta ou correção enviada pelo vendedor.

| Campo | Tipo | Obrigatório | Finalidade |
|---|---|---:|---|
| `id` | identificador único | sim | Identificar a resposta. |
| `interesse_id` | identificador | sim | Negociação relacionada. |
| `empresa_vendedora_id` | identificador | sim | Empresa responsável. |
| `disponibilidade` | disponível, parcial ou indisponível | sim | Situação confirmada. |
| `quantidade_confirmada` | número | sim | Quantidade efetivamente disponível. |
| `prazo_disponibilidade` | lista fechada | sim | Prazo confirmado. |
| `preco_unitario_final_centavos` | número inteiro | sim | Preço final com comissão incluída. |
| `documentacao_disponivel` | verdadeiro ou falso | sim | Confirmação de documentos. |
| `observacao` | texto | não | Resposta sem telefone, e-mail ou link. |
| `versao` | número inteiro | sim | Preservar respostas anteriores. |
| `situacao_revisao` | lista fechada | sim | Em análise, aprovada ou correção solicitada. |
| `motivo_correcao` | texto | não | Orientação administrativa. |
| `respondido_em` | data e hora | sim | Momento do envio. |
| `usuario_id` | identificador | sim | Pessoa que respondeu. |

**Dono:** empresa vendedora.  
**Visibilidade:** administrador; comprador somente depois do encaminhamento administrativo e sem identidade/contato do vendedor.

### 3.9 DECISAO_COMPRADOR

Guarda aceitações, recusas e pedidos de ajuste do comprador.

| Campo | Tipo | Obrigatório | Finalidade |
|---|---|---:|---|
| `id` | identificador único | sim | Identificar a decisão. |
| `interesse_id` | identificador | sim | Negociação relacionada. |
| `empresa_compradora_id` | identificador | sim | Empresa responsável. |
| `tipo` | aceitar, rejeitar ou solicitar_ajuste | sim | Decisão tomada. |
| `itens_para_ajuste` | lista | não | Quantidade, preço, prazo e/ou documentação. |
| `quantidade_proposta` | número | não | Nova quantidade. |
| `preco_proposto_centavos` | número inteiro | não | Novo preço. |
| `prazo_proposto` | lista fechada | não | Novo prazo. |
| `explicacao` | texto | obrigatória no ajuste ou recusa | Justificativa sem contato direto. |
| `versao` | número inteiro | sim | Preservar decisões anteriores. |
| `decidido_em` | data e hora | sim | Momento da decisão. |
| `usuario_id` | identificador | sim | Pessoa responsável. |

**Dono:** empresa compradora.

### 3.10 RESPOSTA_AJUSTE_VENDEDOR

Guarda a resposta do vendedor à proposta de ajuste.

| Campo | Tipo | Obrigatório | Finalidade |
|---|---|---:|---|
| `id` | identificador único | sim | Identificar a resposta. |
| `interesse_id` | identificador | sim | Negociação relacionada. |
| `empresa_vendedora_id` | identificador | sim | Empresa responsável. |
| `tipo` | aceitar, rejeitar ou contrapropor | sim | Resposta escolhida. |
| `quantidade` | número | não | Quantidade da contraproposta. |
| `preco_centavos` | número inteiro | não | Preço da contraproposta. |
| `prazo` | lista fechada | não | Prazo da contraproposta. |
| `documentacao_disponivel` | verdadeiro ou falso | não | Condição documental. |
| `explicacao` | texto | obrigatória na recusa ou contraproposta | Justificativa sem contato direto. |
| `decidido_em` | data e hora | sim | Momento da resposta. |
| `usuario_id` | identificador | sim | Pessoa responsável. |

**Dono:** empresa vendedora.

### 3.11 MENSAGEM_NEGOCIACAO

Forma o histórico didático semelhante a uma conversa, sem permitir contato direto antes da formalização.

| Campo | Tipo | Obrigatório | Finalidade |
|---|---|---:|---|
| `id` | identificador único | sim | Identificar a mensagem ou evento. |
| `interesse_id` | identificador | sim | Negociação relacionada. |
| `autor_tipo` | comprador, vendedor ou administrador | sim | Definir o lado de exibição. |
| `autor_empresa_id` | identificador | não | Empresa autora, quando aplicável. |
| `usuario_id` | identificador | sim | Pessoa responsável pela mensagem ou pelo evento. |
| `tipo` | mensagem, proposta, decisão ou evento | sim | Natureza do registro. |
| `conteudo` | texto | sim | Conteúdo exibido no histórico. |
| `criado_em` | data e hora | sim | Ordem cronológica. |
| `bloqueado_por_contato_direto` | verdadeiro ou falso | sim | Registrar tentativa bloqueada de telefone, e-mail ou link. |

**Dono:** participante que enviou; a negociação determina quem pode ler.  
**Visibilidade:** somente comprador, vendedor e administrador relacionados, respeitando a etapa e a ocultação de identidades.

### 3.12 DOCUMENTO_TERMO

Guarda a versão imutável de cada Termo Geral ou Termo Específico.

| Campo | Tipo | Obrigatório | Finalidade |
|---|---|---:|---|
| `id` | identificador único | sim | Identificar o documento. |
| `usuario_id` | identificador | sim | Administrador responsável pela versão geral ou pela geração do documento específico. |
| `tipo` | lista fechada | sim | Geral do vendedor, específico do vendedor, geral do comprador ou específico do comprador. |
| `interesse_id` | identificador | somente nos termos específicos | Vincular o documento à negociação correspondente. |
| `versao_documento` | texto | sim | Identificar exatamente o conteúdo apresentado. |
| `conteudo_imutavel` | texto | sim | Preservar o texto que foi efetivamente aceito. |
| `caminho_privado` | texto | não | Localização da versão em arquivo, quando também houver um documento gerado. |
| `percentual_comissao` | número decimal | no termo específico do vendedor | Registrar o percentual aplicável à negociação. |
| `valor_comissao_centavos` | número inteiro | no termo específico do vendedor | Registrar a comissão daquela negociação. |
| `resumo_condicoes` | texto estruturado | nos termos específicos | Registrar material, quantidade, preço, prazo, pagamento, retirada e documentação acordados. |
| `gerado_em` | data e hora | sim | Momento em que a versão foi criada. |
| `substituido_em` | data e hora | não | Indicar a publicação de uma versão posterior. |
| `exige_novo_aceite` | verdadeiro ou falso | sim | Distinguir revisão relevante de ajuste apenas editorial. |
| `inicio_vigencia` | data e hora | sim | Momento a partir do qual a versão é aplicável. |
| `prazo_novo_aceite_em` | data e hora | não | Prazo concedido às empresas já cadastradas. |

**Dono:** plataforma, com o `usuario_id` do Administrador responsável.  
**Regra:** um documento aceito não pode ter seu conteúdo alterado. Qualquer mudança gera uma nova versão.

### 3.13 ACEITE_TERMO

Registra quem abriu, leu e aceitou uma versão de Termo.

| Campo | Tipo | Obrigatório | Finalidade |
|---|---|---:|---|
| `id` | identificador único | sim | Identificar o aceite. |
| `documento_termo_id` | identificador | sim | Indicar a versão exata do documento aceito. |
| `empresa_id` | identificador | sim | Empresa que assumiu o compromisso. |
| `usuario_id` | identificador | sim | Pessoa que realizou o aceite em nome da empresa. |
| `interesse_id` | identificador | somente nos termos específicos | Vincular o aceite à negociação correspondente. |
| `papel` | comprador ou vendedor | sim | Definir em qual posição a empresa aceitou o documento. |
| `aberto_em` | data e hora | sim | Momento da abertura. |
| `leitura_finalizada_em` | data e hora | sim | Registrar a chegada ao final do documento. |
| `aceito_em` | data e hora | sim | Momento do aceite. |

**Dono:** empresa indicada por `empresa_id`.  
**Regra do cadastro:** empresa apenas vendedora aceita o Termo Geral do Vendedor; empresa apenas compradora aceita o Termo Geral do Comprador; empresa com perfil duplo aceita os dois. Sem os aceites aplicáveis, o cadastro não pode ser enviado.

**Regra da negociação:** depois do acordo, o vendedor aceita o Termo Específico do Vendedor e o comprador aceita o Termo Específico do Comprador. Cada campo de aceite só é liberado depois da abertura da versão e da chegada ao final do documento.

### 3.14 ORDEM_COMPRA_COMISSAO

Registra a garantia da comissão após o acordo.

| Campo | Tipo | Obrigatório | Finalidade |
|---|---|---:|---|
| `id` | identificador único | sim | Identificar o documento. |
| `interesse_id` | identificador | sim | Negociação relacionada. |
| `empresa_vendedora_id` | identificador | sim | Empresa que enviou. |
| `usuario_id` | identificador | sim | Pessoa responsável pelo envio. |
| `nome_original` | texto | sim | Nome do arquivo. |
| `tipo_arquivo` | PDF, JPG, PNG ou WebP | sim | Formato validado. |
| `tamanho_bytes` | número | sim | Limite de 10 MB. |
| `caminho_privado` | texto | sim | Localização privada do anexo. |
| `quantidade_acordada` | número | sim | Quantidade usada no cálculo. |
| `preco_unitario_centavos` | número inteiro | sim | Preço acordado. |
| `valor_total_centavos` | número inteiro | sim | Quantidade multiplicada pelo preço. |
| `regra_comissao_versao_id` | identificador | sim | Fonte administrativa versionada usada no cálculo. |
| `percentual_comissao` | número decimal | sim | Cópia imutável do percentual aplicado. |
| `valor_comissao_centavos` | número inteiro | sim | Comissão calculada pelo servidor. |
| `liquido_vendedor_centavos` | número inteiro | sim | Total menos comissão. |
| `situacao` | em análise, correção solicitada, aprovada ou rejeitada | sim | Decisão administrativa. |
| `motivo_correcao_ou_rejeicao` | texto | não | Explicação ao vendedor. |
| `enviada_em` | data e hora | sim | Momento do envio. |
| `avaliada_em` | data e hora | não | Momento da decisão. |
| `administrador_id` | identificador | não | Responsável pela decisão. |

**Dono:** empresa vendedora.  
**Visibilidade:** empresa vendedora e administrador.  
**Regra:** o vendedor só pode enviar a Ordem de Compra depois dos dois Termos Específicos serem aceitos. Os contatos só são liberados depois que a Ordem de Compra for aprovada.

### 3.15 NOTIFICACAO

Indica movimentações que ainda não foram vistas.

| Campo | Tipo | Obrigatório | Finalidade |
|---|---|---:|---|
| `id` | identificador único | sim | Identificar a notificação. |
| `empresa_id` | identificador | não | Empresa destinatária; vazio para administrador. |
| `usuario_id` | identificador | sim | Pessoa destinatária ou responsável pelo registro administrativo. |
| `interesse_id` | identificador | não | Negociação relacionada. |
| `tipo` | lista fechada | sim | Motivo da notificação. |
| `titulo` | texto | sim | Resumo curto. |
| `criada_em` | data e hora | sim | Momento da movimentação. |
| `lida_em` | data e hora | não | Controle do indicador visual. |

**Dono:** destinatário indicado.

### 3.16 HISTÓRICO DE SITUAÇÕES

Preserva todas as mudanças importantes para auditoria.

| Campo | Tipo | Obrigatório | Finalidade |
|---|---|---:|---|
| `id` | identificador único | sim | Identificar o evento. |
| `entidade_tipo` | empresa, material, anúncio, interesse ou ordem | sim | O que mudou. |
| `entidade_id` | identificador | sim | Registro alterado. |
| `situacao_anterior` | texto | não | Situação anterior. |
| `situacao_nova` | texto | sim | Nova situação. |
| `motivo` | texto | não | Justificativa quando aplicável. |
| `empresa_id` | identificador | não | Empresa relacionada. |
| `usuario_id` | identificador | sim | Pessoa ou administrador responsável. |
| `criado_em` | data e hora | sim | Momento da mudança. |

**Dono:** empresa relacionada ou plataforma, conforme a entidade.  
**Regra:** histórico não é editado nem apagado pelo usuário comum.

### 3.17 CONTATO_COMERCIAL

Guarda contatos reutilizáveis da empresa, separados do usuário de acesso.

| Campo | Tipo | Obrigatório | Finalidade |
|---|---|---:|---|
| `id` | identificador único | sim | Identificar o contato. |
| `empresa_id` | identificador | sim | Empresa proprietária. |
| `usuario_id` | identificador | sim | Pessoa que criou ou atualizou. |
| `nome` | texto | sim | Nome do contato comercial. |
| `cargo` | texto | sim | Função profissional. |
| `email` | e-mail | sim | E-mail liberável após formalização. |
| `telefone` | texto validado | não | Telefone comercial. |
| `whatsapp` | texto validado | não | Número de WhatsApp, quando aplicável. |
| `preferencia_contato` | lista fechada | sim | Canal preferencial: e-mail, telefone ou WhatsApp. |
| `principal` | verdadeiro ou falso | sim | Identificar contato padrão. |
| `situacao` | ativo, inativo ou aguardando validação | sim | Controlar utilização. |
| `criado_em` | data e hora | sim | Auditoria. |

**Visibilidade:** empresa dona e Administrador antes da comissão; contraparte somente após liberação formal.

### 3.18 LOCAL_ESTOQUE

Guarda endereços reutilizáveis nos cadastros de materiais.

| Campo | Tipo | Obrigatório | Finalidade |
|---|---|---:|---|
| `id` | identificador único | sim | Identificar o local. |
| `empresa_id` | identificador | sim | Empresa proprietária. |
| `usuario_id` | identificador | sim | Pessoa responsável. |
| `nome_local` | texto | sim | Nome interno da unidade ou depósito. |
| `pais` | lista controlada | sim | Informação exibível antes da formalização. |
| `estado` | lista controlada | sim | Informação exibível antes da formalização. |
| `cidade` | texto | sim | Dado protegido. |
| `cep` | texto | sim | Dado protegido. |
| `bairro` | texto | sim | Dado protegido. |
| `logradouro` | texto | sim | Dado protegido. |
| `numero` | texto | sim | Dado protegido. |
| `complemento` | texto | não | Dado protegido. |
| `referencia_retirada` | texto | não | Orientação protegida. |
| `restricoes_acesso` | texto | não | Horário, veículo, segurança ou agendamento. |
| `recursos_carregamento` | texto | não | Empilhadeira, guindaste ou outros recursos. |
| `padrao_novos_materiais` | verdadeiro ou falso | sim | Preencher automaticamente novos cadastros. |
| `situacao` | ativo, inativo ou aguardando validação | sim | Controlar uso. |
| `criado_em` | data e hora | sim | Auditoria. |

**Visibilidade:** antes da comissão, somente país e estado; dados completos somente para a empresa dona, Administrador e partes após a liberação.

### 3.19 RESERVA_ESTOQUE

Vincula quantidade imobilizada a uma negociação específica.

| Campo | Tipo | Obrigatório | Finalidade |
|---|---|---:|---|
| `id` | identificador único | sim | Identificar a reserva. |
| `material_id` | identificador | sim | Material reservado. |
| `interesse_id` | identificador | sim | Negociação responsável. |
| `empresa_id` | identificador | sim | Empresa vendedora dona do estoque. |
| `usuario_id` | identificador | sim | Pessoa ou Administrador responsável pelo evento. |
| `quantidade` | número maior que zero | sim | Quantidade reservada. |
| `situacao` | lista fechada | sim | Ativa, liberada, convertida em venda ou expirada. |
| `criada_em` | data e hora | sim | Início da reserva. |
| `atualizada_em` | data e hora | não | Ajuste da quantidade. |
| `liberada_ou_convertida_em` | data e hora | não | Encerramento. |
| `motivo` | texto | não | Explicar liberação, expiração ou conversão. |

**Regra:** criação ou aumento da reserva e redução do saldo disponível acontecem na mesma operação segura. Interesse inicial não cria reserva.

### 3.20 SOLICITACAO_ALTERACAO_ANUNCIO

Guarda alteração, suspensão ou retirada solicitada pelo vendedor.

| Campo | Tipo | Obrigatório | Finalidade |
|---|---|---:|---|
| `id` | identificador único | sim | Identificar a solicitação. |
| `anuncio_id` | identificador | sim | Anúncio atual. |
| `material_id` | identificador | sim | Material relacionado. |
| `empresa_id` | identificador | sim | Empresa vendedora. |
| `usuario_id` | identificador | sim | Solicitante. |
| `tipo` | alteração, suspensão ou retirada | sim | Ação solicitada. |
| `dados_propostos` | texto estruturado | não | Nova versão dos campos e arquivos. |
| `motivo` | texto | sim | Justificativa do vendedor. |
| `situacao` | aguardando análise, correção solicitada, aprovada, rejeitada ou cancelada | sim | Fluxo administrativo. |
| `administrador_id` | identificador | não | Responsável pela decisão. |
| `decidida_em` | data e hora | não | Momento da decisão. |

**Regra:** aprovação de alteração substitui a versão pública em uma operação de republicação; histórico anterior permanece imutável.

### 3.21 SOLICITACAO_ALTERACAO_PERFIL

| Campo | Tipo | Obrigatório | Finalidade |
|---|---|---:|---|
| `id` | identificador único | sim | Identificar a solicitação. |
| `empresa_id` | identificador | sim | Empresa solicitante. |
| `usuario_id` | identificador | sim | Usuário principal solicitante. |
| `perfil_anterior` | lista fechada | sim | Perfil vigente. |
| `perfil_solicitado` | lista fechada | sim | Perfil pretendido. |
| `motivo` | texto | sim | Justificativa. |
| `situacao` | aguardando análise, correção solicitada, aprovada, rejeitada ou aguardando encerramentos | sim | Controle do fluxo. |
| `administrador_id` | identificador | não | Responsável pela decisão. |
| `decidida_em` | data e hora | não | Momento da decisão. |

### 3.22 TRANSFERENCIA_USUARIO_PRINCIPAL

| Campo | Tipo | Obrigatório | Finalidade |
|---|---|---:|---|
| `id` | identificador único | sim | Identificar a transferência. |
| `empresa_id` | identificador | sim | Empresa afetada. |
| `usuario_id` | identificador | sim | Pessoa responsável pela gravação da transferência. |
| `usuario_principal_anterior_id` | identificador | sim | Responsável anterior. |
| `novo_usuario_principal_id` | identificador | sim | Novo responsável ativo. |
| `solicitante_usuario_id` | identificador | não em exceção administrativa | Pessoa que iniciou. |
| `novo_responsavel_confirmou_em` | data e hora | não em exceção administrativa | Confirmação do novo responsável. |
| `administrador_id` | identificador | sim | Administrador que aprovou ou executou. |
| `excepcional` | verdadeiro ou falso | sim | Indicar ausência do responsável anterior. |
| `motivo` | texto | obrigatório em exceção | Fundamentação. |
| `concluida_em` | data e hora | sim | Momento da troca. |

### 3.23 REGRA_COMISSAO

Configuração administrativa oficial e versionada.

| Campo | Tipo | Obrigatório | Finalidade |
|---|---|---:|---|
| `id` | identificador único | sim | Identificar a regra. |
| `usuario_id` | identificador | sim | Administrador responsável. |
| `tipo` | geral, empresa, categoria, faixa de valor, empresa e categoria ou exceção | sim | Escopo. |
| `empresa_id` | identificador | conforme o tipo | Empresa específica. |
| `interesse_id` | identificador | apenas na exceção | Negociação específica que recebe a exceção. |
| `categoria_material` | lista controlada | conforme o tipo | Categoria específica. |
| `valor_minimo_centavos` | número inteiro | não | Início da faixa. |
| `valor_maximo_centavos` | número inteiro | não | Fim da faixa. |
| `percentual` | número decimal | sim | Percentual aplicável. |
| `prioridade` | número inteiro | sim | Resolver concorrência entre regras. |
| `versao` | número inteiro | sim | Preservar histórico. |
| `inicio_vigencia` | data e hora | sim | Início. |
| `fim_vigencia` | data e hora | não | Encerramento sem apagar. |
| `motivo` | texto | sim | Justificativa administrativa. |

**Prioridade:** exceção da operação; empresa e categoria; empresa; categoria; faixa de valor; regra geral. Somente uma regra é aplicada.

### 3.24 LIBERACAO_CONTATO

Preserva a fotografia dos dados compartilhados depois da garantia da comissão.

| Campo | Tipo | Obrigatório | Finalidade |
|---|---|---:|---|
| `id` | identificador único | sim | Identificar a liberação. |
| `interesse_id` | identificador | sim | Negociação. |
| `empresa_id` | identificador | sim | Empresa relacionada. |
| `usuario_id` | identificador | sim | Administrador responsável. |
| `contato_snapshot` | texto estruturado | sim | Contato vigente no momento. |
| `local_snapshot` | texto estruturado | sim | Endereço e orientações vigentes. |
| `liberado_para_empresa_id` | identificador | sim | Destinatária. |
| `liberado_em` | data e hora | sim | Momento da liberação. |

**Dono:** negociação e empresas participantes.

**Regra:** criado somente depois da aprovação da Ordem de Compra da comissão e preservado mesmo que os cadastros originais mudem.

### 3.25 VERSAO_MATERIAL

Preserva a fotografia dos dados e documentos que o Administrador aprovou e publicou em determinado momento.

| Campo | Tipo | Obrigatório | Finalidade |
|---|---|---:|---|
| `id` | identificador único | sim | Identificar a versão. |
| `material_id` | identificador | sim | Material de origem. |
| `empresa_id` | identificador | sim | Empresa vendedora proprietária. |
| `usuario_id` | identificador | sim | Administrador responsável pela aprovação e publicação. |
| `numero_versao` | número inteiro | sim | Ordenar as versões do material. |
| `dados_publicados` | texto estruturado | sim | Cópia imutável dos campos técnicos, comerciais e do local público. |
| `arquivos_publicados` | texto estruturado | sim | Cópia das referências das fotos e dos documentos aprovados. |
| `solicitacao_alteracao_id` | identificador | não | Solicitação que originou a nova versão. |
| `criada_em` | data e hora | sim | Momento da publicação. |

**Dono:** empresa vendedora indicada por `empresa_id`.

**Regra:** uma nova publicação cria outra versão; nunca substitui nem apaga a versão usada por negociação anterior.

## 4. Estrutura futura da inteligência artificial

A IA prevista no `ESPEC.md` lerá uma planilha `.xlsx` de estoque e sugerirá materiais padronizados. Ela não publicará nem salvará um anúncio sem conferência humana.

### 4.1 IMPORTACAO_PLANILHA

| Campo | Tipo | Obrigatório | Finalidade |
|---|---|---:|---|
| `id` | identificador único | sim | Identificar a importação. |
| `empresa_id` | identificador | sim | Empresa dona da planilha. |
| `usuario_id` | identificador | sim | Pessoa que enviou. |
| `nome_original` | texto | sim | Nome do `.xlsx`. |
| `caminho_privado` | texto | sim | Arquivo guardado no servidor. |
| `situacao` | recebida, processando, aguardando revisão, concluída ou falhou | sim | Etapa da importação. |
| `texto_bruto` | texto | sim | Conteúdo original extraído da planilha antes da interpretação e da padronização pela IA. |
| `confianca_geral` | número de 0 a 100 | não | Grau de confiança informado pela IA. |
| `mensagem_erro` | texto | não | Explicação clara quando falhar. |
| `criada_em` | data e hora | sim | Momento do envio. |
| `concluida_em` | data e hora | não | Final do processamento. |

### 4.2 MATERIAL_SUGERIDO_IA

| Campo | Tipo | Obrigatório | Finalidade |
|---|---|---:|---|
| `id` | identificador único | sim | Identificar a sugestão. |
| `importacao_id` | identificador | sim | Planilha de origem. |
| `empresa_id` | identificador | sim | Empresa dona. |
| `usuario_id` | identificador | sim | Pessoa responsável pelo envio que originou a sugestão. |
| `linha_origem` | número | sim | Linha correspondente na planilha. |
| `dados_sugeridos` | texto estruturado | sim | Campos de material propostos pela IA. |
| `confianca` | número de 0 a 100 | sim | Confiança desta sugestão. |
| `situacao_revisao` | pendente, aceita, corrigida ou descartada | sim | Decisão humana. |
| `revisado_por_usuario_id` | identificador | não | Pessoa que conferiu. |
| `revisado_em` | data e hora | não | Momento da conferência. |

**Dono:** empresa indicada por `empresa_id`.  
**Regra:** somente uma sugestão aceita ou corrigida por uma pessoa pode originar um `MATERIAL`.

## 5. Relacionamentos

- Uma **empresa** possui um ou mais **usuários**.
- Cada empresa possui exatamente um usuário principal ativo e pode possuir vários usuários adicionais.
- Uma empresa possui contatos comerciais e locais de estoque reutilizáveis.
- Uma **empresa** possui documentos cadastrais.
- Uma empresa vendedora possui muitos **materiais**.
- Um material possui até seis fotos e até um certificado.
- A operação administrativa **Aprovar e publicar** aprova o material, cria o anúncio e o publica de forma indivisível.
- Um material pode possuir várias reservas, cada uma vinculada a uma negociação.
- Venda parcial converte somente a reserva daquela negociação e mantém o anúncio quando houver saldo.
- Um anúncio pode receber muitos **interesses**, inclusive de empresas compradoras diferentes.
- Cada interesse liga uma empresa compradora a uma empresa vendedora e passa a representar uma negociação.
- Uma negociação pode ter várias respostas, decisões, mensagens, correções e notificações.
- Cada empresa possui os aceites dos Termos Gerais exigidos por seu perfil comercial.
- Uma empresa com perfil duplo aceita o Termo Geral do Vendedor e o Termo Geral do Comprador.
- Depois do acordo, uma negociação recebe um Termo Específico do Vendedor e um Termo Específico do Comprador.
- O vendedor e o comprador aceitam separadamente o documento específico correspondente ao seu papel.
- Uma negociação possui uma Ordem de Compra vigente e pode preservar versões anteriores quando houver correção.
- Somente depois dos dois aceites específicos o vendedor pode enviar a Ordem de Compra.
- Uma Ordem de Compra aprovada garante a comissão e autoriza a liberação dos contatos.
- A liberação preserva uma cópia do contato e do local compartilhados.
- Um anúncio pode ter solicitações de alteração, suspensão ou retirada sem apagar versões anteriores.
- Um material pode possuir várias versões publicadas, e cada anúncio aponta para a versão que está visível.
- Uma empresa pode solicitar alteração de perfil comercial, condicionada a Termos e operações ativas.
- Cada anúncio referencia uma versão da regra de comissão; a negociação preserva percentual e valores aplicados.
- Uma importação futura de planilha possui vários materiais sugeridos pela IA.

## 6. Regras de visibilidade

| Informação | Visitante | Comprador relacionado | Vendedor relacionado | Administrador |
|---|---:|---:|---:|---:|
| Fotos, descrição, condição e disponibilidade do anúncio | sim | sim | sim | sim |
| País e estado do local do material | sim | sim | sim | sim |
| Cidade, endereço completo e contato antes da garantia | não | não | própria empresa | sim |
| Preço do anúncio | não | sim, se aprovado | sim, se for o dono | sim |
| Identidade e contato do vendedor antes da garantia | não | não | própria empresa | sim |
| Identidade e contato do comprador antes da garantia | não | própria empresa | não | sim |
| Certificado do material na validação | não | não | sim | sim |
| Histórico da negociação | não | somente a sua negociação | somente a sua negociação | sim |
| Termos Gerais aplicáveis ao cadastro | sim, durante o cadastro | conforme o perfil | conforme o perfil | sim |
| Termo Específico do Comprador | não | sim | não | sim |
| Termo Específico do Vendedor | não | não | sim | sim |
| Ordem de Compra da comissão | não | não | sim | sim |
| Contatos após aprovação da Ordem de Compra | não | sim | sim | sim |

## 7. Travas essenciais

- Nenhuma quantidade pode ser zero ou negativa quando houver disponibilidade.
- Quantidade disponível é calculada como quantidade atual menos reservas ativas e vendas concluídas.
- Reserva e verificação de saldo ocorrem juntas; duas negociações não podem consumir a mesma quantidade.
- Redução de estoque não pode ficar abaixo da soma reservada e vendida.
- Valores monetários são guardados como números inteiros em centavos de dólar.
- O preço informado pelo vendedor inclui a comissão da regra versionada aplicável; o servidor calcula comissão e valor líquido.
- Mudança de regra de comissão não altera retroativamente anúncio ou negociação vinculados a versão anterior.
- Nova versão relevante dos Termos Gerais bloqueia novas operações do papel afetado até novo aceite do usuário principal.
- Empresa nunca pode ficar sem usuário principal.
- Dois toques no botão não podem criar dois registros.
- Nenhuma tela pode confirmar sucesso antes de o servidor confirmar a gravação.
- Telefone, e-mail e links são bloqueados nas mensagens antes da liberação formal dos contatos.
- Toda rejeição, suspensão ou solicitação de correção exige motivo visível à parte afetada.
- Arquivos privados não possuem endereço público permanente.
- Senhas nunca são guardadas ou exibidas em texto legível.
- Segredos da plataforma e da futura IA ficam somente no servidor.
- O histórico relevante é preservado mesmo quando uma resposta é corrigida.

## 8. Decisões que ainda precisam ser confirmadas

Estas decisões não foram inventadas neste documento e devem ser tomadas antes do banco definitivo:

1. **Pendência do responsável pelo projeto:** fornecer os dados jurídicos definitivos para as versões finais dos quatro Termos. Esses dados estão sendo providenciados e não impedem a conclusão do planejamento do Dia 3.

## 8.1 Política de conservação já confirmada

- Negociações concluídas, ordens de compra, aceites e mensagens relacionadas serão conservados por cinco anos após o encerramento.
- Interesses e negociações que não resultarem em acordo serão conservados por dois anos após o encerramento.
- Depois do prazo aplicável, os dados pessoais serão excluídos ou tornados anônimos. Informações estatísticas poderão ser mantidas desde que não permitam identificar pessoas ou empresas.
- Uma disputa judicial, investigação, obrigação legal ou solicitação formal de auditoria suspenderá a eliminação somente dos registros relacionados ao caso e pelo período necessário.
- A aplicação definitiva desses prazos será confirmada pela assessoria jurídica antes da entrada em operação do banco de dados.

## 8.2 Decisão de arquitetura já confirmada

Seguiremos o roteiro do Desafio dos 10 Dias:

- Supabase será o banco de dados e o sistema de acesso a partir do Dia 5;
- as funções protegidas do Supabase, chamadas oficialmente de “Edge Functions”, serão utilizadas no servidor a partir do Dia 8;
- Cloudflare Pages continuará publicando a parte visual do site;
- Workers KV e R2 permanecem provisórios e não definem o modelo definitivo;
- o local definitivo dos arquivos privados será registrado no `ARQUITETURA.md` sem contrariar o roteiro.

## 9. Critério de conclusão deste modelo

O modelo estará aprovado quando você confirmar que:

- as entidades representam o funcionamento real da Global Shared Stock;
- cada dado possui empresa proprietária e, quando necessário, pessoa responsável;
- comprador e vendedor permanecem protegidos até a comissão estar garantida;
- as opções e os estados cobrem os caminhos de aprovação, correção, rejeição e conclusão;
- a futura IA possui campos próprios, sem poder salvar ou publicar sem revisão humana.
