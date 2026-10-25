'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg]           = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? 'Login failed.');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setMsg('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth">
      <section className="auth-brand">
        <div className="brand">
          <span className="brand-mark">+</span>
          <div>
            <strong>CareClinic</strong>
            <small>Management System</small>
          </div>
        </div>
        <div>
          <h2>Appointments and billing, in one place.</h2>
          <p>A simple workspace for front-desk staff, doctors and administrators.</p>
          <ul className="auth-points">
            <li>Double-booking protection for every doctor</li>
            <li>Automatic patient discounts at billing</li>
            <li>Secure, role-based access</li>
          </ul>
        </div>
        <div className="auth-foot">© CareClinic · Lab 6 Project</div>
      </section>

      <section className="auth-panel">
        <div className="auth-box">
          <h1>Login</h1>
          <p className="lead">Sign in to continue to your dashboard.</p>
          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@clinic.com"
            />
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••"
            />
            <button id="login-btn" type="submit" className="btn-block" disabled={loading}>
              {loading ? 'Logging in…' : 'Login'}
            </button>
          </form>
          {msg && <p id="msg" className={`msg ${msg.startsWith('Login') ? 'ok' : 'error'}`}>{msg}</p>}
        </div>
      </section>
    </div>
  );
}
