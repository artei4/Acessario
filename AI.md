# Uso de IA no desenvolvimento

Este documento registra como a inteligência artificial foi usada no AcessaRio, o que foi verificado e o que ainda precisa de revisão humana.

## Ferramenta

- **Claude** (Anthropic), modelo Claude Opus 5.5, em sessão com acesso a terminal, arquivos e navegador automatizado.

## O que foi pedido

> Aplicativo que identifica rotas considerando acessibilidade, como calçadas, rampas, escadas e obstáculos. Os próprios usuários podem adicionar informações e atualizar as condições dos caminhos, ajudando pessoas com mobilidade reduzida a encontrar trajetos mais adequados. […] utilizando do PDF mandado como as telas que o site precisa ter.

Critérios informados: uso correto de React, Hooks e Custom Hooks; integração com API externa para CRUD; separação entre lógica de negócio, acesso a dados e apresentação; componentização e qualidade do código; histórico de commits; README.md e AI.md.

Entrada principal: `AcessaRio_prototipo.pdf`, com as telas 1, 2, 3, 4, 5A, 5B e 6.

## O que a IA fez

1. **Leitura do protótipo** e levantamento de cada elemento das telas (textos, selos, botões, estados).
2. **Desenho da arquitetura** em camadas (API → serviços → domínio → hooks → componentes/páginas) antes de escrever código.
3. **API REST** própria em Node puro (`server/`, `shared/restCore.js`), com CRUD genérico, filtros, validação e remoção em cascata. Escolhida no lugar de `json-server` para ter controle da validação e da cascata e poder testar o núcleo sem rede.
4. **Regras de negócio** (`src/domain/`): status dos relatos por votos, nota por perfil, tempo estimado, bloqueio, recomendação. Os números do protótipo (ex.: "+4 pontos" de um relato de rampa, "28 min" da Rota 1) serviram de referência para calibrar pesos.
5. **Custom hooks**, componentes, as sete telas e o CSS.
6. **Testes** com `node:test`.
7. **README.md** e este arquivo.
8. **Commits** em etapas, na ordem em que o trabalho evoluiu.

## Como o resultado foi verificado

- `npm test`: 20 testes passando (domínio e API).
- A API foi iniciada e exercitada com `curl` (listar com filtros, criar, validar, editar, excluir em cascata, coleção inexistente).
- O front foi empacotado com **esbuild** e aberto em **Chromium (Playwright)** com a API real rodando. Fluxo testado de ponta a ponta, conferindo o banco depois de cada passo:
  - escolher perfil (PATCH do usuário) → buscar rotas (POST da busca recente) → abrir a Rota 1 → navegação passo a passo;
  - confirmar relato (POST do voto), trocar o voto (PATCH), desfazer (DELETE);
  - validação do formulário de novo problema e envio (POST do relato);
  - alternar preferência (PATCH), editar relato (PATCH), excluir relato (DELETE);
  - contribuir tocando no mapa: trecho correto localizado e impacto na nota exibido.
  - Nenhum erro no console.
- Cada tela foi capturada e comparada visualmente com o PDF.

## Correções feitas durante a revisão

A IA não acertou tudo de primeira. Ajustes feitos após testar:

- **Dados de demonstração recalibrados**: na primeira versão a Rota 3 recebia nota (um relato confirmado tornava o trecho "verificado"), diferente do protótipo, que a mostra como "Informações insuficientes". O relato foi movido para outra rota. Os votos da Rota 2 foram ajustados para a queda de nota ficar visível.
- **Rótulos duplicados** na composição da nota ("Piso regular" do levantamento e do relato): relatos passaram a aparecer como "(relato)".
- **Script de testes**: `node --test tests/` não funciona no Node 22; trocado por um padrão de arquivos.
- **Layout**: margem negativa duplicada no mapa causava rolagem horizontal; "Meus relatos" estourava a largura; o trecho aberto por padrão no resumo não era o que merecia atenção.
- **Ordem em "Confirmar relato"**: o primeiro cartão destacado era um relato do próprio usuário; agora vêm primeiro relatos de outras pessoas no trecho atual.
- **Teste automatizado** clicava no título do modal em vez do botão "Excluir"; corrigido o seletor (o app estava certo).

## Segunda rodada de pedidos

Depois de testar, a pessoa pediu:

