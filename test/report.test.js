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

describe('Markdown export of imported or typed text', () => {
  const evilName =
    '../x\n# Injected heading\n<img src=x onerror=alert(1)> [verify](https://attacker.example) *bold*';
  const exportWith = (overrides, car = evilName, city = 'Monterrey') => {
    const { R, inputs } = run(overrides);
    return buildMarkdown(R, inputs, {
      car,
      city,
      vehicleLabel: 'Gasolina',
      isUsed: false,
      yearStart: YEAR,
      yearEnd: YEAR + 3,
      rec: buildRecommendation(R, inputs, null),
      incomePct: null,
      labels: reportLabels(R),
      breakdown: horizonBreakdown(R, 'Combustible'),
      mc: null,
      mcRuns: 0,
    });
  };

  it('keeps the car name and city on one escaped line', () => {
    const md = exportWith({}, evilName, 'Mty\n## Otra sección <b>');
    const [title, subtitle] = md.split('\n');
    expect(title.startsWith('# Análisis de decisión — ')).toBe(true);
    expect(title).not.toMatch(/(^|[^\\])<img/);
    expect(title).toContain(String.raw`\<img src=x onerror=alert(1)\>`);
    expect(title).toContain(String.raw`\[verify\](https://attacker.example) \*bold\*`);
    expect(subtitle).toContain(String.raw`Mty \#\# Otra sección \<b\>`);
    expect(md).not.toMatch(/^# Injected heading/m);
    expect(md).not.toMatch(/^## Otra sección/m);
  });

  it('puts the notes in a code fence that the notes cannot close', () => {
    const notes = '=cmd|"/c calc"!A1\n<script>alert(1)</script>\n```\n# not a heading';
    const md = exportWith({ userNotes: notes });
    const section = md.slice(md.indexOf('## Notas y fuentes del usuario'));
    // The notes contain a ``` line, so the fence is four backticks and only the
    // closing fence after the notes can end the block.
    expect(section).toContain('````text\n' + notes + '\n````');
    expect(section.match(/^````$/gm)).toHaveLength(1);
  });
});
