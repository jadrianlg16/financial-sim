import { clamp } from './format.js';

export function pmt(principal, annualRate, months) {
  if (months <= 0) return 0;
  const r = annualRate / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}
export function buildAmortization(principal, annualRate, months) {
  if (principal <= 0 || months <= 0)
    return { payment: 0, rows: [], totalPaid: 0, totalInterest: 0 };
  const payment = pmt(principal, annualRate, months);
  const r = annualRate / 12;
  let bal = principal;
  const rows = [];
  let cumInt = 0,
    cumPrin = 0;
  for (let m = 1; m <= months; m++) {
    const interest = bal * r;
    const principalPart = payment - interest;
    bal = Math.max(0, bal - principalPart);
    cumInt += interest;
    cumPrin += principalPart;
    rows.push({
      month: m,
      payment,
      interest,
      principal: principalPart,
      balance: bal,
      cumInt,
      cumPrin,
    });
  }
  return {
    payment,
    rows,
    totalPaid: payment * months,
    totalInterest: payment * months - principal,
  };
}

// Amortization with a FINAL / BALLOON payment (residual): common in Mexico
// (credit with a residual value). The monthly payment amortizes only (principal −
// PV of the balloon), so the balance at the end of the term is EXACTLY
// balloonAmount, which is paid off in the last month. Monthly payments are lower
// than a pure annuity.
//   A = (P − balloon·(1+i)^−n) · i(1+i)^n / [(1+i)^n − 1]
export function buildBalloonAmortization(principal, annualRate, months, balloonAmount) {
  if (principal <= 0 || months <= 0)
    return { payment: 0, rows: [], totalPaid: 0, totalInterest: 0, balloon: 0 };
  const balloon = clamp(balloonAmount, 0, principal);
  const r = annualRate / 12;
  let payment;
  if (r === 0) {
    payment = (principal - balloon) / months;
  } else {
    const pvBalloon = balloon * Math.pow(1 + r, -months); // PV of the balloon at the loan's rate
    payment = ((principal - pvBalloon) * r) / (1 - Math.pow(1 + r, -months));
  }
  let bal = principal;
  const rows = [];
  let cumInt = 0,
    cumPrin = 0;
  for (let m = 1; m <= months; m++) {
    const interest = bal * r;
    let principalPart = payment - interest;
    // In the last month the balloon is paid off too (out of the balance, not the
    // regular monthly payment).
    const balloonThisMonth = m === months ? bal - principalPart : 0;
    principalPart += balloonThisMonth;
    bal = Math.max(0, bal - principalPart);
    cumInt += interest;
    cumPrin += principalPart;
    rows.push({
      month: m,
      payment: payment + balloonThisMonth,
      interest,
      principal: principalPart,
      balance: bal,
      cumInt,
      cumPrin,
      balloon: balloonThisMonth,
    });
  }
  // totalPaid = regular monthly payments + the final balloon; total interest =
  // everything paid − principal.
  const totalPaid = payment * months + balloon;
  return { payment, rows, totalPaid, totalInterest: totalPaid - principal, balloon };
}

// ============================================================================
// ENGINEERING ECONOMICS  ·  VPN, TIR, CAE and CAT
// ----------------------------------------------------------------------------
// These are the "real" equations for choosing between alternatives (Spanish
// acronyms, as the UI shows them):
//   - VPN (NPV, net present value): brings every flow to today with an
//     OPPORTUNITY RATE (what your money could earn elsewhere, e.g. CETES,
//     Mexican treasury bills), NOT the loan's rate.
//   - TIR (IRR, internal rate of return): the return that makes the NPV zero
//     (useful when there is income).
//   - CAE (EAC, equivalent annual cost): turns a cost in present value into a
//     uniform annual amount, to compare cars with different horizons.
//   - CAT (Costo Anual Total): the all-in annual rate of a loan, opening fee
//     included, that Mexican lenders must disclose.
// ============================================================================
export function npv(ratePerPeriod, cashflows) {
  return cashflows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + ratePerPeriod, t), 0);
}
// IRR by robust bisection: needs a sign change in the flows.
export function irr(cashflows, lo = -0.95, hi = 5) {
  const f = (r) => npv(r, cashflows);
  let flo = f(lo),
    fhi = f(hi);
  if (!isFinite(flo) || !isFinite(fhi) || flo * fhi > 0) return NaN;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2,
      fmid = f(mid);
    if (!isFinite(fmid)) return NaN;
    if (Math.abs(fmid) < 1e-7) return mid;
    if (flo * fmid < 0) {
      hi = mid;
      fhi = fmid;
    } else {
      lo = mid;
      flo = fmid;
    }
  }
  return (lo + hi) / 2;
}
// Periodic rate that solves: netReceived = payment · [1−(1+j)^−n]/j  (for CAT).
export function solvePeriodicRate(netReceived, payment, n) {
  if (netReceived <= 0 || payment <= 0 || n <= 0) return 0;
  const g = (j) =>
    (j === 0 ? payment * n : (payment * (1 - Math.pow(1 + j, -n))) / j) - netReceived;
  let lo = 1e-9,
    hi = 5;
  if (g(lo) * g(hi) > 0) return 0;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2,
      gm = g(mid);
    if (Math.abs(gm) < 1e-6) return mid;
    if (g(lo) * gm < 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}
// EAC: annualizes a cost expressed as a present value, over N years.
export function equivalentAnnualCost(pvCost, annualRate, years) {
  if (years <= 0) return pvCost;
  if (annualRate === 0) return pvCost / years;
  const annuityFactor = (1 - Math.pow(1 + annualRate, -years)) / annualRate;
  return pvCost / annuityFactor;
}
