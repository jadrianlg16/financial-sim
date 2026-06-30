# App Documentation: Auto-Pilot Uber Car Financial Simulator

Last analyzed: 2026-06-02  
Main source file: `uber_car_simulator.jsx`  
Context folder: `Context from class/`

## 1. Purpose

This project is a single-file React application for evaluating whether buying a car can be financially justified if the owner uses the car on Uber during free time. The core question is:

> Can the Uber income cover the car credit payment, insurance, fuel or energy, maintenance, platform-related costs, taxes, and eventual depreciation?

The app is built around a school economic-engineering problem. The assignment asks the student to act as a financial consultant and evaluate a vehicle over a planning horizon from 2026 to 2029, with a 30% tax assumption and 20% annual depreciation.

The current JSX implementation goes beyond the original class requirement. It includes:

- Car purchase modes: cash, credit, and mixed cash/credit.
- Operation modes: break-even Uber, target monthly profit, and no-Uber personal ownership.
- Gasoline, diesel, hybrid, and electric vehicle support.
- Amortization, VP, VF, interest, monthly costs, break-even trips, work intensity, depreciation, liquidation, and net project result.
- Saved scenario comparison.
- Sensitivity analysis.
- Monte Carlo simulation.
- AI/JSON import flow for researching new vehicle cases.
- Auto-generated narrative report.

## 2. Source Materials Reviewed

### Project files

- `uber_car_simulator.jsx`: the full app. It has 1,663 lines and exports one default React component named `App`.
- `Context from class/CONTEXT.md`: empty file, 0 bytes.
- `Context from class/SItuacion problema.md`: the assignment prompt and deliverable requirements.
- `Context from class/Actividad 1_ Definir los costos del proyecto (1).pdf`: submitted Activity 1 material.
- `Context from class/Actividad 2_ Punto de equilibrio, mensualidades y crédito.pdf`: submitted Activity 2 material.
- `Context from class/Actividad 3_ Depreciación y valor de rescate.pdf`: submitted Activity 3 material.

### Assignment context

The class problem describes a professional who wants to buy a new car for personal use but wants the asset to be self-sustaining by driving for Uber in free time. The student must determine if the strategy is viable under current Mexican automotive-market conditions.

The assignment asks for:

- A vehicle selection and cost classification.
- Financing structure, including present value, future value, interest, and monthly payment.
- Operating break-even point in trips per month.
- Required work schedule: trips per day, days per week, and hours per week.
- Depreciation and rescue value by 2029.
- Whether the car sale can cover remaining credit.
- A written report PDF with cover page, table of contents, introduction, activities, conclusion, references.
- A short video presentation.

### PDF baseline values

The three PDFs provide an existing baseline case. These values matter because the app should either reproduce them or clearly explain why its model gives different results.

Activity 1 baseline:

- Vehicle: KIA K3 SEDAN L MT, model year 2026.
- Cash price with IVA: $302,000.00 MXN.
- Quoted down payment: 10% = $30,200.00 MXN.
- Quoted annual insurance: $13,584.28 MXN, or $1,132.02 MXN monthly.
- Quoted monthly payment: $9,980.87 MXN with insurance included.
- Estimated monthly gasoline: $2,600.00 MXN.
- Estimated monthly preventive maintenance: $800.00 MXN.
- Uber commission assumption: 25%.
- Tax assumption: 30%.

Activity 2 baseline:

- Vehicle price: $302,000.00 MXN.
- Down payment: $30,200.00 MXN.
- Quoted financed amount: $326,137.10 MXN.
- Loan term: 48 months.
- Annual rate with IVA: 20.87%.
- Monthly rate: 1.7392%.
- Quoted monthly payment: $9,980.87 MXN.
- Total of 48 payments: $479,081.76 MXN.
- Total paid including down payment: $509,281.76 MXN.
- Difference against cash price: $207,281.76 MXN.
- Difference against quoted financed amount: $152,944.66 MXN.
- Average trip fare: $150.00 MXN.
- Uber commission: $37.50 MXN.
- Taxes: $45.00 MXN.
- Net per trip in PDF: $67.50 MXN.
- Conservative monthly cost base: $14,372.54 MXN.
- Conservative break-even: 213 trips per month.
- Work plan: 6 days/week, 2.25 hours/day, 4 trips/hour, 216 trips/month capacity.

