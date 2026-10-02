import { useState } from 'react';
import { Info } from './Info.jsx';

// ----------------------------------------------------------------------------
// Field: slider plus an editable typed entry.
//   - The text box accepts any value, even outside the slider range, and that
//     real value is the one the calculation uses.
//   - The slider is for moving fast; when the value is outside its range, the
//     thumb turns amber (out-of-range class) as a warning.
//   - `limits` ([min, max], optional) bounds what can be typed, for the
//     variables that size the calculation (see INPUT_LIMITS).
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
  limits,
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
    if (!isNaN(n)) onChange(limits ? Math.min(limits[1], Math.max(limits[0], n)) : n);
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
