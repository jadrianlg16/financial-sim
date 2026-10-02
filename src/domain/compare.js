import { CAR_PRESETS } from './constants.js';
import { currentYear } from './year.js';

// Aplica un preset de auto a un objeto de inputs: precio, rendimiento, motor,
// condición, año y garantía, más los ajustes típicos de un usado (reserva de
// reparaciones, tasa). No muta: devuelve un objeto nuevo. Lo usan el panel lateral
// y cada columna de la pestaña Comparar.
export function applyCarPresetTo(prev, k) {
  if (k === 'custom') return { ...prev, carPreset: 'custom' };
  const c = CAR_PRESETS[k];
  if (!c) return prev;
  const next = {
    ...prev,
    carPreset: k,
    carPrice: c.price,
    kmpl: c.kmpl || prev.kmpl,
    vehicleType: c.type,
    plugInHybrid: !!c.plugInHybrid,
    kmPerKwh: c.kmPerKwh || prev.kmPerKwh,
    batteryCapacityKwh: c.batteryCapacityKwh || prev.batteryCapacityKwh,
  };
  const cond = c.condition || 'new';
  next.vehicleCondition = cond;
  next.carYear = c.year || currentYear();
  next.odometerKm = c.odometerKm || 0;
  // Los usados ya no tienen garantía de fábrica; los nuevos traen 3 años.
  next.warrantyYearsRemaining = cond === 'used' ? 0 : 3;
  if (cond === 'used') {
    if (!prev.repairReserveAnnual) next.repairReserveAnnual = 6000;
    if (prev.interestRate <= 0.135) next.interestRate = 0.16;
  } else if (prev.repairReserveAnnual === 6000) {
    next.repairReserveAnnual = 0;
  }
  return next;
}
export const cloneInputs = (i) => JSON.parse(JSON.stringify(i));
export const MAX_COMPARE_CARS = 4;
