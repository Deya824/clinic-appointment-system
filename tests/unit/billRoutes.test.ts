/**
 * Route-layer tests for the bill routes.
 * The container (Firestore, services) and requireRole are mocked,
 * so no database, network or real login is used.
 */

const mockRequireRole = jest.fn();
const mockGetById = jest.fn();
const mockCreateBillWithFee = jest.fn();
const mockPay = jest.fn();

jest.mock('@/app/api/_helpers/requireRole', () => ({
  requireRole: (...args: unknown[]) => mockRequireRole(...args),
}));

jest.mock('@/lib/container', () => ({
  buildContainer: () => ({
    doctorService: { getById: mockGetById },
    billingService: { createBillWithFee: mockCreateBillWithFee, pay: mockPay },
  }),
}));

import { POST as createBill } from '@/app/api/bills/route';
import { POST as payBill } from '@/app/api/bills/[id]/pay/route';

// Minimal fake request: only the parts the routes use
const fakeReq = (body: unknown) =>
  ({ json: async () => body, cookies: { get: () => undefined } }) as any;

const params = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  jest.clearAllMocks();
  mockRequireRole.mockResolvedValue({ sub: 'u1', role: 'receptionist' });
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('POST /api/bills (create bill)', () => {
  const body = { appointmentId: 'a1', patientId: 'p1', doctorId: 'd1' };

  it('returns 401 when the user is not logged in', async () => {
    mockRequireRole.mockRejectedValue({ status: 401, message: 'No authentication token found.' });
    const res = await createBill(fakeReq(body));
    expect(res.status).toBe(401);
    expect(mockCreateBillWithFee).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid input', async () => {
    const res = await createBill(fakeReq({ appointmentId: '' }));
    expect(res.status).toBe(400);
  });

  it('creates the bill using the doctor fee and returns 201', async () => {
    mockGetById.mockResolvedValue({ consultationFee: 600 });
    mockCreateBillWithFee.mockResolvedValue({ id: 'b1', total: 600 });
    const res = await createBill(fakeReq(body));
    expect(res.status).toBe(201);
    expect(mockCreateBillWithFee).toHaveBeenCalledWith('a1', 'p1', 600);
  });

  it('returns 409 when a bill already exists', async () => {
    mockGetById.mockResolvedValue({ consultationFee: 600 });
    mockCreateBillWithFee.mockRejectedValue(new Error('BILL_EXISTS'));
    const res = await createBill(fakeReq(body));
    expect(res.status).toBe(409);
  });

  it('returns 404 when the doctor is not found', async () => {
    mockGetById.mockRejectedValue(new Error('NOT_FOUND'));
    const res = await createBill(fakeReq(body));
    expect(res.status).toBe(404);
  });

  it('returns 500 for an unexpected error', async () => {
    mockGetById.mockRejectedValue(new Error('boom'));
    const res = await createBill(fakeReq(body));
    expect(res.status).toBe(500);
  });
});

describe('POST /api/bills/[id]/pay (pay bill)', () => {
  it('returns 403 when the role is not allowed', async () => {
    mockRequireRole.mockRejectedValue({ status: 403, message: 'Role not allowed.' });
    const res = await payBill(fakeReq({ amount: 100 }), params('b1'));
    expect(res.status).toBe(403);
  });

  it('returns 400 for an invalid amount', async () => {
    const res = await payBill(fakeReq({ amount: -5 }), params('b1'));
    expect(res.status).toBe(400);
    expect(mockPay).not.toHaveBeenCalled();
  });

  it('returns 200 when payment succeeds', async () => {
    mockPay.mockResolvedValue({ id: 'b1', status: 'paid' });
    const res = await payBill(fakeReq({ amount: 100 }), params('b1'));
    expect(res.status).toBe(200);
    expect(mockPay).toHaveBeenCalledWith('b1', 100);
  });

  it('returns 400 when the payment fails (payment-failure case)', async () => {
    mockPay.mockRejectedValue(new Error('PAYMENT_FAILED'));
    const res = await payBill(fakeReq({ amount: 100 }), params('b1'));
    expect(res.status).toBe(400);
  });

  it('returns 400 when the bill is already paid', async () => {
    mockPay.mockRejectedValue(new Error('ALREADY_PAID'));
    const res = await payBill(fakeReq({ amount: 100 }), params('b1'));
    expect(res.status).toBe(400);
  });

  it('returns 404 when the bill is not found', async () => {
    mockPay.mockRejectedValue(new Error('BILL_NOT_FOUND'));
    const res = await payBill(fakeReq({ amount: 100 }), params('zz'));
    expect(res.status).toBe(404);
  });
});