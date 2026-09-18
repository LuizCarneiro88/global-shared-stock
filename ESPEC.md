# ESPECIFICAÇÃO — GLOBAL SHARED STOCK

Versão de planejamento: 0.3

Atualizada após a conclusão do Dia 3 do Desafio dos 10 Dias

Este documento define o produto. Os detalhes dos dados, da arquitetura e da navegação estão, respectivamente, em `MODELO.md`, `ARQUITETURA.md` e `MAPA-DE-TELAS.md`.

## 1. O problema

Empresas industriais podem manter materiais parados enquanto outras empresas precisam desses mesmos itens com urgência. A identificação dessas oportunidades costuma depender de contatos dispersos, mensagens particulares e buscas demoradas.

A Global Shared Stock será uma plataforma entre empresas para pesquisar, anunciar e negociar materiais com intermediação administrativa, proteção das identidades e garantia da comissão da plataforma antes da liberação dos contatos.

## 2. Objetivo da plataforma

A plataforma deverá permitir que:

- visitantes pesquisem materiais sem conhecer o preço nem a identidade da empresa vendedora;
- empresas compradoras aprovadas consultem preços e registrem interesses reais;
- empresas vendedoras cadastrem materiais e acompanhem sua validação, publicação e negociação;
- empresas com perfil duplo atuem como compradoras e vendedoras;
- o Administrador valide empresas, usuários, materiais, interesses, propostas, Termos e documentos;
- comprador e vendedor negociem com intermediação e sigilo;
- os contatos sejam liberados somente depois da garantia da comissão.

## 3. Prioridade para celular

O funcionamento no celular é prioridade máxima, especialmente para pesquisa de materiais e registro de interesse.

- toda tela será desenhada e testada primeiro no celular;
- nenhuma ação obrigatória dependerá de uma tela grande;
- o sistema também deverá funcionar adequadamente no computador;
- o envio de documentos poderá ser realizado tanto pelo celular quanto pelo computador.

## 4. Perfis participantes

### 4.1 Visitante

- pesquisa materiais publicados;
- vê fotografias, descrição, condição e disponibilidade;
- não vê o preço nem a identidade da empresa vendedora;
- vê a mensagem “Preço disponível para empresas cadastradas”;
- é convidado a cadastrar uma empresa ou entrar no sistema para utilizar recursos protegidos.

### 4.2 Empresa compradora

- consulta o preço depois da aprovação do cadastro;
- registra interesses em materiais de outras empresas;
- acompanha validações, respostas, propostas e negociações;
- não pode vender materiais enquanto seu perfil não incluir a função vendedora;
- não recebe o contato do vendedor antes da garantia da comissão.

### 4.3 Empresa vendedora

- cadastra, edita e envia materiais para análise;
- acompanha correções, aprovações, publicações e negociações;
- responde aos interesses encaminhados pelo Administrador;
- não pode comprar enquanto seu perfil for exclusivamente vendedor;
- não recebe o contato do comprador antes da garantia da comissão.

### 4.4 Empresa com perfil duplo

- pode comprar e vender;
- aceita os Termos Gerais do Comprador e do Vendedor;
- utiliza as mesmas regras e proteções aplicáveis a cada papel.

### 4.5 Usuário principal da empresa

- é obrigatoriamente o primeiro usuário aprovado da empresa;
- pode aprovar solicitações de outros usuários da mesma empresa;
- não substitui a aprovação do Administrador quando ela for obrigatória.
- pode solicitar a transferência da função para outro usuário ativo;
- a transferência normal exige confirmação do novo responsável e aprovação do Administrador;
- em situação excepcional, o Administrador pode transferir a função sem a participação do responsável anterior, com motivo registrado;
- a empresa nunca pode ficar sem um usuário principal.

### 4.6 Usuário adicional da empresa

- utiliza seu próprio e-mail corporativo e sua própria senha;
- representa somente a empresa à qual foi vinculado;
- recebe apenas as permissões concedidas ao seu papel.

### 4.7 Administrador da Global Shared Stock

