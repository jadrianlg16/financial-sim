// Text the report builds from the model result: labels, the recommendation, the
// cost breakdown, the narrative appendix and the downloadable Markdown. Plain
// functions with no React, so the Report components only lay them out.
import { fmtFixed, fmtMXN, fmtN, fmtPct } from '../../domain/format.js';

/** Human-readable finance type, tax regime and insurance mode. */
export function reportLabels(R) {
  const financeLabel = R.isLease
    ? 'Arrendamiento (renta)'
    : R.isBalloon
      ? 'Crédito con pago final (globo)'
      : R.financed > 0
        ? 'Crédito tradicional'
        : 'Contado';
  const taxRegimeLabel =
    R.taxRegime === 'gross'
      ? `Bruto/simple (${fmtPct(R.taxRate, 0)} de la tarifa)`
      : R.taxRegime === 'net'
        ? `Sobre utilidad (${fmtPct(R.taxRate, 0)})`
        : `RESICO (retención ${fmtPct(R.resicoRate, 1)})`;
  const insuranceModeLabel =
    R.insuranceMode === 'pctOfValue'
      ? `% del valor (${fmtPct(R.insurancePctOfValue, 1)}/año · baja al depreciarse)`
      : 'Monto fijo mensual';
  return { financeLabel, taxRegimeLabel, insuranceModeLabel };
}

/**
 * Advisor-style verdict: a level (ok / warn / bad), a title and the reasons.
 * With Uber income it judges feasibility; without it, the cost of ownership and,
 * when the monthly income is known, affordability.
 */
export function buildRecommendation(R, inputs, incomePct) {
  if (R.isUberMode) {
    if (R.tripsPerHourWarn)
      return {
        level: 'bad',
        title: 'Replantea los supuestos de Uber',
        reasons: ['Asumes más de 4 viajes/hora, que no es realista. Ajusta antes de decidir.'],
      };
    if (R.netContributionPerTrip <= 0)
      return {
        level: 'bad',
        title: 'Cada viaje pierde dinero',
        reasons: [
          'Con la tarifa y los costos actuales, manejar para Uber no cubre ni el costo variable por viaje.',
        ],
      };
    if (!R.feasible)
      return {
        level: 'bad',
        title: 'Inviable con la capacidad disponible',
        reasons: [
          `El equilibrio exige ${fmtN(R.breakEvenTrips)} viajes/mes y ` +
            `el máximo posible es ${fmtN(R.maxTripsMonth)}.`,
        ],
      };
    const irrText = isFinite(R.irrProject) ? ` · TIR ${fmtPct(R.irrProject, 1)}` : '';
    const reasons = [
      `El proyecto se paga solo trabajando ${fmtFixed(R.hoursPerWeek)} hrs/semana ` +
        `(${fmtFixed(R.hoursPerDay)} hrs/día).`,
      `Resultado neto a ${inputs.horizonYears} años: ${fmtMXN(R.netProjectResult)} · ` +
        `VPN ${fmtMXN(R.npvProject)} (tasa ${fmtPct(R.discountAnnual, 1)})${irrText}.`,
    ];
    if (R.hoursPerDay > 5) return { level: 'warn', title: 'Viable, pero exigente', reasons };
    return { level: 'ok', title: 'Estrategia viable', reasons };
  }
  const reasons = [
    `Costo total de propiedad: ${fmtMXN(R.tcoTotal)} ` +
      `(${fmtMXN(R.tcoPerYear)}/año · CAE ${fmtMXN(R.eac)}/año).`,
  ];
  if (isFinite(R.costPerKm)) reasons.push(`Equivale a ${fmtMXN(R.costPerKm, 2)} por kilómetro.`);
  if (R.financed > 0)
    reasons.push(
      `Conviene ${R.financeVsCashPV >= 0 ? 'financiar' : 'pagar de contado'} ` +
        `(Δ en valor presente ${fmtMXN(R.financeVsCashPV)}); CAT real ${fmtPct(R.cat, 1)}.`,
    );
  if (incomePct != null) {
    if (incomePct > 0.35)
      return {
        level: 'bad',
        title: 'Pesa demasiado en tu ingreso',
        reasons: [
          `El auto se llevaría ${fmtPct(incomePct, 0)} de tu ingreso (arriba de 35% es riesgo alto).`,
          ...reasons,
        ],
      };
    if (incomePct > 0.2)
      return {
        level: 'warn',
        title: 'Comprable, pero ajustado',
        reasons: [
          `El auto se llevaría ${fmtPct(incomePct, 0)} de tu ingreso (la regla sana es ≤20%).`,
          ...reasons,
        ],
      };
    return {
      level: 'ok',
      title: 'Compra dentro de tus posibilidades',
      reasons: [
        `El auto representa ${fmtPct(incomePct, 0)} de tu ingreso, dentro de lo sano.`,
        ...reasons,
      ],
    };
  }
  return {
    level: 'warn',
    title: 'Decisión informada',
    reasons: [
      ...reasons,
      'Agrega tu ingreso mensual (panel lateral) para una recomendación de asequibilidad.',
    ],
  };
}

