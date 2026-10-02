import { depreciatedValue } from './depreciation.js';
import { calculateEnergyCost } from './energy.js';
import {
  buildAmortization,
  buildBalloonAmortization,
  equivalentAnnualCost,
  irr,
  npv,
  solvePeriodicRate,
} from './finance.js';
import { clamp, nonNegative, num, positive } from './format.js';
import { currentYear, projectionYear } from './year.js';

// ============================================================================
// MOTOR DE CÁLCULO
// ----------------------------------------------------------------------------
// calculate() convierte un objeto de inputs en el resultado completo que leen
// todas las pestañas. Corre en etapas con nombre; cada una recibe sólo lo que
// necesita de las anteriores:
//   1. financingStage     enganche, monto financiado, crédito/globo/arrendamiento, VP/VF
//   2. operatingCostStage costos por km (energía, mantenimiento), fijos mensuales, desembolso día 1
//   3. liquidationStage   valor de venta al horizonte menos deuda viva
//   4. breakEvenStage     contribución neta por viaje y viajes/mes para cubrir el plan
//   5. usageStage         km, energía y mantenimiento que implican esos viajes
//   6. feasibilityStage   horas, viajes/hora, autonomía y carga del EV
//   7. cashflowStage      flujo año por año con inflación, reparaciones y totales
//   8. economicsStage     VPN, TIR, CAE, TCO, CAT y financiar vs. contado
// ============================================================================

// Supuesto de km anuales con el que se reparte el mantenimiento base por km.
const ASSUMED_BASE_KM_YEAR = 20000;
// Km de referencia para obtener el costo de energía por km promediado en el horizonte.
const REF_KM = 1000;
// Fracción utilizable de la batería (margen para no operar al 0–100%).
const USABLE_BATTERY_FRACTION = 0.9;

/** Horizon, purchase split, loan or lease terms and the credit's present/future value. */
function financingStage(I) {
  const carPrice = nonNegative(I.carPrice);
  const years = Math.max(1, Math.round(positive(I.horizonYears, 1)));
  const horizonMonths = years * 12;
  // Auto a cuenta (trade-in): actúa como enganche adicional, reduce lo financiado.
  const tradeInValue = Math.min(nonNegative(I.tradeInValue), carPrice);
  // Globo y arrendamiento sólo existen en compra a crédito; en efectivo o mixto lo
  // financiado (si hay) es siempre una anualidad.
  const financeType = I.purchaseMode === 'credit' ? I.financeType || 'annuity' : 'annuity';
  const isLease = financeType === 'lease';
  const isBalloon = financeType === 'balloon';
  // En arrendamiento NO eres dueño: no hay activo que financiar ni que revender.
  const owned = !isLease;

  let cashPaid, financed;
  if (isLease) {
    // El desembolso inicial es el pago inicial del arrendamiento (no recuperable);
    // el trade-in no aplica.
    cashPaid = nonNegative(I.leaseDownPayment);
    financed = 0;
  } else if (I.purchaseMode === 'cash') {
    cashPaid = Math.max(0, carPrice - tradeInValue);
    financed = 0;
  } else if (I.purchaseMode === 'hybrid') {
    cashPaid = Math.min(nonNegative(I.cashAmount), carPrice - tradeInValue);
    financed = Math.max(0, carPrice - tradeInValue - cashPaid);
  } else {
    cashPaid =
      I.downPaymentMode === 'percent'
        ? carPrice * clamp(I.downPaymentPct, 0, 1)
        : Math.min(nonNegative(I.downPaymentFixed), carPrice);
    financed = Math.max(0, carPrice - cashPaid - tradeInValue);
  }

  const interestRate = Math.max(-0.95, num(I.interestRate));
  // Plazo: en arrendamiento, el del contrato; en crédito, el del préstamo.
  const months = isLease
    ? Math.max(1, Math.round(positive(I.leaseTermMonths, 1)))
    : financed > 0
      ? Math.max(1, Math.round(positive(I.loanMonths, 1)))
      : 0;
  // Globo: fracción de lo financiado que no se amortiza y se paga al final.
  const balloonPct = isBalloon ? clamp(I.balloonPct, 0, 0.9) : 0;
  const balloonAmount = isBalloon ? financed * balloonPct : 0;
  const amort =
    isBalloon && financed > 0
      ? buildBalloonAmortization(financed, interestRate, months, balloonAmount)
      : buildAmortization(financed, interestRate, months);
  const balloonPayment = amort.balloon || 0;

  // Mensualidad mostrada: en arrendamiento es la renta; si no, la del crédito.
  const leaseMonthly = nonNegative(I.leaseMonthly);
  const monthlyPayment = isLease ? leaseMonthly : amort.payment;
  const totalInterest = amort.totalInterest;
  const openingFee = financed * nonNegative(I.openingFeePct);

  const r = interestRate / 12;
  // VP de los pagos a la propia tasa del crédito; el globo entra como flujo único al final.
  const pvOfPayments =
    financed > 0
      ? (r === 0 ? amort.payment * months : (amort.payment * (1 - Math.pow(1 + r, -months))) / r) +
        (isBalloon ? balloonAmount * Math.pow(1 + r, -months) : 0)
      : 0;
  // En arrendamiento, VP y VF se basan en las rentas dentro del horizonte más el pago inicial.
  const leasePvPayments = isLease
    ? r === 0
      ? leaseMonthly * Math.min(months, horizonMonths)
      : (leaseMonthly * (1 - Math.pow(1 + r, -Math.min(months, horizonMonths)))) / r
    : 0;
  const pvTotal = isLease ? leasePvPayments + cashPaid : pvOfPayments + cashPaid + openingFee;
  const fvTotal = isLease
    ? leaseMonthly * Math.min(months, horizonMonths) + cashPaid
    : amort.totalPaid + cashPaid + openingFee;
  const timeValueOfMoney = fvTotal - pvTotal;

  return {
    carPrice,
    years,
    horizonMonths,
    tradeInValue,
    financeType,
    isLease,
    isBalloon,
    owned,
    cashPaid,
    financed,
    interestRate,
    months,
    balloonPct,
    balloonAmount,
    amort,
    balloonPayment,
    leaseMonthly,
    monthlyPayment,
    totalInterest,
    totalPaidNominal: amort.totalPaid,
    amortRows: amort.rows,
    openingFee,
    pvTotal,
    fvTotal,
    timeValueOfMoney,
  };
}

