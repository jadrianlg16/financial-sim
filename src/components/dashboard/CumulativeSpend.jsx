import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Info } from '../ui/Info.jsx';
import { TIPS } from '../../content/tips.js';
import { fmtMXN } from '../../domain/format.js';

// Spend accumulated over the horizon, stacked by category (year 1 includes the
// day-one cash).
export const CumulativeSpend = ({ result }) => {
  const cumSpendChart = result.cashflow.map((r) => ({
    year: r.year,
    'Auto / crédito': r.cCar,
    Combustible: r.cEnergy,
    'Seguro + refrendo': r.cInsRef,
    Mantenimiento: r.cMaint,
    Otros: r.cOther,
  }));
  const cumColors = ['#b8431f', '#d65a30', '#a87819', '#1f4d8a', '#0e6b6b'];
  return (
    <div className="card" style={{ marginBottom: 18 }}>
      <div className="card-title">
        <TrendingUp size={11} /> Gasto total acumulado a lo largo del proyecto{' '}
        <Info text={TIPS.cumSpend} />
      </div>
      <div className="card-blurb">
        Cuánto dinero llevas gastado en total conforme pasan los años, apilado por categoría. El año
        1 incluye tu desembolso inicial (enganche + comisión + trámites Uber).
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
  );
};
