import { useState } from 'react';
import { Info } from './Info.jsx';

// ----------------------------------------------------------------------------
// COMPONENTE Field  ·  Cumple la petición: "slider + campo manual editable"
// "No elimines los sliders, sólo hazlos más flexibles." Cada campo tiene:
//   - un input de texto donde se puede escribir CUALQUIER valor (incluso fuera
//     del rango del slider), y ese valor real es el que se usa en los cálculos;
//   - el slider para mover rápido; si el valor cae fuera del min/max del slider,
//     el thumb se pinta en ámbar (clase out-of-range) como aviso visual.
// ----------------------------------------------------------------------------
export const Field = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit,
  info,
  decimals = 0,
  suffix,
}) => {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');
  const outOfRange = value < min || value > max;
  const displayValue = focused
    ? draft
    : decimals > 0
      ? Number(value).toFixed(decimals)
      : String(Math.round(value * 1000) / 1000);
  const commit = () => {
    const n = parseFloat(draft.replace(/,/g, ''));
    if (!isNaN(n)) onChange(n);
    setFocused(false);
  };
  return (
    <div className="field">
      <div className="field-row">
        <span className="field-label">
          {label}
          {info && <Info text={info} />}
        </span>
        <input
          type="text"
          className="field-input"
          value={displayValue}
          onFocus={() => {
            setDraft(String(value));
            setFocused(true);
          }}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.target.blur();
            if (e.key === 'Escape') {
              setDraft(String(value));
              setFocused(false);
            }
          }}
        />
      </div>
      <input
        className={`slider${outOfRange ? ' out-of-range' : ''}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.min(max, Math.max(min, value))}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        title={
          outOfRange
            ? `Valor fuera del rango del slider (${min}-${max}). El valor real (${value}) se usa en los cálculos.`
            : ''
        }
      />
      {(unit || suffix) && (
        <div
          style={{
            fontSize: 10,
            color: 'var(--muted)',
            marginTop: 2,
            textAlign: 'right',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {suffix || unit}
        </div>
      )}
    </div>
  );
};
