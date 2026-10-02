import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Info } from '../ui/Info.jsx';
import { fmtMXN } from '../../domain/format.js';

// Market value of the car against the loan balance, year by year.
export const ValueVsDebt = ({ result }) => {
  const cashflowChart = result.cashflow.map((r) => ({
    year: r.year,
    Valor: Math.round(r.depValue),
    Deuda: Math.round(r.debtRemaining),
  }));
  return (
    <div className="card" style={{ marginBottom: 18 }}>
      <div className="card-title">
        <TrendingUp size={11} /> Valor del auto vs lo que aún debes{' '}
        <Info text="<strong>Verde:</strong> cuánto vale el auto cada año (baja por depreciación). <strong>Rojo:</strong> cuánto aún debes del crédito." />
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={cashflowChart}>
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
          <Line type="monotone" dataKey="Valor" stroke="#2f6a3b" strokeWidth={2.5} dot={{ r: 3 }} />
          <Line
            type="monotone"
            dataKey="Deuda"
            stroke="#b8431f"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            strokeDasharray="4 4"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