/**
 * Spend over the whole horizon by category, taken from the last year's
 * cumulative totals (so inflation and the repair reserve are included).
 */
export function horizonBreakdown(R, energyName) {
  const last = R.cashflow[R.cashflow.length - 1] || {};
  return [
    { name: 'Auto: crédito/efectivo + desembolso inicial', total: last.cCar || 0 },
    { name: energyName, total: last.cEnergy || 0 },
    { name: 'Seguro + refrendo/tenencia', total: last.cInsRef || 0 },
    { name: 'Mantenimiento + reparaciones', total: last.cMaint || 0 },
    { name: 'Otros (datos, lavado, propinas, misc, accesorios)', total: last.cOther || 0 },
  ].filter((b) => b.total > 0);
}

/** Rows of the "at a glance" table. */
export function glanceRows(
  R,
  inputs,
  { financeLabel, taxRegimeLabel, insuranceModeLabel },
  yearEnd,
) {
  return [
    { k: 'Precio del vehículo', v: fmtMXN(inputs.carPrice) },
    { k: 'Tipo de financiamiento', v: financeLabel },
    R.isLease && { k: 'Renta mensual', v: `${fmtMXN(R.monthlyPayment)}/mes` },
    R.isBalloon && { k: `Pago final (globo) en mes ${R.months}`, v: fmtMXN(R.balloonPayment) },
    { k: 'Desembolso inicial (día 1)', v: fmtMXN(R.upfrontCash) },
    { k: 'Costo mensual de tenerlo', v: fmtMXN(R.monthlyTotalOperative) },
    { k: 'Costo total de propiedad (TCO)', v: fmtMXN(R.tcoTotal), strong: true },
    { k: 'TCO por año', v: fmtMXN(R.tcoPerYear) },
    { k: 'Costo anual equivalente (CAE)', v: `${fmtMXN(R.eac)}/año`, strong: true },
    { k: 'Costo por kilómetro', v: isFinite(R.costPerKm) ? fmtMXN(R.costPerKm, 2) : '—' },
    { k: 'Valor presente del costo', v: fmtMXN(R.pvLifetimeCost) },
    {
      k: 'Costo por depreciación',
      v: R.isLease ? 'No aplica (no eres dueño)' : fmtMXN(R.depreciationCost),
    },
    {
      k: `Reventa esperada en ${yearEnd}`,
      v: R.isLease ? 'Sin reventa (arrendamiento)' : fmtMXN(R.actualSalePrice),
    },
    R.isUberMode && { k: 'Régimen fiscal del ingreso', v: taxRegimeLabel },
    { k: 'Modo de seguro', v: insuranceModeLabel },
  ].filter(Boolean);
}

/**
 * The whole analysis as running prose, one paragraph per element: purchase and
 * credit, monthly costs, Uber operation, and the result at the end of the horizon.
 */