Activity 3 baseline:

- Initial depreciation value: $302,000.00 MXN.
- Method: declining balance / saldo decreciente.
- Annual depreciation: 20%.
- Horizon: 2026, 2027, 2028, 2029 = 4 periods.
- Value at end of 2029: $123,699.20 MXN.
- Credit payment: $9,980.87 MXN.
- Credit term: 48 months.
- Credit balance after payment 42, dated 01-12-2029: $54,597.97 MXN.
- Remaining payments after 2029: 6.
- Net value using capital balance: $123,699.20 - $54,597.97 = $69,101.23 MXN.

## 3. What The App Currently Is

The app is an interactive financial simulator named `Auto-Pilot` in the UI. It is not a full repository-based app yet; it is a self-contained JSX artifact-style component.

It uses:

- React hooks: `useState`, `useMemo`, `useRef`.
- Recharts for charts.
- Lucide React for icons.
- Inline CSS injected by the `FontsAndTheme` component.
- Google Fonts loaded at runtime.

There is no visible `package.json`, build script, router, test file, or persistence layer in the current workspace. The JSX assumes it will be mounted inside a React host that already has `react`, `recharts`, and `lucide-react` available.

## 4. High-Level Architecture

The app has four main layers:

1. Static configuration
   - Car presets.
   - City presets.
   - Vehicle type labels.
   - Color palette for saved scenarios.
   - Tooltip/help text.
   - Default input values.

2. Calculation engine
   - Payment calculation.
   - Amortization schedule.
   - Energy/fuel calculation.
   - Operating cost calculation.
   - Uber contribution and break-even.
   - Work intensity and feasibility.
   - Depreciation and sale value.
   - Debt liquidation.
   - Project cashflow and net result.
   - Sensitivity and Monte Carlo models.

3. UI controls
   - Sidebar input groups.
   - Sliders plus manual numeric fields.
   - Segmented controls.
   - Dropdowns.
   - Checkboxes.
   - Tooltips.

4. Output pages
   - Dashboard.
   - Compare.
   - Sensitivity.
   - Monte Carlo.
   - Formulas.
   - Import / AI.
   - Report.

## 5. Global State

The `App` component keeps these top-level state values:

- `inputs`: the single source of truth for all financial, vehicle, operation, cost, and projection inputs.
- `saved`: an array of saved scenarios for comparison.
- `tab`: current visible page.
- `sources`: source metadata imported from an AI-generated JSON case.
- `colorIdx`: a ref used to assign colors to saved scenarios.

The result object `R` is recalculated with:

```js
const R = useMemo(() => calculate(inputs), [inputs]);
```

That means every sidebar change immediately recalculates the entire simulator.

## 6. Default Scenario

The default app scenario is not identical to the submitted class PDFs.

### Vehicle defaults

- `carPreset`: `kia_k3`
- `carPrice`: 279900
- `carYear`: 2026
- `vehicleType`: gasoline
- `kmpl`: 18.5
- `kmPerKwh`: 6.0
- `batteryCapacityKwh`: 50
- `chargerPowerKw`: 7
- `hybridElectricFraction`: 0.3

### Financing defaults

- `purchaseMode`: credit
- `downPaymentMode`: percent
- `downPaymentPct`: 0.20
- `downPaymentFixed`: 56000
- `cashAmount`: 100000
- `interestRate`: 0.135
- `loanMonths`: 48
- `openingFeePct`: 0.02

### Uber operation defaults

- `operationMode`: uber-breakeven
- `monthlyProfitTarget`: 5000
- `city`: Monterrey
- `avgFare`: 140
- `uberCommission`: 0.25
- `taxRate`: 0.30
- `tripsPerHour`: 3
- `maxHoursPerDay`: 8
- `workDaysPerMonth`: 22
- `personalKmDaily`: 20
- `uberKmPerTrip`: 8
- `uberWearFactor`: 0.30
- `includeUpfrontRecovery`: false

