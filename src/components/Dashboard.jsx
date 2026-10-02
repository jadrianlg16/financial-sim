import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Cell,
} from 'recharts';
import { Wallet, BarChart3, Activity, TrendingUp, Calculator, Battery } from 'lucide-react';
import { DecisionSummary } from './DecisionSummary.jsx';
import { IncomeImpact } from './IncomeImpact.jsx';
import { Verdict } from './Verdict.jsx';
import { Info } from './ui/Info.jsx';
import { TIPS } from '../content/tips.js';
import { fmtFixed, fmtMXN, fmtN, fmtPct } from '../domain/format.js';
import { projectionYear } from '../domain/year.js';

// ============================================================================
// PÁGINA: DASHBOARD
// ----------------------------------------------------------------------------
// Pantalla principal de resultados: el veredicto (viable, pesado, inviable o sólo
// costo), el resumen de decisión de compra, el impacto en el ingreso (sólo si se
// capturó), los KPIs del crédito y del proyecto con su explicación en un tooltip,
// y las gráficas de largo plazo: amortización, estructura mensual de costos, gasto
// acumulado por categoría (incluye el desembolso inicial) y valor del auto contra
// la deuda. Una tabla clasifica cada costo como fijo o variable y directo o
// indirecto.
// ============================================================================
export const Dashboard = ({ result, inputs }) => {
  const cashflowChart = result.cashflow.map((r) => ({
    year: r.year,
    Valor: Math.round(r.depValue),
    Deuda: Math.round(r.debtRemaining),
  }));
  const cumSpendChart = result.cashflow.map((r) => ({
    year: r.year,
    'Auto / crédito': r.cCar,
    Combustible: r.cEnergy,
    'Seguro + refrendo': r.cInsRef,
    Mantenimiento: r.cMaint,
    Otros: r.cOther,
  }));
  const fuelName =
    inputs.vehicleType === 'electric'
      ? 'Energía eléctrica'
      : inputs.vehicleType === 'diesel'
        ? 'Diésel'
        : 'Combustible';
  const costBreakdown = [
    inputs.purchaseMode !== 'cash' && {
      name: result.isLease ? 'Renta mensual' : 'Mensualidad crédito',
      value: result.monthlyPayment,
      color: '#b8431f',
      tipo: 'Fijo',
      dir: 'Directo',
    },
    {
      name: fuelName,
      value: result.monthlyFuel,
      color: '#d65a30',
      tipo: 'Variable',
      dir: 'Directo',
    },
    { name: 'Seguro', value: result.monthlyIns, color: '#a87819', tipo: 'Fijo', dir: 'Directo' },
    {
      name: 'Refrendo/Tenencia',
      value: result.monthlyRefrendo,
      color: '#6b3d8a',
      tipo: 'Fijo',
      dir: 'Directo',
    },
    {
      name: 'Mantenimiento',
      value: result.monthlyMaint,
      color: '#1f4d8a',
      tipo: 'Variable',
      dir: 'Directo',
    },
    result.monthlyData > 0 && {
      name: 'Datos móviles',
      value: result.monthlyData,
      color: '#7a6e5e',
      tipo: 'Fijo',
      dir: 'Directo',
    },
    result.monthlyCarWash > 0 && {
      name: 'Lavado',
      value: result.monthlyCarWash,
      color: '#0e6b6b',
      tipo: 'Variable',
      dir: 'Indirecto',
    },
    result.monthlyTips > 0 && {
      name: 'Propinas',
      value: result.monthlyTips,
      color: '#3a7d44',
      tipo: 'Variable',
      dir: 'Indirecto',
    },
    result.monthlyMisc > 0 && {
      name: 'Misceláneos',
      value: result.monthlyMisc,
      color: '#9c6b1f',
      tipo: 'Variable',
      dir: 'Indirecto',
    },
    result.monthlyAccess > 0 && {
      name: 'Accesorios',
      value: result.monthlyAccess,
      color: '#8a2727',
      tipo: 'Fijo',
      dir: 'Indirecto',
    },
  ].filter(Boolean);
  const amortChartData =
    result.amortRows.length > 0
      ? result.amortRows
          .filter((_, i) => i % 3 === 0 || i === result.amortRows.length - 1)
          .map((r) => ({
            month: r.month,
            Capital: Math.round(r.cumPrin),
            Interés: Math.round(r.cumInt),
            Saldo: Math.round(r.balance),
          }))
      : [];
  const cumColors = ['#b8431f', '#d65a30', '#a87819', '#1f4d8a', '#0e6b6b'];

  return (
    <>
      <Verdict result={result} inputs={inputs} />
      {!result.isUberMode && result.evRangeShortfall && (
        <div className="verdict bad" style={{ marginTop: -12 }}>
          <div className="verdict-icon">
            <Battery size={22} color="var(--neg)" />
          </div>
          <div>
            <div className="verdict-text">Autonomía eléctrica ajustada</div>
            <div className="verdict-sub">
              Manejas {fmtN(result.totalDailyKm)} km/día pero una carga rinde ~
              {fmtN(result.dailyRangeKm)} km. Esto bloquea la viabilidad hasta ajustar batería,
              carga, km por viaje o días de trabajo.
            </div>
          </div>
        </div>
      )}
      <DecisionSummary result={result} inputs={inputs} />
      <IncomeImpact result={result} inputs={inputs} />
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

      <div className="row-2">
        {result.amortRows.length > 0 ? (
          <div className="card">
            <div className="card-title">
              <BarChart3 size={11} />{' '}
              {result.isBalloon
                ? 'Amortización del crédito (con globo)'
                : 'Amortización del crédito'}{' '}
              <Info text={TIPS.amortization} />
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={amortChartData}>
                <CartesianGrid stroke="#e6dccc" strokeDasharray="2 4" />
                <XAxis dataKey="month" stroke="#7a6e5e" fontSize={11} />
                <YAxis
                  stroke="#7a6e5e"
                  fontSize={11}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v) => fmtMXN(v)}
                  contentStyle={{
                    background: '#fdfaf2',
                    border: '1px solid #d9cdb7',
                    borderRadius: 3,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area
                  type="monotone"
                  dataKey="Capital"
                  stackId="1"
                  fill="#b8431f"
                  stroke="#b8431f"
                  fillOpacity={0.7}
                />
                <Area
                  type="monotone"
                  dataKey="Interés"
                  stackId="1"
                  fill="#a87819"
                  stroke="#a87819"
                  fillOpacity={0.6}
                />
                <Line
                  type="monotone"
                  dataKey="Saldo"
                  stroke="#181410"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
            {result.isBalloon && (
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, marginBottom: 0 }}>
                La mensualidad es menor porque {fmtPct(result.balloonPct, 0)} del financiado queda
                como <strong>pago final ("globo") de {fmtMXN(result.balloonPayment)}</strong> en el
                mes {result.months}; por eso el saldo no llega a cero al amortizar.
              </p>
            )}
          </div>
        ) : result.isLease ? (
          <div className="card">
            <div className="card-title">
              <Wallet size={11} /> Arrendamiento (renta)
            </div>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 0 }}>
              No es un crédito: <strong style={{ color: 'var(--ink)' }}>rentas</strong> el auto por{' '}
              <strong style={{ color: 'var(--ink)' }}>{fmtMXN(result.monthlyPayment)}/mes</strong>.
              No eres dueño, así que <strong>no hay reventa ni capital (equity)</strong> a tu favor.
            </p>
            <table className="tbl" style={{ marginTop: 6 }}>
              <tbody>
                <tr>
                  <td>Renta mensual</td>
                  <td className="num">{fmtMXN(result.monthlyPayment)}</td>
                </tr>
                <tr>
                  <td>Plazo del arrendamiento</td>
                  <td className="num">{result.months} meses</td>
                </tr>
                <tr>
                  <td>Enganche/depósito inicial</td>
                  <td className="num">{fmtMXN(result.cashPaid)}</td>
                </tr>
                {result.leaseKmPenaltyYear > 0 && (
                  <tr>
                    <td>Penalización por exceso de km</td>
                    <td className="num neg">{fmtMXN(result.leaseKmPenaltyYear)}/año</td>
                  </tr>
                )}
                <tr>
                  <td>Capital acumulado (equity)</td>
                  <td className="num">{fmtMXN(0)}</td>
                </tr>
              </tbody>
            </table>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, marginBottom: 0 }}>
              Seguro, gasolina y mantenimiento corren por tu cuenta como arrendatario.
            </p>
          </div>
        ) : (
          <div className="card">
            <div className="card-title">
              <Wallet size={11} /> Compra en efectivo
            </div>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 0 }}>
              No hay financiamiento. Pagaste{' '}
              <strong style={{ color: 'var(--ink)' }}>{fmtMXN(result.cashPaid)}</strong> al momento
              de la compra.
            </p>
            <p style={{ fontSize: 12, color: 'var(--muted)' }}>
              <strong>Costo de oportunidad:</strong> ese dinero invertido en CETES (~10% anual)
              generaría aproximadamente{' '}
              <strong>{fmtMXN(result.cashPaid * 0.1 * inputs.horizonYears)}</strong> en{' '}
              {inputs.horizonYears} años.
            </p>
          </div>
        )}
        <div className="card">
          <div className="card-title">
            <BarChart3 size={11} /> Estructura mensual de costos <Info text={TIPS.costStructure} />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={costBreakdown} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid stroke="#e6dccc" strokeDasharray="2 4" horizontal={false} />
              <XAxis
                type="number"
                stroke="#7a6e5e"
                fontSize={11}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <YAxis type="category" dataKey="name" stroke="#7a6e5e" fontSize={10} width={120} />
              <Tooltip
                formatter={(v) => fmtMXN(v)}
                contentStyle={{
                  background: '#fdfaf2',
                  border: '1px solid #d9cdb7',
                  borderRadius: 3,
                }}
              />
              <Bar dataKey="value" radius={[0, 2, 2, 0]}>
                {costBreakdown.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div
            style={{
              textAlign: 'right',
              marginTop: 8,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12,
            }}
          >
            Total mensual: <strong>{fmtMXN(result.monthlyTotalOperative)}</strong>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-title">
          <TrendingUp size={11} /> Gasto total acumulado a lo largo del proyecto{' '}
          <Info text={TIPS.cumSpend} />
        </div>
        <div className="card-blurb">
          Cuánto dinero llevas gastado en total conforme pasan los años, apilado por categoría. El
          año 1 incluye tu desembolso inicial (enganche + comisión + trámites Uber).
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={cumSpendChart}>
            <CartesianGrid stroke="#e6dccc" strokeDasharray="2 4" />
            <XAxis dataKey="year" stroke="#7a6e5e" fontSize={11} />
            <YAxis
              stroke="#7a6e5e"
              fontSize={11}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(v) => fmtMXN(v)}
              contentStyle={{ background: '#fdfaf2', border: '1px solid #d9cdb7', borderRadius: 3 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {['Auto / crédito', 'Combustible', 'Seguro + refrendo', 'Mantenimiento', 'Otros'].map(
              (k, i) => (
                <Area
                  key={k}
                  type="monotone"
                  dataKey={k}
                  stackId="1"
                  stroke={cumColors[i]}
                  fill={cumColors[i]}
                  fillOpacity={0.65}
                />
              ),
            )}
          </AreaChart>
        </ResponsiveContainer>
        <div
          style={{
            textAlign: 'right',
            marginTop: 8,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12,
          }}
        >
          Gasto bruto total: <strong>{fmtMXN(result.totalSpentGross)}</strong> · Neto tras vender:{' '}
          <strong>{fmtMXN(result.totalProjectCost)}</strong>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-title">
          <Calculator size={11} /> Clasificación contable de costos{' '}
          <Info text="<strong>Fijo:</strong> mismo monto sin importar cuánto uses el auto.<br/><strong>Variable:</strong> depende de cuánto manejes.<br/><strong>Directo:</strong> esencial para operar.<br/><strong>Indirecto:</strong> de apoyo." />
        </div>
        <div className="card-blurb">
          Clasificación contable estándar de cada costo: fijo o variable, directo o indirecto.
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Costo</th>
              <th>Naturaleza</th>
              <th>Tipo</th>
              <th className="num">Mensual</th>
              <th className="num">Anual</th>
            </tr>
          </thead>
          <tbody>
            {costBreakdown.map((c, i) => (
              <tr key={i}>
                <td style={{ fontFamily: 'Manrope', fontWeight: 500 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: 50,
                      background: c.color,
                      marginRight: 8,
                    }}
                  />
                  {c.name}
                </td>
                <td>{c.tipo}</td>
                <td>{c.dir}</td>
                <td className="num">{fmtMXN(c.value)}</td>
                <td className="num">{fmtMXN(c.value * 12)}</td>
              </tr>
            ))}
            {result.oneTimeUberCosts > 0 && (
              <tr style={{ background: 'var(--bg-2)' }}>
                <td style={{ fontFamily: 'Manrope', fontWeight: 500 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: 50,
                      background: '#181410',
                      marginRight: 8,
                    }}
                  />
                  Trámites iniciales Uber (único)
                </td>
                <td>Único</td>
                <td>Directo</td>
                <td className="num">—</td>
                <td className="num">{fmtMXN(result.oneTimeUberCosts)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-title">
          <TrendingUp size={11} /> Valor del auto vs lo que aún debes{' '}
          <Info text="<strong>Verde:</strong> cuánto vale el auto cada año (baja por depreciación). <strong>Rojo:</strong> cuánto aún debes del crédito." />
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={cashflowChart}>
            <CartesianGrid stroke="#e6dccc" strokeDasharray="2 4" />
            <XAxis dataKey="year" stroke="#7a6e5e" fontSize={11} />
            <YAxis
              stroke="#7a6e5e"
              fontSize={11}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(v) => fmtMXN(v)}
              contentStyle={{ background: '#fdfaf2', border: '1px solid #d9cdb7', borderRadius: 3 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line
              type="monotone"
              dataKey="Valor"
              stroke="#2f6a3b"
              strokeWidth={2.5}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="Deuda"
              stroke="#b8431f"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              strokeDasharray="4 4"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {result.isUberMode && (
        <div className="card">
          <div className="card-title">
            <Activity size={11} /> Plan de operación sugerido{' '}
            <Info text="Lo que tendrías que trabajar para alcanzar tu objetivo." />
          </div>
          <table className="tbl">
            <tbody>
              <tr>
                <td>Ingreso neto antes de km</td>
                <td className="num pos">{fmtMXN(result.netRevenuePerTrip, 2)}</td>
                <td>
                  Tarifa {fmtMXN(result.grossPerTrip)} − Uber {fmtMXN(result.platformCommission, 2)}{' '}
                  − impuesto bruto {fmtMXN(result.taxAmountPerTrip, 2)}
                </td>
              </tr>
              <tr>
                <td>(−) Costo variable por viaje</td>
                <td className="num neg">{fmtMXN(result.variableCostPerTrip, 2)}</td>
                <td>
                  {fmtN(result.kmPerTrip, 1)} km/viaje × (energía + mantenimiento base/km con
                  desgaste Uber)
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Contribución por viaje</strong> <Info text={TIPS.kmPerTrip} />
                </td>
                <td className="num">
                  <strong>{fmtMXN(result.netContributionPerTrip, 2)}</strong>
                </td>
                <td>lo que cada viaje aporta a cubrir fijos</td>
              </tr>
              <tr>
                <td>Equilibrio operativo</td>
                <td className="num">{fmtN(result.operatingBreakEvenTrips, 0)}</td>
                <td>Sólo costos mensuales: {fmtMXN(result.operatingFixedMonthlyCosts)}</td>
              </tr>
              <tr>
                <td>Viajes/mes objetivo</td>
                <td className="num">
                  <strong>{fmtN(result.breakEvenTrips, 0)}</strong>
                </td>
                <td>
                  Operativo {fmtMXN(result.operatingFixedMonthlyCosts)}
                  {result.projectRecoveryMonthly > 0 &&
                    ` + recuperación proyecto ${fmtMXN(result.projectRecoveryMonthly)}`}
                  {result.profitTarget > 0 && ` + meta ${fmtMXN(result.profitTarget)}`}
                </td>
              </tr>
              <tr>
                <td>Viajes por día</td>
                <td className="num">{fmtFixed(result.tripsPerDay)}</td>
                <td>
                  en {inputs.workDaysPerMonth} días/mes · {fmtN(result.uberMonthlyKm)} km Uber/mes
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Horas por día</strong>
                </td>
                <td className="num">
                  <strong>{fmtFixed(result.hoursPerDay)} hrs</strong>
                </td>
                <td>a {inputs.tripsPerHour} viajes/hora</td>
              </tr>
              <tr>
                <td>
                  <strong>Horas por semana</strong>
                </td>
                <td className="num">
                  <strong>{fmtFixed(result.hoursPerWeek)} hrs</strong>
                </td>
                <td>
                  {fmtFixed(result.weeklyDays)} días/sem × {fmtFixed(result.hoursPerDay)} hrs/día
                </td>
              </tr>
              <tr>
                <td>
                  Capacidad utilizada <Info text={TIPS.capacity} />
                </td>
                <td className="num">{fmtPct(result.capacityUsage, 1)}</td>
                <td>Tope: {fmtN(result.maxTripsMonth)} viajes/mes</td>
              </tr>
              {result.chargingHoursPerDay > 0 && (
                <tr>
                  <td>Carga eléctrica diaria</td>
                  <td className="num">{fmtFixed(result.chargingHoursPerDay)} hrs</td>
                  <td>Te resta tiempo de trabajo</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};
