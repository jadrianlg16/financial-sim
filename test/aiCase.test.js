import { describe, expect, it } from 'vitest';
import { applyImportedJson, buildAIPrompt } from '../src/domain/aiCase.js';
import { DEFAULT_INPUTS } from '../src/domain/defaults.js';

describe('buildAIPrompt', () => {
  it('names the vehicle and asks for a source per value', () => {
    const prompt = buildAIPrompt('BYD Dolphin Mini 2026');
    expect(prompt).toContain('VEHÍCULO A INVESTIGAR: BYD Dolphin Mini 2026');
    expect(prompt).toContain('"sources"');
    expect(prompt).toContain('[ESTIMACIÓN]');
  });
});

describe('applyImportedJson', () => {
  it('copies known fields, coerces numbers and returns the sources', () => {
    const json = {
      vehicle: { name: 'BYD Dolphin Mini', type: 'electric', price: '358800', kmPerKwh: 7.1, condition: 'new' },
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
    expect(applyImportedJson(null, DEFAULT_INPUTS).ok).toBe(false);
  });
});
