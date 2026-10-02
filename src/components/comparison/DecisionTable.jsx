import { BarChart3 } from 'lucide-react';
import { Info } from '../ui/Info.jsx';
import { carDisplayName } from '../../domain/carDisplay.js';
import { VEHICLE_TYPES } from '../../domain/constants.js';
import { fmtMXN, fmtN } from '../../domain/format.js';

// Side-by-side figures for every column, with the cheapest cost per row
// highlighted, plus the saved scenarios that can be removed.
export const DecisionTable = ({
  bestEac,
  cols,
  anyUber,
  costRows,
  plainRows,
  bestSidFor,
  saved,
  setSaved,
}) => {
  return (
    <div className="card">
      <div className="card-title">
        <BarChart3 size={11} /> Comparación de decisión{' '}
        <Info text="TCO = costo total de propiedad. CAE = costo anual equivalente (el comparador correcto). En cada fila de costo, la celda resaltada es la más barata." />
      </div>
      <div className="card-blurb">
        Cada columna es un auto. En las filas de <strong>costo</strong> la celda verde es la mejor
        (mínimo). Decide por <strong>CAE</strong> (menor = mejor valor) y por <strong>$/km</strong>.
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
  );
};
