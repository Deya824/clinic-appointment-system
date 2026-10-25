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
        <nav>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', marginRight: 8 }}>🏥 Clinic</span>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/patients">Patients</Link>
          <Link href="/book">Book</Link>
          <Link href="/billing">Billing</Link>
          <Link href="/api-docs" target="_blank">API Docs</Link>
          <span style={{ flex: 1 }} />
          <Link href="/login">Login</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}