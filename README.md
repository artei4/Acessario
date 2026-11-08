# AcessaRio — navegação urbana inclusiva

Aplicativo web (React) que encontra rotas a pé considerando a **acessibilidade** do caminho — calçadas, rampas, escadas, inclinação e obstáculos — e deixa os **próprios usuários** relatarem e confirmarem as condições das ruas. Cada relato muda a nota e o tempo estimado das rotas para quem tem mobilidade reduzida.

> Os dados de demonstração cobrem o trajeto **Rua Siqueira Campos (Copacabana) ↔ Shopping Rio Sul (Botafogo)**. Todas as informações são fictícias.

**Stack:** React 19 · Vite · Tailwind CSS v4 · Google Maps JavaScript API · API REST em Node (local) / Vercel Functions + Vercel Blob (produção).

---

## Sumário

1. [Telas](#telas)
2. [Como rodar](#como-rodar)
3. [Google Maps](#google-maps)
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
cp .env.example .env   # opcional: coloque aqui a chave do Google Maps
npm run api:reset      # cria server/db.json com os dados de demonstração
npm start              # sobe a API (porta 3001) e o app (porta 5173) juntos
```

Abra <http://localhost:5173>. Na primeira vez, o app pede o perfil de mobilidade (tela 1).

Sem chave do Google Maps, o app funciona normalmente com um **mapa esquemático** em SVG. Veja [Google Maps](#google-maps) para usar o mapa real.

### Sem servidor (modo demonstração)

```bash
npm run dev:demo
```

O mesmo núcleo REST da API (`shared/restCore.js`) roda dentro do navegador e os dados ficam no `localStorage`. Todas as funções continuam funcionando. No Perfil, "Restaurar dados de demonstração" volta ao estado inicial.

### Variáveis de ambiente

| Variável | Padrão | Para que serve |
|---|---|---|
| `VITE_GOOGLE_MAPS_API_KEY` | — | Chave da Google Maps JavaScript API. Sem ela, mapa esquemático |
| `VITE_GOOGLE_MAPS_MAP_ID` | `DEMO_MAP_ID` | Map ID do Google Cloud (marcadores avançados e tema escuro) |
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

## Google Maps

O mapa usa a **Google Maps JavaScript API**, carregada pelo carregador oficial do Google ("Dynamic Library Import") em `src/services/googleMapsLoader.js`.

### Como obter a chave

1. No [Google Cloud Console](https://console.cloud.google.com/), crie um projeto (ou use um existente) e ative o faturamento. A API tem cota mensal gratuita.
2. Em **APIs e serviços → Biblioteca**, ative a **Maps JavaScript API**.
3. Em **APIs e serviços → Credenciais**, crie uma **chave de API**.
4. **Restrinja a chave**: em "Restrições de aplicativo", escolha *Referenciadores HTTP* e adicione `http://localhost:5173/*` e `https://acessario.vercel.app/*`. Em "Restrições de API", deixe só a Maps JavaScript API. A chave fica visível no navegador, então a restrição é o que impede o uso por outros sites.
5. (Opcional) Em **Google Maps Platform → Gerenciamento de mapas**, crie um **Map ID** do tipo JavaScript. `DEMO_MAP_ID` funciona para desenvolvimento.
6. Coloque a chave em `.env` (`VITE_GOOGLE_MAPS_API_KEY=...`) e, na Vercel, em *Settings → Environment Variables*.

### O que o mapa faz

- Cada trecho da rota é uma `google.maps.Polyline` colorida pela acessibilidade: verde (boa), laranja (com limitações), vermelha (dificuldade alta) e cinza tracejada (não verificado).
- Origem, destino, números dos trechos e rótulos das rotas são `AdvancedMarkerElement`.
- Na tela 3, tocar numa linha seleciona a rota.
- Ao relatar (telas 5B e 6), tocar no mapa marca o ponto, e o alfinete (`PinElement`) pode ser arrastado. O app encontra o trecho mais próximo do ponto.
- No modo escuro, o mapa é recriado com `colorScheme: DARK`.
- Se a chave faltar ou for recusada (`gm_authFailure`), o app usa o mapa esquemático sem quebrar a tela.

Arquivos: `services/googleMapsLoader.js` (carregamento), `hooks/useGoogleMapsApi.js`, `hooks/useGoogleMap.js` (instância e eventos), `components/map/GoogleRouteMap.jsx` (desenho), `components/map/AccessMap.jsx` (escolhe Google ou esquemático), `components/map/CityMap.jsx` (esquemático).

---

## Publicação na Vercel

O projeto `acessario` na Vercel publica a branch `main` do GitHub (`artei4/Acessario`).

- **Site:** `vite build` gera `dist/`.
- **API:** `api/index.js` é uma **Vercel Function**. O `vercel.json` encaminha `/api/<rota>` para ela, que usa o mesmo núcleo REST do servidor local. O app publicado chama `/api` no mesmo domínio.
- **Dados:** ficam no **Vercel Blob** (`acessario-dados`). Cada gravação salva uma versão nova do banco (`acessario-db/<data>.json`) e as antigas são apagadas aos poucos. Assim, a leitura nunca pega uma versão em cache. O banco é criado com os dados de demonstração no primeiro acesso.
- Sem `BLOB_READ_WRITE_TOKEN`, a função guarda os dados só na memória, e eles voltam ao início de tempos em tempos. O cabeçalho `X-AcessaRio-Store` informa qual armazenamento está em uso (`blob` ou `memory`).
- Para o Google Maps funcionar no site publicado, adicione `VITE_GOOGLE_MAPS_API_KEY` nas variáveis do projeto e publique de novo. O Vite embute a variável no build.

---

## Funcionalidades

- **Modo claro e escuro**: botão de sol/lua nas telas 1 e 2 e escolha entre Claro, Escuro e Automático em Perfil → Aparência. A escolha fica salva no navegador, e o Google Maps acompanha o tema.
- **Perfil de mobilidade** (cadeirante, mobilidade reduzida, deficiência visual, idoso): muda o peso de cada característica do caminho na nota.
- **Busca de destino** com sugestões, inversão de origem/destino e resumo dos relatos recentes no trajeto.
- **Rotas ranqueadas** com nota de 0 a 100, tempo ajustado pelos obstáculos, rota recomendada, rotas com "Atenção" e rotas com "Informações insuficientes".
- **Mapa** com cada trecho colorido pela acessibilidade.
- **Resumo da rota** com pontos de apoio, obstáculos, composição da nota de cada trecho, relatos e tempo extra por trecho.
- **Navegação passo a passo** pelos trechos, com avisos de obstáculos e inclinação.
- **Confirmar relato**: confirmar, informar que foi resolvido ou que está incorreto; trocar ou desfazer o voto.
- **Novo problema**: marcar o ponto no mapa (toque, arraste ou localização do aparelho), escolher o tipo, descrever e anexar foto (reduzida no navegador antes do envio).
- **Perfil**: editar nome e perfil, preferências de rota, rotas recentes (abrir/remover), **meus relatos** (editar descrição e excluir).
- **Contribuir com o mapa** em qualquer trecho, com busca de endereço pela **API Nominatim (OpenStreetMap)**, e retorno de quanto o relato mexeu na nota do trecho.

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
│ Dados          src/services/  →  src/api/                    │  API REST, Google Maps, Nominatim
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
│   │                       searchesService, networkService, geocodingService (Nominatim),
│   │                       googleMapsLoader (Google Maps JavaScript API)
│   ├── domain/             profiles, reportTypes, reportStatus, scoring, geo, summary
│   ├── hooks/              useAsync, useHashRouter, useRouteOptions, useRouteDetail,
│   │                       useReportActions, useMyReports, useContribution, usePlaces,
│   │                       useRecentSearches, useGeocoding, usePhotoPicker, useEvaluationContext,
│   │                       useGoogleMapsApi, useGoogleMap
│   ├── context/            UserContext (usuário + atualização otimista), ThemeContext, ToastContext
│   ├── components/
│   │   ├── ui/             Button, Badge, Card/Notice, Field, Icon, IconButton, Toggle, Tabs,
│   │   │                   ChoiceGrid, ScoreRing, Modal, PhotoField, ThemeToggle, States
│   │   ├── layout/         AppShell/Page/Bleed, TopBar, BottomNav, RioScene
│   │   ├── map/            AccessMap, GoogleRouteMap, CityMap (esquemático), MapFrame,
│   │   │                   mapAdapters, mapGeometry, projection
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
- **Mapa intercambiável.** `AccessMap` recebe trechos em `[lat, lon]` e escolhe entre o Google Maps e o esquemático. As páginas não sabem qual dos dois está na tela.
- **Google Maps fora do React.** O mapa e os overlays (linhas e marcadores) são objetos do Google. Os hooks `useGoogleMap` e `useMapListener` criam e limpam esses objetos nos efeitos, evitando vazamentos ao trocar de tela.
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
| `DELETE` | `/:colecao/:id` | Remove (em cascata: relato → votos; usuário → votos e buscas) |

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
| `places` | `name`, `neighborhood`, `lat`, `lon` |
| `routes` | `name`, `via`, `originId`, `destinationId`, `distanceKm`, `baseMinutes` |
| `segments` | `routeId`, `order`, `street`, `lengthM`, `widthM`, `slopePct`, `hasStairs`, `hasRamps`, `floor`, `tactile`, `supportPoints`, `surveyedAt`, `path [[lat, lon]]` |
| `reports` | `segmentId`, `kind` (`obstacle`/`facilitator`), `type`, `description`, `photo`, `location`, `userId`, `createdAt` |
| `votes` | `reportId`, `userId`, `type` (`confirm`/`resolved`/`incorrect`), `createdAt` |
| `searches` | `userId`, `originId`, `destinationId`, `createdAt` |

Os atributos dos trechos representam o levantamento base (a proposta do projeto é obtê-los com câmeras e visão computacional); `surveyedAt` é a data dessa verificação.

### APIs externas

- **Google Maps JavaScript API**: mapa, linhas e marcadores (ver [Google Maps](#google-maps)).
- **Nominatim (OpenStreetMap)**: busca de endereço em "Contribuir com o mapa", limitada a Botafogo/Copacabana. A busca só acontece quando a pessoa clica em "Buscar", respeitando o limite de 1 requisição por segundo.

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

Depois, cada relato ativo soma (facilidade) ou subtrai (obstáculo) seus pontos × peso do perfil × peso do status. Um relato de inclinação não é contado de novo se a inclinação já foi medida no levantamento.

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

26 testes com `node:test` cobrem: ciclo de status dos relatos, desatualização, peso dos relatos, bloqueio por perfil, preferência por rotas planas, impacto de um relato na nota, ranqueamento com os dados de demonstração, rota no sentido inverso, CRUD/validação/cascata da API, leitura de rotas da Vercel Function, armazenamento no Blob (com um Blob simulado), conversão de coordenadas para o Google Maps e localização do trecho mais próximo.

---

## Acessibilidade

- Alvos de toque com no mínimo 44 px; foco visível em todos os controles.
- Formulários com rótulos, mensagens de erro anunciadas (`role="alert"`) e avisos em região viva.
- Abas navegáveis por setas; combobox de lugares com teclado. No mapa esquemático, o marcador se move com as setas; no Google Maps, o alfinete arrastável também aceita teclado.
- Cor nunca é a única informação: status sempre vem escrito (ex.: "Em confirmação"), e trechos não verificados são tracejados.
- Modo escuro com contraste ajustado; respeita `prefers-reduced-motion`.

---

## Limitações e próximos passos

- Não há autenticação: o usuário é fixo (`VITE_USER_ID`).
- As rotas são pré-cadastradas. A **Directions API** do Google (modo `WALKING`) poderia gerar rotas para qualquer par de endereços, com as regras de acessibilidade aplicadas por cima.
- O banco no Vercel Blob é um arquivo JSON público com nome difícil de adivinhar. Funciona para a demonstração; com usuários reais, o ideal é um banco de dados (ex.: Postgres) e fotos em armazenamento privado.
- Duas gravações exatamente ao mesmo tempo em instâncias diferentes da função: vale a última.
- A coleta automática por câmeras e visão computacional, prevista no projeto, está representada apenas pelos atributos dos trechos (`surveyedAt`).