1. **Não depender de servidor por enquanto.** O app abria com "Não foi possível falar com o servidor" porque o modo padrão era `http`. O padrão passou a ser `local` (núcleo REST no navegador, com `localStorage`); o modo servidor continua disponível com `npm run dev:http`.
2. **Escolher entre modo claro e escuro.** Foi criado `ThemeContext` (claro, escuro ou automático, salvo no navegador), um botão de sol/lua nas telas 1 e 2 e a seção "Aparência" no Perfil. Para isso, as cores fixas do CSS e do mapa foram trocadas por variáveis, e o tema escuro redefine só essas variáveis. As telas foram conferidas no escuro por captura de tela.

## Terceira rodada de pedidos

A pessoa pediu: o servidor de volta, o mapa do **Google Maps** (Maps JavaScript API) e estilização com **Tailwind CSS**. No meio do trabalho, avisou que o app já estava na Vercel (projeto `acessario`) e no GitHub (`artei4/Acessario`).

1. **Servidor de volta.** O modo `http` voltou a ser o padrão (`npm start` sobe API + app); o modo sem servidor virou `npm run dev:demo`.
2. **Tailwind CSS v4.** O `global.css` foi substituído por `src/styles/index.css`. As cores do tema continuaram como variáveis CSS e foram registradas como cores do Tailwind (`@theme inline`). Assim, o modo escuro funciona sem `dark:` em cada classe. Padrões repetidos viraram componentes (`Card`, `Notice`, `Field`, `Page`…), e todas as telas foram reescritas com classes utilitárias.
3. **Google Maps.** Carregador oficial do Google, hooks `useGoogleMapsApi`/`useGoogleMap` e o componente `GoogleRouteMap` (Polylines por trecho, AdvancedMarkerElement, alfinete arrastável, tema escuro). Sem chave, o app usa o mapa esquemático antigo, então nada quebra enquanto a chave não é criada.
4. **Servidor na Vercel.** A IA explicou que a Vercel não roda o `server/index.js` e propôs duas opções. Seguiu com a recomendada, como havia avisado: a API como Vercel Function (`api/index.js`) e os dados no Vercel Blob. Pela integração com a Vercel, a IA criou o armazenamento Blob `acessario-dados` ligado ao projeto, o que gerou a variável `BLOB_READ_WRITE_TOKEN`.

### Como foi verificado

- `npm test`: 26 testes, incluindo a leitura de rotas da função da Vercel e o armazenamento Blob, com um Blob simulado.
- Fluxo completo no navegador automatizado contra o servidor local, com a nova interface, conferindo o banco depois de cada passo.
- A função da Vercel foi chamada diretamente com requisições simuladas: GET, POST, PATCH com corpo em texto, DELETE pela URL original, 422 e OPTIONS.
- **Google Maps com uma API simulada**: o ambiente não acessa os servidores do Google. Por isso, a IA criou uma versão falsa de `google.maps` (Map, Polyline, AdvancedMarkerElement, PinElement…) e confirmou que o app desenha 12 trechos na tela 3, seleciona a rota ao clicar na linha, marca o ponto ao clicar no mapa e ao arrastar o alfinete, e usa o esquema escuro no modo escuro.
- Capturas de tela de todas as telas no claro e no escuro, comparadas com a versão anterior.

### Correções durante esta rodada

- O compilador do Tailwind usado nos testes não reconhecia classes entre aspas simples nos objetos de variantes. O problema era do script de teste, e foi corrigido.
- Botões com contorno perderam a borda porque `border-transparent` (base) e `border-brand` (variante) competiam. Cada variante passou a definir a própria cor de borda.
- O mapa de escolha de ponto reenquadrava a cada toque, porque o alfinete entrava no enquadramento. Passou a enquadrar a área mapeada.

## Quarta rodada: troca para OpenStreetMap

A pessoa perguntou se teria que pagar pelo Google Cloud. A IA pesquisou os preços: são 10.000 carregamentos grátis por mês, mas o Google exige cartão de crédito cadastrado. Ela apresentou o OpenStreetMap como alternativa sem custo, e a pessoa escolheu trocar.