export function buildNarrative(R, inputs, { car, city, vehicleLabel, yearEnd }) {
  const financed = R.financed > 0;
  const purchaseDesc =
    inputs.purchaseMode === 'cash'
      ? `pagado en efectivo en su totalidad (${fmtMXN(inputs.carPrice)})`
      : inputs.purchaseMode === 'hybrid'
        ? `pagando ${fmtMXN(R.cashPaid)} en efectivo y financiando los restantes ${fmtMXN(R.financed)}`
        : `con un enganche de ${fmtMXN(R.cashPaid)} (${fmtPct(R.cashPaid / inputs.carPrice, 0)}) ` +
          `financiando los restantes ${fmtMXN(R.financed)}`;
  const purchase = [
    `La conclusión del análisis es adquirir un ${car} ` +
      `(motor ${vehicleLabel?.toLowerCase()}, modelo ${inputs.carYear}) ` +
      `por un costo de ${fmtMXN(inputs.carPrice)}, ${purchaseDesc}`,
    financed
      ? ` a un plazo de ${inputs.loanMonths} meses con una tasa de interés del ` +
        `${fmtPct(inputs.interestRate, 1)} anual, resultando en ${inputs.loanMonths} ` +
        `mensualidades de ${fmtMXN(R.monthlyPayment)}`
      : '',
    '. ',
    financed
      ? `Pagaríamos ${fmtMXN(R.totalInterest)} adicionales en intereses, y el Valor Futuro ` +
        `nominal total del crédito (${fmtMXN(R.fvTotal)}) frente a su Valor Presente ` +
        `(${fmtMXN(R.pvTotal)}) refleja un costo del dinero de ${fmtMXN(R.timeValueOfMoney)}.`
      : '',
  ].join('');

  const energyWord = inputs.vehicleType === 'electric' ? 'electricidad' : 'combustible';
  const oneTimeDesc =
    R.oneTimeUberCosts > 0
      ? ` Además, se contemplan pagos iniciales únicos de ${fmtMXN(R.oneTimeUberCosts)} ` +
        `(examen toxicológico ${fmtMXN(inputs.toxicologyReport)} y certificación inicial Uber ` +
        `${fmtMXN(inputs.uberCertification)}) que se desembolsan una sola vez al inicio.`
      : '';
  const costs = [
    `Para evaluar el proyecto en ${city}, consideramos costos mensuales operativos de ` +
      `${fmtMXN(R.monthlyOpCosts)} que incluyen ${energyWord} (${fmtMXN(R.monthlyFuel)}), ` +
      `seguro (${fmtMXN(R.monthlyIns)}), refrendo/tenencia (${fmtMXN(R.monthlyRefrendo)}), ` +
      `mantenimiento ligado a kilometraje (${fmtMXN(R.monthlyMaint)}), ` +
      `datos móviles (${fmtMXN(R.monthlyData)}), lavado (${fmtMXN(R.monthlyCarWash)}), ` +
      `propinas (${fmtMXN(R.monthlyTips)}), misceláneos (${fmtMXN(R.monthlyMisc)}) ` +
      `y accesorios (${fmtMXN(R.monthlyAccess)})`,
    financed ? `, más la mensualidad del auto de ${fmtMXN(R.monthlyPayment)}` : '',
    `, resultando en un total mensual de ${fmtMXN(R.monthlyTotalOperative)}.`,
    oneTimeDesc,
  ].join('');

  const operationDesc =
    `que distribuirán durante el mes resultando en ${fmtFixed(R.weeklyDays)} días/semana ` +
    `durante ${fmtFixed(R.hoursPerDay)} horas/día (es decir, ${fmtFixed(R.hoursPerWeek)} ` +
    `horas semanales totales) para obtener ${fmtFixed(R.tripsPerDay)} viajes/día`;
  const operation = R.isUberMode
    ? `Con una tarifa promedio por viaje de ${fmtMXN(R.grossPerTrip)}, descontando comisión ` +
      `Uber de ${fmtMXN(R.platformCommission, 2)} e impuestos sobre tarifa bruta de ` +
      `${fmtMXN(R.taxAmountPerTrip, 2)}, obtenemos un ingreso neto antes de km de ` +
      `${fmtMXN(R.netPerTrip, 2)} y una contribución por viaje de ` +
      `${fmtMXN(R.netContributionPerTrip, 2)} después de combustible/mantenimiento. ` +
      `El equilibrio operativo simple sería ${fmtN(R.operatingBreakEvenTrips, 0)} viajes/mes; ` +
      `para que el proyecto completo se pague solo se agrega una recuperación mensual de ` +
      `${fmtMXN(R.projectRecoveryMonthly)} y el objetivo queda en ` +
      `${fmtN(R.breakEvenTrips, 0)} viajes/mes, ${operationDesc}.`
    : 'Bajo el modo de uso personal, no hay punto de equilibrio que calcular: ' +
      'simplemente cargamos el costo total mensual al usuario.';

  const ending =
    R.remainingDebt === 0
      ? `el crédito estará completamente pagado, por lo que vender el auto en su valor ` +
        `estimado de ${fmtMXN(R.actualSalePrice)} se traduce en una ganancia neta directa de ` +
        `${fmtMXN(R.finalPosition)}.`
      : R.actualSalePrice >= R.remainingDebt
        ? `el crédito tendrá un saldo restante de ${fmtMXN(R.remainingDebt)}. La venta del ` +
          `auto en ${fmtMXN(R.actualSalePrice)} cubriría dicho saldo y dejaría una ganancia ` +
          `neta de ${fmtMXN(R.finalPosition)}.`
        : `el crédito tendrá un saldo restante de ${fmtMXN(R.remainingDebt)} mientras que el ` +
          `valor de venta proyectado (${fmtMXN(R.actualSalePrice)}) sería insuficiente, ` +
          `dejando un déficit de ${fmtMXN(Math.abs(R.finalPosition))} que tendría que ` +
          `absorberse de otras fuentes.`;
  const result = [
    `A lo largo de ${inputs.horizonYears} años, el gasto bruto total del proyecto suma ` +
      `${fmtMXN(R.totalSpentGross)}; al final se recupera ${fmtMXN(R.terminalRecovery)} ` +
      `(valor de venta ${fmtMXN(R.actualSalePrice)} menos la deuda viva ` +
      `${fmtMXN(R.remainingDebt)}), por lo que el costo neto del proyecto es ` +
      `${fmtMXN(R.totalProjectCost)}`,
    R.isUberMode
      ? ` y, sumando los ingresos de Uber, el resultado neto del proyecto es ` +
        `${fmtMXN(R.netProjectResult)}`
      : '',
    `. Al final del año ${yearEnd}, ${ending}`,
  ].join('');

  return [purchase, costs, operation, result];
}