/**
 * Energy and maintenance cost per km, the fixed monthly costs that do not depend
 * on trips, and the cash paid on day one.
 */
function operatingCostStage(I, { carPrice, years, cashPaid, openingFee, isUberMode, asOfYear }) {
  const personalKm = nonNegative(I.personalKmDaily);
  // Km recorridos por viaje, incluidos los traslados vacíos para recoger al pasajero.
  const kmPerTrip = positive(I.uberKmPerTrip, 1);
  const personalMonthlyKm = personalKm * 30;

  // Energía por km promediada en el horizonte para incorporar la inflación de
  // combustible/electricidad; se calcula con un kilometraje de referencia.
  let refEnergyOverHorizon = 0;
  for (let y = 0; y < years; y++) refEnergyOverHorizon += calculateEnergyCost(I, REF_KM, y).cost;
  const energyCostPerKm = refEnergyOverHorizon / years / REF_KM;

  // El mantenimiento base se reparte por km; cada km de Uber cuesta además el
  // factor de desgaste extra.
  const maintCostPerKm = nonNegative(I.annualMaintenance) / ASSUMED_BASE_KM_YEAR;
  const maintCostPerUberKm = maintCostPerKm * (1 + nonNegative(I.uberWearFactor));

  // Seguro: monto fijo, o % anual del valor depreciado al inicio de cada año
  // (baja conforme el auto se deprecia). insuranceAnnualForYear(y) da la prima del
  // año y = 1..N; el año 1 es el valor mensual que ven los KPIs y el break-even.
  const insuranceMode = I.insuranceMode === 'pctOfValue' ? 'pctOfValue' : 'fixed';
  const insurancePctOfValue = clamp(I.insurancePctOfValue, 0, 0.3);
  const insuranceAnnualForYear = (y) => {
    if (insuranceMode !== 'pctOfValue') return nonNegative(I.monthlyInsurance) * 12;
    return insurancePctOfValue * depreciatedValue(carPrice, I, y - 1, asOfYear);
  };
  const monthlyIns = insuranceAnnualForYear(1) / 12;
  const monthlyRefrendo = nonNegative(I.monthlyRefrendo);
  // Datos, propinas y accesorios sólo existen al manejar en Uber; el lavado de uso
  // personal se estima en 40% del de un auto de plataforma.
  const monthlyData = isUberMode ? nonNegative(I.dataPlan) : 0;
  const monthlyCarWash = isUberMode ? nonNegative(I.carWash) : nonNegative(I.carWash) * 0.4;
  const monthlyTips = isUberMode ? nonNegative(I.carWashTips) : 0;
  const monthlyMisc = nonNegative(I.miscellaneous);
  const monthlyAccess = isUberMode ? nonNegative(I.accessories) : 0;

  // La energía y el mantenimiento de los km personales no dependen de los viajes.
  const personalEnergyMonthly = personalMonthlyKm * energyCostPerKm;
  const personalMaintMonthly = personalMonthlyKm * maintCostPerKm;

  const monthlyFixedNonKm =
    monthlyIns +
    monthlyRefrendo +
    monthlyData +
    monthlyCarWash +
    monthlyTips +
    monthlyMisc +
    monthlyAccess +
    personalEnergyMonthly +
    personalMaintMonthly;

  const oneTimeUberCosts = isUberMode
    ? nonNegative(I.toxicologyReport) + nonNegative(I.uberCertification)
    : 0;
  // Gastos de adquisición pagados una vez: placas/alta, ISAN, revisión, traspaso.
  const acquisitionFees = nonNegative(I.acquisitionFees);
  const upfrontCash = cashPaid + openingFee + oneTimeUberCosts + acquisitionFees;

  return {
    personalKm,
    kmPerTrip,
    personalMonthlyKm,
    energyCostPerKm,
    maintCostPerKm,
    maintCostPerUberKm,
    insuranceMode,
    insurancePctOfValue,
    insuranceAnnualForYear,
    monthlyIns,
    monthlyRefrendo,
    monthlyData,
    monthlyCarWash,
    monthlyTips,
    monthlyMisc,
    monthlyAccess,
    monthlyFixedNonKm,
    oneTimeUberCosts,
    acquisitionFees,
    upfrontCash,
  };
}

