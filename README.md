# Clinic Appointment & Billing System

[![CI](https://github.com/Deya824/clinic-appointment-system/actions/workflows/ci.yml/badge.svg)](https://github.com/Deya824/clinic-appointment-system/actions/workflows/ci.yml)

> **In simple words:** a web app where a clinic can register patients, add doctors, book appointments, and bill patients. Author: Deya (2203057).

This is a university sessional project (CSE 3206). It is a full-stack web application built with Next.js.

---

## Features (6 modules)

| Module | What it does |
|--------|-------------|
| **Auth** | Staff login / logout. Passwords are hashed. A JWT token in a hidden cookie keeps you logged in. |
| **Patients** | Register a patient, search by name or phone, edit details. Duplicate phone numbers are rejected. |
| **Doctors** | Create a doctor profile, set consultation fee, add weekly schedule slots. |
| **Appointments** | Book, cancel, or reschedule. Blocks double-booking and past times automatically. |
| **Billing** | Generate a bill from the doctor fee with the correct discount. Pay through a gateway. |
| **Notifications** | Email, SMS, and WhatsApp notifications when an appointment is booked or cancelled. |

---

## Tech Stack

| Layer | Tool | Why |
|-------|------|-----|
| Framework | Next.js 16 (App Router) + TypeScript | File-based routing + type safety |
| Database | Firebase Firestore (`firebase-admin`) | Serverless, no separate DB server needed |
| Validation | Zod | Schemas that also generate TypeScript types |
| Auth | bcryptjs + jose JWT | Industry-standard password hashing and stateless tokens |
| API Docs | next-swagger-doc + swagger-ui-react | Auto-generates docs from JSDoc comments in route files |
| Testing | Jest + ts-jest (unit), selenium-webdriver (E2E) | Fast mocked unit tests + real browser E2E tests |
| CI | GitHub Actions | Runs lint + unit tests on every push |

---

## Architecture

```
Browser → Route handler → Service → Repository → Firestore
```

- **Route handler** — validates input with Zod, calls one service, returns HTTP status.
- **Service** — all business rules live here. Receives dependencies through its constructor (so tests can swap in fake ones).
- **Repository** — the **only** layer that imports `firebase-admin`. Maps Firestore documents to plain TypeScript objects.
- **Firestore** — the database.

---

## Design Patterns Used

| Pattern | Category | File | One-line reason |
|---------|----------|------|-----------------|
| Singleton | Creational | `src/lib/db.ts` | Creates the Firestore connection once and reuses it |
| Factory Method | Creational | `src/patterns/notifications/NotificationFactory.ts` | Creates the right notifier (email/SMS/WhatsApp) from a string |
| Adapter | Structural | `src/patterns/payments/PaymentGateway.ts` | Makes the Bkash API fit our `PaymentGateway` interface |
| Strategy | Behavioral | `src/patterns/billing/DiscountStrategy.ts` | Swaps discount rules (regular / senior / insured / staff) without if/else |
| Observer | Behavioral | `src/patterns/events/EventBus.ts` | Notifies email & audit subscribers when an appointment event fires |
| Facade | Behavioral | `src/patterns/booking/BookingFacade.ts` | Provides one simple `bookAndBill()` call instead of two |

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/Deya824/clinic-appointment-system.git
cd clinic-appointment-system
npm install
```

### 2. Create your environment file

```bash
cp .env.example .env.local
# Then open .env.local and fill in the real values
```

### Environment Variables (names only — never put real values in code)

| Variable | Purpose |
|----------|---------|
| `FIREBASE_PROJECT_ID` | Your Firebase project id |
| `FIREBASE_CLIENT_EMAIL` | Service account email from Firebase Console |
| `FIREBASE_PRIVATE_KEY` | Private key string (paste with literal `\n`) |
| `JWT_SECRET` | Long random string (32+ characters) |
| `NEXT_PUBLIC_APP_URL` | Base URL, e.g. `http://localhost:3000` |

### 3. Seed the database (creates 1 admin, 1 doctor, 1 patient)

```bash
npm run seed
# Note the printed doctor and patient IDs — you need them for E2E tests
```

### 4. Start the development server

```bash
npm run dev
# Open http://localhost:3000
```

---

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start the dev server at http://localhost:3000 |
| `npm run build` | Build for production |
| `npm run lint` | Check code style with ESLint |
| `npm test` | Run all 87 unit tests with coverage |
| `npm run test:coverage` | Same as above, explicit alias |
| `npm run seed` | Populate Firestore with demo data |
| `npm run test:e2e` | Run Selenium E2E tests (requires dev server running) |

---

## Running Selenium E2E Tests

The E2E tests use headless Chrome and talk to a real running server.

```bash
# Step 1 — seed the database and note the printed IDs
npm run seed

# Step 2 — start the dev server (keep this terminal open)
npm run dev

# Step 3 — in a new terminal, set env vars and run E2E
$env:E2E_EMAIL      = "admin@clinic.com"
$env:E2E_PASSWORD   = "Admin1234!"
$env:E2E_PATIENT_ID = "<patient-id from seed output>"
$env:E2E_DOCTOR_ID  = "<doctor-id from seed output>"
npm run test:e2e
```

---

## Folder Structure

```
.github/workflows/    GitHub Actions CI pipeline
docs/                 Project documentation
scripts/              seed.ts — populates Firestore with demo data
src/
  app/                Next.js pages and API routes
    api/              Route handlers (auth, patients, doctors, appointments, bills)
    api-docs/         Swagger UI page (/api-docs)
    login/            Login page
    dashboard/        Today's appointments
    patients/         Patient register + search
    book/             Book an appointment
    billing/          Create and pay a bill
  lib/                Shared utilities (db.ts, auth.ts, container.ts)
  patterns/           Design pattern implementations
  repositories/       Firestore repository classes + interfaces
  schemas/            Zod validation schemas
  services/           Business logic services
  types/              TypeScript domain types
tests/
  unit/               Jest unit tests (mock repositories)
  e2e/                Selenium browser tests
```

---

## API Documentation

The full interactive API reference is auto-generated from JSDoc comments.

**URL:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

---

## AI Use Declaration

GitHub Copilot and Antigravity AI were used as coding assistants during development. All code was reviewed, understood, and approved by the student before committing.
