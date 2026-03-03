# Tutoring Toolbox — Project Documentation (Modules & API)

## Overview

- **Product:** Tutoring Toolbox — web platform for TNU tutoring (request, assign, sessions).
- **Stack:** Frontend: React + TypeScript + Vite + Tailwind + shadcn/ui. Backend: Fastify + TypeScript + Prisma + PostgreSQL. Auth: JWT (local); Microsoft Entra placeholder.
- **Base URL:** API at `http://localhost:3000`. Frontend dev server typically at `http://localhost:8080` or the port Vite prints. All API routes live under `/api/v1/<module>`.

---

## Current features (by role)

**Student:** Log in; submit a tutoring request (course, optional description, optional preferred tutor); view “My Requests” and status on Home; view “My Tutors” (assigned tutors from approved requests); browse classes.

**Tutor:** Log in; see pending assignments on dashboard and accept or decline; view “My Students” (students with approved requests); create, reschedule, and complete sessions for approved requests; subject to weekly hourly limit.

**Admin:** Log in; view dashboard metrics; list and filter requests; assign a tutor to a request or deny with optional reason; manage tutors (create, edit, toggle active); view tutors’ assigned students; view Analytics (sessions/requests data).

---

## How to run the project

1. Clone the repo, then from repo root: `npm install`, `npm --prefix frontend install`, `npm --prefix backend install`.
2. Copy `backend/.env.example` to `backend/.env` and set `DATABASE_URL` (and any other required variables).
3. From `backend/`: `npx prisma generate`, `npx prisma migrate dev`, `npx prisma db seed`.
4. Start backend: `npm --prefix backend run dev` (API on port 3000).
5. Start frontend: `npm --prefix frontend run dev` (URL shown in terminal, e.g. 8080 or 5173).
6. Open the frontend URL in a browser and log in with a test account (see below).

For Docker-based setup and troubleshooting, see **docs/SETUP.md**.

---

## Architecture

Browser → **Frontend** (React, Vite, port 8080 or Vite default) → **Backend API** (Fastify, port 3000) → **PostgreSQL** (Prisma ORM). Auth: JWT in HTTP-only cookie (and optional Bearer header). Redis is available in Docker for future use.

---

## Test users (from seed)

| Role   | Email                     | Password   |
|--------|----------------------------|------------|
| Admin  | admin@trevecca.edu         | admin123   |
| Tutor  | jsmith@trevecca.edu        | password123|
| Tutor  | emily.davis@trevecca.edu   | password123|
| Student| michael.brown@trevecca.edu | password123|

---

## Frontend routes (main UI)

| Path                 | Role    | Purpose                          |
|----------------------|---------|----------------------------------|
| `/login`             | Public  | Log in                           |
| `/admin/dashboard`   | Admin   | Dashboard, metrics               |
| `/admin/requests`    | Admin   | List/assign/deny requests        |
| `/admin/tutors`      | Admin   | Manage tutors                    |
| `/admin/classes`     | Admin   | Classes                          |
| `/admin/students`    | Admin   | Students                         |
| `/admin/analytics`   | Admin   | Analytics charts                 |
| `/student/home`      | Student | Home, my requests                 |
| `/student/request`   | Student | Submit new request               |
| `/student/classes`   | Student | Browse classes                   |
| `/student/mytutors`  | Student | My assigned tutors               |
| `/tutor/dashboard`   | Tutor   | Pending assignments, sessions   |
| `/tutor/students`    | Tutor   | My assigned students             |

---

## Authentication (single, consistent story)

The backend accepts **one** of these:

1. **Session cookie (used by the frontend)**  
   On `POST /api/v1/auth/login`, the server sets an HTTP-only cookie `tt_session` containing the JWT. The frontend uses `credentials: "include"` on all API requests and does **not** send the JWT in headers.

2. **Bearer token (for non-browser clients)**  
   Send `Authorization: Bearer <token>` on each request. The auth plugin checks the `Authorization` header first, then falls back to the cookie.

So: **cookie-based auth for the web app; optional Bearer for API clients.**

---

## 1. Health module

