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
