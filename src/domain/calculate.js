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
import { clampInput } from './inputSchema.js';
import { currentYear, projectionYear } from './year.js';

// ============================================================================
// CALCULATION ENGINE
// ----------------------------------------------------------------------------
// calculate() turns an inputs object into the full result every tab reads. It
// runs in named stages; each one receives only what it needs from the earlier
// ones:
//   1. financingStage     down payment, amount financed, loan/balloon/lease, PV/FV
//   2. operatingCostStage per-km costs (energy, maintenance), monthly fixed costs, day-one cash
//   3. liquidationStage   sale value at the horizon minus the remaining debt
//   4. breakEvenStage     net contribution per trip and trips/month to cover the plan
//   5. usageStage         km, energy and maintenance those trips imply
//   6. feasibilityStage   hours, trips/hour, the EV's range and charging
//   7. cashflowStage      year-by-year flow with inflation, repairs and totals
//   8. economicsStage     VPN (NPV), TIR (IRR), CAE (EAC), TCO, CAT and finance vs. cash
// VPN, TIR and CAE are the Spanish names of NPV, IRR and EAC; CAT (Costo Anual
// Total) is the all-in annual cost of a loan that Mexican lenders must disclose.
// ============================================================================

// Assumed annual km used to spread the base maintenance cost per km.
const ASSUMED_BASE_KM_YEAR = 20000;
// Reference km used to average the energy cost per km over the horizon.
const REF_KM = 1000;
// Usable share of the battery (a margin so it never runs 0–100%).
const USABLE_BATTERY_FRACTION = 0.9;

