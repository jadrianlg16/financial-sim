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
  // Finance type: 'annuity' = standard loan, 'balloon' = loan with a final
  // (residual) payment, 'lease' = lease (no ownership).
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
  // Tax regime of the Uber income: 'resico' (default, realistic) = platform
  // withholding of ~2.5% of gross income under RESICO, Mexico's simplified regime;
  // 'gross' = taxRate on the gross fare (simplified assumption); 'net' = taxRate on
  // the profit per trip.
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
  // Public vs. home charging (electric or plug-in hybrid only): 15% of the energy
  // is charged at public stations, which cost more than the home rate.
  publicChargeFraction: 0.15,
  publicChargePrice: 8.0,
  monthlyInsurance: 2000,
  annualMaintenance: 8000,
  monthlyRefrendo: 500,
  dataPlan: 400,
  // Insurance: 'fixed' = flat monthly amount; 'pctOfValue' = annual % of the car's
  // depreciated value (drops with depreciation, as in full coverage).
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
  // User's free-form notes (where prices, quotes and rates came from). They appear
  // in the report and are saved with the rest of the inputs.
  userNotes: '',
  // --- Engineering economics and decision variables ---
  vehicleCondition: 'new',
  odometerKm: 0,
  // Depreciation rate of a used car (slower, in %, than a new car's).
  usedDepreciationRate: 0.12,
  // Warranty years left: while it lasts, the maker covers major repairs and that
  // year's repair reserve is 0. New: 3; used: 0 (the sidebar sets them when the
  // condition or the preset changes).
  warrantyYearsRemaining: 3,
  depreciationMethod: 'declining',
  firstYearDepreciation: 0.25,
  discountRate: 0.105, // opportunity cost (≈ CETES, Mexican T-bills); rate for NPV/EAC
  generalInflation: 0.045, // annual inflation of non-energy costs
  repairReserveAnnual: 0, // repair reserve (higher for used cars)
  repairGrowth: 0.15,
  tradeInValue: 0, // trade-in
  acquisitionFees: 0, // plates/registration/ISAN (new-car tax)/inspection/transfer
  sellingCostPct: 0, // cost of selling at liquidation
  // Risk of total loss or theft, modeled only in the Monte Carlo.
  theftLossProbAnnual: 0.015, // annual probability of total loss
  theftDeductiblePct: 0.05, // full-coverage deductible (% of insured value)
};
