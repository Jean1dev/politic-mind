# Documentação Técnica — Politic Mind

> Objetivo: Engenharia reversa completa do sistema para replicação em outro contexto de domínio.

---

## Visão Geral

**Politic Mind** é uma plataforma de pesquisa política potencializada por IA. O usuário conversa com um chat que pode buscar dados de parlamentares, gerar e editar documentos (texto, código, imagem, planilha), solicitar sugestões de escrita e consultar estratégias financeiras — tudo dentro de uma interface conversacional unificada.

O monorepo contém quatro serviços independentes:

| Serviço | Pasta | Stack | Porta |
|---------|-------|-------|-------|
| Frontend + Backend principal | `front-politicai/` | Next.js 15, React 19, Vercel AI SDK | 3000 |
| Agente LangChain | `agent/` | Node.js, LangChain, LangGraph, Express | 8081 |
| API de busca vetorial | `politic-ai-api/` | Fastify, Upstash Vector, LangChain | 8081 |
| Infraestrutura de dados | `data-scrap/`, `big-query/`, `upstach-vector-data/`, `ai-task-scheduler/` | Scripts Python/JS | — |

---

## 1. Estrutura do Monorepo

```
politic-mind/
├── front-politicai/          # Aplicação principal (Next.js)
│   ├── app/
│   │   ├── (auth)/           # Rotas de login/registro
│   │   ├── (chat)/           # Interface de chat + API routes
│   │   └── (pricing)/        # Planos de assinatura
│   ├── blocks/               # Handlers de documentos (texto, código, imagem, planilha)
│   ├── components/           # Componentes React
│   ├── lib/
│   │   ├── ai/               # Modelos, prompts e ferramentas de IA
│   │   ├── blocks/           # Orquestrador de blocks (server-side)
│   │   ├── cache/            # Redis / in-memory cache
│   │   ├── db/               # Schema Drizzle ORM + queries MySQL
│   │   └── functions/        # Limite de requisições, pagamento
│   └── hooks/                # React hooks customizados
├── agent/                    # Agente LangChain (serviço separado)
│   ├── src/
│   │   ├── agent.js          # Agente com memória Redis
│   │   └── langgraph/        # Agente baseado em grafo de estado
│   ├── vector-store/         # Upstash Vector Store + formatação de dados
│   └── in-memory/            # Agente alternativo com MemoryVectorStore
├── politic-ai-api/           # API Fastify para busca semântica
│   └── src/
│       ├── api.ts            # Endpoints Fastify
│       └── lib/              # Upstash + S3 content fetching
├── docker-compose.yml        # Orquestração dos serviços
└── data-scrap/               # Scripts de coleta de dados políticos
```

---

## 2. Banco de Dados (MySQL + Drizzle ORM)

Arquivo: `front-politicai/lib/db/schema.ts`

### Tabelas

#### `User`
```
id          varchar(36) PK
email       varchar(64) UNIQUE NOT NULL
password    varchar(64)
```

#### `Chat`
```
id          varchar(36) PK
createdAt   datetime NOT NULL
title       text NOT NULL
userId      varchar(36) FK → User.id
visibility  enum('public','private') DEFAULT 'private'
```

#### `Message`
```
id          varchar(36) PK
chatId      varchar(36) FK → Chat.id
role        varchar(20)
content     json NOT NULL
createdAt   datetime NOT NULL
```

#### `Vote`
```
chatId      varchar(36) FK → Chat.id  ┐ PK composto
messageId   varchar(36) FK → Message.id ┘
isUpvoted   boolean NOT NULL
```

#### `Document`
```
id          varchar(36)  ┐ PK composto
createdAt   datetime     ┘
title       text NOT NULL
content     text
kind        enum('text','code','image','sheet') DEFAULT 'text'
userId      varchar(36) FK → User.id
```

#### `Suggestion`
```
id                  varchar(36) PK
documentId          varchar(36) FK → Document.id
documentCreatedAt   datetime
originalText        text NOT NULL
suggestedText       text NOT NULL
description         text
isResolved          boolean DEFAULT false
userId              varchar(36) FK → User.id
createdAt           datetime NOT NULL
```

