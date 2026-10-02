import { describe, expect, it } from 'vitest';
import { depreciatedValue, effectiveDepRate } from '../src/domain/depreciation.js';

const newCar = { vehicleCondition: 'new', depreciationRate: 0.2, firstYearDepreciation: 0.25 };

describe('depreciatedValue', () => {
  it('returns the price at year 0', () => {
    expect(depreciatedValue(300000, newCar, 0)).toBe(300000);
  });

  it('declining balance loses the same share of the remaining value each year (default)', () => {
    expect(depreciatedValue(300000, newCar, 1)).toBeCloseTo(240000, 9);
    expect(depreciatedValue(300000, newCar, 3)).toBeCloseTo(300000 * 0.8 ** 3, 9);
  });

  it('straight line loses the same amount each year and never goes below zero', () => {
    const I = { ...newCar, depreciationMethod: 'straight' };
    expect(depreciatedValue(300000, I, 2)).toBeCloseTo(180000, 9);
    expect(depreciatedValue(300000, I, 6)).toBe(0);
  });

  it('"realistic" drops hard in year one, then declines', () => {
    const I = { ...newCar, depreciationMethod: 'realistic' };
    expect(depreciatedValue(300000, I, 1)).toBeCloseTo(225000, 9);
    expect(depreciatedValue(300000, I, 3)).toBeCloseTo(225000 * 0.8 ** 2, 9);
  });
});

describe('effectiveDepRate', () => {
  it('uses the list rate for a new car', () => {
    expect(effectiveDepRate(newCar)).toBe(0.2);
  });

  it('clamps an out-of-range list rate', () => {
    expect(effectiveDepRate({ ...newCar, depreciationRate: 2 })).toBe(0.95);
    expect(effectiveDepRate({ ...newCar, depreciationRate: 'abc' })).toBe(0);
  });
});