**Prefix:** `/api/v1/health`  
**Full path example:** `GET /api/v1/health`  
**Purpose:** Liveness check. No auth.

| Method | Full path           | Auth | Description                                                                 |
|--------|---------------------|------|-----------------------------------------------------------------------------|
| GET    | `/api/v1/health`    | No   | Returns `{ status: "ok", timestamp, service: "tutoring-toolbox-api" }`.     |

---

## 2. Auth module

**Prefix:** `/api/v1/auth`  
**Purpose:** Login, current user, logout, Microsoft SSO placeholders.

| Method | Path                 | Auth | Body                  | Description                                                                 |
|--------|----------------------|------|-----------------------|-----------------------------------------------------------------------------|
| POST   | `/login`             | No   | `{ email, password }`| Validates credentials; returns `{ token, user }` and sets cookie `tt_session`. 401 if invalid. |
| GET    | `/me`                | Yes  | —                     | Returns current user. 401 if not authenticated.                            |
| POST   | `/logout`            | No   | —                     | Clears session cookie. 204.                                                 |
| GET    | `/microsoft/start`   | No   | —                     | Placeholder. 501.                                                           |
| GET    | `/microsoft/callback`| No   | —                     | Placeholder. 501.                                                           |

**Access control:** Only `/me` requires authentication; no role checks.

**Example — POST /api/v1/auth/login response:**

```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "email": "admin@trevecca.edu",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin",
    "tutor": null,
    "authProvider": "local"
  }
}
```

---

## 3. Email module

**Prefix:** `/api/v1/email`  
**Purpose:** Send test emails (e.g. dev). **Dev-only; should be protected or removed in production.** No auth in current code.

| Method | Path   | Auth | Body                              | Description                                      |
|--------|--------|------|-----------------------------------|--------------------------------------------------|
| POST   | `/test`| No   | `{ to: string[], subject?, text? }` | Sends email. Returns `{ ok, provider, messageId }`. |

---

## 4. Courses module

**Prefix:** `/api/v1/courses`  
**Purpose:** List courses for dropdowns (request form, admin assign).

| Method | Path | Auth | Description                                |
|--------|------|------|--------------------------------------------|
| GET    | `/`  | Yes  | Returns all courses sorted by `code`.      |

**Access control:** Any authenticated user.

**Response:** Array of `{ id, code, title, department }`.

---

## 5. Tutors module

**Prefix:** `/api/v1/tutors`  
**ID meaning:** In every route below, **`:id` is the tutor’s user id** (same as `User.treveccaId`). The `Tutor` model uses `userId` as its primary key; there is no separate numeric tutor id.

**Purpose:** Tutor CRUD, assignable list, tutor’s sessions, tutor’s students. All routes require auth.

| Method | Path             | Auth | Params / Query / Body                    | Description                                                                 |
|--------|------------------|------|------------------------------------------|-----------------------------------------------------------------------------|
| GET    | `/`              | Yes  | —                                        | List all tutors with user info.                                            |
| GET    | `/assignable`    | Yes  | —                                        | List tutors where `active: true` (for admin assign dropdown).               |
| GET    | `/:id/sessions`  | Yes  | `:id` = tutor user id. Query: `from`, `to` (optional ISO date strings). | Sessions for that tutor. Optional date range.                               |
| GET    | `/:id/students`  | Yes  | `:id` = tutor user id.                    | Students with approved requests for this tutor; includes course and sessions. |
| POST   | `/`              | Yes  | `{ userId, subjects[], hourlyLimit?, active? }` | Create tutor for existing user. 400 if user not found or already a tutor.   |
| PUT    | `/:id`           | Yes  | `:id` = tutor user id. Body: `{ major, subjects[], hourlyLimit }`. | Update tutor and user major. 404 if tutor not found.                         |
| PATCH  | `/:id/active`    | Yes  | `:id` = tutor user id. Body: `{ active: boolean }`. | Toggle tutor active. 404 if tutor not found.                                 |

**Access control:** No role restriction beyond authentication. Assign and deny of requests are admin-only in the Requests module.

