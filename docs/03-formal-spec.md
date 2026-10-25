# Formal Specification

> **In simple words:** This document says the exact rules that must be true BEFORE and AFTER important actions — like booking an appointment or paying a bill.

---

## What are Pre-conditions and Post-conditions?

- A **pre-condition** is what must be true **before** an action can happen. If a pre-condition is not met, the system rejects the request.
- A **post-condition** is what will be true **after** an action succeeds.

Think of it like a hotel check-in desk:
- **Pre-condition:** You must have a booking and a valid ID.
- **Post-condition:** You have a room key and the room is marked "occupied".

---

## Operation 1: Book an Appointment

**Service method:** `AppointmentService.book(input)`
**File:** `src/services/AppointmentService.ts`

### Pre-conditions (all must be true)

| # | Condition | HTTP error if violated |
|---|-----------|----------------------|
| P1 | The caller is authenticated (valid JWT cookie). | 401 Unauthorized |
| P2 | `patientId` and `doctorId` are non-empty strings. | 400 Bad Request |
| P3 | `start` and `end` are valid ISO 8601 datetime strings. | 400 Bad Request |
| P4 | `start` is **in the future** (strictly after current time). | 400 Bad Request (PAST_BOOKING) |
| P5 | `end` is **after** `start`. | 400 Bad Request (INVALID_TIME_RANGE) |
| P6 | No existing appointment for the same doctor overlaps the requested `[start, end)` interval with status = "booked". | 409 Conflict (DOUBLE_BOOKING) |

### Post-conditions (all true after success)

| # | Condition |
|---|-----------|
| Q1 | A new Appointment document exists in Firestore with `status = "booked"`. |
| Q2 | The appointment has the given `patientId`, `doctorId`, `start`, `end`. |
| Q3 | An `appointment.booked` event has been emitted on the EventBus. |
| Q4 | All EventBus subscribers (email notifier, audit logger) have been called with the event payload. |
| Q5 | The HTTP response is 201 Created with the appointment object. |

### Formal notation (simplified Z-style)

```
book: AppointmentInput → Appointment

pre:
  now = current time
  start > now
  end > start
  ∀ a ∈ Appointments: a.doctorId = input.doctorId ∧ a.status = "booked"
    ⟹ a.end ≤ input.start ∨ a.start ≥ input.end

post:
  ∃ appt ∈ Appointments:
    appt.patientId = input.patientId ∧
    appt.doctorId  = input.doctorId  ∧
    appt.start     = input.start     ∧
    appt.end       = input.end       ∧
    appt.status    = "booked"
  EventBus.emit("appointment.booked", appt)
```

---

## Operation 2: Pay a Bill

**Service method:** `BillingService.pay(billId, amount)`
**File:** `src/services/BillingService.ts`

### Pre-conditions (all must be true)

| # | Condition | HTTP error if violated |
|---|-----------|----------------------|
| P1 | The caller is authenticated (valid JWT cookie). | 401 Unauthorized |
| P2 | A Bill with `billId` exists in Firestore. | 404 Not Found (BILL_NOT_FOUND) |
| P3 | The bill's `paymentStatus` is `"unpaid"`. | 400 Bad Request (ALREADY_PAID) |
| P4 | `amount` is greater than zero. | 400 Bad Request (INVALID_AMOUNT) |
| P5 | The payment gateway (`FakeGateway` or `BkashAdapter`) returns `success = true`. | 400 Bad Request (PAYMENT_FAILED) |

### Post-conditions (all true after success)

| # | Condition |
|---|-----------|
| Q1 | The Bill document in Firestore has `paymentStatus = "paid"`. |
| Q2 | The Bill document has a `paymentRef` string (the transaction ID from the gateway). |
| Q3 | The HTTP response is 200 OK with the updated bill object. |

### Formal notation (simplified Z-style)

```
pay: (billId: string, amount: number) → Bill

pre:
  ∃ b ∈ Bills: b.id = billId
  b.paymentStatus = "unpaid"
  amount > 0
  gateway.charge(amount, billId).success = true

post:
  b.paymentStatus = "paid"
  b.paymentRef    = gateway.charge(amount, billId).transactionId
```

---

## Operation 3: Register a Patient (summary)

| | Condition |
|--|-----------|
| **Pre** | `phone` matches regex `/^\+?[0-9]{10,15}$/`. No existing patient has the same phone. |
| **Post** | A Patient document is created. `createdAt` is set to the current timestamp. HTTP 201 returned. |

---

## Why Formal Specification Matters

Formal specifications help developers and testers agree on exact rules before writing code. They also make unit tests easier to write — each test simply checks one pre-condition or post-condition.

For example, the test `'throws DOUBLE_BOOKING when overlapping slot exists'` directly tests pre-condition P6 above.
