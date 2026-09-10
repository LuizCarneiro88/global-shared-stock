# ESPECIFICAÇÃO — GLOBAL SHARED STOCK

Versão de planejamento: 0.2

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

- é o primeiro responsável autorizado da empresa;
- pode aprovar solicitações de outros usuários da mesma empresa;
- não substitui a aprovação do Administrador quando ela for obrigatória.

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
- e-mails adicionais para notificações, quando informados;
- cartão CNPJ;
- contrato social;
- Termos Gerais exigidos pelo perfil comercial.

Antes do envio, a empresa verá uma etapa de revisão. Campos obrigatórios serão identificados com asterisco e qualquer bloqueio apresentará seu motivo.

## 6. Termos Gerais no cadastro

### 6.1 Termo Geral do Vendedor

Será obrigatório para empresa vendedora e incluirá:

- condições gerais de negociação;
- comissão de 10%;
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

O conteúdo jurídico definitivo dos Termos permanece pendente de fornecimento pelo responsável pelo projeto.

## 7. Usuários, confirmação do e-mail e aprovações

Uma empresa poderá possuir vários usuários, cada um com seu e-mail corporativo e sua senha.

### 7.1 Primeiro usuário

- pode solicitar a função de usuário principal;
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

## 8. Cadastro de materiais

O cadastro do material deverá permitir:

- descrição obrigatória;
- Part number opcional;
- fabricante opcional;
- classificação controlada;
- condição: novo, usado, recondicionado ou sucata;
- quantidade maior que zero;
- unidade de medida, incluindo metro quadrado e metro cúbico;
- preço final em dólar com a comissão incluída;
- apresentação do valor líquido estimado para o vendedor;
- descrição complementar;
- até seis fotografias;
- certificado opcional em PDF ou imagem.

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
- aprovar;
- publicar o anúncio.

O vendedor verá a situação e as orientações aplicáveis. Nenhuma rejeição ou solicitação de correção será apresentada sem explicação.

## 10. Pesquisa pública de materiais

A pesquisa deverá priorizar o celular e permitir busca por:

- descrição;
- Part number;
- fabricante, quando informado;
- classificação;
- condição;
- disponibilidade.

O visitante verá fotografias, descrição, condição e disponibilidade. No lugar do preço será apresentada a mensagem “Preço disponível para empresas cadastradas”.

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

- a comissão inicial da plataforma será de 10%;
- o preço final informado pelo vendedor já incluirá a comissão;
- o sistema mostrará comissão e valor líquido do vendedor;
- somente depois que os dois Termos Específicos forem aceitos o vendedor poderá anexar a Ordem de Compra da comissão;
- a Ordem de Compra poderá ser enviada em PDF ou imagem;
- o Administrador poderá aprovar, rejeitar ou solicitar correção com motivo;
- os contatos serão liberados somente depois da aprovação da Ordem de Compra.

## 17. Encerramento da negociação

O Administrador determinará se a negociação foi concluída com venda ou encerrada sem venda. O encerramento não dependerá de uma confirmação final do comprador ou do vendedor.

Quando o material for marcado como vendido:

- o anúncio receberá a indicação “Vendido”;
- permanecerá na vitrine por cinco dias para demonstrar movimento da plataforma;
- depois será retirado da vitrine.

## 18. Organização das áreas protegidas

### 18.1 Área da empresa

Será dividida em:

- Materiais;
- Interesses;
- Negociações;
- Concluídos.

### 18.2 Painel administrativo

Será dividido em:

- Validação de empresas;
- Validação de materiais;
- Interesses e negociações;
- Usuários e acessos;
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
