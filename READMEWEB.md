# READMEWEB — o que cada função do código faz

Guia simples do código JavaScript do AcessaRio, organizado por pasta. Cada item diz em poucas palavras o que a função, hook ou componente faz. Para instalar e rodar o projeto, veja o README.md.

O caminho de uma ação no app segue sempre as mesmas camadas:

```
tela (pages) → componentes (components) → hooks → services → api (cliente) → servidor (server / api) → dados
                                                  ↘ domain (regras de negócio, sem rede)
```

---

## 1. `shared/` — código usado pelo servidor e pelo navegador

### `shared/restCore.js` (o "motor" da API REST)
- `handleRequest(db, request)` — recebe um pedido (GET, POST, PUT, PATCH, DELETE) e lê ou altera a coleção certa do banco: listar, buscar por id, criar, editar e excluir.
- `parseQueryString(texto)` — transforma `?a=1&b=2` em um objeto `{ a: '1', b: '2' }` para usar como filtro.
- `HttpError` — erro com código HTTP (404, 422...), usado para devolver a resposta certa.
- `REQUIRED_FIELDS` — campos obrigatórios de cada coleção (ex.: um relato precisa de tipo e usuário).
- `VALIDATORS` — regras extras de validação de cada coleção.
- `CASCADE` — o que apagar junto (ex.: ao apagar um relato, apaga os votos dele).

### `shared/auth.js` (senhas e login)
- `hashPassword(senha)` — gera o resumo protegido da senha (PBKDF2 com sal). A senha em si nunca é guardada.
- `verifyPassword(senha, guardado)` — confere se a senha digitada bate com o resumo guardado.
- `createToken(userId, segredo)` — cria o "crachá" (token) que prova que a pessoa entrou. Vale 30 dias.
- `verifyToken(token, segredo)` — confere se o crachá é verdadeiro e não venceu. Devolve o id da pessoa.
- `MIN_PASSWORD_LENGTH` — tamanho mínimo da senha (6).

### `shared/api.js` (regras de acesso da API)
- `handleApiRequest(db, pedido, { secret })` — porta de entrada da API. Trata `/auth/*` (criar conta, entrar, definir senha, "quem sou eu"), confere permissões e repassa o resto para o `handleRequest`.
- `authorize(db, pedido, userId)` — decide se a pessoa pode fazer aquilo. Por exemplo, só o autor pode editar ou apagar o próprio relato, e ninguém lê as senhas.
- `tokenFromHeader(cabeçalho)` — tira o token do cabeçalho `Authorization: Bearer ...`.
- `normalizeName(nome)` — padroniza o nome (sem acento, sem maiúsculas) para "José" e "jose" serem a mesma conta.

### `shared/seed.js`
- `buildSeed()` — monta os dados iniciais de demonstração: lugares, rotas, trechos, relatos, votos e usuários.

---

## 2. `server/` — servidor Node local

- `server/index.js` — liga o servidor HTTP na porta 3001 e manda cada pedido para o `runApiRequest`.
- `server/reset.js` — apaga o banco local e recria os dados de demonstração.

### `server/handler.js`
- `runApiRequest(store, pedido)` — lê o banco, executa o pedido e salva só se algo mudou. Os pedidos de escrita entram numa fila, um de cada vez, para não perder dados.
- `resolveRoute(url)` — descobre o caminho da API a partir da URL (funciona no servidor local e na Vercel).
- `AUTH_SECRET` — segredo usado para assinar os tokens (vem da variável de ambiente).
- `CORS_HEADERS` — cabeçalhos que deixam o site conversar com a API.

### `server/stores.js` (onde os dados ficam guardados)
- `createMemoryStore()` — guarda na memória (usado nos testes).
- `createFileStore(caminho)` — guarda no arquivo `server/db.json`.
- `createBlobStore()` — guarda no Vercel Blob (usado no site publicado).

### `api/index.js`
- A mesma API, rodando como Vercel Function no site publicado.

---

## 3. `src/api/` — como o navegador fala com a API

- `createHttpClient(url)` — cliente que usa `fetch` para chamar o servidor real. Manda o token junto.
- `createLocalClient()` — cliente "sem servidor": roda a mesma API dentro do navegador e guarda no localStorage (modo demonstração).
- `toQueryString(objeto)` — transforma filtros em `?chave=valor`.
- `ApiError` — erro da API com uma mensagem amigável (`userMessage`) para mostrar na tela.
- `client.js` → `api.get / post / put / patch / delete` — atalhos usados por todos os services. `apiClient` escolhe o cliente (HTTP ou local) conforme a configuração.
- `setAuthToken(token)` — define o token da conta ativa para as próximas requisições.

