import { calculate } from './calculate.js';
import { depreciatedValue } from './depreciation.js';
import { clamp, positive } from './format.js';
import { clampInput } from './inputSchema.js';

/**
 * Normal draw via Box–Muller. `rng` returns uniform numbers in [0, 1); it
 * defaults to Math.random and can be replaced by a seeded generator in tests.
 */
export function randomNormal(mean, std, rng = Math.random) {
  let u = 0,
    v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
/**
 * Uncertain inputs and how much each varies per run: normal noise with a
 * standard deviation of `rel` × the input (or `abs` in the input's own units),
 * clamped to [min, max]. Runs draw them in this order, so reordering changes
 * seeded results. The Monte Carlo tab lists them from this table.
 */
export const MC_VARIATIONS = [
  // Income and platform
  {
    key: 'avgFare',
    group: 'income',
    label: 'tarifa por viaje',
    spread: '±12%',
    rel: 0.12,
    min: 50,
  },
  {
    key: 'uberCommission',
    group: 'income',
    label: 'comisión Uber',
    spread: '±2 puntos %',
    abs: 0.02,
    min: 0.15,
    max: 0.5,
  },
  {
    key: 'uberKmPerTrip',
    group: 'income',
    label: 'km por viaje',
    spread: '±15%',
    rel: 0.15,
    min: 1,
  },
  {
    key: 'tripsPerHour',
    group: 'income',
    label: 'viajes por hora',
    spread: '±0.4, entre 1 y 4',
    abs: 0.4,
    min: 1,
    max: 4,
  },
  // Energy (each powertrain only uses its own)
  { key: 'fuelPrice', group: 'energy', label: 'gasolina', spread: '±8%', rel: 0.08, min: 8 },
  { key: 'dieselPrice', group: 'energy', label: 'diésel', spread: '±8%', rel: 0.08, min: 8 },
  {
    key: 'electricityPrice',
    group: 'energy',
    label: 'electricidad',
    spread: '±10%',
    rel: 0.1,
    min: 0.5,
  },
  {
    key: 'kmPerKwh',
    group: 'energy',
    label: 'rendimiento eléctrico',
    spread: '±10%',
    rel: 0.1,
    min: 2,
  },
  // Recurring costs
  {
    key: 'annualMaintenance',
    group: 'costs',
    label: 'mantenimiento base',
    spread: '±25%',
    rel: 0.25,
    min: 0,
  },
  {
    key: 'monthlyInsurance',
    group: 'costs',
    label: 'seguro mensual',
    spread: '±15%',
    rel: 0.15,
    min: 0,
  },
  { key: 'monthlyRefrendo', group: 'costs', label: 'refrendo', spread: '±20%', rel: 0.2, min: 0 },
  { key: 'carWash', group: 'costs', label: 'lavado', spread: '±20%', rel: 0.2, min: 0 },
  { key: 'miscellaneous', group: 'costs', label: 'misceláneos', spread: '±35%', rel: 0.35, min: 0 },
  // Car value
  {
    key: 'depreciationRate',
    group: 'value',
    label: 'depreciación',
    spread: '±4 puntos %',
    abs: 0.04,
    min: 0.05,
    max: 0.5,
  },
  {
    key: 'salesFactor',
    group: 'value',
    label: 'factor de venta',
    spread: '±12%',
    rel: 0.12,
    min: 0.3,
  },
];

/**
 * Re-runs calculate() `iterations` times with randomized inputs and summarizes
 * break-even trips, liquidation value and net result (P10/P50/P90, histogram).
 * Pass `{ rng }` to make a run reproducible; every random draw goes through it.
 */
export function runMonteCarlo(inputs, iterations = 3000, { rng = Math.random, year } = {}) {
  const results = [];
  const normal = (mean, std) => randomNormal(mean, std, rng);
  // Risk of total loss or theft over the horizon: with annual probability p, the
  // cumulative one over N years is pTL = 1 − (1 − p)^N (bounded to [0, 0.95]).
  // In a lease you do not own the asset, so the event does not change your terminal
  // recovery (already 0): it is turned off so it does not distort the tail.
  const horizonYears = clampInput('horizonYears', Math.round(positive(inputs.horizonYears, 1)));
  const pAnnual = clamp(inputs.theftLossProbAnnual, 0, 0.5);
  const isLeaseMC = inputs.purchaseMode === 'credit' && inputs.financeType === 'lease';
  const totalLossProb =
    isLeaseMC || pAnnual <= 0 ? 0 : clamp(1 - Math.pow(1 - pAnnual, horizonYears), 0, 0.95);
  // Full-coverage deductible (share of the insured value that is NOT paid out).
  const deductiblePct = clamp(
    inputs.theftDeductiblePct != null ? inputs.theftDeductiblePct : 0.05,
    0,
    0.5,
  );
  for (let i = 0; i < iterations; i++) {
    const sim = { ...inputs };
    for (const { key, rel, abs, min = -Infinity, max = Infinity } of MC_VARIATIONS) {
      const mean = inputs[key];
      const std = rel != null ? Math.abs(mean) * rel : abs;
      sim[key] = Math.min(max, Math.max(min, normal(mean, std)));
    }
    const c = calculate(sim, { year });
    let finalPos = c.liquidationPosition;
    let net = c.netProjectResult;
    // Was there a total loss in this run? (only when owned)
    if (c.owned && totalLossProb > 0 && rng() < totalLossProb) {
      // Insurance payout ≈ depreciated insured value at a representative point of the
      // horizon (capped at the terminal market value, so a total loss is a RISK and not
      // a reward) minus the deductible. The insurer pays off the remaining debt; you
      // keep the rest. The payout replaces the resale.
      const midValue = depreciatedValue(
        c.carPrice,
        sim,
        Math.max(1, Math.round(horizonYears / 2)),
        year,
      );
      const insuredValue = Math.min(midValue, c.valueAtEnd); // do not reward the loss
      const payout = Math.max(0, insuredValue * (1 - deductiblePct));
      const tlRecovery = payout - c.remainingDebt; // terminal recovery under a total loss
      net = net - c.terminalRecovery + tlRecovery;
      finalPos = tlRecovery;
    }
    results.push({ be: c.breakEvenTrips, feasible: c.feasible ? 1 : 0, finalPos, net });
  }
  const beSorted = results
    .map((r) => r.be)
    .filter(isFinite)
    .sort((a, b) => a - b);
  const fpSorted = results.map((r) => r.finalPos).sort((a, b) => a - b);
  const netSorted = results
    .map((r) => r.net)
    .filter(isFinite)
    .sort((a, b) => a - b);
  const feasibleRate = results.reduce((a, r) => a + r.feasible, 0) / results.length;
  const q = (arr, p) => (arr.length ? arr[Math.floor(arr.length * p)] : NaN);
  // beSorted is ascending, so its ends are the extremes (no spread of 10,000 arguments).
  const min = beSorted.length ? beSorted[0] : 0,
    max = beSorted.length ? beSorted[beSorted.length - 1] : 0;
  const bins = 24;
  const binSize = (max - min) / bins || 1;
  const hist = Array(bins)
    .fill(0)
    .map((_, i) => ({ rangeLabel: Math.round(min + i * binSize), count: 0 }));
  beSorted.forEach((v) => {
    const idx = Math.min(bins - 1, Math.floor((v - min) / binSize));
    hist[idx].count++;
  });
  return {
    feasibleRate,
    be: {
      p10: q(beSorted, 0.1),
      p50: q(beSorted, 0.5),
      p90: q(beSorted, 0.9),
      mean: beSorted.length ? beSorted.reduce((a, b) => a + b, 0) / beSorted.length : NaN,
    },
    fp: {
      p10: q(fpSorted, 0.1),
      p50: q(fpSorted, 0.5),
      p90: q(fpSorted, 0.9),
      mean: fpSorted.reduce((a, b) => a + b, 0) / Math.max(1, fpSorted.length),
    },
    net: {
      p10: q(netSorted, 0.1),
      p50: q(netSorted, 0.5),
      p90: q(netSorted, 0.9),
      mean: netSorted.reduce((a, b) => a + b, 0) / Math.max(1, netSorted.length),
    },
    totalLossProb, // cumulative probability of a total loss over the horizon
    hist,
    iterations,
  };
}