/** What selling the car at the end of the horizon recovers, net of selling costs and debt. */
function liquidationStage(
  I,
  { carPrice, years, horizonMonths, months, owned, isLease, amort, asOfYear },
) {
  // Sin propiedad (arrendamiento) no hay valor de reventa que recuperar.
  const valueAtEnd = owned ? depreciatedValue(carPrice, I, years, asOfYear) : 0;
  const grossSalePrice = owned ? valueAtEnd * nonNegative(I.salesFactor) : 0;
  // Costo de venta al liquidar (comisión de agencia, trámite de traspaso).
  const sellingCostPct = clamp(I.sellingCostPct, 0, 0.5);
  const actualSalePrice = owned ? grossSalePrice * (1 - sellingCostPct) : 0;
  const monthAtEnd = Math.min(horizonMonths, months);
  // Deuda viva al horizonte. En un crédito con globo el saldo de la fila ya incluye
  // el residual: si el horizonte alcanza el plazo se liquida (saldo 0); si no, queda.
  const remainingDebt =
    isLease || horizonMonths >= months || months === 0
      ? 0
      : amort.rows[monthAtEnd - 1]
        ? amort.rows[monthAtEnd - 1].balance
        : 0;
  // Lo que realmente recuperas al final: venta neta menos deuda viva.
  const terminalRecovery = isLease ? 0 : actualSalePrice - remainingDebt;

  return {
    valueAtEnd,
    grossSalePrice,
    sellingCostPct,
    actualSalePrice,
    remainingDebt,
    terminalRecovery,
    liquidationPosition: terminalRecovery,
    finalPosition: terminalRecovery,
  };
}

/**
 * Net contribution of one trip (fare minus commission, tax and its variable
 * cost) and the trips per month needed to cover fixed costs, the profit target
 * and whatever part of the day-one cash the final sale does not recover.
 */
