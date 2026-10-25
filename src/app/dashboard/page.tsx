'use client';
import { useState } from 'react';

interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  start: string;
  end: string;
  status: string;
}

export default function DashboardPage() {
  const [doctorId, setDoctorId]         = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [msg, setMsg]                   = useState('');
  const [loading, setLoading]           = useState(false);

  async function fetchToday(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!doctorId.trim()) { setMsg('Please enter a doctor ID.'); return; }
    setMsg('');
    setLoading(true);
    try {
      const res = await fetch(`/api/appointments?doctorId=${encodeURIComponent(doctorId)}`);
      if (res.status === 401) { setMsg('Not authenticated. Please login.'); return; }
      const data = await res.json();
      if (!res.ok) { setMsg(data.error ?? 'Failed to load.'); return; }
      setAppointments(data);
    } catch {
      setMsg('Network error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <h1>Today&apos;s Appointments</h1>
      <div className="card">
        <form onSubmit={fetchToday} className="row">
          <input
            id="doctor-id"
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            placeholder="Doctor ID"
            style={{ marginBottom: 0 }}
          />
          <button id="fetch-btn" type="submit" disabled={loading}>
            {loading ? 'Loading…' : 'Load'}
          </button>
        </form>
        {msg && <p id="msg" className="msg error">{msg}</p>}
      </div>

      {appointments.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Patient</th>
              <th>Start</th>
              <th>End</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>{a.patientId}</td>
                <td>{new Date(a.start).toLocaleTimeString()}</td>
                <td>{new Date(a.end).toLocaleTimeString()}</td>
                <td>{a.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {appointments.length === 0 && !msg && !loading && (
        <p style={{ color: 'var(--muted)', marginTop: 16 }}>No appointments loaded yet.</p>
      )}
    </div>
  );
}
