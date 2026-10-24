/**
 * TDD — StaffDiscount (30% off).
 * Written BEFORE StaffDiscount class exists.
 * Also tests that getDiscount('staff') returns the new strategy.
 */

import {
  NoDiscount, SeniorDiscount, InsuranceDiscount, getDiscount,
  StaffDiscount,          // does NOT exist yet → test suite will fail to compile
} from '@/patterns/billing/DiscountStrategy';

describe('StaffDiscount (new Strategy)', () => {
  it('returns 30% of fee', () => {
    expect(new StaffDiscount().calculate(1000)).toBe(300);
  });

  it('rounds down correctly for non-round fees', () => {
    expect(new StaffDiscount().calculate(333)).toBe(Math.round(333 * 0.30));
  });

  it('getDiscount("staff") returns StaffDiscount', () => {
    const s = getDiscount('staff');
    expect(s.calculate(1000)).toBe(300);
  });

  it('getDiscount("staff") is distinct from SeniorDiscount', () => {
    expect(getDiscount('staff').calculate(100)).not.toBe(new SeniorDiscount().calculate(100));
  });

  // Existing strategies must be unchanged
  it('existing strategies are unaffected', () => {
    expect(new NoDiscount().calculate(500)).toBe(0);
    expect(new SeniorDiscount().calculate(500)).toBe(100);
    expect(new InsuranceDiscount().calculate(500)).toBe(250);
  });
});