- valida empresas, usuários, materiais, interesses e etapas da negociação;
- consulta documentos privados necessários à validação;
- controla o encaminhamento das propostas;
- aprova a Ordem de Compra da comissão;
- libera os contatos quando todas as condições forem cumpridas;
- determina o encerramento da negociação e marca o material como vendido.

## 5. Cadastro da empresa

O cadastro deverá solicitar:

- razão social;
- CNPJ válido e formatado;
- inscrições estadual e municipal, quando aplicáveis;
- perfil comercial: comprador, vendedor ou ambos;
- tamanho aproximado do estoque;
- nome e e-mail do contato principal;
- contatos comerciais que poderão ser liberados depois da garantia da comissão;
- endereço completo e um ou mais locais de estoque;
- opção de salvar um local como padrão para novos materiais;
- e-mails adicionais para notificações, quando informados;
- cartão CNPJ;
- contrato social;
- Termos Gerais exigidos pelo perfil comercial.

Antes do envio, a empresa verá uma etapa de revisão. Campos obrigatórios serão identificados com asterisco e qualquer bloqueio apresentará seu motivo.

## 6. Termos Gerais no cadastro

### 6.1 Termo Geral do Vendedor

Será obrigatório para empresa vendedora e incluirá:

- condições gerais de negociação;
- forma de cálculo da comissão, cuja regra geral inicial é de 10%, podendo existir regra administrativa versionada aplicável à operação;
- responsabilidade pela procedência, condição, quantidade e documentação do material;
- compromisso com a veracidade do anúncio;
- responsabilidade pelo cumprimento da venda.

### 6.2 Termo Geral do Comprador

Será obrigatório para empresa compradora e incluirá:

- condições gerais de negociação;
- compromisso de pagamento;
- responsabilidade pela retirada do material;
- cumprimento dos prazos acordados;
- veracidade das manifestações de interesse.

### 6.3 Regras dos aceites gerais

- empresa exclusivamente vendedora aceita o Termo Geral do Vendedor;
- empresa exclusivamente compradora aceita o Termo Geral do Comprador;
- empresa com perfil duplo aceita os dois;
- cada documento precisa ser aberto e percorrido até o final antes da liberação do aceite;
- o cadastro não pode ser enviado enquanto faltar um aceite obrigatório;
- o sistema registra versão, empresa, usuário, data e hora.
- nova versão relevante dos Termos Gerais exige novo aceite das empresas já cadastradas;
- somente o usuário principal ou representante autorizado realiza o novo aceite em nome da empresa;
- enquanto o aceite estiver pendente, o histórico continua acessível, mas novas operações do papel afetado ficam bloqueadas com explicação;
- alteração apenas editorial pode preservar o aceite anterior quando o Administrador assim classificar;
- Termos Específicos já aceitos permanecem imutáveis.

O conteúdo jurídico definitivo dos Termos permanece pendente de fornecimento pelo responsável pelo projeto.

## 7. Usuários, confirmação do e-mail e aprovações

Uma empresa poderá possuir vários usuários, cada um com seu e-mail corporativo e sua senha.

### 7.1 Primeiro usuário

- torna-se obrigatoriamente o usuário principal;
- confirma o próprio e-mail pelo link recebido;
- depende da aprovação do Administrador;
- depois da aprovação, passa a ser o usuário principal da empresa.

### 7.2 Usuários seguintes

Cada novo usuário depende de:

1. confirmação do e-mail pelo link recebido;
2. aprovação do usuário principal da empresa;
3. aprovação do Administrador.

Enquanto uma confirmação estiver pendente, o acesso permanece bloqueado e a tela informa o que falta.

### 7.3 Recuperação de senha

- a pessoa solicita a recuperação pelo e-mail cadastrado;
- recebe um link individual e temporário;
- o link funciona somente uma vez;
- nenhuma senha legível é guardada ou exibida.

### 7.4 Transferência do usuário principal

