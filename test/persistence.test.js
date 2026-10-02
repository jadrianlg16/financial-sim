import { afterEach, describe, expect, it, vi } from 'vitest';
import { calculate } from '../src/domain/calculate.js';
import { SCENARIO_COLORS } from '../src/domain/constants.js';
import { DEFAULT_INPUTS } from '../src/domain/defaults.js';
import { sanitizeInputs } from '../src/domain/inputSchema.js';
import {
  clearPersisted,
  readPersisted,
  readSidebarMode,
  sanitizePersisted,
} from '../src/storage/persistence.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sanitizePersisted', () => {
  it('returns null for anything that is not an object', () => {
    for (const bad of [null, 'abc', 42, ['x']]) expect(sanitizePersisted(bad)).toBeNull();
  });

  it('drops saved scenarios without an inputs object', () => {
    expect(sanitizePersisted({ saved: [null] }).saved).toEqual([]);
    expect(sanitizePersisted({ saved: [{ name: 'x' }] }).saved).toEqual([]);
    expect(sanitizePersisted({ saved: 'x' }).saved).toEqual([]);
  });

  it('repairs a saved scenario that has inputs but a bad name or color', () => {
    const [s] = sanitizePersisted({
      saved: [{ name: '', inputs: { carPrice: 'x' }, color: 'red' }],
    }).saved;
    expect(s.name).toBe('Escenario 1');
    expect(s.color).toBe(SCENARIO_COLORS[0]);
    expect(s.inputs.carPrice).toBe(DEFAULT_INPUTS.carPrice);
  });

  it('coerces inputs to the default types', () => {
    const { inputs } = sanitizePersisted({
      inputs: {
        salesFactor: 'x',
        plugInHybrid: 'yes',
        vehicleType: 'hydrogen',
        carName: 7,
        horizonYears: 1e5,
        loanMonths: 1e7,
        avgFare: 155,
        unknownKey: 1,
      },
    });
    expect(inputs.salesFactor).toBe(DEFAULT_INPUTS.salesFactor);
    expect(inputs.plugInHybrid).toBe(DEFAULT_INPUTS.plugInHybrid);
    expect(inputs.vehicleType).toBe(DEFAULT_INPUTS.vehicleType);
    expect(inputs.carName).toBe(DEFAULT_INPUTS.carName);
    expect(inputs.horizonYears).toBe(30);
    expect(inputs.loanMonths).toBe(120);
    expect(inputs.avgFare).toBe(155);
    expect(inputs).not.toHaveProperty('unknownKey');
  });

  it('falls back to the defaults when inputs is not an object', () => {
    expect(sanitizePersisted({ inputs: 'garbage' }).inputs).toEqual(DEFAULT_INPUTS);
  });

  it('ignores __proto__ keys without polluting Object.prototype', () => {
    const data = JSON.parse(
      '{"__proto__":{"polluted":1},"inputs":{"__proto__":{"polluted":2},"carPrice":300000},"saved":[{"inputs":{"__proto__":{"polluted":3}}}]}',
    );
    const out = sanitizePersisted(data);
    expect(out.inputs.carPrice).toBe(300000);
    expect(out.saved).toHaveLength(1);
    expect({}.polluted).toBeUndefined();
  });

  it('always yields inputs the model can run', () => {
    const out = sanitizePersisted({
      inputs: { salesFactor: 'x', horizonYears: -5, carPrice: null, interestRate: Infinity },
      saved: [{ inputs: { depreciationRate: 'abc' } }],
    });
    expect(() => calculate(out.inputs)).not.toThrow();
    expect(() => calculate(out.saved[0].inputs)).not.toThrow();
  });

  it('caps free text', () => {
    expect(sanitizeInputs({ userNotes: 'x'.repeat(20000) }).userNotes).toHaveLength(10000);
  });
});

describe('storage access', () => {
  it('survives unreadable or blocked storage', () => {
    vi.stubGlobal('localStorage', { getItem: () => '{{{', removeItem: () => {} });
    expect(readPersisted()).toBeNull();
    // A sandboxed iframe throws on any access.
    const blocked = {
      getItem: () => {
        throw new DOMException('denied', 'SecurityError');
      },
      removeItem: () => {
        throw new DOMException('denied', 'SecurityError');
      },
    };
    vi.stubGlobal('localStorage', blocked);
    expect(readPersisted()).toBeNull();
    expect(readSidebarMode()).toBe('basic');
    expect(clearPersisted()).toBe(false);
  });

  it('reads and sanitizes what was saved', () => {
    const saved = JSON.stringify({ inputs: { horizonYears: 7 }, saved: [null], sources: null });
    vi.stubGlobal('localStorage', { getItem: () => saved });
    expect(readPersisted()).toMatchObject({ inputs: { horizonYears: 7 }, saved: [] });
  });
});