### Cost defaults

- `fuelPrice`: 24.5
- `dieselPrice`: 26.0
- `electricityPrice`: 4.2
- `fuelInflation`: 0.06
- `electricityInflation`: 0.04
- `monthlyInsurance`: 2000
- `annualMaintenance`: 8000
- `monthlyRefrendo`: 500
- `dataPlan`: 400
- `carWash`: 800
- `carWashTips`: 400
- `miscellaneous`: 2000
- `accessories`: 100
- `toxicologyReport`: 400
- `uberCertification`: 900

### Projection defaults

- `horizonYears`: 4
- `depreciationRate`: 0.20
- `salesFactor`: 1.0
- `monthlyIncome`: 0

## 7. Sidebar Input Model

The sidebar is the main control surface. It is split into collapsible groups.

### What do you want to analyze?

Controls `operationMode`:

- `uber-breakeven`: calculate the minimum Uber work needed for the car to pay for itself.
- `uber-target-profit`: calculate work needed to cover costs plus a target monthly profit.
- `no-uber`: calculate ownership cost without Uber revenue.

If target-profit mode is selected, the app exposes `monthlyProfitTarget`.

### Vehicle

Controls:

- Car preset.
- Vehicle type: gasoline, diesel, hybrid, electric.
- Car price.
- Model year.
- Fuel efficiency.
- Electric efficiency.
- Battery capacity.
- Charger power.
- Hybrid electric-use fraction.

The default presets include KIA K3, Nissan Versa, Chevrolet Aveo, Hyundai Grand i10, Toyota Yaris, Suzuki Swift, Toyota Corolla Hybrid, MG ZS EV, and custom.

### Payment method

Controls:

- Purchase mode: cash, credit, mixed.
- Down payment as percentage or fixed amount.
- Cash amount for mixed mode.
- Annual interest rate.
- Credit term in months.
- Opening commission.

### Uber operation

Only shown when operation mode is not `no-uber`.

Controls:

- City preset.
- Editable city name.
- Average fare per trip.
- Uber commission.
- Tax rate.
- Trips per hour.
- Maximum hours available per day.
- Work days per month.
- Km per trip including pickup/deadhead distance.
- Whether the break-even should also recover initial cash outlay.

The app warns when `tripsPerHour` is greater than 4, because the class problem assumes no more than 4 trips per hour.

### One-time Uber setup payments

Only shown in Uber modes.

Controls:

- Toxicology report cost.
- Initial Uber certification cost.

These are treated as one-time upfront costs.

### Personal use and wear

Controls:

- Personal km per day.
- Extra wear factor for Uber operation.

The app separates personal kilometers from Uber kilometers so fuel and maintenance are tied to actual expected use.

### Recurring costs

Controls:

- Fuel, diesel, or electricity price.
- Fuel inflation.
- Electricity inflation for electric/hybrid.
- Monthly insurance.
- Annual maintenance.
- Monthly refrendo/tenencia.
- Mobile data.
- Car wash.
- Tips.
- Miscellaneous/imprevistos.
- Accessories/gadgets.

### Projection and sale

Controls:

- Analysis horizon in years.
- Annual depreciation rate.
- Real sale factor.

Important: the UI currently describes depreciation as linear over original price.

### Personal income

Optional. If `monthlyIncome` is greater than 0, the dashboard and report show how much of the user's income is consumed by the car.

## 8. Page/Tabs

### Dashboard

The Dashboard is the main result page. It shows:

- A verdict: viable, viable but heavy, inviable, or no-Uber cost-only.
- EV range/charging warning if needed.
- Optional income-impact block.
- KPI grid:
  - Upfront cash.
  - Monthly payment.
  - Nominal credit cost / VF.
  - Present value / VP.
  - Cost of money.
  - Monthly total cost.
  - Break-even trips.
  - Ending value.
  - Net project cost.
  - Liquidation result.
  - Net project result.
  - Charging time for electric/hybrid vehicles.