---

## 4. `src/services/` — acesso a dados (um arquivo por assunto)

- `authService` — `register` (criar conta), `login` (entrar), `claim` (definir senha de conta antiga) e `me` (carregar a conta do token salvo).
- `usersService` — `getById` (ler uma conta) e `update` (editar nome, perfil e preferências). Tem também `DEFAULT_PREFERENCES` (preferências iniciais) e `normalizeName`.
- `sessionStore` — lembra no aparelho quem está logado, o token, as contas já usadas ali e os dados do visitante.
  - `signIn` — guarda quem entrou e o token.
  - `signOut` — sai e apaga o token.
  - `enterAsGuest` — entra como visitante.
  - `guestData` / `saveGuestData` — leem e salvam o perfil e as preferências do visitante.
  - `knownAccounts` — lista as contas já usadas neste aparelho.
  - `rename` — atualiza o nome guardado de uma conta.
  - `forget` — tira uma conta da lista.
  - `createSessionStore(armazenamento)` — cria o mesmo objeto sobre outro armazenamento (usado nos testes).
- `placesService` — lista, busca e cria lugares (origem e destino).
- `routesService` — lista e lê rotas salvas. `saveRoutePlan` grava uma rota planejada com seus trechos, e `segmentsService` lê os trechos.
- `reportsService` — cria, edita, apaga e lista relatos. `votesService` registra e desfaz votos (confirmo, resolvido, incorreta).
- `searchesService` — salva e apaga as buscas recentes.
- `geocodingService` — busca endereços enquanto a pessoa digita e transforma um ponto do mapa em endereço (API Photon). Usa `placeName` (monta um nome legível) e `fromPhotonFeature` (converte a resposta da Photon para o formato do app).
- `routingService` — pede à OSRM o caminho a pé entre dois pontos.
- `networkService` / `loadNetwork` — junta trechos e relatos próximos (inclusive os feitos "em qualquer lugar") para avaliar uma rota.

---

## 5. `src/domain/` — regras de negócio (puras, sem tela e sem rede; todas têm testes)

### `scoring.js` (nota de acessibilidade)
- `evaluateSegment` — dá a nota de um trecho conforme o perfil da pessoa (cadeirante, idoso...) e os relatos.
- `evaluateRoute` — dá a nota da rota inteira. O pior trecho pesa mais.
- `rankRoutes` — ordena as rotas da melhor para a pior e marca as não recomendadas.
- `attributeBreakdown` — mostra de onde vêm os pontos do trecho (largura da calçada, rampa, piso...).
- `reportEffect` / `reportImpact` — quanto cada relato tira ou soma na nota.
- `segmentCode` — gera o código do trecho ("T01", "T02"...).

### `reportStatus.js` (ciclo de vida do relato)
- `tallyVotes` — conta os votos de um relato.
- `statusFromTally` — decide o status: não verificado, confirmado, resolvido ou descartado.
- `describeReport` / `describeReports` — juntam relato, votos, status e o aviso de "possivelmente desatualizado".

### `safety.js` (índice de segurança)
- `evaluateSafety` — calcula o nível de atenção de um trecho a partir de ocorrências recentes (assalto, rua escura...). Ocorrências antigas pesam menos.
- `freshness` — quanto um relato ainda vale conforme a idade dele.
- `combineSafety` — junta o nível de vários trechos no nível da rota.
- `safetySummary` — texto curto para a tela ("Atenção: 2 ocorrências recentes").

### `geo.js` (distâncias e mapa)
- `distanceM` — distância em metros entre dois pontos.
- `distanceToPath` — distância de um ponto até um caminho.
- `nearestSegment` — trecho mais perto de um ponto marcado.
- `pathMidpoint` — ponto do meio de um caminho.
- `attachReportsToSegments` — liga relatos feitos por localização aos trechos próximos.

### Outros arquivos de `domain/`
- `routePlanning.js`
  - `planFromOsrm` — transforma a resposta da OSRM em rota e trechos.
  - `stepsToSegments` — divide o caminho em trechos.