/**
 * Text from the user or an import, made safe for one line of Markdown: line
 * breaks become spaces (no injected headings or list items) and characters with
 * Markdown or HTML meaning are backslash-escaped, so they show up literally.
 */
export const mdInline = (text) =>
  String(text)
    .replace(/[\r\n]+/g, ' ')
    .replace(/[\\`*_[\]<>#|!~&]/g, '\\$&');

/** A code fence longer than any run of backticks inside `text`. */
const fenceFor = (text) =>
  '`'.repeat(Math.max(3, ...(text.match(/`+/g) || []).map((run) => run.length + 1)));

/**
 * The report as Markdown, for the "Descargar .md" button (paste into a document
 * editor or convert to PDF).
 */
export function buildMarkdown(R, inputs, ctx) {
  const { car, city, vehicleLabel, isUsed, yearStart, yearEnd, rec, incomePct, labels } = ctx;
  const { breakdown, mc, mcRuns } = ctx;
  const irrText = isFinite(R.irrProject) ? ` · TIR ${fmtPct(R.irrProject, 1)}` : '';
  const decision = R.financeVsCashPV >= 0 ? 'financiar' : 'pagar de contado';

  let financing;
  if (R.isLease) {
    const penalty =
      R.leaseKmPenaltyYear > 0
        ? `\n- Penalización estimada por exceso de kilometraje: ${fmtMXN(R.leaseKmPenaltyYear)}/año.`
        : '';
    financing = `
## Arrendamiento
- Renta de ${fmtMXN(R.monthlyPayment)}/mes por ${R.months} meses; NO eres dueño, no hay reventa ni depreciación a tu favor.
- Enganche/depósito inicial ${fmtMXN(R.cashPaid)} (no recuperable).${penalty}
- El seguro, la gasolina y el mantenimiento los sigues pagando tú como arrendatario.
`;
  } else if (R.isBalloon && R.financed > 0) {
    financing = `
## Financiamiento con pago final (globo)
- Monto financiado ${fmtMXN(R.financed)} a ${fmtPct(inputs.interestRate, 1)} por ${inputs.loanMonths} meses → mensualidad menor de ${fmtMXN(R.monthlyPayment)}/mes.
- Valor residual no amortizado (${fmtPct(R.balloonPct, 0)} del financiado) = **pago final de ${fmtMXN(R.balloonPayment)}** en el mes ${R.months} (lo pagas o refinancias para quedarte el auto, o lo vendes al cierre).
- **CAT real ${fmtPct(R.cat, 1)}** (tasa efectiva ${fmtPct(R.ear, 1)}); intereses totales ${fmtMXN(R.totalInterest)} + apertura ${fmtMXN(R.openingFee)}.
- ¿Financiar o pagar de contado? Δ valor presente = ${fmtMXN(R.financeVsCashPV)} → conviene **${decision}**.
`;
  } else if (R.financed > 0) {
    financing = `
## Financiamiento
- Monto financiado ${fmtMXN(R.financed)} a ${fmtPct(inputs.interestRate, 1)} por ${inputs.loanMonths} meses → ${fmtMXN(R.monthlyPayment)}/mes.
- **CAT real ${fmtPct(R.cat, 1)}** (tasa efectiva ${fmtPct(R.ear, 1)}); intereses totales ${fmtMXN(R.totalInterest)} + apertura ${fmtMXN(R.openingFee)}.
- ¿Financiar o pagar de contado? Δ valor presente = ${fmtMXN(R.financeVsCashPV)} → conviene **${decision}**.
- VF nominal ${fmtMXN(R.fvTotal)} vs VP ${fmtMXN(R.pvTotal)} (costo del dinero ${fmtMXN(R.timeValueOfMoney)}).
`;
  } else {
    financing = `
## Pago
- Compra de contado por ${fmtMXN(R.cashPaid)}. Costo de oportunidad de ese dinero en ${inputs.horizonYears} años a ${fmtPct(R.discountAnnual, 1)}: ${fmtMXN(R.opportunityCostUpfront)}.
`;
  }

  const uber = R.isUberMode
    ? `
## Operación en Uber
- Contribución por viaje ${fmtMXN(R.netContributionPerTrip, 2)}; equilibrio del proyecto ${fmtN(R.breakEvenTrips, 0)} viajes/mes.
- Intensidad: ${fmtFixed(R.weeklyDays)} días/sem · ${fmtFixed(R.hoursPerDay)} hrs/día · ${fmtFixed(R.hoursPerWeek)} hrs/sem.
- Resultado neto del proyecto ${fmtMXN(R.netProjectResult)} · VPN ${fmtMXN(R.npvProject)}${irrText}.
`
    : '';

  const risk = !mc
    ? ''
    : R.isUberMode
      ? `
## Rango probable (simulación de ${mcRuns} escenarios)
- Probabilidad de que el plan sea viable: **${fmtPct(mc.feasibleRate, 1)}**.
- Viajes/mes — optimista ${fmtN(mc.be.p10, 0)} · probable ${fmtN(mc.be.p50, 0)} · pesimista ${fmtN(mc.be.p90, 0)}.
- Resultado neto — pesimista ${fmtMXN(mc.net.p10)} · probable ${fmtMXN(mc.net.p50)} · optimista ${fmtMXN(mc.net.p90)}.
`
      : `
## Rango probable (simulación de ${mcRuns} escenarios)
- Resultado de liquidación — pesimista ${fmtMXN(mc.fp.p10)} · probable ${fmtMXN(mc.fp.p50)} · optimista ${fmtMXN(mc.fp.p90)}.
- La dispersión la dominan la reventa (depreciación · factor de venta) y el costo de energía.
`;

  const taxText = R.isUberMode ? ` · Régimen fiscal del ingreso: ${labels.taxRegimeLabel}.` : '';
  const repairs =
    R.totalRepairReserve > 0
      ? `- Reserva de reparaciones acumulada en el horizonte: ${fmtMXN(R.totalRepairReserve)}.\n`
      : '';
  // Las notas son texto libre: van en un bloque de código para que se lean tal cual.
  const userNotes = inputs.userNotes && inputs.userNotes.trim();
  const fence = userNotes ? fenceFor(userNotes) : '';
  const notes = userNotes
    ? `\n## Notas y fuentes del usuario\n${fence}text\n${userNotes}\n${fence}\n`
    : '';

  return `# Análisis de decisión — ${mdInline(car)}
*${isUsed ? 'Usado/seminuevo' : 'Nuevo'} · ${vehicleLabel} · modelo ${inputs.carYear} · ${mdInline(city)} · horizonte ${inputs.horizonYears} años (${yearStart}–${yearEnd})*

## Recomendación: ${rec.title}
${rec.reasons.map((r) => `- ${r}`).join('\n')}

## La decisión de un vistazo
| Métrica | Valor |
|---|---|
| Precio del vehículo | ${fmtMXN(inputs.carPrice)} |
| Desembolso inicial | ${fmtMXN(R.upfrontCash)} |
| Costo mensual de tener el auto | ${fmtMXN(R.monthlyTotalOperative)} |
| Costo total de propiedad (TCO) | ${fmtMXN(R.tcoTotal)} (${fmtMXN(R.tcoPerYear)}/año) |
| Costo anual equivalente (CAE) | ${fmtMXN(R.eac)}/año |
| Costo por kilómetro | ${isFinite(R.costPerKm) ? fmtMXN(R.costPerKm, 2) : '—'} |
| Valor presente del costo (tasa ${fmtPct(R.discountAnnual, 1)}) | ${fmtMXN(R.pvLifetimeCost)} |
| Costo por depreciación | ${fmtMXN(R.depreciationCost)} |
| Valor de reventa en ${yearEnd} | ${fmtMXN(R.actualSalePrice)} |
${incomePct != null ? `| Peso en tu ingreso | ${fmtPct(incomePct, 1)} |\n` : ''}${financing}
## Costo total de propiedad (${inputs.horizonYears} años)
${breakdown.map((b) => `- ${b.name}: ${fmtMXN(b.total)}`).join('\n')}
- **Gasto bruto total: ${fmtMXN(R.totalSpentGross)}**
- Menos recuperación al vender (venta neta − deuda): ${fmtMXN(R.terminalRecovery)}
- **Costo neto de propiedad (TCO): ${fmtMXN(R.totalProjectCost)}**
${uber}
${risk}
## Supuestos clave
- Tipo de financiamiento: ${labels.financeLabel}.${taxText} · Seguro: ${labels.insuranceModeLabel}.
- Tasa de descuento (oportunidad): ${fmtPct(R.discountAnnual, 1)} · Inflación de costos: ${fmtPct(R.generalInflation, 1)}/año.
- Depreciación: método ${inputs.depreciationMethod} a ${fmtPct(inputs.depreciationRate, 0)}/año · factor de reventa ${inputs.salesFactor.toFixed(2)}× · costo de venta ${fmtPct(R.sellingCostPct, 1)}.
${repairs}- Generado por Auto·Pilot. Valida precios y tasas con fuentes oficiales (fabricante, AMDA, Profeco, CFE, banco).
${notes}`;
}
