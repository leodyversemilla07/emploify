# Emploify

Emploify is an AI-powered job search and application tracking platform built for early-career professionals.

It helps users:
- discover roles from multiple ATS sources,
- save and track applications in a kanban workflow,
- evaluate fit with AI-assisted match scoring,
- monitor job-search performance through simple analytics.

## Why this project

Job seekers often juggle multiple job boards, spreadsheets, and notes. Emploify unifies that workflow into one product experience:
- Jobs (discovery)
- Tracker (execution)
- Dashboard (feedback loop)

## Tech stack

- Monorepo: Turborepo
- Package manager/runtime: Bun
- Frontend: Next.js 16 + React 19
- Backend: NestJS 11
- Database: PostgreSQL + Prisma
- Auth: Better Auth (email/password + optional social login)
- AI: Any OpenAI-compatible or Anthropic provider (optional; heuristic fallback included)
- UI: shadcn/ui-style component setup

## Core MVP features

- Authentication
  - Email/password auth
  - Optional Google/GitHub social providers
- Job aggregation
  - Provider adapters for Greenhouse, Lever, and Ashby
  - Manual sync endpoint + sync status reporting
  - Seed fallback jobs for local/demo flow
- Job search
  - Search + filters (role, location, source, remote, experience level)
  - Save jobs
- Application tracker
  - Kanban statuses: SAVED, APPLIED, INTERVIEW, OFFER, REJECTED
  - Drag-and-drop updates
  - Per-application notes
- AI support
  - Match score + strengths + missing skills
  - Optional AI explanation endpoint when an LLM provider is configured
- Analytics
  - Application totals and conversion indicators (interview rate, offer rate)

## Monorepo structure

```
apps/
  web/    # Next.js frontend
  api/    # NestJS backend
packages/
  ui/
  typescript-config/
scripts/
```

## Local setup

### 1) Prerequisites

- Bun >= 1.3
- Node.js >= 20
- PostgreSQL database

### 2) Install dependencies

```bash
bun install
```

### 3) Configure environment variables

Create env files:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Update required values in `apps/api/.env`:
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `FRONTEND_URL`

### 4) (Optional) Configure AI provider

The AI explanation endpoint works with any OpenAI-compatible or Anthropic API. Set these in `apps/api/.env`:

```
LLM_PROVIDER=openai-compat   # or "anthropic"
LLM_API_KEY=your-api-key
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
```

Works out of the box with: OpenAI, Azure OpenAI, Groq, Together, OpenRouter, Ollama (local), and Anthropic. See `.env.example` for provider-specific examples.

When no LLM is configured, match scoring still works via heuristics.

### 5) Prepare database

```bash
cd apps/api
bun run prisma:generate
bunx prisma migrate deploy
```

For local development during schema iteration, you may use:

```bash
bunx prisma db push
```

### 6) Run web + api together

From repo root:

```bash
bun run dev
```

Default local URLs:
- Web: http://localhost:3000
- API: http://localhost:4000

## Useful scripts

From repo root:

```bash
bun run dev
bun run lint
bun run typecheck
bun run build
```

Per app:

```bash
cd apps/web && bun run dev
cd apps/api && bun run dev
```

## API overview

Base URL: `http://localhost:4000`

- Auth
  - `ALL /api/auth/*`
- Users
  - `GET /users/profile?email=...`
  - `PUT /users/profile`
- Jobs
  - `GET /jobs`
  - `POST /jobs/sync`
  - `GET /jobs/sync/status`
  - `POST /jobs/save`
- Applications
  - `GET /applications?email=...`
  - `PUT /applications/status`
  - `PUT /applications/notes`
  - `GET /applications/analytics?email=...`
- AI
  - `GET /ai/match?email=...&jobId=...`
  - `GET /ai/match/explain?email=...&jobId=...`
  - `GET /ai/recommendations?email=...`
  - `POST /ai/parse-resume`

## Deployment notes

For production safety:
- prefer `prisma migrate deploy` over `db push`,
- set strict CORS origin (`FRONTEND_URL`),
- set strong `BETTER_AUTH_SECRET`.

## Current scope and future work

Current focus is MVP reliability and launch-readiness.
Potential next steps:
- worker service for scheduled ingestion,
- stronger deduplication and normalization pipeline,
- interview assistant and skill-gap planner,
- richer profile/resume parsing.

---

Positioning statement:

Emploify — your AI-powered job search and application command center.
