import { PiggyBank } from 'lucide-react';
import { Info } from './ui/Info.jsx';
import { fmtMXN, fmtPct } from '../domain/format.js';

// ============================================================================
// BLOQUE: IMPACTO EN EL INGRESO
// ----------------------------------------------------------------------------
// Qué parte del ingreso mensual se lleva el auto, en total y por categoría, con
// un semáforo según la regla común del 20–30% del ingreso. El ingreso es
// opcional: si no se captura (monthlyIncome <= 0) el bloque no se muestra.
// ============================================================================
export const IncomeImpact = ({ R, inputs }) => {
  if (!inputs.monthlyIncome || inputs.monthlyIncome <= 0) return null;
  const total = R.monthlyTotalOperative,
    income = inputs.monthlyIncome;
  const pct = total / income,
    remaining = Math.max(0, income - total);
  const segments = [
    R.monthlyPayment > 0 && { name: 'Mensualidad', value: R.monthlyPayment, color: '#b8431f' },
    {
      name:
        inputs.vehicleType === 'electric'
          ? 'Electricidad'
          : inputs.vehicleType === 'diesel'
            ? 'Diésel'
            : 'Gasolina',
      value: R.monthlyFuel,
      color: '#d65a30',
    },
    { name: 'Seguro', value: R.monthlyIns, color: '#a87819' },
    { name: 'Refrendo', value: R.monthlyRefrendo, color: '#6b3d8a' },
    { name: 'Mantenimiento', value: R.monthlyMaint, color: '#1f4d8a' },
    R.monthlyData > 0 && { name: 'Datos', value: R.monthlyData, color: '#7a6e5e' },
    R.monthlyCarWash > 0 && { name: 'Lavado', value: R.monthlyCarWash, color: '#0e6b6b' },
    R.monthlyTips > 0 && { name: 'Propinas', value: R.monthlyTips, color: '#3a7d44' },
    R.monthlyMisc > 0 && { name: 'Misceláneos', value: R.monthlyMisc, color: '#9c6b1f' },
    R.monthlyAccess > 0 && { name: 'Accesorios', value: R.monthlyAccess, color: '#8a2727' },
  ].filter(Boolean);
  const stressLevel = pct > 0.5 ? 'bad' : pct > 0.3 ? 'warn' : 'ok';
  const stressText =
    pct > 0.5
      ? '⚠️ Tu auto se llevará más de la mitad de tu ingreso. Riesgo alto.'
      : pct > 0.3
        ? 'Tu auto se llevará una parte considerable de tu ingreso. Manejable pero apretado.'
        : 'Tu auto representa una proporción saludable de tu ingreso.';
  return (
    <div className="card" style={{ marginBottom: 18 }}>
      <div className="card-title">
        <PiggyBank size={11} /> Impacto en tu ingreso mensual{' '}
        <Info text="Comparamos lo que cuesta el auto contra tu sueldo. La regla común dice que el auto no debería pasar del 20-30% de tu ingreso." />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            De tu ingreso de <strong className="mono">{fmtMXN(income)}</strong>/mes, el auto consume
          </div>
          <div
            className="serif"
            style={{
              fontSize: 36,
              lineHeight: 1.1,
              color: pct > 0.5 ? 'var(--neg)' : pct > 0.3 ? 'var(--warn)' : 'var(--pos)',
            }}
          >
            {fmtPct(pct, 1)}
          </div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
            {fmtMXN(total)} de {fmtMXN(income)}
          </div>
        </div>
        <span className={`stress-badge ${stressLevel}`}>
          {pct > 0.5 ? '⚠️ Alto' : pct > 0.3 ? '⚠️ Medio' : '✓ Saludable'}
        </span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
        <strong>Distribución de tu ingreso:</strong>
      </div>
      <div className="income-bar">
        {segments.map((s, i) => (
          <div
            key={i}
            style={{ width: `${(s.value / income) * 100}%`, background: s.color }}
            title={`${s.name}: ${fmtMXN(s.value)}`}
          >
            {s.value / income > 0.05 && fmtPct(s.value / income, 0)}
          </div>
        ))}
        {remaining > 0 && (
          <div style={{ width: `${(remaining / income) * 100}%`, background: 'var(--pos)' }}>
            {remaining / income > 0.05 && `${fmtPct(remaining / income, 0)} libre`}
          </div>
        )}
      </div>
      <div className="income-bar-legend">
        {segments.map((s, i) => (
          <div key={i}>
            <span className="swatch" style={{ background: s.color }} />
            <span>
              {s.name}: <strong className="mono">{fmtMXN(s.value)}</strong> (
              {fmtPct(s.value / income, 1)})
            </span>
          </div>
        ))}
        <div>
          <span className="swatch" style={{ background: 'var(--pos)' }} />
          <span>
            Libre para otros gastos: <strong className="mono">{fmtMXN(remaining)}</strong> (
            {fmtPct(remaining / income, 1)})
          </span>
        </div>
      </div>
      <div
        style={{
          marginTop: 14,
          fontSize: 12,
          color: 'var(--ink-2)',
          fontStyle: 'italic',
          borderTop: '1px solid var(--line)',
          paddingTop: 12,
        }}
      >
        {stressText}
      </div>
      <div className="income-summary" style={{ marginTop: 14 }}>
        <div>
          <div className="lbl">Gasto total {inputs.horizonYears} años</div>
          <div className="val">{fmtMXN(R.totalSpentGross)}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
            = {fmtPct(R.totalSpentGross / (income * inputs.horizonYears * 12), 1)} de tu ingreso del
            período
          </div>
        </div>
        <div>
          <div className="lbl">Ingreso anual</div>
          <div className="val">{fmtMXN(income * 12)}</div>
        </div>
        <div>
          <div className="lbl">Costo anual auto</div>
          <div className="val">{fmtMXN(R.monthlyTotalOperative * 12)}</div>
        </div>
      </div>
    </div>
  );
};