- `reportTypes.js`
  - Listas de tipos de relato: obstáculos, facilitadores e segurança.
  - `getReportType` — devolve os dados de um tipo de relato.
  - `isSafetyReport` / `isAccessibilityReport` — dizem de que grupo é o relato.
- `profiles.js` — `PROFILES` e `getProfile`: perfis de mobilidade e o peso de cada problema para cada perfil.
- `summary.js`
  - `summarizeRecentReports` — conta os relatos recentes por status.
  - `segmentLevel` — cor do trecho no mapa.

---

## 6. `src/hooks/` — hooks (lógica reaproveitável das telas)

- `useAsync` — roda uma função assíncrona e devolve `data`, `loading`, `error` e `reload`. É a base dos outros hooks.
- `useHashRouter` — navegação entre telas pela URL (`#/rotas/...`). `parseHash`, `matchPath` e `buildPath` são os auxiliares.
- `useRouteOptions` — busca e planeja as rotas entre dois lugares, já avaliadas e ordenadas para o perfil.
- `useRouteDetail` — carrega uma rota com trechos, relatos e o voto do usuário em cada relato.
- `useReportActions` — criar, editar, apagar e votar em relatos, com mensagens de sucesso e erro. Bloqueia visitantes.
- `useMyReports` — relatos feitos pelo usuário, com status.
- `useContribution` — envia uma contribuição em qualquer ponto do mapa, ligada ao trecho mais próximo quando existir.
- `usePlaces` — lugares conhecidos, com busca. `ensure` cria o lugar na API se ele veio da busca de endereços.
- `useRecentSearches` — buscas recentes: listar, registrar e remover.
- `useAddressAutocomplete` — sugestões de endereço enquanto a pessoa digita (espera ela parar de digitar antes de buscar).
- `useGeocoding` — busca de endereço sob demanda.
- `usePhotoPicker` — escolher e reduzir a foto do relato.
- `useLeafletMap` — cria o mapa OpenStreetMap. `useMapEvent` liga eventos (clique), e `useLayerGroup` desenha camadas.
- `useEvaluationContext` — perfil e preferências do usuário no formato que as regras de negócio esperam.

---

## 7. `src/context/` — estado compartilhado entre as telas

- `UserProvider` / `useCurrentUser` — conta ativa ou visitante.
  - `signIn` — entrar com nome e senha.
  - `signUp` — criar conta.
  - `claim` — definir a senha de uma conta antiga.
  - `enterAsGuest` — entrar sem conta.
  - `signOut` — sair.
  - `updateUser` / `setPreference` — salvar mudanças. Para o visitante, salvam só no aparelho.
  - `isGuest` — diz se é visitante.
- `ThemeProvider` / `useTheme` — modo claro, escuro ou automático.
- `ToastProvider` / `useToast` — mensagens rápidas no rodapé ("Relato enviado!").

---

## 8. `src/pages/` — telas

- `LoginPage` — entrar com nome e senha, criar conta, definir senha de conta antiga ou "Entrar sem conta".
- `OnboardingPage` — escolha do perfil de mobilidade no primeiro acesso.
- `SearchPage` — tela 1: escolher origem e destino.
- `RoutesPage` — tela 2: rotas encontradas, com nota e mapa.
- `RouteSummaryPage` — telas 3 e 4: resumo da rota e detalhes de cada trecho.
- `ReportPage` — telas 5A e 5B: confirmar um relato ou relatar um problema novo.
- `ProfilePage` — tela 6: perfil, preferências, aparência, rotas recentes, meus relatos, contribuir e sair.
- `App` (`src/App.jsx`) — escolhe a tela conforme a URL e a sessão. Sem sessão mostra a entrada, e sem perfil mostra o onboarding.

---

## 9. `src/components/` — peças visuais

### `ui/` (peças básicas)
- `Button` — botão padrão, com variantes e "carregando". `Spinner` é o ícone de carregando.
- `IconButton` — botão só com ícone.
- `Card` — caixa de conteúdo.
- `Notice` — aviso informativo.
- `SectionTitle` — título de seção.
- `Badge` — etiqueta. `StatusBadge` mostra o status do relato, e `CountDot` é a bolinha com número.
- `TextInput` / `TextArea` — campos de texto. `FieldLabel` e `FieldError` são o rótulo e o erro do campo.
- `Tabs` — abas.
- `Toggle` — chave liga/desliga.
- `ChoiceGrid` — grade de opções.
- `Modal` — janela sobre a tela.
- `PhotoField` — campo de foto.
- `Icon` — ícones em SVG.
- `ScoreRing` — anel com a nota. `scoreLevel` escolhe a cor.
- `ThemeToggleButton` / `ThemeSelector` — trocar o tema.
- `Skeleton`, `LoadingState`, `ErrorState`, `EmptyState` — telas de carregando, erro e vazio.

