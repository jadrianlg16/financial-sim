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
import { BarChart3 } from 'lucide-react';
import { Info } from '../ui/Info.jsx';
import { fmtMXN } from '../../domain/format.js';

// Cumulative position per car and year, including what selling would recover.
export const PositionChart = ({ cols, lineData, anyUber }) => {
  return (
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
  );
};
