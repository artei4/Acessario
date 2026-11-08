# AcessaRio — navegação urbana inclusiva

Aplicativo web (React) que encontra rotas a pé considerando a **acessibilidade** do caminho — calçadas, rampas, escadas, inclinação e obstáculos — e deixa os **próprios usuários** relatarem e confirmarem as condições das ruas. Cada relato muda a nota e o tempo estimado das rotas para quem tem mobilidade reduzida.

> Os dados de demonstração cobrem o trajeto **Rua Siqueira Campos (Copacabana) ↔ Shopping Rio Sul (Botafogo)**. Todas as informações são fictícias.

---

## Sumário

1. [Telas](#telas)
2. [Como rodar](#como-rodar)
3. [Funcionalidades](#funcionalidades)
4. [Arquitetura](#arquitetura)
5. [API REST](#api-rest)
6. [Regras de negócio](#regras-de-negócio)
7. [Testes](#testes)
8. [Acessibilidade](#acessibilidade)
9. [Limitações e próximos passos](#limitações-e-próximos-passos)

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
npm run api:reset   # cria server/db.json com os dados de demonstração
npm start           # sobe a API (porta 3001) e o front (porta 5173) juntos
```

Abra <http://localhost:5173>. Na primeira vez, o app pede o perfil de mobilidade (tela 1).

Para subir separadamente:

```bash
npm run api   # API REST em http://localhost:3001
npm run dev   # front em http://localhost:5173
```

### Variáveis de ambiente

Copie `.env.example` para `.env` se quiser mudar algo:

| Variável | Padrão | Para que serve |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3001` | Endereço da API REST |
| `VITE_API_MODE` | `http` | `http` usa a API; `local` roda o mesmo núcleo REST dentro do navegador (localStorage), útil para demonstrar sem servidor |
| `VITE_USER_ID` | `u-jose` | Usuário da demonstração (não há login) |

### Scripts

| Script | O que faz |
|---|---|
| `npm start` | API + front ao mesmo tempo |
| `npm run dev` | Só o front (Vite) |
| `npm run api` | Só a API REST |
| `npm run api:reset` | Recria o banco com os dados de demonstração (datas relativas a hoje) |
| `npm test` | Testes das regras de negócio e da API (`node:test`, sem dependências) |
| `npm run build` | Build de produção em `dist/` |

---

## Funcionalidades

- **Perfil de mobilidade** (cadeirante, mobilidade reduzida, deficiência visual, idoso): muda o peso de cada característica do caminho na nota.
- **Busca de destino** com sugestões, inversão de origem/destino e resumo dos relatos recentes no trajeto.
- **Rotas ranqueadas** com nota de 0 a 100, tempo ajustado pelos obstáculos, rota recomendada, rotas com "Atenção" e rotas com "Informações insuficientes".
- **Mapa** com cada trecho colorido pela acessibilidade (boa, com limitações, dificuldade alta, não verificado).
- **Resumo da rota** com pontos de apoio, obstáculos, composição da nota de cada trecho, relatos e tempo extra por trecho.
- **Navegação passo a passo** pelos trechos, com avisos de obstáculos e inclinação.
- **Confirmar relato**: confirmar, informar que foi resolvido ou que está incorreto; trocar ou desfazer o voto.
- **Novo problema**: marcar o ponto no mapa (toque, arraste, setas do teclado ou localização do aparelho), escolher o tipo, descrever e anexar foto (reduzida no navegador antes do envio).
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
│ Apresentação   src/pages/, src/components/                   │  JSX, sem regra de negócio
├──────────────────────────────────────────────────────────────┤
│ Estado         src/hooks/, src/context/                      │  custom hooks orquestram dados + regras
├──────────────────────────────────────────────────────────────┤
│ Negócio        src/domain/                                   │  funções puras, testadas
├──────────────────────────────────────────────────────────────┤
│ Dados          src/services/  →  src/api/                    │  um serviço por recurso; cliente HTTP
├──────────────────────────────────────────────────────────────┤
│ API REST       server/  +  shared/restCore.js                │  CRUD genérico, validação, cascata
└──────────────────────────────────────────────────────────────┘
```

```
acessario/
├── server/                 API REST (Node puro, sem dependências)
│   ├── index.js            servidor HTTP, CORS, persistência em db.json
│   └── reset.js            recria o banco com os dados de demonstração
├── shared/
│   ├── restCore.js         núcleo REST usado pelo servidor e pelo modo "local"
│   └── seed.js             dados fictícios com datas relativas
├── src/
│   ├── api/                httpClient, localClient, ApiError, client (escolhe o modo)
│   ├── services/           usersService, placesService, routesService, reportsService,
│   │                       searchesService, networkService, geocodingService (Nominatim)
│   ├── domain/             profiles, reportTypes, reportStatus, scoring, geo, summary
│   ├── hooks/              useAsync, useHashRouter, useRouteOptions, useRouteDetail,
│   │                       useReportActions, useMyReports, useContribution, usePlaces,
│   │                       useRecentSearches, useGeocoding, usePhotoPicker, useEvaluationContext
│   ├── context/            UserContext (usuário + atualização otimista), ToastContext
│   ├── components/
│   │   ├── ui/             Button, Badge, Icon, Toggle, Tabs, ChoiceGrid, ScoreRing, Modal…
│   │   ├── layout/         TopBar, BottomNav, RioScene
│   │   ├── map/            CityMap (SVG), projection, mapAdapters
│   │   ├── routes/         RouteCard, SegmentDetail, PlaceInput
│   │   └── reports/        ReportVoteCard, NewReportForm, ContributeForm, LocationPicker…
│   ├── pages/              uma página por tela do protótipo
│   ├── styles/global.css   tokens de cor e estilos
│   ├── utils/              formatação e redução de imagem
│   ├── App.jsx             tabela de rotas e guarda de onboarding
│   └── main.jsx
└── tests/                  node:test para domínio e API
```

### Decisões

- **Custom hooks como fronteira.** As páginas não chamam a API nem calculam notas: chamam hooks como `useRouteOptions(origem, destino)`, que buscam os dados pelos serviços e aplicam as regras do domínio com `useMemo`. Trocar o perfil recalcula as notas sem nova requisição.
- **Domínio puro.** `src/domain/` não importa React nem a API; recebe dados e devolve avaliações. Por isso é testável com `node --test`, sem navegador.
- **Um núcleo REST para dois modos.** `shared/restCore.js` é o mesmo código no servidor e no modo `local`, então a demonstração sem servidor se comporta exatamente como a API.
- **Sem bibliotecas de roteamento ou mapa.** Roteamento por hash (`useHashRouter`, com `useSyncExternalStore`) e mapa esquemático em SVG mantêm o projeto pequeno. `CityMap` recebe trechos em `[lat, lon]`, então trocá-lo por Leaflet/MapLibre não afeta o resto.
- **Atualização otimista** no usuário (preferências e perfil) e nas buscas recentes, com volta ao estado anterior se a API falhar.
- **Respostas atrasadas são descartadas** em `useAsync`, evitando que uma rota antiga sobrescreva a atual.

---

## API REST

Servidor em `server/index.js`, porta `3001`. Todas as coleções aceitam:

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
curl "http://localhost:3001/reports?segmentId=r1-t04"
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

### API externa de geocodificação

`src/services/geocodingService.js` consulta a **Nominatim** (`nominatim.openstreetmap.org/search`) limitada à área de Botafogo/Copacabana. A busca só acontece quando a pessoa clica em "Buscar", respeitando o limite de 1 requisição por segundo da política de uso.

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

20 testes com `node:test` cobrem: ciclo de status dos relatos, desatualização, peso dos relatos, bloqueio por perfil, preferência por rotas planas, impacto de um relato na nota, ranqueamento com os dados de demonstração, rota no sentido inverso, CRUD/validação/cascata da API e localização do trecho mais próximo.

---

## Acessibilidade

- Alvos de toque com no mínimo 44 px; foco visível em todos os controles.
- Formulários com rótulos, mensagens de erro anunciadas (`role="alert"`) e avisos em região viva.
- Abas navegáveis por setas; combobox de lugares com teclado; o marcador do mapa se move com as setas.
- Cor nunca é a única informação: status sempre vem escrito (ex.: "Em confirmação").
- Respeita `prefers-reduced-motion`.

---

## Limitações e próximos passos

- Não há autenticação: o usuário é fixo (`VITE_USER_ID`).
- O mapa é esquemático; o próximo passo seria Leaflet/MapLibre com tiles do OpenStreetMap.
- As rotas são pré-cadastradas; um roteador real (ex.: OSRM ou GraphHopper com perfil "foot") geraria rotas para qualquer par de endereços.
- Fotos ficam em base64 no banco JSON; em produção iriam para um armazenamento de arquivos.
- A coleta automática por câmeras e visão computacional, prevista no projeto, está representada apenas pelos atributos dos trechos (`surveyedAt`).