function breakEvenStage(
  I,
  {
    isUberMode,
    energyCostPerKm,
    maintCostPerUberKm,
    kmPerTrip,
    upfrontCash,
    terminalRecovery,
    horizonMonths,
    monthlyPayment,
    monthlyFixedNonKm,
  },
) {
  const grossPerTrip = nonNegative(I.avgFare);
  const uberCommissionRate = clamp(I.uberCommission, 0, 1);
  const taxRate = clamp(I.taxRate, 0, 1);
  const platformCommission = grossPerTrip * uberCommissionRate;
  const variableCostPerTrip = (energyCostPerKm + maintCostPerUberKm) * kmPerTrip;

  // Impuesto por viaje según el régimen:
  //   'resico' (default) retención de plataforma: resicoRate × tarifa bruta.
  //   'gross'  taxRate × tarifa bruta (supuesto simplificado; sobreestima el impuesto).
  //   'net'    taxRate × utilidad del viaje (tarifa − comisión − costo variable), nunca negativa.
  const taxRegime = I.taxRegime || 'resico';
  const resicoRate = clamp(I.resicoRate, 0, 0.2);
  let taxAmountPerTrip;
  if (taxRegime === 'gross') {
    taxAmountPerTrip = grossPerTrip * taxRate;
  } else if (taxRegime === 'net') {
    const profitBeforeTax = grossPerTrip - platformCommission - variableCostPerTrip;
    taxAmountPerTrip = taxRate * Math.max(0, profitBeforeTax);
  } else {
    taxAmountPerTrip = grossPerTrip * resicoRate;
  }
  const afterUber = grossPerTrip - platformCommission;
  const netRevenuePerTrip = grossPerTrip - platformCommission - taxAmountPerTrip;
  const netContributionPerTrip = netRevenuePerTrip - variableCostPerTrip;

  // Para que el proyecto completo se pague solo, Uber debe generar durante el
  // horizonte la parte del desembolso inicial que la venta final (menos deuda) no cubre.
  const projectRecoveryBase = isUberMode ? Math.max(0, upfrontCash - terminalRecovery) : 0;
  const projectRecoveryMonthly = projectRecoveryBase / horizonMonths;

  const profitTarget =
    I.operationMode === 'uber-target-profit' ? nonNegative(I.monthlyProfitTarget) : 0;
  const operatingFixedMonthlyCosts = monthlyPayment + monthlyFixedNonKm;
  const fixedMonthlyCosts = operatingFixedMonthlyCosts + profitTarget + projectRecoveryMonthly;
  const operatingBreakEvenTrips =
    isUberMode && netContributionPerTrip > 0
      ? operatingFixedMonthlyCosts / netContributionPerTrip
      : 0;
  // Si cada viaje pierde dinero, ningún número de viajes cubre los costos.
  const breakEvenTrips = isUberMode
    ? netContributionPerTrip > 0
      ? fixedMonthlyCosts / netContributionPerTrip
      : Infinity
    : 0;

  return {
    grossPerTrip,
    taxRate,
    platformCommission,
    variableCostPerTrip,
    taxRegime,
    resicoRate,
    taxAmountPerTrip,
    afterUber,
    netRevenuePerTrip,
    netContributionPerTrip,
    netPerTrip: netRevenuePerTrip,
    projectRecoveryBase,
    projectRecoveryMonthly,
    upfrontRecoveryMonthly: projectRecoveryMonthly,
    profitTarget,
    operatingFixedMonthlyCosts,
    fixedMonthlyCosts,
    operatingBreakEvenTrips,
    breakEvenTrips,
  };
}

/**
 * Kilometres, energy and maintenance implied by the break-even trips, so fuel
 * and wear agree with the hours the plan requires.
 */
function usageStage(
  I,
  {
    isUberMode,
    breakEvenTrips,
    kmPerTrip,
    personalMonthlyKm,
    years,
    maintCostPerKm,
    maintCostPerUberKm,
    monthlyIns,
    monthlyRefrendo,
    monthlyData,
    monthlyCarWash,
    monthlyTips,
    monthlyMisc,
    monthlyAccess,
    monthlyPayment,
  },
) {
  const uberMonthlyKm =
    isUberMode && Number.isFinite(breakEvenTrips) ? breakEvenTrips * kmPerTrip : 0;
  const monthlyKm = uberMonthlyKm + personalMonthlyKm;
  const totalDailyKm = monthlyKm / 30;
  const uberKm = uberMonthlyKm / 30;

  // Energía mensual de esos km, año por año con su inflación.
  const energyByYear = [];
  for (let y = 0; y < years; y++) energyByYear.push(calculateEnergyCost(I, monthlyKm, y));
  const yearOneEnergy = energyByYear[0] || { cost: 0, chargingTimePerDay: 0 };
  const avgMonthlyEnergy = energyByYear.reduce((a, e) => a + e.cost, 0) / years;

  // Mantenimiento de los km personales más los de Uber con su desgaste extra.
  const effectiveMaintenance =
    (personalMonthlyKm * maintCostPerKm + uberMonthlyKm * maintCostPerUberKm) * 12;
  const wearMultiplier =
    isUberMode && personalMonthlyKm + uberMonthlyKm > 0
      ? (personalMonthlyKm * maintCostPerKm + uberMonthlyKm * maintCostPerUberKm) /
        ((personalMonthlyKm + uberMonthlyKm) * maintCostPerKm)
      : 1;

  const monthlyFuel = avgMonthlyEnergy;
  const monthlyMaint = effectiveMaintenance / 12;
  const monthlyOpCosts =
    monthlyFuel +
    monthlyIns +
    monthlyRefrendo +
    monthlyMaint +
    monthlyData +
    monthlyCarWash +
    monthlyTips +
    monthlyMisc +
    monthlyAccess;
  const monthlyTotalOperative = monthlyOpCosts + monthlyPayment;

  return {
    uberMonthlyKm,
    monthlyKm,
    totalDailyKm,
    uberKm,
    energyByYear,
    yearOneEnergy,
    avgMonthlyEnergy,
    effectiveMaintenance,
    wearMultiplier,
    monthlyFuel,
    monthlyMaint,
    monthlyOpCosts,
    monthlyTotalOperative,
  };
}

/**
 * Whether the plan fits the available hours, a realistic trips-per-hour rate,
 * the EV's daily range and its charging time.
 */
