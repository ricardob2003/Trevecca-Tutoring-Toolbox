# Test Document: Unit, Integration, and UAT Test Cases and Results

**Project:** Tutoring Toolbox
**Date:** 2026-03-02
**Branch:** `fix/general-fixes`

---

## Legend

| Symbol        | Meaning                                |
| ------------- | -------------------------------------- |
| ✅ PASS       | Test was executed and passed           |
| ❌ FAIL       | Test was executed and failed           |
| ⬜ NOT TESTED | Test case defined but not yet executed |

---

## 1. Unit Tests

Unit tests target isolated logic within individual modules, with all external dependencies (database, auth) mocked.

**File:** `backend/src/modules/sessions/routes.test.ts`
**Framework:** Vitest
**Runner:** `npm run test` (backend)

### 1.1 `PATCH /api/v1/sessions/:id/complete` — Complete a Session

| #    | Test Case                                                                 | Expected Result                                                                               | Status  |
| ---- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------- |
| U-01 | Assigned tutor submits `attended: true` and notes for a scheduled session | `200 OK` — session returned with `status: "completed"`, `attended: true`, and notes populated | ✅ PASS |
| U-02 | Tutor attempts to complete a session that is already completed            | `400 Bad Request` — message contains `"session not scheduled"`                                | ✅ PASS |
| U-03 | A different tutor (not the assigned one) attempts to complete the session | `403 Forbidden` — message contains `"Only tutor can complete session"`                        | ✅ PASS |
| U-04 | Request body is missing the required `attended` field                     | `400 Bad Request` — message contains `"Invalid body"`                                         | ✅ PASS |

---

## 2. Integration Tests

Integration tests exercise full request/response cycles against a running Fastify app instance. External services (database) are mocked at the Prisma client level.

> **Note:** Only the session completion endpoint currently has written integration tests. The cases below for other session endpoints and all other modules are defined but not yet implemented.

### 2.1 Sessions — `GET /api/v1/sessions`

| #    | Test Case                                  | Expected Result                                       | Status        |
| ---- | ------------------------------------------ | ----------------------------------------------------- | ------------- |
| I-01 | Admin requests session list — no filters   | `200 OK` — all sessions returned                      | ⬜ NOT TESTED |
| I-02 | Tutor requests session list — no filters   | `200 OK` — only sessions where `tutorId` matches user | ⬜ NOT TESTED |
| I-03 | Student requests session list — no filters | `200 OK` — only sessions where `userId` matches user  | ⬜ NOT TESTED |
| I-04 | Request made without auth token            | `401 Unauthorized`                                    | ⬜ NOT TESTED |
| I-05 | Admin filters by `tutor_id` query param    | `200 OK` — only sessions for that tutor returned      | ⬜ NOT TESTED |

### 2.2 Sessions — `POST /api/v1/sessions`

| #    | Test Case                                                            | Expected Result                                                                                   | Status        |
| ---- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------- |
| I-06 | Assigned tutor creates session for an approved request               | `201 Created` — session returned with `status: "scheduled"`                                       | ⬜ NOT TESTED |
| I-07 | Tutor tries to create session for a non-approved request (`pending`) | `400 Bad Request` — "Session can only be created for approved requests"                           | ⬜ NOT TESTED |
| I-08 | A different tutor (not assigned) tries to create the session         | `403 Forbidden` — "Only assigned tutor can create session"                                        | ⬜ NOT TESTED |
| I-09 | Session creation where `end_time` is before `start_time`             | `400 Bad Request` — "End time must be after start time"                                           | ⬜ NOT TESTED |
| I-10 | Session creation that would exceed tutor's weekly hourly limit       | `400 Bad Request` — "Weekly hourly limit exceeded" with `hoursUsed` and `weeklyLimit` in response | ⬜ NOT TESTED |
| I-11 | Request body is missing `request_id`                                 | `400 Bad Request` — "Invalid body"                                                                | ⬜ NOT TESTED |

### 2.3 Sessions — `PATCH /api/v1/sessions/:id` (Reschedule)

| #    | Test Case                                                       | Expected Result                                                    | Status        |
| ---- | --------------------------------------------------------------- | ------------------------------------------------------------------ | ------------- |
| I-12 | Assigned tutor reschedules a scheduled session with valid times | `200 OK` — session returned with updated `startTime` and `endTime` | ⬜ NOT TESTED |
| I-13 | Different tutor attempts to reschedule                          | `403 Forbidden` — "Only tutor can reschedule"                      | ⬜ NOT TESTED |
| I-14 | Tutor tries to reschedule a completed session                   | `400 Bad Request` — "Can not reschedule non-scheduled session"     | ⬜ NOT TESTED |
| I-15 | Session ID in URL does not exist                                | `404 Not Found` — "Session not found"                              | ⬜ NOT TESTED |
| I-16 | Body is missing `start_time` or `end_time`                      | `400 Bad Request` — "Invalid body"                                 | ⬜ NOT TESTED |

### 2.4 Sessions — `PATCH /api/v1/sessions/:id/complete`

