/**
 * PATTERN: Observer (Event Bus)
 * WHY: AppointmentService should not know about notifications or audit logging.
 *      Instead it emits events; any subscriber (notifier, logger) reacts.
 *      This keeps modules decoupled — adding a new subscriber never changes
 *      AppointmentService.
 *
 * Simple synchronous pub/sub. For production, replace with a queue (e.g. PubSub).
 */

export type EventName = 'appointment.booked' | 'appointment.cancelled';

export interface EventPayload {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  start: Date;
}

type Handler = (payload: EventPayload) => void;

export class EventBus {
  private handlers: Map<EventName, Handler[]> = new Map();

  /** Register a subscriber for an event. */
  on(event: EventName, handler: Handler): void {
    const list = this.handlers.get(event) ?? [];
    list.push(handler);
    this.handlers.set(event, list);
  }

  /** Emit an event to all registered subscribers. */
  emit(event: EventName, payload: EventPayload): void {
    const list = this.handlers.get(event) ?? [];
    list.forEach(h => h(payload));
  }
}