function feasibilityStage(
  I,
  {
    isUberMode,
    totalDailyKm,
    yearOneEnergy,
    breakEvenTrips,
    netContributionPerTrip,
    fixedMonthlyCosts,
  },
) {
  // ¿Caben los km diarios en una carga útil de la batería? Si no, habría que
  // recargar a mitad de la jornada y el plan no se marca viable.
  const isEV = I.vehicleType === 'electric';
  const usableKwh = nonNegative(I.batteryCapacityKwh) * USABLE_BATTERY_FRACTION;
  const dailyRangeKm = isEV ? usableKwh * positive(I.kmPerKwh, 1) : Infinity;
  const evRangeShortfall = isEV && totalDailyKm > dailyRangeKm;

  // El tiempo de carga se descuenta de las horas disponibles para manejar.
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
  // Más de 4 viajes por hora no es realista en ciudad.
  const tripsPerHourWarn = tripsPerHour > 4;
  const chargingExceedsAvailableHours = chargingHoursPerDay > maxHoursPerDay;
  const feasible =
    !isUberMode ||
    (Number.isFinite(breakEvenTrips) &&
      // Sin horas o viajes disponibles no es viable (evita un capacityUsage = 0 engañoso).
      maxTripsMonth > 0 &&
      capacityUsage <= 1 &&
      netContributionPerTrip > 0 &&
      !tripsPerHourWarn &&
      !evRangeShortfall &&
      !chargingExceedsAvailableHours);
  const safetyMargin =
    isUberMode && netContributionPerTrip > 0 && Number.isFinite(breakEvenTrips)
      ? (maxTripsMonth - breakEvenTrips) * netContributionPerTrip
      : -fixedMonthlyCosts;

  return {
    isEV,
    usableKwh,
    dailyRangeKm,
    evRangeShortfall,
    chargingHoursPerDay,
    effectiveMaxHoursPerDay,
    maxTripsMonth,
    tripsPerDay,
    hoursPerDay,
    weeklyDays,
    hoursPerWeek,
    capacityUsage,
    tripsPerHourWarn,
    chargingExceedsAvailableHours,
    feasible,
    safetyMargin,
  };
}

/**
 * Year-by-year cash flow over the horizon: payments (including a balloon or
 * lease rent), inflated running costs, a repair reserve that grows with the
 * car's age, Uber revenue, cumulative spend per category and the liquidation
 * value per year; plus the project totals.
 */
