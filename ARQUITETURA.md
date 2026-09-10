# ARQUITETURA — GLOBAL SHARED STOCK

Versão de planejamento: 0.1  
Etapa: Dia 3 do Desafio dos 10 Dias  
Este documento define onde cada parte do sistema funcionará. Ele não cria banco, integração, chave, pasta técnica nem altera o site.

## 1. Objetivo

A arquitetura precisa garantir quatro resultados:

- funcionamento prioritário no celular, sem prejudicar o uso no computador;
- separação segura dos dados de cada empresa;
- proteção de documentos, mensagens, contatos e segredos;
- histórico de todas as futuras alterações do banco de dados.

O sistema será dividido em três partes principais: as telas publicadas no Cloudflare Pages, o acesso e os dados mantidos no Supabase e as funções protegidas executadas no servidor.

## 2. Visão geral

```text
CELULAR OU COMPUTADOR
        │
        ▼
CLOUDFLARE PAGES
Telas públicas e protegidas, construídas primeiro para celular
        │
        ├─────────────────────────────┐
        ▼                             ▼
SUPABASE                         FUNÇÃO PROTEGIDA
Acesso, banco e                Operações que exigem segredo
arquivos privados              e verificações adicionais
        │                             │
        │                             └── futura chave da IA
        │                                 guardada no servidor
        ▼
Regras que limitam cada empresa aos dados permitidos
```

O navegador nunca decide sozinho se uma pessoa pode acessar um dado. Ele solicita a informação, mas o Supabase ou a função protegida verifica a identidade, a empresa, o papel do usuário e a etapa do processo antes de responder.

## 3. Parte 1 — telas no Cloudflare Pages

O Cloudflare Pages continuará publicando a parte visual do site. Essa parte é chamada de **frente estática**, isto é, os arquivos responsáveis pelo conteúdo e pela aparência são entregues ao navegador e não guardam os segredos do sistema.

### Responsabilidades

- apresentar a página institucional, a pesquisa de materiais e os formulários;
- mostrar as áreas da empresa e do Administrador;
- adaptar botões, tabelas, formulários e documentos ao tamanho da tela;
- enviar solicitações ao Supabase e às funções protegidas;
- apresentar mensagens claras de sucesso, pendência ou bloqueio;
- nunca incluir senha administrativa, chave da IA ou chave secreta no conteúdo enviado ao navegador.

### Regra para celular

Toda tela será desenhada e testada primeiro em uma largura de celular. O computador poderá aproveitar mais espaço, mas nenhuma ação obrigatória dependerá de uma tela grande, do posicionamento do ponteiro do mouse ou de recurso indisponível no telefone.

### Limite de confiança

Ocultar um botão não protege uma operação. Uma pessoa pode tentar enviar uma solicitação diretamente, mesmo sem enxergar o botão. Por isso, toda permissão importante será verificada novamente no banco ou na função protegida.

## 4. Parte 2 — acesso, banco e arquivos no Supabase

O Supabase será responsável por três grupos de recursos.

### 4.1 Controle de acesso

O recurso de autenticação do Supabase confirmará a identidade por e-mail e senha. **Autenticação** significa comprovar quem está entrando no sistema.

Depois dessa confirmação, o sistema verificará a **autorização**, que significa decidir o que aquela pessoa pode fazer. Essa decisão considerará:

- o usuário identificado;
- a empresa à qual ele pertence;
- seu papel como usuário principal, usuário comum ou Administrador;
- a situação da empresa e do próprio usuário;
- as aprovações exigidas para aquele acesso.

O primeiro usuário de uma empresa poderá solicitar a função de usuário principal. Seu acesso dependerá da confirmação do e-mail e da aprovação do Administrador. Os usuários seguintes dependerão da confirmação do e-mail, da aprovação do usuário principal e da aprovação do Administrador.

Antes de enviar o cadastro, a empresa aceitará os Termos Gerais correspondentes ao seu perfil comercial. A empresa vendedora aceitará o Termo Geral do Vendedor, a compradora aceitará o Termo Geral do Comprador e a empresa com perfil duplo aceitará os dois.

### 4.2 Banco de dados

O banco guardará as informações descritas no `MODELO.md`, incluindo empresas, usuários, materiais, anúncios, interesses, negociações, mensagens, aceites, ordens de compra, notificações e históricos.

Cada registro nascerá com:

- a empresa proprietária ou participante, quando aplicável;
- o `usuario_id` da pessoa responsável;
- datas que permitam reconstruir os acontecimentos importantes.

O banco utilizará **proteção por linha**, conhecida no Supabase pela sigla RLS. Isso significa que a permissão é conferida registro por registro. Uma empresa não recebe todos os dados para depois escondê-los na tela; o próprio banco deixa sair somente aquilo que ela está autorizada a consultar.

### 4.3 Arquivos privados

O armazenamento privado do Supabase guardará:

- cartão CNPJ e contrato social;
- fotografias e certificados dos materiais;
- planilhas de estoque enviadas futuramente;
- as versões dos Termos Gerais e dos Termos Específicos;
- os registros e comprovantes dos respectivos aceites;
- ordens de compra da comissão.

Os recipientes de arquivos serão privados. Um recipiente, chamado tecnicamente de **bucket**, é apenas uma divisão organizada do armazenamento. Ser privado significa que conhecer o nome ou o caminho de um arquivo não será suficiente para abri-lo.

Antes de liberar um arquivo, o sistema verificará a pessoa, a empresa e a finalidade do acesso. Quando for necessário gerar um endereço temporário, ele terá duração curta e deixará de funcionar depois do prazo.

## 5. Parte 3 — funções protegidas no servidor

As funções protegidas do Supabase, chamadas oficialmente de **Edge Functions**, executarão tarefas que não podem depender apenas do navegador.

Elas serão usadas quando uma operação precisar de:

- chave secreta;
- permissão administrativa elevada;
- cálculo ou validação que não possa ser adulterado no navegador;
- comunicação futura com o serviço de inteligência artificial;
- registro seguro de uma decisão importante;
- geração de versões imutáveis dos Termos Específicos de cada negociação;
- verificação adicional antes de liberar contatos ou arquivos.

A função recebe a solicitação, confirma a identidade e a permissão, executa somente a tarefa autorizada e devolve uma resposta limitada. Se não conseguir confirmar a permissão, ela bloqueia a operação e informa o motivo permitido, sem revelar informações sigilosas.

## 6. Onde cada chave e segredo vive

| Informação | Onde ficará | Pode chegar ao navegador? | Motivo |
|---|---|---:|---|
| Chave publicável do Supabase | Configuração pública das telas | sim | Identifica o projeto, mas continua sujeita às permissões do banco e à identidade do usuário. |
| Antiga `anon key` do Supabase | Somente enquanto necessária para compatibilidade | sim | É o nome antigo da chave destinada ao navegador; não concede acesso administrativo por si só. |
| Chave secreta do Supabase | Configuração protegida das funções do servidor | não | Pode realizar operações elevadas e ultrapassar a proteção comum por linha. |
| Antiga `service_role` | Configuração protegida das funções, se ainda for necessária | não | Possui acesso elevado e nunca deve aparecer no navegador ou no histórico do Git. |
| Chave da futura IA | Segredo da função protegida | não | Permite usar um serviço pago em nome da plataforma e precisa ficar fora do alcance dos usuários. |
| Senhas dos usuários | Sistema de autenticação do Supabase | não | A aplicação não guarda nem exibe a senha legível. |
| Endereços temporários de arquivos | Gerados somente quando autorizados | apenas para o destinatário autorizado | Expiram e não transformam o arquivo privado em arquivo público permanente. |

### Por que uma chave pode ser pública e outra não?

A chave publicável, anteriormente chamada de `anon key`, identifica a aplicação e trabalha junto das regras de acesso do banco. Ela não deve conceder, sozinha, acesso administrativo aos dados.

A chave secreta pode executar ações elevadas e até ultrapassar proteções comuns. Se fosse enviada ao navegador, qualquer pessoa poderia copiá-la e tentar controlar os dados da plataforma.

## 7. Proteção dos dados por perfil

### Visitante

- acessa somente as informações públicas;
- não recebe preço reservado, identidade das empresas, documentos privados ou histórico de negociação;
- é convidado a cadastrar sua empresa quando tenta acessar recurso protegido.

### Empresa compradora

- acessa os próprios usuários, interesses e negociações;
- consulta os anúncios e preços conforme a aprovação de seu cadastro;
- aceita o Termo Geral do Comprador no cadastro e o Termo Específico do Comprador em cada venda;
- não recebe a identidade nem o contato do vendedor antes da garantia da comissão;
- não consegue agir como compradora se seu perfil for exclusivamente vendedor.