- Saíram o carregador do Google, os hooks `useGoogleMapsApi`/`useGoogleMap` e o `GoogleRouteMap`.
- Entraram o hook `useLeafletMap` (com `useMapEvent` e `useLayerGroup`) e o componente `LeafletRouteMap`, com as mesmas props. Assim, as páginas não mudaram: o `AccessMap` só passou a escolher o OpenStreetMap.
- O modo escuro usa um filtro CSS nos tiles, porque o OpenStreetMap não tem tiles escuros.
- O alfinete passou a se mover com as setas do teclado também no mapa real.
- O pacote `leaflet` não pôde ser instalado aqui. A IA criou um Leaflet simulado e confirmou que o app desenha 12 linhas (2 tracejadas) na tela 3, seleciona a rota ao tocar na linha, marca o ponto por clique, arraste e setas, destrói o mapa ao sair da tela, usa os tiles do OpenStreetMap com o crédito obrigatório e aplica o filtro no modo escuro.
- Durante a troca, um script de substituição corrompeu o `src/config/env.js`. A IA restaurou o arquivo pelo git e refez a edição.

## Quinta rodada: rotas em qualquer lugar do Rio

A pessoa enviou o código ao GitHub e pediu duas coisas: rotas entre quaisquer pontos do Rio (ex.: do Americas Shopping até o McDonald's do Recreio) e a correção do botão de voltar, que ficava em cima do zoom do mapa.

- O commit da pessoa no GitHub (com `.env.http` e `src/styles/global.css` antigos) foi trazido antes de qualquer mudança. Esses arquivos não são usados pelo app e foram mantidos, já que a decisão de apagá-los é da pessoa.
- **Busca no Rio inteiro:** o campo de origem/destino sugere os lugares conhecidos e busca qualquer lugar ou endereço na Nominatim, só quando a pessoa pede. Lugares novos são gravados na API (com `osmId`, para não duplicar).
- **Cálculo de rotas:** sem rota salva entre dois lugares, o app consulta o roteador a pé do OpenStreetMap (OSRM) e grava rotas e trechos na API. A conversão (`domain/routePlanning.js`) é uma função pura e testada. Cálculos simultâneos do mesmo trajeto são reaproveitados, porque o modo estrito do React rodaria o efeito duas vezes e gravaria rotas em dobro.
- **Trechos sem levantamento:** as regras de nota passaram a ignorar atributos desconhecidos (`null`) em vez de tratá-los como ruins. A tela mostra "Não informado" e convida a relatar.
- **Zoom:** o controle de zoom do Leaflet foi para o canto inferior direito.
- **Verificação:** fluxo completo no navegador com o servidor local, simulando as respostas da Nominatim e do roteador. Foram conferidos a busca dos dois lugares, a gravação de 1 lugar novo e 2 rotas com trechos, a não repetição do cálculo ao recarregar, o aviso nos trechos novos e um relato gravado num trecho calculado.

## Sexta rodada: sugestões enquanto se digita

A pessoa pediu que, ao digitar "barra", o app já mostrasse opções como BarraShopping e Praia da Barra da Tijuca.

- As regras de uso da Nominatim proíbem autocompletar. Por isso, a busca passou para o **Photon**, um geocodificador do ecossistema OpenStreetMap feito para isso.
- O hook `useAddressAutocomplete` espera 350 ms sem digitar, cancela a busca anterior (`AbortController`), guarda o cache por termo e mantém as sugestões antigas na tela enquanto carrega.
- O componente `PlaceSearchBox` (combobox acessível) passou a ser usado na origem/destino e no endereço de "Contribuir". Lá, escolher um endereço move o alfinete e aproxima o mapa.
- Correção junto: endereços sem nome viravam só o número (ex.: "15900"). Agora aparecem como "Avenida das Américas, 15900".
- **Verificação:** no navegador, com o Photon simulado, digitar "barra" letra por letra gerou **uma** busca. Apareceram as 3 sugestões, a escolha pelo teclado funcionou, repetir o termo usou o cache, e o alfinete foi para o BarraShopping no formulário de contribuição. 32 testes passando.

## Sétima rodada: contribuir em qualquer lugar

A pessoa mostrou que "Contribuir com o mapa" recusava pontos fora dos trechos já salvos ("Ponto fora dos trechos mapeados"), inclusive endereços digitados. Isso bloqueava a função principal do site.

- **Causa:** todo relato precisava de um `segmentId`, ou seja, de um trecho de rota salvo a até 150 m.
- **Mudança de modelo:** um relato agora pode ter só a localização (`segmentId: null`, `location`, `placeName`). A API aceita isso e exige trecho **ou** local.
- **Relatos por localização valem para as rotas:** a função pura `attachReportsToSegments` liga a uma rota qualquer relato a até 25 m de um trecho dela. Com isso, contribuições soltas aparecem em rotas calculadas depois, e rotas que passam pela mesma rua compartilham os relatos.
- O nome do lugar vem do endereço escolhido, da rua do trecho ou da busca reversa do Photon.
- "Usar minha localização" deixou de recusar quem está longe das rotas.
- **Verificação:** no navegador, com o servidor local, foram feitas uma contribuição por endereço e outra por toque no mapa, ambas longe de qualquer rota. As duas foram salvas com nome. Depois foi calculada uma rota passando pelo local, e cada relato apareceu no trecho certo. 37 testes passando.
- O arquivo `src/hooks/useGeocoding.js`, recriado pela pessoa num commit, não é usado pelo app e foi mantido.

## Oitava rodada: índice de segurança

A pessoa pediu um índice que mostrasse áreas perigosas, "como comunidade ou que tenham relatos mais recentes de assaltos".

- **A IA recomendou não marcar comunidades como perigosas.** Os motivos: estigmatiza moradores, inclusive o público do próprio app (pessoas com mobilidade reduzida que moram em comunidades); é impreciso, porque muitos roubos a pedestre acontecem em áreas centrais; e destoa de um projeto sobre inclusão. A IA propôs um índice baseado em ocorrências com prazo de validade, e a pessoa concordou.
- A IA pesquisou fontes oficiais (Fogo Cruzado, ISP-RJ) e as deixou como próximo passo, porque o Fogo Cruzado exige cadastro.
- **O que foi feito:** os tipos `risk`/`safe` em `reportTypes.js`, `domain/safety.js` (validade, peso, atenuação, níveis), o índice por trecho e rota em `scoring.js` (sem mexer na nota de acessibilidade), a preferência `avoidUnsafe`, os componentes em `components/safety/`, a camada no mapa, a aba "Segurança" em Contribuir, os votos com "Não vale mais" e dados fictícios de exemplo.
- **Ajuste durante os testes:** um único assalto não verificado ficava em "risco baixo" (2,9 de 3), o que confundiria ao lado da frase "assalto ontem". O limite de "atenção" passou para 2,5.
- **Verificação:** 44 testes. No navegador, com o servidor local: selos nos cartões, seção do trecho, aviso na navegação, contribuição de "rua escura" num ponto solto, preferência salva, tema escuro.

## Limitações do ambiente

- O ambiente onde o código foi gerado **não tinha acesso à internet para `npm install`**. O projeto não foi executado com o Vite em si: foi validado com esbuild e com o compilador do Tailwind v4 chamado diretamente, mais Playwright. Ao rodar `npm install && npm start` pela primeira vez, vale conferir se as versões em `package.json` resolvem sem conflito.
- O **Leaflet real** e os tiles do OpenStreetMap não puderam ser carregados aqui (só a versão simulada). Na primeira execução, vale olhar o mapa nas telas 3, 4, 5B e 6, no claro e no escuro.
- O pacote `@vercel/blob` não pôde ser instalado. O código usa só `put`, `list` e `del`, que são documentados, mas a gravação real no Blob só pode ser conferida no site publicado (cabeçalho `X-AcessaRio-Store: blob`).
- O **Photon** e o **roteador OSRM** não puderam ser chamados a partir do ambiente de teste (as respostas foram simuladas no formato documentado). Na primeira busca real, vale conferir um trajeto longo e um curto.
- A integração com a **Nominatim** não pôde ser chamada a partir do ambiente de teste. O código trata falha de rede com mensagem e o mapa continua funcionando por toque.

## O que precisa de revisão humana

- **Pesos da nota** (`src/domain/scoring.js`, `profiles.js`, `reportTypes.js`): foram definidos pela IA a partir do protótipo, não de pesquisa com usuários. O ideal é validá-los com pessoas de cada perfil e com normas de acessibilidade (ex.: NBR 9050, que trata de inclinação de rampas e largura de calçadas).
- **Limiares** de confirmação (5 votos), desatualização (30 dias) e validade do levantamento (180 dias).
- **Dados**: todas as ruas, medidas e relatos são fictícios; as coordenadas são aproximadas.
- **Privacidade**: fotos e localização dos relatos ficam no banco sem moderação nem remoção de metadados. Na Vercel, o banco é um arquivo público no Blob (com nome difícil de adivinhar).

## Como a IA deve ser usada daqui em diante

- Pedir mudanças por camada (ex.: "mude a regra X em `domain/scoring.js` e atualize o teste") ajuda a manter a separação.
- Rodar `npm test` depois de qualquer mudança nas regras.
- Revisar diffs antes de commitar; a IA pode propor pesos ou textos plausíveis que não refletem a realidade.