- a transferência normal é iniciada pelo usuário principal atual;
- o novo responsável precisa ser usuário ativo da mesma empresa e confirmar a responsabilidade;
- o Administrador aprova a transferência;
- o responsável anterior passa a ser usuário adicional;
- em caso de desligamento, perda de acesso ou ausência do responsável anterior, o Administrador pode realizar transferência excepcional, informando o motivo;
- toda transferência fica registrada no histórico.

## 8. Cadastro de materiais

O cadastro do material deverá permitir:

- descrição obrigatória;
- Part number opcional;
- fabricante opcional;
- classificação controlada;
- condição: novo, usado, recondicionado ou sucata;
- quantidade maior que zero;
- local de estoque previamente salvo ou novo local cadastrado;
- unidade de medida, incluindo metro quadrado e metro cúbico;
- preço final em dólar com a comissão incluída;
- apresentação do valor líquido estimado para o vendedor;
- descrição complementar;
- até seis fotografias;
- certificado opcional em PDF ou imagem.

O material manterá quantidades separadas de estoque atual, reservado, vendido e disponível. A disponibilidade será calculada pelo sistema e nunca poderá ficar negativa.

Valores serão apresentados no padrão americano: vírgula para separar milhares e ponto para separar centavos.

### 8.1 Lista provisória

- materiais ainda não enviados permanecem salvos para evitar perda ao atualizar a página;
- cada item da lista pode ser editado;
- pressionar Enter não adiciona um material;
- somente o botão **Adicionar à lista** realiza a inclusão;
- o envio para análise ocorre somente depois da revisão.

## 9. Validação e publicação dos materiais

O Administrador poderá:

- abrir os dados do material;
- conferir fotografias e certificado;
- solicitar correção com motivo;
- rejeitar com motivo;
- aprovar e publicar em uma única ação.

Ao selecionar **Aprovar e publicar**, o sistema registra a aprovação, cria o anúncio e o torna visível. Se qualquer parte falhar, nenhuma confirmação falsa será apresentada. Não haverá estado intermediário de material aprovado aguardando uma segunda ação de publicação.

O vendedor verá a situação e as orientações aplicáveis. Nenhuma rejeição ou solicitação de correção será apresentada sem explicação.

## 10. Pesquisa pública de materiais

A pesquisa deverá priorizar o celular e permitir busca por:

- descrição;
- Part number;
- fabricante, quando informado;
- classificação;
- condição;
- disponibilidade.

O visitante verá fotografias, descrição, condição, disponibilidade, país e estado. No lugar do preço será apresentada a mensagem “Preço disponível para empresas cadastradas”. Cidade, endereço, unidade, contatos e qualquer referência que identifique o vendedor permanecerão ocultos.

A identidade da empresa vendedora permanecerá oculta.

## 11. Registro de interesse

Uma empresa compradora aprovada poderá informar:

- quantidade desejada;
- prazo;
- assunto;
- observação sem contato direto.

O sistema bloqueará e explicará, pelo menos, estas situações:

- empresa exclusivamente vendedora tentando comprar;
- empresa tentando demonstrar interesse no próprio anúncio;
- usuário ou empresa ainda não aprovados;
- tentativa de incluir telefone, e-mail ou endereço eletrônico;
- quantidade inválida;
- anúncio indisponível.

## 12. Validação do interesse

O Administrador poderá:

- aprovar e encaminhar o interesse ao vendedor;
- rejeitar com motivo;
- solicitar correção com motivo.

Depois de uma rejeição ou correção solicitada, a empresa compradora poderá editar o conteúdo e reenviá-lo para nova avaliação.

## 13. Negociação intermediada

Cada negociação ficará vinculada a um produto e terá histórico próprio.

O interesse inicial não reserva estoque. Depois que o vendedor confirmar a quantidade e a resposta for validada administrativamente, o sistema cria uma reserva vinculada à negociação. Ajustes alteram a reserva somente quando houver saldo. Rejeição, encerramento ou expiração liberam a reserva; venda concluída converte a reserva em quantidade vendida.

### 13.1 Resposta do vendedor

O vendedor informará:

- disponibilidade;
- quantidade confirmada;
- prazo;
- preço final com comissão incluída;
- documentação disponível;
- observação sem contato direto.

Os dados originais do material aparecerão de forma esmaecida para ajudar o vendedor a conferir sua resposta.

### 13.2 Decisão do comprador

O comprador poderá:

- aceitar;
- rejeitar;
- solicitar ajuste de quantidade, preço, prazo ou documentação.

### 13.3 Resposta ao ajuste

O vendedor poderá:

- aceitar;
- rejeitar;
- apresentar contraproposta.

As respostas passarão pela validação do Administrador antes do encaminhamento. Correções e versões anteriores permanecerão no histórico.

## 14. Histórico semelhante a uma conversa

As mensagens serão apresentadas em lados diferentes:

- para o Administrador: vendedor à esquerda e comprador à direita;
- para o vendedor: comprador à esquerda e vendedor à direita;
- para o comprador: vendedor à esquerda e comprador à direita.

Ao final serão repetidas as condições vigentes da negociação, incluindo quantidade, disponibilidade, prazo, preço e documentação.

Na lista de negociações, cada produto aparecerá em um cartão resumido. Novas movimentações terão cor de destaque e quantidade de registros não vistos.

## 15. Termos Específicos depois do acordo

Quando houver acordo, serão gerados dois documentos imutáveis.

### 15.1 Termo Específico do Vendedor

Incluirá:

- material;
- quantidade e preço acordados;
- prazo e disponibilidade;
- documentação;
- comissão em percentual e valor;
- valor líquido do vendedor;
- responsabilidade sobre o material e aquela venda.

### 15.2 Termo Específico do Comprador

Incluirá:

- material;
- quantidade e preço acordados;
- forma e prazo de pagamento;
- prazo e responsabilidade pela retirada;
- documentação;
- demais condições daquela compra.

### 15.3 Regras dos aceites específicos

- vendedor e comprador abrem seus respectivos documentos;
- cada um percorre o documento até o final;
- cada empresa aceita o Termo correspondente ao seu papel;
- o sistema registra versão, empresa, usuário, data e hora;
- qualquer mudança nas condições gera novas versões para ambos;
- versões anteriores permanecem preservadas;
- os dois novos Termos precisam ser aceitos novamente.

## 16. Comissão, Ordem de Compra e contatos

- a comissão geral inicial da plataforma será de 10%, administrada por regra versionada;
- o Administrador poderá definir regras por empresa, categoria, faixa de valor, combinação ou exceção específica;
- somente uma regra será aplicada, conforme a prioridade definida;
- mudanças não atingirão retroativamente anúncios ou negociações já vinculados a uma versão anterior;
- o preço final informado pelo vendedor já incluirá a comissão;
- o sistema mostrará comissão e valor líquido do vendedor;
- somente depois que os dois Termos Específicos forem aceitos o vendedor poderá anexar a Ordem de Compra da comissão;
- a Ordem de Compra poderá ser enviada em PDF ou imagem;
- o Administrador poderá aprovar, rejeitar ou solicitar correção com motivo;
- os contatos serão liberados somente depois da aprovação da Ordem de Compra.
- após a liberação, as partes verão os contatos comerciais selecionados e o endereço completo do local relacionado;
- o sistema guardará uma cópia dos contatos e do local efetivamente liberados naquela negociação.

## 17. Encerramento da negociação

O Administrador determinará se a negociação foi concluída com venda ou encerrada sem venda. O encerramento não dependerá de uma confirmação final do comprador ou do vendedor.

Quando uma venda for concluída, a reserva será convertida em quantidade vendida. Se ainda houver saldo, o anúncio continuará publicado com a quantidade remanescente. Somente quando não houver saldo remanescente:

- o anúncio receberá a indicação “Vendido”;
- permanecerá na vitrine por cinco dias para demonstrar movimento da plataforma;
- depois será retirado da vitrine.

Indicadores como disponível, em negociação parcial, totalmente em negociação, vendido parcialmente e esgotado serão calculados pelas quantidades; não serão uma situação única preenchida manualmente no material.

