import React, { useMemo } from 'react';
import {
  FileText, AlertTriangle, CheckCircle2, Download
} from 'lucide-react';
import { SOURCE_LABELS } from '../content/sources.js';
import { carDisplayName } from '../domain/carDisplay.js';
import { CITY_PRESETS, VEHICLE_TYPES } from '../domain/constants.js';
import { fmtFixed, fmtMXN, fmtN, fmtPct, num } from '../domain/format.js';
import { runMonteCarlo } from '../domain/monteCarlo.js';

export const Report = ({ R, inputs, sources }) => {
  const car = carDisplayName(inputs);
  const city = inputs.cityName || CITY_PRESETS[inputs.city]?.name || 'la ciudad';
  const yearEnd = 2025 + inputs.horizonYears;
  const vehicleLabel = VEHICLE_TYPES[inputs.vehicleType]?.label;
  const carAge = Math.max(0, 2026 - inputs.carYear);
  const isUsed = inputs.vehicleCondition === 'used';
  const incomePct = inputs.monthlyIncome > 0 ? R.monthlyTotalOperative / inputs.monthlyIncome : null;
  const energyName = inputs.vehicleType==='electric' ? 'Energía eléctrica' : (inputs.vehicleType==='diesel' ? 'Diésel' : 'Combustible');

  // --- FEATURE: tipo de financiamiento y etiquetas legibles -----------------
  // El reporte ya no asume crédito tradicional vs contado: arrendamiento (lease)
  // y crédito con pago final (balloon) tienen narrativa propia.
  const financeLabel = R.isLease ? 'Arrendamiento (renta)' : R.isBalloon ? 'Crédito con pago final (globo)' : (R.financed > 0 ? 'Crédito tradicional' : 'Contado');
  const taxRegimeLabel = R.taxRegime==='gross' ? `Bruto/escolar (${fmtPct(R.taxRate,0)} de la tarifa)` : R.taxRegime==='net' ? `Sobre utilidad (${fmtPct(R.taxRate,0)})` : `RESICO (retención ${fmtPct(R.resicoRate,1)})`;
  const insuranceModeLabel = R.insuranceMode==='pctOfValue' ? `% del valor (${fmtPct(R.insurancePctOfValue,1)}/año · baja al depreciarse)` : 'Monto fijo mensual';

  // --- FEATURE: rango probable (Monte Carlo ligero, 800 escenarios) ---------
  // Convierte la recomendación de punto-estimado a un rango optimista/probable/
  // pesimista. 800 iteraciones es rápido y se recalcula sólo al cambiar inputs.
  const mc = useMemo(() => { try { return runMonteCarlo(inputs, 800); } catch { return null; } }, [inputs]);
  const MC_N = mc?.iterations || 800;

  // --- FEATURE: impresión / Guardar PDF -------------------------------------
  // No agrega dependencias: usa el diálogo de impresión del navegador. El bloque
  // <style media="print"> de abajo oculta el chrome de la app para que salga como
  // documento. Desde el diálogo el usuario elige "Guardar como PDF".
  const handlePrint = () => { try { window.print(); } catch {} };

  // --- RECOMENDACIÓN (veredicto de asesor, no narrativa escolar) ------------
  const rec = (() => {
    if (R.isUberMode) {
      if (R.tripsPerHourWarn) return { level:'bad', title:'Replantea los supuestos de Uber', reasons:['Asumes más de 4 viajes/hora, que no es realista. Ajusta antes de decidir.'] };
      if (R.netContributionPerTrip <= 0) return { level:'bad', title:'Cada viaje pierde dinero', reasons:['Con la tarifa y los costos actuales, manejar para Uber no cubre ni el costo variable por viaje.'] };
      if (!R.feasible) return { level:'bad', title:'Inviable con la capacidad disponible', reasons:[`El equilibrio exige ${fmtN(R.breakEvenTrips)} viajes/mes y el máximo posible es ${fmtN(R.maxTripsMonth)}.`] };
      const reasons = [
        `El proyecto se paga solo trabajando ${fmtFixed(R.hoursPerWeek)} hrs/semana (${fmtFixed(R.hoursPerDay)} hrs/día).`,
        `Resultado neto a ${inputs.horizonYears} años: ${fmtMXN(R.netProjectResult)} · VPN ${fmtMXN(R.npvProject)} (tasa ${fmtPct(R.discountAnnual,1)})${isFinite(R.irrProject)?` · TIR ${fmtPct(R.irrProject,1)}`:''}.`,
      ];
      if (R.hoursPerDay > 5) return { level:'warn', title:'Viable, pero exigente', reasons };
      return { level:'ok', title:'Estrategia viable', reasons };
    }
    const reasons = [`Costo total de propiedad: ${fmtMXN(R.tcoTotal)} (${fmtMXN(R.tcoPerYear)}/año · CAE ${fmtMXN(R.eac)}/año).`];
    if (isFinite(R.costPerKm)) reasons.push(`Equivale a ${fmtMXN(R.costPerKm,2)} por kilómetro.`);
    if (R.financed > 0) reasons.push(`Conviene ${R.financeVsCashPV>=0?'financiar':'pagar de contado'} (Δ en valor presente ${fmtMXN(R.financeVsCashPV)}); CAT real ${fmtPct(R.cat,1)}.`);
    if (incomePct != null) {
      if (incomePct > 0.35) return { level:'bad', title:'Pesa demasiado en tu ingreso', reasons:[`El auto se llevaría ${fmtPct(incomePct,0)} de tu ingreso (arriba de 35% es riesgo alto).`, ...reasons] };
      if (incomePct > 0.20) return { level:'warn', title:'Comprable, pero ajustado', reasons:[`El auto se llevaría ${fmtPct(incomePct,0)} de tu ingreso (la regla sana es ≤20%).`, ...reasons] };
      return { level:'ok', title:'Compra dentro de tus posibilidades', reasons:[`El auto representa ${fmtPct(incomePct,0)} de tu ingreso, dentro de lo sano.`, ...reasons] };
    }
    return { level:'warn', title:'Decisión informada', reasons:[...reasons, 'Agrega tu ingreso mensual (panel lateral) para una recomendación de asequibilidad.'] };
  })();
  const recColor = rec.level==='ok' ? 'var(--pos)' : rec.level==='warn' ? 'var(--warn)' : 'var(--neg)';

  const escenario = R.remainingDebt === 0
    ? `el crédito estará completamente pagado, por lo que vender el auto en su valor estimado de ${fmtMXN(R.actualSalePrice)} se traduce en una ganancia neta directa de ${fmtMXN(R.finalPosition)}.`
    : R.actualSalePrice >= R.remainingDebt
      ? `el crédito tendrá un saldo restante de ${fmtMXN(R.remainingDebt)}. La venta del auto en ${fmtMXN(R.actualSalePrice)} cubriría dicho saldo y dejaría una ganancia neta de ${fmtMXN(R.finalPosition)}.`
      : `el crédito tendrá un saldo restante de ${fmtMXN(R.remainingDebt)} mientras que el valor de venta proyectado (${fmtMXN(R.actualSalePrice)}) sería insuficiente, dejando un déficit de ${fmtMXN(Math.abs(R.finalPosition))} que tendría que absorberse de otras fuentes.`;
  const purchaseDesc = inputs.purchaseMode==='cash' ? `pagado en efectivo en su totalidad (${fmtMXN(inputs.carPrice)})`
    : inputs.purchaseMode==='hybrid' ? `pagando ${fmtMXN(R.cashPaid)} en efectivo y financiando los restantes ${fmtMXN(R.financed)}`
    : `con un enganche de ${fmtMXN(R.cashPaid)} (${fmtPct(R.cashPaid/inputs.carPrice,0)}) financiando los restantes ${fmtMXN(R.financed)}`;
  const operationDesc = R.isUberMode ? `que distribuirán durante el mes resultando en ${fmtFixed(R.weeklyDays)} días/semana durante ${fmtFixed(R.hoursPerDay)} horas/día (es decir, ${fmtFixed(R.hoursPerWeek)} horas semanales totales) para obtener ${fmtFixed(R.tripsPerDay)} viajes/día` : `bajo modo de uso exclusivamente personal sin generación de ingresos por plataforma`;
  const oneTimeDesc = R.oneTimeUberCosts>0 ? ` Además, se contemplan pagos iniciales únicos de ${fmtMXN(R.oneTimeUberCosts)} (examen toxicológico ${fmtMXN(inputs.toxicologyReport)} y certificación inicial Uber ${fmtMXN(inputs.uberCertification)}) que se desembolsan una sola vez al inicio.` : '';
  const narrative = `Nuestra conclusión sobre la situación problema fue adquirir un ${car} (motor ${vehicleLabel?.toLowerCase()}, modelo ${inputs.carYear}) por un costo de ${fmtMXN(inputs.carPrice)}, ${purchaseDesc}${R.financed>0 ? ` a un plazo de ${inputs.loanMonths} meses con una tasa de interés del ${fmtPct(inputs.interestRate,1)} anual, resultando en ${inputs.loanMonths} mensualidades de ${fmtMXN(R.monthlyPayment)}` : ''}. ${R.financed>0 ? `Pagaríamos ${fmtMXN(R.totalInterest)} adicionales en intereses, y el Valor Futuro nominal total del crédito (${fmtMXN(R.fvTotal)}) frente a su Valor Presente (${fmtMXN(R.pvTotal)}) refleja un costo del dinero de ${fmtMXN(R.timeValueOfMoney)}.` : ''}

Para evaluar el proyecto en ${city}, consideramos costos mensuales operativos de ${fmtMXN(R.monthlyOpCosts)} que incluyen ${inputs.vehicleType==='electric' ? 'electricidad' : 'combustible'} (${fmtMXN(R.monthlyFuel)}), seguro (${fmtMXN(R.monthlyIns)}), refrendo/tenencia (${fmtMXN(R.monthlyRefrendo)}), mantenimiento ligado a kilometraje (${fmtMXN(R.monthlyMaint)}), datos móviles (${fmtMXN(R.monthlyData)}), lavado (${fmtMXN(R.monthlyCarWash)}), propinas (${fmtMXN(R.monthlyTips)}), misceláneos (${fmtMXN(R.monthlyMisc)}) y accesorios (${fmtMXN(R.monthlyAccess)})${R.financed>0 ? `, más la mensualidad del auto de ${fmtMXN(R.monthlyPayment)}` : ''}, resultando en un total mensual de ${fmtMXN(R.monthlyTotalOperative)}.${oneTimeDesc}

${R.isUberMode ? `Con una tarifa promedio por viaje de ${fmtMXN(R.grossPerTrip)}, descontando comisión Uber de ${fmtMXN(R.platformCommission,2)} e impuestos sobre tarifa bruta de ${fmtMXN(R.taxAmountPerTrip,2)}, obtenemos un ingreso neto antes de km de ${fmtMXN(R.netPerTrip,2)} y una contribución por viaje de ${fmtMXN(R.netContributionPerTrip,2)} después de combustible/mantenimiento. El equilibrio operativo simple sería ${fmtN(R.operatingBreakEvenTrips,0)} viajes/mes; para que el proyecto completo se pague solo se agrega una recuperación mensual de ${fmtMXN(R.projectRecoveryMonthly)} y el objetivo queda en ${fmtN(R.breakEvenTrips,0)} viajes/mes, ${operationDesc}.` : `Bajo el modo de uso personal, no hay punto de equilibrio que calcular: simplemente cargamos el costo total mensual al usuario.`}

A lo largo de ${inputs.horizonYears} años, el gasto bruto total del proyecto suma ${fmtMXN(R.totalSpentGross)}; al final se recupera ${fmtMXN(R.terminalRecovery)} (valor de venta ${fmtMXN(R.actualSalePrice)} menos la deuda viva ${fmtMXN(R.remainingDebt)}), por lo que el costo neto del proyecto es ${fmtMXN(R.totalProjectCost)}${R.isUberMode ? ` y, sumando los ingresos de Uber, el resultado neto del proyecto es ${fmtMXN(R.netProjectResult)}` : ''}. Al final del año ${yearEnd}, ${escenario}`;
  const months = inputs.horizonYears * 12;
  // Desglose con TOTALES reales del horizonte (ya con inflación y reserva de
  // reparaciones), tomados de los acumulados del último año del flujo.
  const last = R.cashflow[R.cashflow.length - 1] || {};
  const horizonBreakdown = [
    { name:'Auto: crédito/efectivo + desembolso inicial', total: last.cCar || 0 },
    { name: energyName, total: last.cEnergy || 0 },
    { name:'Seguro + refrendo/tenencia', total: last.cInsRef || 0 },
    { name:'Mantenimiento + reparaciones', total: last.cMaint || 0 },
    { name:'Otros (datos, lavado, propinas, misc, accesorios)', total: last.cOther || 0 },
  ].filter(b => b.total > 0);
  // Reporte descargable en Markdown (sirve para pegar en Word/Docs o convertir a PDF).
  const md = `# Análisis de decisión — ${car}
*${isUsed ? 'Usado/seminuevo' : 'Nuevo'} · ${vehicleLabel} · modelo ${inputs.carYear} · ${city} · horizonte ${inputs.horizonYears} años (2026–${yearEnd})*

## Recomendación: ${rec.title}
${rec.reasons.map(r => `- ${r}`).join('\n')}

## La decisión de un vistazo
| Métrica | Valor |
|---|---|
| Precio del vehículo | ${fmtMXN(inputs.carPrice)} |
| Desembolso inicial | ${fmtMXN(R.upfrontCash)} |
| Costo mensual de tener el auto | ${fmtMXN(R.monthlyTotalOperative)} |
| Costo total de propiedad (TCO) | ${fmtMXN(R.tcoTotal)} (${fmtMXN(R.tcoPerYear)}/año) |
| Costo anual equivalente (CAE) | ${fmtMXN(R.eac)}/año |
| Costo por kilómetro | ${isFinite(R.costPerKm) ? fmtMXN(R.costPerKm,2) : '—'} |
| Valor presente del costo (tasa ${fmtPct(R.discountAnnual,1)}) | ${fmtMXN(R.pvLifetimeCost)} |
| Costo por depreciación | ${fmtMXN(R.depreciationCost)} |
| Valor de reventa en ${yearEnd} | ${fmtMXN(R.actualSalePrice)} |
${incomePct!=null ? `| Peso en tu ingreso | ${fmtPct(incomePct,1)} |\n` : ''}${
  R.isLease ? `\n## Arrendamiento
- Renta de ${fmtMXN(R.monthlyPayment)}/mes por ${inputs.loanMonths} meses; NO eres dueño, no hay reventa ni depreciación a tu favor.
- Enganche/depósito inicial ${fmtMXN(R.cashPaid)} (no recuperable).${R.leaseKmPenaltyYear>0 ? `\n- Penalización estimada por exceso de kilometraje: ${fmtMXN(R.leaseKmPenaltyYear)}/año.` : ''}
- El seguro, la gasolina y el mantenimiento los sigues pagando tú como arrendatario.
`
  : R.isBalloon && R.financed>0 ? `\n## Financiamiento con pago final (globo)
- Monto financiado ${fmtMXN(R.financed)} a ${fmtPct(inputs.interestRate,1)} por ${inputs.loanMonths} meses → mensualidad menor de ${fmtMXN(R.monthlyPayment)}/mes.
- Valor residual no amortizado (${fmtPct(R.balloonPct,0)} del financiado) = **pago final de ${fmtMXN(R.balloonPayment)}** en el mes ${R.months} (lo pagas o refinancias para quedarte el auto, o lo vendes al cierre).
- **CAT real ${fmtPct(R.cat,1)}** (tasa efectiva ${fmtPct(R.ear,1)}); intereses totales ${fmtMXN(R.totalInterest)} + apertura ${fmtMXN(R.openingFee)}.
- ¿Financiar o pagar de contado? Δ valor presente = ${fmtMXN(R.financeVsCashPV)} → conviene **${R.financeVsCashPV>=0?'financiar':'pagar de contado'}**.
`
  : R.financed>0 ? `\n## Financiamiento
- Monto financiado ${fmtMXN(R.financed)} a ${fmtPct(inputs.interestRate,1)} por ${inputs.loanMonths} meses → ${fmtMXN(R.monthlyPayment)}/mes.
- **CAT real ${fmtPct(R.cat,1)}** (tasa efectiva ${fmtPct(R.ear,1)}); intereses totales ${fmtMXN(R.totalInterest)} + apertura ${fmtMXN(R.openingFee)}.
- ¿Financiar o pagar de contado? Δ valor presente = ${fmtMXN(R.financeVsCashPV)} → conviene **${R.financeVsCashPV>=0?'financiar':'pagar de contado'}**.
- VF nominal ${fmtMXN(R.fvTotal)} vs VP ${fmtMXN(R.pvTotal)} (costo del dinero ${fmtMXN(R.timeValueOfMoney)}).
`
  : `\n## Pago\n- Compra de contado por ${fmtMXN(R.cashPaid)}. Costo de oportunidad de ese dinero en ${inputs.horizonYears} años a ${fmtPct(R.discountAnnual,1)}: ${fmtMXN(R.opportunityCostUpfront)}.\n`}
## Costo total de propiedad (${inputs.horizonYears} años)
${horizonBreakdown.map(b => `- ${b.name}: ${fmtMXN(b.total)}`).join('\n')}
- **Gasto bruto total: ${fmtMXN(R.totalSpentGross)}**
- Menos recuperación al vender (venta neta − deuda): ${fmtMXN(R.terminalRecovery)}
- **Costo neto de propiedad (TCO): ${fmtMXN(R.totalProjectCost)}**
${R.isUberMode ? `\n## Operación en Uber
- Contribución por viaje ${fmtMXN(R.netContributionPerTrip,2)}; equilibrio del proyecto ${fmtN(R.breakEvenTrips,0)} viajes/mes.
- Intensidad: ${fmtFixed(R.weeklyDays)} días/sem · ${fmtFixed(R.hoursPerDay)} hrs/día · ${fmtFixed(R.hoursPerWeek)} hrs/sem.
- Resultado neto del proyecto ${fmtMXN(R.netProjectResult)} · VPN ${fmtMXN(R.npvProject)}${isFinite(R.irrProject)?` · TIR ${fmtPct(R.irrProject,1)}`:''}.\n` : ''}
${mc ? `\n## Rango probable (simulación de ${MC_N} escenarios)
${R.isUberMode
  ? `- Probabilidad de que el plan sea viable: **${fmtPct(mc.feasibleRate,1)}**.
- Viajes/mes — optimista ${fmtN(mc.be.p10,0)} · probable ${fmtN(mc.be.p50,0)} · pesimista ${fmtN(mc.be.p90,0)}.
- Resultado neto — pesimista ${fmtMXN(mc.net.p10)} · probable ${fmtMXN(mc.net.p50)} · optimista ${fmtMXN(mc.net.p90)}.`
  : `- Resultado de liquidación — pesimista ${fmtMXN(mc.fp.p10)} · probable ${fmtMXN(mc.fp.p50)} · optimista ${fmtMXN(mc.fp.p90)}.
- La dispersión la dominan la reventa (depreciación · factor de venta) y el costo de energía.`}
` : ''}
## Supuestos clave
- Tipo de financiamiento: ${financeLabel}.${R.isUberMode ? ` · Régimen fiscal del ingreso: ${taxRegimeLabel}.` : ''} · Seguro: ${insuranceModeLabel}.
- Tasa de descuento (oportunidad): ${fmtPct(R.discountAnnual,1)} · Inflación de costos: ${fmtPct(R.generalInflation,1)}/año.
- Depreciación: método ${inputs.depreciationMethod} a ${fmtPct(inputs.depreciationRate,0)}/año · factor de reventa ${inputs.salesFactor.toFixed(2)}× · costo de venta ${fmtPct(R.sellingCostPct,1)}.
${R.totalRepairReserve>0 ? `- Reserva de reparaciones acumulada en el horizonte: ${fmtMXN(R.totalRepairReserve)}.\n` : ''}- Generado por Auto·Pilot. Valida precios y tasas con fuentes oficiales (fabricante, AMDA, Profeco, CFE, banco).
${inputs.userNotes && inputs.userNotes.trim() ? `\n## Notas y fuentes del usuario\n${inputs.userNotes.trim()}\n` : ''}`;
  const copyReport = () => { const blob = new Blob([md], { type:'text/markdown' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `analisis_${car.replace(/[^a-z0-9]+/gi,'_').toLowerCase()}.md`; a.click(); URL.revokeObjectURL(url); };
  // CSS de impresión: oculta el chrome de la app, lleva la columna principal a
  // ancho completo, quita el fondo fijo y evita cortar tablas/KPIs entre páginas.
  // Así "Guardar como PDF" desde el diálogo produce un documento limpio.
  const printCss = `
    @media print {
      .sidebar, .tabs { display:none !important; }
      .layout { display:block !important; grid-template-columns:1fr !important; }
      .main { padding:0 !important; }
      .app-root::before { display:none !important; }
      .app-root, .layout, .main { background:#fff !important; }
      .report-body { max-width:none !important; box-shadow:none !important; border:none !important; padding:0 !important; }
      .report-noprint { display:none !important; }
      tr, .formula-block, .kpi { break-inside:avoid; page-break-inside:avoid; }
      table, .card { break-inside:auto; }
      h1, h2 { break-after:avoid; page-break-after:avoid; }
      @page { margin:16mm 14mm; }
    }
  `;
  const glance = [
    { k:'Precio del vehículo', v:fmtMXN(inputs.carPrice) },
    { k:'Tipo de financiamiento', v:financeLabel },
    R.isLease && { k:'Renta mensual', v:`${fmtMXN(R.monthlyPayment)}/mes` },
    R.isBalloon && { k:`Pago final (globo) en mes ${R.months}`, v:fmtMXN(R.balloonPayment) },
    { k:'Desembolso inicial (día 1)', v:fmtMXN(R.upfrontCash) },
    { k:'Costo mensual de tenerlo', v:fmtMXN(R.monthlyTotalOperative) },
    { k:'Costo total de propiedad (TCO)', v:fmtMXN(R.tcoTotal), strong:true },
    { k:'TCO por año', v:fmtMXN(R.tcoPerYear) },
    { k:'Costo anual equivalente (CAE)', v:`${fmtMXN(R.eac)}/año`, strong:true },
    { k:'Costo por kilómetro', v:isFinite(R.costPerKm)?fmtMXN(R.costPerKm,2):'—' },
    { k:'Valor presente del costo', v:fmtMXN(R.pvLifetimeCost) },
    { k:'Costo por depreciación', v:R.isLease ? 'No aplica (no eres dueño)' : fmtMXN(R.depreciationCost) },
    { k:`Reventa esperada en ${yearEnd}`, v:R.isLease ? 'Sin reventa (arrendamiento)' : fmtMXN(R.actualSalePrice) },
    R.isUberMode && { k:'Régimen fiscal del ingreso', v:taxRegimeLabel },
    { k:'Modo de seguro', v:insuranceModeLabel },
  ].filter(Boolean);
  // CSS responsivo del reporte (FEATURE 3): SÓLO bajo 700px y SÓLO dentro de
  // .report-body, así no toca el desktop ni el resto de la app. Reduce el padding
  // (gana al inline con !important), deja que las tablas anchas hagan scroll
  // horizontal y encoge el h1. Convive con el bloque <style media="print">.
  const responsiveCss = `
    @media (max-width:700px) {
      .report-body { padding:20px 14px !important; }
      .report-body h1 { font-size:30px; }
      .report-body h2 { font-size:20px; }
      .report-body table { display:block; overflow-x:auto; white-space:nowrap; -webkit-overflow-scrolling:touch; }
    }
  `;
  return (<div className="card report-body" style={{ padding:'40px 50px' }}>
    <style media="print">{printCss}</style>
    <style>{responsiveCss}</style>
    <div className="report-noprint" style={{ display:'flex', justifyContent:'space-between', marginBottom:24, alignItems:'center', gap:8, flexWrap:'wrap' }}><span className="pill accent">Análisis de decisión</span><div style={{ display:'flex', gap:8 }}><button className="btn outline" onClick={handlePrint}><FileText size={11} /> Imprimir / Guardar PDF</button><button className="btn outline" onClick={copyReport}><Download size={11} /> Descargar .md</button></div></div>
    <h1>{R.isUberMode ? 'Comprar un auto y pagarlo con Uber' : 'Comprar un auto: ¿conviene y cuánto cuesta?'}</h1>
    <div style={{ fontFamily:'Manrope', fontSize:13, color:'var(--muted)', letterSpacing:'0.05em', textTransform:'uppercase' }}>{isUsed?'Usado/seminuevo':'Nuevo'} · {car} · {vehicleLabel} · {city} · 2026–{yearEnd}</div>
    {inputs.carDescription && <p style={{ fontSize:13, color:'var(--muted)', marginTop:6 }}>{inputs.carDescription}{carAge>0 ? ` · Modelo ${inputs.carYear} (≈${carAge} ${carAge===1?'año':'años'}${inputs.odometerKm>0?`, ${fmtN(inputs.odometerKm)} km`:''}).` : ` · Modelo ${inputs.carYear} (nuevo).`}</p>}

    <div className="verdict" style={{ borderLeft:`4px solid ${recColor}`, marginTop:18, marginBottom:8, alignItems:'flex-start' }}>
      <div className="verdict-icon">{rec.level==='ok' ? <CheckCircle2 size={22} color={recColor} /> : <AlertTriangle size={22} color={recColor} />}</div>
      <div><div className="verdict-text" style={{ color:recColor }}>Recomendación: {rec.title}</div>
        <ul style={{ margin:'8px 0 0', paddingLeft:18, color:'var(--ink-2)', fontFamily:'Manrope', fontSize:13.5, lineHeight:1.6 }}>{rec.reasons.map((r,i)=><li key={i}>{r}</li>)}</ul></div>
    </div>
    {incomePct!=null && (<p style={{ background:'var(--bg-2)', padding:'12px 16px', borderRadius:4, fontSize:13.5, marginTop:14 }}><strong>Asequibilidad:</strong> con un ingreso de {fmtMXN(inputs.monthlyIncome)}/mes, el auto consume el <strong style={{ color: incomePct>0.3?'var(--neg)':incomePct>0.2?'var(--warn)':'var(--pos)' }}>{fmtPct(incomePct,1)}</strong> de tu sueldo. La regla sana: ≤20%.</p>)}

    <h2>La decisión de un vistazo</h2>
    <table className="tbl"><tbody>
      {glance.map((g,i)=>(<tr key={i}><td style={{ fontFamily:'Manrope', fontWeight: g.strong?700:500 }}>{g.k}</td><td className="num">{g.strong?<strong>{g.v}</strong>:g.v}</td></tr>))}
    </tbody></table>

    {inputs.carJustification && (<><h2>Por qué este vehículo</h2><p>{inputs.carJustification}</p></>)}

    {R.isLease ? (
      <><h2>Arrendamiento (renta)</h2>
      <p>No estás comprando el auto: lo <strong>rentas</strong> por <strong>{fmtMXN(R.monthlyPayment)}/mes</strong> durante {inputs.loanMonths} meses. Como arrendatario <strong>no eres dueño</strong>, así que no hay reventa ni depreciación a tu favor al final del plazo. El enganche/depósito inicial de {fmtMXN(R.cashPaid)} normalmente <strong>no es recuperable</strong>.</p>
      <p>La renta cubre el uso del vehículo, pero el <strong>seguro, la gasolina y el mantenimiento los sigues pagando tú</strong>{R.leaseKmPenaltyYear>0 ? <>. Además, con tu kilometraje proyectado se estima una <strong>penalización por exceso de km de {fmtMXN(R.leaseKmPenaltyYear)}/año</strong></> : ''}. Por eso, en arrendamiento el costo total se mide por lo que pagas (renta + operación), sin recuperación por venta.</p></>
    ) : R.isBalloon && R.financed>0 ? (
      <><h2>Financiamiento con pago final (globo)</h2>
      <p>Financias {fmtMXN(R.financed)} a una tasa de lista de {fmtPct(inputs.interestRate,1)} por {inputs.loanMonths} meses. Como dejas un <strong>valor residual</strong> ({fmtPct(R.balloonPct,0)} del financiado) sin amortizar, tu mensualidad baja a <strong>{fmtMXN(R.monthlyPayment)}</strong>, pero queda un <strong>pago final ("globo") de {fmtMXN(R.balloonPayment)}</strong> en el mes {R.months}. Ese pago lo cubres (o refinancias) para quedarte el auto, o lo saldas vendiéndolo al cierre del plazo.</p>
      <p>La tasa de lista no es el costo real: el <strong>CAT es {fmtPct(R.cat,1)}</strong> (incluye la comisión de apertura) y la tasa efectiva anual es {fmtPct(R.ear,1)}. En total pagarás {fmtMXN(R.totalInterest)} de intereses más {fmtMXN(R.openingFee)} de apertura.</p>
      <p style={{ background: R.financeVsCashPV>=0?'#e7f0e4':'#f7e6e0', padding:'12px 16px', borderRadius:4, fontSize:13.5 }}><strong>¿Financiar o pagar de contado?</strong> Comparando en valor de hoy (tasa de oportunidad {fmtPct(R.discountAnnual,1)}), {R.financeVsCashPV>=0 ? <>te conviene <strong style={{ color:'var(--pos)' }}>financiar</strong>: conservar tu dinero invertido vale {fmtMXN(R.financeVsCashPV)} más que pagar todo de golpe.</> : <>te conviene <strong style={{ color:'var(--neg)' }}>pagar de contado</strong>: financiar cuesta {fmtMXN(Math.abs(R.financeVsCashPV))} más en valor presente.</>}</p></>
    ) : R.financed>0 ? (<>
      <h2>Análisis del financiamiento</h2>
      <p>Financias {fmtMXN(R.financed)} a una tasa de lista de {fmtPct(inputs.interestRate,1)} por {inputs.loanMonths} meses, lo que da una mensualidad de <strong>{fmtMXN(R.monthlyPayment)}</strong>. Pero la tasa de lista no es el costo real: el <strong>CAT es {fmtPct(R.cat,1)}</strong> (incluye la comisión de apertura) y la tasa efectiva anual es {fmtPct(R.ear,1)}. En total pagarás {fmtMXN(R.totalInterest)} de intereses más {fmtMXN(R.openingFee)} de apertura.</p>
      <p style={{ background: R.financeVsCashPV>=0?'#e7f0e4':'#f7e6e0', padding:'12px 16px', borderRadius:4, fontSize:13.5 }}><strong>¿Financiar o pagar de contado?</strong> Comparando en valor de hoy (tasa de oportunidad {fmtPct(R.discountAnnual,1)}), {R.financeVsCashPV>=0 ? <>te conviene <strong style={{ color:'var(--pos)' }}>financiar</strong>: conservar tu dinero invertido vale {fmtMXN(R.financeVsCashPV)} más que pagar todo de golpe.</> : <>te conviene <strong style={{ color:'var(--neg)' }}>pagar de contado</strong>: financiar cuesta {fmtMXN(Math.abs(R.financeVsCashPV))} más en valor presente.</>}</p>
    </>) : (
      <><h2>Pago de contado</h2><p>Pagas {fmtMXN(R.cashPaid)} de contado. Recuerda el <strong>costo de oportunidad</strong>: ese dinero invertido a {fmtPct(R.discountAnnual,1)} anual generaría ≈{fmtMXN(R.opportunityCostUpfront)} en {inputs.horizonYears} años. No es dinero "gratis" sólo por no pagar intereses.</p></>
    )}

    <h2>Costo total de propiedad ({inputs.horizonYears} años)</h2>
    <table className="tbl"><thead><tr><th>Concepto</th><th className="num">Total del período</th></tr></thead><tbody>
      {horizonBreakdown.map((b,i) => (<tr key={i}><td style={{ fontFamily:'Manrope', fontWeight:500 }}>{b.name}</td><td className="num">{fmtMXN(b.total)}</td></tr>))}
      <tr style={{ borderTop:'2px solid var(--line)' }}><td><strong>Gasto bruto total</strong></td><td className="num"><strong>{fmtMXN(R.totalSpentGross)}</strong></td></tr>
      <tr><td>(−/+) Recuperación terminal real (venta − deuda)</td><td className={`num ${R.terminalRecovery>=0?'pos':'neg'}`}>{R.terminalRecovery>=0 ? `−${fmtMXN(R.terminalRecovery)}` : `+${fmtMXN(Math.abs(R.terminalRecovery))}`}</td></tr>
      <tr><td><strong>Costo neto del proyecto</strong></td><td className="num"><strong>{fmtMXN(R.totalProjectCost)}</strong></td></tr>
    </tbody></table>
    <h2>Tabla resumen</h2>
    <table className="tbl"><tbody>
      <tr><td>Vehículo</td><td className="num">{car} · {vehicleLabel}</td></tr>
      <tr><td>Precio</td><td className="num">{fmtMXN(inputs.carPrice)}</td></tr>
      <tr><td>Modo de compra</td><td className="num" style={{ textTransform:'capitalize' }}>{inputs.purchaseMode}</td></tr>
      <tr><td>Desembolso inicial</td><td className="num">{fmtMXN(R.upfrontCash)}</td></tr>
      {R.financed>0 && (<>
        <tr><td>Monto financiado</td><td className="num">{fmtMXN(R.financed)}</td></tr>
        <tr><td>Tasa / Plazo</td><td className="num">{fmtPct(inputs.interestRate,1)} / {inputs.loanMonths} meses</td></tr>
        <tr><td>Mensualidad</td><td className="num">{fmtMXN(R.monthlyPayment)}</td></tr>
        <tr><td>VF (nominal total)</td><td className="num">{fmtMXN(R.fvTotal)}</td></tr>
        <tr><td>VP (descontado)</td><td className="num">{fmtMXN(R.pvTotal)}</td></tr>
        <tr><td>Costo del dinero (VF − VP)</td><td className="num">{fmtMXN(R.timeValueOfMoney)}</td></tr>
        <tr><td>Intereses pagados</td><td className="num">{fmtMXN(R.totalInterest)}</td></tr>
      </>)}
      {R.oneTimeUberCosts>0 && <tr><td>Trámites iniciales Uber (único)</td><td className="num">{fmtMXN(R.oneTimeUberCosts)}</td></tr>}
      <tr><td>Seguro mensual</td><td className="num">{fmtMXN(R.monthlyIns)}</td></tr>
      <tr><td>Refrendo/tenencia mensual</td><td className="num">{fmtMXN(R.monthlyRefrendo)}</td></tr>
      <tr><td>Lavado + propinas mensual</td><td className="num">{fmtMXN(R.monthlyCarWash + R.monthlyTips)}</td></tr>
      <tr><td>Misceláneos mensual</td><td className="num">{fmtMXN(R.monthlyMisc)}</td></tr>
      <tr><td>Egresos operativos mensuales</td><td className="num">{fmtMXN(R.monthlyTotalOperative)}</td></tr>
      {R.isUberMode && (<>
        <tr><td>Ingreso neto antes de km/viaje</td><td className="num pos">{fmtMXN(R.netPerTrip,2)}</td></tr>
        <tr><td>Contribución después de km/viaje</td><td className={`num ${R.netContributionPerTrip>=0?'pos':'neg'}`}>{fmtMXN(R.netContributionPerTrip,2)}</td></tr>
        <tr><td>Equilibrio operativo</td><td className="num">{fmtN(R.operatingBreakEvenTrips,0)} viajes/mes</td></tr>
        <tr><td>Recuperación mensual del proyecto</td><td className="num">{fmtMXN(R.projectRecoveryMonthly)}</td></tr>
        <tr><td><strong>Punto de equilibrio del proyecto</strong></td><td className="num"><strong>{fmtN(R.breakEvenTrips,0)} viajes/mes</strong></td></tr>
        <tr><td><strong>Intensidad: días/semana</strong></td><td className="num"><strong>{fmtFixed(R.weeklyDays)} días</strong></td></tr>
        <tr><td><strong>Intensidad: horas/día</strong></td><td className="num"><strong>{fmtFixed(R.hoursPerDay)} hrs</strong></td></tr>
        <tr><td><strong>Intensidad: horas/semana</strong></td><td className="num"><strong>{fmtFixed(R.hoursPerWeek)} hrs</strong></td></tr>
        <tr><td>Viajes/día</td><td className="num">{fmtFixed(R.tripsPerDay)}</td></tr>
      </>)}
      <tr><td>Valor depreciado en {yearEnd}</td><td className="num">{fmtMXN(R.valueAtEnd)}</td></tr>
      <tr><td>Precio venta esperado (× {inputs.salesFactor.toFixed(2)})</td><td className="num">{fmtMXN(R.actualSalePrice)}</td></tr>
      <tr><td>Saldo crédito en {yearEnd}</td><td className="num">{fmtMXN(R.remainingDebt)}</td></tr>
      <tr><td><strong>Costo neto del proyecto</strong></td><td className="num"><strong>{fmtMXN(R.totalProjectCost)}</strong></td></tr>
      <tr><td>Resultado de liquidación (venta − deuda)</td><td className={`num ${R.liquidationPosition>=0?'pos':'neg'}`}>{fmtMXN(R.liquidationPosition)}</td></tr>
      {R.isUberMode && <tr><td><strong>Resultado neto del proyecto</strong></td><td className={`num ${R.netProjectResult>=0?'pos':'neg'}`}><strong>{fmtMXN(R.netProjectResult)}</strong></td></tr>}
    </tbody></table>
    {mc && (<>
      <h2>Rango probable (simulación de {fmtN(MC_N,0)} escenarios)</h2>
      <p style={{ fontSize:13 }}>La recomendación de arriba es el <strong>caso base</strong> (un solo escenario). Aquí movemos al azar las variables inciertas (tarifa, combustible, comisión, mantenimiento, seguro, depreciación…) {fmtN(MC_N,0)} veces para ver el <strong>rango</strong> en que caen los resultados: optimista (P10), probable (P50) y pesimista (P90).</p>
      {R.isUberMode ? (<>
        <div className="kpi-grid" style={{ marginBottom:14 }}>
          <div className="kpi accent"><div className="kpi-label">Probabilidad de éxito</div><div className="kpi-value mono" style={{ color: mc.feasibleRate>=0.5?'var(--pos)':'var(--neg)' }}>{fmtPct(mc.feasibleRate,1)}</div><div className="kpi-sub">de {fmtN(MC_N,0)} escenarios el plan es viable</div></div>
          <div className="kpi"><div className="kpi-label">Viajes/mes (equilibrio)</div><div className="kpi-value mono">{fmtN(mc.be.p50,0)}</div><div className="kpi-sub">Optimista {fmtN(mc.be.p10,0)} · Pesimista {fmtN(mc.be.p90,0)}</div></div>
          <div className="kpi accent"><div className="kpi-label">Resultado neto del proyecto</div><div className="kpi-value mono" style={{ color: mc.net.p50>=0?'var(--pos)':'var(--neg)' }}>{fmtMXN(mc.net.p50)}</div><div className="kpi-sub">Pesimista {fmtMXN(mc.net.p10)} · Optimista {fmtMXN(mc.net.p90)}</div></div>
        </div>
        <table className="tbl"><thead><tr><th>Escenario</th><th className="num">Viajes/mes</th><th className="num">Resultado neto</th></tr></thead><tbody>
          <tr><td style={{ fontFamily:'Manrope', fontWeight:500 }}>Optimista (P10)</td><td className="num">{fmtN(mc.be.p10,0)}</td><td className={`num ${mc.net.p90>=0?'pos':'neg'}`}>{fmtMXN(mc.net.p90)}</td></tr>
          <tr style={{ background:'var(--bg-2)' }}><td style={{ fontFamily:'Manrope', fontWeight:700 }}>Probable (P50)</td><td className="num"><strong>{fmtN(mc.be.p50,0)}</strong></td><td className={`num ${mc.net.p50>=0?'pos':'neg'}`}><strong>{fmtMXN(mc.net.p50)}</strong></td></tr>
          <tr><td style={{ fontFamily:'Manrope', fontWeight:500 }}>Pesimista (P90)</td><td className="num">{fmtN(mc.be.p90,0)}</td><td className={`num ${mc.net.p10>=0?'pos':'neg'}`}>{fmtMXN(mc.net.p10)}</td></tr>
        </tbody></table>
        <p style={{ fontSize:13, marginTop:10 }}>{R.feasible
          ? <>Aunque el caso base es viable trabajando ~{fmtFixed(R.hoursPerWeek)} hrs/semana, en el <strong>10% peor</strong> de los escenarios necesitarías acercarte a <strong>{fmtN(mc.be.p90,0)} viajes/mes</strong> y el resultado neto podría caer a <strong>{fmtMXN(mc.net.p10)}</strong>. El plan funciona en ~<strong>{fmtPct(mc.feasibleRate,0)}</strong> de los casos simulados.</>
          : <>El caso base no es viable; la simulación lo confirma: el plan sólo funciona en ~<strong>{fmtPct(mc.feasibleRate,0)}</strong> de los escenarios, con un equilibrio probable de <strong>{fmtN(mc.be.p50,0)} viajes/mes</strong>. Ajusta los supuestos antes de decidir.</>}</p>
      </>) : (<>
        <div className="kpi-grid" style={{ marginBottom:14 }}>
          <div className="kpi accent"><div className="kpi-label">Resultado de liquidación (probable)</div><div className="kpi-value mono" style={{ color: mc.fp.p50>=0?'var(--pos)':'var(--neg)' }}>{fmtMXN(mc.fp.p50)}</div><div className="kpi-sub">Pesimista {fmtMXN(mc.fp.p10)} · Optimista {fmtMXN(mc.fp.p90)}</div></div>
          <div className="kpi"><div className="kpi-label">Rango (P10 — P90)</div><div className="kpi-value mono" style={{ fontSize:18 }}>{fmtMXN(mc.fp.p10)} — {fmtMXN(mc.fp.p90)}</div><div className="kpi-sub">dispersión del resultado financiero</div></div>
        </div>
        <p style={{ fontSize:13 }}>En modo de uso personal no hay punto de equilibrio: el riesgo del resultado financiero lo dominan la <strong>reventa</strong> (depreciación × factor de venta) y el <strong>costo de energía/combustible</strong>. El resultado de liquidación probable es <strong>{fmtMXN(mc.fp.p50)}</strong>, con un rango entre <strong>{fmtMXN(mc.fp.p10)}</strong> (pesimista) y <strong>{fmtMXN(mc.fp.p90)}</strong> (optimista).</p>
      </>)}
    </>)}

    <h2>Escenarios de liquidación</h2>
    <table className="tbl"><thead><tr><th>Caso</th><th>Condición</th><th className="num">Resultado</th></tr></thead><tbody>
      <tr style={{ background: R.remainingDebt===0?'var(--bg-2)':'transparent' }}><td>Crédito ya pagado</td><td style={{ fontFamily:'Manrope' }}>Horizonte ≥ plazo del crédito</td><td className="num pos">{R.remainingDebt===0 ? `Ganancia: ${fmtMXN(R.actualSalePrice)}` : '—'}</td></tr>
      <tr style={{ background: (R.remainingDebt>0 && R.actualSalePrice>=R.remainingDebt)?'var(--bg-2)':'transparent' }}><td>Crédito vivo, venta cubre saldo</td><td style={{ fontFamily:'Manrope' }}>Valor venta ≥ saldo restante</td><td className="num">{(R.remainingDebt>0 && R.actualSalePrice>=R.remainingDebt) ? `Ganancia: ${fmtMXN(R.finalPosition)}` : '—'}</td></tr>
      <tr style={{ background: (R.remainingDebt>0 && R.actualSalePrice<R.remainingDebt)?'var(--bg-2)':'transparent' }}><td>Crédito vivo, déficit</td><td style={{ fontFamily:'Manrope' }}>Valor venta &lt; saldo restante</td><td className="num neg">{(R.remainingDebt>0 && R.actualSalePrice<R.remainingDebt) ? `Déficit: ${fmtMXN(Math.abs(R.finalPosition))}` : '—'}</td></tr>
    </tbody></table>
    <h2>Supuestos clave del análisis</h2>
    <table className="tbl"><tbody>
      <tr><td>Tipo de financiamiento</td><td className="num">{financeLabel}</td></tr>
      {R.isBalloon && <tr><td>Pago final (globo)</td><td className="num">{fmtMXN(R.balloonPayment)} en mes {R.months}</td></tr>}
      {R.isUberMode && <tr><td>Régimen fiscal del ingreso</td><td className="num">{taxRegimeLabel}</td></tr>}
      <tr><td>Modo de seguro</td><td className="num">{insuranceModeLabel}</td></tr>
      <tr><td>Tasa de descuento (costo de oportunidad)</td><td className="num">{fmtPct(R.discountAnnual,1)} anual</td></tr>
      <tr><td>Inflación general de costos</td><td className="num">{fmtPct(R.generalInflation,1)}/año</td></tr>
      <tr><td>Método de depreciación</td><td className="num" style={{ textTransform:'capitalize' }}>{inputs.depreciationMethod} · {fmtPct(inputs.depreciationRate,0)}/año</td></tr>
      <tr><td>Factor de reventa / costo de venta</td><td className="num">{inputs.salesFactor.toFixed(2)}× · {fmtPct(R.sellingCostPct,1)}</td></tr>
      {R.tradeInValue>0 && <tr><td>Auto a cuenta (trade-in)</td><td className="num">{fmtMXN(R.tradeInValue)}</td></tr>}
      {R.acquisitionFees>0 && <tr><td>Gastos de adquisición</td><td className="num">{fmtMXN(R.acquisitionFees)}</td></tr>}
      {R.totalRepairReserve>0 && <tr><td>Reserva de reparaciones (horizonte)</td><td className="num">{fmtMXN(R.totalRepairReserve)}</td></tr>}
    </tbody></table>

    {sources && (<><h2>Fuentes de los datos</h2>
      <table className="tbl"><thead><tr><th>Variable</th><th>Fuente</th></tr></thead><tbody>
        {Object.entries(sources).map(([k,v]) => (<tr key={k}><td style={{ fontFamily:'Manrope', fontWeight:500 }}>{SOURCE_LABELS[k] || k}</td><td style={{ wordBreak:'break-all', fontSize:11 }}>{typeof v==='string' && v.startsWith('http') ? <a href={v} target="_blank" rel="noreferrer" style={{ color:'var(--accent)' }}>{v}</a> : String(v)}</td></tr>))}
      </tbody></table></>)}

    {inputs.userNotes && inputs.userNotes.trim() && (<><h2>Notas y fuentes del usuario</h2>
      <p style={{ whiteSpace:'pre-wrap', fontSize:13.5, background:'var(--bg-2)', padding:'14px 16px', borderRadius:4 }}>{inputs.userNotes.trim()}</p></>)}

    <h2 style={{ color:'var(--muted)' }}>Apéndice · Conclusión narrativa</h2>
    <p style={{ fontSize:12, color:'var(--muted)', marginTop:-4 }}>Redacción corrida con el formato de la situación problema académica, por si necesitas entregarla así.</p>
    {narrative.split('\n\n').map((p,i) => <p key={i} style={{ fontSize:13.5 }}>{p}</p>)}

    <div style={{ marginTop:30, fontSize:11, color:'var(--muted)', fontStyle:'italic', borderTop:'1px solid var(--line)', paddingTop:14 }}>Análisis generado por Auto·Pilot con ingeniería económica (VPN, TIR, CAE, CAT). Los precios, tasas y costos son estimaciones referenciales: valídalos con fuentes oficiales (fabricante, AMDA, Profeco, CFE, tu banco/aseguradora) antes de decidir.</div>
  </div>);
};

// ============================================================================
// PÁGINA: GLOSARIO (FEATURE 2)  ·  Referencia legible de TODOS los términos.
// ----------------------------------------------------------------------------
// Reúne en un solo lugar las mismas explicaciones que aparecen en los tooltips
// "?" (objeto TIPS), para quien quiere leerlas de corrido sin perseguir íconos.
// GLOSSARY_LABELS da una etiqueta amigable a cada slug; GLOSSARY_SECTIONS las
// agrupa por tema. Cualquier término de TIPS que no esté listado en una sección
// cae automáticamente en "Otros", de modo que NUNCA se pierde una definición.
// ============================================================================
