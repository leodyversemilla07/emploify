# Emploify API (NestJS)

Backend service for Emploify.

## Responsibilities

- Authentication gateway (`/api/auth/*`)
- User profile management
- Job ingestion and filtering
- Save jobs + application tracker state
- Analytics computation
- AI match scoring + optional Azure OpenAI explanations

## Stack

- NestJS 11
- Prisma + PostgreSQL
- Better Auth
- Azure OpenAI integration (optional)

## Environment

Copy and edit:

```bash
cp .env.example .env
```

Minimum required variables:
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `FRONTEND_URL`

Admin-only actions:
- `ADMIN_EMAILS` — comma-separated emails allowed to trigger protected admin routes like `POST /jobs/sync`

Optional provider variables:
- `GREENHOUSE_COMPANY_NAME`
- `LEVER_COMPANY_HANDLE`
- `LEVER_COMPANY_NAME`
- `ASHBY_JOBS_URL`
- `ASHBY_COMPANY_NAME`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_DEPLOYMENT`
- `AZURE_OPENAI_API_KEY`
- `ADMIN_EMAILS`

## Install + run

```bash
bun install
bun run prisma:generate
bunx prisma migrate deploy
bun run dev
```

API default URL:
- `http://localhost:4000`

## Main scripts

```bash
bun run dev
bun run build
bun run start
bun run lint
bun run typecheck
bun run prisma:generate
bun run prisma:migrate
```
