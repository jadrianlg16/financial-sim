import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_INPUTS } from '../src/domain/defaults.js';
import { randomNormal, runMonteCarlo } from '../src/domain/monteCarlo.js';
import { seededRng } from './helpers/rng.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('randomNormal', () => {
  it('draws from the injected generator with roughly the requested mean and spread', () => {
    const rng = seededRng(1);
    const xs = Array.from({ length: 20000 }, () => randomNormal(10, 2, rng));
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length);
    expect(mean).toBeCloseTo(10, 1);
    expect(sd).toBeCloseTo(2, 1);
  });
});

describe('runMonteCarlo', () => {
  it('is reproducible for a given seed and uses only the injected generator', () => {
    vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random must not be called when rng is injected');
    });
    const a = runMonteCarlo(DEFAULT_INPUTS, 500, { rng: seededRng(42) });
    const b = runMonteCarlo(DEFAULT_INPUTS, 500, { rng: seededRng(42) });
    const c = runMonteCarlo(DEFAULT_INPUTS, 500, { rng: seededRng(43) });
    expect(a).toEqual(b);
    expect(c).not.toEqual(a);
  });

  it('summarizes the runs as ordered percentiles and a complete histogram', () => {
    const mc = runMonteCarlo(DEFAULT_INPUTS, 1000, { rng: seededRng(7) });
    expect(mc.iterations).toBe(1000);
    expect(mc.feasibleRate).toBeGreaterThan(0);
    expect(mc.feasibleRate).toBeLessThanOrEqual(1);
    for (const m of [mc.be, mc.fp, mc.net]) {
      expect(m.p10).toBeLessThanOrEqual(m.p50);
      expect(m.p50).toBeLessThanOrEqual(m.p90);
    }
    expect(mc.hist).toHaveLength(24);
    expect(mc.hist.reduce((a, h) => a + h.count, 0)).toBe(1000);
  });

  it('pins a seeded run of the default scenario (guards the order of random draws)', () => {
    const mc = runMonteCarlo(DEFAULT_INPUTS, 1000, { rng: seededRng(2026) });
    expect(mc.feasibleRate).toBe(1);
    expect(mc.be.p10).toBeCloseTo(128.6408, 4);
    expect(mc.be.p50).toBeCloseTo(155.0825, 4);
    expect(mc.be.p90).toBeCloseTo(193.1305, 4);
    expect(mc.totalLossProb).toBeCloseTo(1 - (1 - 0.015) ** 4, 12);
  });

  it('turns the total-loss risk off for a lease or a zero probability', () => {
    const lease = { ...DEFAULT_INPUTS, financeType: 'lease' };
    expect(runMonteCarlo(lease, 10, { rng: seededRng(1) }).totalLossProb).toBe(0);
    const noRisk = { ...DEFAULT_INPUTS, theftLossProbAnnual: 0 };
    expect(runMonteCarlo(noRisk, 10, { rng: seededRng(1) }).totalLossProb).toBe(0);
  });

  it('caps the cumulative write-off risk and lowers the liquidation value', () => {
    // 1 − (1 − 0.5)^6 ≈ 98%, capped at 95% cumulative.
    const risky = {
      ...DEFAULT_INPUTS,
      theftLossProbAnnual: 0.5,
      horizonYears: 6,
      purchaseMode: 'cash',
    };
    const safe = { ...risky, theftLossProbAnnual: 0 };
    const withLoss = runMonteCarlo(risky, 2000, { rng: seededRng(9) });
    const without = runMonteCarlo(safe, 2000, { rng: seededRng(9) });
    expect(withLoss.totalLossProb).toBe(0.95);
    expect(withLoss.fp.p50).toBeLessThan(without.fp.p50);
  });
});
