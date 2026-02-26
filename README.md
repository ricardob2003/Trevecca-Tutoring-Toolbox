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
  - Session token is also stored in an HTTP-only cookie for browser session persistence
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
npm --prefix backend run prisma:migrate -- --name <change-name>
npm --prefix backend run dev
```

### Database / Prisma

Prisma has three artifacts that must always stay in sync:

```
schema.prisma  ←→  migration files  ←→  actual database
```

#### Adding a column (team workflow)

> Edit `schema.prisma` first — Prisma generates the migration SQL from the diff between the schema and the last migration.

```bash
# 1. Edit backend/prisma/schema.prisma (add or change the field)

# 2. Create the migration and apply it locally.
#    This generates the SQL file, runs it against the DB,
#    and regenerates the Prisma client — all in one command.
npm --prefix backend run prisma:migrate -- --name <descriptive-name>

# 3. Commit both files together:
#    backend/prisma/schema.prisma
#    backend/prisma/migrations/<timestamp>_<name>/migration.sql
```

#### Rules

- Never use `prisma db push` for shared/team databases.
- Never edit a migration file after it has been applied to any shared database.
- When using Docker, the API startup script always runs `prisma migrate deploy` automatically before the server boots.

#### Troubleshooting: "column does not exist in the current database"

This means the Prisma client knows about a field (from `schema.prisma`) but the migration SQL has not been applied to the running database yet.

**When running via Docker Compose:**

Do not use `docker compose restart` — it reuses the old container and does not re-run the startup migration. Instead, recreate the container:

```bash
npm run docker:up
```

The API container always runs `prisma migrate deploy` on boot, so any pending migrations will be applied.

**When running locally (no Docker):**

```bash
npm --prefix backend run prisma:deploy   # apply pending migrations
npm --prefix backend run prisma:generate # regenerate the Prisma client
```

### API routes

- `GET /api/v1/health`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/microsoft/start` (placeholder)
- `GET /api/v1/auth/microsoft/callback` (placeholder)
- `POST /api/v1/email/test`

#### Tutor API routes
- `GET /api/v1/tutors`
- `POST /api/v1/tutors`
- `PUT /api/v1/tutors/:id`
- `PATCH /api/v1/tutors/:id/active`

## Docker

From repo root:

```bash
npm run docker:up
```

Services:

- Frontend: `http://localhost:8080`
- API: `http://localhost:3000`
- PostgreSQL (host): `localhost:5433`
- Redis (host): `localhost:6380`
















