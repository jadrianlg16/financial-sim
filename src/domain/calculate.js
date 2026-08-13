import { depreciatedValue } from './depreciation.js';
import { calculateEnergyCost } from './energy.js';
import { buildAmortization, buildBalloonAmortization, equivalentAnnualCost, irr, npv, solvePeriodicRate } from './finance.js';
import { clamp, nonNegative, num, positive } from './format.js';

// ============================================================================
// MOTOR DE CÁLCULO  ·  Objetivos solicitados por el usuario
// ----------------------------------------------------------------------------
// Núcleo que conecta TODAS las variables entre sí (petición: "asegúrate que
// todas las variables estén interconectadas con las que deben estarlo").
// Resuelve:
//   - 3 modos de compra (efectivo / crédito / mixto) → enganche, financiado, VF/VP.
//   - 3 modos de operación (break-even / meta de ganancia / sin Uber).
//   - 4 tipos de motor con costo de energía propio + tiempo de carga (EV/híbrido enchufable)
//     que reduce las horas disponibles y por lo tanto el punto de equilibrio.
//   - Desgaste por Uber que multiplica el mantenimiento.
//   - Costos recurrentes: seguro, refrendo, lavado, propinas, misceláneos, datos,
//     accesorios + inflación de combustible/electricidad a lo largo del horizonte.
//   - Pagos iniciales ÚNICOS (toxicológico + certificación) → desembolso día 1.
  //   - Depreciación lineal por tasa anual, valor de rescate y 3 escenarios de
