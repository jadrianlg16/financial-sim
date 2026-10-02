import { calculate } from './calculate.js';
import { depreciatedValue } from './depreciation.js';
import { clamp, positive } from './format.js';

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
 * Re-runs calculate() `iterations` times with randomized inputs and summarizes
 * break-even trips, liquidation value and net result (P10/P50/P90, histogram).
 * Pass `{ rng }` to make a run reproducible; every random draw goes through it.
 */
export function runMonteCarlo(inputs, iterations = 3000, { rng = Math.random } = {}) {
  const results = [];
  const normal = (mean, std) => randomNormal(mean, std, rng);
  const jitter = (val, pct, lo = -Infinity, hi = Infinity) =>
    Math.min(hi, Math.max(lo, normal(val, Math.abs(val) * pct)));
  // FEATURE 3 — riesgo de pérdida total / robo (write-off) sobre el horizonte.
  // Probabilidad anual p → acumulada en N años: pTL = 1−(1−p)^N (acotada [0,0.95]).
  // En un arrendamiento no eres dueño del activo, así que el evento no cambia tu
  // recuperación terminal (ya es 0): se desactiva para no distorsionar la cola.
  const horizonYears = Math.max(1, Math.round(positive(inputs.horizonYears, 1)));
  const pAnnual = clamp(inputs.theftLossProbAnnual, 0, 0.5);
  const isLeaseMC = inputs.purchaseMode === 'credit' && inputs.financeType === 'lease';
  const totalLossProb =
    isLeaseMC || pAnnual <= 0 ? 0 : clamp(1 - Math.pow(1 - pAnnual, horizonYears), 0, 0.95);
  // Deducible de cobertura amplia (fracción del valor asegurado que NO te pagan).
  const deductiblePct = clamp(
    inputs.theftDeductiblePct != null ? inputs.theftDeductiblePct : 0.05,
    0,
    0.5,
  );
  for (let i = 0; i < iterations; i++) {
    const sim = {
      ...inputs,
      // Ingreso / plataforma
      avgFare: Math.max(50, jitter(inputs.avgFare, 0.12)),
      uberCommission: Math.min(0.5, Math.max(0.15, normal(inputs.uberCommission, 0.02))),
      uberKmPerTrip: Math.max(1, jitter(inputs.uberKmPerTrip, 0.15)),
      tripsPerHour: Math.max(1, Math.min(4, normal(inputs.tripsPerHour, 0.4))),
      // Energía (según motor)
      fuelPrice: Math.max(8, jitter(inputs.fuelPrice, 0.08)),
      dieselPrice: Math.max(8, jitter(inputs.dieselPrice, 0.08)),
      electricityPrice: Math.max(0.5, jitter(inputs.electricityPrice, 0.1)),
      kmPerKwh: Math.max(2, jitter(inputs.kmPerKwh, 0.1)),
      // Costos recurrentes
      annualMaintenance: Math.max(0, jitter(inputs.annualMaintenance, 0.25)),
      monthlyInsurance: Math.max(0, jitter(inputs.monthlyInsurance, 0.15)),
      monthlyRefrendo: Math.max(0, jitter(inputs.monthlyRefrendo, 0.2)),
      carWash: Math.max(0, jitter(inputs.carWash, 0.2)),
      miscellaneous: Math.max(0, jitter(inputs.miscellaneous, 0.35)),
      // Valor del activo
      depreciationRate: Math.min(0.5, Math.max(0.05, normal(inputs.depreciationRate, 0.04))),
      salesFactor: Math.max(0.3, jitter(inputs.salesFactor, 0.12)),
    };
    const c = calculate(sim);
    let finalPos = c.liquidationPosition;
    let net = c.netProjectResult;
    // FEATURE 3 — ¿hubo pérdida total en esta iteración? (sólo si eres dueño)
    if (c.owned && totalLossProb > 0 && rng() < totalLossProb) {
      // Pago del seguro ≈ valor asegurado depreciado en un punto representativo del
      // horizonte (acotamos a NO superar el valor de mercado terminal, para que la
      // pérdida total sea un RIESGO y no un premio) menos el deducible. La aseguradora
      // liquida la deuda viva; el resto te queda. Sustituye la reventa por el pago.
      const midValue = depreciatedValue(c.carPrice, sim, Math.max(1, Math.round(horizonYears / 2)));
      const insuredValue = Math.min(midValue, c.valueAtEnd); // no premiar el siniestro
      const payout = Math.max(0, insuredValue * (1 - deductiblePct));
      const tlRecovery = payout - c.remainingDebt; // recuperación terminal bajo pérdida total
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
  const min = beSorted.length ? Math.min(...beSorted) : 0,
    max = beSorted.length ? Math.max(...beSorted) : 0;
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
    totalLossProb, // FEATURE 3 — prob. acumulada de pérdida total en el horizonte (la Report la muestra)
    hist,
    iterations,
  };
}
