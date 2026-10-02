import { Car, Wallet } from 'lucide-react';
import { Field } from '../ui/Field.jsx';
import { Segmented } from '../ui/Segmented.jsx';
import { CAR_PRESETS } from '../../domain/constants.js';
import { fmtMXN, fmtPct } from '../../domain/format.js';
import { INPUT_LIMITS } from '../../domain/inputSchema.js';

// One editable car: its headline figures and the quick what-if fields
// (preset, price, condition, powertrain, payment, rate, term, horizon, fare).
export const CarColumn = ({ car, carCount, onField, onPreset, onRemove }) => {
  const carInputs = car.inputs;
  const carResult = car.result;
  const isUber = carInputs.operationMode !== 'no-uber';
  return (
    <div className="card" style={{ padding: '14px 16px', borderTop: `3px solid ${car.color}` }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          <span style={{ width: 9, height: 9, borderRadius: 50, background: car.color }} />
          {car.label}
        </span>
        <button
          className="btn ghost"
          style={{ padding: '2px 6px' }}
          title="Quitar este auto"
          onClick={() => onRemove()}
          disabled={carCount <= 1}
        >
          ×
        </button>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          marginBottom: 10,
          padding: '8px 10px',
          background: 'var(--bg-2)',
          borderRadius: 3,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
          <span style={{ color: 'var(--muted)' }}>CAE/año</span>
          <strong className="mono">{fmtMXN(carResult.eac)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
          <span style={{ color: 'var(--muted)' }}>$/km</span>
          <strong className="mono">
            {isFinite(carResult.costPerKm) ? fmtMXN(carResult.costPerKm, 2) : '—'}
          </strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
          <span style={{ color: 'var(--muted)' }}>
            {carResult.isLease ? 'Renta/mes' : 'Mensual'}
          </span>
          <strong className="mono">{fmtMXN(carResult.monthlyTotalOperative)}</strong>
        </div>
      </div>
      <div className="field">
        <div className="field-label" style={{ marginBottom: 4, fontSize: 11 }}>
          <Car size={10} /> Modelo
        </div>
        <select
          className="select"
          style={{ fontSize: 11 }}
          value={carInputs.carPreset}
          onChange={(e) => onPreset(e.target.value)}
        >
          {Object.entries(CAR_PRESETS).map(([k, p]) => (
            <option key={k} value={k}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <Field
        label="Precio"
        value={carInputs.carPrice}
        min={50000}
        max={1500000}
        step={1000}
        onChange={(v) => onField('carPrice', v)}
        suffix="MXN"
      />
      <div className="field">
        <div className="field-label" style={{ marginBottom: 4, fontSize: 11 }}>
          Condición
        </div>
        <Segmented
          value={carInputs.vehicleCondition || 'new'}
          onChange={(v) => onField('vehicleCondition', v)}
          options={[
            { value: 'new', label: 'Nuevo' },
            { value: 'used', label: 'Usado' },
          ]}
        />
      </div>
      <div className="field">
        <div className="field-label" style={{ marginBottom: 4, fontSize: 11 }}>
          Motor
        </div>
        <Segmented
          value={carInputs.vehicleType}
          onChange={(v) => onField('vehicleType', v)}
          options={[
            { value: 'gasoline', label: 'Gas' },
            { value: 'diesel', label: 'Diésel' },
            { value: 'hybrid', label: 'Híb' },
            { value: 'electric', label: 'Eléc' },
          ]}
        />
      </div>
      <div className="field">
        <div className="field-label" style={{ marginBottom: 4, fontSize: 11 }}>
          <Wallet size={10} /> Pago
        </div>
        <Segmented
          value={carInputs.purchaseMode}
          onChange={(v) => onField('purchaseMode', v)}
          options={[
            { value: 'cash', label: 'Contado' },
            { value: 'credit', label: 'Crédito' },
            { value: 'hybrid', label: 'Mixto' },
          ]}
        />
      </div>
      {carInputs.purchaseMode === 'credit' && (
        <div className="field">
          <div className="field-label" style={{ marginBottom: 4, fontSize: 11 }}>
            Financiamiento
          </div>
          <Segmented
            value={carInputs.financeType || 'annuity'}
            onChange={(v) => onField('financeType', v)}
            options={[
              { value: 'annuity', label: 'Trad.' },
              { value: 'balloon', label: 'Globo' },
              { value: 'lease', label: 'Arr.' },
            ]}
          />
        </div>
      )}
      {carInputs.purchaseMode !== 'cash' &&
        !(carInputs.purchaseMode === 'credit' && carInputs.financeType === 'lease') && (
          <>
            <Field
              label="Tasa anual"
              value={carInputs.interestRate}
              min={0.03}
              max={0.4}
              step={0.001}
              decimals={3}
              onChange={(v) => onField('interestRate', v)}
              suffix={`${fmtPct(carInputs.interestRate, 1)} anual`}
            />
            <Field
              label="Plazo crédito"
              value={carInputs.loanMonths}
              min={6}
              max={84}
              step={6}
              onChange={(v) => onField('loanMonths', v)}
              limits={INPUT_LIMITS.loanMonths}
              suffix="meses"
            />
            <Field
              label="Enganche"
              value={carInputs.downPaymentPct}
              min={0.05}
              max={0.6}
              step={0.01}
              decimals={2}
              onChange={(v) => onField('downPaymentPct', v)}
              suffix={`${fmtPct(carInputs.downPaymentPct, 0)} del precio`}
            />
          </>
        )}
      <Field
        label="Horizonte"
        value={carInputs.horizonYears}
        min={1}
        max={10}
        step={1}
        onChange={(v) => onField('horizonYears', v)}
        limits={INPUT_LIMITS.horizonYears}
        suffix="años"
      />
      {isUber && (
        <Field
          label="Tarifa Uber/viaje"
          value={carInputs.avgFare}
          min={50}
          max={500}
          step={5}
          onChange={(v) => onField('avgFare', v)}
          suffix="MXN/viaje"
        />
      )}
    </div>
  );
};
