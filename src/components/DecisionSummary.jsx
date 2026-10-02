import { Calculator } from 'lucide-react';
import { Info } from './ui/Info.jsx';
import { TIPS } from '../content/tips.js';
import { fmtFixed, fmtMXN, fmtN, fmtPct } from '../domain/format.js';

// ============================================================================
// BLOQUE: RESUMEN DE DECISIÓN DE COMPRA
// ----------------------------------------------------------------------------
// Las cifras que mueven una decisión de compra, con ingeniería económica: TCO,
// costo por km, CAE (compara autos con horizontes distintos), valor presente del
// costo, costo por depreciación, CAT y financiar contra contado. Aplica en todos
// los modos, incluido "Sin Uber".
// ============================================================================
export const DecisionSummary = ({ result, inputs }) => {
  const financed = result.financed > 0;
  const fvc = result.financeVsCashPV;
  // Titular en lenguaje sencillo: una sola frase que resume la conclusión, construida
  // desde result y consciente de arrendamiento y Uber. Va antes de las tarjetas KPI.
  const headline = (() => {
    const costoTxt = result.isLease
      ? `Rentar este auto te cuesta ~${fmtMXN(result.monthlyTotalOperative)} al mes`
      : `Este auto te cuesta ~${fmtMXN(result.monthlyTotalOperative)} al mes`;
    const kmTxt = isFinite(result.costPerKm) ? ` y ${fmtMXN(result.costPerKm, 2)} por km` : '';
    // Verdict de pago: lease, financiado (financiar vs contado) o contado.
    let pagoTxt;
    if (result.isLease) {
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
      result.isUberMode &&
      result.feasible &&
      isFinite(result.hoursPerWeek) &&
      result.hoursPerWeek > 0
        ? ` Trabajando en Uber se paga solo con ~${fmtFixed(result.hoursPerWeek)} hrs/semana al volante.`
        : result.isUberMode
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
        una tasa de oportunidad de {fmtPct(result.discountAnnual, 1)}. Compara autos por su{' '}
        <strong>CAE</strong> (menor = mejor) y por su <strong>costo por km</strong>.
      </div>
      <div className="kpi-grid" style={{ marginBottom: 0 }}>
        <div className="kpi accent">
          <div className="kpi-label">
            Costo total de propiedad <Info text={TIPS.tco} />
          </div>
          <div className="kpi-value mono">{fmtMXN(result.tcoTotal)}</div>
          <div className="kpi-sub">
            {fmtMXN(result.tcoPerYear)}/año · {inputs.horizonYears} años
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">
            Costo por kilómetro <Info text={TIPS.costPerKm} />
          </div>
          <div className="kpi-value mono">
            {isFinite(result.costPerKm) ? fmtMXN(result.costPerKm, 2) : '—'}
          </div>
          <div className="kpi-sub">
            {isFinite(result.costPerKm)
              ? `${fmtN(result.totalKmHorizon)} km en total`
              : 'agrega km personales'}
          </div>
        </div>
        <div className="kpi accent">
          <div className="kpi-label">
            Costo anual equivalente <Info text={TIPS.eac} />
          </div>
          <div className="kpi-value mono">{fmtMXN(result.eac)}</div>
          <div className="kpi-sub">renta anual equivalente · comparador justo</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">
            Valor presente del costo <Info text={TIPS.npv} />
          </div>
          <div className="kpi-value mono">{fmtMXN(result.pvLifetimeCost)}</div>
          <div className="kpi-sub">todo el costo, traído a hoy</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">
            Costo por depreciación <Info text={TIPS.depreciationCost} />
          </div>
          <div className="kpi-value mono">{fmtMXN(result.depreciationCost)}</div>
          <div className="kpi-sub">
            {fmtPct(result.depreciationCost / Math.max(1, result.carPrice), 0)} del precio se esfuma
          </div>
        </div>
        {financed && (
          <div className="kpi">
            <div className="kpi-label">
              CAT real del crédito <Info text={TIPS.cat} />
            </div>
            <div className="kpi-value mono">{fmtPct(result.cat, 1)}</div>
            <div className="kpi-sub">
              interés de lista {fmtPct(inputs.interestRate, 1)} · efectiva {fmtPct(result.ear, 1)}
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
        {result.isUberMode && (
          <div className="kpi accent">
            <div className="kpi-label">
              VPN del proyecto Uber <Info text={TIPS.npv} />
            </div>
            <div
              className="kpi-value mono"
              style={{ color: result.npvProject >= 0 ? 'var(--pos)' : 'var(--neg)' }}
            >
              {fmtMXN(result.npvProject)}
            </div>
            <div className="kpi-sub">
              TIR: {isFinite(result.irrProject) ? fmtPct(result.irrProject, 1) : '—'} vs descuento{' '}
              {fmtPct(result.discountAnnual, 1)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
