import { CAR_PRESETS } from './constants.js';
import { currentYear } from './year.js';

// Applies a car preset to an inputs object: price, efficiency, powertrain,
// condition, year and warranty, plus the typical adjustments for a used car
// (repair reserve, rate). It does not mutate: it returns a new object. Used by
// the sidebar and by each column of the Comparar (compare) tab.
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
  // Used cars have no factory warranty left; new ones come with 3 years.
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
