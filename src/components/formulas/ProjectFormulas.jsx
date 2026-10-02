import { effectiveDepRate } from '../../domain/depreciation.js';
import { fmtFixed, fmtMXN, fmtN, fmtPct } from '../../domain/format.js';
import { projectionYear } from '../../domain/year.js';

// Formulas 5–10: depreciation, contribution per trip, break-even, working
// hours, fuel inflation, and the net cost and result of the project.
export const ProjectFormulas = ({ result, inputs }) => {
  const dm = inputs.depreciationMethod || 'declining';
  const depName =
    dm === 'straight'
      ? 'lineal (saldo original)'
      : dm === 'realistic'
        ? 'realista (caída 1er año + saldo decreciente)'
        : 'saldo decreciente (geométrico)';
  // Effective depreciation rate: a used car depreciates more slowly, tuned by age.
  const isUsedCar = inputs.vehicleCondition === 'used';
  const effDepRate = effectiveDepRate(inputs);
  return (
    <>
      <div className="formula-block">
        <div className="formula-name">5 · Depreciación — método {depName}</div>
        <div className="formula-eq">
          {dm === 'straight' ? (
            <>
              V<sub>n</sub> <span className="op">=</span> V<sub>0</sub>{' '}
              <span className="op">×</span> (1 − d · n)
            </>
          ) : dm === 'realistic' ? (
            <>
              V<sub>1</sub> = V<sub>0</sub>(1 − d<sub>1</sub>) <span className="op">;</span> V
              <sub>n</sub> = V<sub>1</sub>(1 − d)<sup>n−1</sup>
            </>
          ) : (
            <>
              V<sub>n</sub> <span className="op">=</span> V<sub>0</sub>{' '}
              <span className="op">×</span> (1 − d)<sup>n</sup>
            </>
          )}
        </div>
        <div className="formula-where">
          <em>
            V<sub>0</sub>
          </em>{' '}
          = precio, <em>d</em> = tasa anual, <em>n</em> = años.{' '}
          {dm === 'straight'
            ? 'Resta el mismo monto del precio original cada año.'
            : dm === 'realistic'
              ? 'Caída fuerte el primer año y luego saldo decreciente (lo más realista para autos nuevos).'
              : 'Pierde el mismo % del valor RESTANTE cada año (saldo decreciente, lo estándar para autos).'}{' '}
          El activo nunca vale menos de 0.
          {isUsedCar && (
            <>
              {' '}
              <strong>Auto usado:</strong> deprecia más lento que uno nuevo — se usa la tasa de
              usados ({fmtPct(inputs.usedDepreciationRate, 0)}) afinada por la antigüedad,
              resultando en <strong>d = {fmtPct(effDepRate, 0)}/año</strong> (acotada 4%–30%) en vez
              de la tasa de lista de {fmtPct(inputs.depreciationRate, 0)}.
            </>
          )}
        </div>
        <div className="formula-substituted">
          d = {fmtPct(effDepRate, 0)}/año{isUsedCar && ' (usado)'} · V
          <sub>{inputs.horizonYears}</sub> = {fmtMXN(result.valueAtEnd)} (
          {fmtPct(result.valueAtEnd / Math.max(1, inputs.carPrice), 0)} del precio) · venta neta
          esperada {fmtMXN(result.actualSalePrice)} ·{' '}
          <strong>costo por depreciación {fmtMXN(result.depreciationCost)}</strong>
        </div>
      </div>

      <div className="formula-block">
        <div className="formula-name">6 · Contribución neta por viaje</div>
        <div className="formula-eq">
          Ingreso <span className="op">=</span> T − (T·c<sub>uber</sub>) − Impuesto{' '}
          <span className="op">;</span> Contrib <span className="op">=</span> Ingreso{' '}
          <span className="op">−</span> costo<sub>var</sub>·km<sub>viaje</sub>
        </div>
        <div className="formula-where">
          <em>T</em> = tarifa bruta,{' '}
          <em>
            c<sub>uber</sub>
          </em>{' '}
          = comisión. El <strong>impuesto depende del régimen fiscal</strong> elegido:
          {result.taxRegime === 'gross' && (
            <>
              {' '}
              régimen <strong>Bruto (simple)</strong>: impuesto = {fmtPct(result.taxRate, 0)} ×
              tarifa bruta. Es un supuesto simplificado que sobreestima el impuesto real.
            </>
          )}
          {result.taxRegime === 'net' && (
            <>
              {' '}
              régimen <strong>Utilidad</strong>: impuesto = {fmtPct(result.taxRate, 0)} × utilidad
              del viaje (tarifa − comisión − costo variable), nunca negativo.
            </>
          )}
          {result.taxRegime !== 'gross' && result.taxRegime !== 'net' && (
            <>
              {' '}
              régimen <strong>RESICO (realista)</strong>: retención de plataforma ={' '}
              {fmtPct(result.resicoRate, 1)} × tarifa bruta. Es lo que aplica hoy a la mayoría de
              conductores en México.
            </>
          )}{' '}
          El costo variable por km combina energía y mantenimiento base convertido a $/km con
          desgaste Uber.
        </div>
        <div className="formula-substituted">
          Ingreso = {fmtMXN(result.grossPerTrip)} − {fmtMXN(result.platformCommission, 2)} −
          impuesto {fmtMXN(result.taxAmountPerTrip, 2)} (
          {result.taxRegime === 'gross'
            ? 'bruto'
            : result.taxRegime === 'net'
              ? 'utilidad'
              : 'RESICO'}
          ) = {fmtMXN(result.netRevenuePerTrip, 2)} · Costo var ={' '}
          {fmtMXN(result.variableCostPerTrip, 2)} ·{' '}
          <strong>Contribución = {fmtMXN(result.netContributionPerTrip, 2)}/viaje</strong>
        </div>
      </div>

      <div className="formula-block">
        <div className="formula-name">7 · Punto de equilibrio (margen de contribución)</div>
        <div className="formula-eq">
          E <span className="op">=</span>
          <span className="frac">
            <span>
              C<sub>fijos</sub>
            </span>
            <span>
              Contrib<sub>viaje</sub>
            </span>
          </span>
        </div>
        <div className="formula-where">
          Costos mensuales + recuperación del proyecto + meta de ganancia. La recuperación del
          proyecto es la parte del desembolso inicial que no queda cubierta por venta final − deuda.
        </div>
        <div className="formula-substituted">
          E = ({fmtMXN(result.operatingFixedMonthlyCosts)} + {fmtMXN(result.projectRecoveryMonthly)}{' '}
          + {fmtMXN(result.profitTarget)}) ÷ {fmtMXN(result.netContributionPerTrip, 2)} ={' '}
          <strong>{fmtN(result.breakEvenTrips, 0)} viajes/mes</strong>
        </div>
      </div>

      <div className="formula-block">
        <div className="formula-name">8 · Intensidad de trabajo</div>
        <div className="formula-eq">
          h<sub>día</sub> <span className="op">=</span>
          <span className="frac">
            <span>E / d</span>
            <span>v</span>
          </span>
          <span className="op">;</span> h<sub>semana</sub> <span className="op">=</span> h
          <sub>día</sub> <span className="op">×</span> (d / 4.33)
        </div>
        <div className="formula-where">
          <em>d</em> = días/mes, <em>v</em> = viajes/hora (máx 4).
        </div>
        <div className="formula-substituted">
          h<sub>día</sub> = ({fmtN(result.breakEvenTrips, 0)}/{inputs.workDaysPerMonth})/
          {inputs.tripsPerHour} = <strong>{fmtFixed(result.hoursPerDay)} hrs/día</strong> · h
          <sub>semana</sub> = <strong>{fmtFixed(result.hoursPerWeek)} hrs/sem</strong>
        </div>
      </div>

      <div className="formula-block">
        <div className="formula-name">9 · Inflación del combustible</div>
        <div className="formula-eq">
          F<sub>n</sub> <span className="op">=</span> F<sub>0</sub> <span className="op">×</span> (1
          + i<sub>f</sub>)<sup>n</sup>
        </div>
        <div className="formula-where">
          Crecimiento geométrico del precio.{' '}
          <em>
            i<sub>f</sub>
          </em>{' '}
          = inflación anual.
        </div>
        <div className="formula-substituted">
          F<sub>{inputs.horizonYears}</sub> = ${inputs.fuelPrice.toFixed(2)} × (1+
          {inputs.fuelInflation})^{inputs.horizonYears} ={' '}
          <strong>
            $
            {(inputs.fuelPrice * Math.pow(1 + inputs.fuelInflation, inputs.horizonYears)).toFixed(
              2,
            )}
            /L
          </strong>{' '}
          en {projectionYear(inputs.horizonYears)}
        </div>
      </div>

      <div className="formula-block">
        <div className="formula-name">10 · Costo neto y resultado neto del proyecto</div>
        <div className="formula-eq">
          Recuperas <span className="op">=</span> Venta <span className="op">−</span> Deuda ; Costo
          <sub>neto</sub> <span className="op">=</span> Gasto<sub>total</sub>{' '}
          <span className="op">−</span> Recuperas ; Neto <span className="op">=</span> Ingresos{' '}
          <span className="op">+</span> Recuperas <span className="op">−</span> Gasto
          <sub>total</sub>
        </div>
        <div className="formula-where">
          Lo que recuperas al final es la venta MENOS la deuda viva (no la venta completa). El costo
          neto descuenta esa recuperación real; el resultado neto suma además los ingresos de Uber.
        </div>
        <div className="formula-substituted">
          Recuperas = venta − deuda = {fmtMXN(result.actualSalePrice)} −{' '}
          {fmtMXN(result.remainingDebt)} = {fmtMXN(result.terminalRecovery)} · Costo neto ={' '}
          {fmtMXN(result.totalSpentGross)} − {fmtMXN(result.terminalRecovery)} ={' '}
          <strong>{fmtMXN(result.totalProjectCost)}</strong> · Resultado neto ={' '}
          <strong style={{ color: result.netProjectResult >= 0 ? 'var(--pos)' : 'var(--neg)' }}>
            {fmtMXN(result.netProjectResult)}
          </strong>
        </div>
      </div>
    </>
  );
};