#### `UserLimit`
```
id           varchar(36) PK
iterations   int NOT NULL DEFAULT 0
limit        int NOT NULL DEFAULT 10
isUnlimited  boolean DEFAULT false
userId       varchar(36) FK → User.id
createdAt    datetime NOT NULL
```

#### `Plans`
```
id          varchar(36) PK
planRef     varchar(100)
active      boolean DEFAULT true
name        varchar(100)
description text
price       varchar(50)
```

#### `SubscriblePlanUsers`
```
id        varchar(36) PK
pending   boolean DEFAULT true
planId    varchar(36) FK → Plans.id
userId    varchar(36) FK → User.id
createdAt datetime NOT NULL
payedAt   datetime
```

---

## 3. Autenticação

Arquivos: `front-politicai/app/(auth)/`

- **Provider**: NextAuth 5 com `Credentials` (email + senha)
- **Hash**: `bcrypt-ts` (compare + hash)
- **Sessão**: JWT com `userId` salvo
- **Middleware**: `middleware.ts` protege todas as rotas `/` e `/api`
- **Ações de servidor**: `login()`, `register()` via Server Actions (Next.js)

### Fluxo de login
```
POST /login (form) → login() action
  → getUser(email) do DB
  → bcrypt.compare(senha)
  → signIn('credentials', { email, password })
  → redirect '/'
```

---

## 4. Interface de Chat

### Componente principal: `components/chat.tsx`

Usa o hook `useChat()` do Vercel AI SDK:
```ts
const { messages, input, handleSubmit, append, ... } = useChat({
  api: '/api/chat',
  body: { id, selectedChatModel },
  onError: (err) => {
    if (err.message.includes('request limit')) router.push('/plan')
  }
})
```

Features:
- Upload de arquivo (imagem) via `multimodal-input.tsx`
- Seleção de modelo no `chat-header.tsx`
- Exibição de raciocínio do modelo (`message-reasoning.tsx`)
- Votação em mensagens (upvote/downvote)

### Modelos disponíveis (`lib/ai/models.ts`)

| ID interno | Modelo real | Provider |
|-----------|------------|---------|
| `chat-model-small` | `gpt-4o-mini` | OpenAI |
| `chat-model-large` | `gpt-4o` | OpenAI |
| `chat-model-reasoning` | `accounts/fireworks/models/deepseek-r1` | Fireworks AI |

---

## 5. API de Chat — Endpoint Central

Arquivo: `front-politicai/app/(chat)/api/chat/route.ts`

### POST /api/chat

**Request body:**
```json
{
  "id": "uuid",
  "messages": [...],
  "selectedChatModel": "chat-model-small"
}
```

**Pipeline:**
1. Verifica sessão autenticada
2. `verifyUserRequestLimit(userId)` — bloqueia se excedeu cota diária
3. `generateTitleFromUserMessage(message)` — gera título via LLM
4. Salva `Chat` no DB (se novo)
5. `streamText()` com ferramentas ativas:
   - `getWeather`
   - `createDocument`
   - `updateDocument`
   - `requestSuggestions`
   - `requestParliamentarians`
   - `requestTradingStrategies`
6. No `onFinish`: salva `Message` (user + assistant) no DB
7. Retorna `DataStreamResponse`

**Modelo de reasoning** (DeepSeek-R1): extrai `<think>...</think>` do texto e envia como stream separado via `dataStream.writeData({ type: 'reasoning', content })`.

---

## 6. Ferramentas de IA (Tools)

Pasta: `front-politicai/lib/ai/tools/`

### 6.1 `getWeather`
- **API**: `https://api.open-meteo.com/v1/forecast`
- **Params**: `{ latitude, longitude }`
- **Retorna**: temperatura atual, dados horários, nascer/pôr do sol

### 6.2 `createDocument`
- **Params**: `{ title, kind: 'text'|'code'|'image'|'sheet' }`
- Gera UUID, notifica o cliente via `dataStream`
- Delega para `documentHandlersByBlockKind[kind].onCreateDocument()`
- **Retorna**: `{ id, title, kind, content: '' }`

### 6.3 `updateDocument`
- **Params**: `{ id, description }`
- Busca documento do DB
- Delega para o handler correspondente ao `kind`
- **Retorna**: resultado da atualização

