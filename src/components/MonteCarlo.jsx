import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, Dice5 } from 'lucide-react';
import { Info } from './ui/Info.jsx';
import { TIPS } from '../content/tips.js';
import { fmtMXN, fmtN, fmtPct } from '../domain/format.js';
import { MC_VARIATIONS, runMonteCarlo } from '../domain/monteCarlo.js';

const VARIATION_GROUPS = [
  ['income', 'Ingreso y plataforma'],
  ['energy', 'Energía (según el motor)'],
  ['costs', 'Costos recurrentes'],
  ['value', 'Valor del auto'],
];

// ============================================================================
// PAGE: MONTE CARLO
// ----------------------------------------------------------------------------
// Repeats the calculation thousands of times with the uncertain values varied at
// random to estimate the probability that the plan works. Shows P10/P50/P90 of
// trips, liquidation and net result, and the break-even histogram. The on-screen
// list of what varies comes from MC_VARIATIONS, the same table runMonteCarlo()
// uses, so it cannot go stale.
// ============================================================================
export const MonteCarlo = ({ inputs }) => {
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [iterations, setIterations] = useState(3000);
  const run = () => {
    setRunning(true);
    setTimeout(() => {
      setResults(runMonteCarlo(inputs, iterations));
      setRunning(false);
    }, 50);
  };
  return (
    <>
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-title">
          <Dice5 size={11} /> Simulación Monte Carlo
        </div>
        <div className="card-blurb" style={{ marginBottom: 18 }}>
          <strong>¿Y si la realidad no es exactamente como dices?</strong> Monte Carlo repite el
          cálculo miles de veces variando al azar los valores inciertos para estimar qué tan
          probable es que tu plan funcione. Es una forma de medir el riesgo.
          <br />
          <br />
          En cada repetición cambian {MC_VARIATIONS.length} valores (el ± es una desviación
          estándar):
          <ul style={{ marginTop: 6, marginBottom: 0, paddingLeft: 18 }}>
            {VARIATION_GROUPS.map(([group, title]) => (
              <li key={group}>
                <strong>{title}:</strong>{' '}
                {MC_VARIATIONS.filter((v) => v.group === group)
                  .map((v) => `${v.label} (${v.spread})`)
                  .join(', ')}
              </li>
            ))}
            <li>
              Además, una <strong>pérdida total o robo</strong> con la probabilidad anual del panel
              (sólo si el auto es tuyo): el seguro paga su valor menos el deducible.
            </li>
          </ul>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>Repeticiones:</span>
          <select
            className="select"
            style={{ width: 110 }}
            value={iterations}
            onChange={(e) => setIterations(parseInt(e.target.value))}
          >
            <option value={1000}>1,000</option>
            <option value={3000}>3,000</option>
            <option value={10000}>10,000</option>
          </select>
          <button className="btn accent" onClick={run} disabled={running}>
            {running ? 'Corriendo…' : 'Ejecutar simulación'}
          </button>
        </div>
      </div>
      {results && (
        <>
          <div className="kpi-grid">
            <div className="kpi accent">
              <div className="kpi-label">Probabilidad de éxito</div>
              <div className="kpi-value mono">{fmtPct(results.feasibleRate, 1)}</div>
              <div className="kpi-sub">
                de {results.iterations.toLocaleString()} simulaciones tu plan funciona
              </div>
            </div>
            <div className="kpi">
              <div className="kpi-label">
                Viajes/mes esperados{' '}
                <Info text="<strong>P50</strong> = el valor más probable. <strong>P10–P90</strong> = rango donde caen el 80% de los casos." />
              </div>
              <div className="kpi-value mono">{fmtN(results.be.p50, 0)}</div>
              <div className="kpi-sub">
                Optimista: {fmtN(results.be.p10, 0)} · Pesimista: {fmtN(results.be.p90, 0)}
              </div>
            </div>
            <div className="kpi">
              <div className="kpi-label">
                Liquidación esperada <Info text={TIPS.liquidation} />
              </div>
              <div
                className="kpi-value mono"
                style={{ color: results.fp.p50 >= 0 ? 'var(--pos)' : 'var(--neg)' }}
              >
                {fmtMXN(results.fp.p50)}
              </div>
              <div className="kpi-sub">
                Pesimista {fmtMXN(results.fp.p10)} · Optimista {fmtMXN(results.fp.p90)}
              </div>
            </div>
            <div className="kpi accent">
              <div className="kpi-label">
                Resultado neto esperado <Info text={TIPS.netResult} />
              </div>
              <div
                className="kpi-value mono"
                style={{ color: results.net.p50 >= 0 ? 'var(--pos)' : 'var(--neg)' }}
              >
                {fmtMXN(results.net.p50)}
              </div>
              <div className="kpi-sub">
                Pesimista {fmtMXN(results.net.p10)} · Optimista {fmtMXN(results.net.p90)}
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">
              <BarChart3 size={11} /> Distribución del punto de equilibrio{' '}
              <Info text="Cuántas veces, de las miles de simulaciones, salió cada número de viajes/mes." />
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={results.hist}>
                <CartesianGrid stroke="#e6dccc" strokeDasharray="2 4" />
                <XAxis dataKey="rangeLabel" stroke="#7a6e5e" fontSize={10} interval={2} />
                <YAxis stroke="#7a6e5e" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: '#fdfaf2',
                    border: '1px solid #d9cdb7',
                    borderRadius: 3,
                  }}
                />
                <Bar dataKey="count" fill="#b8431f" fillOpacity={0.85} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
      {!results && !running && (
        <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
          <Dice5 size={32} style={{ marginBottom: 12 }} />
          <div className="serif" style={{ fontSize: 22, color: 'var(--ink)' }}>
            Listo para simular
          </div>
          <div style={{ fontSize: 13, marginTop: 6 }}>
            Presiona <strong>Ejecutar simulación</strong> arriba.
          </div>
        </div>
      )}
    </>
  );
};
