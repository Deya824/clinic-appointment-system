# Process Model

> **In simple words:** This document explains how we chose to organise our work and why.

---

## Three Common Process Models

A **process model** is a plan for how a software project is built — step by step.

| Feature | Waterfall | Incremental | Agile (Scrum) |
|---------|-----------|-------------|----------------|
| **How it works** | One big phase at a time: plan → design → build → test → deliver. | Build one feature at a time, deliver each when done. | Build in short cycles (sprints). Review, get feedback, adjust. |
| **Works best when** | Requirements never change (e.g. safety-critical systems). | Requirements are clear but large. | Requirements may change; team wants fast feedback. |
| **Flexibility** | Very low — hard to go back. | Medium — each feature is fixed once started. | High — change direction after every sprint. |
| **Customer involvement** | Only at start and end. | At end of each feature. | Every sprint — continuous feedback. |
| **Risk** | High — problems found late. | Medium — isolated to each feature. | Low — problems caught early. |
| **Documentation** | Very heavy upfront. | Moderate. | Just enough — working code is the main goal. |
| **Delivery** | One big release at the end. | After each feature is complete. | Working software every sprint. |

---

## Why We Chose Agile (Scrum-lite with One-Week Sprints)

Our project used a **light version of Scrum** (called "Scrum-lite") with one-week sprints. Here is why that was the right choice:

### 1. Requirements were not fully clear at the start
When we started, we did not know all the details — for example, which discount strategies to add (we added `StaffDiscount` later). Agile lets us add things without restarting.

### 2. We discovered issues during development
We switched the database from MongoDB to Firestore mid-project. With Waterfall, this would break the whole plan. With Agile, we changed only the repository layer and kept going.

### 3. Short sprints gave us regular checkpoints
Each sprint had a clear goal (e.g. "auth routes", "billing routes"). At the end of each sprint we could check: does it work? Does the test pass? This kept us on track.

### 4. Test-Driven Development (TDD) fits Agile
Writing a failing test before the code (TDD) is an Agile practice. We did this for `requireRole`, `StaffDiscount`, and `WhatsAppNotifier`.

---

## Our Sprint Plan (Actual)

| Sprint | Week | Goal |
|--------|------|------|
| 1 | 1 | Scaffold project, configure Jest + CI, connect Firestore (Singleton) |
| 2 | 2 | Core repositories, Zod schemas, types, 6 design patterns |
| 3 | 3 | Auth service + routes, `requireRole` helper (TDD) |
| 4 | 4 | Patient, Doctor, Appointment routes |
| 5 | 5 | Billing routes, `StaffDiscount` (TDD), `WhatsAppNotifier` (TDD) |
| 6 | 6 | Swagger `/api-docs`, Frontend pages (login, dashboard, patients, book, billing) |
| 7 | 7 | Selenium E2E tests, seed script, final documentation |

---

## Conclusion

Agile was the best choice because our requirements changed, we learned new tools along the way (Swagger, Firestore), and short sprints let us catch problems early. Waterfall would have been too rigid for a student project with evolving requirements.