function cashflowStage(I, ctx) {
  const {
    asOfYear,
    years,
    horizonMonths,
    carPrice,
    owned,
    isLease,
    isBalloon,
    months,
    amort,
    monthlyPayment,
    leaseMonthly,
    balloonAmount,
    insuranceAnnualForYear,
    monthlyRefrendo,
    monthlyData,
    monthlyCarWash,
    monthlyTips,
    monthlyMisc,
    monthlyAccess,
    upfrontCash,
    sellingCostPct,
    terminalRecovery,
    isUberMode,
    breakEvenTrips,
    netPerTrip,
    monthlyKm,
    energyByYear,
    monthlyMaint,
  } = ctx;

  // Inflación general de costos no energéticos (refrendo, mantenimiento, otros).
  const generalInflation = Math.max(-0.5, num(I.generalInflation));
  // Reserva de reparaciones que crece con la edad del auto (clave en usados). Dentro
  // de la garantía (año y ≤ warrantyYearsRemaining) las reparaciones mayores las cubre
  // el fabricante y la reserva de ese año es 0.
  const baseAgeYears = Math.max(0, asOfYear - num(I.carYear, asOfYear));
  const repairBase = nonNegative(I.repairReserveAnnual);
  const repairGrowth = nonNegative(I.repairGrowth != null ? I.repairGrowth : 0.15);
  const warrantyYearsRemaining = nonNegative(I.warrantyYearsRemaining);
  const repairReserveYear = (y) =>
    y <= warrantyYearsRemaining
      ? 0
      : repairBase * Math.pow(1 + repairGrowth, baseAgeYears + (y - 1));

  // Meses del año y cubiertos por el plazo del crédito o del arrendamiento.
  const monthsInYear = (y) => {
    const overlapEnd = Math.min(y * 12, months);
    return Math.max(0, overlapEnd - (y - 1) * 12);
  };
  const loanMonthsInYear = (y) => (months === 0 ? 0 : monthsInYear(y));
  const leaseMonthsInYear = (y) => (isLease ? monthsInYear(y) : 0);
  // Penalización anual del arrendamiento por km arriba del límite del contrato.
  const leaseKmCapYear = nonNegative(I.leaseKmCapYear);
  const leaseExcessKmFee = nonNegative(I.leaseExcessKmFee);
  const annualKm = monthlyKm * 12;
  const leaseKmPenaltyYear =
    isLease && leaseKmCapYear > 0 && annualKm > leaseKmCapYear
      ? (annualKm - leaseKmCapYear) * leaseExcessKmFee
      : 0;
  // Año en que vence el globo, si cae dentro del horizonte; ese año recibe el pago final.
  const balloonDueYear =
    isBalloon && balloonAmount > 0 && months > 0 && months <= horizonMonths
      ? Math.ceil(months / 12)
      : 0;
  // Valor neto de venta por peso de valor de mercado; 0 en arrendamiento (sin reventa).
  const saleNetFactor = owned ? nonNegative(I.salesFactor) * (1 - sellingCostPct) : 0;

  const cashflow = [];
  let cumRevenue = 0,
    cumCosts = 0,
    cCar = 0,
    cEnergy = 0,
    cInsRef = 0,
    cMaint = 0,
    cOther = 0,
    cTotal = 0;
  let totalRepairReserve = 0;
  for (let y = 1; y <= years; y++) {
    const infl = Math.pow(1 + generalInflation, y - 1);
    // El globo se suma como pago único en su año de vencimiento, no se prorratea.
    const yearPayment = isLease
      ? leaseMonthsInYear(y) * leaseMonthly
      : loanMonthsInYear(y) * monthlyPayment + (y === balloonDueYear ? balloonAmount : 0);
    const yearEnergy = (energyByYear[y - 1]?.cost || 0) * 12; // ya trae su propia inflación
    // El seguro fijo no se infla (en la práctica baja con el valor del auto); el
    // seguro como % del valor declina con la depreciación. El refrendo sí se infla.
    const yearInsRef = insuranceAnnualForYear(y) + monthlyRefrendo * 12 * infl;
    // En arrendamiento no apartas reserva para reparaciones mayores.
    const yearRepair = owned ? repairReserveYear(y) : 0;
    const yearMaint = monthlyMaint * 12 * infl + yearRepair + leaseKmPenaltyYear;
    const yearOther =
      (monthlyData + monthlyCarWash + monthlyTips + monthlyMisc + monthlyAccess) * 12 * infl;
    const yearUpfront = y === 1 ? upfrontCash : 0;
    totalRepairReserve += yearRepair;
    cCar += yearPayment + yearUpfront;
    cEnergy += yearEnergy;
    cInsRef += yearInsRef;
    cMaint += yearMaint;
    cOther += yearOther;
    cTotal = cCar + cEnergy + cInsRef + cMaint + cOther;
    const yearOperating = yearEnergy + yearInsRef + yearMaint + yearOther;
    const annualRevenue =
      isUberMode && Number.isFinite(breakEvenTrips) ? breakEvenTrips * netPerTrip * 12 : 0;
    const annualCosts = yearOperating + yearPayment + yearUpfront;
    cumRevenue += annualRevenue;
    cumCosts += annualCosts;
    const depValue = owned ? depreciatedValue(carPrice, I, y, asOfYear) : 0;
    const debtRemaining =
      isLease || y * 12 >= months || months === 0
        ? 0
        : amort.rows[y * 12 - 1]
          ? amort.rows[y * 12 - 1].balance
          : 0;
    cashflow.push({
      year: projectionYear(y, asOfYear),
      revenue: annualRevenue,
      costs: annualCosts,
      cumRevenue,
      cumCosts,
      depValue,
      debtRemaining,
      cCar: Math.round(cCar),
      cEnergy: Math.round(cEnergy),
      cInsRef: Math.round(cInsRef),
      cMaint: Math.round(cMaint),
      cOther: Math.round(cOther),
      cTotal: Math.round(cTotal),
      // Lo que dejaría vender ese año (venta neta − deuda viva), para que la
      // gráfica de comparación refleje el patrimonio y no sólo el flujo.
      liqValue: Math.round(depValue * saleNetFactor - debtRemaining),
    });
  }

  const totalSpentGross = cTotal;
  // El costo neto descuenta lo que REALMENTE recuperas (venta − deuda viva), no la venta completa.
  const totalProjectCost = totalSpentGross - terminalRecovery;
  const netProjectResult = cumRevenue + terminalRecovery - totalSpentGross;

  return {
    generalInflation,
    baseAgeYears,
    warrantyYearsRemaining,
    leaseKmPenaltyYear,
    cashflow,
    totalRepairReserve,
    cumRevenue,
    cumCosts,
    totalSpentGross,
    totalProjectCost,
    netProjectResult,
  };
}

/**
 * Engineering-economics metrics: NPV and IRR of the Uber project, the present
 * value and equivalent annual cost of ownership, TCO per year and per km, the
 * loan's CAT, and whether financing beats paying cash at the opportunity rate.
 */
