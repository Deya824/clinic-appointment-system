'use client';
import { useState } from 'react';

interface Bill {
  id: string;
  appointmentId: string;
  patientId: string;
  amount: number;
  discount: number;
  paymentStatus: string;
}

export default function BillingPage() {
  // ── Create bill ───────────────────────────────────────────────────────────
  const [apptId, setApptId]     = useState('');
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId]   = useState('');
  const [createMsg, setCreateMsg] = useState('');
  const [createOk, setCreateOk]   = useState(false);
  const [newBill, setNewBill]     = useState<Bill | null>(null);
  const [creating, setCreating]   = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateMsg(''); setCreateOk(false); setNewBill(null);
    setCreating(true);
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: apptId, patientId, doctorId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateMsg(
          res.status === 409 ? 'Bill already exists for this appointment.' :
          res.status === 401 ? 'Not authenticated.' :
          (data.error ?? 'Failed to create bill.')
        );
      } else {
        setCreateOk(true);
        setCreateMsg(`Bill created (ID: ${data.id}). Amount: ৳${data.amount} (discount: ৳${data.discount})`);
        setNewBill(data);
        setApptId(''); setPatientId(''); setDoctorId('');
      }
    } catch {
      setCreateMsg('Network error.');
    } finally {
      setCreating(false);
    }
  }

  // ── Pay bill ──────────────────────────────────────────────────────────────
  const [billId, setBillId]   = useState('');
  const [amount, setAmount]   = useState('');
  const [payMsg, setPayMsg]   = useState('');
  const [payOk, setPayOk]     = useState(false);
  const [paying, setPaying]   = useState(false);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setPayMsg(''); setPayOk(false);
    if (!billId.trim() || !amount) { setPayMsg('Enter bill ID and amount.'); return; }
    setPaying(true);
    try {
      const res = await fetch(`/api/bills/${billId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPayMsg(
          res.status === 404 ? 'Bill not found.' :
          res.status === 400 ? (data.error ?? 'Invalid payment.') :
          (data.error ?? 'Payment failed.')
        );
      } else {
        setPayOk(true);
        setPayMsg(`Payment successful! Ref: ${data.paymentRef ?? 'N/A'}`);
        setBillId(''); setAmount('');
      }
    } catch {
      setPayMsg('Network error.');
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Billing</h1>
        <p>Generate a bill for an appointment and record payments.</p>
      </header>

      <div className="cols">
        {/* Create Bill */}
        <div className="card">
          <h2 className="card-title"><span className="dot">1</span>Create bill</h2>
          <form onSubmit={handleCreate}>
            <label htmlFor="appt-id">Appointment ID</label>
            <input id="appt-id" value={apptId} onChange={(e) => setApptId(e.target.value)} required />

            <label htmlFor="patient-id">Patient ID</label>
            <input id="patient-id" value={patientId} onChange={(e) => setPatientId(e.target.value)} required />

            <label htmlFor="doctor-id">Doctor ID</label>
            <input id="doctor-id" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required />

            <button id="create-bill-btn" type="submit" className="btn-block" disabled={creating}>
              {creating ? 'Creating…' : 'Create Bill'}
            </button>
          </form>
          {createMsg && (
            <p id="create-msg" className={`msg ${createOk ? 'ok' : 'error'}`}>{createMsg}</p>
          )}
          {newBill && (
            <div className="table-wrap" style={{ marginTop: 16 }}>
              <table>
                <tbody>
                  <tr><th>Bill ID</th><td className="mono">{newBill.id}</td></tr>
                  <tr><th>Amount</th><td>৳{newBill.amount}</td></tr>
                  <tr><th>Discount</th><td>৳{newBill.discount}</td></tr>
                  <tr><th>Status</th><td><span className={`badge ${newBill.paymentStatus}`}>{newBill.paymentStatus}</span></td></tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pay Bill */}
        <div className="card">
          <h2 className="card-title"><span className="dot">2</span>Pay bill</h2>
          <form onSubmit={handlePay}>
            <label htmlFor="bill-id">Bill ID</label>
            <input id="bill-id" value={billId} onChange={(e) => setBillId(e.target.value)} required />

            <label htmlFor="pay-amount">Amount (৳)</label>
            <input
              id="pay-amount"
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />

            <button id="pay-btn" type="submit" className="btn-block" disabled={paying}>
              {paying ? 'Processing…' : 'Pay Now'}
            </button>
          </form>
          {payMsg && (
            <p id="msg" className={`msg ${payOk ? 'ok' : 'error'}`}>{payMsg}</p>
          )}
        </div>
      </div>
    </div>
  );
}