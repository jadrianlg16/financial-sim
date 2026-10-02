import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyCarPresetTo, cloneInputs } from '../src/domain/compare.js';
import { DEFAULT_INPUTS } from '../src/domain/defaults.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('applyCarPresetTo', () => {
  it('applies a used preset with used-car assumptions', () => {
    const next = applyCarPresetTo({ ...DEFAULT_INPUTS, repairReserveAnnual: 0 }, 'used_versa_20');
    expect(next).toMatchObject({
      carPreset: 'used_versa_20',
      carPrice: 195000,
      vehicleCondition: 'used',
      carYear: 2020,
      odometerKm: 80000,
      warrantyYearsRemaining: 0,
      repairReserveAnnual: 6000,
      interestRate: 0.16,
    });
  });

  it('restores new-car assumptions and dates a new car to the current year', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2029, 2, 1));
    const used = applyCarPresetTo(DEFAULT_INPUTS, 'used_aveo_19');
    const next = applyCarPresetTo(used, 'toyota_yaris');
    expect(next).toMatchObject({
      vehicleCondition: 'new',
      carYear: 2029,
      odometerKm: 0,
      warrantyYearsRemaining: 3,
      repairReserveAnnual: 0,
    });
  });

  it('keeps a custom car as typed and ignores unknown presets', () => {
    const custom = applyCarPresetTo({ ...DEFAULT_INPUTS, carPrice: 123456 }, 'custom');
    expect(custom.carPreset).toBe('custom');
    expect(custom.carPrice).toBe(123456);
    expect(applyCarPresetTo(DEFAULT_INPUTS, 'nope')).toBe(DEFAULT_INPUTS);
  });

  it('does not mutate its input', () => {
    const prev = { ...DEFAULT_INPUTS };
    applyCarPresetTo(prev, 'mg_zs_ev');
    expect(prev).toEqual(DEFAULT_INPUTS);
  });
});

describe('cloneInputs', () => {
  it('returns an independent deep copy', () => {
    const copy = cloneInputs(DEFAULT_INPUTS);
    expect(copy).toEqual(DEFAULT_INPUTS);
    expect(copy).not.toBe(DEFAULT_INPUTS);
  });
});
