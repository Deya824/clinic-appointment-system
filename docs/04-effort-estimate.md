# Effort Estimate

> **In simple words:** This document estimates how much work each part of the project took, using "story points" (a relative unit of effort).

---

## What is a Story Point?

A **story point** is not an hour — it is a number that shows how complex a task is **compared to other tasks**.

We use a simple scale:
| Points | Meaning |
|--------|---------|
| 1 | Very simple — copy an existing pattern |
| 2 | Simple — one file, straightforward logic |
| 3 | Medium — multiple files, some tricky logic |
| 5 | Complex — cross-cutting concern, multiple layers |
| 8 | Very complex — unknown territory, many files |

We assume **1 story point ≈ 1 hour** for this project (student pacing with research time).

---

## Estimates by Module / Task

### Sprint 1 — Scaffold + Config

| Task | Points | Notes |
|------|--------|-------|
| Next.js project setup, tsconfig, ESLint | 2 | Standard scaffold |
| Jest + ts-jest config, fix ESM issue with jose | 3 | ESM handling took extra time |
| GitHub Actions CI pipeline | 2 | |
| `.env.example`, `.gitignore` | 1 | |
| **Sprint 1 total** | **8** | **≈ 8 hours** |

### Sprint 2 — Core Layers

| Task | Points | Notes |
|------|--------|-------|
| Firestore Singleton (`src/lib/db.ts`) | 2 | |
| TypeScript domain types (`src/types`) | 2 | |
| Zod schemas (`src/schemas`) | 3 | Datetime validation was tricky |
| Repository interfaces | 2 | |
| 5 Firestore repositories | 8 | One per entity |
| 6 design pattern files | 8 | Research + implementation |
| `container.ts` wiring | 3 | |
| `src/lib/auth.ts` JWT helpers | 2 | |
| **Sprint 2 total** | **30** | **≈ 30 hours** |

### Sprint 3 — Auth

| Task | Points | Notes |
|------|--------|-------|
| AuthService unit tests | 3 | TDD |
| `requireRole` helper (TDD — failing test first) | 3 | |
| Auth routes (register, login, logout, me) | 3 | |
| **Sprint 3 total** | **9** | **≈ 9 hours** |

### Sprint 4 — Patient, Doctor, Appointment Routes

| Task | Points | Notes |
|------|--------|-------|
| PatientService + unit tests | 3 | |
| Patient routes (POST, GET, PATCH) | 3 | |
| DoctorService + unit tests | 3 | |
| Doctor + Schedule routes | 3 | |
| AppointmentService + unit tests | 5 | Overlap logic complex |
| Appointment routes (book, cancel, reschedule) | 3 | |
| **Sprint 4 total** | **20** | **≈ 20 hours** |

### Sprint 5 — Billing + Notifications

| Task | Points | Notes |
|------|--------|-------|
| BillingService + unit tests | 3 | |
| StaffDiscount (TDD) | 2 | |
| Bill routes (create, get, pay) | 3 | |
| WhatsAppNotifier (TDD) | 2 | |
| EventBus subscriber tests | 2 | |
| **Sprint 5 total** | **12** | **≈ 12 hours** |

### Sprint 6 — Swagger + Frontend

| Task | Points | Notes |
|------|--------|-------|
| `/api/doc` route + `/api-docs` page | 3 | New tool — research needed |
| `@swagger` JSDoc on all 14 routes | 3 | Repetitive but careful |
| Login page | 2 | |
| Dashboard page | 2 | |
| Patients page | 3 | Register + search in one page |
| Book page | 3 | Client-side validation |
| Billing page | 3 | Two forms |
| **Sprint 6 total** | **19** | **≈ 19 hours** |

### Sprint 7 — E2E + Seed + Docs

| Task | Points | Notes |
|------|--------|-------|
| `jest.e2e.config.js` + `test:e2e` script | 2 | |
| 4 Selenium E2E tests | 5 | Explicit waits, headless Chrome |
| `scripts/seed.ts` | 3 | |
| `DoctorService` unit tests (0% → 100%) | 2 | |
| Full documentation (this sprint) | 5 | |
| **Sprint 7 total** | **17** | **≈ 17 hours** |

---

## Grand Total

| Sprint | Story Points | Hours |
|--------|-------------|-------|
| Sprint 1 — Scaffold | 8 | 8 |
| Sprint 2 — Core layers | 30 | 30 |
| Sprint 3 — Auth | 9 | 9 |
| Sprint 4 — Routes | 20 | 20 |
| Sprint 5 — Billing + Notifications | 12 | 12 |
| Sprint 6 — Swagger + Frontend | 19 | 19 |
| Sprint 7 — E2E + Docs | 17 | 17 |
| **TOTAL** | **115** | **≈ 115 hours** |

> **Note:** These estimates are retrospective (made after the work was done) and represent one developer working at student pace with research time included.
