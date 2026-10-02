export const fmtMXN = (n, dec = 0) =>
  !isFinite(n)
    ? '—'
    : n.toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: dec,
        maximumFractionDigits: dec,
      });
export const fmtN = (n, dec = 0) =>
  !isFinite(n)
    ? '—'
    : n.toLocaleString('es-MX', { minimumFractionDigits: dec, maximumFractionDigits: dec });
export const fmtFixed = (n, dec = 1) => (Number.isFinite(n) ? n.toFixed(dec) : '—');
export const fmtPct = (n, dec = 1) => (Number.isFinite(n) ? `${(n * 100).toFixed(dec)}%` : '—');
export const num = (v, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback);
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, num(v, lo)));
export const nonNegative = (v, fallback = 0) => Math.max(0, num(v, fallback));
export const positive = (v, fallback = 1) => Math.max(0.000001, num(v, fallback));

// Tooltip accesible en touch (FEATURE 1). En desktop sigue funcionando el :hover
// del CSS; en móvil/tap se alterna `open` y se fuerza la visibilidad del tip por
// estilo en línea (sin tocar el CSS global de FontsAndTheme). Cierra al perder el
// foco (blur) o con un segundo tap. stopPropagation evita disparar handlers del padre.
