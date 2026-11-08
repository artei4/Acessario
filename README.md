# AcessaRio — navegação urbana inclusiva

Aplicativo web (React) que encontra rotas a pé considerando a **acessibilidade** do caminho — calçadas, rampas, escadas, inclinação e obstáculos — e deixa os **próprios usuários** relatarem e confirmarem as condições das ruas. Cada relato muda a nota e o tempo estimado das rotas para quem tem mobilidade reduzida.

> Origem e destino podem ser **qualquer lugar ou endereço do Rio de Janeiro**: o app busca o lugar no OpenStreetMap e calcula rotas a pé. Os dados de demonstração (trajeto **Rua Siqueira Campos ↔ Shopping Rio Sul**, com levantamento e relatos) são fictícios.

**Stack:** React 19 · Vite · Tailwind CSS v4 · OpenStreetMap + Leaflet · API REST em Node (local) / Vercel Functions + Vercel Blob (produção).

---

## Sumário

1. [Telas](#telas)
2. [Como rodar](#como-rodar)
3. [Mapa (OpenStreetMap)](#mapa-openstreetmap)
4. [Publicação na Vercel](#publicação-na-vercel)
5. [Funcionalidades](#funcionalidades)
6. [Arquitetura](#arquitetura)
7. [Estilização com Tailwind](#estilização-com-tailwind)
8. [API REST](#api-rest)
9. [Regras de negócio](#regras-de-negócio)
10. [Testes](#testes)
11. [Acessibilidade](#acessibilidade)
12. [Limitações e próximos passos](#limitações-e-próximos-passos)

---

## Telas

As telas seguem o protótipo `AcessaRio_prototipo.pdf`.

| # | Tela do protótipo | Rota (hash) | Arquivo |
|---|---|---|---|
| 1 | Perfil de mobilidade | `#/boas-vindas` | `src/pages/OnboardingPage.jsx` |
| 2 | Busca de destino | `#/buscar` | `src/pages/SearchPage.jsx` |
| 3 | Rotas e mapa de acessibilidade | `#/rotas?de=…&para=…` | `src/pages/RoutesPage.jsx` |
| 4 | Resumo, navegação e trechos | `#/rotas/:routeId?trecho=…` | `src/pages/RouteSummaryPage.jsx` |
| 5A | Confirmar relato (só aparece se a rota tem relato ativo) | `#/rotas/:routeId/trechos/:segmentId/relatar?aba=confirmar` | `src/pages/ReportPage.jsx` |
| 5B | Novo problema (aparece em todas as rotas) | `#/rotas/:routeId/trechos/:segmentId/relatar?aba=novo` | `src/pages/ReportPage.jsx` |
| 6 | Perfil, preferências e contribuições | `#/perfil` (`?secao=contribuir` rola até "Contribuir com o mapa") | `src/pages/ProfilePage.jsx` |

---

## Como rodar

Requisitos: **Node.js 20+**.

```bash
npm install
cp .env.example .env   # opcional: nenhuma chave é necessária
npm run api:reset      # cria server/db.json com os dados de demonstração
npm start              # sobe a API (porta 3001) e o app (porta 5173) juntos
```

Abra <http://localhost:5173>. Na primeira vez, o app pede o perfil de mobilidade (tela 1).

O mapa do OpenStreetMap funciona direto, sem chave nem cadastro.

### Sem servidor (modo demonstração)

```bash
npm run dev:demo
```

O mesmo núcleo REST da API (`shared/restCore.js`) roda dentro do navegador e os dados ficam no `localStorage`. Todas as funções continuam funcionando. No Perfil, "Restaurar dados de demonstração" volta ao estado inicial.

### Variáveis de ambiente

| Variável | Padrão | Para que serve |
|---|---|---|
| `VITE_MAP_PROVIDER` | `osm` | `osm` usa o OpenStreetMap; `schematic` usa o mapa esquemático, sem internet |
| `VITE_API_MODE` | `http` | `http` usa a API REST; `local` roda tudo no navegador |
| `VITE_API_URL` | `http://localhost:3001` em desenvolvimento, `/api` publicado | Endereço da API REST |
| `VITE_USER_ID` | `u-jose` | Usuário da demonstração (não há login) |
| `BLOB_READ_WRITE_TOKEN` | — | Só na Vercel: criado automaticamente ao conectar o Vercel Blob |

### Scripts

| Script | O que faz |
|---|---|
| `npm start` | API REST + app ao mesmo tempo |
| `npm run dev` | Só o app (Vite) |
| `npm run dev:demo` | App sem servidor (dados no navegador) |
| `npm run api` | Só a API REST |
| `npm run api:reset` | Recria o banco local com os dados de demonstração (datas relativas a hoje) |
| `npm test` | Testes das regras de negócio, da API e do mapa (`node:test`, sem dependências) |
| `npm run build` | Build de produção em `dist/` |

---

## Mapa (OpenStreetMap)

O mapa usa o **OpenStreetMap** com a biblioteca **Leaflet**. É gratuito, não pede chave nem cartão, e funciona assim que o app abre.

### O que o mapa faz

- O mapa-base vem dos tiles públicos do OpenStreetMap, com o crédito obrigatório "© colaboradores do OpenStreetMap" no canto.
- Cada trecho da rota é uma linha (`L.polyline`) colorida pela acessibilidade: verde (boa), laranja (com limitações), vermelha (dificuldade alta) e cinza tracejada (não verificado).
- Origem, destino, números dos trechos e números das rotas são marcadores (`L.marker` com `L.divIcon`) estilizados com Tailwind.
- Na tela 3, tocar numa linha seleciona a rota.
- Ao relatar (telas 5B e 6), tocar no mapa marca o ponto, e o alfinete pode ser arrastado ou movido com as **setas do teclado**. O app encontra o trecho mais próximo do ponto.
- **Modo escuro:** o OpenStreetMap só tem tiles claros, então um filtro CSS inverte as cores dos tiles (variável `--map-tile-filter`). Linhas e marcadores ficam em outra camada e mantêm as cores.
- A busca de endereço em "Contribuir" sugere lugares enquanto se digita (Photon) e aproxima o mapa do lugar escolhido.

Arquivos: `hooks/useLeafletMap.js` (cria o mapa, registra eventos e camadas, e limpa tudo ao sair da tela), `components/map/LeafletRouteMap.jsx` (desenho), `components/map/AccessMap.jsx` (escolhe OpenStreetMap ou esquemático), `components/map/CityMap.jsx` (esquemático).

### Mapa esquemático (sem internet)

Com `VITE_MAP_PROVIDER=schematic`, o app usa um mapa esquemático em SVG que não depende de internet. Ele serve para apresentações sem rede e para a demonstração hospedada no Claude.

### Uso justo dos tiles

Os tiles de `tile.openstreetmap.org` são mantidos por voluntários e aceitam uso leve, como o de um projeto acadêmico, desde que o crédito apareça. Para muito tráfego, o caminho é um provedor de tiles próprio. Basta trocar `OSM_TILES` em `useLeafletMap.js`.

---

## Publicação na Vercel

O projeto `acessario` na Vercel publica a branch `main` do GitHub (`artei4/Acessario`).

- **Site:** `vite build` gera `dist/`.
- **API:** `api/index.js` é uma **Vercel Function**. O `vercel.json` encaminha `/api/<rota>` para ela, que usa o mesmo núcleo REST do servidor local. O app publicado chama `/api` no mesmo domínio.
- **Dados:** ficam no **Vercel Blob** (`acessario-dados`). Cada gravação salva uma versão nova do banco (`acessario-db/<data>.json`) e as antigas são apagadas aos poucos. Assim, a leitura nunca pega uma versão em cache. O banco é criado com os dados de demonstração no primeiro acesso.
- Sem `BLOB_READ_WRITE_TOKEN`, a função guarda os dados só na memória, e eles voltam ao início de tempos em tempos. O cabeçalho `X-AcessaRio-Store` informa qual armazenamento está em uso (`blob` ou `memory`).
- Nenhuma variável é necessária para o mapa: o OpenStreetMap funciona no site publicado sem configuração.

---

## Funcionalidades

- **Modo claro e escuro**: botão de sol/lua nas telas 1 e 2 e escolha entre Claro, Escuro e Automático em Perfil → Aparência. A escolha fica salva no navegador, e o mapa acompanha o tema.
- **Perfil de mobilidade** (cadeirante, mobilidade reduzida, deficiência visual, idoso): muda o peso de cada característica do caminho na nota.
- **Busca de destino em todo o Rio, com sugestões enquanto se digita**: ao digitar "barra", aparecem BarraShopping, Praia da Barra da Tijuca etc. Os lugares já usados aparecem primeiro, e o resto vem do OpenStreetMap (Photon). Setas e Enter escolhem a sugestão. Também tem inversão de origem/destino e resumo dos relatos recentes no trajeto.
- **Rotas para qualquer trajeto**: sem rota salva entre os dois lugares, o app calcula até 3 caminhos a pé no roteador do OpenStreetMap e grava lugares, rotas e trechos na API. Os trechos novos começam como "não verificados" e ganham nota conforme as pessoas relatam e confirmam o que encontram.
- **Rotas ranqueadas** com nota de 0 a 100, tempo ajustado pelos obstáculos, rota recomendada, rotas com "Atenção" e rotas com "Informações insuficientes".
- **Mapa** com cada trecho colorido pela acessibilidade.
- **Resumo da rota** com pontos de apoio, obstáculos, composição da nota de cada trecho, relatos e tempo extra por trecho.
- **Navegação passo a passo** pelos trechos, com avisos de obstáculos e inclinação.
- **Confirmar relato**: confirmar, informar que foi resolvido ou que está incorreto; trocar ou desfazer o voto.
- **Novo problema**: marcar o ponto no mapa (toque, arraste ou localização do aparelho), escolher o tipo, descrever e anexar foto (reduzida no navegador antes do envio).
- **Perfil**: editar nome e perfil, preferências de rota, rotas recentes (abrir/remover), **meus relatos** (editar descrição e excluir).
- **Contribuir com o mapa em qualquer ponto do Rio**: tocando no mapa, buscando um endereço (com sugestões) ou usando a localização do aparelho. Perto de um trecho de rota salvo, o relato fica ligado a ele e o app mostra quanto mexeu na nota. Longe de qualquer rota, o relato é salvo com a localização e o nome do lugar (do endereço escolhido ou da busca reversa do Photon). Ele passa a valer para **toda rota que passar a até 25 m dali**, inclusive rotas calculadas depois.

### CRUD completo

| Recurso | Create | Read | Update | Delete |
|---|---|---|---|---|
| Relatos (`/reports`) | Novo problema, Contribuir | Rotas, trechos, Meus relatos | Editar descrição | Excluir (remove os votos junto) |
| Votos (`/votes`) | Confirmar / Resolvido / Incorreta | Contagem e status | Trocar o voto | Desfazer voto |
| Buscas recentes (`/searches`) | Buscar rotas | Rotas recentes | — | Remover da lista |
| Usuário (`/users`) | — (seed) | Perfil | Perfil, nome, preferências | — |

---

## Arquitetura

O código é dividido em camadas. Cada camada só conhece a de baixo.

```
┌──────────────────────────────────────────────────────────────┐
│ Apresentação   src/pages/, src/components/  (Tailwind)       │  JSX, sem regra de negócio
├──────────────────────────────────────────────────────────────┤
│ Estado         src/hooks/, src/context/                      │  custom hooks orquestram dados + regras
├──────────────────────────────────────────────────────────────┤
│ Negócio        src/domain/                                   │  funções puras, testadas
├──────────────────────────────────────────────────────────────┤
│ Dados          src/services/  →  src/api/                    │  API REST, OSRM, Photon (OSM) 
├──────────────────────────────────────────────────────────────┤
│ API REST       server/ (local)  ·  api/ (Vercel)  ·  shared/ │  CRUD genérico, validação, cascata
└──────────────────────────────────────────────────────────────┘
```

```
acessario/
├── api/index.js            Vercel Function: a API REST em produção
├── server/
│   ├── index.js            servidor HTTP local (npm run api)
│   ├── handler.js          ponte entre HTTP e o núcleo REST (fila de gravações, leitura da rota)
│   ├── stores.js           onde o banco fica: arquivo (local), memória ou Vercel Blob
│   └── reset.js            recria o banco local
├── shared/
│   ├── restCore.js         núcleo REST usado pelo servidor, pela Vercel e pelo modo demonstração
│   └── seed.js             dados fictícios com datas relativas
├── vercel.json             encaminha /api/<rota> para a função
├── src/
│   ├── api/                httpClient, localClient, ApiError, client (escolhe o modo)
│   ├── services/           usersService, placesService, routesService, reportsService,
│   │                       searchesService, networkService, geocodingService (Photon),
│   │                       routingService (rotas a pé no OSRM)
│   ├── domain/             profiles, reportTypes, reportStatus, scoring, geo, summary,
│   │                       routePlanning (resposta do roteador → rotas e trechos)
│   ├── hooks/              useAsync, useHashRouter, useRouteOptions, useRouteDetail,
│   │                       useReportActions, useMyReports, useContribution, usePlaces,
│   │                       useRecentSearches, useAddressAutocomplete, usePhotoPicker, useEvaluationContext,
│   │                       useLeafletMap (mapa, eventos e camadas do Leaflet)
│   ├── context/            UserContext (usuário + atualização otimista), ThemeContext, ToastContext
│   ├── components/
│   │   ├── ui/             Button, Badge, Card/Notice, Field, Icon, IconButton, Toggle, Tabs,
│   │   │                   ChoiceGrid, ScoreRing, Modal, PhotoField, ThemeToggle, States
│   │   ├── layout/         AppShell/Page/Bleed, TopBar, BottomNav, RioScene
│   │   ├── map/            AccessMap, LeafletRouteMap, CityMap (esquemático), MapFrame,
│   │   │                   mapAdapters, mapGeometry, projection
│   │   ├── places/         PlaceSearchBox (busca de lugares com sugestões, usada em dois lugares)
│   │   ├── routes/         RouteCard, SegmentDetail, PlaceInput
│   │   └── reports/        ReportVoteCard, NewReportForm, ContributeForm, LocationPicker…
│   ├── pages/              uma página por tela do protótipo
│   ├── styles/index.css    Tailwind + tokens de cor dos temas
│   ├── utils/              cn (junta classes), formatação, redução de imagem
│   ├── App.jsx             tabela de rotas e guarda de onboarding
│   └── main.jsx
└── tests/                  node:test para domínio, API, servidor e mapa
```

### Decisões

- **Custom hooks como fronteira.** As páginas não chamam a API nem calculam notas: chamam hooks como `useRouteOptions(origem, destino)`, que buscam os dados pelos serviços e aplicam as regras do domínio com `useMemo`. Trocar o perfil recalcula as notas sem nova requisição.
- **Domínio puro.** `src/domain/` não importa React nem a API; recebe dados e devolve avaliações. Por isso é testável com `node --test`, sem navegador.
- **Um núcleo REST, três lugares.** `shared/restCore.js` roda no servidor local, na Vercel Function e no navegador (modo demonstração). Só muda onde o banco é guardado (`server/stores.js`).
- **Mapa intercambiável.** `AccessMap` recebe trechos em `[lat, lon]` e escolhe entre o OpenStreetMap e o esquemático. As páginas não sabem qual dos dois está na tela.
- **Leaflet fora do React.** O mapa, as linhas e os marcadores são objetos do Leaflet. O hook `useLeafletMap` cria o mapa, `useLayerGroup` agrupa os desenhos de cada efeito e `useMapEvent` registra eventos. Tudo é limpo nos efeitos, evitando vazamentos ao trocar de tela.
- **Atualização otimista** no usuário (preferências e perfil) e nas buscas recentes, com volta ao estado anterior se a API falhar.
- **Respostas atrasadas são descartadas** em `useAsync`, evitando que uma rota antiga sobrescreva a atual.

---

## Estilização com Tailwind

- **Tailwind CSS v4** com o plugin `@tailwindcss/vite`. O arquivo de entrada é `src/styles/index.css`.
- As cores do app são **variáveis CSS** registradas como cores do Tailwind em `@theme inline` (`bg-surface`, `text-ink`, `text-ink-soft`, `border-line`, `bg-brand`, `text-ok`, `bg-warn-soft`, …). O tema escuro só redefine essas variáveis, então os componentes **não precisam de `dark:`**: a mesma classe serve aos dois temas.
- O tema segue `data-theme` no `<html>` (Claro/Escuro) ou `prefers-color-scheme` (Automático).
- Padrões repetidos viram **componentes React** em vez de classes globais: `Button` (variantes e tamanhos), `Badge`, `Card`, `Notice`, `SectionTitle`, `TextInput`/`TextArea`, `Page`. O utilitário `cn()` junta classes condicionais.
- Estados com variantes do Tailwind: `has-checked:` nos cartões de escolha, `peer-checked:` no interruptor, `aria-selected:` nas abas, `aria-pressed:` nos trechos.

---

## API REST

Servidor local em `server/index.js` (porta `3001`); em produção, `/api` no mesmo domínio. Todas as coleções aceitam:

| Método | Caminho | Descrição |
|---|---|---|
| `GET` | `/:colecao` | Lista. Filtros `?campo=valor` (repetir a chave faz "ou": `?segmentId=a&segmentId=b`), `_sort`, `_order=desc`, `_limit`, `q` (texto) |
| `GET` | `/:colecao/:id` | Item |
| `POST` | `/:colecao` | Cria (valida campos obrigatórios → `422`) |
| `PUT` | `/:colecao/:id` | Substitui |
| `PATCH` | `/:colecao/:id` | Atualiza parte |
| `DELETE` | `/:colecao/:id` | Remove (em cascata: rota → trechos → relatos → votos; usuário → votos e buscas) |

Coleções: `users`, `places`, `routes`, `segments`, `reports`, `votes`, `searches`.

Exemplos:

```bash
curl "http://localhost:3001/routes?originId=p-siqueira&destinationId=p-riosul"
curl "https://acessario.vercel.app/api/reports?segmentId=r1-t04"
curl -X POST http://localhost:3001/votes -H "Content-Type: application/json" \
  -d '{"reportId":"rep-002","userId":"u-jose","type":"confirm"}'
```

### Modelo de dados

| Coleção | Campos principais |
|---|---|
| `users` | `name`, `profile`, `preferences { avoidStairs, preferFlat, includeSupportPoints }` |
| `places` | `name`, `neighborhood`, `lat`, `lon`, `osmId` (lugares vindos da busca) |
| `routes` | `name`, `via`, `originId`, `destinationId`, `distanceKm`, `baseMinutes`, `source` (`osm` quando calculada pelo roteador) |
| `segments` | `routeId`, `order`, `street`, `lengthM`, `widthM`, `slopePct`, `hasStairs`, `hasRamps`, `floor`, `tactile`, `supportPoints`, `surveyedAt`, `path [[lat, lon]]` |
| `reports` | `segmentId` (ou `null`), `location { lat, lon }`, `placeName`, `kind` (`obstacle`/`facilitator`), `type`, `description`, `photo`, `userId`, `createdAt`. Precisa de `segmentId` **ou** `location` |
| `votes` | `reportId`, `userId`, `type` (`confirm`/`resolved`/`incorrect`), `createdAt` |
| `searches` | `userId`, `originId`, `destinationId`, `createdAt` |

Os atributos dos trechos representam o levantamento base (a proposta do projeto é obtê-los com câmeras e visão computacional); `surveyedAt` é a data dessa verificação. Nos trechos calculados pelo roteador, esses atributos ficam `null` ("Não informado") e não somam nem tiram pontos.

### APIs externas

- **OpenStreetMap**: tiles do mapa-base (ver [Mapa](#mapa-openstreetmap)).
- **OSRM (roteador do OpenStreetMap)**: rotas a pé entre dois lugares, no servidor público da FOSSGIS (`routing.openstreetmap.de/routed-foot`), o mesmo usado pelo site openstreetmap.org. Só é chamado na primeira busca de um trajeto; depois, as rotas vêm da API. Endereço configurável em `VITE_ROUTING_URL`.
- **Photon (OpenStreetMap)**: sugestões de lugares e endereços enquanto se digita, na origem/destino e em "Contribuir com o mapa", limitadas ao município do Rio de Janeiro. O app espera 350 ms sem digitar antes de buscar, cancela buscas antigas e guarda os resultados em cache, para respeitar o uso justo do serviço. A Nominatim não foi usada aqui porque as regras dela proíbem autocompletar. Endereço configurável em `VITE_GEOCODING_URL`. A busca só acontece quando a pessoa clica em "Buscar", respeitando o limite de 1 requisição por segundo.

---

## Regras de negócio

Tudo em `src/domain/`, com testes em `tests/`.

### Status de um relato (`reportStatus.js`)

```
não verificado ──1 confirmação──▶ em confirmação ──5 confirmações──▶ confirmado
       └──── 2+ votos "resolvido" ou "incorreta" (e mais que as confirmações) ────▶ resolvido / incorreto
```

- Confiabilidade: confirmado = alta, em confirmação = média, não verificado = baixa.
- Peso na nota: confirmado 100%, em confirmação 50%, não verificado 25%, resolvido/incorreto 0%.
- Sem atividade há mais de 30 dias → **possivelmente desatualizado**.
- Uma pessoa tem no máximo um voto por relato (votar de novo troca o voto).

### Nota do trecho (`scoring.js`)

Começa em 65 e soma pontos do levantamento, ponderados pelo perfil:

| Característica | Pontos (peso 1) |
|---|---|
| Escadas / sem escadas | −45 / +8 |
| Rampa adequada / sem rampa | +10 / −6 |
| Calçada ≥ 1,40 m / < 1,20 m | +6 / −15 |
| Piso regular / irregular | +4 / −8 |
| Piso tátil / sem piso tátil | +10 / −5 (só pesa para deficiência visual) |
| Inclinação acima de 2% | −1,5 por ponto percentual (×1,5 com "Priorizar rotas planas") |

Depois, cada relato ativo soma (facilidade) ou subtrai (obstáculo) seus pontos × peso do perfil × peso do status. Entram os relatos do próprio trecho e os relatos com localização a até 25 m dele (`attachReportsToSegments` em `domain/geo.js`). Assim, relatos feitos em qualquer ponto, ou numa rota que passa pela mesma rua, valem para todas as rotas que passam por ali. Um relato de inclinação não é contado de novo se a inclinação já foi medida no levantamento.

### Nota e tempo da rota

- Nota = 85% média dos trechos ponderada pelo comprimento + 15% do pior trecho (um trecho ruim compromete o caminho).
- Só recebe nota se pelo menos 50% do comprimento tiver dados verificados (levantamento com menos de 180 dias ou relato confirmado); senão, "Informações insuficientes".
- Tempo = tempo base + atrasos por inclinação ≥ 6%, piso irregular e obstáculos com confiabilidade média ou alta.
- Trecho **impedido** para cadeirante: escadas, ou relato confiável de rampa bloqueada/escadas.
- **Recomendada**: maior nota entre as rotas com dados suficientes, não impedidas e sem escadas (quando "Evitar escadas" está ligado).

---

## Testes

```bash
npm test
```

37 testes com `node:test` cobrem: relatos ligados a rotas pela localização, relatos só com localização na API, conversão dos lugares do Photon (incluindo endereços sem nome), conversão das rotas do roteador em trechos, trechos sem levantamento, gravação e cascata de rotas, ciclo de status dos relatos, desatualização, peso dos relatos, bloqueio por perfil, preferência por rotas planas, impacto de um relato na nota, ranqueamento com os dados de demonstração, rota no sentido inverso, CRUD/validação/cascata da API, leitura de rotas da Vercel Function, armazenamento no Blob (com um Blob simulado), enquadramento do mapa e localização do trecho mais próximo.

---

## Acessibilidade

- Alvos de toque com no mínimo 44 px; foco visível em todos os controles.
- Formulários com rótulos, mensagens de erro anunciadas (`role="alert"`) e avisos em região viva.
- Abas navegáveis por setas; combobox de lugares com teclado. No mapa de escolha de ponto, o alfinete se move com as setas do teclado.
- Cor nunca é a única informação: status sempre vem escrito (ex.: "Em confirmação"), e trechos não verificados são tracejados.
- Modo escuro com contraste ajustado; respeita `prefers-reduced-motion`.

---

## Limitações e próximos passos

- Não há autenticação: o usuário é fixo (`VITE_USER_ID`).
- Rotas calculadas pelo roteador começam sem dados de acessibilidade. O próximo passo seria ler as etiquetas de acessibilidade do próprio OpenStreetMap (`highway=steps`, `incline`, `surface`, `kerb`, `wheelchair`) pela Overpass API e preencher o levantamento inicial dos trechos.
- O roteador público usa o perfil a pé padrão, que não evita escadas. As regras do app avisam quando um trecho tem escadas relatadas, mas o caminho em si não muda.
- O banco no Vercel Blob é um arquivo JSON público com nome difícil de adivinhar. Funciona para a demonstração; com usuários reais, o ideal é um banco de dados (ex.: Postgres) e fotos em armazenamento privado.
- Duas gravações exatamente ao mesmo tempo em instâncias diferentes da função: vale a última.
- A coleta automática por câmeras e visão computacional, prevista no projeto, está representada apenas pelos atributos dos trechos (`surveyedAt`).
