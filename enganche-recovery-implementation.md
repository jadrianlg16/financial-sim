# Enganche Recovery And Valor De Rescate Implementation Plan

Last analyzed: 2026-06-02  
Related source: `uber_car_simulator.jsx`  
Status: planning only. No JSX implementation has been changed yet.

## 1. Short Answer

The current app partially implements "monthly payments to get back the enganche", but only as an optional break-even setting.

Current behavior:

- The sidebar has a checkbox: `Recuperar tambien el enganche y pagos iniciales?`
- That checkbox controls `includeUpfrontRecovery`.
- Default value is `false`.
- If enabled, the app calculates:

```text
upfrontRecoveryMonthly = upfrontCash / (horizonYears * 12)
```

Where:

```text
upfrontCash = cashPaid + openingFee + oneTimeUberCosts
```

Then the app adds that monthly recovery amount into the break-even equation:

```text
fixedMonthlyCosts =
  monthlyPayment
  + monthlyFixedNonKm
  + profitTarget
  + upfrontRecoveryMonthly
```

So yes: when the checkbox is enabled, the app makes Uber generate enough extra trips each month to recover the enganche/pagos iniciales over the project horizon.

But no: this recovery amount is not fully represented everywhere as its own clear line item. It is not included in `monthlyTotalOperative`, not shown as a separate monthly KPI, and not explained clearly enough in the report as "recovery of initial cash".

## 2. Does Valor De Rescate Mean I Get Back The Enganche?

Not exactly.

The `valor de rescate` is the expected sale value of the car after depreciation. In Activity 3, this is the depreciated market/book value of the car at the end of 2029.

The enganche is not a separate thing you automatically get back. The enganche is part of the original money used to buy the car. When you sell the car, you recover whatever the car is still worth after depreciation, minus any remaining loan balance.

Correct liquidation logic:

```text
valorRescate = depreciatedCarValue
remainingDebt = unpaidLoanBalanceAtSale
cashRecoveredAtSale = valorRescate - remainingDebt
```

If `cashRecoveredAtSale` is positive, that money can be interpreted as partial recovery of your original equity in the car. But it is not guaranteed to equal the enganche.

Example from Activity 3:

```text
valorRescate = $123,699.20
remainingDebt = $54,597.97
cashRecoveredAtSale = $69,101.23
```

In that case, selling the car would cover the remaining debt and leave $69,101.23. Since the original enganche was $30,200, the sale proceeds are enough to recover the enganche in a final-liquidation sense.

But this is different from monthly Uber recovery.

There are two separate ways to think about recovery:

1. Monthly recovery through Uber trips:
   Uber earns extra each month to pay back the enganche over time.

2. Final recovery through sale:
   At the end, the car is sold and the remaining value after debt is recovered.

The app should avoid double-counting these two. If Uber already recovered the enganche monthly, then the final sale is additional terminal recovery, not "the same enganche recovered again."

## 3. Current Implementation Audit

### Already implemented

The app already has these variables:

- `cashPaid`: the enganche, cash purchase amount, or mixed cash portion.
- `openingFee`: financing opening commission.
- `oneTimeUberCosts`: toxicology report plus Uber certification.
- `upfrontCash`: `cashPaid + openingFee + oneTimeUberCosts`.
- `includeUpfrontRecovery`: checkbox toggle.
- `upfrontRecoveryMonthly`: optional monthly recovery amount.
- `terminalRecovery`: `actualSalePrice - remainingDebt`.
- `totalProjectCost`: `totalSpentGross - terminalRecovery`.
- `netProjectResult`: `cumRevenue + terminalRecovery - totalSpentGross`.

### Partially implemented

`upfrontRecoveryMonthly` is included in the break-even trip calculation when `includeUpfrontRecovery` is enabled.

It appears in:

- Dashboard operation plan row, as `+ enganche`.
- Formulas tab, inside the break-even formula.

### Not fully implemented

The recovery amount is not yet treated as a first-class financial concept.

Missing or unclear:

- No dedicated KPI for monthly enganche recovery.
- No side-by-side comparison of break-even with and without enganche recovery.
- No separate row in the monthly cost chart.
- No clear report paragraph explaining monthly recovery versus final sale recovery.
- No view showing how much of the enganche has been recovered by Uber by the end of the horizon.
- No warning against double-counting sale value and monthly recovery as the same recovered money.
- No Activity 3-specific view showing `valor de rescate`, `remaining debt`, `cash recovered at sale`, and `initial cash recovered monthly`.

## 4. Proposed Financial Model

The full implementation should distinguish four concepts:

### A. Initial cash paid

Money paid at the beginning:

```text
downPayment = cashPaid
openingFee = financed * openingFeePct
oneTimeUberCosts = toxicologyReport + uberCertification
initialCashOutlay = downPayment + openingFee + oneTimeUberCosts
```

