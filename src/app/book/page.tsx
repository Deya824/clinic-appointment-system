'use client';
import { useState } from 'react';

export default function BookPage() {
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId]   = useState('');
  const [start, setStart]         = useState('');
  const [end, setEnd]             = useState('');
  const [msg, setMsg]             = useState('');
  const [msgOk, setMsgOk]         = useState(false);
  const [loading, setLoading]     = useState(false);

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    setMsgOk(false);

    // Basic client-side validation — stable id "msg" will show the error
    if (!patientId.trim() || !doctorId.trim() || !start || !end) {
      setMsg('All fields are required.');
      return;
    }
    if (new Date(start) <= new Date()) {
      setMsg('Start time must be in the future.');
      return;
    }
    if (new Date(end) <= new Date(start)) {
      setMsg('End time must be after start time.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          doctorId,
          start: new Date(start).toISOString(),
          end:   new Date(end).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMap: Record<number, string> = {
          401: 'Not authenticated — please login.',
          409: 'That time slot is already booked.',
          400: data.error ?? 'Invalid input.',
        };
        setMsg(errorMap[res.status] ?? data.error ?? 'Booking failed.');
      } else {
        setMsgOk(true);
        setMsg(`Appointment booked! ID: ${data.id}`);
        setPatientId(''); setDoctorId(''); setStart(''); setEnd('');
      }
    } catch {
      setMsg('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <header className="page-header">
        <h1>Book Appointment</h1>
        <p>Reserve a time slot for a patient with a doctor.</p>
      </header>

      <div className="card">
        <h2 className="card-title"><span className="dot">1</span>Appointment details</h2>
        <form onSubmit={handleBook}>
          <div className="grid2">
            <div>
              <label htmlFor="patient-id">Patient ID</label>
              <input
                id="patient-id"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="e.g. abc123"
                required
              />
            </div>
            <div>
              <label htmlFor="doctor-id">Doctor ID</label>
              <input
                id="doctor-id"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                placeholder="e.g. def456"
                required
              />
            </div>
          </div>

          <div className="grid2">
            <div>
              <label htmlFor="start">Start Date &amp; Time</label>
              <input
                id="start"
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="end">End Date &amp; Time</label>
              <input
                id="end"
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
              />
            </div>
          </div>

          <button id="book-btn" type="submit" className="btn-block" disabled={loading}>
            {loading ? 'Booking…' : 'Book Appointment'}
          </button>
        </form>
        {msg && (
          <p id="msg" className={`msg ${msgOk ? 'ok' : 'error'}`}>{msg}</p>
        )}
      </div>
    </div>
  );
}