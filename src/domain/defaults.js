
export const DEFAULT_INPUTS = {
  carPreset:'kia_k3', carPrice:279900, carYear:2026, vehicleType:'gasoline',
  kmpl:18.5, kmPerKwh:6.0, batteryCapacityKwh:50, chargerPowerKw:7, hybridElectricFraction:0.3, plugInHybrid:false,
  carDescription:'', carJustification:'', carName:'',
  purchaseMode:'credit', downPaymentMode:'percent', downPaymentPct:0.20, downPaymentFixed:56000,
  cashAmount:100000, interestRate:0.135, loanMonths:48, openingFeePct:0.02,
  // Tipo de financiamiento (FEATURE 2). 'annuity' = crédito tradicional (default, comportamiento previo).
  // 'balloon' = crédito con pago final/residual. 'lease' = arrendamiento (sin propiedad).
  financeType:'annuity', balloonPct:0.35,
  leaseMonthly:6500, leaseDownPayment:20000, leaseTermMonths:48, leaseKmCapYear:20000, leaseExcessKmFee:3,
  operationMode:'uber-breakeven', monthlyProfitTarget:5000,
  city:'mty', cityName:'Monterrey', avgFare:140, uberCommission:0.25, taxRate:0.30,
  // Régimen fiscal del ingreso Uber (FEATURE 1). 'resico' es el NUEVO DEFAULT (realista):
  // retención de plataforma ~2.5% del ingreso bruto. 'gross' = supuesto escolar (30% del bruto).
  // 'net' = impuesto sobre la utilidad por viaje (usa taxRate).
  taxRegime:'resico', resicoRate:0.025,
  tripsPerHour:3, maxHoursPerDay:8, workDaysPerMonth:22, personalKmDaily:20, uberWearFactor:0.30,
  uberKmPerTrip:8,
  fuelPrice:24.5, dieselPrice:26.0, electricityPrice:4.2, fuelInflation:0.06, electricityInflation:0.04,
  // Split de carga pública vs. casera (FEATURE 2). Sólo afecta eléctrico / híbrido enchufable.
  // publicChargeFraction=0.15: 15% de la energía se carga en estaciones públicas (más caras).
  publicChargeFraction:0.15, publicChargePrice:8.0,
  monthlyInsurance:2000, annualMaintenance:8000, monthlyRefrendo:500, dataPlan:400,
  // Modo de seguro (FEATURE 3). 'fixed' = monto plano (default). 'pctOfValue' = % anual del
  // valor depreciado del auto (baja con la depreciación; realista para cobertura amplia).
  insuranceMode:'fixed', insurancePctOfValue:0.045,
  carWash:800, carWashTips:400, miscellaneous:2000, accessories:100,
  toxicologyReport:400, uberCertification:900,
  horizonYears:4, depreciationRate:0.20, salesFactor:1.0, monthlyIncome:0,
  // FEATURE 4 — notas y fuentes libres del usuario (de dónde salieron precios,
  // cotizaciones y tasas). Fluyen al Reporte; persisten vía el effect de App.
  userNotes:'',
  // --- Ingeniería económica y variables de decisión (nuevas) ---
  vehicleCondition:'new', odometerKm:0,
  // FEATURE 1(a) — tasa de depreciación para USADOS (más lenta en % que un auto nuevo).
  usedDepreciationRate:0.12,
  // FEATURE 1(b) — años de garantía restantes. Mientras y ≤ este valor, las reparaciones
  // mayores las cubre el fabricante y la reserva de reparaciones se suprime. Nuevos: 3; usados: 0
  // (lo ajustan applyCondition/applyCarPreset según la condición).
  warrantyYearsRemaining:3,
  depreciationMethod:'declining', firstYearDepreciation:0.25,
  discountRate:0.105,            // costo de oportunidad (≈ CETES). Tasa para VPN/CAE.
  generalInflation:0.045,        // inflación anual de costos no-energéticos
  repairReserveAnnual:0,         // reserva de reparaciones (sube en usados)
  repairGrowth:0.15,
  tradeInValue:0,                // auto a cuenta
  acquisitionFees:0,             // placas/alta/ISAN/revisión/traspaso
  sellingCostPct:0,              // costo de venta al liquidar
  // FEATURE 3 — riesgo de pérdida total / robo (write-off) modelado en Monte Carlo.
  theftLossProbAnnual:0.015,     // prob. anual de pérdida total
  theftDeductiblePct:0.05,       // deducible de cobertura amplia (% del valor asegurado)
};
