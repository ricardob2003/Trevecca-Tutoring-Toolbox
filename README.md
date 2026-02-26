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
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
















-------------------------------------------------------------------------------------------------------------------------------------------------------
Task 3.1 — Backend: 
Login → JWT
GET /api/v1/requests → list (with filters via query params)
GET /api/v1/requests/:id → one request
POST /api/v1/requests → create
PATCH /api/v1/requests/:id → update
DELETE /api/v1/requests/:id → delete
-----------------------------------------------------------------------------------------------------------------------------------------------
Backend setup
You need Node.js and PostgreSQL installed.
In the project, go to the backend folder and create a .env file with your database URL, for example:
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME"
In a terminal, from the backend folder run:
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
Leave that terminal open; the backend should be running (e.g. on http://localhost:3000).
3. Frontend setup
In the frontend folder, create a .env (or .env.local) with:
VITE_API_URL=http://localhost:3000
(Use a different URL/port if your backend runs elsewhere.)
In a new terminal, from the frontend folder run:
npm install
npm run dev
Open the URL it gives you (e.g. http://localhost:5173).
4. Login (same for all of us locally)
Admin:
Email: admin@trevecca.edu
Password: admin123
Tutor:
Email: jsmith@trevecca.edu
Password: password123
Student:
Email: michael.brown@trevecca.edu
Password: password123
You can also use emily.davis@trevecca.edu or david.martinez@trevecca.edu with password123 (see seed for roles).