/** Horizon, purchase split, loan or lease terms and the credit's present/future value. */
function financingStage(inputs) {
  const carPrice = nonNegative(inputs.carPrice);
  // Horizon and terms are clamped to INPUT_LIMITS: they size the loops below.
  const years = clampInput('horizonYears', Math.round(positive(inputs.horizonYears, 1)));
  const horizonMonths = years * 12;
  // Trade-in (auto a cuenta): works as an extra down payment, reducing the amount financed.
  const tradeInValue = Math.min(nonNegative(inputs.tradeInValue), carPrice);
  // Balloon and lease only exist for a credit purchase; with cash or a mix, the
  // amount financed (if any) is always an annuity.
  const financeType =
    inputs.purchaseMode === 'credit' ? inputs.financeType || 'annuity' : 'annuity';
  const isLease = financeType === 'lease';
  const isBalloon = financeType === 'balloon';
  // A lease is NOT ownership: there is no asset to finance or resell.
  const owned = !isLease;

  let cashPaid, financed;
  if (isLease) {
    // The day-one cash is the lease's upfront payment (not recoverable); the trade-in
    // does not apply.
    cashPaid = nonNegative(inputs.leaseDownPayment);
    financed = 0;
  } else if (inputs.purchaseMode === 'cash') {
    cashPaid = Math.max(0, carPrice - tradeInValue);
    financed = 0;
  } else if (inputs.purchaseMode === 'hybrid') {
    cashPaid = Math.min(nonNegative(inputs.cashAmount), carPrice - tradeInValue);
    financed = Math.max(0, carPrice - tradeInValue - cashPaid);
  } else {
    cashPaid =
      inputs.downPaymentMode === 'percent'
        ? carPrice * clamp(inputs.downPaymentPct, 0, 1)
        : Math.min(nonNegative(inputs.downPaymentFixed), carPrice);
    financed = Math.max(0, carPrice - cashPaid - tradeInValue);
  }

  const interestRate = Math.max(-0.95, num(inputs.interestRate));
  // Term: for a lease, the contract's; for credit, the loan's.
  const months = isLease
    ? clampInput('leaseTermMonths', Math.round(positive(inputs.leaseTermMonths, 1)))
    : financed > 0
      ? clampInput('loanMonths', Math.round(positive(inputs.loanMonths, 1)))
      : 0;
  // Balloon: share of the amount financed that is not amortized and is paid at the end.
  const balloonPct = isBalloon ? clamp(inputs.balloonPct, 0, 0.9) : 0;
  const balloonAmount = isBalloon ? financed * balloonPct : 0;
  const amort =
    isBalloon && financed > 0
      ? buildBalloonAmortization(financed, interestRate, months, balloonAmount)
      : buildAmortization(financed, interestRate, months);
  const balloonPayment = amort.balloon || 0;

  // Monthly payment shown: the rent for a lease; otherwise the loan's payment.
  const leaseMonthly = nonNegative(inputs.leaseMonthly);
  const monthlyPayment = isLease ? leaseMonthly : amort.payment;
  const totalInterest = amort.totalInterest;
  const openingFee = financed * nonNegative(inputs.openingFeePct);

  const r = interestRate / 12;
  // PV of the payments at the loan's own rate; the balloon enters as a single flow at the end.
  const pvOfPayments =
    financed > 0
      ? (r === 0 ? amort.payment * months : (amort.payment * (1 - Math.pow(1 + r, -months))) / r) +
        (isBalloon ? balloonAmount * Math.pow(1 + r, -months) : 0)
      : 0;
  // For a lease, PV and FV are based on the rents within the horizon plus the upfront payment.
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
function operatingCostStage(
  inputs,
  { carPrice, years, cashPaid, openingFee, isUberMode, asOfYear },
) {
  const personalKm = nonNegative(inputs.personalKmDaily);
  // Km driven per trip, including the empty legs to pick up the passenger.
  const kmPerTrip = positive(inputs.uberKmPerTrip, 1);
  const personalMonthlyKm = personalKm * 30;

  // Energy per km averaged over the horizon to include fuel/electricity inflation;
  // it is computed with a reference mileage.
  let refEnergyOverHorizon = 0;
  for (let y = 0; y < years; y++)
    refEnergyOverHorizon += calculateEnergyCost(inputs, REF_KM, y).cost;
  const energyCostPerKm = refEnergyOverHorizon / years / REF_KM;

  // The base maintenance is spread per km; each Uber km also costs the extra wear factor.
  const maintCostPerKm = nonNegative(inputs.annualMaintenance) / ASSUMED_BASE_KM_YEAR;
  const maintCostPerUberKm = maintCostPerKm * (1 + nonNegative(inputs.uberWearFactor));

  // Insurance: a fixed amount, or an annual % of the depreciated value at the start
  // of each year (it drops as the car depreciates). insuranceAnnualForYear(y) gives
  // the premium for year y = 1..N; year 1 is the monthly value the KPIs and the
  // break-even use.
  const insuranceMode = inputs.insuranceMode === 'pctOfValue' ? 'pctOfValue' : 'fixed';
  const insurancePctOfValue = clamp(inputs.insurancePctOfValue, 0, 0.3);
  const insuranceAnnualForYear = (y) => {
    if (insuranceMode !== 'pctOfValue') return nonNegative(inputs.monthlyInsurance) * 12;
    return insurancePctOfValue * depreciatedValue(carPrice, inputs, y - 1, asOfYear);
  };
  const monthlyIns = insuranceAnnualForYear(1) / 12;
  const monthlyRefrendo = nonNegative(inputs.monthlyRefrendo);
  // Data plan, tips and accessories only exist when driving for Uber; washing for
  // personal use is estimated at 40% of a platform car's.
  const monthlyData = isUberMode ? nonNegative(inputs.dataPlan) : 0;
  const monthlyCarWash = isUberMode
    ? nonNegative(inputs.carWash)
    : nonNegative(inputs.carWash) * 0.4;
  const monthlyTips = isUberMode ? nonNegative(inputs.carWashTips) : 0;
  const monthlyMisc = nonNegative(inputs.miscellaneous);
  const monthlyAccess = isUberMode ? nonNegative(inputs.accessories) : 0;

  // Energy and maintenance for the personal km do not depend on the trips.
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
    ? nonNegative(inputs.toxicologyReport) + nonNegative(inputs.uberCertification)
    : 0;
  // One-time purchase costs: plates/registration, ISAN (new-car tax), inspection, title transfer.
  const acquisitionFees = nonNegative(inputs.acquisitionFees);
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
  inputs,
  { carPrice, years, horizonMonths, months, owned, isLease, amort, asOfYear },
) {
  // Without ownership (lease) there is no resale value to recover.
  const valueAtEnd = owned ? depreciatedValue(carPrice, inputs, years, asOfYear) : 0;
  const grossSalePrice = owned ? valueAtEnd * nonNegative(inputs.salesFactor) : 0;
  // Cost of selling at liquidation (dealer commission, title transfer).
  const sellingCostPct = clamp(inputs.sellingCostPct, 0, 0.5);
  const actualSalePrice = owned ? grossSalePrice * (1 - sellingCostPct) : 0;
  const monthAtEnd = Math.min(horizonMonths, months);
  // Debt still owed at the horizon. In a balloon loan the row's balance already
  // includes the residual: if the horizon reaches the term it is paid off (balance
  // 0); otherwise it remains.
  const remainingDebt =
    isLease || horizonMonths >= months || months === 0
      ? 0
      : amort.rows[monthAtEnd - 1]
        ? amort.rows[monthAtEnd - 1].balance
        : 0;
  // What you actually recover at the end: net sale minus remaining debt.
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
  inputs,
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
  const grossPerTrip = nonNegative(inputs.avgFare);
  const uberCommissionRate = clamp(inputs.uberCommission, 0, 1);
  const taxRate = clamp(inputs.taxRate, 0, 1);
  const platformCommission = grossPerTrip * uberCommissionRate;
  const variableCostPerTrip = (energyCostPerKm + maintCostPerUberKm) * kmPerTrip;

  // Tax per trip by regime:
  //   'resico' (default) platform withholding under RESICO, Mexico's simplified
  //                      regime: resicoRate × gross fare.
  //   'gross'  taxRate × gross fare (simplified assumption; overstates the tax).
  //   'net'    taxRate × trip profit (fare − commission − variable cost), never negative.
  const taxRegime = inputs.taxRegime || 'resico';
  const resicoRate = clamp(inputs.resicoRate, 0, 0.2);
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

  // For the whole project to pay for itself, Uber must generate over the horizon
  // the part of the day-one cash that the final sale (minus debt) does not cover.
  const projectRecoveryBase = isUberMode ? Math.max(0, upfrontCash - terminalRecovery) : 0;
  const projectRecoveryMonthly = projectRecoveryBase / horizonMonths;

  const profitTarget =
    inputs.operationMode === 'uber-target-profit' ? nonNegative(inputs.monthlyProfitTarget) : 0;
  const operatingFixedMonthlyCosts = monthlyPayment + monthlyFixedNonKm;
  const fixedMonthlyCosts = operatingFixedMonthlyCosts + profitTarget + projectRecoveryMonthly;
  const operatingBreakEvenTrips =
    isUberMode && netContributionPerTrip > 0
      ? operatingFixedMonthlyCosts / netContributionPerTrip
      : 0;
  // If every trip loses money, no number of trips covers the costs.
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
  inputs,
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

  // Monthly energy for those km, year by year with its inflation.
  const energyByYear = [];
  for (let y = 0; y < years; y++) energyByYear.push(calculateEnergyCost(inputs, monthlyKm, y));
  const yearOneEnergy = energyByYear[0] || { cost: 0, chargingTimePerDay: 0 };
  const avgMonthlyEnergy = energyByYear.reduce((a, e) => a + e.cost, 0) / years;

  // Maintenance of the personal km plus the Uber km with their extra wear.
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
  inputs,
  {
    isUberMode,
    totalDailyKm,
    yearOneEnergy,
    breakEvenTrips,
    netContributionPerTrip,
    fixedMonthlyCosts,
  },
) {
  // Do the daily km fit in one usable battery charge? If not, the driver would have
  // to recharge mid-shift and the plan is not marked viable.
  const isEV = inputs.vehicleType === 'electric';
  const usableKwh = nonNegative(inputs.batteryCapacityKwh) * USABLE_BATTERY_FRACTION;
  const dailyRangeKm = isEV ? usableKwh * positive(inputs.kmPerKwh, 1) : Infinity;
  const evRangeShortfall = isEV && totalDailyKm > dailyRangeKm;

  // Charging time is taken out of the hours available for driving.
  const chargingHoursPerDay = yearOneEnergy.chargingTimePerDay || 0;
  const maxHoursPerDay = nonNegative(inputs.maxHoursPerDay);
  const effectiveMaxHoursPerDay = Math.max(0, maxHoursPerDay - chargingHoursPerDay);
  const tripsPerHour = positive(inputs.tripsPerHour, 1);
  const workDaysPerMonth = positive(inputs.workDaysPerMonth, 1);
  const maxTripsMonth = tripsPerHour * effectiveMaxHoursPerDay * workDaysPerMonth;

  const tripsPerDay = isUberMode ? breakEvenTrips / workDaysPerMonth : 0;
  const hoursPerDay = isUberMode ? tripsPerDay / tripsPerHour : 0;
  const weeklyDays = workDaysPerMonth / 4.33;
  const hoursPerWeek = weeklyDays * hoursPerDay;

  const capacityUsage = isUberMode && maxTripsMonth > 0 ? breakEvenTrips / maxTripsMonth : 0;
  // More than 4 trips per hour is not realistic in a city.
  const tripsPerHourWarn = tripsPerHour > 4;
  const chargingExceedsAvailableHours = chargingHoursPerDay > maxHoursPerDay;
  const feasible =
    !isUberMode ||
    (Number.isFinite(breakEvenTrips) &&
      // With no hours or trips available it is not viable (avoids a misleading capacityUsage = 0).
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
function cashflowStage(inputs, ctx) {
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

  // General inflation of non-energy costs (refrendo, the annual registration fee;
  // maintenance; other).
  const generalInflation = Math.max(-0.5, num(inputs.generalInflation));
  // Repair reserve that grows with the car's age (key for used cars). Within the
  // warranty (year y ≤ warrantyYearsRemaining) the maker covers major repairs and
  // that year's reserve is 0.
  const baseAgeYears = Math.max(0, asOfYear - num(inputs.carYear, asOfYear));
  const repairBase = nonNegative(inputs.repairReserveAnnual);
  const repairGrowth = nonNegative(inputs.repairGrowth != null ? inputs.repairGrowth : 0.15);
  const warrantyYearsRemaining = nonNegative(inputs.warrantyYearsRemaining);
  const repairReserveYear = (y) =>
    y <= warrantyYearsRemaining
      ? 0
      : repairBase * Math.pow(1 + repairGrowth, baseAgeYears + (y - 1));

  // Months of year y covered by the loan or lease term.
  const monthsInYear = (y) => {
    const overlapEnd = Math.min(y * 12, months);
    return Math.max(0, overlapEnd - (y - 1) * 12);
  };
  const loanMonthsInYear = (y) => (months === 0 ? 0 : monthsInYear(y));
  const leaseMonthsInYear = (y) => (isLease ? monthsInYear(y) : 0);
  // Annual lease penalty for km above the contract's limit.
  const leaseKmCapYear = nonNegative(inputs.leaseKmCapYear);
  const leaseExcessKmFee = nonNegative(inputs.leaseExcessKmFee);
  const annualKm = monthlyKm * 12;
  const leaseKmPenaltyYear =
    isLease && leaseKmCapYear > 0 && annualKm > leaseKmCapYear
      ? (annualKm - leaseKmCapYear) * leaseExcessKmFee
      : 0;
  // Year the balloon falls due, if within the horizon; that year gets the final payment.
  const balloonDueYear =
    isBalloon && balloonAmount > 0 && months > 0 && months <= horizonMonths
      ? Math.ceil(months / 12)
      : 0;
  // Net sale value per peso of market value; 0 for a lease (no resale).
  const saleNetFactor = owned ? nonNegative(inputs.salesFactor) * (1 - sellingCostPct) : 0;

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
    // The balloon is added as a single payment in the year it falls due, not prorated.
    const yearPayment = isLease
      ? leaseMonthsInYear(y) * leaseMonthly
      : loanMonthsInYear(y) * monthlyPayment + (y === balloonDueYear ? balloonAmount : 0);
    const yearEnergy = (energyByYear[y - 1]?.cost || 0) * 12; // already carries its own inflation
    // Fixed insurance is not inflated (in practice it drops with the car value);
    // insurance as % of value declines with depreciation. The refrendo is inflated.
    const yearInsRef = insuranceAnnualForYear(y) + monthlyRefrendo * 12 * infl;
    // A lease sets no reserve aside for major repairs.
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
    const depValue = owned ? depreciatedValue(carPrice, inputs, y, asOfYear) : 0;
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
      // What selling that year would leave (net sale − remaining debt), so the
      // comparison chart reflects equity and not just cash flow.
      liqValue: Math.round(depValue * saleNetFactor - debtRemaining),
    });
  }

  const totalSpentGross = cTotal;
  // The net cost subtracts what you ACTUALLY recover (sale − remaining debt), not the full sale.
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
function economicsStage(inputs, ctx) {
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

  // Opportunity rate: what your money would earn elsewhere (e.g. CETES, Mexican
  // treasury bills). The flows are discounted with it; it is not the loan's rate.
  const discountAnnual = clamp(inputs.discountRate, 0, 1);
  // Buyer's annual flows (− out, + in): the day-one cash goes at t0 and the last
  // year adds the terminal recovery (net sale − debt).
  const annualNet = cashflow.map((c, idx) => c.revenue - (c.costs - (idx === 0 ? upfrontCash : 0)));
  if (annualNet.length) annualNet[annualNet.length - 1] += terminalRecovery;
  const projectCashflows = [-upfrontCash, ...annualNet];
  const npvProject = npv(discountAnnual, projectCashflows);
  const irrProject = irr(projectCashflows);
  // Present value of the cost of ownership, without income: compares cars and
  // payment methods on the same basis.
  let pvLifetimeCost = upfrontCash;
  cashflow.forEach((c, i) => {
    pvLifetimeCost += (c.costs - (i === 0 ? upfrontCash : 0)) / Math.pow(1 + discountAnnual, i + 1);
  });
  pvLifetimeCost -= terminalRecovery / Math.pow(1 + discountAnnual, years);
  const eac = equivalentAnnualCost(pvLifetimeCost, discountAnnual, years);

  // Nominal TCO (undiscounted) = net project cost, in total, per year and per km.
  const tcoTotal = totalProjectCost;
  const tcoPerYear = tcoTotal / years;
  const totalKmHorizon = monthlyKm * 12 * years;
  const costPerKm = totalKmHorizon > 0 ? tcoTotal / totalKmHorizon : NaN;
  // Depreciation as a cost: price − market value at the end, before selling costs
  // (selling is a transaction, not depreciation). Not applicable without ownership.
  const depreciationCost = owned ? carPrice - grossSalePrice : 0;
  const financingCost = isLease
    ? leaseMonthly * Math.min(months, horizonMonths) + cashPaid
    : totalInterest + openingFee;

  // Effective annual rate and CAT (includes the opening fee).
  const ear = financed > 0 ? Math.pow(1 + interestRate / 12, 12) - 1 : 0;
  const catMonthly =
    financed > 0 ? solvePeriodicRate(financed - openingFee, monthlyPayment, months) : 0;
  const cat = financed > 0 ? Math.pow(1 + catMonthly, 12) - 1 : 0;

  // Finance or pay cash? Both paths in present value at the opportunity rate, with
  // the monthly rate equivalent to the annual one. Positive = financing wins.
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
  // What the day-one cash would have earned invested over the horizon.
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
  // Purchase and financing
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
  // Per-trip economics and break-even
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
  // Monthly costs
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
  // Work intensity and feasibility
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
  // Liquidation and project result
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
  // Mileage, energy and range
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
  // Engineering economics
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
  // Tax regime, finance type and insurance mode applied
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
 * @param {object} inputs Scenario inputs (see DEFAULT_INPUTS for every field).
 * @param {{ year?: number }} [options] `year` is the calendar year treated as
 *   "now" (projection year 1 and the reference for a used car's age); it
 *   defaults to the current year.
 * @returns {object} Every figure the UI shows, keyed as listed in RESULT_KEYS.
 */
export function calculate(inputs, { year: asOfYear = currentYear() } = {}) {
  const isUberMode = inputs.operationMode !== 'no-uber';
  const financing = financingStage(inputs);
  const costs = operatingCostStage(inputs, { ...financing, isUberMode, asOfYear });
  const liquidation = liquidationStage(inputs, { ...financing, asOfYear });
  const trips = breakEvenStage(inputs, { ...financing, ...costs, ...liquidation, isUberMode });
  const usage = usageStage(inputs, { ...financing, ...costs, ...trips, isUberMode });
  const capacity = feasibilityStage(inputs, { ...trips, ...usage, isUberMode });
  const projection = cashflowStage(inputs, {
    ...financing,
    ...costs,
    ...liquidation,
    ...trips,
    ...usage,
    isUberMode,
    asOfYear,
  });
  const economics = economicsStage(inputs, {
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