function economicsStage(I, ctx) {
  const {
    years,
    horizonMonths,
    carPrice,
    owned,
    isLease,
    cashPaid,
    financed,
    interestRate,
    months,
    monthlyPayment,
    leaseMonthly,
    totalInterest,
    openingFee,
    tradeInValue,
    upfrontCash,
    grossSalePrice,
    terminalRecovery,
    monthlyKm,
    cashflow,
    totalProjectCost,
  } = ctx;

  // Tasa de oportunidad: lo que tu dinero rendiría en otro lado (p. ej. CETES). Con
  // ella se descuentan los flujos; no es la tasa del crédito.
  const discountAnnual = clamp(I.discountRate, 0, 1);
  // Flujos anuales del comprador (− sale, + entra): el desembolso inicial va en t0 y
  // el último año suma la recuperación terminal (venta neta − deuda).
  const annualNet = cashflow.map((c, idx) => c.revenue - (c.costs - (idx === 0 ? upfrontCash : 0)));
  if (annualNet.length) annualNet[annualNet.length - 1] += terminalRecovery;
  const projectCashflows = [-upfrontCash, ...annualNet];
  const npvProject = npv(discountAnnual, projectCashflows);
  const irrProject = irr(projectCashflows);
  // Valor presente del costo de propiedad, sin ingresos: compara autos y formas de
  // pago en la misma base.
  let pvLifetimeCost = upfrontCash;
  cashflow.forEach((c, i) => {
    pvLifetimeCost += (c.costs - (i === 0 ? upfrontCash : 0)) / Math.pow(1 + discountAnnual, i + 1);
  });
  pvLifetimeCost -= terminalRecovery / Math.pow(1 + discountAnnual, years);
  const eac = equivalentAnnualCost(pvLifetimeCost, discountAnnual, years);

  // TCO nominal (sin descontar) = costo neto del proyecto, total, por año y por km.
  const tcoTotal = totalProjectCost;
  const tcoPerYear = tcoTotal / years;
  const totalKmHorizon = monthlyKm * 12 * years;
  const costPerKm = totalKmHorizon > 0 ? tcoTotal / totalKmHorizon : NaN;
  // Depreciación como costo: precio − valor de mercado al final, antes de costos de
  // venta (vender es una transacción, no depreciación). Sin propiedad no aplica.
  const depreciationCost = owned ? carPrice - grossSalePrice : 0;
  const financingCost = isLease
    ? leaseMonthly * Math.min(months, horizonMonths) + cashPaid
    : totalInterest + openingFee;

  // Tasa efectiva anual y CAT (incluye la comisión de apertura).
  const ear = financed > 0 ? Math.pow(1 + interestRate / 12, 12) - 1 : 0;
  const catMonthly =
    financed > 0 ? solvePeriodicRate(financed - openingFee, monthlyPayment, months) : 0;
  const cat = financed > 0 ? Math.pow(1 + catMonthly, 12) - 1 : 0;

  // ¿Financiar o pagar de contado? Ambos caminos en valor presente a la tasa de
  // oportunidad, con la tasa mensual equivalente a la anual. Positivo = financiar conviene.
  const dM = Math.pow(1 + discountAnnual, 1 / 12) - 1;
  const pvPaymentsAtOpportunity =
    financed > 0
      ? dM === 0
        ? monthlyPayment * months
        : (monthlyPayment * (1 - Math.pow(1 + dM, -months))) / dM
      : 0;
  const pvFinancedPath = cashPaid + openingFee + pvPaymentsAtOpportunity;
  const pvCashPath = Math.max(0, carPrice - tradeInValue);
  const financeVsCashPV = pvCashPath - pvFinancedPath;
  // Lo que habría rendido el desembolso inicial invertido durante el horizonte.
  const opportunityCostUpfront = upfrontCash * (Math.pow(1 + discountAnnual, years) - 1);

  return {
    discountAnnual,
    npvProject,
    irrProject,
    pvLifetimeCost,
    eac,
    tcoTotal,
    tcoPerYear,
    totalKmHorizon,
    costPerKm,
    depreciationCost,
    financingCost,
    ear,
    cat,
    financeVsCashPV,
    pvFinancedPath,
    pvCashPath,
    opportunityCostUpfront,
  };
}