**Example — GET /api/v1/tutors response shape:**

```json
[
  {
    "userId": 2,
    "subjects": ["Math", "Physics"],
    "hourlyLimit": 10,
    "active": true,
    "user": {
      "treveccaId": 2,
      "email": "jsmith@trevecca.edu",
      "firstName": "John",
      "lastName": "Smith",
      "major": null,
      "year": null,
      "role": "student"
    }
  }
]
```

---

## 6. Requests module

**Prefix:** `/api/v1/requests`  
**Purpose:** Tutoring request lifecycle. All routes require auth unless noted.

| Method | Path                   | Auth | Body / Params / Query                                                                 | Description                                                                                                                                 |
|--------|------------------------|------|---------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| GET    | `/`                    | Yes  | Query: `status?`, `userId?`, `requestedTutorId?`, `courseId?`                          | List requests (filtered). Status: `pending`, `pending_tutor`, `approved`, `denied`.                                                        |
| GET    | `/:id`                 | Yes  | Params: `id`                                                                          | Get one request by id.                                                                                                                     |
| POST   | `/`                    | Yes  | `{ userId, courseId, description?, requestedTutorId? }`                              | Create request. Status is always `pending`. Optional `requestedTutorId` stores preferred tutor; admin still assigns (status becomes `pending_tutor` on assign). |
| PATCH  | `/:id/tutor-response`  | Yes  | Params: `id`. Body: `{ accepted: boolean }`.                                          | **Assigned tutor only.** Accept (→ `approved`) or decline (→ `pending`). 403 if not the assigned tutor.                                     |
| PUT    | `/:id/assign`          | Yes  | Params: `id`. Body: `{ requestedTutorId }`.                                           | **Admin only.** Assign tutor; status → `pending_tutor`. 403 if not admin.                                                                   |
| PUT    | `/:id/deny`            | Yes  | Params: `id`. Body: `{ declineReason? }` (1–2000 chars).                              | **Admin only.** Deny request; status → `denied`. 403 if not admin.                                                                         |
| PATCH  | `/:id`                 | Yes  | Params: `id`. Body: at least one of `courseId`, `description`, `requestedTutorId`, `status`, `declineReason`. | Update request. **MVP+:** supported by API; not required for core MVP workflow.                                                             |
| DELETE | `/:id`                 | Yes  | Params: `id`                                                                          | Delete request. **MVP+:** supported by API; not required for core MVP workflow.                                                            |

**Access control (one line per protected route):**

- **Assign:** requires role `admin`.
- **Deny:** requires role `admin`.
- **Tutor-response:** requires the **assigned tutor** for that request (not any tutor).

**Request status flow:** `pending` → (admin assign) → `pending_tutor` → (tutor accept) → `approved`, or (tutor decline) → `pending`, or (admin deny) → `denied`.

**Example — GET /api/v1/requests response shape:**

```json
{
  "items": [
    {
      "id": 1,
      "userId": 3,
      "courseId": 1,
      "description": "Need help with calculus",
      "status": "pending",
      "requestedTutorId": null,
      "declineReason": null,
      "createdAt": "2025-01-15T12:00:00.000Z",
      "user": {},
      "course": {},
      "requestedTutor": null
    }
  ]
}
```

---

## 7. Sessions module

**Prefix:** `/api/v1/sessions`  
**Purpose:** Create, list, reschedule, and complete tutoring sessions. All routes require auth.

**Date/time:** `start_time` and `end_time` must be **ISO 8601 strings** (e.g. `2025-02-01T14:00:00.000Z`). Backend stores them in the database (UTC). **`end_time` must be after `start_time`.**

