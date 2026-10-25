# Requirements

> **In simple words:** This document says exactly what the system must do and who needs it.

---

## 12 User Stories

A **user story** is one sentence that says: "As a [role], I want [something], so that [reason]."

| # | Role | Story | Acceptance Criteria |
|---|------|-------|---------------------|
| US-01 | Admin | I want to register a new staff account so the person can log in. | Account created with hashed password; 400 if fields missing; 409 if email taken. |
| US-02 | Any staff | I want to log in with email and password so I can use the system. | JWT set in httpOnly cookie; 401 for wrong credentials; redirected to dashboard. |
| US-03 | Any staff | I want to log out so my session ends securely. | Cookie cleared; subsequent `/api/auth/me` returns 401. |
| US-04 | Receptionist | I want to register a new patient so their details are stored. | Patient saved with unique phone; 409 if phone already used. |
| US-05 | Any staff | I want to search patients by name or phone so I can find them quickly. | Partial-match search returns correct patients; empty query returns all. |
| US-06 | Receptionist | I want to edit a patient's details so corrections can be made. | Fields updated; 409 if new phone conflicts with another patient. |
| US-07 | Admin | I want to add a doctor with a consultation fee so billing works correctly. | Doctor saved; 400 if fee is negative. |
| US-08 | Admin | I want to set a doctor's weekly schedule so receptionists know available times. | Schedule saved; 400 if start >= end time. |
| US-09 | Receptionist | I want to book an appointment so the patient gets a time slot. | Appointment saved; 409 for double-booking; 400 for past/invalid times. |
| US-10 | Receptionist | I want to cancel or reschedule an appointment so plans can change. | Status updated; 400 if already cancelled; 409 if rescheduled slot is taken. |
| US-11 | Receptionist | I want to create a bill for an appointment so the patient knows what to pay. | Bill created with correct discount; 409 if bill already exists for that appointment. |
| US-12 | Receptionist | I want to pay a bill so the payment is recorded in the system. | Bill marked paid with a transaction reference; 400 if already paid. |

---

## Functional Requirements

Functional requirements say **what the system must do**.

| ID | Requirement |
|----|------------|
| FR-01 | The system shall hash all passwords with bcrypt (cost factor 12) before storing. |
| FR-02 | The system shall issue a signed JWT (HS256) stored in an httpOnly cookie on login. |
| FR-03 | All API routes shall validate request bodies with Zod before processing. |
| FR-04 | The system shall reject duplicate patient phone numbers with HTTP 409. |
| FR-05 | The system shall prevent double-booking a doctor in overlapping time slots (HTTP 409). |
| FR-06 | The system shall reject appointment times in the past (HTTP 400). |
| FR-07 | The system shall apply a discount strategy (regular 0%, senior 20%, insured 50%, staff 30%) when creating a bill. |
| FR-08 | The system shall emit `appointment.booked` and `appointment.cancelled` events that trigger email notifications and an audit log entry. |
| FR-09 | The system shall expose an OpenAPI spec at `/api/doc` and an interactive UI at `/api-docs`. |
| FR-10 | The system shall support three user roles: admin, doctor, receptionist — each with different route access. |

---

## Non-Functional Requirements

Non-functional requirements say **how well** the system must do it.

| ID | Category | Requirement |
|----|----------|------------|
| NFR-01 | Security | Passwords must never be stored in plain text. |
| NFR-02 | Security | JWT tokens must be stored in httpOnly cookies only (not localStorage). |
| NFR-03 | Reliability | Unit test line coverage must stay ≥ 80% and branch coverage ≥ 70%. |
| NFR-04 | Maintainability | The Route → Service → Repository layer rule must not be broken. Only repositories may import `firebase-admin`. |
| NFR-05 | Usability | Every form input and button must have a stable HTML `id` attribute (needed for automated E2E tests). |
| NFR-06 | Performance | The Firestore connection must be created once and reused (Singleton pattern). |
| NFR-07 | Portability | Firebase credentials must come from environment variables only. No secret values in source code. |
| NFR-08 | CI | Every push to the repository must trigger the GitHub Actions lint + test pipeline. |

---

## Mock-up Screen Descriptions

These are text descriptions of the four simple UI screens. They are not real wireframes but enough to understand the layout.

### Screen 1 — Login (`/login`)

A centred card in the middle of the page.
- Title: "Login"
- Input field with `id="email"` — labelled "Email"
- Input field with `id="password"` — labelled "Password", type = password
- Button with `id="login-btn"` — "Login"
- Below the button: a message area with `id="msg"` that shows red error text or redirects on success.

### Screen 2 — Dashboard (`/dashboard`)

A full-width page showing today's appointments for a doctor.
- Title: "Today's Appointments"
- A small row with an input (`id="doctor-id"`) and a button (`id="fetch-btn"`) labelled "Load".
- Below: a table with columns: ID, Patient, Start, End, Status.
- If no appointments: a muted message "No appointments loaded yet."

### Screen 3 — Book Appointment (`/book`)

A centred card for filling in booking details.
- Title: "Book Appointment"
- Input `id="patient-id"` — labelled "Patient ID"
- Input `id="doctor-id"` — labelled "Doctor ID"
- Two datetime-local inputs: `id="start"` and `id="end"` shown side by side.
- Button `id="book-btn"` — "Book Appointment", full width.
- Message area `id="msg"` — shows red error or green success.
- Client-side validation checks: all fields filled, start is in future, end is after start.

### Screen 4 — Billing (`/billing`)

Two sections on one page.

**Section A — Create Bill**
- Inputs: `id="appt-id"`, `id="patient-id"`, `id="doctor-id"`.
- Button `id="create-bill-btn"`.
- On success: shows a small table with bill ID, amount, discount, status.

**Section B — Pay Bill**
- Inputs: `id="bill-id"`, `id="pay-amount"`.
- Button `id="pay-btn"` — "Pay Now".
- Message `id="msg"` shows payment result.
