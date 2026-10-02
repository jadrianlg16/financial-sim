import { useMemo } from 'react';
import { Sliders, Sparkles } from 'lucide-react';
import { fmtMXN, fmtN } from '../domain/format.js';
import { sensitivity } from '../domain/sensitivity.js';

// ============================================================================
// PAGE: SENSIBILIDAD (SENSITIVITY)
// ----------------------------------------------------------------------------
// Tornado chart: how much the break-even (or the net cost, without Uber) moves
// when each variable goes up or down on its own, sorted from largest to smallest
// impact. Green = the change helps; red = it hurts.
// ============================================================================
export const Sensitivity = ({ inputs }) => {
  const data = useMemo(() => sensitivity(inputs), [inputs]);
  const maxAbs = Math.max(...data.map((d) => Math.max(Math.abs(d.low), Math.abs(d.high))));
  const uber = inputs.operationMode !== 'no-uber';
  const metricName = uber ? 'el punto de equilibrio' : 'el costo neto del proyecto';
  const fmtRange = (v) => (uber ? `${fmtN(v, 0)} viajes/mes` : fmtMXN(v));
  return (
    <>
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-title">
          <Sliders size={11} /> Análisis de sensibilidad
        </div>
        <div className="card-blurb">
          <strong>¿Qué pasa si una variable cambia?</strong> Te mostramos cuánto se mueve{' '}
          {metricName} si cada variable sube o baja. Las barras más largas son las que más afectan
          tu plan.{' '}
          {uber
            ? ''
            : '(En modo sin Uber medimos el impacto sobre el costo neto, ya que no hay viajes que calcular.)'}
        </div>
        <div>
          {data.map((d) => (
            <div key={d.key} style={{ marginBottom: 12 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  marginBottom: 4,
                }}
              >
                <span>
                  {d.label}{' '}
                  <span style={{ color: 'var(--muted)' }}>(±{(d.delta * 100).toFixed(0)}%)</span>
                </span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
                  Mueve hasta{' '}
                  {d.metricUnit === 'MXN' ? fmtMXN(d.range) : `${fmtN(d.range, 0)} viajes`}
                </span>
              </div>
              <div
                style={{
                  position: 'relative',
                  height: 18,
                  background: 'var(--bg-2)',
                  borderRadius: 2,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: 0,
                    bottom: 0,
                    width: 1,
                    background: 'var(--ink)',
                    zIndex: 2,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    right: '50%',
                    width: `${(Math.abs(d.low) / maxAbs) * 50}%`,
                    background: d.low < 0 ? 'var(--pos)' : 'var(--neg)',
                    opacity: 0.85,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: '50%',
                    width: `${(Math.abs(d.high) / maxAbs) * 50}%`,
                    background: d.high > 0 ? 'var(--neg)' : 'var(--pos)',
                    opacity: 0.85,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 14, lineHeight: 1.6 }}>
          {uber ? (
            <>
              <strong style={{ color: 'var(--pos)' }}>Verde a la izquierda</strong> = cuando baja,
              necesitas menos viajes (mejor).{' '}
              <strong style={{ color: 'var(--neg)' }}>Rojo a la derecha</strong> = cuando sube,
              necesitas más viajes.
            </>
          ) : (
            <>
              <strong style={{ color: 'var(--pos)' }}>Verde</strong> = baja el costo neto (mejor).{' '}
              <strong style={{ color: 'var(--neg)' }}>Rojo</strong> = sube el costo neto.
            </>
          )}
        </div>
      </div>
      <div className="card">
        <div className="card-title">
          <Sparkles size={11} /> En resumen
        </div>
        <p className="italic-serif" style={{ fontSize: 17, lineHeight: 1.5, margin: 0 }}>
          Lo que <span style={{ color: 'var(--accent)' }}>más mueve la aguja</span> es{' '}
          <strong>{data[0].label.toLowerCase()}</strong>. Si cambia ±
          {(data[0].delta * 100).toFixed(0)}%, {metricName} se mueve hasta{' '}
          <strong>{fmtRange(data[0].range)}</strong>.
        </p>
      </div>
    </>
  );
};