### Empresa vendedora

- acessa os próprios usuários, materiais, arquivos, propostas e negociações;
- aceita o Termo Geral do Vendedor no cadastro e o Termo Específico do Vendedor em cada venda;
- não recebe a identidade nem o contato do comprador antes da garantia da comissão;
- envia a Ordem de Compra da comissão somente depois dos dois aceites específicos.

### Administrador

- acessa os registros necessários para validação e intermediação;
- aprova empresas, usuários, materiais, interesses e documentos conforme a etapa;
- consulta as versões e os aceites dos quatro tipos de Termos;
- libera os contatos somente depois da garantia da comissão;
- determina o encerramento da negociação e marca o material como vendido;
- tem suas ações registradas no histórico.

O papel de Administrador não será decidido por um valor enviado pelo navegador. A permissão será confirmada em ambiente protegido.

## 8. Caminhos principais das informações

### 8.1 Entrada no sistema

```text
Pessoa informa e-mail e senha
        │
        ▼
Supabase confirma a identidade
        │
        ▼
Banco verifica empresa, papel, situação e aprovações
        │
        ├── permitido: abre a área correta
        └── bloqueado: informa claramente o motivo
```

### 8.2 Consulta ou alteração de dados

```text
Tela envia a solicitação com a identidade confirmada
        │
        ▼
Banco aplica a proteção por linha
        │
        ├── permitido: consulta ou grava somente os dados autorizados
        └── negado: nenhum dado protegido é devolvido
```

### 8.3 Envio e abertura de arquivo

```text
Usuário seleciona o arquivo
        │
        ▼
Sistema confere tipo, tamanho, empresa e permissão
        │
        ▼
Arquivo entra no armazenamento privado
        │
        ▼
Banco registra proprietário, responsável e caminho privado
```

Na abertura, as mesmas permissões serão verificadas novamente. A autorização para enviar não significa autorização permanente para qualquer pessoa abrir.

### 8.4 Termos Gerais e Termos Específicos

```text
CADASTRO DA EMPRESA
        │
        ▼
Perfil comercial define quais Termos Gerais devem ser aceitos
        │
        ├── vendedor: Termo Geral do Vendedor
        ├── comprador: Termo Geral do Comprador
        └── perfil duplo: os dois documentos
        │
        ▼
Sistema registra versão, usuário, leitura e aceite
        │
        ▼
Cadastro pode ser enviado
```

Depois de um acordo, a função protegida gerará duas versões imutáveis usando as condições confirmadas da negociação: o Termo Específico do Vendedor e o Termo Específico do Comprador. **Imutável** significa que aquela versão não poderá ser alterada depois de gerada.

O vendedor abrirá e aceitará seu documento; o comprador fará o mesmo com o documento correspondente. Somente depois dos dois aceites o vendedor poderá enviar a Ordem de Compra da comissão.

Se uma condição comercial mudar depois da geração, os documentos anteriores serão preservados, novas versões serão geradas e os dois aceites deverão ser realizados novamente. O Administrador poderá consultar ambos os documentos e seus históricos.

### 8.5 Futura leitura de planilha pela IA

```text
Empresa envia a planilha de estoque
        │
        ▼
Arquivo fica no armazenamento privado
        │
        ▼
Função protegida confirma usuário e empresa
        │
        ▼
Função usa a chave secreta para solicitar a leitura à IA
        │
        ▼
IA devolve sugestões e grau de confiança
        │
        ▼
Pessoa confere, corrige, aceita ou descarta
        │
        ▼
Somente a decisão humana pode criar o material
```

A IA não terá permissão direta para publicar anúncio, aprovar empresa, liberar contato ou concluir negociação.

## 9. Regra para mudanças no banco

Toda mudança na estrutura ou nas regras do banco será registrada em um arquivo SQL dentro da pasta `supabase/migrations`.

**SQL** é a linguagem de instruções do banco. Uma **migração** é um arquivo que descreve uma mudança específica, por exemplo criar uma tabela ou acrescentar um campo.

Regras obrigatórias:

