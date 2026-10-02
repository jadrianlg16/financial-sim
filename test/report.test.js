import { describe, expect, it } from 'vitest';
import {
  buildMarkdown,
  buildNarrative,
  buildRecommendation,
  horizonBreakdown,
  reportLabels,
} from '../src/components/report/reportText.js';
import { calculate } from '../src/domain/calculate.js';
import { DEFAULT_INPUTS } from '../src/domain/defaults.js';

const YEAR = 2026;
const run = (overrides) => {
  const inputs = { ...DEFAULT_INPUTS, carYear: YEAR, ...overrides };
  return { inputs, R: calculate(inputs, { year: YEAR }) };
};
const markdownFor = ({ R, inputs }) =>
  buildMarkdown(R, inputs, {
    car: 'Auto de prueba',
    city: 'Monterrey',
    vehicleLabel: 'Gasolina',
    isUsed: false,
    yearStart: YEAR,
    yearEnd: YEAR + inputs.horizonYears - 1,
    rec: buildRecommendation(R, inputs, null),
    incomePct: null,
    labels: reportLabels(R),
    breakdown: horizonBreakdown(R, 'Combustible'),
    mc: null,
    mcRuns: 0,
  });

describe('buildRecommendation', () => {
  it('calls a feasible part-time plan viable', () => {
    const { R, inputs } = run();
    expect(buildRecommendation(R, inputs, null)).toMatchObject({ level: 'ok' });
  });

  it('flags a plan that does not fit the available hours', () => {
    const { R, inputs } = run({ maxHoursPerDay: 1 });
    expect(buildRecommendation(R, inputs, null)).toMatchObject({
      level: 'bad',
      title: 'Inviable con la capacidad disponible',
    });
  });

  it('judges affordability without Uber income', () => {
    const { R, inputs } = run({ operationMode: 'no-uber' });
    const share = (pct) => buildRecommendation(R, inputs, pct).level;
    expect(share(0.15)).toBe('ok');
    expect(share(0.25)).toBe('warn');
    expect(share(0.5)).toBe('bad');
    expect(share(null)).toBe('warn');
  });
});

describe('report text', () => {
  it('states the lease term, not the loan term, for a lease', () => {
    const lease = run({ financeType: 'lease', leaseTermMonths: 36, loanMonths: 60 });
    expect(markdownFor(lease)).toContain('/mes por 36 meses; NO eres dueño');
  });

  it('writes one narrative paragraph per topic', () => {
    const { R, inputs } = run();
    const paragraphs = buildNarrative(R, inputs, {
      car: 'Auto de prueba',
      city: 'Monterrey',
      vehicleLabel: 'Gasolina',
      yearEnd: 2029,
    });
    expect(paragraphs).toHaveLength(4);
    expect(paragraphs[3]).toContain('Al final del año 2029');
  });

  it('includes the key figures in the Markdown export', () => {
    const md = markdownFor(run());
    expect(md).toMatch(/^# Análisis de decisión — Auto de prueba/);
    expect(md).toContain('## Financiamiento');
    expect(md).toContain('## Supuestos clave');
  });
});
