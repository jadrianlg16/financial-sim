import { clamp, num } from './format.js';
import { currentYear } from './year.js';

/**
 * Annual depreciation rate after adjusting for the car's condition and age.
 * A new car keeps its list rate. A used car loses value more slowly in
 * percentage terms (the curve flattens with age): it starts from
 * usedDepreciationRate (default 0.12), drops 0.5 points per year of age as of
 * `year`, and is clamped to [0.04, 0.30].
 */
export function effectiveDepRate(inputs, year = currentYear()) {
  const base = clamp(inputs.depreciationRate, 0, 0.95);
  if (inputs.vehicleCondition !== 'used') return base;
  let usedRate = clamp(
    inputs.usedDepreciationRate != null ? inputs.usedDepreciationRate : 0.12,
    0,
    0.95,
  );
  const ageYears = Math.max(0, year - num(inputs.carYear, year));
  usedRate -= 0.005 * ageYears;
  return clamp(usedRate, 0.04, 0.3);
}

// Depreciation with a selectable METHOD (the asset is never worth less than 0):
//   - 'declining'  Declining balance / geometric:  V_n = V0·(1−d)^n   [realistic, default]
//   - 'straight'   Straight line on the original price: V_n = V0·(1−d·n)
//   - 'realistic'  Steep first-year drop, then declining balance:
//                  V_1 = V0·(1−d1);  V_n = V_1·(1−d)^(n−1)
// The rate d is already adjusted for condition and age (effectiveDepRate).
/** Market value of a car bought for `price` after `n` years, as of reference `year`. */
export function depreciatedValue(price, inputs, n, year = currentYear()) {
  if (n <= 0) return price;
  const d = effectiveDepRate(inputs, year);
  const method = inputs.depreciationMethod || 'declining';
  let v;
  if (method === 'straight') {
    v = price * (1 - d * n);
  } else if (method === 'realistic') {
    const d1 = clamp(
      inputs.firstYearDepreciation != null ? inputs.firstYearDepreciation : 0.25,
      0,
      0.95,
    );
    const afterFirst = price * (1 - d1);
    v = n === 1 ? afterFirst : afterFirst * Math.pow(1 - d, n - 1);
  } else {
    v = price * Math.pow(1 - d, n);
  }
  return Math.max(0, v);
}