- Amortization chart or cash-purchase explanation.
- Monthly cost structure chart.
- Accumulated project cost by category.
- Accounting classification table.
- Car value vs debt chart.
- Suggested Uber operation plan.

### Compare

The Compare tab uses scenarios saved from the sidebar. Each saved scenario stores:

- Name.
- Full input snapshot.
- Full result snapshot.
- Assigned chart color.

It compares saved scenarios plus the current unsaved scenario. It shows:

- Scenario chips with remove controls.
- Accumulated utility line chart.
- Comparison table with monthly cost, break-even trips, hours/week, net project cost, and net result.

Saved scenarios are only held in React state. They are lost on browser refresh.

### Sensitivity

The Sensitivity tab runs deterministic +/- changes against selected variables to show which assumptions move the result most.

In Uber modes, the measured output is break-even trips.

In no-Uber mode, the measured output is net project cost.

It dynamically includes relevant variables based on vehicle type and mode. The model includes variables such as:

- Car price.
- Average fare.
- Taxes.
- Uber commission.
- Fuel price.
- Interest rate.
- Insurance.
- Maintenance.
- Miscellaneous costs.
- Car wash.
- Refrendo.
- Km per trip.
- Depreciation.
- Electric cost and electric efficiency for electric/hybrid vehicles.
- Fuel efficiency for fuel vehicles.

### Monte Carlo

The Monte Carlo tab repeats the calculation many times with random variations. The user can choose 1,000, 3,000, or 10,000 iterations.

Randomized variables include:

- Fare per trip, around +/- 12%.
- Fuel/electricity price, around +/- 8%.
- Uber commission, around +/- 2 percentage points.
- Maintenance, around +/- 25%.
- Insurance, around +/- 15%.
- Depreciation, around +/- 4 percentage points.
- Trips per hour, with a cap near 4.

Outputs include:

- Probability of success.
- P10/P50/P90 break-even trips.
- P10/P50/P90 liquidation result.
- P10/P50/P90 net project result.
- Histogram of monthly break-even trips.

### Formulas

The Formulas tab displays formulas with the current values substituted.

It covers:

- Credit monthly payment.
- Present value.
- Nominal future value / total cash paid.
- Cost of money.
- Depreciation.
- Net contribution per trip.
- Break-even.
- Work intensity.
- Fuel inflation.
- Net project cost and net project result.
- EV/hybrid charging time.

Important: the formulas tab correctly reflects the current code's linear depreciation model, even though some comments elsewhere mention declining balance.

### Import / AI

The Import / AI tab helps the user research another vehicle.

The flow is:

1. Enter a vehicle name.
2. Generate a strict JSON research prompt.
3. Paste the AI's JSON response.
4. Import the values into the current scenario.
5. Store and display sources for the imported data.

The JSON schema includes:

- `vehicle`
- `costs`
- `oneTime`
- `projection`
- `sources`

The app asks the AI to provide one source per data point. The app displays those sources, but it does not independently verify URLs, source quality, or freshness.

### Report

The Report tab generates a narrative report from current values. It includes:

- Top summary.
- Vehicle and city.
- Narrative conclusion.
- Cost breakdown over the horizon.
- Summary table.
- Liquidation scenarios.
- Source table if AI-imported sources exist.
- Button to download a `.txt` report.

The report is useful for drafting the school report, but it is not a complete PDF deliverable because it does not generate:

- Cover page with team members.
- Table of contents.
- Full formatted PDF export.
- Reference/bibliography management.
- Video presentation.

## 9. Calculation Engine

The main calculation function is `calculate(I)`. It receives the full `inputs` object and returns a large result object used by all pages.

### Purchase and financing

The app supports three purchase modes:

```text
cash:
  cashPaid = carPrice
  financed = 0

hybrid:
  cashPaid = min(cashAmount, carPrice)
  financed = carPrice - cashPaid

credit:
  cashPaid = downPaymentPct * carPrice
  or min(downPaymentFixed, carPrice)
  financed = carPrice - cashPaid
```