### `layout/` (estrutura das telas)
- `AppShell`, `Page` e `Bleed` — estrutura da página.
- `TopBar` — barra do topo com o botão voltar. `MapBackButton` é o voltar por cima do mapa.
- `BottomNav` — menu de baixo (Mapa, Rotas, Contribuir, Perfil).
- `RioScene` — ilustração da tela de busca.
- `RequireAccount` — mostra o conteúdo só para quem tem conta. Para o visitante, mostra o convite "Entre com uma conta para...".

### `map/` (mapa)
- `AccessMap` — mapa da rota. Usa o Leaflet ou o mapa esquemático, com as mesmas props.
- `LeafletRouteMap` — desenha rotas, trechos e marcadores no OpenStreetMap.
- `CityMap` — mapa esquemático em SVG, que funciona sem internet.
- `MapFrame` — moldura do mapa com legenda. `LegendDot` é o item da legenda, e `MapHint` a dica sobre o mapa.
- `mapAdapters.js`
  - `toMapRoute` — converte uma rota para o formato do mapa.
  - `endpointMarkers` — marcadores de origem e destino.
  - `segmentNumberMarkers` — números dos trechos.
  - `safetyMarkers` — pontos de alerta de segurança.
- `mapGeometry.js`
  - `fromLatLng` — converte um ponto do Leaflet para o formato do app.
  - `framePoints` — pontos que o mapa deve enquadrar.
  - `pointsKey` — evita reenquadrar o mapa sem necessidade.
  - `labelPoint` — onde fica o número da rota.
- `projection.js` — conta de coordenadas para o mapa SVG: `project`, `unproject`, `fitViewBox` e `toPoints`.

### `routes/` (rotas)
- `RouteCard` — cartão de uma rota na lista.
- `SegmentDetail` — detalhes de um trecho.
- `PlaceInput` — campo de origem ou destino com sugestões.
- `routeLabels.js` — etiquetas do cartão da rota: `routeChips`, `recentObstacleCount` e `BADGES`.

### `reports/` (relatos)
- `NewReportForm` — formulário de novo problema (tela 5B).
- `ContributeForm` — contribuir em qualquer lugar, com as abas Facilita, Dificulta e Segurança.
- `LocationPicker` — escolher o ponto no mapa ou pelo endereço.
- `ReportVoteCard` — cartão para votar num relato (tela 5A). O visitante vê o relato, mas não vota.
- `MyReportItem` — item da lista "Meus relatos", com editar e excluir.
- `ReportSummary` — linha de relato na lista do trecho.
- `PhotoThumb` — miniatura da foto.
- `reportText.js` — textos prontos: `tallyText` (contagem de votos) e `reportMeta` (data e autor).

### `places/`
- `PlaceSearchBox` — caixa de busca de endereço com sugestões.

### `safety/` (segurança)
- `SafetyBadge` / `SafetyLine` — selo e linha de nível de segurança.
- `SafetySection` — seção de segurança no resumo da rota.
- `SafetyLayerToggle` — liga ou desliga os alertas de segurança no mapa.

---

## 10. `src/utils/` — utilitários

- `cn(...)` — junta classes CSS do Tailwind, ignorando as vazias.
- `format.js` — formata datas e medidas para exibir:
  - `formatShortDate` / `formatDateTime` — datas.
  - `formatRelativeDays` — "há 3 dias".
  - `formatKm` / `formatMeters` / `formatWidth` — distâncias e larguras.
  - `signed` — número com sinal (+5).
  - `plural` — "1 relato" / "2 relatos".
- `resizeImageFile(arquivo)` — reduz a foto antes de enviar.
- `src/config/env.js` → `config` — lê a configuração (modo da API, endereço do servidor, tipo de mapa).

---

## 11. `tests/` — testes automáticos

Rodam com `npm test`. Testam as regras de `domain/`, a API REST, o login com senha e as permissões, a sessão do aparelho e o servidor.