### 6.4 `requestSuggestions`
- **Params**: `{ documentId }`
- Busca conteúdo do documento
- `streamObject()` gera até 5 sugestões com schema:
  ```ts
  { originalSentence, suggestedSentence, description }
  ```
- Salva sugestões no DB, envia via `dataStream`

### 6.5 `requestParliamentarians`
- **Params**: `{ query, k }` (top-k resultados)
- **API externa**: `POST https://similarity-search-api-dc504ca1e6e3.herokuapp.com/similarity-search`
- Busca semântica em base de dados de parlamentares
- **Retorna**: texto formatado com informações dos políticos

### 6.6 `requestTradingStrategies`
- **Params**: nenhum
- **API externa**: `GET https://similarity-search-api-dc504ca1e6e3.herokuapp.com/vertex-info`
- Cache Redis por 3 dias
- **Retorna**: estratégias e guia de uso do Vortex

---

## 7. Sistema de Documentos (Blocks)

### Tipos de documento

| Kind | Geração | Formato |
|------|---------|---------|
| `text` | `streamText()` | Markdown |
| `code` | `streamObject({ code: string })` | Python |
| `image` | `experimental_generateImage()` (DALL-E) | base64 |
| `sheet` | `streamObject({ csv: string })` | CSV |

### Interface do handler

```ts
interface DocumentHandler<T extends BlockKind> {
  kind: T
  onCreateDocument(params: CreateDocumentCallbackParams): Promise<void>
  onUpdateDocument(params: UpdateDocumentCallbackParams): Promise<void>
}
```

### Fluxo de criação de documento

```
Tool createDocument() invocada pelo LLM
  → gera UUID
  → dataStream.writeData({ type: 'id', content: id })
  → documentHandlersByBlockKind[kind].onCreateDocument()
      → streamText/streamObject → gera conteúdo
      → dataStream.writeData({ type: `${kind}-delta`, content: delta })
      → salva no DB (Document table)
  → dataStream.writeData({ type: 'finish', content: '' })
```

### Processamento client-side

`components/data-stream-handler.tsx` processa eventos do stream:

| Tipo de evento | Ação |
|---------------|------|
| `text-delta` | Acumula conteúdo de texto |
| `code-delta` | Acumula código |
| `sheet-delta` | Acumula CSV |
| `image-delta` | Acumula base64 |
| `title` | Atualiza título do bloco |
| `id` | Define ID do documento |
| `kind` | Define tipo do bloco |
| `suggestion` | Exibe sugestão de edição |
| `reasoning` | Exibe raciocínio do modelo |
| `finish` | Marca documento como completo |

---

## 8. Rate Limiting

Arquivo: `front-politicai/lib/functions/user-request-limit.ts`

- Cota padrão: **10 requisições/dia** por usuário
- Armazenado na tabela `UserLimit`
- Reset à meia-noite UTC
- Se excedido: retorna HTTP 400 com `{ error: 'request limit exceeded' }`
- Frontend detecta o erro e redireciona para `/plan`

```ts
async function verifyUserRequestLimit(userId: string): Promise<void>
  → getLastInteraction(userId, today)
  → se iterations >= limit: throw 'request limit exceeded'
  → senão: saveUserLimit(userId, iterations + 1)
```

---

## 9. Planos e Pagamento

Arquivo: `front-politicai/lib/functions/plan-subscribe.ts`

**API externa**: `https://caixinha-financeira-9a2031b303cc.herokuapp.com`

Dois métodos de pagamento:
1. **Stripe**: `POST /stripe/payment-link` → retorna `linkPayment`
2. **PIX** (Brasil): `POST /pix/criar-cobranca` → retorna `qrCode`, `pixCopiaECola`, `chave`, `id`

Headers necessários:
```
x-api-key: API_FINANCE_KEY
client-id: API_FINANCE_CLIENT_ID
```

### Rotas de pricing

| Rota | Método | Ação |
|------|--------|------|
| `/api/plan` | GET | Lista planos ativos |
| `/api/plan` | POST | Assina plano (cria pagamento) |
| `/api/plan/confirmation` | POST | Webhook de confirmação de pagamento |
| `/api/plan/notify` | POST | Notifica cliente sobre status |

---

## 10. Cache

Arquivo: `front-politicai/lib/cache/redis.ts`