If `financed > 0`, it calculates credit payment with the standard annuity payment formula:

```text
r = annualRate / 12
payment = principal * r / (1 - (1 + r)^(-months))
```

It then builds an amortization table month by month:

- Interest for the month.
- Principal payment for the month.
- Remaining balance.
- Cumulative interest.
- Cumulative principal.

The code also calculates:

- `openingFee = financed * openingFeePct`
- `pvTotal = pvOfPayments + cashPaid + openingFee`
- `fvTotal = totalPaidNominal + cashPaid + openingFee`
- `timeValueOfMoney = fvTotal - pvTotal`

Important distinction: in the code, `fvTotal` is effectively the nominal total paid, not the compounded future-value equivalent used in the Activity 2 PDF.

### Energy/fuel cost

Energy cost is calculated by `calculateEnergyCost(I, monthlyKm, yearOffset)`.

For gasoline:

```text
monthly cost = monthlyKm / kmpl * inflated fuel price
```

For diesel:

```text
monthly cost = monthlyKm / kmpl * inflated diesel price
```

For electric:

```text
kWhMonth = monthlyKm / kmPerKwh
cost = kWhMonth * inflated electricity price
chargingTimePerDay = (kWhMonth / 30) / chargerPowerKw
```

For hybrid:

```text
electricKm = monthlyKm * hybridElectricFraction
gasKm = monthlyKm * (1 - hybridElectricFraction)
electricCost = (electricKm / kmPerKwh) * electricity price
gasCost = (gasKm / kmpl) * fuel price
total = electricCost + gasCost
```

Fuel and electricity prices are inflated by year.

### Maintenance and wear

The app turns annual maintenance into a per-km cost with an assumed base of 20,000 km/year:

```text
maintCostPerKm = annualMaintenance / 20000
maintCostPerUberKm = maintCostPerKm * (1 + uberWearFactor)
```

Personal kilometers use the base maintenance rate. Uber kilometers use the higher Uber-wear rate.

### Fixed monthly costs

The app separates costs that are fixed relative to Uber trip count:

- Insurance.
- Refrendo/tenencia.
- Data plan.
- Car wash.
- Tips.
- Miscellaneous.
- Accessories.
- Personal-use fuel/energy.
- Personal-use maintenance.
- Credit monthly payment.

In no-Uber mode:

- Data plan becomes 0.
- Accessories become 0.
- Tips become 0.
- Car wash is reduced to 40% of the entered value.

### One-time Uber costs

If Uber mode is active:

```text
oneTimeUberCosts = toxicologyReport + uberCertification
upfrontCash = cashPaid + openingFee + oneTimeUberCosts
```

If `includeUpfrontRecovery` is true, the app spreads upfront cash across the whole horizon and adds it to the monthly break-even target:

```text
upfrontRecoveryMonthly = upfrontCash / (horizonYears * 12)
```

### Uber trip revenue

For each trip:

```text
grossPerTrip = avgFare
afterUber = grossPerTrip * (1 - uberCommission)
netRevenuePerTrip = afterUber * (1 - taxRate)
variableCostPerTrip = (energyCostPerKm + maintCostPerUberKm) * kmPerTrip
netContributionPerTrip = netRevenuePerTrip - variableCostPerTrip
```

This is more detailed than the PDF because it subtracts fuel/energy and maintenance per trip before calculating break-even.

Important distinction: the PDFs calculate tax as 30% of gross fare. The code calculates tax after the Uber commission. On a $150 trip with 25% Uber commission and 30% tax:

- PDF net before variable trip cost: $150 - $37.50 - $45.00 = $67.50.
- Code net before variable trip cost: $150 * 0.75 * 0.70 = $78.75.

This difference materially changes the break-even result.

### Break-even

In Uber modes:

```text
fixedMonthlyCosts =
  monthlyPayment
  + monthlyFixedNonKm
  + profitTarget
  + upfrontRecoveryMonthly

breakEvenTrips = fixedMonthlyCosts / netContributionPerTrip
```

