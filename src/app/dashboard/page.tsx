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
      <header className="page-header">
        <h1>Today&apos;s Appointments</h1>
        <p>Look up a doctor&apos;s schedule for the day.</p>
      </header>

      <div className="card">
        <h2 className="card-title"><span className="dot">⌕</span>Find schedule</h2>
        <form onSubmit={fetchToday} className="row">
          <input
            id="doctor-id"
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            placeholder="Doctor ID"
          />
          <button id="fetch-btn" type="submit" disabled={loading}>
            {loading ? 'Loading…' : 'Load'}
          </button>
        </form>
        {msg && <p id="msg" className="msg error">{msg}</p>}
      </div>

      {appointments.length > 0 && (
        <div className="table-wrap">
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
                  <td className="mono">{a.id}</td>
                  <td className="mono">{a.patientId}</td>
                  <td>{new Date(a.start).toLocaleTimeString()}</td>
                  <td>{new Date(a.end).toLocaleTimeString()}</td>
                  <td><span className={`badge ${a.status}`}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {appointments.length === 0 && !msg && !loading && (
        <div className="empty">
          <strong>No appointments loaded yet</strong>
          Enter a doctor ID above to see their schedule.
        </div>
      )}
    </div>
  );
}