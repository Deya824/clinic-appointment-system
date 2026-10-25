import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Clinic System',
  description: 'Clinic Appointment & Billing System — CSE 3206',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav className="site-nav">
          <div className="site-nav-inner">
            <Link href="/" className="site-brand">
              <span className="brand-mark sm">🏥</span>
              Clinic
            </Link>
            <div className="site-links">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/patients">Patients</Link>
              <Link href="/book">Book</Link>
              <Link href="/billing">Billing</Link>
              <Link href="/api-docs" target="_blank">API Docs ↗</Link>
            </div>
            <Link href="/login" className="site-cta">Login</Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}