| Method | Path            | Auth | Body / Params / Query                                                                 | Description                                                                                       |
|--------|-----------------|------|---------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| GET    | `/`             | Yes  | Query: `tutor_id?`, `user_id?`                                                        | List sessions. Admin: all; otherwise only where user is tutor or student. Optional filter.        |
| POST   | `/`             | Yes  | `{ request_id, start_time, end_time }` (ISO strings)                                   | Create session for an **approved** request. **Only the assigned tutor** for that request. Validates end > start and weekly hourly limit. 400 if request not approved or limit exceeded. |
| PATCH  | `/:id`          | Yes  | Params: `id`. Body: `{ start_time, end_time }` (ISO strings).                         | Reschedule. **Only the tutor for that session.** Session must be `scheduled`. 400 if not scheduled. |
| PATCH  | `/:id/complete` | Yes  | Params: `id`. Body: `{ attended: boolean, notes? }`.                                  | Mark completed. **Only the tutor for that session.** Session must be `scheduled`.                |

**Access control (one line per protected route):**

- **Create session:** only the **assigned tutor** for the request.
- **Reschedule session:** only the **tutor** for that session.
- **Complete session:** only the **tutor** for that session.

**Example — POST /api/v1/sessions response shape (201):**

```json
{
  "id": 1,
  "tutorId": 2,
  "userId": 3,
  "requestId": 1,
  "courseId": 1,
  "startTime": "2025-02-10T14:00:00.000Z",
  "endTime": "2025-02-10T15:00:00.000Z",
  "status": "scheduled",
  "attended": null,
  "notes": null
}
```

---

## Quick reference: errors

- **401:** Unauthorized (missing or invalid token/cookie).
- **403:** Forbidden (wrong role or not the assigned tutor for that request/session).
- **404:** Resource not found.
- **400:** Validation error; response may include `message` and `issues`.

---

## Future plans

1. **Student/tutor profiles:** Let students add a short bio or preferred times; let tutors set subjects, availability windows, and max hours. Use this in matching and on “My Tutors” / “My Students” cards.
2. **In-app messaging or comments:** Simple thread per request (student ↔ tutor, or notes for admin) so communication stays in the app instead of only email.
3. **Feedback and service quality**
   - Ask students for quick feedback after sessions.
   - Track satisfaction over time.
   - Flag repeat no shows to help staff respond early.
4. **Microsoft ID:** Replace local login with TNU single sign-on so everyone uses their university account; no separate passwords.
5. **Working statistics:** Show key numbers for admins, tutors, and students. Track totals for requests and sessions, status breakdown, average time to assign and accept, hours used versus limits, no show rate, and top courses by demand. Use this to spot delays, workload issues, and high need courses.
6. **Functional notifications tab:** Add a Notifications tab for all roles. Send updates for request changes and session events (schedule, reschedule, cancel, complete). Allow mark as read, and let each alert open the related request or session page.
7. **Bug report option:** Add a “Report a problem” or “Bug report” link (e.g. in the sidebar or user menu) for all roles. Let users describe the issue, which page or action it happened on, and optionally attach a screenshot. Send submissions to a shared inbox or ticket system so the team can track and fix issues.

---

## Benefits

1. **Clear tutoring process**
   - Everyone follows one flow from request to session.
   - Status values show the exact step: pending, awaiting tutor, approved, denied.
2. **Faster tutor matching**
   - Admin assigns a tutor in one action.
   - Tutor accepts or declines inside the system.
   - If the tutor declines, the request returns to pending so admin can reassign fast.
3. **Less admin back and forth**
   - The system replaces scattered emails and manual tracking.
   - Admin pages show tutors, requests, and outcomes in one place.
4. **Secure access to student data**
   - Password hashing protects stored passwords.
   - JWT login plus backend guards block unauthorized access to routes.
5. **Better communication with students**
   - Emails are sent automatically when a tutor is assigned, approved, or denied.
   - Students get updates without needing to ask staff.
6. **Strong tutor management**
   - Admin can create and update tutor profiles.
   - Admin can toggle active status so only active tutors receive assignments.
   - Admin can set hourly limits to control workload.
7. **Real scheduling and records**
   - Tutors create sessions only after a request is approved.
   - Tutors can reschedule sessions when needed.
   - Tutors mark sessions complete and record attendance and notes.
8. **Capacity control**
   - The hourly limit check prevents tutors from scheduling more hours than allowed.
9. **Better student experience**
   - Students can see request status and upcoming sessions.
   - Students can see tutor name, course, and session time in one view.