- nenhuma alteração do banco de produção será feita apenas por cliques no painel;
- cada mudança terá seu próprio arquivo de migração;
- os arquivos serão guardados no Git junto do projeto;
- a sequência das migrações permitirá saber quando e por que o banco mudou;
- toda migração será revisada e testada antes de chegar ao banco de produção;
- senhas, chaves e dados reais de clientes nunca serão colocados nesses arquivos;
- a pasta e a primeira migração serão criadas somente na etapa prevista para o banco, não no Dia 3.

Guardar as migrações no Git não significa que toda mudança possa ser desfeita automaticamente sem risco. Significa que teremos o histórico necessário para reproduzir o banco e preparar uma correção ou retorno seguro quando necessário.

## 10. Segurança quando houver falha

O sistema seguirá a regra de **falhar fechado**. Isso significa que, se não for possível confirmar uma identidade, uma permissão ou uma resposta do banco, o acesso protegido será negado em vez de ser liberado por precaução.

- falha de acesso não abre a área da empresa ou do Administrador;
- falha ao gravar não apresenta uma confirmação falsa de sucesso;
- falha ao verificar arquivo não libera o documento;
- falha na função da IA não cria nem publica material;
- toda mensagem informa o que a pessoa pode fazer em seguida, sem revelar segredo técnico.

## 11. Situação atual e destino planejado

### Situação atual

- o site está publicado no Cloudflare Pages;
- dados provisórios utilizam Workers KV;
- arquivos provisórios utilizam R2;
- funcionalidades já construídas servem como validação dos fluxos e das telas.

### Destino planejado pelo Desafio dos 10 Dias

- Cloudflare Pages permanece responsável pelas telas;
- Supabase passa a controlar usuários, sessões e banco de dados;
- armazenamento privado do Supabase passa a guardar os arquivos;
- funções protegidas do Supabase executam operações sigilosas;
- toda mudança do banco nasce em uma migração guardada no Git.

A migração de KV e R2 não acontecerá no Dia 3. Antes dela, os dados existentes precisarão ser identificados, copiados, conferidos e somente então direcionados ao novo local. Nada será apagado automaticamente durante essa transição.

## 12. Decisões já confirmadas

- prioridade máxima para celular, com boa utilização também no computador;
- Cloudflare Pages para publicação das telas;
- Supabase para acesso, banco e armazenamento privado definitivo;
- funções protegidas do Supabase para segredos e futura integração com IA;
- uma empresa pode possuir vários usuários individuais;
- empresa vendedora aceita seu Termo Geral no cadastro;
- empresa compradora aceita seu Termo Geral no cadastro;
- empresa com perfil duplo aceita os dois Termos Gerais;
- depois do acordo, vendedor e comprador aceitam seus respectivos Termos Específicos;
- a Ordem de Compra só pode ser enviada após os dois aceites específicos;
- cada dado nasce com proprietário e pessoa responsável;
- Administrador e usuário principal participam das aprovações definidas no `MODELO.md`;
- nenhum segredo é enviado ao navegador;
- toda mudança do banco será preservada por migração no Git;
- arquitetura atual de KV e R2 é provisória e será migrada de forma controlada.

## 13. O que este documento não executa

Este documento não:

- cria uma conta ou projeto no Supabase;
- cria tabelas, usuários, recipientes de arquivos ou funções;
- cria a pasta `supabase/migrations`;
- move ou apaga dados do Cloudflare;
- modifica o site publicado;
- adiciona chaves ou senhas ao projeto;
- ativa a inteligência artificial.

## 14. Referências oficiais utilizadas no planejamento

- Segurança dos dados e das chaves do Supabase: <https://supabase.com/docs/guides/database/secure-data>
- Chaves publicáveis e secretas: <https://supabase.com/docs/guides/getting-started/api-keys>
- Armazenamento privado: <https://supabase.com/docs/guides/storage/buckets/fundamentals>
- Migrações do banco de dados: <https://supabase.com/docs/guides/deployment/database-migrations>

## 15. Critério de aprovação

O `ARQUITETURA.md` estará aprovado quando você confirmar que:

- entende onde as telas, os dados, os arquivos e os segredos ficarão;
- concorda com o Supabase como destino do acesso, do banco e dos arquivos privados;
- concorda que toda alteração do banco será registrada em migração;
- concorda com a separação de acesso entre visitante, comprador, vendedor e Administrador;
- entende que a estrutura atual de KV e R2 será migrada posteriormente e não será apagada no Dia 3.