If `netContributionPerTrip <= 0`, break-even is set to 0, but feasibility will fail because contribution is not positive.

### Work intensity

The app converts break-even trips into work requirements:

```text
tripsPerDay = breakEvenTrips / workDaysPerMonth
hoursPerDay = tripsPerDay / tripsPerHour
weeklyDays = workDaysPerMonth / 4.33
hoursPerWeek = weeklyDays * hoursPerDay
```

It calculates capacity:

```text
effectiveMaxHoursPerDay = maxHoursPerDay - chargingHoursPerDay
maxTripsMonth = tripsPerHour * effectiveMaxHoursPerDay * workDaysPerMonth
capacityUsage = breakEvenTrips / maxTripsMonth
```

The plan is feasible when:

- Capacity usage is <= 1.
- Net contribution per trip is positive.
- Trips per hour is not above 4.

### Electric vehicle feasibility

For electric vehicles:

```text
usableKwh = batteryCapacityKwh * 0.9
dailyRangeKm = usableKwh * kmPerKwh
evRangeShortfall = totalDailyKm > dailyRangeKm
```

If the daily km exceed one usable charge, the Dashboard shows a warning.

### Depreciation

This is one of the most important findings.

The actual code uses linear depreciation over original price:

```text
valueAtYearN = price * max(0, 1 - depreciationRate * years)
```

With price $302,000, rate 20%, and 4 years:

```text
$302,000 * (1 - 0.20 * 4) = $60,400
```

But Activity 3 uses declining-balance depreciation:

```text
valueAtYearN = price * (1 - depreciationRate)^years
```

With price $302,000, rate 20%, and 4 years:

```text
$302,000 * 0.8^4 = $123,699.20
```

The app currently does not match the Activity 3 PDF on depreciation.

### Liquidation and project result

The app calculates:

```text
actualSalePrice = depreciatedValue * salesFactor
remainingDebt = amortization balance at horizon end
terminalRecovery = actualSalePrice - remainingDebt
totalProjectCost = totalSpentGross - terminalRecovery
netProjectResult = cumulativeUberRevenue + terminalRecovery - totalSpentGross
```

This is a good conceptual model because it only treats sale value as recoverable after subtracting remaining debt.

### Cashflow

For each projected year, the app stores:

- Year.
- Annual Uber revenue.
- Annual costs.
- Cumulative revenue.
- Cumulative costs.
- Depreciated vehicle value.
- Remaining debt.
- Cumulative car/credit spending.
- Cumulative fuel/energy spending.
- Cumulative insurance/refrendo spending.
- Cumulative maintenance spending.
- Cumulative other spending.
- Liquidation value for comparison charts.

## 10. Mapping To Class Deliverables

### Activity 1: Define project costs

Covered by the app:

- Vehicle selection.
- Vehicle price.
- Fixed/variable and direct/indirect classification.
- Insurance.
- Refrendo/tenencia.
- Fuel/energy.
- Maintenance.
- Uber commission.
- Taxes.
- Mobile data.
- Car wash.
- Accessories.
- One-time Uber setup payments.

Where this appears:

- Sidebar inputs.
- Dashboard cost classification table.
- Dashboard cost structure chart.
- Report summary table.

### Activity 2B: Financing, VP, VF

Covered by the app:

- Down payment.
- Financed amount.
- Monthly payment by annuity formula.
- Amortization table.
- Total interest.
- Present value.
- Nominal total paid.
- Cost of money.

Main limitation:

- The app does not currently support entering a real quoted financed amount or real quoted monthly payment independent of the formula.
- The app's `fvTotal` is nominal total paid, while the PDF's future value equivalent compounds cashflows to a terminal value.

### Activity 2C: Break-even and work intensity

Covered by the app:

- Average trip fare.
- Uber commission.
- Taxes.
- Net revenue per trip.
- Variable cost per trip.
- Monthly fixed costs.
- Break-even trips/month.
- Trips/day.
- Hours/day.
- Days/week.
- Hours/week.
- Capacity check against max trips/hour and available hours.

Main limitation:

