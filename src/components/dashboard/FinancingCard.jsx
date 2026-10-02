import {
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { Wallet, BarChart3 } from 'lucide-react';
import { Info } from '../ui/Info.jsx';
import { TIPS } from '../../content/tips.js';
import { fmtMXN, fmtPct } from '../../domain/format.js';

// How the car is paid for: the amortization chart for a loan (with the balloon
// note), the rent terms for a lease, or the opportunity cost of paying cash.
export const FinancingCard = ({ result, inputs }) => {
  const amortChartData =
    result.amortRows.length > 0
      ? result.amortRows
          .filter((_, i) => i % 3 === 0 || i === result.amortRows.length - 1)
          .map((r) => ({
            month: r.month,
            Capital: Math.round(r.cumPrin),
            Interés: Math.round(r.cumInt),
            Saldo: Math.round(r.balance),
          }))
      : [];
  return result.amortRows.length > 0 ? (
    <div className="card">
      <div className="card-title">
        <BarChart3 size={11} />{' '}
        {result.isBalloon ? 'Amortización del crédito (con globo)' : 'Amortización del crédito'}{' '}
        <Info text={TIPS.amortization} />
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart data={amortChartData}>
          <CartesianGrid stroke="#e6dccc" strokeDasharray="2 4" />
          <XAxis dataKey="month" stroke="#7a6e5e" fontSize={11} />
          <YAxis
            stroke="#7a6e5e"
            fontSize={11}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(v) => fmtMXN(v)}
            contentStyle={{
              background: '#fdfaf2',
              border: '1px solid #d9cdb7',
              borderRadius: 3,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area
            type="monotone"
            dataKey="Capital"
            stackId="1"
            fill="#b8431f"
            stroke="#b8431f"
            fillOpacity={0.7}
          />
          <Area
            type="monotone"
            dataKey="Interés"
            stackId="1"
            fill="#a87819"
            stroke="#a87819"
            fillOpacity={0.6}
          />
          <Line type="monotone" dataKey="Saldo" stroke="#181410" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
      {result.isBalloon && (
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, marginBottom: 0 }}>
          La mensualidad es menor porque {fmtPct(result.balloonPct, 0)} del financiado queda como{' '}
          <strong>pago final ("globo") de {fmtMXN(result.balloonPayment)}</strong> en el mes{' '}
          {result.months}; por eso el saldo no llega a cero al amortizar.
        </p>
      )}
    </div>
  ) : result.isLease ? (
    <div className="card">
      <div className="card-title">
        <Wallet size={11} /> Arrendamiento (renta)
      </div>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 0 }}>
        No es un crédito: <strong style={{ color: 'var(--ink)' }}>rentas</strong> el auto por{' '}
        <strong style={{ color: 'var(--ink)' }}>{fmtMXN(result.monthlyPayment)}/mes</strong>. No
        eres dueño, así que <strong>no hay reventa ni capital (equity)</strong> a tu favor.
      </p>
      <table className="tbl" style={{ marginTop: 6 }}>
        <tbody>
          <tr>
            <td>Renta mensual</td>
            <td className="num">{fmtMXN(result.monthlyPayment)}</td>
          </tr>
          <tr>
            <td>Plazo del arrendamiento</td>
            <td className="num">{result.months} meses</td>
          </tr>
          <tr>
            <td>Enganche/depósito inicial</td>
            <td className="num">{fmtMXN(result.cashPaid)}</td>
          </tr>
          {result.leaseKmPenaltyYear > 0 && (
            <tr>
              <td>Penalización por exceso de km</td>
              <td className="num neg">{fmtMXN(result.leaseKmPenaltyYear)}/año</td>
            </tr>
          )}
          <tr>
            <td>Capital acumulado (equity)</td>
            <td className="num">{fmtMXN(0)}</td>
          </tr>
        </tbody>
      </table>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, marginBottom: 0 }}>
        Seguro, gasolina y mantenimiento corren por tu cuenta como arrendatario.
      </p>
    </div>
  ) : (
    <div className="card">
      <div className="card-title">
        <Wallet size={11} /> Compra en efectivo
      </div>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 0 }}>
        No hay financiamiento. Pagaste{' '}
        <strong style={{ color: 'var(--ink)' }}>{fmtMXN(result.cashPaid)}</strong> al momento de la
        compra.
      </p>
      <p style={{ fontSize: 12, color: 'var(--muted)' }}>
        <strong>Costo de oportunidad:</strong> ese dinero invertido en CETES (~10% anual) generaría
        aproximadamente <strong>{fmtMXN(result.cashPaid * 0.1 * inputs.horizonYears)}</strong> en{' '}
        {inputs.horizonYears} años.
      </p>
    </div>
  );
};
