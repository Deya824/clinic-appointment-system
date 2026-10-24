/**
 * Dependency container — wires Firestore repositories into services and
 * registers EventBus subscribers.
 *
 * Imported by route handlers so they receive fully-wired service instances.
 * Unit tests NEVER import this file; they construct services with mocked repos.
 */

import { getDb } from '@/lib/db';

// Repositories (only layer allowed to touch firebase-admin)
import { FirestoreUserRepo }        from '@/repositories/FirestoreUserRepo';
import { FirestorePatientRepo }     from '@/repositories/FirestorePatientRepo';
import { FirestoreDoctorRepo, FirestoreScheduleRepo } from '@/repositories/FirestoreDoctorRepo';
import { FirestoreAppointmentRepo } from '@/repositories/FirestoreAppointmentRepo';
import { FirestoreBillRepo }        from '@/repositories/FirestoreBillRepo';

// Services
import { AuthService }        from '@/services/AuthService';
import { PatientService }     from '@/services/PatientService';
import { DoctorService }      from '@/services/DoctorService';
import { AppointmentService } from '@/services/AppointmentService';
import { BillingService }     from '@/services/BillingService';

// Patterns
import { EventBus }            from '@/patterns/events/EventBus';
import { BookingFacade }       from '@/patterns/booking/BookingFacade';
import { NotificationFactory } from '@/patterns/notifications/NotificationFactory';
import { FakeGateway }         from '@/patterns/payments/PaymentGateway';

/**
 * Build and return all wired service instances.
 * Called once per request (Next.js route handler); getDb() is a singleton
 * so the Firestore connection is reused.
 */
export function buildContainer() {
  const db = getDb();

  // Repositories
  const userRepo    = new FirestoreUserRepo(db);
  const patientRepo = new FirestorePatientRepo(db);
  const doctorRepo  = new FirestoreDoctorRepo(db);
  const scheduleRepo = new FirestoreScheduleRepo(db);
  const apptRepo    = new FirestoreAppointmentRepo(db);
  const billRepo    = new FirestoreBillRepo(db);

  // Observer: EventBus with two subscribers
  const bus = new EventBus();

  // Subscriber 1 — audit logger (Observer pattern)
  bus.on('appointment.booked', (e) =>
    console.log(`[AUDIT] appointment.booked id=${e.appointmentId} patient=${e.patientId}`)
  );
  bus.on('appointment.cancelled', (e) =>
    console.log(`[AUDIT] appointment.cancelled id=${e.appointmentId}`)
  );

  // Subscriber 2 — email notifier (Observer + Factory patterns)
  const emailNotifier = NotificationFactory.create('email');
  bus.on('appointment.booked', (e) =>
    emailNotifier.send(e.patientId, `Your appointment on ${e.start.toISOString()} is confirmed.`)
  );
  bus.on('appointment.cancelled', (e) =>
    emailNotifier.send(e.patientId, `Your appointment on ${e.start.toISOString()} has been cancelled.`)
  );

  // Services
  const authService    = new AuthService(userRepo);
  const patientService = new PatientService(patientRepo);
  const doctorService  = new DoctorService(doctorRepo, scheduleRepo);
  const apptService    = new AppointmentService(apptRepo, bus);
  const billingService = new BillingService(billRepo, patientRepo, new FakeGateway());

  // Facade
  const bookingFacade  = new BookingFacade(apptService, billingService, doctorService);

  return {
    authService,
    patientService,
    doctorService,
    apptService,
    billingService,
    bookingFacade,
  };
}
