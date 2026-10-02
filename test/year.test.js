import { afterEach, describe, expect, it, vi } from 'vitest';
import { calculate } from '../src/domain/calculate.js';
import { DEFAULT_INPUTS } from '../src/domain/defaults.js';
import { currentYear, projectionYear } from '../src/domain/year.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('currentYear', () => {
  it('reads the system clock', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2031, 5, 15));
    expect(currentYear()).toBe(2031);
  });
});

describe('projectionYear', () => {
  it('labels projection year 1 as the reference year', () => {
    expect(projectionYear(1, 2026)).toBe(2026);
    expect(projectionYear(4, 2026)).toBe(2029);
  });
});

describe('calculate() reference year', () => {
  const usedCar = {
    ...DEFAULT_INPUTS,
    carYear: 2020,
    vehicleCondition: 'used',
    warrantyYearsRemaining: 0,
    repairReserveAnnual: 6000,
  };

  it('labels the cash flow from the injected year', () => {
    const R = calculate(DEFAULT_INPUTS, { year: 2030 });
    expect(R.cashflow.map((c) => c.year)).toEqual([2030, 2031, 2032, 2033]);
  });

  it('ages a used car against the injected year', () => {
    expect(calculate(usedCar, { year: 2026 }).baseAgeYears).toBe(6);
    expect(calculate(usedCar, { year: 2030 }).baseAgeYears).toBe(10);
    // An older car flattens its depreciation and grows its repair reserve.
    const now = calculate(usedCar, { year: 2026 });
    const later = calculate(usedCar, { year: 2030 });
    expect(later.valueAtEnd).toBeGreaterThan(now.valueAtEnd);
    expect(later.totalRepairReserve).toBeGreaterThan(now.totalRepairReserve);
  });

  it('defaults to the clock when no year is given', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2028, 0, 2));
    expect(calculate(usedCar).baseAgeYears).toBe(8);
    expect(calculate(usedCar).cashflow[0].year).toBe(2028);
  });
});
