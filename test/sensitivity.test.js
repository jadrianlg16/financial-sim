import { describe, expect, it } from 'vitest';
import { calculate } from '../src/domain/calculate.js';
import { DEFAULT_INPUTS } from '../src/domain/defaults.js';
import { buildSensKeys, sensitivity } from '../src/domain/sensitivity.js';

const keysOf = (inputs) => buildSensKeys({ ...DEFAULT_INPUTS, ...inputs }).map((k) => k.key);

describe('buildSensKeys', () => {
  it('picks the energy variables for the powertrain', () => {
    expect(keysOf({ vehicleType: 'gasoline' })).toEqual(expect.arrayContaining(['fuelPrice', 'kmpl']));
    expect(keysOf({ vehicleType: 'diesel' })).toEqual(expect.arrayContaining(['dieselPrice', 'kmpl']));
    const ev = keysOf({ vehicleType: 'electric' });
    expect(ev).toEqual(expect.arrayContaining(['electricityPrice', 'kmPerKwh']));
    expect(ev).not.toContain('fuelPrice');
  });

  it('only varies electricity for a plug-in hybrid', () => {
    expect(keysOf({ vehicleType: 'hybrid', plugInHybrid: false })).not.toContain('electricityPrice');
    expect(keysOf({ vehicleType: 'hybrid', plugInHybrid: true })).toContain('electricityPrice');
  });

  it('drops ride-hailing variables when there is no Uber income', () => {
    const keys = keysOf({ operationMode: 'no-uber' });
    for (const k of ['avgFare', 'uberCommission', 'taxRate', 'uberKmPerTrip']) expect(keys).not.toContain(k);
    expect(keys).toContain('carPrice');
  });
});

describe('sensitivity', () => {
  it('measures break-even trips in Uber mode, ranked by swing', () => {
    const rows = sensitivity(DEFAULT_INPUTS);
    expect(rows).toHaveLength(buildSensKeys(DEFAULT_INPUTS).length);
    expect(rows.every((r) => r.metricUnit === 'viajes')).toBe(true);
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1].range).toBeGreaterThanOrEqual(rows[i].range);
  });

  it('reports each swing relative to the base case', () => {
    const base = calculate(DEFAULT_INPUTS).breakEvenTrips;
    const fare = sensitivity(DEFAULT_INPUTS).find((r) => r.key === 'avgFare');
    const lo = calculate({ ...DEFAULT_INPUTS, avgFare: DEFAULT_INPUTS.avgFare * 0.8 }).breakEvenTrips;
    const hi = calculate({ ...DEFAULT_INPUTS, avgFare: DEFAULT_INPUTS.avgFare * 1.2 }).breakEvenTrips;
    // A higher fare means fewer trips, so the low end of the bar is the +20% case.
    expect(fare.low).toBeCloseTo(hi - base, 9);
    expect(fare.high).toBeCloseTo(lo - base, 9);
    expect(fare.range).toBeCloseTo(lo - hi, 9);
  });

  it('measures net project cost in MXN without Uber', () => {
    const rows = sensitivity({ ...DEFAULT_INPUTS, operationMode: 'no-uber' });
    expect(rows.every((r) => r.metricUnit === 'MXN')).toBe(true);
    expect(rows[0].range).toBeGreaterThan(0);
  });
});
