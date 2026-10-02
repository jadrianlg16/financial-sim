import { effectiveDepRate } from '../domain/depreciation.js';
import { fmtFixed, fmtMXN, fmtN, fmtPct } from '../domain/format.js';
import { projectionYear } from '../domain/year.js';

// ============================================================================
// PÁGINA: FÓRMULAS
// ----------------------------------------------------------------------------
// Cada ecuación del simulador con los valores actuales sustituidos, para auditar
// de dónde sale cada número: anualidad (más globo y arrendamiento), VP, VF, costo
// del dinero, depreciación, contribución por viaje, punto de equilibrio,
// intensidad de trabajo, inflación, costo y resultado neto, VPN, TIR, CAE, CAT,
// financiar vs. contado, $/km, seguro como % del valor, y carga y autonomía del
// EV. Cada fórmula explica sus términos en lenguaje simple.
// ============================================================================
export const Formulas = ({ result, inputs }) => {
  const i = inputs.interestRate / 12;
  const n = result.months;
  const dm = inputs.depreciationMethod || 'declining';
  const depName =
    dm === 'straight'
      ? 'lineal (saldo original)'
      : dm === 'realistic'
        ? 'realista (caída 1er año + saldo decreciente)'
        : 'saldo decreciente (geométrico)';
  // Tasa de depreciación efectiva: un usado deprecia más lento y se afina con la edad.
  const isUsedCar = inputs.vehicleCondition === 'used';
  const effDepRate = effectiveDepRate(inputs);
  return (
    <div style={{ maxWidth: 820 }}>
      <h1 className="serif" style={{ fontSize: 38, margin: '0 0 8px' }}>
        Fórmulas usadas
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: 28, lineHeight: 1.7 }}>
        Todas las ecuaciones del simulador con los valores actuales sustituidos. Las primeras son de
        ingeniería financiera de plazos (anualidad, VP/VF); las nuevas (VPN, TIR, CAE, CAT) son las
        que se usan en una decisión de inversión/compra real.
      </p>

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
    </div>
  );
};