- The app taxes after the Uber commission, while the PDF taxes the gross fare.
- The app calculates fuel and maintenance from km/trip instead of using a fixed $2,600/month gasoline estimate.

### Activity 3: Depreciation and rescue value

Partially covered by the app:

- Ending value.
- Expected sale value.
- Remaining debt.
- Sale minus debt.
- Liquidation scenarios.

Main limitation:

- The app uses linear depreciation, while the PDF and assignment activity use declining balance / saldo decreciente.
- The app assumes a 4-year horizon means 48 months of loan payments, so a 48-month credit is fully paid at the end of year 4. The PDF assumes only 42 payments have been made by 01-12-2029, leaving 6 payments into 2030.

### Written report

Partially covered by the app:

- Narrative conclusion.
- Tables.
- Cost breakdown.
- Liquidation scenarios.
- Source table for imported data.

Not covered:

- PDF generation.
- Cover page.
- Table of contents.
- Full references section.
- Team member section.
- Video deliverable.

## 11. Important Mismatches Against The Submitted PDFs

These are not necessarily bugs if the app is meant to be a generalized simulator, but they matter if the goal is to reproduce the existing class numbers.

| Topic | PDF baseline | Current JSX behavior | Impact |
|---|---:|---:|---|
| Vehicle price | $302,000 | Default KIA K3 is $279,900 | Defaults do not match submitted case. |
| Down payment | 10% | Default is 20% | Monthly payment and financed amount differ. |
| Financed amount | $326,137.10 quoted | Code uses `carPrice - downPayment` | Real quote cannot be represented exactly. |
| Monthly payment | $9,980.87 quoted | Code computes payment from principal/rate/term | Existing quote cannot be reproduced exactly without overrides. |
| Interest rate | 20.87% with IVA | Default is 13.5% | Credit results differ. |
| Insurance | $1,132.02/month, included in quote | Default $2,000/month, separate | Possible double counting if the user also models quoted payment. |
| Gasoline | $2,600/month fixed estimate | Km-based fuel model | More dynamic, but not the same as PDF. |
| Maintenance | $800/month fixed estimate | Annual maintenance converted to per-km cost | More dynamic, but not the same as PDF. |
| Tax basis | 30% of gross fare | 30% after Uber commission | Code gives higher net trip revenue. |
| Net trip revenue on $150 fare | $67.50 | $78.75 before variable trip cost | Break-even trips are lower in code. |
| Depreciation | Declining balance: $123,699.20 after 4 years on $302,000 | Linear: $60,400 after 4 years on $302,000 | Major mismatch for Activity 3. |
| Credit remaining in 2029 | $54,597.97 after 42 payments | 0 after 48 months if horizon is 4 years and loan is 48 months | App assumes full 4-year loan completion. |
| Future value | PDF uses compounded future value equivalent | Code uses nominal total paid | VP/VF section may not match teacher expectations. |

## 12. Recommended Corrections If The App Must Match The Class Case

### 1. Add a depreciation method

Add either:

- A method toggle: `linear` vs `decliningBalance`.
- Or change the formula to declining balance if the class case is the only target.

Required formula for PDF alignment:

```text
valueAtEnd = carPrice * (1 - depreciationRate) ^ horizonYears
```

### 2. Add real quote financing mode

The Activity 2 PDF uses a quoted financed amount and quoted monthly payment that do not equal the simple `price - downPayment` model.

Add optional fields such as:

- `useQuotedLoan`
- `quotedFinancedAmount`
- `quotedMonthlyPayment`
- `quotedInsuranceIncluded`
- `loanStartMonth`
- `paymentsMadeByTerminalDate`

This would allow the app to reproduce:

- $326,137.10 quoted financed amount.
- $9,980.87 quoted monthly payment.
- 42 payments made by 01-12-2029.
- 6 remaining payments into 2030.

### 3. Add tax-basis setting

The app should support:

- Tax on gross fare: `fare - Uber commission - tax on gross`.
- Tax after Uber commission: `fare * (1 - commission) * (1 - tax)`.

The PDF uses tax on gross fare.

