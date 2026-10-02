# JARVIS UI

> Frontend interface for the JARVIS AI Code Understanding Platform.
> Built with **Next.js 16**, **Tailwind CSS**, and **TypeScript**.

JARVIS UI connects to two backend services:
- **Jarvis Runtime** (`port 8000`) — LangGraph AI agent for chat & retrieval
- **jarvis-parser** (`port 8001`) — 6-stage code indexing pipeline

All browser calls go through Next.js API route handlers (BFF pattern) —
no CORS issues, no secrets exposed to the browser.

---

## Prerequisites

- Node.js 18+
- Both backend services running (see below)

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/viditjain/jarvis-ui.git
cd jarvis-ui
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
# Edit .env.local if your backends run on different ports
```

`.env.local` defaults:
```env
JARVIS_API_URL=http://localhost:8000   # Jarvis Runtime
PARSER_API_URL=http://localhost:8001   # jarvis-parser
```

### 3. Start the backend services

**Terminal 1 — Jarvis Runtime:**
```bash
cd ../Jarvis
$env:PYTHONPATH = "src"          # PowerShell
# export PYTHONPATH=src          # bash/zsh
uvicorn app:app --port 8000 --reload
```

**Terminal 2 — jarvis-parser API:**
```bash
cd ../jarvis-parser
uvicorn server:app --port 8001 --reload
```

### 4. Start the UI

```bash
npm run dev
# Open http://localhost:3000
```

---

## Pages

| Route | Description |
|---|---|
| `/` | Landing page with feature overview |
| `/index` | Index a GitHub repo — triggers the 6-stage pipeline with live progress |
| `/repos` | Browse all indexed repositories |
| `/chat/[session_id]` | Chat with a codebase using SSE streaming |
| `/health` | Live health status of both backends |

---

## Architecture — BFF Pattern

```
Browser (port 3000)
    │
    │  same-origin calls only (/api/*)
    ▼
Next.js API Routes  ◄──── .env.local (backend URLs, server-side only)
    │
    ├──► Jarvis Runtime  :8000  (chat, retrieval, health)
    └──► jarvis-parser   :8001  (index, job status, repos)
```

React components never call ports 8000 or 8001 directly.
All backend integration is in `src/lib/api/` and `src/app/api/`.

---

## Project Structure

```
src/
├── app/
│   ├── api/                  # BFF proxy routes (server-side only)
│   │   ├── chat/             # POST + GET SSE stream
│   │   ├── index/            # POST start job, GET list jobs
│   │   │   └── status/[job_id]/
│   │   ├── repos/            # GET list, DELETE by id
│   │   └── health/           # Aggregated health from both backends
│   ├── index/page.tsx        # Repo indexer UI
│   ├── repos/page.tsx        # Indexed repos list
│   ├── chat/[session_id]/    # Streaming chat interface
│   └── health/page.tsx       # System status dashboard
│
├── components/
│   ├── layout/Navbar.tsx
│   ├── indexer/              # RepoIndexForm, PipelineProgress
│   └── chat/                 # ChatMessage, ChatInput
│
├── lib/
│   ├── api/
│   │   ├── jarvis-parser.ts  # All calls to jarvis-parser :8001
│   │   ├── jarvis-runtime.ts # All calls to Jarvis :8000
│   │   └── errors.ts         # Centralized error handler
│   └── sse/useSSEStream.ts   # EventSource hook for chat streaming
│
├── store/chatStore.ts        # Zustand global state
└── types/index.ts            # TypeScript interfaces (mirrors Pydantic models)
```

---

## Keeping Types in Sync with Backends

When a backend changes its Pydantic models, regenerate TypeScript types:

```bash
# Both backends must be running first
npm run types
```

This fetches `/openapi.json` from both FastAPI servers and generates:
- `src/types/jarvis-runtime.gen.ts`
- `src/types/jarvis-parser.gen.ts`

---

## Related Repositories

| Repo | Role |
|---|---|
| [Jarvis](https://github.com/viditjain/jarvis) | LangGraph AI runtime (FastAPI, Neo4j, Milvus, OpenAI) |
| [jarvis-parser](https://github.com/viditjain/jarvis-parser) | 6-stage code indexing pipeline (FastAPI + CLI) |
| **jarvis-ui** | This repo — Next.js frontend |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| SSE Streaming | Native `EventSource` via custom hook |
| Type Safety | TypeScript strict mode + auto-generated OpenAPI types |