_(These cases are covered by the unit tests in Section 1 using Fastify's `.inject()` — effectively integration-level.)_

| #    | Test Case                                    | Expected Result                  | Status  |
| ---- | -------------------------------------------- | -------------------------------- | ------- |
| I-17 | Assigned tutor completes a scheduled session | `200 OK` — `status: "completed"` | ✅ PASS |
| I-18 | Completing an already-completed session      | `400 Bad Request`                | ✅ PASS |
| I-19 | Wrong tutor tries to complete session        | `403 Forbidden`                  | ✅ PASS |
| I-20 | Missing `attended` field                     | `400 Bad Request`                | ✅ PASS |

### 2.5 Authentication — `POST /api/v1/auth/login`

| #    | Test Case                | Expected Result               | Status        |
| ---- | ------------------------ | ----------------------------- | ------------- |
| I-21 | Valid email and password | `200 OK` — JWT token returned | ⬜ NOT TESTED |
| I-22 | Wrong password           | `401 Unauthorized`            | ⬜ NOT TESTED |
| I-23 | Non-existent email       | `401 Unauthorized`            | ⬜ NOT TESTED |
| I-24 | Missing fields in body   | `400 Bad Request`             | ⬜ NOT TESTED |

### 2.6 Tutoring Requests — `POST /api/v1/requests`

| #    | Test Case                                                          | Expected Result                                  | Status        |
| ---- | ------------------------------------------------------------------ | ------------------------------------------------ | ------------- |
| I-25 | Student creates a request for a valid course                       | `201 Created` — request with `status: "pending"` | ⬜ NOT TESTED |
| I-26 | Student creates request with a specific tutor (`requestedTutorId`) | `201 Created` — `status: "pending_tutor"`        | ⬜ NOT TESTED |
| I-27 | Non-authenticated user creates a request                           | `401 Unauthorized`                               | ⬜ NOT TESTED |

### 2.7 Tutoring Requests — `PUT /api/v1/requests/:id/assign`

| #    | Test Case                                  | Expected Result                                    | Status        |
| ---- | ------------------------------------------ | -------------------------------------------------- | ------------- |
| I-28 | Admin assigns a tutor to a pending request | `200 OK` — status transitions to `"pending_tutor"` | ⬜ NOT TESTED |
| I-29 | Non-admin user attempts to assign a tutor  | `403 Forbidden`                                    | ⬜ NOT TESTED |

### 2.8 Tutoring Requests — `PATCH /api/v1/requests/:id/tutor-response`

| #    | Test Case                                 | Expected Result                               | Status        |
| ---- | ----------------------------------------- | --------------------------------------------- | ------------- |
| I-30 | Assigned tutor accepts the request        | `200 OK` — status transitions to `"approved"` | ⬜ NOT TESTED |
| I-31 | Assigned tutor declines the request       | `200 OK` — status transitions to `"pending"`  | ⬜ NOT TESTED |
| I-32 | A different tutor (not assigned) responds | `403 Forbidden`                               | ⬜ NOT TESTED |

---

## 3. UAT (User Acceptance Tests)

UAT validates end-to-end user workflows through the UI, testing real browser interactions against the running application.

**Environment:** Local dev (`npm run dev` for both frontend and backend, seeded database)
**Test Users (from seed):**

| Role    | Email                      | Password    |
| ------- | -------------------------- | ----------- |
| Admin   | admin@trevecca.edu         | admin123    |
| Tutor   | jsmith@trevecca.edu        | password123 |
| Tutor   | emily.davis@trevecca.edu   | password123 |
| Student | michael.brown@trevecca.edu | password123 |

---

### 3.1 Authentication

| #      | Scenario                     | Steps                                                        | Expected                                      | Status        |
| ------ | ---------------------------- | ------------------------------------------------------------ | --------------------------------------------- | ------------- |
| UAT-01 | Student logs in successfully | 1. Navigate to `/` 2. Enter valid credentials 3. Click Login | Redirected to `/student/home` dashboard       | ⬜ NOT TESTED |
| UAT-02 | Admin logs in successfully   | 1. Navigate to `/` 2. Enter admin credentials 3. Click Login | Redirected to `/admin/dashboard`              | ⬜ NOT TESTED |
| UAT-03 | Tutor logs in successfully   | 1. Navigate to `/` 2. Enter tutor credentials 3. Click Login | Redirected to `/tutor/dashboard`              | ⬜ NOT TESTED |
| UAT-04 | Login with wrong password    | 1. Enter valid email + wrong password 2. Click Login         | Error message shown, user stays on login page | ⬜ NOT TESTED |
| UAT-05 | Logout                       | 1. Log in as any user 2. Click logout                        | Session cleared, redirected to login page     | ⬜ NOT TESTED |

---

### 3.2 Student Workflows

| #      | Scenario                                 | Steps                                                                                                     | Expected                                                | Status        |
| ------ | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------- |
| UAT-06 | Submit a new tutoring request            | 1. Log in as student 2. Navigate to Request page 3. Select course, fill description 4. Submit             | Request appears on dashboard with `Pending` status      | ⬜ NOT TESTED |
| UAT-07 | Request a specific tutor                 | 1. Log in as student 2. Navigate to Request page 3. Select course, choose a tutor from dropdown 4. Submit | Request appears with `Pending Tutor Approval` status    | ⬜ NOT TESTED |
| UAT-08 | View assigned tutor on Home page         | 1. Log in as student with an approved request 2. Navigate to My Tutors                                    | Assigned tutor name and course displayed                | ⬜ NOT TESTED |
| UAT-09 | View request status updates on Home page | 1. Log in as student 2. Check Home dashboard                                                              | All submitted requests shown with correct status badges | ⬜ NOT TESTED |

---

### 3.3 Admin Workflows

| #      | Scenario                            | Steps                                                                           | Expected                                                                   | Status        |
| ------ | ----------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------- |
| UAT-10 | View all pending requests           | 1. Log in as admin 2. Navigate to Requests page                                 | All pending requests listed in table                                       | ⬜ NOT TESTED |
| UAT-11 | Assign a tutor to a request         | 1. Log in as admin 2. Open a pending request 3. Select a tutor and assign       | Request status changes to `Pending Tutor Approval`                         | ⬜ NOT TESTED |
| UAT-12 | Deny a request with a reason        | 1. Log in as admin 2. Open a pending request 3. Click Deny, enter reason        | Request status changes to `Denied`, reason stored                          | ⬜ NOT TESTED |
| UAT-13 | View and toggle tutor active status | 1. Log in as admin 2. Navigate to Tutors page 3. Toggle a tutor's active status | Tutor active status updates, reflected in assignable tutor list            | ⬜ NOT TESTED |
| UAT-14 | View admin dashboard metrics        | 1. Log in as admin 2. Navigate to Dashboard                                     | Stat cards show counts for pending requests, active tutors, total sessions | ⬜ NOT TESTED |

---

### 3.4 Tutor Workflows

| #      | Scenario                                 | Steps                                                                                       | Expected                                                  | Status        |
| ------ | ---------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------- |
| UAT-15 | Accept an assigned request               | 1. Log in as tutor 2. View pending request on dashboard 3. Click Accept                     | Request status changes to `Approved`                      | ⬜ NOT TESTED |
| UAT-16 | Decline an assigned request              | 1. Log in as tutor 2. View pending request on dashboard 3. Click Decline                    | Request returns to `Pending` status for admin to reassign | ⬜ NOT TESTED |
| UAT-17 | Create a session for an approved request | 1. Log in as tutor 2. Navigate to an approved request 3. Set date/time and create session   | Session appears on dashboard with `Scheduled` status      | ⬜ NOT TESTED |
| UAT-18 | Reschedule a session                     | 1. Log in as tutor 2. Select a scheduled session 3. Update start/end time                   | Session reflects new time on dashboard                    | ⬜ NOT TESTED |
| UAT-19 | Mark a session as completed              | 1. Log in as tutor 2. Select a scheduled session 3. Mark complete, set attendance and notes | Session status changes to `Completed`, notes saved        | ⬜ NOT TESTED |
| UAT-20 | View assigned students                   | 1. Log in as tutor 2. Navigate to Students page                                             | List of students with approved requests displayed         | ⬜ NOT TESTED |

---

### 3.5 Analytics (Admin)

> **Note:** Analytics page (`/admin/analytics`) has not been tested. Sufficient session and request data needs to exist in the system before these cases can be meaningfully executed.

| #      | Scenario                                         | Steps                                                   | Expected                                               | Status        |
| ------ | ------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------ | ------------- |
| UAT-21 | View sessions-over-time chart                    | 1. Log in as admin 2. Navigate to Analytics             | Chart renders with session counts over time            | ⬜ NOT TESTED |
| UAT-22 | View requests by status breakdown                | 1. Log in as admin 2. Navigate to Analytics             | Pie/bar chart showing distribution of request statuses | ⬜ NOT TESTED |
| UAT-23 | View top tutors by session count                 | 1. Log in as admin 2. Navigate to Analytics             | Ranked list or chart of tutors by number of sessions   | ⬜ NOT TESTED |
| UAT-24 | View sessions by course/department               | 1. Log in as admin 2. Navigate to Analytics             | Breakdown of sessions grouped by course or department  | ⬜ NOT TESTED |
| UAT-25 | Analytics updates after new session is completed | 1. Complete a session (UAT-19) 2. Navigate to Analytics | Charts reflect the newly completed session             | ⬜ NOT TESTED |

---

## 4. Summary

| Category    | Total Cases | Passed | Failed | Not Tested |
| ----------- | ----------- | ------ | ------ | ---------- |
| Unit        | 4           | 4      | 0      | 0          |
| Integration | 32          | 4      | 0      | 28         |
| UAT         | 25          | 0      | 0      | 25         |
| **Total**   | **61**      | **8**  | **0**  | **53**     |

### Remaining Testing Work

- **Session creation and rescheduling** (I-06 through I-16) — endpoints are implemented but have no automated tests written yet.
- **All other API modules** (auth, requests, tutors, courses) — no integration tests exist.
- **All UAT scenarios** — manual testing against a live environment has not been performed.
- **Analytics page** — requires sufficient seed data and time to fully implement and validate chart rendering and data accuracy.
