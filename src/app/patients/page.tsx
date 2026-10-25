'use client';
import { useState } from 'react';

interface Patient {
  id: string;
  name: string;
  phone: string;
  dob: string;
  patientType: string;
}

export default function PatientsPage() {
  // ── Search ────────────────────────────────────────────────────────────────
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState<Patient[]>([]);
  const [searchMsg, setSearchMsg] = useState('');

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchMsg('');
    const res = await fetch(`/api/patients?q=${encodeURIComponent(query)}`);
    if (res.status === 401) { setSearchMsg('Not authenticated.'); return; }
    const data = await res.json();
    if (!res.ok) { setSearchMsg(data.error ?? 'Search failed.'); return; }
    setResults(data);
    if (data.length === 0) setSearchMsg('No patients found.');
  }

  // ── Register ──────────────────────────────────────────────────────────────
  const [name, setName]               = useState('');
  const [phone, setPhone]             = useState('');
  const [dob, setDob]                 = useState('');
  const [patientType, setPatientType] = useState('regular');
  const [regMsg, setRegMsg]           = useState('');
  const [regOk, setRegOk]             = useState(false);
  const [loading, setLoading]         = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegMsg('');
    setRegOk(false);
    setLoading(true);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, dob, patientType }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegMsg(
          res.status === 409 ? 'Phone number already in use.' : (data.error ?? 'Registration failed.')
        );
      } else {
        setRegOk(true);
        setRegMsg(`Patient registered (ID: ${data.id})`);
        setName(''); setPhone(''); setDob(''); setPatientType('regular');
      }
    } catch {
      setRegMsg('Network error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Patients</h1>
        <p>Search existing records or register a new patient.</p>
      </header>

      {/* Search */}
      <div className="card">
        <h2 className="card-title"><span className="dot">⌕</span>Search patients</h2>
        <form onSubmit={handleSearch} className="row">
          <input
            id="search-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name or phone…"
          />
          <button id="search-btn" type="submit">Search</button>
        </form>
        {searchMsg && <p id="search-msg" className="msg error">{searchMsg}</p>}
        {results.length > 0 && (
          <div className="table-wrap" style={{ marginTop: 18 }}>
            <table>
              <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Type</th></tr></thead>
              <tbody>
                {results.map((p) => (
                  <tr key={p.id}>
                    <td className="mono">{p.id}</td>
                    <td>{p.name}</td>
                    <td>{p.phone}</td>
                    <td><span className="badge">{p.patientType}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register */}
      <div className="card">
        <h2 className="card-title"><span className="dot">+</span>Register new patient</h2>
        <form onSubmit={handleRegister}>
          <div className="grid2">
            <div>
              <label htmlFor="patient-name">Full Name</label>
              <input id="patient-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="patient-phone">Phone</label>
              <input id="patient-phone" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+8801700000000" />
            </div>
          </div>

          <div className="grid2">
            <div>
              <label htmlFor="patient-dob">Date of Birth</label>
              <input id="patient-dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="patient-type">Patient Type</label>
              <select id="patient-type" value={patientType} onChange={(e) => setPatientType(e.target.value)}>
                <option value="regular">Regular</option>
                <option value="senior">Senior (20% off)</option>
                <option value="insured">Insured (50% off)</option>
                <option value="staff">Staff (30% off)</option>
              </select>
            </div>
          </div>

          <button id="register-btn" type="submit" className="btn-block" disabled={loading}>
            {loading ? 'Registering…' : 'Register Patient'}
          </button>
        </form>
        {regMsg && (
          <p id="msg" className={`msg ${regOk ? 'ok' : 'error'}`}>{regMsg}</p>
        )}
      </div>
    </div>
  );
}