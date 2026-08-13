import { clamp } from './format.js';

export function pmt(principal, annualRate, months) {
  if (months <= 0) return 0;
  const r = annualRate / 12;
  if (r === 0) return principal / months;
  return principal * r / (1 - Math.pow(1 + r, -months));
}
export function buildAmortization(principal, annualRate, months) {
  if (principal <= 0 || months <= 0) return { payment:0, rows:[], totalPaid:0, totalInterest:0 };
  const payment = pmt(principal, annualRate, months);
  const r = annualRate / 12;
  let bal = principal; const rows = []; let cumInt = 0, cumPrin = 0;
  for (let m = 1; m <= months; m++) {
    const interest = bal * r; const principalPart = payment - interest;
    bal = Math.max(0, bal - principalPart); cumInt += interest; cumPrin += principalPart;
    rows.push({ month:m, payment, interest, principal:principalPart, balance:bal, cumInt, cumPrin });
  }
  return { payment, rows, totalPaid: payment*months, totalInterest: payment*months - principal };
}

// Amortización con PAGO FINAL / GLOBO (residual): común en México (crédito con
// valor residual). El pago mensual amortiza sólo (principal − VP del globo), de
// modo que el saldo al final del plazo queda EXACTAMENTE en balloonAmount, que
// se liquida en el último mes. Pagos mensuales más bajos que una anualidad pura.
//   A = (P − balloon·(1+i)^−n) · i(1+i)^n / [(1+i)^n − 1]
export function buildBalloonAmortization(principal, annualRate, months, balloonAmount) {
  if (principal <= 0 || months <= 0) return { payment:0, rows:[], totalPaid:0, totalInterest:0, balloon:0 };
  const balloon = clamp(balloonAmount, 0, principal);
  const r = annualRate / 12;
  let payment;
  if (r === 0) {
    payment = (principal - balloon) / months;
  } else {
    const pvBalloon = balloon * Math.pow(1 + r, -months);       // VP del globo a tasa del crédito
    payment = (principal - pvBalloon) * r / (1 - Math.pow(1 + r, -months));
  }
  let bal = principal; const rows = []; let cumInt = 0, cumPrin = 0;
  for (let m = 1; m <= months; m++) {
    const interest = bal * r;
    let principalPart = payment - interest;
    // En el último mes se liquida también el globo (sale del saldo, no del pago mensual regular).
    const balloonThisMonth = (m === months) ? bal - principalPart : 0;
    principalPart += balloonThisMonth;
    bal = Math.max(0, bal - principalPart); cumInt += interest; cumPrin += principalPart;
    rows.push({ month:m, payment: payment + balloonThisMonth, interest, principal:principalPart, balance:bal, cumInt, cumPrin, balloon: balloonThisMonth });
  }
  // totalPaid = mensualidades regulares + el globo final; interés total = todo lo pagado − principal.
  const totalPaid = payment * months + balloon;
  return { payment, rows, totalPaid, totalInterest: totalPaid - principal, balloon };
}

// ============================================================================
// INGENIERÍA ECONÓMICA  ·  VPN, TIR, CAE y CAT
// ----------------------------------------------------------------------------
// Estas son las ecuaciones "de verdad" para decidir entre alternativas:
//   - VPN (NPV): trae todos los flujos a hoy con una TASA DE OPORTUNIDAD (lo que
//     tu dinero podría ganar en otro lado, p.ej. CETES), NO la tasa del crédito.
//   - TIR (IRR): rendimiento que iguala el VPN a cero (sirve cuando hay ingresos).
//   - CAE (EAC): costo anual equivalente; convierte un costo en valor presente en
//     una renta anual uniforme, para comparar autos con horizontes distintos.
//   - CAT: tasa anual total real del crédito, incluyendo comisión de apertura.
// ============================================================================
export function npv(ratePerPeriod, cashflows) {
  return cashflows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + ratePerPeriod, t), 0);
}
// TIR por bisección robusta: requiere un cambio de signo en los flujos.
export function irr(cashflows, lo = -0.95, hi = 5) {
  const f = (r) => npv(r, cashflows);
  let flo = f(lo), fhi = f(hi);
  if (!isFinite(flo) || !isFinite(fhi) || flo * fhi > 0) return NaN;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2, fmid = f(mid);
    if (!isFinite(fmid)) return NaN;
    if (Math.abs(fmid) < 1e-7) return mid;
    if (flo * fmid < 0) { hi = mid; fhi = fmid; } else { lo = mid; flo = fmid; }
  }
  return (lo + hi) / 2;
}
// Tasa periódica que resuelve: netoRecibido = pago · [1−(1+j)^−n]/j  (para CAT).
export function solvePeriodicRate(netReceived, payment, n) {
  if (netReceived <= 0 || payment <= 0 || n <= 0) return 0;
  const g = (j) => (j === 0 ? payment * n : payment * (1 - Math.pow(1 + j, -n)) / j) - netReceived;
  let lo = 1e-9, hi = 5;
  if (g(lo) * g(hi) > 0) return 0;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2, gm = g(mid);
    if (Math.abs(gm) < 1e-6) return mid;
    if (g(lo) * gm < 0) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}
// CAE: anualiza un costo expresado como valor presente, sobre N años.
export function equivalentAnnualCost(pvCost, annualRate, years) {
  if (years <= 0) return pvCost;
  if (annualRate === 0) return pvCost / years;
  const annuityFactor = (1 - Math.pow(1 + annualRate, -years)) / annualRate;
  return pvCost / annuityFactor;
}

// FEATURE 1(a) — tasa de depreciación EFECTIVA según condición/edad del auto.
// Los usados deprecian MÁS LENTO en % (la curva se aplana con la edad): se usa
// usedDepreciationRate (default 0.12) en lugar de la tasa de auto nuevo, y se
// afina un poco con la antigüedad actual (2026 − carYear) restando 0.5 pts por
// cada año de edad. La tasa resultante queda acotada a [0.04, 0.30] para no
// degenerar. Los autos NUEVOS conservan exactamente su tasa de lista (sin cambio).