//     liquidación → resultado final.
//   - GASTO ACUMULADO por categoría año por año (para la gráfica de largo plazo)
//     y costo total/neto del proyecto.
// ============================================================================
export function calculate(I) {
  const carPrice = nonNegative(I.carPrice);
  const years = Math.max(1, Math.round(positive(I.horizonYears, 1)));
  const horizonMonths = years * 12;
  // Auto a cuenta (trade-in): actúa como enganche adicional, reduce lo financiado.
  const tradeInValue = Math.min(nonNegative(I.tradeInValue), carPrice);
  // FEATURE 2 — tipo de financiamiento. 'lease' SOLO aplica en compra a crédito;
  // en efectivo/mixto se ignora (sigue siendo annuity sobre lo financiado).
  const financeType = (I.purchaseMode === 'credit' ? (I.financeType || 'annuity') : 'annuity');
  const isLease = financeType === 'lease';
  const isBalloon = financeType === 'balloon';
  // En arrendamiento NO eres dueño: no hay activo que financiar ni que revender.
  const owned = !isLease;

  let cashPaid, financed;
  if (isLease) {
    // Arrendamiento: no se financia el auto; el "desembolso" inicial es el pago
    // inicial del arrendamiento (no recuperable). El trade-in no aplica al lease.
    cashPaid = nonNegative(I.leaseDownPayment);
    financed = 0;
  }
  else if (I.purchaseMode === 'cash') { cashPaid = Math.max(0, carPrice - tradeInValue); financed = 0; }
  else if (I.purchaseMode === 'hybrid') { cashPaid = Math.min(nonNegative(I.cashAmount), carPrice - tradeInValue); financed = Math.max(0, carPrice - tradeInValue - cashPaid); }
  else { cashPaid = I.downPaymentMode === 'percent' ? carPrice * clamp(I.downPaymentPct, 0, 1) : Math.min(nonNegative(I.downPaymentFixed), carPrice); financed = Math.max(0, carPrice - cashPaid - tradeInValue); }

  const interestRate = Math.max(-0.95, num(I.interestRate));
  // Plazo: en lease es el plazo del arrendamiento; en crédito el del préstamo.
  const months = isLease
    ? Math.max(1, Math.round(positive(I.leaseTermMonths, 1)))
    : (financed > 0 ? Math.max(1, Math.round(positive(I.loanMonths, 1))) : 0);
  // Monto residual/globo (sólo balloon): fracción del financiado que NO se amortiza.
  const balloonPct = isBalloon ? clamp(I.balloonPct, 0, 0.9) : 0;
  const balloonAmount = isBalloon ? financed * balloonPct : 0;
  // Amortización según el tipo: globo (residual) o anualidad estándar.
  const amort = (isBalloon && financed > 0)
    ? buildBalloonAmortization(financed, interestRate, months, balloonAmount)
    : buildAmortization(financed, interestRate, months);
  const balloonPayment = amort.balloon || 0;   // pago final del globo (0 si no aplica)

  // Mensualidad mostrada: en lease es la renta mensual; si no, la del crédito.
  const leaseMonthly = nonNegative(I.leaseMonthly);
  const monthlyPayment = isLease ? leaseMonthly : amort.payment;
  const totalInterest = amort.totalInterest;
  const openingFee = financed * nonNegative(I.openingFeePct);

  const r = interestRate / 12;
  // VP de los pagos del crédito a su propia tasa (anualidad regular; el globo entra como flujo único).
  const pvOfPayments = financed > 0
    ? (r === 0 ? amort.payment * months : amort.payment * (1 - Math.pow(1 + r, -months)) / r)
        + (isBalloon ? balloonAmount * Math.pow(1 + r, -months) : 0)
    : 0;
  // En lease: VP/VF se basan en las rentas + pago inicial (no hay crédito que descontar).
  const leasePvPayments = isLease ? (r === 0 ? leaseMonthly * Math.min(months, horizonMonths) : leaseMonthly * (1 - Math.pow(1 + r, -Math.min(months, horizonMonths))) / r) : 0;
  const pvTotal = isLease ? (leasePvPayments + cashPaid) : (pvOfPayments + cashPaid + openingFee);
  const fvTotal = isLease ? (leaseMonthly * Math.min(months, horizonMonths) + cashPaid) : (amort.totalPaid + cashPaid + openingFee);
  const timeValueOfMoney = fvTotal - pvTotal;

  const isUberMode = I.operationMode !== 'no-uber';
  const personalKm = nonNegative(I.personalKmDaily);

  // --- TRIP ↔ KM CONSISTENCY (audit fix #3) -------------------------------
  // El break-even se resuelve por CONTRIBUCIÓN NETA por viaje: los km de Uber,
  // el combustible y el mantenimiento variable dependen de los viajes que
  // realmente se necesitan, no de un supuesto diario desconectado.
  const kmPerTrip = positive(I.uberKmPerTrip, 1);     // km recorridos por viaje (incluye traslados vacíos)
  const personalMonthlyKm = personalKm * 30;

  // Costo de energía y mantenimiento POR KM (promediados sobre el horizonte para
  // incorporar inflación). Se calculan con un km de referencia y se normalizan.
  const REF_KM = 1000;
  let refEnergyOverHorizon = 0;
  for (let y = 0; y < years; y++) refEnergyOverHorizon += calculateEnergyCost(I, REF_KM, y).cost;
  const energyCostPerKm = (refEnergyOverHorizon / years) / REF_KM; // $/km promedio

  // Desgaste por Uber: el mantenimiento base se reparte por km; el uso Uber lo
  // encarece según uberWearFactor sobre la porción de km de Uber.
  // Mantenimiento variable por km: usamos un supuesto de 20,000 km/año base para derivar $/km,
  // y aplicamos el factor de desgaste a la fracción de km de Uber.
  const ASSUMED_BASE_KM_YEAR = 20000;
  const maintCostPerKm = nonNegative(I.annualMaintenance) / ASSUMED_BASE_KM_YEAR;
  const maintCostPerUberKm = maintCostPerKm * (1 + nonNegative(I.uberWearFactor));

  // FEATURE 3 — seguro: plano o como % del valor del auto (declina con la depreciación).
  // insuranceAnnualForYear(y) entrega la prima ANUAL del año y (y=1..años).
  //   'fixed'      → monthlyInsurance · 12 (constante).
  //   'pctOfValue' → insurancePctOfValue · valor depreciado a inicio del año (= valor al cierre de y−1,
  //                  o el precio para el año 1). Sólo si eres dueño; en lease el seguro lo paga el
  //                  arrendatario sobre el valor del auto igualmente (cobertura amplia).
  const insuranceMode = I.insuranceMode === 'pctOfValue' ? 'pctOfValue' : 'fixed';
  const insurancePctOfValue = clamp(I.insurancePctOfValue, 0, 0.3);
  const insuranceAnnualForYear = (y) => {
    if (insuranceMode !== 'pctOfValue') return nonNegative(I.monthlyInsurance) * 12;
    const valStart = depreciatedValue(carPrice, I, y - 1); // valor a inicio del año y
    return insurancePctOfValue * valStart;
  };
  // Fijos mensuales que NO dependen de km (todo menos energía y mantenimiento variable).
  // monthlyIns es el VALOR REPRESENTATIVO (año 1) que ven los KPIs y el break-even.
  const monthlyIns      = insuranceAnnualForYear(1) / 12;
  const monthlyRefrendo = nonNegative(I.monthlyRefrendo);
  const monthlyData     = isUberMode ? nonNegative(I.dataPlan) : 0;
  const monthlyCarWash  = isUberMode ? nonNegative(I.carWash) : nonNegative(I.carWash) * 0.4;
  const monthlyTips     = isUberMode ? nonNegative(I.carWashTips) : 0;
  const monthlyMisc     = nonNegative(I.miscellaneous);
  const monthlyAccess   = isUberMode ? nonNegative(I.accessories) : 0;

  // Energía/mantenimiento de los km PERSONALES (fijos respecto a los viajes Uber)
  const personalEnergyMonthly = personalMonthlyKm * energyCostPerKm;
  const personalMaintMonthly  = personalMonthlyKm * maintCostPerKm;

  const monthlyFixedNonKm = monthlyIns + monthlyRefrendo + monthlyData + monthlyCarWash
                          + monthlyTips + monthlyMisc + monthlyAccess
                          + personalEnergyMonthly + personalMaintMonthly;

  const oneTimeUberCosts = isUberMode ? (nonNegative(I.toxicologyReport) + nonNegative(I.uberCertification)) : 0;
  // Costos de adquisición que pagas una vez al comprar: placas/alta, ISAN/tenencia
  // inicial, revisión mecánica (usados), cambio de propietario, etc.
  const acquisitionFees = nonNegative(I.acquisitionFees);
  const upfrontCash = cashPaid + openingFee + oneTimeUberCosts + acquisitionFees;

  // Valor depreciado: sólo importa si eres dueño. En arrendamiento el auto NO es tuyo,
  // así que no hay valor de reventa que recuperar (FEATURE 2 · lease).
  const valueAtEnd = owned ? depreciatedValue(carPrice, I, years) : 0;
  const grossSalePrice = owned ? valueAtEnd * nonNegative(I.salesFactor) : 0;
  // Costo de venta al liquidar (comisión/agencia, trámite de traspaso).
  const sellingCostPct = clamp(I.sellingCostPct, 0, 0.5);
  const actualSalePrice = owned ? grossSalePrice * (1 - sellingCostPct) : 0;
  const monthAtEnd = Math.min(horizonMonths, months);
  // Deuda viva al horizonte. En balloon, el saldo de la fila ya incorpora el residual:
  // si el horizonte alcanza el plazo, el globo se liquida (saldo 0); si no, queda saldo
  // (incluida la parte residual aún no amortizada). En lease no hay deuda.
  const remainingDebt = (isLease || horizonMonths >= months || months === 0) ? 0 : (amort.rows[monthAtEnd - 1] ? amort.rows[monthAtEnd - 1].balance : 0);
  // Liquidación: lo que realmente recuperas al final (venta neta − deuda viva).
  // En lease es 0 (no hay activo ni deuda).
  const terminalRecovery = isLease ? 0 : (actualSalePrice - remainingDebt);
  const liquidationPosition = terminalRecovery;
  const finalPosition = terminalRecovery; // compat hacia atrás

  // Ingreso y costo variable POR VIAJE
  const grossPerTrip = nonNegative(I.avgFare);
  const uberCommissionRate = clamp(I.uberCommission, 0, 1);
  const taxRate = clamp(I.taxRate, 0, 1);
  const platformCommission = grossPerTrip * uberCommissionRate;
  const variableCostPerTrip = (energyCostPerKm + maintCostPerUberKm) * kmPerTrip;

  // FEATURE 1 — régimen fiscal del ingreso Uber. Tres formas de calcular el impuesto/viaje:
  //   'gross'  (ESCOLAR, comportamiento previo): taxRate · tarifa bruta (default taxRate 0.30).
  //   'resico' (REALISTA, NUEVO DEFAULT): retención de plataforma resicoRate · tarifa bruta (~2.5%).
  //   'net'    : taxRate sobre la UTILIDAD por viaje (tarifa − comisión − costo variable), nunca negativa.
  const taxRegime = I.taxRegime || 'resico';
  const resicoRate = clamp(I.resicoRate, 0, 0.2);
  let taxAmountPerTrip;
  if (taxRegime === 'gross') {
    taxAmountPerTrip = grossPerTrip * taxRate;
  } else if (taxRegime === 'net') {
    const profitBeforeTax = grossPerTrip - platformCommission - variableCostPerTrip;
    taxAmountPerTrip = taxRate * Math.max(0, profitBeforeTax);
  } else { // 'resico'
    taxAmountPerTrip = grossPerTrip * resicoRate;
  }
  const afterUber = grossPerTrip - platformCommission;
  const netRevenuePerTrip = grossPerTrip - platformCommission - taxAmountPerTrip;
  const netContributionPerTrip = netRevenuePerTrip - variableCostPerTrip;
  const netPerTrip = netRevenuePerTrip; // compat: ingreso neto antes de costo variable

  // Recuperación necesaria para que el proyecto completo se pague solo:
  // si la venta menos deuda no cubre el desembolso inicial, Uber debe generar
  // esa diferencia durante el horizonte. Si la venta la cubre, no se cobra extra.
  const projectRecoveryBase = isUberMode ? Math.max(0, upfrontCash - terminalRecovery) : 0;
  const projectRecoveryMonthly = projectRecoveryBase / horizonMonths;
  const upfrontRecoveryMonthly = projectRecoveryMonthly; // alias para compatibilidad

  const profitTarget = I.operationMode === 'uber-target-profit' ? nonNegative(I.monthlyProfitTarget) : 0;
  // Costos FIJOS mensuales a cubrir con la contribución por viaje:
  const operatingFixedMonthlyCosts = monthlyPayment + monthlyFixedNonKm;
  const fixedMonthlyCosts = operatingFixedMonthlyCosts + profitTarget + projectRecoveryMonthly;
  const operatingBreakEvenTrips = (isUberMode && netContributionPerTrip > 0) ? operatingFixedMonthlyCosts / netContributionPerTrip : 0;
  const breakEvenTrips = isUberMode ? (netContributionPerTrip > 0 ? fixedMonthlyCosts / netContributionPerTrip : Infinity) : 0;

  // Km realizados, derivados de los viajes resultantes (consistencia total)
  const uberMonthlyKm = isUberMode && Number.isFinite(breakEvenTrips) ? breakEvenTrips * kmPerTrip : 0;
  const monthlyKm = uberMonthlyKm + personalMonthlyKm;
  const totalDailyKm = monthlyKm / 30;
  const uberKm = uberMonthlyKm / 30;

  // Energía mensual realizada (para mostrar y para gráficas), con inflación por año
  const energyByYear = [];
  for (let y = 0; y < years; y++) energyByYear.push(calculateEnergyCost(I, monthlyKm, y));
  const yearOneEnergy = energyByYear[0] || { cost: 0, chargingTimePerDay: 0 };
  const avgMonthlyEnergy = energyByYear.reduce((a, e) => a + e.cost, 0) / years;

  // Mantenimiento mensual realizado (personal + uber con desgaste)
  const effectiveMaintenance = (personalMonthlyKm * maintCostPerKm + uberMonthlyKm * maintCostPerUberKm) * 12;
  const wearMultiplier = isUberMode && (personalMonthlyKm + uberMonthlyKm) > 0
    ? (personalMonthlyKm * maintCostPerKm + uberMonthlyKm * maintCostPerUberKm) / ((personalMonthlyKm + uberMonthlyKm) * maintCostPerKm)
    : 1;

  const monthlyFuel  = avgMonthlyEnergy;
  const monthlyMaint = effectiveMaintenance / 12;
  // Costo operativo y total mensual (ya con km consistentes)
  const monthlyOpCosts = monthlyFuel + monthlyIns + monthlyRefrendo + monthlyMaint + monthlyData + monthlyCarWash + monthlyTips + monthlyMisc + monthlyAccess;
  const monthlyTotalOperative = monthlyOpCosts + monthlyPayment;

  // --- EV: viabilidad por batería (audit fix #6) --------------------------
  // ¿Los km diarios de Uber caben en la energía utilizable de la batería por día,
  // dado el tiempo de carga disponible? Señala si la autonomía no alcanza.
  const isEV = I.vehicleType === 'electric';
  const usableKwh = nonNegative(I.batteryCapacityKwh) * 0.9; // 90% utilizable (margen de batería)
  const dailyRangeKm = isEV ? usableKwh * positive(I.kmPerKwh, 1) : Infinity;
  const evRangeShortfall = isEV && totalDailyKm > dailyRangeKm; // requiere recargar a mitad de jornada

  const chargingHoursPerDay = yearOneEnergy.chargingTimePerDay || 0;
  const maxHoursPerDay = nonNegative(I.maxHoursPerDay);
  const effectiveMaxHoursPerDay = Math.max(0, maxHoursPerDay - chargingHoursPerDay);
  const tripsPerHour = positive(I.tripsPerHour, 1);
  const workDaysPerMonth = positive(I.workDaysPerMonth, 1);
  const maxTripsMonth = tripsPerHour * effectiveMaxHoursPerDay * workDaysPerMonth;

  const tripsPerDay = isUberMode ? breakEvenTrips / workDaysPerMonth : 0;
  const hoursPerDay = isUberMode ? tripsPerDay / tripsPerHour : 0;
  const weeklyDays = workDaysPerMonth / 4.33;
  const hoursPerWeek = weeklyDays * hoursPerDay;

  const capacityUsage = isUberMode && maxTripsMonth > 0 ? breakEvenTrips / maxTripsMonth : 0;
  const tripsPerHourWarn = tripsPerHour > 4;
  const chargingExceedsAvailableHours = chargingHoursPerDay > maxHoursPerDay;
  const feasible = !isUberMode || (
    Number.isFinite(breakEvenTrips)
    && maxTripsMonth > 0            // sin horas/viajes disponibles no es viable (evita capacityUsage=0 vacuo)
    && capacityUsage <= 1
    && netContributionPerTrip > 0
    && !tripsPerHourWarn
    && !evRangeShortfall
    && !chargingExceedsAvailableHours
  );
  const safetyMargin = (isUberMode && netContributionPerTrip > 0 && Number.isFinite(breakEvenTrips))
    ? (maxTripsMonth - breakEvenTrips) * netContributionPerTrip
    : -fixedMonthlyCosts;

  // Inflación general de costos (seguro, refrendo, mantenimiento, misc, etc.) y
  // reserva de reparaciones que crece con la edad del auto (clave en usados).
  const generalInflation = Math.max(-0.5, num(I.generalInflation));
  const baseAgeYears = Math.max(0, 2026 - num(I.carYear, 2026));
  const repairBase = nonNegative(I.repairReserveAnnual);
  const repairGrowth = nonNegative(I.repairGrowth != null ? I.repairGrowth : 0.15);
  // FEATURE 1(b) — ventana de garantía: mientras el año y cae dentro de la garantía
  // (y ≤ warrantyYearsRemaining) las reparaciones mayores las cubre el fabricante,
  // así que la reserva de ese año se suprime (≈0). Pasada la garantía vuelve a
  // aplicar y crece con la edad como hoy. Nuevos traen garantía (default 3); usados 0.
  const warrantyYearsRemaining = nonNegative(I.warrantyYearsRemaining);
  const repairReserveYear = (y) => (y <= warrantyYearsRemaining)
    ? 0
    : repairBase * Math.pow(1 + repairGrowth, baseAgeYears + (y - 1));

  const loanMonthsInYear = (y) => { if (months === 0) return 0; const overlapEnd = Math.min(y*12, months); return Math.max(0, overlapEnd - (y-1)*12); };
  // FEATURE 2 — meses de RENTA del arrendamiento dentro del año y (limitado por plazo y horizonte).
  const leaseMonthsInYear = (y) => { if (!isLease) return 0; const overlapEnd = Math.min(y*12, months); return Math.max(0, overlapEnd - (y-1)*12); };
  // FEATURE 2 — penalización por exceso de km del arrendamiento ese año (cap anual · cuota/km).
  const leaseKmCapYear = nonNegative(I.leaseKmCapYear);
  const leaseExcessKmFee = nonNegative(I.leaseExcessKmFee);
  const annualKm = monthlyKm * 12;
  const leaseKmPenaltyYear = (isLease && leaseKmCapYear > 0 && annualKm > leaseKmCapYear)
    ? (annualKm - leaseKmCapYear) * leaseExcessKmFee : 0;
  // FEATURE 2 — mes en que vence el globo (balloon) dentro del horizonte; su año recibe el pago final.
  const balloonDueYear = (isBalloon && balloonAmount > 0 && months > 0 && months <= horizonMonths) ? Math.ceil(months / 12) : 0;
  const cashflow = [];
  let cumRevenue = 0, cumCosts = 0, cCar = 0, cEnergy = 0, cInsRef = 0, cMaint = 0, cOther = 0, cTotal = 0;
  let totalRepairReserve = 0;
  for (let y = 1; y <= years; y++) {
    const infl = Math.pow(1 + generalInflation, y - 1);
    // Pago del año: lease usa la renta mensual; crédito usa la mensualidad. El globo se
    // suma como pago único en su año de vencimiento (no se prorratea en la mensualidad).
    const yearPayment = isLease
      ? leaseMonthsInYear(y) * leaseMonthly
      : loanMonthsInYear(y) * monthlyPayment + (y === balloonDueYear ? balloonAmount : 0);
    const yearEnergy = (energyByYear[y-1]?.cost || 0) * 12;                 // ya trae inflación de combustible
    // Seguro: en modo 'fixed' es plano en nominal (no se infla: en la práctica baja con el
    // valor del auto). En modo 'pctOfValue' declina con la depreciación (FEATURE 3).
    // El refrendo/tenencia sí sigue la inflación. Más la penalización por km del lease.
    const yearInsRef = insuranceAnnualForYear(y) + monthlyRefrendo * 12 * infl;
    const yearRepair = owned ? repairReserveYear(y) : 0;   // en lease no apartas reparaciones mayores
    const yearMaint = monthlyMaint * 12 * infl + yearRepair + leaseKmPenaltyYear;
    const yearOther = (monthlyData + monthlyCarWash + monthlyTips + monthlyMisc + monthlyAccess) * 12 * infl;
    const yearUpfront = (y === 1) ? upfrontCash : 0;
    totalRepairReserve += yearRepair;
    cCar += yearPayment + yearUpfront; cEnergy += yearEnergy; cInsRef += yearInsRef; cMaint += yearMaint; cOther += yearOther;
    cTotal = cCar + cEnergy + cInsRef + cMaint + cOther;
    const yearOperating = yearEnergy + yearInsRef + yearMaint + yearOther;
    const annualRevenue = isUberMode && Number.isFinite(breakEvenTrips) ? breakEvenTrips * netPerTrip * 12 : 0;
    const annualCosts = yearOperating + yearPayment + yearUpfront;
    cumRevenue += annualRevenue; cumCosts += annualCosts;
    cashflow.push({
      year: 2025 + y, revenue: annualRevenue, costs: annualCosts, cumRevenue, cumCosts,
      depValue: owned ? depreciatedValue(carPrice, I, y) : 0,   // en lease no eres dueño → 0
      debtRemaining: (isLease || y*12 >= months || months === 0) ? 0 : (amort.rows[y*12 - 1] ? amort.rows[y*12 - 1].balance : 0),
      cCar: Math.round(cCar), cEnergy: Math.round(cEnergy), cInsRef: Math.round(cInsRef),
      cMaint: Math.round(cMaint), cOther: Math.round(cOther), cTotal: Math.round(cTotal),
    });
  }
  // Posición de liquidación por año = valor de venta neto ese año − deuda viva ese año.
  // Útil para que la gráfica de comparación incluya venta/deuda y no sólo flujo. (audit fix #comparison)
  // En lease no hay reventa: saleNetFactor=0 deja liqValue = −deuda = 0.
  const saleNetFactor = owned ? nonNegative(I.salesFactor) * (1 - sellingCostPct) : 0;
  cashflow.forEach(p => { p.liqValue = Math.round(p.depValue * saleNetFactor - p.debtRemaining); });

  const totalSpentGross = cTotal;
  // Costo neto del proyecto: gasto total MENOS lo que REALMENTE recuperas
  // (venta − deuda viva), no la venta completa. (audit fix #1)
  const totalProjectCost = totalSpentGross - terminalRecovery;
  // Resultado neto del proyecto: ingresos Uber + liquidación − todo lo gastado.
  const netProjectResult = cumRevenue + terminalRecovery - totalSpentGross;

  // ==========================================================================
  // INGENIERÍA ECONÓMICA: VPN, TIR, CAE, TCO, CAT y financiar-vs-contado
  // --------------------------------------------------------------------------
  // Tasa de oportunidad (costo de capital): lo que tu dinero rendiría en otro
  // lado. Es la tasa con la que se descuentan los flujos (NO la del crédito).
  const discountAnnual = clamp(I.discountRate, 0, 1);
  // Flujos ANUALES del comprador (− sale dinero, + entra). El desembolso inicial
  // va en t0; el último año suma la recuperación terminal (venta neta − deuda).
  const annualNet = cashflow.map((c, idx) => c.revenue - (c.costs - (idx === 0 ? upfrontCash : 0)));
  if (annualNet.length) annualNet[annualNet.length - 1] += terminalRecovery;
  const projectCashflows = [-upfrontCash, ...annualNet];
  const npvProject = npv(discountAnnual, projectCashflows);
  const irrProject = irr(projectCashflows);
  // Valor presente del COSTO total de propiedad (ignora ingresos: sirve para
  // comparar autos y formas de pago de forma homogénea).
  let pvLifetimeCost = upfrontCash;
  cashflow.forEach((c, i) => { pvLifetimeCost += (c.costs - (i === 0 ? upfrontCash : 0)) / Math.pow(1 + discountAnnual, i + 1); });
  pvLifetimeCost -= terminalRecovery / Math.pow(1 + discountAnnual, years);
  const eac = equivalentAnnualCost(pvLifetimeCost, discountAnnual, years); // costo anual equivalente

  // TCO nominal (sin descontar) = costo neto del proyecto. Por año y por km.
  const tcoTotal = totalProjectCost;
  const tcoPerYear = tcoTotal / years;
  const totalKmHorizon = monthlyKm * 12 * years;
  const costPerKm = totalKmHorizon > 0 ? tcoTotal / totalKmHorizon : NaN;
  // Depreciación como costo: pérdida de valor del auto (precio − valor de mercado
  // al final, ANTES de costos de venta; el costo de venta es transacción, no depreciación).
  // En arrendamiento no eres dueño → no asumes depreciación del activo (FEATURE 2 · lease).
  const depreciationCost = owned ? (carPrice - grossSalePrice) : 0;
  const financingCost = isLease ? (leaseMonthly * Math.min(months, horizonMonths) + cashPaid) : (totalInterest + openingFee); // costo del crédito / arrendamiento

  // CAT y tasa efectiva anual del crédito (incluye comisión de apertura).
  const ear = financed > 0 ? Math.pow(1 + interestRate/12, 12) - 1 : 0;
  const catMonthly = financed > 0 ? solvePeriodicRate(financed - openingFee, monthlyPayment, months) : 0;
  const cat = financed > 0 ? Math.pow(1 + catMonthly, 12) - 1 : 0;

  // ¿Financiar o pagar de contado? Comparación en valor presente a la tasa de
  // oportunidad. Positivo = financiar conviene (tu dinero rinde más que el crédito).
  // Tasa mensual EQUIVALENTE a la anual (mismo factor de descuento que VPN/CAE).
  const dM = Math.pow(1 + discountAnnual, 1/12) - 1;
  const pvPaymentsAtOpportunity = financed > 0 ? (dM === 0 ? monthlyPayment*months : monthlyPayment*(1-Math.pow(1+dM,-months))/dM) : 0;
  const pvFinancedPath = cashPaid + openingFee + pvPaymentsAtOpportunity;
  const pvCashPath = Math.max(0, carPrice - tradeInValue);
  const financeVsCashPV = pvCashPath - pvFinancedPath; // + → financiar conviene en VP
  const opportunityCostUpfront = upfrontCash * (Math.pow(1 + discountAnnual, years) - 1); // lo que rendiría el desembolso

  return {
    carPrice, cashPaid, financed, openingFee, oneTimeUberCosts, upfrontCash,
    monthlyPayment, totalInterest, totalPaidNominal: amort.totalPaid, pvTotal, fvTotal, timeValueOfMoney,
    months, amortRows: amort.rows, grossPerTrip, platformCommission, taxAmountPerTrip, afterUber, netPerTrip,
    netRevenuePerTrip, variableCostPerTrip, netContributionPerTrip, kmPerTrip,
    energyCostPerKm, maintCostPerKm, maintCostPerUberKm, upfrontRecoveryMonthly,
    projectRecoveryBase, projectRecoveryMonthly, operatingFixedMonthlyCosts, fixedMonthlyCosts, operatingBreakEvenTrips,
    monthlyFuel, monthlyIns, monthlyRefrendo, monthlyMaint, monthlyData, monthlyCarWash, monthlyTips, monthlyMisc, monthlyAccess,
    monthlyOpCosts, monthlyTotalOperative, monthlyFixedNonKm,
    breakEvenTrips, tripsPerDay, hoursPerDay, weeklyDays, hoursPerWeek, maxTripsMonth, capacityUsage, feasible, tripsPerHourWarn,
    safetyMargin, profitTarget, valueAtEnd, actualSalePrice, remainingDebt,
    finalPosition, liquidationPosition, terminalRecovery, netProjectResult, cumRevenue, cumCosts,
    cashflow, monthlyKm, uberKm, uberMonthlyKm, personalKm, personalMonthlyKm, totalDailyKm, isUberMode, chargingHoursPerDay, effectiveMaxHoursPerDay,
    isEV, usableKwh, dailyRangeKm, evRangeShortfall, chargingExceedsAvailableHours,
    yearOneEnergy, energyByYear, wearMultiplier, effectiveMaintenance, avgMonthlyEnergy, totalProjectCost, totalSpentGross,
    // Ingeniería económica + variables nuevas
    tradeInValue, acquisitionFees, sellingCostPct, grossSalePrice, generalInflation, totalRepairReserve, baseAgeYears, warrantyYearsRemaining,
    discountAnnual, npvProject, irrProject, pvLifetimeCost, eac, tcoTotal, tcoPerYear, totalKmHorizon, costPerKm,
    depreciationCost, financingCost, ear, cat, financeVsCashPV, pvFinancedPath, pvCashPath, opportunityCostUpfront,
    // FEATURE 1 (impuestos) · FEATURE 2 (financiamiento) · FEATURE 3 (seguro)
    taxRegime, taxRate, resicoRate,
    financeType, owned, isLease, isBalloon, balloonPct, balloonAmount, balloonPayment, leaseMonthly, leaseKmPenaltyYear,
    insuranceMode, insurancePctOfValue,
  };
}

// Construye las variables de sensibilidad según el tipo de vehículo y el modo. (audit fix #sens)
