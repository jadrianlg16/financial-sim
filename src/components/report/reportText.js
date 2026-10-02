// Text the report builds from the model result: labels, the recommendation, the
// cost breakdown, the narrative appendix and the downloadable Markdown. Plain
// functions with no React, so the Report components only lay them out.
import { fmtFixed, fmtMXN, fmtN, fmtPct } from '../../domain/format.js';

/** Human-readable finance type, tax regime and insurance mode. */
export function reportLabels(result) {
  const financeLabel = result.isLease
    ? 'Arrendamiento (renta)'
    : result.isBalloon
      ? 'Crédito con pago final (globo)'
      : result.financed > 0
        ? 'Crédito tradicional'
        : 'Contado';
  const taxRegimeLabel =
    result.taxRegime === 'gross'
      ? `Bruto/simple (${fmtPct(result.taxRate, 0)} de la tarifa)`
      : result.taxRegime === 'net'
        ? `Sobre utilidad (${fmtPct(result.taxRate, 0)})`
        : `RESICO (retención ${fmtPct(result.resicoRate, 1)})`;
  const insuranceModeLabel =
    result.insuranceMode === 'pctOfValue'
      ? `% del valor (${fmtPct(result.insurancePctOfValue, 1)}/año · baja al depreciarse)`
      : 'Monto fijo mensual';
  return { financeLabel, taxRegimeLabel, insuranceModeLabel };
}

/**
 * Advisor-style verdict: a level (ok / warn / bad), a title and the reasons.
 * With Uber income it judges feasibility; without it, the cost of ownership and,
 * when the monthly income is known, affordability.
 */
