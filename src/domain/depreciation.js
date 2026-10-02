import { clamp, num } from './format.js';
import { currentYear } from './year.js';

/**
 * Annual depreciation rate after adjusting for the car's condition and age.
 * A new car keeps its list rate. A used car loses value more slowly in
 * percentage terms (the curve flattens with age): it starts from
 * usedDepreciationRate (default 0.12), drops 0.5 points per year of age as of
 * `year`, and is clamped to [0.04, 0.30].
 */
export function effectiveDepRate(I, year = currentYear()) {
  const base = clamp(I.depreciationRate, 0, 0.95);
  if (I.vehicleCondition !== 'used') return base;
  let usedRate = clamp(I.usedDepreciationRate != null ? I.usedDepreciationRate : 0.12, 0, 0.95);
  const ageYears = Math.max(0, year - num(I.carYear, year));
  usedRate -= 0.005 * ageYears;
  return clamp(usedRate, 0.04, 0.3);
}

// Depreciación con MÉTODO seleccionable (el activo nunca vale menos de 0):
//   - 'declining'  Saldo decreciente / geométrico:  V_n = V0·(1−d)^n   [realista, default]
//   - 'straight'   Lineal sobre precio original:     V_n = V0·(1−d·n)
//   - 'realistic'  Caída fuerte el 1er año y luego saldo decreciente:
//                  V_1 = V0·(1−d1);  V_n = V_1·(1−d)^(n−1)
// La tasa d ya viene ajustada por condición y edad (effectiveDepRate).
/** Market value of a car bought for `price` after `n` years, as of reference `year`. */
export function depreciatedValue(price, I, n, year = currentYear()) {
  if (n <= 0) return price;
  const d = effectiveDepRate(I, year);
  const method = I.depreciationMethod || 'declining';
  let v;
  if (method === 'straight') {
    v = price * (1 - d * n);
  } else if (method === 'realistic') {
    const d1 = clamp(I.firstYearDepreciation != null ? I.firstYearDepreciation : 0.25, 0, 0.95);
    const afterFirst = price * (1 - d1);
    v = n === 1 ? afterFirst : afterFirst * Math.pow(1 - d, n - 1);
  } else {
    v = price * Math.pow(1 - d, n);
  }
  return Math.max(0, v);
}
