# Local Setup Guide (Docker + Environment)

This guide is the practical onboarding path for running Tutoring Toolbox locally.

## 1) Prerequisites

- Docker Desktop (with Docker Compose support)
- Node.js 20+ and npm
- Git

Optional:
- Prisma Studio (runs from backend script)
- psql or a DB GUI

## 2) Clone and Install

From your machine:

```bash
git clone <repo-url>
cd tutoring-toolbox
npm --prefix frontend install
npm --prefix backend install
```

## 3) Environment Setup (`.env.example` -> `.env`)

Create your local backend environment file:

```bash
cp backend/.env.example backend/.env
```

Important:
- `backend/.env.example` is a safe template committed to Git.
- `backend/.env` contains real local values and must never be committed.
- For real environment values and team-specific secrets, contact contributor **Ricardo Barahona**.

### What `backend/.env.example` is for

It defines the variables the backend and Docker stack expect so:
- new contributors can see required config quickly,
- everyone uses the same variable names,
- secrets are not stored in version control.

### Variable Reference

- `NODE_ENV`: runtime mode (`development` locally).
- `HOST`: API bind host (`0.0.0.0` in Docker/dev).
- `PORT`: API port (`3000`).
- `POSTGRES_DB`: PostgreSQL database name used by Docker Compose.
- `POSTGRES_USER`: PostgreSQL username used by Docker Compose.
- `POSTGRES_PASSWORD`: PostgreSQL password used by Docker Compose and DB URL.
- `DATABASE_URL`: Prisma connection string. Local Docker-mapped DB uses port `5433`.
- `REDIS_PASSWORD`: optional Redis password in local Docker.
- `REDIS_URL`: Redis connection string. Local Docker-mapped Redis uses port `6380`.
- `JWT_SECRET`: signing key for JWT auth.
- `EMAIL_PROVIDER`: `console` or `azure-communication-services`.
- `ACS_CONNECTION_STRING`: Azure Communication Services connection string (if used).
- `ACS_SENDER_ADDRESS`: Azure sender address (if used).
- `MICROSOFT_TENANT_ID`: Microsoft Entra tenant ID (planned integration).
- `MICROSOFT_CLIENT_ID`: Microsoft Entra client ID (planned integration).
- `MICROSOFT_CLIENT_SECRET`: Microsoft Entra client secret (planned integration).
- `MICROSOFT_REDIRECT_URI`: Entra callback URI.

## 4) Start Services with Docker

From repo root:

```bash
set -a
source backend/.env
set +a
npm run docker:up
```

This starts:
- Frontend: [http://localhost:8080](http://localhost:8080)
- API: [http://localhost:3000](http://localhost:3000)
- PostgreSQL: `localhost:5433` (mapped from container 5432)
- Redis: `localhost:6380` (mapped from container 6379)

Stop services:

```bash
npm run docker:down
```

## 5) How Docker Compose Sets Up PostgreSQL

`docker-compose.yml` provisions the DB service automatically:

- Service name: `db`
- Image: `postgres:16-alpine`
- Container name: `tutoring-toolbox-db`
- Host mapping: `127.0.0.1:5433:5432`
- Persistent storage: named volume `postgres_data`
- Health check: `pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}`

How DB initialization works:

- On first startup (empty `postgres_data` volume), PostgreSQL creates:
  - database from `POSTGRES_DB`
  - user from `POSTGRES_USER`
  - password from `POSTGRES_PASSWORD`
- On later startups, existing data in `postgres_data` is reused.

Important distinction:

- Docker Compose sets up the PostgreSQL server and initial database/user.
- Prisma migrations create your application tables (`user`, `tutor`, `course`, etc.).

To fully reset DB state (including Docker volume data):

```bash
npm run docker:down
docker compose down -v
```

## 6) Database Migrations + Seed

In a new terminal:

```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

If you want a full reset + reseed:

```bash
npx prisma migrate reset --force
```

## 7) Verify Everything Is Running

Health check:

```bash
curl -s http://localhost:3000/api/v1/health
```

Expected shape:
- `status: "ok"`
- `service: "tutoring-toolbox-api"`

Login check (uses seeded admin account):

```bash
curl -s http://localhost:3000/api/v1/auth/login \
  -H "content-type: application/json" \
  -d '{"email":"admin@trevecca.edu","password":"admin123"}'
```

You should receive a JSON response with `token` and `user`.

## 8) Useful Local Commands

From repo root:

```bash
npm run dev:frontend
npm run dev:backend
```

From backend:

```bash
npm run prisma:generate
npm run prisma:studio
npm test
```

## 9) Troubleshooting

- If `npm --prefix backend ...` fails with missing `package.json`, ensure you are running it from repo root (or use an absolute path).
- If Docker services fail to boot, check:
  - `docker compose logs -f api`
  - `docker compose logs -f db`
  - `docker compose logs -f redis`
- If port conflicts occur, verify no other process is using `3000`, `8080`, `5433`, or `6380`.

## 10) Security Notes

- Do not commit `.env` files or secrets.
- Keep `POSTGRES_PASSWORD` and `JWT_SECRET` non-default in local and non-local environments.
- Use `.env.example` only as a template; real values belong in `.env`.
