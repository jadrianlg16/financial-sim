import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { Info } from '../ui/Info.jsx';
import { TIPS } from '../../content/tips.js';
import { fmtMXN } from '../../domain/format.js';

// Monthly cost by category as a horizontal bar chart.
export const CostStructure = ({ result, costBreakdown }) => {
  return (
    <div className="card">
      <div className="card-title">
        <BarChart3 size={11} /> Estructura mensual de costos <Info text={TIPS.costStructure} />
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={costBreakdown} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid stroke="#e6dccc" strokeDasharray="2 4" horizontal={false} />
          <XAxis
            type="number"
            stroke="#7a6e5e"
            fontSize={11}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <YAxis type="category" dataKey="name" stroke="#7a6e5e" fontSize={10} width={120} />
          <Tooltip
            formatter={(v) => fmtMXN(v)}
            contentStyle={{
              background: '#fdfaf2',
              border: '1px solid #d9cdb7',
              borderRadius: 3,
            }}
          />
          <Bar dataKey="value" radius={[0, 2, 2, 0]}>
            {costBreakdown.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div
        style={{
          textAlign: 'right',
          marginTop: 8,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 12,
        }}
      >
        Total mensual: <strong>{fmtMXN(result.monthlyTotalOperative)}</strong>
      </div>
    </div>
  );
};
