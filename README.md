# Tutoring Toolbox

Tutoring platform with:

- `frontend/`: React + TypeScript + Vite
- `backend/`: Fastify + TypeScript + Prisma + PostgreSQL

## Project Scripts (root)

- `npm run dev` starts frontend dev server.
- `npm run dev:frontend` starts frontend dev server.
- `npm run dev:backend` starts backend dev server.
- `npm run build:frontend` builds frontend.
- `npm run build:backend` builds backend.
- `npm run docker:up` starts API + Postgres + Redis with Docker Compose.
- `npm run docker:down` stops Docker Compose services.

## Frontend

### Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

### Run locally

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

## Backend

### Stack

- Fastify
- TypeScript
- Prisma
- PostgreSQL
- JWT auth (local flow now, Microsoft Entra flow scaffolded)
- Email provider abstraction
    - `console` provider (default for dev)
    - `azure-communication-services` provider stub

### Environment

Copy and configure:

```bash
cp backend/.env.example backend/.env
```

### Run locally

```bash
npm --prefix backend install
npm --prefix backend run prisma:generate
npm --prefix backend run dev
```

### API routes

- `GET /api/v1/health`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/microsoft/start` (placeholder)
- `GET /api/v1/auth/microsoft/callback` (placeholder)
- `POST /api/v1/email/test`

## Docker

From repo root:

```bash
npm run docker:up
```

Services:

- Frontend: `http://localhost:8080`
- API: `http://localhost:3000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
