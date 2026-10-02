import React from 'react';

export const Segmented = ({ options, value, onChange }) => (
  <div className="seg">
    {options.map((o) => (
      <button
        key={o.value}
        className={value === o.value ? 'active' : ''}
        onClick={() => onChange(o.value)}
      >
        {o.label}
      </button>
    ))}
  </div>
);
