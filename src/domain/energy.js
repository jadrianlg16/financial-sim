import { clamp, nonNegative, num, positive } from './format.js';

export function calculateEnergyCost(inputs, monthlyKm, yearOffset = 0) {
  const km = nonNegative(monthlyKm);
  const fuelInflation = Math.max(-0.95, num(inputs.fuelInflation));
  const electricityInflation = Math.max(-0.95, num(inputs.electricityInflation));
  const fuelInflated = nonNegative(inputs.fuelPrice) * Math.pow(1 + fuelInflation, yearOffset);
  const dieselInflated = nonNegative(inputs.dieselPrice) * Math.pow(1 + fuelInflation, yearOffset);
  // Carga pública vs. casera: una fracción de la energía se carga en estaciones
  // públicas (más caras). El precio efectivo mezcla ambos y los dos siguen la misma
  // inflación eléctrica. Sólo aplica a eléctrico o híbrido enchufable.
  const elecHomeInflated =
    nonNegative(inputs.electricityPrice) * Math.pow(1 + electricityInflation, yearOffset);
  const publicFrac = clamp(inputs.publicChargeFraction, 0, 1);
  const elecPublicInflated =
    nonNegative(inputs.publicChargePrice) * Math.pow(1 + electricityInflation, yearOffset);
  const elecInflated = elecHomeInflated * (1 - publicFrac) + elecPublicInflated * publicFrac; // $/kWh efectivo
  const kmpl = positive(inputs.kmpl, 1);
  const kmPerKwh = positive(inputs.kmPerKwh, 1);
  const chargerPowerKw = positive(inputs.chargerPowerKw, 1);
  switch (inputs.vehicleType) {
    case 'gasoline':
      return { cost: (km / kmpl) * fuelInflated, chargingTimePerDay: 0 };
    case 'diesel':
      return { cost: (km / kmpl) * dieselInflated, chargingTimePerDay: 0 };
    case 'electric': {
      const kWhMonth = km / kmPerKwh;
      const cost = kWhMonth * elecInflated;
      return { cost, chargingTimePerDay: kWhMonth / 30 / chargerPowerKw };
    }
    case 'hybrid': {
      if (!inputs.plugInHybrid) return { cost: (km / kmpl) * fuelInflated, chargingTimePerDay: 0 };
      const hybridElectricFraction = clamp(inputs.hybridElectricFraction, 0, 1);
      const kmElec = km * hybridElectricFraction;
      const kmGas = km * (1 - hybridElectricFraction);
      const kWhMonth = kmElec / kmPerKwh;
      const gasCost = (kmGas / kmpl) * fuelInflated;
      const electricCost = kWhMonth * elecInflated;
      return { cost: gasCost + electricCost, chargingTimePerDay: kWhMonth / 30 / chargerPowerKw };
    }
    default:
      return { cost: 0, chargingTimePerDay: 0 };
  }
}
