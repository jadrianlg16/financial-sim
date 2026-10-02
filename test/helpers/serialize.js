// Order-preserving, lossless JSON for characterization snapshots.
//
// JSON.stringify turns NaN and ±Infinity into null, drops the sign of -0 and
// omits undefined properties, and Vitest's default serializer sorts object keys.
// None of that is acceptable when the snapshot must prove a refactor left the
// output byte-for-byte identical, so those values are spelled out and key order
// is kept as produced.
const encode = (value) => {
  if (value === undefined) return '__undefined__';
  if (typeof value !== 'number') return value;
  if (Number.isNaN(value)) return '__NaN__';
  if (value === Infinity) return '__Infinity__';
  if (value === -Infinity) return '__-Infinity__';
  if (Object.is(value, -0)) return '__-0__';
  return value;
};

export const serialize = (value) => `${JSON.stringify(value, (_key, v) => encode(v), 2)}\n`;