```ts
abstract class Cache {
  abstract get<T>(key: string): Promise<T | null>
  abstract set<T>(key: string, value: T, ttl?: number): Promise<void>
  abstract delete(key: string): Promise<void>
}

class RedisCache extends Cache     // usa ioredis
class InMemoryCache extends Cache  // usa Map<string, {value, expiresAt}>
```

Seleção automática: se `REDIS_URL` definido → `RedisCache`, senão → `InMemoryCache`.

---

## 11. Serviço Agent (LangChain)

Pasta: `agent/`

### Arquitetura de agentes

#### Agente com memória Redis (`src/agent.js`)
- Modelo: `gpt-3.5-turbo`
- Memória: `UpstashRedisChatMessageHistory` (TTL 5 min)
- Sessões armazenadas em Map local
- API: `POST /message` → `{ received: resposta }`

#### Agente LangGraph (`src/langgraph/agent.js`)
- Grafo de estado com nós `agent` e `tools`
- Ferramenta: `politician_search` (busca no vector store)
- Checkpointing: `MemorySaver`
- API:
  - `POST /chat` → cria conversa, retorna `threadId`
  - `POST /chat/:threadId` → continua conversa

#### Agente in-memory (`in-memory/agent.js`)
- `ConversationalRetrievalQAChain`
- `MemoryVectorStore` com embeddings `text-embedding-3-large`
- Carrega dados políticos de JSON local

### Vector Store (`vector-store/redis-vector-store.js`)
- Provider: Upstash Vector
- Embeddings: `text-embedding-3-small`
- Index: `langchainjs-testing`
- Função: `searchSimilar(query, topK=2) → string`

### Formatação de dados (`vector-store/enrichment-data-store.js`)
Converte dados brutos em documentos para o vector store:
- Parlamentares: nome, cargo, estado, partido, votos, histórico, contatos, redes sociais, scores
- Despesas eleições 2024: nome, CPF, quantidade de despesas, total, descrição

---

## 12. API de Busca Vetorial (politic-ai-api)

Pasta: `politic-ai-api/`  
Stack: Fastify 5, TypeScript, Upstash Vector, LangChain

### Endpoints

**GET /vertex-info**
- Busca documentos de estratégias em S3 (AWS)
- Cache interno
- Resposta: `{ estrategias: string, guiaUsoVotext: string }`

**POST /similarity-search**
- Request: `{ query: string, k: number }`
- Busca semântica no Upstash Vector (namespace `dense-vector`)
- Embeddings: `text-embedding-3-small`
- Resposta: `{ similarity: [{ pageContent, metadata }] }`

---

## 13. Variáveis de Ambiente

### front-politicai

```env
OPENAI_API_KEY=           # Obrigatório — modelos GPT-4o e DALL-E
FIREWORKS_API_KEY=        # Obrigatório — DeepSeek-R1 reasoning
AUTH_SECRET=              # Obrigatório — segredo NextAuth (openssl rand -hex 32)
BLOB_READ_WRITE_TOKEN=    # Vercel Blob (upload de imagens)
MYSQL_URL=                # Conexão MySQL (ex: mysql://user:pass@host/db)
REDIS_URL=                # Opcional — Redis para cache
API_FINANCE_KEY=          # API de pagamento
API_FINANCE_CLIENT_ID=    # Client ID da API de pagamento
```

### agent

```env
OPENAI_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
UPSTASH_VECTOR_REST_URL=
UPSTASH_VECTOR_REST_TOKEN=
```

### politic-ai-api

```env
OPENAI_API_KEY=
UPSTASH_VECTOR_REST_URL=
UPSTASH_VECTOR_REST_TOKEN=
```

---

## 14. Fluxos de Dados Completos

### Fluxo 1 — Conversa normal

```
Usuário digita mensagem
  → useChat() POST /api/chat
  → Verifica auth + rate limit
  → Salva chat no DB
  → streamText(model, tools, messages)
    → LLM processa, decide usar ou não uma tool
    → Se tool: executa, retorna resultado, LLM continua
    → Stream de texto volta pro cliente
  → onFinish: salva messages no DB
  → DataStreamHandler atualiza UI
```

### Fluxo 2 — Criação de documento

