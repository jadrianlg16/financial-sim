import { fmtFixed, fmtMXN, fmtN, fmtPct } from '../../domain/format.js';

// Formulas 11–18: NPV, IRR, EAC, CAT, finance vs. cash, cost per km, insurance
// as a share of value, EV charging time and range.
export const EconomicsFormulas = ({ result, inputs }) => {
  return (
    <>
      <div className="formula-block" style={{ borderColor: 'var(--accent)' }}>
        <div className="formula-name">11 · Valor Presente Neto (VPN / NPV)</div>
        <div className="formula-eq">
          VPN <span className="op">=</span> <span style={{ fontSize: '0.8em' }}>Σ</span>
          <span className="frac">
            <span>
              FE<sub>t</sub>
            </span>
            <span>
              (1 + k)<sup>t</sup>
            </span>
          </span>
        </div>
        <div className="formula-where">
          <em>
            FE<sub>t</sub>
          </em>{' '}
          = flujo de efectivo del año <em>t</em> (− sale, + entra; t=0 es el desembolso inicial),{' '}
          <em>k</em> = tasa de descuento (oportunidad). VPN &gt; 0 = el proyecto crea valor frente a
          invertir tu dinero a la tasa <em>k</em>.
        </div>
        <div className="formula-substituted">
          k = {fmtPct(result.discountAnnual, 1)} · VPN del proyecto ={' '}
          <strong style={{ color: result.npvProject >= 0 ? 'var(--pos)' : 'var(--neg)' }}>
            {fmtMXN(result.npvProject)}
          </strong>{' '}
          · valor presente del costo de propiedad = <strong>{fmtMXN(result.pvLifetimeCost)}</strong>
        </div>
      </div>

      {isFinite(result.irrProject) && result.isUberMode && (
        <div className="formula-block">
          <div className="formula-name">12 · Tasa Interna de Retorno (TIR / IRR)</div>
          <div className="formula-eq">
            0 <span className="op">=</span> <span style={{ fontSize: '0.8em' }}>Σ</span>
            <span className="frac">
              <span>
                FE<sub>t</sub>
              </span>
              <span>
                (1 + TIR)<sup>t</sup>
              </span>
            </span>
          </div>
          <div className="formula-where">
            La tasa que hace VPN = 0: el rendimiento anual real del proyecto. Conviene si TIR &gt;
            tasa de descuento.
          </div>
          <div className="formula-substituted">
            TIR = <strong>{fmtPct(result.irrProject, 1)}</strong> vs descuento{' '}
            {fmtPct(result.discountAnnual, 1)} →{' '}
            {result.irrProject >= result.discountAnnual
              ? 'crea valor'
              : 'no supera tu costo de oportunidad'}
          </div>
        </div>
      )}

      <div className="formula-block" style={{ borderColor: 'var(--accent)' }}>
        <div className="formula-name">13 · Costo Anual Equivalente (CAE / EAC)</div>
        <div className="formula-eq">
          CAE <span className="op">=</span> VP<sub>costo</sub> <span className="op">÷</span>
          <span className="frac">
            <span>
              1 − (1 + k)<sup>−N</sup>
            </span>
            <span>k</span>
          </span>
        </div>
        <div className="formula-where">
          Convierte el costo total (en valor presente) en una renta anual uniforme. Es el comparador
          correcto entre autos que conservas distinto número de años: el de menor CAE es el de mejor
          valor.
        </div>
        <div className="formula-substituted">
          CAE = {fmtMXN(result.pvLifetimeCost)} ÷ factor(k={fmtPct(result.discountAnnual, 1)}, N=
          {inputs.horizonYears}) = <strong>{fmtMXN(result.eac)}/año</strong>
        </div>
      </div>

      {result.financed > 0 && (
        <div className="formula-block">
          <div className="formula-name">14 · CAT y tasa efectiva anual</div>
          <div className="formula-eq">
            (P − comisión) <span className="op">=</span> A ·{' '}
            <span className="frac">
              <span>
                1 − (1+j)<sup>−n</sup>
              </span>
              <span>j</span>
            </span>{' '}
            <span className="op">;</span> CAT = (1+j)<sup>12</sup> − 1
          </div>
          <div className="formula-where">
            <em>j</em> = tasa mensual que iguala lo que REALMENTE recibes (financiado − comisión de
            apertura) con tus pagos. El CAT incluye la comisión; por eso es mayor que el interés de
            lista.
          </div>
          <div className="formula-substituted">
            Interés lista {fmtPct(inputs.interestRate, 1)} · efectiva {fmtPct(result.ear, 1)} ·{' '}
            <strong>CAT {fmtPct(result.cat, 1)}</strong>
          </div>
        </div>
      )}

      {result.financed > 0 && (
        <div className="formula-block">
          <div className="formula-name">15 · ¿Financiar o pagar de contado?</div>
          <div className="formula-eq">
            Δ <span className="op">=</span> Precio<sub>contado</sub> <span className="op">−</span>{' '}
            [Enganche + Comisión + VP<sub>pagos</sub>(k)]
          </div>
          <div className="formula-where">
            Compara, en valor de hoy, pagar de contado vs. financiar invirtiendo tu dinero a la tasa
            de oportunidad <em>k</em>. Δ &gt; 0 = financiar conviene (tu dinero rinde más que el
            crédito).
          </div>
          <div className="formula-substituted">
            Δ = {fmtMXN(result.pvCashPath)} − {fmtMXN(result.pvFinancedPath)} ={' '}
            <strong style={{ color: result.financeVsCashPV >= 0 ? 'var(--pos)' : 'var(--neg)' }}>
              {fmtMXN(result.financeVsCashPV)}
            </strong>{' '}
            → {result.financeVsCashPV >= 0 ? 'financiar' : 'contado'} conviene
          </div>
        </div>
      )}

      {isFinite(result.costPerKm) && (
        <div className="formula-block">
          <div className="formula-name">16 · Costo total de propiedad por km</div>
          <div className="formula-eq">
            $/km <span className="op">=</span>
            <span className="frac">
              <span>TCO</span>
              <span>
                km<sub>totales</sub>
              </span>
            </span>
          </div>
          <div className="formula-where">
            TCO = costo neto de propiedad; km totales = (km Uber + km personales) × horizonte.
          </div>
          <div className="formula-substituted">
            $/km = {fmtMXN(result.tcoTotal)} ÷ {fmtN(result.totalKmHorizon)} km ={' '}
            <strong>{fmtMXN(result.costPerKm, 2)}/km</strong>
          </div>
        </div>
      )}

      {result.insuranceMode === 'pctOfValue' && (
        <div className="formula-block">
          <div className="formula-name">16-bis · Seguro como % del valor</div>
          <div className="formula-eq">
            Prima<sub>año y</sub> <span className="op">=</span> p<sub>seg</sub>{' '}
            <span className="op">×</span> V<sub>inicio año y</sub>
          </div>
          <div className="formula-where">
            <em>
              p<sub>seg</sub>
            </em>{' '}
            = {fmtPct(result.insurancePctOfValue, 1)}/año del valor asegurado. Como el auto se
            deprecia, la prima BAJA cada año (realista para cobertura amplia). El KPI de seguro
            muestra el valor del año 1.
          </div>
          <div className="formula-substituted">
            Prima año 1 = {fmtPct(result.insurancePctOfValue, 1)} × {fmtMXN(inputs.carPrice)} ={' '}
            {fmtMXN(result.insurancePctOfValue * inputs.carPrice)}/año ={' '}
            <strong>{fmtMXN(result.monthlyIns)}/mes</strong> (declina con la depreciación)
          </div>
        </div>
      )}

      {result.chargingHoursPerDay > 0 && (
        <div className="formula-block">
          <div className="formula-name">17 · Tiempo de carga eléctrica diario</div>
          <div className="formula-eq">
            t<sub>carga</sub> <span className="op">=</span>
            <span className="frac">
              <span>
                km<sub>diarios</sub> / η<sub>eléc</sub>
              </span>
              <span>
                P<sub>cargador</sub>
              </span>
            </span>
          </div>
          <div className="formula-where">
            <em>
              η<sub>eléc</sub>
            </em>{' '}
            = km/kWh,{' '}
            <em>
              P<sub>cargador</sub>
            </em>{' '}
            = potencia del cargador.
          </div>
          <div className="formula-substituted">
            t<sub>carga</sub> = ({fmtN(result.totalDailyKm, 1)} / {inputs.kmPerKwh}) /{' '}
            {inputs.chargerPowerKw} ={' '}
            <strong>{fmtFixed(result.chargingHoursPerDay)} hrs/día</strong>
          </div>
        </div>
      )}
      {result.isEV && (
        <div className="formula-block">
          <div className="formula-name">18 · Autonomía eléctrica</div>
          <div className="formula-eq">
            Rango <span className="op">=</span> batería <span className="op">×</span> 90%{' '}
            <span className="op">×</span> km/kWh
          </div>
          <div className="formula-where">
            Si los km diarios superan una carga útil, el plan no se marca viable.
          </div>
          <div className="formula-substituted">
            Rango = {fmtN(result.usableKwh, 1)} kWh × {inputs.kmPerKwh} ={' '}
            <strong>{fmtN(result.dailyRangeKm, 0)} km/día</strong>; uso ={' '}
            <strong>{fmtN(result.totalDailyKm, 0)} km/día</strong>
          </div>
        </div>
      )}
    </>
  );
};
