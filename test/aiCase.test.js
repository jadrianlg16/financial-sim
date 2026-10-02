import { describe, expect, it } from 'vitest';
import {
  applyImportedJson,
  buildAIPrompt,
  importCaseText,
  stripCodeFences,
} from '../src/domain/aiCase.js';
import { calculate } from '../src/domain/calculate.js';
import { DEFAULT_INPUTS } from '../src/domain/defaults.js';

describe('buildAIPrompt', () => {
  it('names the vehicle and asks for a source per value', () => {
    const prompt = buildAIPrompt('BYD Dolphin Mini 2026');
    expect(prompt).toContain('VEHÍCULO A INVESTIGAR: BYD Dolphin Mini 2026');
    expect(prompt).toContain('"sources"');
    expect(prompt).toContain('[ESTIMACIÓN]');
    expect(buildAIPrompt('x', 2031)).toContain('"year": 2031');
  });
});

describe('applyImportedJson', () => {
  it('copies known fields, coerces numbers and returns the sources', () => {
    const json = {
      vehicle: {
        name: 'BYD Dolphin Mini',
        type: 'electric',
        price: '358800',
        kmPerKwh: 7.1,
        condition: 'new',
      },
      costs: { monthlyInsurance: 1800, insuranceMode: 'pctOfValue' },
      uber: { taxRegime: 'net', uberCommission: '0.27' },
      sources: { price: 'https://example.com' },
    };
    const { ok, inputs, sources } = applyImportedJson(json, DEFAULT_INPUTS);
    expect(ok).toBe(true);
    expect(inputs).toMatchObject({
      carPreset: 'custom',
      carName: 'BYD Dolphin Mini',
      vehicleType: 'electric',
      carPrice: 358800,
      kmPerKwh: 7.1,
      vehicleCondition: 'new',
      warrantyYearsRemaining: 3,
      monthlyInsurance: 1800,
      insuranceMode: 'pctOfValue',
      taxRegime: 'net',
      uberCommission: 0.27,
    });
    expect(sources).toEqual({ price: 'https://example.com' });
  });

  it('ignores enum values outside the allowed set', () => {
    const json = {
      vehicle: { condition: 'stolen' },
      costs: { insuranceMode: 'whatever' },
      uber: { taxRegime: 'flat' },
      financing: { financeType: 'crypto' },
    };
    const { inputs } = applyImportedJson(json, DEFAULT_INPUTS);
    expect(inputs.vehicleCondition).toBe(DEFAULT_INPUTS.vehicleCondition);
    expect(inputs.insuranceMode).toBe(DEFAULT_INPUTS.insuranceMode);
    expect(inputs.taxRegime).toBe(DEFAULT_INPUTS.taxRegime);
    expect(inputs.financeType).toBe(DEFAULT_INPUTS.financeType);
  });

  it('does not mutate the current inputs', () => {
    const current = { ...DEFAULT_INPUTS };
    applyImportedJson({ vehicle: { price: 1 } }, current);
    expect(current).toEqual(DEFAULT_INPUTS);
  });

  it('fails cleanly when the parsed value is not an object', () => {
    for (const bad of [null, 42, 'texto', ['a']]) {
      expect(applyImportedJson(bad, DEFAULT_INPUTS)).toMatchObject({ ok: false });
    }
  });

  it('ignores an unknown powertrain instead of zeroing the energy cost', () => {
    const { inputs, ignored } = applyImportedJson(
      { vehicle: { type: 'hydrogen' } },
      DEFAULT_INPUTS,
    );
    expect(inputs.vehicleType).toBe(DEFAULT_INPUTS.vehicleType);
    expect(ignored).toEqual(['vehicle.type']);
    // An unknown type would have made calculateEnergyCost return 0.
    expect(calculate(inputs).monthlyFuel).toBeGreaterThan(0);
  });

  it('accepts only the known depreciation methods', () => {
    const bad = applyImportedJson(
      { projection: { depreciationMethod: 'sum-of-years' } },
      DEFAULT_INPUTS,
    );
    expect(bad.inputs.depreciationMethod).toBe(DEFAULT_INPUTS.depreciationMethod);
    expect(bad.ignored).toEqual(['projection.depreciationMethod']);
    for (const method of ['declining', 'straight', 'realistic']) {
      const ok = applyImportedJson({ projection: { depreciationMethod: method } }, DEFAULT_INPUTS);
      expect(ok.inputs.depreciationMethod).toBe(method);
    }
  });

  it('skips numbers that are not finite and text that is not a string', () => {
    const json = {
      vehicle: { price: 'caro', kmpl: 'NaN', name: { es: 'objeto' }, year: '2024' },
      costs: { dataPlan: Infinity },
    };
    const { inputs, ignored } = applyImportedJson(json, DEFAULT_INPUTS);
    expect(inputs.carPrice).toBe(DEFAULT_INPUTS.carPrice);
    expect(inputs.kmpl).toBe(DEFAULT_INPUTS.kmpl);
    expect(inputs.carName).toBe(DEFAULT_INPUTS.carName);
    expect(inputs.dataPlan).toBe(DEFAULT_INPUTS.dataPlan);
    expect(inputs.carYear).toBe(2024);
    expect(ignored).toEqual(['vehicle.name', 'vehicle.price', 'vehicle.kmpl', 'costs.dataPlan']);
  });

  it('reports a section that is not an object', () => {
    const { ok, ignored } = applyImportedJson({ costs: 'muchos' }, DEFAULT_INPUTS);
    expect(ok).toBe(true);
    expect(ignored).toEqual(['costs']);
  });
});

describe('importCaseText', () => {
  it('parses JSON wrapped in a Markdown code fence', () => {
    const text = '```json\n{ "vehicle": { "price": 300000 } }\n```';
    expect(stripCodeFences(text)).toBe('{ "vehicle": { "price": 300000 } }');
    const result = importCaseText(text, DEFAULT_INPUTS);
    expect(result.ok).toBe(true);
    expect(result.inputs.carPrice).toBe(300000);
  });

  it('returns ok: false with a readable message for bad JSON', () => {
    const result = importCaseText('{ not json', DEFAULT_INPUTS);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/^JSON inválido: /);
  });

  it('returns ok: false when the JSON is not an object', () => {
    expect(importCaseText('[1, 2, 3]', DEFAULT_INPUTS)).toMatchObject({
      ok: false,
      error: expect.stringMatching(/^Error: /),
    });
  });
});
