import { useState, useMemo, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  Car,
  Wallet,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  GitCompareArrows,
  Copy,
} from 'lucide-react';
import { Field } from './ui/Field.jsx';
import { Info } from './ui/Info.jsx';
import { Segmented } from './ui/Segmented.jsx';
import { calculate } from '../domain/calculate.js';
import { carDisplayName } from '../domain/carDisplay.js';
import { MAX_COMPARE_CARS, applyCarPresetTo, cloneInputs } from '../domain/compare.js';
import { CAR_PRESETS, SCENARIO_COLORS, VEHICLE_TYPES } from '../domain/constants.js';
import { fmtMXN, fmtN, fmtPct, num } from '../domain/format.js';
import { projectionYear } from '../domain/year.js';

// ============================================================================
// PÁGINA: COMPARAR
// ----------------------------------------------------------------------------
// De dos a cuatro autos editables lado a lado, cada uno con su propio calculate()
// en vivo, más los escenarios guardados como columnas de sólo lectura. Abajo se
// decide con un veredicto (CAE y $/km), una tabla que resalta el mejor valor de
// cada fila de costo y la posición acumulada por año (incluye venta − deuda).
// ============================================================================
export const Comparison = ({ saved, currentInputs, setSaved }) => {
  // Cada auto editable = { id, inputs }. Semilla: 2 copias profundas del sidebar actual.
  const [cars, setCars] = useState(() =>
    ['c0', 'c1'].map((id) => ({ id, inputs: cloneInputs(currentInputs) })),
  );
  const idSeq = useRef(2);
  const mkCar = (inputs) => ({ id: `c${idSeq.current++}`, inputs: cloneInputs(inputs) });

  const setCarField = (id, k, v) =>
    setCars((cs) => cs.map((c) => (c.id === id ? { ...c, inputs: { ...c.inputs, [k]: v } } : c)));
  const applyPreset = (id, k) =>
    setCars((cs) =>
      cs.map((c) => (c.id === id ? { ...c, inputs: applyCarPresetTo(c.inputs, k) } : c)),
    );
  const addCar = () =>
    setCars((cs) =>
      cs.length >= MAX_COMPARE_CARS
        ? cs
        : [...cs, mkCar(cs.length ? cs[cs.length - 1].inputs : currentInputs)],
    );
  const removeCar = (id) => setCars((cs) => (cs.length <= 1 ? cs : cs.filter((c) => c.id !== id)));
  const loadCurrentAsCar = () =>
    setCars((cs) => (cs.length >= MAX_COMPARE_CARS ? cs : [...cs, mkCar(currentInputs)]));

  // Recalcular en vivo por columna + asignar color por índice. (useMemo sobre cars)
  const computed = useMemo(
    () =>
      cars.map((c, i) => ({
        ...c,
        result: calculate(c.inputs),
        color: SCENARIO_COLORS[i % SCENARIO_COLORS.length],
        label: `Auto ${String.fromCharCode(65 + i)}`,
        editable: true,
      })),
    [cars],
  );

  // Columnas de comparación = autos editables + escenarios guardados (sólo lectura).
  // sid único por serie para que la gráfica nunca se pise (incluso con nombres repetidos).
  const savedCols = (saved || []).map((s, i) => ({
    id: `sv${i}`,
    inputs: s.inputs,
    result: s.result,
    color: s.color || SCENARIO_COLORS[(computed.length + i) % SCENARIO_COLORS.length],
    label: s.name,
    editable: false,
    savedIdx: i,
  }));
  const cols = [...computed, ...savedCols].map((c, i) => ({ ...c, sid: `col${i}` }));

  const anyUber = cols.some((c) => c.result.isUberMode);
  const yearsMax = Math.max(1, ...cols.map((c) => num(c.result.cashflow?.length, 1)));

  // Posición acumulada por año (venta − deuda incluida), keyed por sid único.
  const lineData = [];
  for (let y = 1; y <= yearsMax; y++) {
    const row = { year: projectionYear(y) };
    cols.forEach((c) => {
      const cf = c.result.cashflow?.[y - 1];
      if (cf) row[c.sid] = Math.round(cf.cumRevenue - cf.cumCosts + (cf.liqValue || 0));
    });
    lineData.push(row);
  }

  // Mejor por CAE (menor) y por $/km (menor, ignorando NaN). Ambos sobre TODAS las columnas.
  const bestEac = cols.reduce(
    (b, c) => (!b || (isFinite(c.result.eac) && c.result.eac < b.result.eac) ? c : b),
    null,
  );
  const bestPerKm = cols
    .filter((c) => isFinite(c.result.costPerKm))
    .reduce((b, c) => (!b || c.result.costPerKm < b.result.costPerKm ? c : b), null);
  const eacKmAgree = bestEac && bestPerKm && bestEac.sid === bestPerKm.sid;

  // Para resaltar el mejor (mínimo) por fila de costo: id de la columna con el menor valor finito.
  const bestSidFor = (accessor) => {
    let best = null,
      bestVal = Infinity;
    cols.forEach((c) => {
      const v = accessor(c.result);
      if (isFinite(v) && v < bestVal) {
        bestVal = v;
        best = c.sid;
      }
    });
    return best;
  };
  const costRows = [
    { label: 'Precio', get: (r) => r.carPrice, fmt: (r) => fmtMXN(r.carPrice) },
    {
      label: anyUber || cols.some((c) => c.result.isLease) ? 'Mensualidad / renta' : 'Mensualidad',
      get: (r) => r.monthlyTotalOperative,
      fmt: (r) => fmtMXN(r.monthlyTotalOperative),
    },
    { label: 'TCO neto', get: (r) => r.tcoTotal, fmt: (r) => fmtMXN(r.tcoTotal) },
    {
      label: '$/km',
      get: (r) => r.costPerKm,
      fmt: (r) => (isFinite(r.costPerKm) ? fmtMXN(r.costPerKm, 2) : '—'),
    },
    { label: 'CAE/año', get: (r) => r.eac, fmt: (r) => fmtMXN(r.eac), strong: true },
  ];
  // Reventa: aquí MÁS es mejor, así que no se resalta como mínimo (sin best).
  const plainRows = [{ label: 'Reventa esperada', fmt: (r) => fmtMXN(r.actualSalePrice) }];

  return (
    <>
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-title">
          <GitCompareArrows size={11} /> Comparar autos lado a lado{' '}
          <Info text="Sostén 2–4 autos y edítalos en sus columnas. Cada cambio recalcula su costo en vivo; abajo decides con la tabla, el veredicto (CAE y $/km) y la gráfica." />
        </div>
        <div className="card-blurb">
          Edita cada auto en su columna (precio, condición, motor, crédito, plazo, horizonte…).
          Recalculamos en vivo. Estos son ajustes rápidos de "¿qué pasa si…?"; para el detalle
          completo usa el panel lateral.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
          <button
            className="btn outline"
            style={{ fontSize: 11 }}
            onClick={addCar}
            disabled={cars.length >= MAX_COMPARE_CARS}
          >
            + Agregar auto
          </button>
          <button
            className="btn outline"
            style={{ fontSize: 11 }}
            onClick={loadCurrentAsCar}
            disabled={cars.length >= MAX_COMPARE_CARS}
            title="Copia la configuración del panel lateral como un auto nuevo"
          >
            <Copy size={11} /> Cargar config actual
          </button>
          {saved && saved.length > 0 && (
            <span style={{ fontSize: 11, color: 'var(--muted)', alignSelf: 'center' }}>
              · {saved.length} escenario(s) guardado(s) abajo como columnas de sólo lectura
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.max(1, computed.length)}, minmax(220px, 1fr))`,
          gap: 14,
          marginBottom: 18,
          overflowX: 'auto',
        }}
      >
        {computed.map((c) => {
          const I = c.inputs;
          const R2 = c.result;
          const isUber = I.operationMode !== 'no-uber';
          return (
            <div
              key={c.id}
              className="card"
              style={{ padding: '14px 16px', borderTop: `3px solid ${c.color}` }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  <span style={{ width: 9, height: 9, borderRadius: 50, background: c.color }} />
                  {c.label}
                </span>
                <button
                  className="btn ghost"
                  style={{ padding: '2px 6px' }}
                  title="Quitar este auto"
                  onClick={() => removeCar(c.id)}
                  disabled={cars.length <= 1}
                >
                  ×
                </button>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  marginBottom: 10,
                  padding: '8px 10px',
                  background: 'var(--bg-2)',
                  borderRadius: 3,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: 'var(--muted)' }}>CAE/año</span>
                  <strong className="mono">{fmtMXN(R2.eac)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: 'var(--muted)' }}>$/km</span>
                  <strong className="mono">
                    {isFinite(R2.costPerKm) ? fmtMXN(R2.costPerKm, 2) : '—'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: 'var(--muted)' }}>
                    {R2.isLease ? 'Renta/mes' : 'Mensual'}
                  </span>
                  <strong className="mono">{fmtMXN(R2.monthlyTotalOperative)}</strong>
                </div>
              </div>
              <div className="field">
                <div className="field-label" style={{ marginBottom: 4, fontSize: 11 }}>
                  <Car size={10} /> Modelo
                </div>
                <select
                  className="select"
                  style={{ fontSize: 11 }}
                  value={I.carPreset}
                  onChange={(e) => applyPreset(c.id, e.target.value)}
                >
                  {Object.entries(CAR_PRESETS).map(([k, p]) => (
                    <option key={k} value={k}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <Field
                label="Precio"
                value={I.carPrice}
                min={50000}
                max={1500000}
                step={1000}
                onChange={(v) => setCarField(c.id, 'carPrice', v)}
                suffix="MXN"
              />
              <div className="field">
                <div className="field-label" style={{ marginBottom: 4, fontSize: 11 }}>
                  Condición
                </div>
                <Segmented
                  value={I.vehicleCondition || 'new'}
                  onChange={(v) => setCarField(c.id, 'vehicleCondition', v)}
                  options={[
                    { value: 'new', label: 'Nuevo' },
                    { value: 'used', label: 'Usado' },
                  ]}
                />
              </div>
              <div className="field">
                <div className="field-label" style={{ marginBottom: 4, fontSize: 11 }}>
                  Motor
                </div>
                <Segmented
                  value={I.vehicleType}
                  onChange={(v) => setCarField(c.id, 'vehicleType', v)}
                  options={[
                    { value: 'gasoline', label: 'Gas' },
                    { value: 'diesel', label: 'Diésel' },
                    { value: 'hybrid', label: 'Híb' },
                    { value: 'electric', label: 'Eléc' },
                  ]}
                />
              </div>
              <div className="field">
                <div className="field-label" style={{ marginBottom: 4, fontSize: 11 }}>
                  <Wallet size={10} /> Pago
                </div>
                <Segmented
                  value={I.purchaseMode}
                  onChange={(v) => setCarField(c.id, 'purchaseMode', v)}
                  options={[
                    { value: 'cash', label: 'Contado' },
                    { value: 'credit', label: 'Crédito' },
                    { value: 'hybrid', label: 'Mixto' },
                  ]}
                />
              </div>
              {I.purchaseMode === 'credit' && (
                <div className="field">
                  <div className="field-label" style={{ marginBottom: 4, fontSize: 11 }}>
                    Financiamiento
                  </div>
                  <Segmented
                    value={I.financeType || 'annuity'}
                    onChange={(v) => setCarField(c.id, 'financeType', v)}
                    options={[
                      { value: 'annuity', label: 'Trad.' },
                      { value: 'balloon', label: 'Globo' },
                      { value: 'lease', label: 'Arr.' },
                    ]}
                  />
                </div>
              )}
              {I.purchaseMode !== 'cash' &&
                !(I.purchaseMode === 'credit' && I.financeType === 'lease') && (
                  <>
                    <Field
                      label="Tasa anual"
                      value={I.interestRate}
                      min={0.03}
                      max={0.4}
                      step={0.001}
                      decimals={3}
                      onChange={(v) => setCarField(c.id, 'interestRate', v)}
                      suffix={`${fmtPct(I.interestRate, 1)} anual`}
                    />
                    <Field
                      label="Plazo crédito"
                      value={I.loanMonths}
                      min={6}
                      max={84}
                      step={6}
                      onChange={(v) => setCarField(c.id, 'loanMonths', v)}
                      suffix="meses"
                    />
                    <Field
                      label="Enganche"
                      value={I.downPaymentPct}
                      min={0.05}
                      max={0.6}
                      step={0.01}
                      decimals={2}
                      onChange={(v) => setCarField(c.id, 'downPaymentPct', v)}
                      suffix={`${fmtPct(I.downPaymentPct, 0)} del precio`}
                    />
                  </>
                )}
              <Field
                label="Horizonte"
                value={I.horizonYears}
                min={1}
                max={10}
                step={1}
                onChange={(v) => setCarField(c.id, 'horizonYears', v)}
                suffix="años"
              />
              {isUber && (
                <Field
                  label="Tarifa Uber/viaje"
                  value={I.avgFare}
                  min={50}
                  max={500}
                  step={5}
                  onChange={(v) => setCarField(c.id, 'avgFare', v)}
                  suffix="MXN/viaje"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className={`verdict ${eacKmAgree ? 'ok' : 'warn'}`} style={{ marginBottom: 18 }}>
        <div className="verdict-icon">
          {eacKmAgree ? (
            <CheckCircle2 size={22} color="var(--pos)" />
          ) : (
            <AlertTriangle size={22} color="var(--warn)" />
          )}
        </div>
        <div>
          {bestEac ? (
            <>
              <div className="verdict-text">
                Mejor valor por CAE: <span style={{ color: 'var(--accent)' }}>{bestEac.label}</span>
              </div>
              <div className="verdict-sub">
                Menor costo anual equivalente: {fmtMXN(bestEac.result.eac)}/año (CAE).{' '}
                {bestPerKm
                  ? eacKmAgree
                    ? `Y además es el más barato por km (${fmtMXN(bestPerKm.result.costPerKm, 2)}/km): ambos criterios coinciden.`
                    : `Pero ${bestPerKm.label} es más barato por km (${fmtMXN(bestPerKm.result.costPerKm, 2)}/km): ${bestEac.label} gana en CAE y ${bestPerKm.label} en $/km — decide según si te importa más el costo anual de poseerlo o el costo por kilómetro recorrido.`
                  : 'Agrega km personales o un horizonte para obtener el costo por km.'}
              </div>
            </>
          ) : (
            <div className="verdict-text">Agrega autos para comparar.</div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-title">
          <BarChart3 size={11} />{' '}
          {anyUber ? 'Utilidad acumulada por auto' : 'Posición patrimonial acumulada'}{' '}
          <Info text="Cuánto ganas (o pierdes) acumulado al pasar los años, incluyendo el valor de reventa del auto menos la deuda. La línea más alta = mejor." />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={lineData}>
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
            <ReferenceLine y={0} stroke="#7a6e5e" strokeDasharray="3 3" />
            {cols.map((c) => (
              <Line
                key={c.sid}
                type="monotone"
                dataKey={c.sid}
                name={c.label}
                stroke={c.color}
                strokeWidth={2.5}
                strokeDasharray={c.editable ? undefined : '4 4'}
                dot={{ r: 3 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
          Línea continua = auto editable · línea punteada = escenario guardado (sólo lectura).
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <BarChart3 size={11} /> Comparación de decisión{' '}
          <Info text="TCO = costo total de propiedad. CAE = costo anual equivalente (el comparador correcto). En cada fila de costo, la celda resaltada es la más barata." />
        </div>
        <div className="card-blurb">
          Cada columna es un auto. En las filas de <strong>costo</strong> la celda verde es la mejor
          (mínimo). Decide por <strong>CAE</strong> (menor = mejor valor) y por{' '}
          <strong>$/km</strong>.
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Métrica</th>
                {cols.map((c) => (
                  <th key={c.sid} className="num">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 50,
                          background: c.color,
                          display: 'inline-block',
                        }}
                      />
                      {c.label}
                      {!c.editable && (
                        <span className="pill" style={{ marginLeft: 2 }}>
                          guardado
                        </span>
                      )}
                      {bestEac && c.sid === bestEac.sid && (
                        <span className="pill accent" style={{ marginLeft: 2 }}>
                          Mejor
                        </span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ color: 'var(--muted)' }}>Auto</td>
                {cols.map((c) => (
                  <td key={c.sid} className="num" style={{ fontSize: 11 }}>
                    {carDisplayName(c.inputs).split(' ').slice(0, 3).join(' ')}
                    {c.inputs.vehicleCondition === 'used' ? ' (usado)' : ''}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ color: 'var(--muted)' }}>Motor</td>
                {cols.map((c) => (
                  <td key={c.sid} className="num">
                    {VEHICLE_TYPES[c.inputs.vehicleType]?.label || '—'}
                  </td>
                ))}
              </tr>
              {costRows.map((rw) => {
                const best = bestSidFor(rw.get);
                return (
                  <tr key={rw.label}>
                    <td style={{ fontFamily: 'Manrope', fontWeight: 500 }}>{rw.label}</td>
                    {cols.map((c) => {
                      const isBest = best && c.sid === best;
                      return (
                        <td
                          key={c.sid}
                          className="num"
                          style={{ background: isBest ? '#e7f0e4' : 'transparent' }}
                        >
                          {rw.strong ? <strong>{rw.fmt(c.result)}</strong> : rw.fmt(c.result)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {plainRows.map((rw) => (
                <tr key={rw.label}>
                  <td style={{ fontFamily: 'Manrope', fontWeight: 500 }}>{rw.label}</td>
                  {cols.map((c) => (
                    <td key={c.sid} className="num">
                      {rw.fmt(c.result)}
                    </td>
                  ))}
                </tr>
              ))}
              {anyUber && (
                <>
                  <tr>
                    <td style={{ fontFamily: 'Manrope', fontWeight: 500 }}>
                      Equilibrio (viajes/mes)
                    </td>
                    {cols.map((c) => (
                      <td key={c.sid} className="num">
                        {c.result.isUberMode && isFinite(c.result.breakEvenTrips)
                          ? fmtN(c.result.breakEvenTrips, 0)
                          : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td style={{ fontFamily: 'Manrope', fontWeight: 500 }}>VPN proyecto Uber</td>
                    {cols.map((c) => (
                      <td
                        key={c.sid}
                        className={`num ${c.result.isUberMode ? (c.result.npvProject >= 0 ? 'pos' : 'neg') : ''}`}
                      >
                        {c.result.isUberMode && isFinite(c.result.npvProject)
                          ? fmtMXN(c.result.npvProject)
                          : '—'}
                      </td>
                    ))}
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {saved && saved.length > 0 && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed var(--line)' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
              Escenarios guardados (sólo lectura):
            </div>
            {saved.map((s, i) => (
              <span key={i} className="scenario-chip">
                <span className="dot" style={{ background: s.color }} />
                {s.name}
                <span className="x" onClick={() => setSaved(saved.filter((_, j) => j !== i))}>
                  ×
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
