import { Calculator } from 'lucide-react';
import { Info } from '../ui/Info.jsx';
import { fmtMXN } from '../../domain/format.js';

// Accounting classification of each monthly cost: fixed or variable, direct or
// indirect, plus the one-time Uber paperwork.
export const CostClassification = ({ result, costBreakdown }) => {
  return (
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
  );
};
