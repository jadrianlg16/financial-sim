import { calculate } from './calculate.js';

export function buildSensKeys(inputs) {
  const keys = [
    { key: 'avgFare', label: 'Tarifa por viaje', delta: 0.2, uberOnly: true },
    { key: 'uberCommission', label: 'Comisión Uber', delta: 0.2, uberOnly: true },
    { key: 'taxRate', label: 'Impuestos', delta: 0.2, uberOnly: true },
    { key: 'uberKmPerTrip', label: 'Km por viaje', delta: 0.2, uberOnly: true },
    { key: 'interestRate', label: 'Tasa de interés', delta: 0.2 },
    { key: 'carPrice', label: 'Precio del auto', delta: 0.15 },
    { key: 'monthlyInsurance', label: 'Seguro', delta: 0.25 },
    { key: 'annualMaintenance', label: 'Mantenimiento', delta: 0.3 },
    { key: 'monthlyRefrendo', label: 'Refrendo', delta: 0.3 },
    { key: 'miscellaneous', label: 'Misceláneos', delta: 0.4 },
    { key: 'depreciationRate', label: 'Depreciación', delta: 0.25 },
    { key: 'salesFactor', label: 'Factor de venta', delta: 0.15 },
    { key: 'discountRate', label: 'Tasa de descuento', delta: 0.25 },
  ];
  // Variables de energía según el motor
  if (inputs.vehicleType === 'electric') {
    keys.push({ key: 'electricityPrice', label: 'Precio electricidad', delta: 0.2 });
    keys.push({ key: 'kmPerKwh', label: 'Rendimiento km/kWh', delta: 0.2 });
  } else if (inputs.vehicleType === 'diesel') {
    keys.push({ key: 'dieselPrice', label: 'Precio diésel', delta: 0.2 });
    keys.push({ key: 'kmpl', label: 'Rendimiento km/L', delta: 0.2 });
  } else if (inputs.vehicleType === 'hybrid') {
    keys.push({ key: 'fuelPrice', label: 'Combustible', delta: 0.2 });
    keys.push({ key: 'kmpl', label: 'Rendimiento km/L', delta: 0.2 });
    // La electricidad sólo afecta a un híbrido ENCHUFABLE; si no, el km eléctrico no aplica.
    if (inputs.plugInHybrid)
      keys.push({ key: 'electricityPrice', label: 'Precio electricidad', delta: 0.2 });
  } else {
    keys.push({ key: 'fuelPrice', label: 'Combustible', delta: 0.2 });
    keys.push({ key: 'kmpl', label: 'Rendimiento km/L', delta: 0.2 });
  }
  return inputs.operationMode === 'no-uber' ? keys.filter((k) => !k.uberOnly) : keys;
}

export function sensitivity(inputs) {
  const uber = inputs.operationMode !== 'no-uber';
  // En modo Uber medimos el punto de equilibrio; sin Uber, el costo neto del proyecto.
  const metricOf = (I) => (uber ? calculate(I).breakEvenTrips : calculate(I).totalProjectCost);
  const base = metricOf(inputs);
  const metricUnit = uber ? 'viajes' : 'MXN';
  return buildSensKeys(inputs)
    .map(({ key, label, delta }) => {
      const lo = metricOf({ ...inputs, [key]: inputs[key] * (1 - delta) });
      const hi = metricOf({ ...inputs, [key]: inputs[key] * (1 + delta) });
      return {
        label,
        key,
        delta,
        metricUnit,
        low: Math.min(lo, hi) - base,
        high: Math.max(lo, hi) - base,
        range: Math.abs(hi - lo),
      };
    })
    .sort((a, b) => b.range - a.range);
}
