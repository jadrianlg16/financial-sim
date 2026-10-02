import { fmtMXN, fmtPct } from '../../domain/format.js';

// Formulas 1–4: the loan payment (and the balloon and lease variants), present
// and future value, and the cost of money.
export const CreditFormulas = ({ result, inputs }) => {
  const i = inputs.interestRate / 12;
  const n = result.months;
  return (
    <>
      <div className="formula-block">
        <div className="formula-name">1 · Mensualidad del crédito (anualidad)</div>
        <div className="formula-eq">
          A <span className="op">=</span> P <span className="op">×</span>
          <span className="frac">
            <span>
              i (1 + i)<sup>n</sup>
            </span>
            <span>
              (1 + i)<sup>n</sup> − 1
            </span>
          </span>
        </div>
        <div className="formula-where">
          <em>P</em> = lo que financias, <em>i</em> = tasa mensual = anual ÷ 12, <em>n</em> = meses.{' '}
          {result.isLease
            ? 'En arrendamiento NO se financia el auto: la "mensualidad" es la renta fija que capturas.'
            : result.isBalloon
              ? 'En crédito con pago final (globo), la mensualidad usa la fórmula 1-bis (residual).'
              : ''}
        </div>
        <div className="formula-substituted">
          A = {fmtMXN(result.financed)} × [{i.toFixed(5)} × (1+{i.toFixed(5)})^{n}] / [(1+
          {i.toFixed(5)}
          )^{n} − 1] ={' '}
          <strong>
            {fmtMXN(
              result.isLease
                ? result.financed > 0
                  ? 0
                  : result.monthlyPayment
                : result.monthlyPayment,
            )}
            /mes
          </strong>
          {result.isLease && (
            <>
              {' '}
              · renta arrendamiento = <strong>{fmtMXN(result.leaseMonthly)}/mes</strong>
            </>
          )}
        </div>
      </div>

      {result.isBalloon && result.financed > 0 && (
        <div className="formula-block" style={{ borderColor: 'var(--accent)' }}>
          <div className="formula-name">1-bis · Crédito con pago final (globo / residual)</div>
          <div className="formula-eq">
            A <span className="op">=</span> (P − B·(1+i)<sup>−n</sup>) <span className="op">×</span>
            <span className="frac">
              <span>
                i (1 + i)<sup>n</sup>
              </span>
              <span>
                (1 + i)<sup>n</sup> − 1
              </span>
            </span>{' '}
            <span className="op">;</span> Globo <span className="op">=</span> B
          </div>
          <div className="formula-where">
            <em>B</em> = valor residual ({fmtPct(result.balloonPct, 0)} del financiado) que NO se
            amortiza en las mensualidades y se paga (o refinancia) al final del plazo. Por eso la
            mensualidad es menor que en un crédito tradicional, pero queda un pago grande al cierre.
          </div>
          <div className="formula-substituted">
            B = {fmtPct(result.balloonPct, 0)} × {fmtMXN(result.financed)} ={' '}
            {fmtMXN(result.balloonAmount)} · A ={' '}
            <strong>{fmtMXN(result.monthlyPayment)}/mes</strong> · pago final del globo en el mes{' '}
            {result.months} = <strong>{fmtMXN(result.balloonAmount)}</strong>
          </div>
        </div>
      )}

      {result.isLease && (
        <div className="formula-block" style={{ borderColor: 'var(--accent)' }}>
          <div className="formula-name">1-ter · Arrendamiento (sin propiedad)</div>
          <div className="formula-eq">
            TCO<sub>lease</sub> <span className="op">=</span> Inicial <span className="op">+</span>{' '}
            Σ renta <span className="op">+</span> Operativos <span className="op">+</span>{' '}
            Penalización<sub>km</sub>
          </div>
          <div className="formula-where">
            No eres dueño: financiado = 0, sin reventa ni depreciación a tu favor (recuperación
            terminal = 0). El pago inicial NO se recupera. Seguro, energía, refrendo y mantenimiento
            los pagas igual. Si los km del año superan el límite del contrato, se cobra una
            penalización por km excedente.
          </div>
          <div className="formula-substituted">
            Inicial {fmtMXN(result.cashPaid)} + renta {fmtMXN(result.leaseMonthly)}/mes ×{' '}
            {Math.min(result.months, inputs.horizonYears * 12)} meses
            {result.leaseKmPenaltyYear > 0 && (
              <> + penalización km {fmtMXN(result.leaseKmPenaltyYear)}/año</>
            )}{' '}
            · recuperación terminal = <strong>{fmtMXN(result.terminalRecovery)}</strong> · TCO ={' '}
            <strong>{fmtMXN(result.tcoTotal)}</strong>
          </div>
        </div>
      )}

      <div className="formula-block">
        <div className="formula-name">2 · Valor Presente (VP)</div>
        <div className="formula-eq">
          VP <span className="op">=</span> A <span className="op">×</span>
          <span className="frac">
            <span>
              1 − (1 + i)<sup>−n</sup>
            </span>
            <span>i</span>
          </span>{' '}
          <span className="op">+</span> Enganche
        </div>
        <div className="formula-where">Trae cada mensualidad futura a valor de hoy.</div>
        <div className="formula-substituted">
          VP = {fmtMXN(result.monthlyPayment)} × [1−(1+{i.toFixed(5)})^−{n}]/{i.toFixed(5)} +{' '}
          {fmtMXN(result.cashPaid)} = <strong>{fmtMXN(result.pvTotal)}</strong>
        </div>
      </div>

      <div className="formula-block">
        <div className="formula-name">3 · Valor Futuro (VF)</div>
        <div className="formula-eq">
          VF <span className="op">=</span> A <span className="op">×</span> n{' '}
          <span className="op">+</span> Enganche <span className="op">+</span> Comisiones
        </div>
        <div className="formula-substituted">
          VF = {fmtMXN(result.monthlyPayment)} × {n} + {fmtMXN(result.cashPaid)} +{' '}
          {fmtMXN(result.openingFee)} = <strong>{fmtMXN(result.fvTotal)}</strong>
        </div>
      </div>

      <div className="formula-block">
        <div className="formula-name">4 · Costo del dinero</div>
        <div className="formula-eq">
          Δ <span className="op">=</span> VF <span className="op">−</span> VP
        </div>
        <div className="formula-where">Lo que cuesta pagar a plazos en vez de de contado.</div>
        <div className="formula-substituted">
          Δ = {fmtMXN(result.fvTotal)} − {fmtMXN(result.pvTotal)} ={' '}
          <strong>{fmtMXN(result.timeValueOfMoney)}</strong>
        </div>
      </div>
    </>
  );
};
