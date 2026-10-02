import { clamp, num } from './format.js';

export function effectiveDepRate(I) {
  const base = clamp(I.depreciationRate, 0, 0.95);
  if (I.vehicleCondition !== 'used') return base; // auto nuevo: comportamiento idéntico
  let usedRate = clamp(I.usedDepreciationRate != null ? I.usedDepreciationRate : 0.12, 0, 0.95);
  const ageYears = Math.max(0, 2026 - num(I.carYear, 2026)); // antigüedad actual
  usedRate -= 0.005 * ageYears; // se aplana ~0.5 pts/año de edad
  return clamp(usedRate, 0.04, 0.3); // bien acotada
}

// Depreciación con MÉTODO seleccionable (el activo nunca vale menos de 0):
//   - 'declining'  Saldo decreciente / geométrico:  V_n = V0·(1−d)^n   [realista, default]
//   - 'straight'   Lineal sobre precio original:     V_n = V0·(1−d·n)
//   - 'realistic'  Caída fuerte el 1er año y luego saldo decreciente:
//                  V_1 = V0·(1−d1);  V_n = V_1·(1−d)^(n−1)
// La tasa d ya viene ajustada por condición/edad (FEATURE 1a: usados deprecian más lento).
export function depreciatedValue(price, I, year) {
  if (year <= 0) return price;
  const d = effectiveDepRate(I);
  const method = I.depreciationMethod || 'declining';
  let v;
  if (method === 'straight') {
    v = price * (1 - d * year);
  } else if (method === 'realistic') {
    const d1 = clamp(I.firstYearDepreciation != null ? I.firstYearDepreciation : 0.25, 0, 0.95);
    const afterFirst = price * (1 - d1);
    v = year === 1 ? afterFirst : afterFirst * Math.pow(1 - d, year - 1);
  } else {
    v = price * Math.pow(1 - d, year);
  }
  return Math.max(0, v);
}