// Keys of the object calculate() returns, in order. Every tab, chart and the
// report read these; the characterization snapshots pin both values and order.
const RESULT_KEYS = [
  // Compra y financiamiento
  'carPrice',
  'cashPaid',
  'financed',
  'openingFee',
  'oneTimeUberCosts',
  'upfrontCash',
  'monthlyPayment',
  'totalInterest',
  'totalPaidNominal',
  'pvTotal',
  'fvTotal',
  'timeValueOfMoney',
  'months',
  'amortRows',
  // Economía por viaje y punto de equilibrio
  'grossPerTrip',
  'platformCommission',
  'taxAmountPerTrip',
  'afterUber',
  'netPerTrip',
  'netRevenuePerTrip',
  'variableCostPerTrip',
  'netContributionPerTrip',
  'kmPerTrip',
  'energyCostPerKm',
  'maintCostPerKm',
  'maintCostPerUberKm',
  'upfrontRecoveryMonthly',
  'projectRecoveryBase',
  'projectRecoveryMonthly',
  'operatingFixedMonthlyCosts',
  'fixedMonthlyCosts',
  'operatingBreakEvenTrips',
  // Costos mensuales
  'monthlyFuel',
  'monthlyIns',
  'monthlyRefrendo',
  'monthlyMaint',
  'monthlyData',
  'monthlyCarWash',
  'monthlyTips',
  'monthlyMisc',
  'monthlyAccess',
  'monthlyOpCosts',
  'monthlyTotalOperative',
  'monthlyFixedNonKm',
  // Intensidad de trabajo y viabilidad
  'breakEvenTrips',
  'tripsPerDay',
  'hoursPerDay',
  'weeklyDays',
  'hoursPerWeek',
  'maxTripsMonth',
  'capacityUsage',
  'feasible',
  'tripsPerHourWarn',
  'safetyMargin',
  'profitTarget',
  // Liquidación y resultado del proyecto
  'valueAtEnd',
  'actualSalePrice',
  'remainingDebt',
  'finalPosition',
  'liquidationPosition',
  'terminalRecovery',
  'netProjectResult',
  'cumRevenue',
  'cumCosts',
  'cashflow',
  // Kilometraje, energía y autonomía
  'monthlyKm',
  'uberKm',
  'uberMonthlyKm',
  'personalKm',
  'personalMonthlyKm',
  'totalDailyKm',
  'isUberMode',
  'chargingHoursPerDay',
  'effectiveMaxHoursPerDay',
  'isEV',
  'usableKwh',
  'dailyRangeKm',
  'evRangeShortfall',
  'chargingExceedsAvailableHours',
  'yearOneEnergy',
  'energyByYear',
  'wearMultiplier',
  'effectiveMaintenance',
  'avgMonthlyEnergy',
  'totalProjectCost',
  'totalSpentGross',
  // Ingeniería económica
  'tradeInValue',
  'acquisitionFees',
  'sellingCostPct',
  'grossSalePrice',
  'generalInflation',
  'totalRepairReserve',
  'baseAgeYears',
  'warrantyYearsRemaining',
  'discountAnnual',
  'npvProject',
  'irrProject',
  'pvLifetimeCost',
  'eac',
  'tcoTotal',
  'tcoPerYear',
  'totalKmHorizon',
  'costPerKm',
  'depreciationCost',
  'financingCost',
  'ear',
  'cat',
  'financeVsCashPV',
  'pvFinancedPath',
  'pvCashPath',
  'opportunityCostUpfront',
  // Régimen fiscal, tipo de financiamiento y modo de seguro aplicados
  'taxRegime',
  'taxRate',
  'resicoRate',
  'financeType',
  'owned',
  'isLease',
  'isBalloon',
  'balloonPct',
  'balloonAmount',
  'balloonPayment',
  'leaseMonthly',
  'leaseKmPenaltyYear',
  'insuranceMode',
  'insurancePctOfValue',
];

/**
 * Runs the full model for one scenario.
 *
 * @param {object} I Scenario inputs (see DEFAULT_INPUTS for every field).
 * @param {{ year?: number }} [options] `year` is the calendar year treated as
 *   "now" (projection year 1 and the reference for a used car's age); it
 *   defaults to the current year.
 * @returns {object} Every figure the UI shows, keyed as listed in RESULT_KEYS.
 */
export function calculate(I, { year: asOfYear = currentYear() } = {}) {
  const isUberMode = I.operationMode !== 'no-uber';
  const financing = financingStage(I);
  const costs = operatingCostStage(I, { ...financing, isUberMode, asOfYear });
  const liquidation = liquidationStage(I, { ...financing, asOfYear });
  const trips = breakEvenStage(I, { ...financing, ...costs, ...liquidation, isUberMode });
  const usage = usageStage(I, { ...financing, ...costs, ...trips, isUberMode });
  const capacity = feasibilityStage(I, { ...trips, ...usage, isUberMode });
  const projection = cashflowStage(I, {
    ...financing,
    ...costs,
    ...liquidation,
    ...trips,
    ...usage,
    isUberMode,
    asOfYear,
  });
  const economics = economicsStage(I, {
    ...financing,
    ...costs,
    ...liquidation,
    ...usage,
    ...projection,
  });

  const all = {
    isUberMode,
    ...financing,
    ...costs,
    ...liquidation,
    ...trips,
    ...usage,
    ...capacity,
    ...projection,
    ...economics,
  };
  return Object.fromEntries(RESULT_KEYS.map((key) => [key, all[key]]));
}
