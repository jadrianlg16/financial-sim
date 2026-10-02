import { describe, expect, it } from 'vitest';
import { calculate } from '../src/domain/calculate.js';
import { DEFAULT_INPUTS } from '../src/domain/defaults.js';
import { pmt } from '../src/domain/finance.js';

const YEAR = 2026;
const run = (overrides = {}) => calculate({ ...DEFAULT_INPUTS, carYear: YEAR, ...overrides }, { year: YEAR });

describe('calculate(DEFAULT_INPUTS)', () => {
  const R = run();

  it('finances the price minus a 20% down payment', () => {
    expect(R.cashPaid).toBeCloseTo(55980, 6);
    expect(R.financed).toBeCloseTo(223920, 6);
    expect(R.openingFee).toBeCloseTo(4478.4, 6);
    expect(R.upfrontCash).toBeCloseTo(55980 + 4478.4 + 400 + 900, 6);
    expect(R.monthlyPayment).toBeCloseTo(pmt(223920, 0.135, 48), 9);
    expect(R.monthlyPayment).toBeCloseTo(6062.93, 2);
  });

  it('solves break-even from the net contribution of one trip', () => {
    expect(R.breakEvenTrips).toBeCloseTo(155.94, 2);
    expect(R.breakEvenTrips * R.netContributionPerTrip).toBeCloseTo(R.fixedMonthlyCosts, 6);
    expect(R.hoursPerDay).toBeCloseTo(R.breakEvenTrips / 22 / 3, 9);
    expect(R.uberMonthlyKm).toBeCloseTo(R.breakEvenTrips * 8, 9);
    expect(R.feasible).toBe(true);
  });

  it('keeps the project totals consistent with each other', () => {
    expect(R.totalProjectCost).toBeCloseTo(R.totalSpentGross - R.terminalRecovery, 6);
    expect(R.netProjectResult).toBeCloseTo(R.cumRevenue + R.terminalRecovery - R.totalSpentGross, 6);
    expect(R.terminalRecovery).toBeCloseTo(R.actualSalePrice - R.remainingDebt, 6);
    expect(R.valueAtEnd).toBeCloseTo(279900 * 0.8 ** 4, 6);
  });

  it('reports the economic metrics', () => {
    expect(R.npvProject).toBeCloseTo(3670.75, 2);
    expect(R.irrProject).toBeCloseTo(0.1211, 4);
    expect(R.eac).toBeCloseTo(188758.54, 2);
    expect(R.costPerKm).toBeCloseTo(8.16, 2);
    // CAT includes the opening fee, so it sits above the effective annual rate.
    expect(R.cat).toBeGreaterThan(R.ear);
    expect(R.ear).toBeCloseTo((1 + 0.135 / 12) ** 12 - 1, 12);
  });

  it('labels the cash flow by calendar year, starting at the reference year', () => {
    expect(R.cashflow.map((c) => c.year)).toEqual([2026, 2027, 2028, 2029]);
  });
});

describe('calculate() across modes', () => {
  it('has no break-even and no ride-hailing costs without Uber', () => {
    const R = run({ operationMode: 'no-uber' });
    expect(R.isUberMode).toBe(false);
    expect(R.breakEvenTrips).toBe(0);
    expect(R.monthlyData).toBe(0);
    expect(R.oneTimeUberCosts).toBe(0);
    expect(R.feasible).toBe(true);
  });

  it('adds the profit target to the costs to cover', () => {
    const base = run();
    const target = run({ operationMode: 'uber-target-profit', monthlyProfitTarget: 5000 });
    expect(target.fixedMonthlyCosts - base.fixedMonthlyCosts).toBeCloseTo(5000, 6);
    expect(target.breakEvenTrips).toBeGreaterThan(base.breakEvenTrips);
  });

  it('treats a lease as rent: nothing financed, nothing to resell', () => {
    const R = run({ financeType: 'lease' });
    expect(R.isLease).toBe(true);
    expect(R.owned).toBe(false);
    expect(R.financed).toBe(0);
    expect(R.monthlyPayment).toBe(DEFAULT_INPUTS.leaseMonthly);
    expect(R.valueAtEnd).toBe(0);
    expect(R.terminalRecovery).toBe(0);
  });

  it('has no monthly payment when paid in cash', () => {
    const R = run({ purchaseMode: 'cash' });
    expect(R.financed).toBe(0);
    expect(R.monthlyPayment).toBe(0);
    expect(R.cashPaid).toBe(DEFAULT_INPUTS.carPrice);
  });

  it('marks the plan infeasible when every trip loses money', () => {
    const R = run({ avgFare: 40, uberCommission: 0.4, uberKmPerTrip: 16 });
    expect(R.netContributionPerTrip).toBeLessThan(0);
    expect(R.breakEvenTrips).toBe(Infinity);
    expect(R.feasible).toBe(false);
  });

  it('flags an EV whose daily distance exceeds its usable range', () => {
    const R = run({ vehicleType: 'electric', batteryCapacityKwh: 20, kmPerKwh: 5, uberKmPerTrip: 20 });
    expect(R.dailyRangeKm).toBeCloseTo(20 * 0.9 * 5, 9);
    expect(R.evRangeShortfall).toBe(true);
    expect(R.feasible).toBe(false);
  });

  it('keeps debt alive when the loan outlives the horizon', () => {
    const R = run({ loanMonths: 72, horizonYears: 2 });
    expect(R.remainingDebt).toBeGreaterThan(0);
    expect(R.remainingDebt).toBeCloseTo(R.amortRows[23].balance, 9);
  });

  it('survives malformed numbers without spreading NaN', () => {
    const R = run({ carPrice: 'abc', horizonYears: null, kmpl: 0 });
    expect(Number.isFinite(R.totalProjectCost)).toBe(true);
    expect(R.cashflow).toHaveLength(1);
  });
});
