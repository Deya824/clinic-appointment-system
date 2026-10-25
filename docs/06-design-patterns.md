# Design Patterns

> **In simple words:** A design pattern is a named solution to a common problem in code. This document explains the six patterns used in this project — why each was chosen, and a rejected alternative.

---

## 1. Singleton

| Field | Detail |
|-------|--------|
| **Category** | Creational — about creating objects |
| **File** | `src/lib/db.ts` |
| **Problem** | Firebase Admin SDK must be initialised exactly once. In Next.js dev mode, modules reload often, which would create duplicate app instances and crash. |
| **Solution** | `getDb()` keeps one private `db` variable. If it already exists, it returns it immediately. Otherwise it initialises Firebase once and stores the result. |
| **Rejected alternative** | Calling `initializeApp()` directly in every repository file — this would crash with "app already exists" on hot reload. |
| **Everyday example** | A country has only one president. When anyone asks "who is president?" they always get the same person — no new president is created for each question. |

---

## 2. Factory Method

| Field | Detail |
|-------|--------|
| **Category** | Creational — about creating objects |
| **File** | `src/patterns/notifications/NotificationFactory.ts` |
| **Problem** | The code that needs to send notifications should not know whether it sends email, SMS, or WhatsApp. Adding a new channel should not change existing code. |
| **Solution** | `NotificationFactory.create('email' | 'sms' | 'whatsapp')` returns the correct `Notifier` object. The caller only knows the `Notifier` interface — not the concrete class. |
| **Rejected alternative** | A big `if/else` block in `container.ts` — every new channel would require editing that block, risking bugs in unrelated channels. |
| **Everyday example** | A coffee machine has buttons: Espresso, Latte, Cappuccino. You press one button (the factory), and the machine creates the right drink. You do not need to know how the milk is frothed. |

---

## 3. Adapter

| Field | Detail |
|-------|--------|
| **Category** | Structural — about connecting objects |
| **File** | `src/patterns/payments/PaymentGateway.ts` |
| **Problem** | The Bkash payment API has a different shape (`executePayment({ amount, merchantInvoiceNumber })`) than our internal `PaymentGateway` interface (`charge(amount, ref)`). Our `BillingService` should not know about Bkash-specific details. |
| **Solution** | `BkashAdapter` wraps `BkashClient` and translates between the two shapes. `BillingService` only ever talks to the `PaymentGateway` interface. A `FakeGateway` is used in tests and demos. |
| **Rejected alternative** | Putting Bkash-specific logic directly in `BillingService` — then switching to a different gateway would require rewriting the service. |
| **Everyday example** | A travel plug adapter lets you plug a UK plug into a US socket. Your device does not change — only the adapter does. |

---

## 4. Strategy

| Field | Detail |
|-------|--------|
| **Category** | Behavioral — about how objects communicate |
| **File** | `src/patterns/billing/DiscountStrategy.ts` |
| **Problem** | Different patient types get different discounts: regular (0%), senior (20%), insured (50%), staff (30%). Without a pattern, `BillingService` would have a messy chain of `if/else` statements that grows every time a new type is added. |
| **Solution** | Each discount rule is its own class implementing `DiscountStrategy`. A registry maps patient type → strategy. `BillingService` calls `getDiscount(patientType).calculate(fee)` — no if/else needed. |
| **Rejected alternative** | One `switch` statement in `BillingService` — adding a new patient type requires editing the service, breaking the Open/Closed Principle. |
| **Everyday example** | A taxi pricing system: economy, standard, and premium cars each apply a different price formula. You pick the right formula (strategy) for the car type — the rest of the booking system stays the same. |

---

## 5. Observer

| Field | Detail |
|-------|--------|
| **Category** | Behavioral — about how objects communicate |
| **File** | `src/patterns/events/EventBus.ts` |
| **Problem** | When an appointment is booked, several things must happen: send an email, write an audit log entry. If `AppointmentService` called these directly, it would be tightly coupled to the email and logging systems. Adding a new reaction (e.g. WhatsApp) would require editing `AppointmentService`. |
| **Solution** | `AppointmentService` emits an event (`appointment.booked`) on the `EventBus`. Subscribers (email notifier, audit logger) register themselves in `container.ts`. The service knows nothing about what listens. |
| **Rejected alternative** | Direct method calls inside `AppointmentService` — tight coupling, harder to test, harder to add new reactions. |
| **Everyday example** | A YouTube channel. When you upload a video, all subscribers are notified automatically. You do not call each subscriber one by one — YouTube's notification system does it. |

---

## 6. Facade

| Field | Detail |
|-------|--------|
| **Category** | Structural — about connecting objects |
| **File** | `src/patterns/booking/BookingFacade.ts` |
| **Problem** | Booking an appointment also requires creating a bill. A route handler that does both would need to know about `AppointmentService`, `DoctorService`, and `BillingService` — too many dependencies for one route. |
| **Solution** | `BookingFacade.bookAndBill(input)` coordinates all three services internally. The route handler calls one method and gets back `{ appointment, bill }`. |
| **Rejected alternative** | The route handler calling all three services directly — this puts business logic in the HTTP layer, which breaks the layering rule and makes the route harder to test. |
| **Everyday example** | Booking a holiday package. You call one travel agent (the facade) who books the flight, hotel, and transfer for you. You do not call each provider separately. |
