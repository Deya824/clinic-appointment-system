/**
 * PATTERN: Strategy
 * WHY: Discount calculation varies by patient type (regular / senior / insured).
 *      Instead of a big if/else in BillingService, each rule is its own class.
 *      A registry maps patient type → strategy, so adding a new type only
 *      requires a new class and one registry entry.
 */

/** All discount strategies implement this interface. */
export interface DiscountStrategy {
  calculate(fee: number): number; // returns amount to DEDUCT (not the final price)
}

/** Regular patients get no discount. */
export class NoDiscount implements DiscountStrategy {
  calculate(_fee: number): number {
    return 0;
  }
}

/** Senior patients (60+) get 20% off. */
export class SeniorDiscount implements DiscountStrategy {
  calculate(fee: number): number {
    return Math.round(fee * 0.20);
  }
}

/** Insured patients get 50% off. */
export class InsuranceDiscount implements DiscountStrategy {
  calculate(fee: number): number {
    return Math.round(fee * 0.50);
  }
}

/** Registry: maps patient type string → strategy instance. */
export const discountRegistry: Record<string, DiscountStrategy> = {
  regular:  new NoDiscount(),
  senior:   new SeniorDiscount(),
  insured:  new InsuranceDiscount(),
};

/** Returns the strategy for a given patient type, defaulting to NoDiscount. */
export function getDiscount(patientType: string): DiscountStrategy {
  return discountRegistry[patientType] ?? new NoDiscount();
}