For the class case, the most important part is:

```text
downPayment = $30,200
```

### B. Monthly recovery target

The user can choose whether Uber must recover the initial cash during the horizon.

```text
monthlyInitialCashRecovery = recoveryBase / recoveryPeriodMonths
```

Where `recoveryBase` could be:

- Down payment only.
- Down payment plus opening fee.
- Down payment plus opening fee plus Uber setup fees.
- Custom amount.

Recommended default for the class problem:

```text
recoveryBase = downPayment
recoveryPeriodMonths = horizonYears * 12
```

For Activity 2/3 style 4-year horizon:

```text
monthlyDownPaymentRecovery = $30,200 / 48 = $629.17 per month
```

If recovering all initial cash:

```text
monthlyInitialCashRecovery = initialCashOutlay / 48
```

### C. Operating break-even

Break-even without recovering initial cash:

```text
baseMonthlyTarget =
  loanPayment
  + recurringOperatingCosts
  + profitTarget
```

Break-even with initial cash recovery:

```text
monthlyTargetWithRecovery =
  baseMonthlyTarget
  + monthlyInitialCashRecovery
```

Trips:

```text
breakEvenTripsWithoutRecovery =
  baseMonthlyTarget / netContributionPerTrip

breakEvenTripsWithRecovery =
  monthlyTargetWithRecovery / netContributionPerTrip
```

The app should show both values so the user understands the difference.

### D. Final liquidation / valor de rescate

Using Activity 3's intended declining-balance method:

```text
valorRescate = carPrice * (1 - depreciationRate) ^ years
```

Then:

```text
remainingDebtAtSale = loan balance at actual sale date
cashRecoveredAtSale = valorRescate - remainingDebtAtSale
```

For the class PDF:

```text
valorRescate = $302,000 * 0.80^4 = $123,699.20
remainingDebtAtSale = $54,597.97
cashRecoveredAtSale = $69,101.23
```

This final value should be shown separately from monthly recovery.

## 5. Proposed New Variables

Add to `DEFAULT_INPUTS` later:

```js
recoverInitialCash: false,
initialCashRecoveryScope: 'downPaymentOnly',
initialCashRecoveryCustomAmount: 0,
initialCashRecoveryMonthsMode: 'horizon',
initialCashRecoveryMonths: 48,
showRecoveryComparison: true,
depreciationMethod: 'decliningBalance',
saleTimingMode: 'horizonMonths',
paymentsMadeAtSale: 42,
```

Recommended meanings:

- `recoverInitialCash`: whether Uber should recover initial cash through monthly targets.
- `initialCashRecoveryScope`: what cash to recover.
  - `downPaymentOnly`
  - `downPaymentPlusOpeningFee`
  - `allInitialCash`
  - `custom`
- `initialCashRecoveryCustomAmount`: amount when scope is custom.
- `initialCashRecoveryMonthsMode`:
  - `horizon`: use `horizonYears * 12`
  - `loanTerm`: use `loanMonths`
  - `custom`: use `initialCashRecoveryMonths`
- `initialCashRecoveryMonths`: manual recovery period.
- `showRecoveryComparison`: show with/without recovery in result views.
- `depreciationMethod`: should support `linear` and `decliningBalance`.
- `saleTimingMode`: how the app decides remaining debt at sale.
- `paymentsMadeAtSale`: needed to reproduce Activity 3's 42-payment case.

## 6. Proposed Derived Results

Add these to the object returned by `calculate()` later:

```js
downPayment
initialCashOutlay
initialCashRecoveryBase
initialCashRecoveryMonths
monthlyInitialCashRecovery
baseMonthlyTarget
monthlyTargetWithRecovery
breakEvenTripsWithoutRecovery
breakEvenTripsWithRecovery
extraTripsForInitialCashRecovery
extraHoursPerWeekForInitialCashRecovery
totalInitialCashRecoveredByUber
unrecoveredInitialCashAtEnd
valorRescate
remainingDebtAtSale
cashRecoveredAtSale
finalSaleCoversDownPayment
doubleRecoveryNote
```

Suggested formulas:

```text
totalInitialCashRecoveredByUber =
  monthlyInitialCashRecovery * monthsWorked

unrecoveredInitialCashAtEnd =
  max(0, initialCashRecoveryBase - totalInitialCashRecoveredByUber)

extraTripsForInitialCashRecovery =
  monthlyInitialCashRecovery / netContributionPerTrip

extraHoursPerWeekForInitialCashRecovery =
  (extraTripsForInitialCashRecovery / workDaysPerMonth / tripsPerHour)
  * (workDaysPerMonth / 4.33)

finalSaleCoversDownPayment =
  cashRecoveredAtSale >= downPayment
```

## 7. Proposed View Changes

### Sidebar

In `Operacion Uber`, replace the current single checkbox with a clearer section:

```text
Recuperacion del enganche

[ ] Quiero que Uber recupere mi enganche durante el proyecto

Monto a recuperar:
( ) Solo enganche
( ) Enganche + comision de apertura
( ) Enganche + comision + tramites Uber
( ) Monto personalizado

Periodo para recuperarlo:
( ) Horizonte del proyecto
( ) Plazo del credito
( ) Personalizado
```

This should appear only in Uber modes.

### Dashboard KPIs

Add KPIs:

- `Recuperacion mensual del enganche`: e.g. `$629/mes`.
- `Viajes extra para recuperar enganche`: e.g. `9 viajes/mes`.
- `Equilibrio sin recuperar enganche`: base trips.
- `Equilibrio recuperando enganche`: higher trips.
- `Venta final despues de deuda`: valor de rescate minus debt.
- `Venta cubre enganche?`: yes/no.

### Dashboard operation plan

Add rows:

```text
Punto de equilibrio base
Recuperacion mensual del enganche
Viajes extra por recuperacion
Punto de equilibrio total
Horas extra por semana
```

### Cost chart

Do not mix enganche recovery into normal operating costs without labeling it.

Recommended label:

```text
Meta financiera: recuperar enganche
```

This is not a normal operating expense like fuel or insurance. It is a cash-recovery target.

### Activity 3 / Liquidation panel

Add a dedicated panel:

```text
Valor de rescate y recuperacion de enganche

Valor de rescate:
Saldo pendiente del credito:
Dinero recibido despues de liquidar deuda:
Enganche original:
Enganche recuperado via Uber:
Enganche pendiente de recuperar:
La venta final cubre el enganche pendiente?
```

This would directly answer the user's question.

### Formulas tab

Add formulas:

```text
Recuperacion mensual del enganche =
  monto a recuperar / meses de recuperacion

Punto de equilibrio con enganche =
  (costos mensuales + recuperacion mensual) / contribucion por viaje

Valor de rescate =
  valor inicial * (1 - depreciacion)^anos

Recuperacion final =
  valor de rescate - saldo pendiente
```

Also explicitly explain:

```text
La recuperacion mensual del enganche y el valor de rescate no son lo mismo.
La primera se obtiene trabajando Uber durante el proyecto.
La segunda se obtiene al vender el auto al final.
```

### Report tab

Add a paragraph like:

```text
Ademas del punto de equilibrio operativo, se evaluo si el proyecto recupera el
enganche inicial. El enganche fue de X. Si se reparte durante Y meses, el proyecto
debe generar Z adicionales por mes, equivalentes a N viajes extra mensuales.
Con esta recuperacion incluida, el punto de equilibrio total sube de A a B viajes
por mes.

Al final del proyecto, el valor de rescate del auto es C. Despues de pagar el
saldo pendiente del credito de D, quedarian E. Este dinero representa la
recuperacion final del capital invertido en el auto, pero no debe confundirse con
la recuperacion mensual del enganche para evitar doble conteo.
```

### Compare tab

Add columns:

- Recovery scope.
- Monthly recovery amount.
- Break-even with recovery.
- Final sale after debt.
- Sale covers down payment.

### Monte Carlo tab

Add Monte Carlo outputs:

- Probability that sale after debt covers remaining unrecovered initial cash.
- P10/P50/P90 final sale after debt.
- P10/P50/P90 net project result after monthly recovery target.

### Sensitivity tab

Include `initialCashRecoveryBase` and `initialCashRecoveryMonths` if recovery is enabled.

## 8. Recommended Implementation Order

1. Add depreciation method support first.
   - Activity 3 requires declining balance.
   - The current linear formula will not match the PDF.

2. Add the recovery variables.
   - Keep the existing checkbox behavior backward-compatible.
   - Expand it into the clearer controls described above.

3. Split break-even into two displayed values.
   - Without recovery.
   - With recovery.

4. Add a liquidation/Activity 3 panel.
   - Show valor de rescate, debt, sale-after-debt, and enganche recovery status.

5. Update Report and Formulas.
   - This is where the explanation matters most.

6. Add tests for the Activity 3 numbers.
   - $302,000 at 20% declining balance for 4 years = $123,699.20.
   - $123,699.20 - $54,597.97 = $69,101.23.
   - $30,200 / 48 = $629.17/month.

## 9. Acceptance Criteria

The implementation should be considered correct when the app can answer:

1. What was the enganche?
2. How much must Uber recover monthly to pay back that enganche?
3. How many extra trips/month does that require?
4. What is the break-even without recovering the enganche?
5. What is the break-even with recovering the enganche?
6. What is the car's valor de rescate at the end of 2029?
7. How much credit remains at the sale date?
8. After selling the car and paying debt, how much cash is left?
9. Does that final cash cover the original enganche?
10. Are monthly recovery and final sale recovery shown separately so they are not double-counted?