export function buildRecommendation(result, inputs, incomePct) {
  if (result.isUberMode) {
    if (result.tripsPerHourWarn)
      return {
        level: 'bad',
        title: 'Replantea los supuestos de Uber',
        reasons: ['Asumes más de 4 viajes/hora, que no es realista. Ajusta antes de decidir.'],
      };
    if (result.netContributionPerTrip <= 0)
      return {
        level: 'bad',
        title: 'Cada viaje pierde dinero',
        reasons: [
          'Con la tarifa y los costos actuales, manejar para Uber no cubre ni el costo variable por viaje.',
        ],
      };
    if (!result.feasible)
      return {
        level: 'bad',
        title: 'Inviable con la capacidad disponible',
        reasons: [
          `El equilibrio exige ${fmtN(result.breakEvenTrips)} viajes/mes y ` +
            `el máximo posible es ${fmtN(result.maxTripsMonth)}.`,
        ],
      };
    const irrText = isFinite(result.irrProject) ? ` · TIR ${fmtPct(result.irrProject, 1)}` : '';
    const reasons = [
      `El proyecto se paga solo trabajando ${fmtFixed(result.hoursPerWeek)} hrs/semana ` +
        `(${fmtFixed(result.hoursPerDay)} hrs/día).`,
      `Resultado neto a ${inputs.horizonYears} años: ${fmtMXN(result.netProjectResult)} · ` +
        `VPN ${fmtMXN(result.npvProject)} (tasa ${fmtPct(result.discountAnnual, 1)})${irrText}.`,
    ];
    if (result.hoursPerDay > 5) return { level: 'warn', title: 'Viable, pero exigente', reasons };
    return { level: 'ok', title: 'Estrategia viable', reasons };
  }
  const reasons = [
    `Costo total de propiedad: ${fmtMXN(result.tcoTotal)} ` +
      `(${fmtMXN(result.tcoPerYear)}/año · CAE ${fmtMXN(result.eac)}/año).`,
  ];
  if (isFinite(result.costPerKm))
    reasons.push(`Equivale a ${fmtMXN(result.costPerKm, 2)} por kilómetro.`);
  if (result.financed > 0)
    reasons.push(
      `Conviene ${result.financeVsCashPV >= 0 ? 'financiar' : 'pagar de contado'} ` +
        `(Δ en valor presente ${fmtMXN(result.financeVsCashPV)}); CAT real ${fmtPct(result.cat, 1)}.`,
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
export function horizonBreakdown(result, energyName) {
  const last = result.cashflow[result.cashflow.length - 1] || {};
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
  result,
  inputs,
  { financeLabel, taxRegimeLabel, insuranceModeLabel },
  yearEnd,
) {
  return [
    { k: 'Precio del vehículo', v: fmtMXN(inputs.carPrice) },
    { k: 'Tipo de financiamiento', v: financeLabel },
    result.isLease && { k: 'Renta mensual', v: `${fmtMXN(result.monthlyPayment)}/mes` },
    result.isBalloon && {
      k: `Pago final (globo) en mes ${result.months}`,
      v: fmtMXN(result.balloonPayment),
    },
    { k: 'Desembolso inicial (día 1)', v: fmtMXN(result.upfrontCash) },
    { k: 'Costo mensual de tenerlo', v: fmtMXN(result.monthlyTotalOperative) },
    { k: 'Costo total de propiedad (TCO)', v: fmtMXN(result.tcoTotal), strong: true },
    { k: 'TCO por año', v: fmtMXN(result.tcoPerYear) },
    { k: 'Costo anual equivalente (CAE)', v: `${fmtMXN(result.eac)}/año`, strong: true },
    { k: 'Costo por kilómetro', v: isFinite(result.costPerKm) ? fmtMXN(result.costPerKm, 2) : '—' },
    { k: 'Valor presente del costo', v: fmtMXN(result.pvLifetimeCost) },
    {
      k: 'Costo por depreciación',
      v: result.isLease ? 'No aplica (no eres dueño)' : fmtMXN(result.depreciationCost),
    },
    {
      k: `Reventa esperada en ${yearEnd}`,
      v: result.isLease ? 'Sin reventa (arrendamiento)' : fmtMXN(result.actualSalePrice),
    },
    result.isUberMode && { k: 'Régimen fiscal del ingreso', v: taxRegimeLabel },
    { k: 'Modo de seguro', v: insuranceModeLabel },
  ].filter(Boolean);
}

/**
 * The whole analysis as running prose, one paragraph per element: purchase and
 * credit, monthly costs, Uber operation, and the result at the end of the horizon.
 */
export function buildNarrative(result, inputs, { car, city, vehicleLabel, yearEnd }) {
  const financed = result.financed > 0;
  const purchaseDesc =
    inputs.purchaseMode === 'cash'
      ? `pagado en efectivo en su totalidad (${fmtMXN(inputs.carPrice)})`
      : inputs.purchaseMode === 'hybrid'
        ? `pagando ${fmtMXN(result.cashPaid)} en efectivo y financiando los restantes ${fmtMXN(result.financed)}`
        : `con un enganche de ${fmtMXN(result.cashPaid)} (${fmtPct(result.cashPaid / inputs.carPrice, 0)}) ` +
          `financiando los restantes ${fmtMXN(result.financed)}`;
  const purchase = [
    `La conclusión del análisis es adquirir un ${car} ` +
      `(motor ${vehicleLabel?.toLowerCase()}, modelo ${inputs.carYear}) ` +
      `por un costo de ${fmtMXN(inputs.carPrice)}, ${purchaseDesc}`,
    financed
      ? ` a un plazo de ${inputs.loanMonths} meses con una tasa de interés del ` +
        `${fmtPct(inputs.interestRate, 1)} anual, resultando en ${inputs.loanMonths} ` +
        `mensualidades de ${fmtMXN(result.monthlyPayment)}`
      : '',
    '. ',
    financed
      ? `Pagaríamos ${fmtMXN(result.totalInterest)} adicionales en intereses, y el Valor Futuro ` +
        `nominal total del crédito (${fmtMXN(result.fvTotal)}) frente a su Valor Presente ` +
        `(${fmtMXN(result.pvTotal)}) refleja un costo del dinero de ${fmtMXN(result.timeValueOfMoney)}.`
      : '',
  ].join('');

  const energyWord = inputs.vehicleType === 'electric' ? 'electricidad' : 'combustible';
  const oneTimeDesc =
    result.oneTimeUberCosts > 0
      ? ` Además, se contemplan pagos iniciales únicos de ${fmtMXN(result.oneTimeUberCosts)} ` +
        `(examen toxicológico ${fmtMXN(inputs.toxicologyReport)} y certificación inicial Uber ` +
        `${fmtMXN(inputs.uberCertification)}) que se desembolsan una sola vez al inicio.`
      : '';
  const costs = [
    `Para evaluar el proyecto en ${city}, consideramos costos mensuales operativos de ` +
      `${fmtMXN(result.monthlyOpCosts)} que incluyen ${energyWord} (${fmtMXN(result.monthlyFuel)}), ` +
      `seguro (${fmtMXN(result.monthlyIns)}), refrendo/tenencia (${fmtMXN(result.monthlyRefrendo)}), ` +
      `mantenimiento ligado a kilometraje (${fmtMXN(result.monthlyMaint)}), ` +
      `datos móviles (${fmtMXN(result.monthlyData)}), lavado (${fmtMXN(result.monthlyCarWash)}), ` +
      `propinas (${fmtMXN(result.monthlyTips)}), misceláneos (${fmtMXN(result.monthlyMisc)}) ` +
      `y accesorios (${fmtMXN(result.monthlyAccess)})`,
    financed ? `, más la mensualidad del auto de ${fmtMXN(result.monthlyPayment)}` : '',
    `, resultando en un total mensual de ${fmtMXN(result.monthlyTotalOperative)}.`,
    oneTimeDesc,
  ].join('');

  const operationDesc =
    `que distribuirán durante el mes resultando en ${fmtFixed(result.weeklyDays)} días/semana ` +
    `durante ${fmtFixed(result.hoursPerDay)} horas/día (es decir, ${fmtFixed(result.hoursPerWeek)} ` +
    `horas semanales totales) para obtener ${fmtFixed(result.tripsPerDay)} viajes/día`;
  const operation = result.isUberMode
    ? `Con una tarifa promedio por viaje de ${fmtMXN(result.grossPerTrip)}, descontando comisión ` +
      `Uber de ${fmtMXN(result.platformCommission, 2)} e impuestos sobre tarifa bruta de ` +
      `${fmtMXN(result.taxAmountPerTrip, 2)}, obtenemos un ingreso neto antes de km de ` +
      `${fmtMXN(result.netPerTrip, 2)} y una contribución por viaje de ` +
      `${fmtMXN(result.netContributionPerTrip, 2)} después de combustible/mantenimiento. ` +
      `El equilibrio operativo simple sería ${fmtN(result.operatingBreakEvenTrips, 0)} viajes/mes; ` +
      `para que el proyecto completo se pague solo se agrega una recuperación mensual de ` +
      `${fmtMXN(result.projectRecoveryMonthly)} y el objetivo queda en ` +
      `${fmtN(result.breakEvenTrips, 0)} viajes/mes, ${operationDesc}.`
    : 'Bajo el modo de uso personal, no hay punto de equilibrio que calcular: ' +
      'simplemente cargamos el costo total mensual al usuario.';

  const ending =
    result.remainingDebt === 0
      ? `el crédito estará completamente pagado, por lo que vender el auto en su valor ` +
        `estimado de ${fmtMXN(result.actualSalePrice)} se traduce en una ganancia neta directa de ` +
        `${fmtMXN(result.finalPosition)}.`
      : result.actualSalePrice >= result.remainingDebt
        ? `el crédito tendrá un saldo restante de ${fmtMXN(result.remainingDebt)}. La venta del ` +
          `auto en ${fmtMXN(result.actualSalePrice)} cubriría dicho saldo y dejaría una ganancia ` +
          `neta de ${fmtMXN(result.finalPosition)}.`
        : `el crédito tendrá un saldo restante de ${fmtMXN(result.remainingDebt)} mientras que el ` +
          `valor de venta proyectado (${fmtMXN(result.actualSalePrice)}) sería insuficiente, ` +
          `dejando un déficit de ${fmtMXN(Math.abs(result.finalPosition))} que tendría que ` +
          `absorberse de otras fuentes.`;
  const closing = [
    `A lo largo de ${inputs.horizonYears} años, el gasto bruto total del proyecto suma ` +
      `${fmtMXN(result.totalSpentGross)}; al final se recupera ${fmtMXN(result.terminalRecovery)} ` +
      `(valor de venta ${fmtMXN(result.actualSalePrice)} menos la deuda viva ` +
      `${fmtMXN(result.remainingDebt)}), por lo que el costo neto del proyecto es ` +
      `${fmtMXN(result.totalProjectCost)}`,
    result.isUberMode
      ? ` y, sumando los ingresos de Uber, el resultado neto del proyecto es ` +
        `${fmtMXN(result.netProjectResult)}`
      : '',
    `. Al final del año ${yearEnd}, ${ending}`,
  ].join('');

  return [purchase, costs, operation, closing];
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
export function buildMarkdown(result, inputs, ctx) {
  const { car, city, vehicleLabel, isUsed, yearStart, yearEnd, rec, incomePct, labels } = ctx;
  const { breakdown, mc, mcRuns } = ctx;
  const irrText = isFinite(result.irrProject) ? ` · TIR ${fmtPct(result.irrProject, 1)}` : '';
  const decision = result.financeVsCashPV >= 0 ? 'financiar' : 'pagar de contado';

  let financing;
  if (result.isLease) {
    const penalty =
      result.leaseKmPenaltyYear > 0
        ? `\n- Penalización estimada por exceso de kilometraje: ${fmtMXN(result.leaseKmPenaltyYear)}/año.`
        : '';
    financing = `
## Arrendamiento
- Renta de ${fmtMXN(result.monthlyPayment)}/mes por ${result.months} meses; NO eres dueño, no hay reventa ni depreciación a tu favor.
- Enganche/depósito inicial ${fmtMXN(result.cashPaid)} (no recuperable).${penalty}
- El seguro, la gasolina y el mantenimiento los sigues pagando tú como arrendatario.
`;
  } else if (result.isBalloon && result.financed > 0) {
    financing = `
## Financiamiento con pago final (globo)
- Monto financiado ${fmtMXN(result.financed)} a ${fmtPct(inputs.interestRate, 1)} por ${inputs.loanMonths} meses → mensualidad menor de ${fmtMXN(result.monthlyPayment)}/mes.
- Valor residual no amortizado (${fmtPct(result.balloonPct, 0)} del financiado) = **pago final de ${fmtMXN(result.balloonPayment)}** en el mes ${result.months} (lo pagas o refinancias para quedarte el auto, o lo vendes al cierre).
- **CAT real ${fmtPct(result.cat, 1)}** (tasa efectiva ${fmtPct(result.ear, 1)}); intereses totales ${fmtMXN(result.totalInterest)} + apertura ${fmtMXN(result.openingFee)}.
- ¿Financiar o pagar de contado? Δ valor presente = ${fmtMXN(result.financeVsCashPV)} → conviene **${decision}**.
`;
  } else if (result.financed > 0) {
    financing = `
## Financiamiento
- Monto financiado ${fmtMXN(result.financed)} a ${fmtPct(inputs.interestRate, 1)} por ${inputs.loanMonths} meses → ${fmtMXN(result.monthlyPayment)}/mes.
- **CAT real ${fmtPct(result.cat, 1)}** (tasa efectiva ${fmtPct(result.ear, 1)}); intereses totales ${fmtMXN(result.totalInterest)} + apertura ${fmtMXN(result.openingFee)}.
- ¿Financiar o pagar de contado? Δ valor presente = ${fmtMXN(result.financeVsCashPV)} → conviene **${decision}**.
- VF nominal ${fmtMXN(result.fvTotal)} vs VP ${fmtMXN(result.pvTotal)} (costo del dinero ${fmtMXN(result.timeValueOfMoney)}).
`;
  } else {
    financing = `
## Pago
- Compra de contado por ${fmtMXN(result.cashPaid)}. Costo de oportunidad de ese dinero en ${inputs.horizonYears} años a ${fmtPct(result.discountAnnual, 1)}: ${fmtMXN(result.opportunityCostUpfront)}.
`;
  }

  const uber = result.isUberMode
    ? `
## Operación en Uber
- Contribución por viaje ${fmtMXN(result.netContributionPerTrip, 2)}; equilibrio del proyecto ${fmtN(result.breakEvenTrips, 0)} viajes/mes.
- Intensidad: ${fmtFixed(result.weeklyDays)} días/sem · ${fmtFixed(result.hoursPerDay)} hrs/día · ${fmtFixed(result.hoursPerWeek)} hrs/sem.
- Resultado neto del proyecto ${fmtMXN(result.netProjectResult)} · VPN ${fmtMXN(result.npvProject)}${irrText}.
`
    : '';

  const risk = !mc
    ? ''
    : result.isUberMode
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

  const taxText = result.isUberMode
    ? ` · Régimen fiscal del ingreso: ${labels.taxRegimeLabel}.`
    : '';
  const repairs =
    result.totalRepairReserve > 0
      ? `- Reserva de reparaciones acumulada en el horizonte: ${fmtMXN(result.totalRepairReserve)}.\n`
      : '';
  // The notes are free text: they go in a code block so they read as typed.
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
| Desembolso inicial | ${fmtMXN(result.upfrontCash)} |
| Costo mensual de tener el auto | ${fmtMXN(result.monthlyTotalOperative)} |
| Costo total de propiedad (TCO) | ${fmtMXN(result.tcoTotal)} (${fmtMXN(result.tcoPerYear)}/año) |
| Costo anual equivalente (CAE) | ${fmtMXN(result.eac)}/año |
| Costo por kilómetro | ${isFinite(result.costPerKm) ? fmtMXN(result.costPerKm, 2) : '—'} |
| Valor presente del costo (tasa ${fmtPct(result.discountAnnual, 1)}) | ${fmtMXN(result.pvLifetimeCost)} |
| Costo por depreciación | ${fmtMXN(result.depreciationCost)} |
| Valor de reventa en ${yearEnd} | ${fmtMXN(result.actualSalePrice)} |
${incomePct != null ? `| Peso en tu ingreso | ${fmtPct(incomePct, 1)} |\n` : ''}${financing}
## Costo total de propiedad (${inputs.horizonYears} años)
${breakdown.map((b) => `- ${b.name}: ${fmtMXN(b.total)}`).join('\n')}
- **Gasto bruto total: ${fmtMXN(result.totalSpentGross)}**
- Menos recuperación al vender (venta neta − deuda): ${fmtMXN(result.terminalRecovery)}
- **Costo neto de propiedad (TCO): ${fmtMXN(result.totalProjectCost)}**
${uber}
${risk}
## Supuestos clave
- Tipo de financiamiento: ${labels.financeLabel}.${taxText} · Seguro: ${labels.insuranceModeLabel}.
- Tasa de descuento (oportunidad): ${fmtPct(result.discountAnnual, 1)} · Inflación de costos: ${fmtPct(result.generalInflation, 1)}/año.
- Depreciación: método ${inputs.depreciationMethod} a ${fmtPct(inputs.depreciationRate, 0)}/año · factor de reventa ${inputs.salesFactor.toFixed(2)}× · costo de venta ${fmtPct(result.sellingCostPct, 1)}.
${repairs}- Generado por Auto·Pilot. Valida precios y tasas con fuentes oficiales (fabricante, AMDA, Profeco, CFE, banco).
${notes}`;
}
