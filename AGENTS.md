# AGENTS.md

## Purpose

This repository is worked on by multiple coding agents (Codex, Claude, Cursor) and humans.
The goal of this file is to keep output consistent, safe, and mergeable.

## Project Overview

- Product: Trevecca Tutoring platform
- Frontend: React + TypeScript + Vite + Tailwind + shadcn/ui
- Backend: Fastify + TypeScript + Prisma + PostgreSQL
- Infra: Docker Compose (frontend, api, db, redis)
- Auth today: local/JWT + Microsoft placeholder
- Auth target: Microsoft Entra ID integration

## Repository Layout

- `frontend/`: UI application
- `backend/`: API + Prisma schema
- `docker-compose.yml`: local multi-service environment
- `README.md`: canonical setup docs

## Environment + Ports

- Frontend runs on `localhost:8080`
- API runs on `localhost:3000`
- PostgreSQL runs on `localhost:5432`
- Redis runs on `localhost:6379`
- Do not change ports without updating:
    - `frontend/vite.config.ts`
    - `backend/.env.example`
    - `backend/src/config/env.ts`
    - `docker-compose.yml`
    - `README.md`

## Development Commands

- Frontend dev: `npm --prefix frontend run dev`
- Backend dev: `npm --prefix backend run dev`
- Frontend build: `npm --prefix frontend run build`
- Backend build: `npm --prefix backend run build`
- Docker up: `npm run docker:up`
- Docker down: `npm run docker:down`

## Coding Rules

- Keep changes scoped to the requested task.
- Do not introduce unrelated refactors in the same PR.
- Do not commit secrets, keys, or `.env` files.
- Keep API and UI contracts explicit and typed.
- Update docs when behavior/config changes.
- If a command or edit could be destructive, ask first.

## Branch Naming Convention

Branches must follow this format: `<type>/<short-description>`

- `feature/` — new functionality (e.g., `feature/microsoft-entra-auth`)
- `fix/` — bug fixes (e.g., `fix/login-jwt-expiry`)
- `chore/` — maintenance, config, deps (e.g., `chore/update-prisma-schema`)

Rules:
- Use lowercase and hyphens only (no spaces, no underscores, no slashes beyond the prefix)
- Keep descriptions short and task-specific (2–4 words)
- Do not use generic names like `fix/bug` or `feature/update`

## PR / Branch Workflow

- `main` is production and the only merge target.
- Create a dedicated branch for each feature/fix/chore.
- Open PRs from feature branch directly into `main`.
- Every PR must have at least 2 reviewers.
- No direct pushes to `main`.
- PR description must include:
    - Summary
    - Files changed
    - How to test
    - Screenshots (for UI changes)
    - Risks and rollback notes

## Merge Policy

- PR must be approved by 2 reviewers.
- PR must pass required CI checks before merge.

## Agent Collaboration Rules

- Codex, Claude, and Cursor must all follow this file.
- If an agent sees unrelated dirty changes, do not revert them.
- If uncertain about intent or impact, stop and ask for clarification.
- Keep commit messages clear and task-specific.
- Leave handoff notes when incomplete work remains.

## Handoff Template (when work is incomplete)

- What was changed
- What remains
- Known issues
- Exact next commands to run
