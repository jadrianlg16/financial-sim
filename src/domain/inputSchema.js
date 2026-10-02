// What a valid scenario looks like, for data the app did not just produce itself:
// values typed past a slider, an imported LLM answer, or state saved in
// localStorage by an older version (or edited by hand). Everything that enters
// the model from outside goes through these checks.
import { CAR_PRESETS, CITY_PRESETS } from './constants.js';
import { DEFAULT_INPUTS } from './defaults.js';

export const isPlainObject = (x) => x != null && typeof x === 'object' && !Array.isArray(x);

/** Allowed values of every option (string) input. */
export const OPTIONS = {
  vehicleType: ['gasoline', 'diesel', 'hybrid', 'electric'],
  vehicleCondition: ['new', 'used'],
  insuranceMode: ['fixed', 'pctOfValue'],
  taxRegime: ['resico', 'gross', 'net'],
  financeType: ['annuity', 'balloon', 'lease'],
  depreciationMethod: ['declining', 'straight', 'realistic'],
  purchaseMode: ['cash', 'credit', 'hybrid'],
  downPaymentMode: ['percent', 'fixed'],
  operationMode: ['uber-breakeven', 'uber-target-profit', 'no-uber'],
  carPreset: Object.keys(CAR_PRESETS),
  city: Object.keys(CITY_PRESETS),
};

/**
 * Hard limits on the inputs that size the model's loops: the horizon sets the
 * years of cash flow and the terms set the rows of the amortization table. They
 * are wider than the sliders (typing past a slider is allowed) but keep a typed
 * or saved value from freezing the page.
 */
export const INPUT_LIMITS = {
  horizonYears: [1, 30],
  loanMonths: [1, 120],
  leaseTermMonths: [1, 120],
};

/** Maximum length of each free-text input. */
export const TEXT_LIMITS = {
  carName: 120,
  cityName: 120,
  carDescription: 1000,
  carJustification: 1000,
  userNotes: 10000,
};

/** Clamps a number to the hard limits of `key`, if it has any. */
export const clampInput = (key, value) => {
  const limits = INPUT_LIMITS[key];
  return limits ? Math.min(limits[1], Math.max(limits[0], value)) : value;
};

/**
 * Coerces an untrusted inputs object to the shape of DEFAULT_INPUTS: only known
 * keys are kept, each must have its default's type (numbers finite, options one
 * of OPTIONS, text within TEXT_LIMITS), and anything else falls back to the
 * default. Never throws.
 */
export function sanitizeInputs(raw) {
  const out = { ...DEFAULT_INPUTS };
  if (!isPlainObject(raw)) return out;
  for (const key of Object.keys(DEFAULT_INPUTS)) {
    if (!Object.hasOwn(raw, key)) continue;
    const value = raw[key];
    const fallback = DEFAULT_INPUTS[key];
    if (typeof fallback === 'number') {
      if (typeof value === 'number' && Number.isFinite(value)) out[key] = clampInput(key, value);
    } else if (typeof fallback === 'boolean') {
      if (typeof value === 'boolean') out[key] = value;
    } else if (typeof value === 'string') {
      if (OPTIONS[key]) {
        if (OPTIONS[key].includes(value)) out[key] = value;
      } else {
        out[key] = value.slice(0, TEXT_LIMITS[key] ?? 200);
      }
    }
  }
  return out;
}
