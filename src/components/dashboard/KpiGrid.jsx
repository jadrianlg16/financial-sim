import { Info } from '../ui/Info.jsx';
import { TIPS } from '../../content/tips.js';
import { fmtFixed, fmtMXN, fmtN, fmtPct } from '../../domain/format.js';
import { projectionYear } from '../../domain/year.js';

// Main KPIs: day-one cash, loan payment and its present/future value, monthly
// cost, break-even, resale value, net project cost and liquidation result.
export const KpiGrid = ({ result, inputs }) => {
  return (
    <div className="kpi-grid">
      <div className="kpi">
        <div className="kpi-label">
          Desembolso inicial{' '}
          <Info text="Todo lo que pagas el primer día: enganche/efectivo + comisión de apertura + trámites iniciales de Uber + gastos de adquisición." />
        </div>
        <div className="kpi-value mono">{fmtMXN(result.upfrontCash)}</div>
        <div className="kpi-sub">
          {inputs.purchaseMode === 'cash'
            ? 'Pago de contado'
            : inputs.purchaseMode === 'hybrid'
              ? 'Mixto efectivo + crédito'
              : `${fmtPct(result.cashPaid / inputs.carPrice, 0)} enganche`}
          {result.oneTimeUberCosts > 0 && ` + ${fmtMXN(result.oneTimeUberCosts)} trámites`}
        </div>
      </div>
      {result.financed > 0 && (
        <>
          <div className="kpi">
            <div className="kpi-label">
              {result.isBalloon ? 'Mensualidad (con globo)' : 'Mensualidad'}{' '}
              <Info text={TIPS.monthlyPayment} />
            </div>
            <div className="kpi-value mono">{fmtMXN(result.monthlyPayment)}</div>
            <div className="kpi-sub">
              {result.isBalloon
                ? `× ${result.months} meses · menor por el residual`
                : `× ${result.months} meses`}
            </div>
          </div>
          {result.isBalloon && (
            <div className="kpi accent">
              <div className="kpi-label">
                Pago final (globo){' '}
                <Info text="Valor residual no amortizado que pagas (o refinancias) al final del plazo para quedarte el auto, o que saldas vendiéndolo." />
              </div>
              <div className="kpi-value mono">{fmtMXN(result.balloonPayment)}</div>
              <div className="kpi-sub">
                en el mes {result.months} · {fmtPct(result.balloonPct, 0)} del financiado
              </div>
            </div>
          )}
          <div className="kpi">
            <div className="kpi-label">
              Costo total nominal (VF) <Info text={TIPS.vf} />
            </div>
            <div className="kpi-value mono">{fmtMXN(result.fvTotal)}</div>
            <div className="kpi-sub">Suma de TODO lo del crédito</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">
              Valor presente (VP) <Info text={TIPS.vp} />
            </div>
            <div className="kpi-value mono">{fmtMXN(result.pvTotal)}</div>
            <div className="kpi-sub">Equivalente en dinero de hoy</div>
          </div>
          <div className="kpi accent">
            <div className="kpi-label">
              Costo del dinero <Info text={TIPS.timeValue} />
            </div>
            <div className="kpi-value mono">{fmtMXN(result.timeValueOfMoney)}</div>
            <div className="kpi-sub">Intereses: {fmtMXN(result.totalInterest)}</div>
          </div>
        </>
      )}
      <div className="kpi">
        <div className="kpi-label">
          Costo mensual total <Info text={TIPS.monthlyTotal} />
        </div>
        <div className="kpi-value mono">{fmtMXN(result.monthlyTotalOperative)}</div>
        <div className="kpi-sub">todo lo del auto por mes</div>
      </div>
      {result.isUberMode && (
        <div className="kpi accent">
          <div className="kpi-label">
            Punto de equilibrio <Info text={TIPS.breakeven} />
          </div>
          <div className="kpi-value mono">{fmtN(result.breakEvenTrips, 0)}</div>
          <div className="kpi-sub">viajes/mes · {fmtFixed(result.hoursPerDay)} hrs/día</div>
        </div>
      )}
      <div className="kpi">
        <div className="kpi-label">
          Valor en {projectionYear(inputs.horizonYears)} <Info text={TIPS.depreciation} />
        </div>
        <div className="kpi-value mono">{fmtMXN(result.valueAtEnd)}</div>
        <div className="kpi-sub">Esperado al vender: {fmtMXN(result.actualSalePrice)}</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">
          Costo neto del proyecto <Info text={TIPS.totalProject} />
        </div>
        <div className="kpi-value mono">{fmtMXN(result.totalProjectCost)}</div>
        <div className="kpi-sub">gasto − (venta − deuda)</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">
          Resultado de liquidación <Info text={TIPS.liquidation} />
        </div>
        <div
          className="kpi-value mono"
          style={{ color: result.liquidationPosition >= 0 ? 'var(--pos)' : 'var(--neg)' }}
        >
          {fmtMXN(result.liquidationPosition)}
        </div>
        <div className="kpi-sub">Venta − deuda restante</div>
      </div>
      {result.isUberMode && (
        <div className="kpi accent">
          <div className="kpi-label">
            Resultado neto del proyecto <Info text={TIPS.netResult} />
          </div>
          <div
            className="kpi-value mono"
            style={{ color: result.netProjectResult >= 0 ? 'var(--pos)' : 'var(--neg)' }}
          >
            {fmtMXN(result.netProjectResult)}
          </div>
          <div className="kpi-sub">ingresos + liquidación − gastos</div>
        </div>
      )}
      {result.chargingHoursPerDay > 0 && (
        <div className="kpi electric">
          <div className="kpi-label">Tiempo de carga</div>
          <div className="kpi-value mono">{fmtFixed(result.chargingHoursPerDay)}</div>
          <div className="kpi-sub">hrs/día · cargador {inputs.chargerPowerKw} kW</div>
        </div>
      )}
    </div>
  );
};
