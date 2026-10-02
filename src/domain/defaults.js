import { currentYear } from './year.js';

export const DEFAULT_INPUTS = {
  carPreset: 'kia_k3',
  carPrice: 279900,
  carYear: currentYear(),
  vehicleType: 'gasoline',
  kmpl: 18.5,
  kmPerKwh: 6.0,
  batteryCapacityKwh: 50,
  chargerPowerKw: 7,
  hybridElectricFraction: 0.3,
  plugInHybrid: false,
  carDescription: '',
  carJustification: '',
  carName: '',
  purchaseMode: 'credit',
  downPaymentMode: 'percent',
  downPaymentPct: 0.2,
  downPaymentFixed: 56000,
  cashAmount: 100000,
  interestRate: 0.135,
  loanMonths: 48,
  openingFeePct: 0.02,
  // Tipo de financiamiento: 'annuity' = crédito tradicional, 'balloon' = crédito con
  // pago final (residual), 'lease' = arrendamiento (sin propiedad).
  financeType: 'annuity',
  balloonPct: 0.35,
  leaseMonthly: 6500,
  leaseDownPayment: 20000,
  leaseTermMonths: 48,
  leaseKmCapYear: 20000,
  leaseExcessKmFee: 3,
  operationMode: 'uber-breakeven',
  monthlyProfitTarget: 5000,
  city: 'mty',
  cityName: 'Monterrey',
  avgFare: 140,
  uberCommission: 0.25,
  taxRate: 0.3,
  // Régimen fiscal del ingreso Uber: 'resico' (default, realista) = retención de
  // plataforma de ~2.5% del ingreso bruto; 'gross' = taxRate sobre la tarifa bruta
  // (supuesto simplificado); 'net' = taxRate sobre la utilidad por viaje.
  taxRegime: 'resico',
  resicoRate: 0.025,
  tripsPerHour: 3,
  maxHoursPerDay: 8,
  workDaysPerMonth: 22,
  personalKmDaily: 20,
  uberWearFactor: 0.3,
  uberKmPerTrip: 8,
  fuelPrice: 24.5,
  dieselPrice: 26.0,
  electricityPrice: 4.2,
  fuelInflation: 0.06,
  electricityInflation: 0.04,
  // Carga pública vs. casera (sólo eléctrico o híbrido enchufable): 15% de la
  // energía se carga en estaciones públicas, más caras que la tarifa doméstica.
  publicChargeFraction: 0.15,
  publicChargePrice: 8.0,
  monthlyInsurance: 2000,
  annualMaintenance: 8000,
  monthlyRefrendo: 500,
  dataPlan: 400,
  // Seguro: 'fixed' = monto mensual plano; 'pctOfValue' = % anual del valor
  // depreciado del auto (baja con la depreciación, como en una cobertura amplia).
  insuranceMode: 'fixed',
  insurancePctOfValue: 0.045,
  carWash: 800,
  carWashTips: 400,
  miscellaneous: 2000,
  accessories: 100,
  toxicologyReport: 400,
  uberCertification: 900,
  horizonYears: 4,
  depreciationRate: 0.2,
  salesFactor: 1.0,
  monthlyIncome: 0,
  // Notas libres del usuario (de dónde salieron precios, cotizaciones y tasas).
  // Aparecen en el Reporte y se guardan con el resto de los inputs.
  userNotes: '',
  // --- Ingeniería económica y variables de decisión ---
  vehicleCondition: 'new',
  odometerKm: 0,
  // Tasa de depreciación de un usado (más lenta en % que la de un auto nuevo).
  usedDepreciationRate: 0.12,
  // Años de garantía restantes: mientras dure, las reparaciones mayores las cubre el
  // fabricante y la reserva de reparaciones de ese año es 0. Nuevos: 3; usados: 0
  // (los ajusta el panel lateral al cambiar la condición o el preset).
  warrantyYearsRemaining: 3,
  depreciationMethod: 'declining',
  firstYearDepreciation: 0.25,
  discountRate: 0.105, // costo de oportunidad (≈ CETES). Tasa para VPN/CAE.
  generalInflation: 0.045, // inflación anual de costos no-energéticos
  repairReserveAnnual: 0, // reserva de reparaciones (sube en usados)
  repairGrowth: 0.15,
  tradeInValue: 0, // auto a cuenta
  acquisitionFees: 0, // placas/alta/ISAN/revisión/traspaso
  sellingCostPct: 0, // costo de venta al liquidar
  // Riesgo de pérdida total o robo, modelado sólo en el Monte Carlo.
  theftLossProbAnnual: 0.015, // prob. anual de pérdida total
  theftDeductiblePct: 0.05, // deducible de cobertura amplia (% del valor asegurado)
};
