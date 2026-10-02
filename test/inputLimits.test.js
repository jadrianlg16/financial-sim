import { describe, expect, it } from 'vitest';
import { applyImportedJson } from '../src/domain/aiCase.js';
import { calculate } from '../src/domain/calculate.js';
import { DEFAULT_INPUTS } from '../src/domain/defaults.js';
import { INPUT_LIMITS, clampInput } from '../src/domain/inputSchema.js';
import { runMonteCarlo } from '../src/domain/monteCarlo.js';
import { seededRng } from './helpers/rng.js';

const run = (overrides) => calculate({ ...DEFAULT_INPUTS, ...overrides }, { year: 2026 });

describe('input limits', () => {
  it('caps the horizon at 30 years', () => {
    expect(run({ horizonYears: 200 }).cashflow).toHaveLength(30);
    expect(run({ horizonYears: 0 }).cashflow).toHaveLength(1);
  });

  it('caps loan and lease terms at 120 months', () => {
    const loan = run({ loanMonths: 600 });
    expect(loan.months).toBe(120);
    expect(loan.amortRows).toHaveLength(120);
    expect(run({ financeType: 'lease', leaseTermMonths: 600 }).months).toBe(120);
  });

  it('keeps values that would freeze the page bounded', () => {
    const start = Date.now();
    const R = run({ horizonYears: 1e5, loanMonths: 1e7 });
    expect(R.cashflow).toHaveLength(30);
    expect(R.amortRows).toHaveLength(120);
    const mc = runMonteCarlo({ ...DEFAULT_INPUTS, horizonYears: 1e5 }, 50, {
      rng: seededRng(1),
      year: 2026,
    });
    expect(mc.totalLossProb).toBeCloseTo(Math.min(0.95, 1 - (1 - 0.015) ** 30), 12);
    expect(Date.now() - start).toBeLessThan(2000);
  });

  it('clamps an imported lease term', () => {
    const { inputs } = applyImportedJson({ financing: { leaseTermMonths: 1e9 } }, DEFAULT_INPUTS);
    expect(inputs.leaseTermMonths).toBe(120);
  });

  it('leaves inputs without limits alone', () => {
    expect(clampInput('carPrice', 1e9)).toBe(1e9);
    expect(clampInput('loanMonths', 48)).toBe(48);
    expect(INPUT_LIMITS.horizonYears).toEqual([1, 30]);
  });
});
