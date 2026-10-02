import { useState, useMemo, useRef } from 'react';
import { Copy, GitCompareArrows } from 'lucide-react';
import { CarColumn } from './comparison/CarColumn.jsx';
import { ComparisonVerdict } from './comparison/ComparisonVerdict.jsx';
import { DecisionTable } from './comparison/DecisionTable.jsx';
import { PositionChart } from './comparison/PositionChart.jsx';
import { Info } from './ui/Info.jsx';
import { calculate } from '../domain/calculate.js';
import { MAX_COMPARE_CARS, applyCarPresetTo, cloneInputs } from '../domain/compare.js';
import { SCENARIO_COLORS } from '../domain/constants.js';
import { fmtMXN, num } from '../domain/format.js';
import { projectionYear } from '../domain/year.js';

// ============================================================================
// PAGE: COMPARAR (COMPARE)
// ----------------------------------------------------------------------------
// Two to four editable cars side by side, each with its own live calculate(),
// plus the saved scenarios as read-only columns. Below, the decision: a verdict
// (CAE, the equivalent annual cost, and $/km), a table that highlights the best
// value of each cost row, and the cumulative position per year (including sale
// minus debt).
// ============================================================================
export const Comparison = ({ saved, currentInputs, setSaved }) => {
  // Each editable car = { id, inputs }. Seed: 2 deep copies of the current sidebar.
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

  // Recalculate each column live and assign a color by index (useMemo over cars).
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

  // Comparison columns = editable cars + saved scenarios (read-only). Each series
  // gets a unique sid so chart lines never overwrite each other (even with
  // repeated names).
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

  // Cumulative position per year (sale − debt included), keyed by the unique sid.
  const lineData = [];
  for (let y = 1; y <= yearsMax; y++) {
    const row = { year: projectionYear(y) };
    cols.forEach((c) => {
      const cf = c.result.cashflow?.[y - 1];
      if (cf) row[c.sid] = Math.round(cf.cumRevenue - cf.cumCosts + (cf.liqValue || 0));
    });
    lineData.push(row);
  }

  // Best by CAE (lowest) and by $/km (lowest, ignoring NaN), both over ALL columns.
  const bestEac = cols.reduce(
    (b, c) => (!b || (isFinite(c.result.eac) && c.result.eac < b.result.eac) ? c : b),
    null,
  );
  const bestPerKm = cols
    .filter((c) => isFinite(c.result.costPerKm))
    .reduce((b, c) => (!b || c.result.costPerKm < b.result.costPerKm ? c : b), null);
  const eacKmAgree = bestEac && bestPerKm && bestEac.sid === bestPerKm.sid;

  // To highlight the best (lowest) cost per row: id of the column with the lowest finite value.
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
  // Resale: here MORE is better, so it is not highlighted as a minimum (no best).
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
        {computed.map((c) => (
          <CarColumn
            key={c.id}
            car={c}
            carCount={cars.length}
            onField={(k, v) => setCarField(c.id, k, v)}
            onPreset={(k) => applyPreset(c.id, k)}
            onRemove={() => removeCar(c.id)}
          />
        ))}
      </div>

      <ComparisonVerdict bestEac={bestEac} bestPerKm={bestPerKm} eacKmAgree={eacKmAgree} />

      <PositionChart cols={cols} lineData={lineData} anyUber={anyUber} />

      <DecisionTable
        cols={cols}
        costRows={costRows}
        plainRows={plainRows}
        bestSidFor={bestSidFor}
        bestEac={bestEac}
        anyUber={anyUber}
        saved={saved}
        setSaved={setSaved}
      />
    </>
  );
};
