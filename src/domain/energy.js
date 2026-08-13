import { clamp, nonNegative, num, positive } from './format.js';

export function calculateEnergyCost(I, monthlyKm, yearOffset = 0) {
  const km = nonNegative(monthlyKm);
  const fuelInflation = Math.max(-0.95, num(I.fuelInflation));
  const electricityInflation = Math.max(-0.95, num(I.electricityInflation));
  const fuelInflated = nonNegative(I.fuelPrice) * Math.pow(1 + fuelInflation, yearOffset);
  const dieselInflated = nonNegative(I.dieselPrice) * Math.pow(1 + fuelInflation, yearOffset);
  // FEATURE 2 — split de carga pública vs. casera para el manejo eléctrico.
  // Una fracción de la energía se carga en estaciones públicas (más caras). El
  // precio efectivo mezcla casa y público; ambos siguen la misma inflación
  // eléctrica (consistente). Sólo aplica a eléctrico / híbrido enchufable.
  const elecHomeInflated = nonNegative(I.electricityPrice) * Math.pow(1 + electricityInflation, yearOffset);
  const publicFrac = clamp(I.publicChargeFraction, 0, 1);
  const elecPublicInflated = nonNegative(I.publicChargePrice) * Math.pow(1 + electricityInflation, yearOffset);
  const elecInflated = elecHomeInflated * (1 - publicFrac) + elecPublicInflated * publicFrac; // $/kWh efectivo
  const kmpl = positive(I.kmpl, 1);
  const kmPerKwh = positive(I.kmPerKwh, 1);
  const chargerPowerKw = positive(I.chargerPowerKw, 1);
  switch (I.vehicleType) {
    case 'gasoline': return { cost: (km / kmpl) * fuelInflated, chargingTimePerDay: 0 };
    case 'diesel':   return { cost: (km / kmpl) * dieselInflated, chargingTimePerDay: 0 };
    case 'electric': {
      const kWhMonth = km / kmPerKwh; const cost = kWhMonth * elecInflated;
      return { cost, chargingTimePerDay: (kWhMonth / 30) / chargerPowerKw };
    }
    case 'hybrid': {
      if (!I.plugInHybrid) return { cost: (km / kmpl) * fuelInflated, chargingTimePerDay: 0 };
      const hybridElectricFraction = clamp(I.hybridElectricFraction, 0, 1);
      const kmElec = km * hybridElectricFraction; const kmGas = km * (1 - hybridElectricFraction);
      const kWhMonth = kmElec / kmPerKwh;
      const gasCost = (kmGas / kmpl) * fuelInflated; const electricCost = kWhMonth * elecInflated;
      return { cost: gasCost + electricCost, chargingTimePerDay: (kWhMonth / 30) / chargerPowerKw };
    }
    default: return { cost: 0, chargingTimePerDay: 0 };
  }
}