### 17.1 Alteração, suspensão e retirada de anúncio

- o vendedor não altera diretamente uma versão publicada;
- solicita alteração, suspensão temporária ou retirada, informando o motivo;
- a versão pública permanece preservada enquanto a proposta de alteração é analisada;
- o Administrador compara versões e pode aprovar e republicar, solicitar correção ou rejeitar com motivo;
- quantidade não pode ser reduzida abaixo do total já reservado e vendido;
- preço alterado não muda silenciosamente negociações iniciadas;
- havendo reserva ou negociação ativa, a retirada definitiva depende do encerramento administrativo dessas operações;
- o anúncio pode ser suspenso para impedir novos interesses durante a análise;
- documentos e versões anteriores não são apagados.

### 17.2 Contatos comerciais e locais de estoque

- a empresa mantém um catálogo reutilizável de contatos comerciais e locais de estoque;
- cada material aponta para um local salvo e pode indicar o contato responsável;
- a empresa pode definir um local padrão para novos materiais;
- antes da garantia da comissão, somente país e estado são exibidos fora da administração;
- cidade, endereço completo, contato, telefone, WhatsApp, e-mail e orientações de retirada ficam protegidos;
- depois da aprovação da Ordem de Compra, os dados selecionados são liberados às partes e preservados como cópia histórica da negociação;
- alterações de contatos ou locais destinados ao compartilhamento passam por validação administrativa.

### 17.3 Alteração do perfil comercial

- somente o usuário principal solicita mudança entre compradora, vendedora ou perfil duplo;
- o perfil atual permanece vigente enquanto a solicitação é analisada;
- a inclusão de um papel exige o Termo Geral vigente daquele papel e os dados adicionais aplicáveis;
- o Administrador aprova, solicita correção ou rejeita com motivo;
- a remoção de um papel não apaga histórico e não entra em vigor enquanto houver operações ativas relacionadas;
- a plataforma pode impedir novas operações do papel cuja remoção esteja em processamento;
- suspensão administrativa por segurança é diferente da alteração voluntária.

### 17.4 Fonte de verdade das situações

- a situação de validação do material controla rascunho, análise, correção, rejeição e aprovação;
- as quantidades controlam disponibilidade, reserva, venda parcial e esgotamento;
- a situação do anúncio controla apenas publicação, suspensão, retirada, exibição como vendido e arquivamento;
- indicadores comerciais são calculados, evitando dois campos com o mesmo significado;
- anúncio continua publicado durante vendas parciais e somente muda para **Vendido** quando o saldo remanescente após a conclusão for zero.

## 18. Organização das áreas protegidas

### 18.1 Área da empresa

Será dividida em:

- Materiais;
- Interesses;
- Negociações;
- Concluídos.

A área de dados da empresa reunirá contatos comerciais, locais de estoque, usuários, transferência do usuário principal, Termos Gerais pendentes e solicitações de alteração do perfil comercial.

### 18.2 Painel administrativo

Será dividido em:

- Validação de empresas;
- Validação de materiais;
- Interesses e negociações;
- Usuários e acessos;
- Alterações solicitadas;
- Comissões e Termos;
- Concluídos.

Cada registro será mostrado primeiro de forma resumida e abrirá os detalhes somente quando selecionado.

## 19. Identificação da sessão

As áreas protegidas mostrarão no canto superior direito:

- **Administrador**, para a sessão administrativa;
- nome da empresa, para uma sessão empresarial.

O acesso administrativo permanecerá separado e discreto na página inicial.

## 20. Segurança e propriedade

- cada dado nasce com empresa proprietária e usuário responsável;
- cada empresa acessa somente os registros permitidos;
- o Administrador possui acesso compatível com suas responsabilidades;
- arquivos cadastrais, certificados, Termos e ordens de compra permanecem privados;
- segredos ficam somente no servidor;
- falha na confirmação de permissão mantém o acesso bloqueado;
- a tela nunca confirma sucesso antes da gravação efetiva;
- tentativas de contato direto são bloqueadas antes da liberação;
- ações importantes permanecem registradas no histórico.

