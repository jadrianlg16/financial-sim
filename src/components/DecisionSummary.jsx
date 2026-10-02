import { Calculator } from 'lucide-react';
import { Info } from './ui/Info.jsx';
import { TIPS } from '../content/tips.jsx';
import { fmtFixed, fmtMXN, fmtN, fmtPct } from '../domain/format.js';

// ============================================================================
// BLOQUE: RESUMEN DE DECISIÓN DE COMPRA
// ----------------------------------------------------------------------------
// Las cifras que mueven una decisión de compra, con ingeniería económica: TCO,
// costo por km, CAE (compara autos con horizontes distintos), valor presente del
// costo, costo por depreciación, CAT y financiar contra contado. Aplica en todos
// los modos, incluido "Sin Uber".
// ============================================================================
export const DecisionSummary = ({ R, inputs }) => {
  const financed = R.financed > 0;
  const fvc = R.financeVsCashPV;
  // Titular en lenguaje sencillo: una sola frase que resume la conclusión, construida
  // desde R y consciente de arrendamiento y Uber. Va antes de las tarjetas KPI.
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