### 4. Add fixed monthly fuel/maintenance override

The app's km-based model is more flexible, but the PDF uses fixed monthly estimates:

- Gasoline: $2,600/month.
- Maintenance: $800/month.

To match the PDF while keeping the dynamic model, add toggles:

- `fuelCostMode`: `kmBased` or `fixedMonthly`.
- `maintenanceMode`: `kmBased` or `fixedMonthly`.

### 5. Add a class-case preset

Add a preset named something like:

```text
KIA K3 Sedan L MT 2026 - Class PDF Case
```

It should set:

- Price: $302,000.
- Down payment: 10%.
- Rate: 20.87%.
- Quoted payment: $9,980.87, if quote override is added.
- Insurance handling: included or separate, clearly marked.
- Average fare: $150.
- Uber commission: 25%.
- Tax: 30% on gross.
- Gasoline: $2,600/month.
- Maintenance: $800/month.
- Refrendo: $291.67/month.
- Data: $300/month.
- Cleaning: $400/month.
- Depreciation: 20% declining balance.

### 6. Complete final report export

If this app is expected to generate the final school deliverable, add:

- PDF export.
- Cover page fields.
- Team member fields.
- Table of contents.
- References section.
- Source list from both class PDFs and user-imported data.

## 13. Technical Notes And Risks

### Single-file implementation

The app is currently implemented as one large JSX file. That is acceptable for a prototype or artifact, but it will become difficult to maintain as more matching rules and report export features are added.

Suggested split:

- `constants.js`
- `financialMath.js`
- `calculate.js`
- `monteCarlo.js`
- `components/Sidebar.jsx`
- `components/Dashboard.jsx`
- `components/Report.jsx`
- `components/Formulas.jsx`
- `components/ImportCase.jsx`

### Potential lint issues

Static review found likely unused items:

- `useEffect` is imported but not used.
- `SENS_KEYS_LEGACY` is defined but unused.
- `dailyKm` is in `DEFAULT_INPUTS` but no longer drives the calculation.
- `baseMaintPerKmYear` is assigned inside `calculate()` but not used.

Depending on lint configuration, these may become warnings or errors.

### Manual fields allow out-of-range values

The `Field` component intentionally allows manual input outside slider ranges. This is useful, but it means the calculation engine can receive risky values, such as:

- Zero or negative `horizonYears`.
- Zero or negative `kmpl`.
- Zero or negative `chargerPowerKw`.
- Negative costs.
- Extreme interest rates.

The UI marks slider out-of-range values visually, but the engine does not fully validate all dangerous inputs.

### Tooltip HTML

The `Info` component uses `dangerouslySetInnerHTML`. Today the tooltip strings are hardcoded, so this is mostly controlled. If user-generated tooltip content is ever allowed, it must be sanitized.

### Clipboard behavior

The Import / AI tab uses `navigator.clipboard.writeText()`. That can fail on insecure origins, blocked permissions, or older browsers.

### No persistence

Saved comparison scenarios and imported sources live in React state only. Refreshing the page loses them.

### No tests

There are no unit tests for the financial formulas. Given the class/PDF mismatch risk, the calculation engine should have tests for:

- PMT/amortization.
- Tax basis.
- Break-even.
- Depreciation methods.
- Remaining debt by terminal date.
- Liquidation result.
- PDF baseline reproduction.

## 14. Best Current Interpretation

The current JSX is best understood as a generalized, interactive simulator inspired by the class problem, not as an exact reproduction of the submitted Activity 1-3 PDF calculations.

It is strong in:

- Interactive exploration.
- Scenario comparison.
- Explaining formulas.
- Showing cost structure visually.
- Modeling km-based fuel and maintenance.
- Supporting EV/hybrid cases.
- Producing a draft narrative report.

It currently needs adjustment if the main goal is to match the class PDFs exactly, especially for:

- Declining-balance depreciation.
- Real quoted loan amount/payment.
- Gross-fare tax basis.
- Specific 2029 credit balance timing.
- Fixed gasoline and maintenance estimates.
- Full PDF report deliverable formatting.
