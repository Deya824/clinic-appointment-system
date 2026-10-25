import Link from 'next/link';

const MODULES = [
  { href: '/dashboard', icon: '▦',   title: 'Dashboard',        text: "View a doctor's appointments for the day." },
  { href: '/patients',  icon: '☺',   title: 'Patients',         text: 'Search records and register new patients.' },
  { href: '/book',      icon: '◷',   title: 'Book Appointment', text: 'Reserve a slot with double-booking protection.' },
  { href: '/billing',   icon: '৳',   title: 'Billing',          text: 'Create bills, apply discounts, record payments.' },
  { href: '/api-docs',  icon: '{ }', title: 'API Docs',         text: 'Explore and test every endpoint in Swagger.' },
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero-inner">
          <span className="hero-tag">Clinic Management System</span>
          <h1>Appointments and billing, in one place.</h1>
          <p>
            A simple workspace for front-desk staff, doctors and administrators
            to manage patients, schedules and payments.
          </p>
          <div className="hero-actions">
            <Link href="/login" className="btn-link primary">Login</Link>
            <Link href="/api-docs" target="_blank" className="btn-link ghost">View API Docs</Link>
          </div>
        </div>
      </section>

      <section className="home-section">
        <h2>Everything you need</h2>
        <div className="module-grid">
          {MODULES.map((m) => (
            <Link key={m.href} href={m.href} className="module-card">
              <span className="module-icon">{m.icon}</span>
              <strong>{m.title}</strong>
              <span>{m.text}</span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="home-foot">© Clinic System · CSE 3206</footer>
    </main>
  );
}