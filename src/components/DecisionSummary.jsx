import React from 'react';
import { Calculator } from 'lucide-react';
import { Info } from './ui/Info.jsx';
import { TIPS } from '../content/tips.jsx';
import { npv } from '../domain/finance.js';
import { fmtFixed, fmtMXN, fmtN, fmtPct } from '../domain/format.js';

// ============================================================================
// PÁGINA: DASHBOARD  ·  Objetivos solicitados por el usuario
// ----------------------------------------------------------------------------
// Es la pantalla principal de resultados. Reúne las metas de varias peticiones:
//   - Veredicto claro arriba: ¿es viable / pesado / inviable / sólo costo?
//   - Perfiles de usuario que debe atender: "comprar auto nuevo y pagarlo con
//     Uber en tiempo libre", "comprar usado", "ya tengo auto y quiero saber
//     cuánto me cuesta", "usar mi carro viejo", "no quiero Uber, sólo ver
//     depreciación y costo de tenerlo", "cuánto de mi ingreso se va al carro".
//   - KPIs con tooltips (ícono ? al hover) que explican en lenguaje simple:
//     mensualidad, VF, VP, costo del dinero, costo mensual total, punto de
//     equilibrio, depreciación, costo total del proyecto y resultado final.
//   - Bloque "Impacto en tu ingreso" (sólo si el usuario llenó su ingreso,
//     campo OPCIONAL): % del sueldo que se va al auto, barra de distribución,
//     y desglose por categoría. Si no llena ingreso, todo sigue funcionando.
//   - Act. 1-A: tabla de clasificación contable Fijo/Variable × Directo/Indirecto.
//   - Gráficas de largo plazo: amortización, estructura mensual de costos,
//     GASTO TOTAL ACUMULADO por categoría (incluye desembolso inicial y todas
//     las variables nuevas), y valor del auto vs deuda.
//   - Tooltips de ayuda piden poco espacio: ícono con hover, no texto fijo.
// ============================================================================
// ============================================================================
// BLOQUE: RESUMEN DE DECISIÓN DE COMPRA  ·  Valor real (no escolar)
// ----------------------------------------------------------------------------
// Las cifras que de verdad mueven una decisión de compra de auto, con ingeniería
// económica seria: TCO, costo por km, CAE (comparador justo entre horizontes),
// valor presente del costo, costo por depreciación, CAT y financiar-vs-contado.
// Funciona en TODOS los modos; brilla en "Sin Uber" (sólo quiero comprar un auto).
// ============================================================================
export const DecisionSummary = ({ R, inputs }) => {
  const financed = R.financed > 0;
  const fvc = R.financeVsCashPV;
  // Titular en lenguaje sencillo (FEATURE B): una sola frase que resume la conclusión,
  // construida desde R y consciente de lease / Uber. Se antepone a las tarjetas KPI.
  const headline = (() => {
    const costoTxt = R.isLease
      ? `Rentar este auto te cuesta ~${fmtMXN(R.monthlyTotalOperative)} al mes`
      : `Este auto te cuesta ~${fmtMXN(R.monthlyTotalOperative)} al mes`;
    const kmTxt = isFinite(R.costPerKm) ? ` y ${fmtMXN(R.costPerKm, 2)} por km` : '';
    // Verdict de pago: lease, financiado (financiar vs contado) o contado.
    let pagoTxt;
    if (R.isLease) {
      pagoTxt = 'lo rentas, así que no eres dueño ni recuperas reventa';
    } else if (financed) {
      pagoTxt =
        fvc >= 0
          ? `financiarlo te conviene sobre pagar de contado (+${fmtMXN(fvc)} en valor de hoy)`
          : `te conviene pagarlo de contado en vez de financiar (${fmtMXN(fvc)} en valor de hoy)`;
    } else {
      pagoTxt = 'lo pagas de contado';
    }
    // Si es modo Uber y el plan es viable, decir en cuántas horas/semana se paga solo.
    const uberTxt =
      R.isUberMode && R.feasible && isFinite(R.hoursPerWeek) && R.hoursPerWeek > 0
        ? ` Trabajando en Uber se paga solo con ~${fmtFixed(R.hoursPerWeek)} hrs/semana al volante.`
        : R.isUberMode
          ? ' En modo Uber: ajusta los supuestos para que el plan sea viable.'
          : '';
    return `${costoTxt}${kmTxt}; ${pagoTxt}.${uberTxt}`;
  })();
  return (
    <div className="card" style={{ marginBottom: 18 }}>
      <div className="card-title">
        <Calculator size={11} /> Resumen de decisión de compra <Info text={TIPS.tco} />
      </div>
      <div
        className="serif"
        style={{ fontSize: 21, lineHeight: 1.35, color: 'var(--ink)', margin: '2px 0 14px' }}
      >
        {headline}
      </div>
      <div className="card-blurb">
        Las cifras que de verdad importan para decidir, con ingeniería económica (VPN, CAE, TCO) a
        una tasa de oportunidad de {fmtPct(R.discountAnnual, 1)}. Compara autos por su{' '}
        <strong>CAE</strong> (menor = mejor) y por su <strong>costo por km</strong>.
      </div>
      <div className="kpi-grid" style={{ marginBottom: 0 }}>
        <div className="kpi accent">
          <div className="kpi-label">
            Costo total de propiedad <Info text={TIPS.tco} />
          </div>
          <div className="kpi-value mono">{fmtMXN(R.tcoTotal)}</div>
          <div className="kpi-sub">
            {fmtMXN(R.tcoPerYear)}/año · {inputs.horizonYears} años
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">
            Costo por kilómetro <Info text={TIPS.costPerKm} />
          </div>
          <div className="kpi-value mono">
            {isFinite(R.costPerKm) ? fmtMXN(R.costPerKm, 2) : '—'}
          </div>
          <div className="kpi-sub">
            {isFinite(R.costPerKm)
              ? `${fmtN(R.totalKmHorizon)} km en total`
              : 'agrega km personales'}
          </div>
        </div>
        <div className="kpi accent">
          <div className="kpi-label">
            Costo anual equivalente <Info text={TIPS.eac} />
          </div>
          <div className="kpi-value mono">{fmtMXN(R.eac)}</div>
          <div className="kpi-sub">renta anual equivalente · comparador justo</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">
            Valor presente del costo <Info text={TIPS.npv} />
          </div>
          <div className="kpi-value mono">{fmtMXN(R.pvLifetimeCost)}</div>
          <div className="kpi-sub">todo el costo, traído a hoy</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">
            Costo por depreciación <Info text={TIPS.depreciationCost} />
          </div>
          <div className="kpi-value mono">{fmtMXN(R.depreciationCost)}</div>
          <div className="kpi-sub">
            {fmtPct(R.depreciationCost / Math.max(1, R.carPrice), 0)} del precio se esfuma
          </div>
        </div>
        {financed && (
          <div className="kpi">
            <div className="kpi-label">
              CAT real del crédito <Info text={TIPS.cat} />
            </div>
            <div className="kpi-value mono">{fmtPct(R.cat, 1)}</div>
            <div className="kpi-sub">
              interés de lista {fmtPct(inputs.interestRate, 1)} · efectiva {fmtPct(R.ear, 1)}
            </div>
          </div>
        )}
        {financed && (
          <div className="kpi">
            <div className="kpi-label">
              ¿Financiar o contado? <Info text={TIPS.financeVsCash} />
            </div>
            <div
              className="kpi-value mono"
              style={{ color: fvc >= 0 ? 'var(--pos)' : 'var(--neg)' }}
            >
              {fvc >= 0 ? 'Financiar' : 'Contado'}
            </div>
            <div className="kpi-sub">
              {fvc >= 0 ? '+' : ''}
              {fmtMXN(fvc)} en valor presente
            </div>
          </div>
        )}
        {R.isUberMode && (
          <div className="kpi accent">
            <div className="kpi-label">
              VPN del proyecto Uber <Info text={TIPS.npv} />
            </div>
            <div
              className="kpi-value mono"
              style={{ color: R.npvProject >= 0 ? 'var(--pos)' : 'var(--neg)' }}
            >
              {fmtMXN(R.npvProject)}
            </div>
            <div className="kpi-sub">
              TIR: {isFinite(R.irrProject) ? fmtPct(R.irrProject, 1) : '—'} vs descuento{' '}
              {fmtPct(R.discountAnnual, 1)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
