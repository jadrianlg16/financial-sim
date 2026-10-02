import { fmtFixed, fmtMXN, fmtN, fmtPct } from '../../domain/format.js';

// Rango probable: el caso base rodeado de una simulación Monte Carlo ligera
// (optimista P10, probable P50, pesimista P90).
export const ReportRisk = ({ result, mc, mcRuns }) => (
  <>
    {mc && (
      <>
        <h2>Rango probable (simulación de {fmtN(mcRuns, 0)} escenarios)</h2>
        <p style={{ fontSize: 13 }}>
          La recomendación de arriba es el <strong>caso base</strong> (un solo escenario). Aquí
          movemos al azar las variables inciertas (tarifa, combustible, comisión, mantenimiento,
          seguro, depreciación…) {fmtN(mcRuns, 0)} veces para ver el <strong>rango</strong> en que
          caen los resultados: optimista (P10), probable (P50) y pesimista (P90).
        </p>
        {result.isUberMode ? (
          <>
            <div className="kpi-grid" style={{ marginBottom: 14 }}>
              <div className="kpi accent">
                <div className="kpi-label">Probabilidad de éxito</div>
                <div
                  className="kpi-value mono"
                  style={{ color: mc.feasibleRate >= 0.5 ? 'var(--pos)' : 'var(--neg)' }}
                >
                  {fmtPct(mc.feasibleRate, 1)}
                </div>
                <div className="kpi-sub">de {fmtN(mcRuns, 0)} escenarios el plan es viable</div>
              </div>
              <div className="kpi">
                <div className="kpi-label">Viajes/mes (equilibrio)</div>
                <div className="kpi-value mono">{fmtN(mc.be.p50, 0)}</div>
                <div className="kpi-sub">
                  Optimista {fmtN(mc.be.p10, 0)} · Pesimista {fmtN(mc.be.p90, 0)}
                </div>
              </div>
              <div className="kpi accent">
                <div className="kpi-label">Resultado neto del proyecto</div>
                <div
                  className="kpi-value mono"
                  style={{ color: mc.net.p50 >= 0 ? 'var(--pos)' : 'var(--neg)' }}
                >
                  {fmtMXN(mc.net.p50)}
                </div>
                <div className="kpi-sub">
                  Pesimista {fmtMXN(mc.net.p10)} · Optimista {fmtMXN(mc.net.p90)}
                </div>
              </div>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Escenario</th>
                  <th className="num">Viajes/mes</th>
                  <th className="num">Resultado neto</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontFamily: 'Manrope', fontWeight: 500 }}>Optimista (P10)</td>
                  <td className="num">{fmtN(mc.be.p10, 0)}</td>
                  <td className={`num ${mc.net.p90 >= 0 ? 'pos' : 'neg'}`}>{fmtMXN(mc.net.p90)}</td>
                </tr>
                <tr style={{ background: 'var(--bg-2)' }}>
                  <td style={{ fontFamily: 'Manrope', fontWeight: 700 }}>Probable (P50)</td>
                  <td className="num">
                    <strong>{fmtN(mc.be.p50, 0)}</strong>
                  </td>
                  <td className={`num ${mc.net.p50 >= 0 ? 'pos' : 'neg'}`}>
                    <strong>{fmtMXN(mc.net.p50)}</strong>
                  </td>
                </tr>
                <tr>
                  <td style={{ fontFamily: 'Manrope', fontWeight: 500 }}>Pesimista (P90)</td>
                  <td className="num">{fmtN(mc.be.p90, 0)}</td>
                  <td className={`num ${mc.net.p10 >= 0 ? 'pos' : 'neg'}`}>{fmtMXN(mc.net.p10)}</td>
                </tr>
              </tbody>
            </table>
            <p style={{ fontSize: 13, marginTop: 10 }}>
              {result.feasible ? (
                <>
                  Aunque el caso base es viable trabajando ~{fmtFixed(result.hoursPerWeek)}{' '}
                  hrs/semana, en el <strong>10% peor</strong> de los escenarios necesitarías
                  acercarte a <strong>{fmtN(mc.be.p90, 0)} viajes/mes</strong> y el resultado neto
                  podría caer a <strong>{fmtMXN(mc.net.p10)}</strong>. El plan funciona en ~
                  <strong>{fmtPct(mc.feasibleRate, 0)}</strong> de los casos simulados.
                </>
              ) : (
                <>
                  El caso base no es viable; la simulación lo confirma: el plan sólo funciona en ~
                  <strong>{fmtPct(mc.feasibleRate, 0)}</strong> de los escenarios, con un equilibrio
                  probable de <strong>{fmtN(mc.be.p50, 0)} viajes/mes</strong>. Ajusta los supuestos
                  antes de decidir.
                </>
              )}
            </p>
          </>
        ) : (
          <>
            <div className="kpi-grid" style={{ marginBottom: 14 }}>
              <div className="kpi accent">
                <div className="kpi-label">Resultado de liquidación (probable)</div>
                <div
                  className="kpi-value mono"
                  style={{ color: mc.fp.p50 >= 0 ? 'var(--pos)' : 'var(--neg)' }}
                >
                  {fmtMXN(mc.fp.p50)}
                </div>
                <div className="kpi-sub">
                  Pesimista {fmtMXN(mc.fp.p10)} · Optimista {fmtMXN(mc.fp.p90)}
                </div>
              </div>
              <div className="kpi">
                <div className="kpi-label">Rango (P10 — P90)</div>
                <div className="kpi-value mono" style={{ fontSize: 18 }}>
                  {fmtMXN(mc.fp.p10)} — {fmtMXN(mc.fp.p90)}
                </div>
                <div className="kpi-sub">dispersión del resultado financiero</div>
              </div>
            </div>
            <p style={{ fontSize: 13 }}>
              En modo de uso personal no hay punto de equilibrio: el riesgo del resultado financiero
              lo dominan la <strong>reventa</strong> (depreciación × factor de venta) y el{' '}
              <strong>costo de energía/combustible</strong>. El resultado de liquidación probable es{' '}
              <strong>{fmtMXN(mc.fp.p50)}</strong>, con un rango entre{' '}
              <strong>{fmtMXN(mc.fp.p10)}</strong> (pesimista) y{' '}
              <strong>{fmtMXN(mc.fp.p90)}</strong> (optimista).
            </p>
          </>
        )}
      </>
    )}
  </>
);