```
LLM invoca createDocument(title, kind)
  → UUID gerado, enviado ao cliente
  → DocumentHandler.onCreateDocument()
    → streamText/streamObject gera conteúdo
    → deltas enviados via dataStream
    → conteúdo final salvo no DB
  → cliente exibe bloco em tempo real (direita da tela)
```

### Fluxo 3 — Busca de parlamentar

```
LLM invoca requestParliamentarians(query, k)
  → POST politic-ai-api /similarity-search
    → Upstash Vector similarity search
    → Retorna top-k documentos
  → LLM recebe resultado formatado
  → Responde ao usuário com informações
```

### Fluxo 4 — Sugestões de escrita

```
LLM invoca requestSuggestions(documentId)
  → Busca conteúdo do documento no DB
  → streamObject() gera array de sugestões
  → Cada sugestão: { originalSentence, suggestedSentence, description }
  → Salvas no DB (Suggestion table)
  → Enviadas via dataStream ao cliente
  → UI exibe highlights no documento
```

---

## 15. Guia de Replicação para Outro Domínio

### O que precisa ser trocado (específico de domínio)

| Item | Onde | O que trocar |
|------|------|-------------|
| Ferramenta de busca | `lib/ai/tools/request-parliamentarians.ts` | URL da API e formatação dos resultados |
| Dados do vector store | `agent/vector-store/enrichment-data-store.js` | Estrutura e fonte dos documentos |
| Ferramenta de contexto | `lib/ai/tools/vortex-crypto.ts` | URL da API e tipo de conteúdo |
| Prompts do sistema | `lib/ai/prompts.ts` | `regularPrompt`, `blocksPrompt` |
| Prompt por tipo de doc | `blocks/*/server.ts` | System prompts de cada handler |
| Tipos de planos | Tabela `Plans` no DB | Nomes e preços dos planos |
| Modelos de LLM | `lib/ai/models.ts` | Trocar modelos se necessário |

### O que reutilizar sem mudança

- Toda a infraestrutura de auth (NextAuth + Drizzle)
- Sistema de rate limiting
- Bloco de documentos (text, code, image, sheet)
- DataStreamHandler e streaming
- Componentes de UI do chat
- Sistema de cache Redis/in-memory
- Estrutura de pagamento (trocar apenas a API)
- API routes genéricas (document, history, vote, files)

### Stack mínima para começar

```
1. MySQL (banco de dados)
2. OpenAI API key (GPT-4o + embeddings)
3. Upstash Vector (busca semântica dos dados do domínio)
4. Vercel Blob (upload de arquivos) — opcional
5. Redis (cache) — opcional, tem fallback in-memory
```

### Passos para adaptar

1. **Definir os dados do domínio**: estruturar os documentos que serão indexados no Upstash Vector
2. **Alimentar o vector store**: adaptar `enrichment-data-store.js` com os novos dados
3. **Criar tools específicas**: substituir `request-parliamentarians.ts` e `vortex-crypto.ts` pelas ferramentas do novo domínio
4. **Ajustar os prompts**: editar `prompts.ts` e os system prompts de cada bloco para o novo contexto
5. **Configurar variáveis de ambiente**: copiar `.env.example` e preencher
6. **Rodar migrations**: `pnpm drizzle-kit push` para criar as tabelas
7. **Configurar pagamento** (opcional): apontar para nova API de pagamento ou remover feature

---

## 16. Dependências Principais por Serviço

### front-politicai

```json
{
  "next": "15.x (canary)",
  "react": "19.x (RC)",
  "ai": "4.1.x",            // Vercel AI SDK
  "openai": "^4.x",
  "@ai-sdk/openai": "^1.x",
  "drizzle-orm": "^0.44.x",
  "mysql2": "^3.x",
  "next-auth": "5.0.0-beta",
  "ioredis": "^5.x",
  "@vercel/blob": "^0.x",
  "zod": "^3.x"
}
```

### agent

```json
{
  "langchain": "^0.x",
  "@langchain/community": "^0.x",
  "@langchain/langgraph": "^0.x",
  "@langchain/openai": "^0.x",
  "@upstash/redis": "^1.x",
  "@upstash/vector": "^1.x",
  "express": "^4.x"
}
```

### politic-ai-api

```json
{
  "fastify": "^5.x",
  "langchain": "^0.x",
  "@langchain/community": "^0.x",
  "@upstash/vector": "^1.x"
}
```