## 21. Conservação dos dados

- negociações concluídas, ordens de compra, Termos, aceites e mensagens relacionadas serão conservados por cinco anos após o encerramento;
- interesses e negociações sem acordo serão conservados por dois anos após o encerramento;
- depois do prazo, dados pessoais serão excluídos ou tornados anônimos;
- disputa judicial, investigação, obrigação legal ou auditoria suspenderá a eliminação somente dos registros relacionados;
- os prazos serão confirmados pela assessoria jurídica antes da entrada definitiva em operação.

## 22. Inteligência artificial futura

A inteligência artificial receberá uma planilha de estoque em formato `.xlsx`, extrairá seu conteúdo e sugerirá materiais padronizados.

- o texto original extraído será preservado em `texto_bruto`;
- cada sugestão terá um grau de `confianca`;
- a empresa deverá conferir, corrigir, aceitar ou descartar cada sugestão;
- a IA não poderá salvar material, publicar anúncio, aprovar empresa, liberar contato ou concluir negociação sozinha;
- a chave da IA ficará somente em uma função protegida do servidor;
- nenhuma chave secreta será enviada ao navegador.

## 23. Fora do escopo imediato

Continuam fora do escopo imediato:

- pagamento processado pela plataforma;
- integração automática com bancos;
- integração com transportadoras;
- confirmação automática de pagamento, retirada ou entrega;
- emissão de nota fiscal;
- financiamento, seguro ou garantia financeira fornecida pela plataforma;
- publicação automática por inteligência artificial;
- importação por IA sem conferência humana;
- leitura de arquivos diferentes de `.xlsx` pela futura IA;
- divulgação pública das identidades ou contatos das empresas;
- alteração automática do percentual de comissão;
- aplicativo instalado pela loja de aplicativos;
- migração automática e sem conferência dos dados provisórios do Cloudflare.

## 24. Casos de borda e validações

- material sem descrição obrigatória: não salvar e destacar o campo;
- quantidade zero ou negativa: não salvar e explicar o valor aceito;
- lista sem material: não enviar para análise;
- dois toques rápidos: aceitar somente a primeira solicitação;
- formato ou tamanho de arquivo inválido: bloquear e informar a regra;
- tentativa de abrir documento sem permissão: negar o acesso;
- tentativa de atuar com perfil incompatível: bloquear e explicar;
- interesse rejeitado: permitir correção e reenvio quando autorizado;
- mudança depois dos Termos Específicos: gerar novas versões e exigir novos aceites;
- falta de qualquer aceite obrigatório: impedir o avanço e informar o que falta;
- falha do banco ou servidor: não apresentar confirmação falsa de sucesso.

## 25. Arquitetura confirmada

- Cloudflare Pages publica as telas;
- Supabase será responsável por acesso, banco e arquivos privados;
- funções protegidas do Supabase guardarão segredos e executarão operações elevadas;
- toda alteração futura do banco será registrada em `supabase/migrations` e guardada no Git;
- Workers KV e R2 permanecem provisórios até uma migração planejada e conferida.

## 26. Pendências conhecidas

- conteúdo jurídico definitivo dos quatro Termos;
- confirmação jurídica final da política de conservação;
- criação e configuração do projeto Supabase na etapa correspondente;
- planejamento e execução segura da migração dos dados provisórios de KV e R2.

## 27. Critério de sucesso

A primeira operação completa estará validada quando:

1. uma empresa vendedora aprovada publicar um material;
2. uma empresa compradora aprovada registrar um interesse;
3. o Administrador intermediar propostas e aprovações;
4. comprador e vendedor chegarem a um acordo;
5. cada empresa aceitar seu Termo Específico;
6. o vendedor anexar a Ordem de Compra da comissão;
7. o Administrador aprovar a garantia da comissão;
8. os contatos forem liberados;
9. o Administrador registrar o resultado da negociação;
10. todo o histórico permanecer protegido e consultável pelos participantes autorizados.
