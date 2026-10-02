// localStorage access, always inside try/catch: in private mode, with storage
// blocked, or in a sandboxed iframe (opaque origin, where even reading
// `localStorage` throws) the app keeps calculating, only without persistence.
// Saved state is untrusted: an older version or a hand edit can leave anything
// there, so it is schema-checked before the app uses it.
import { SCENARIO_COLORS } from '../domain/constants.js';
import {
  isPlainObject,
  sanitizeInputs,
  sanitizeSources,
  TEXT_LIMITS,
} from '../domain/inputSchema.js';

export const STORAGE_KEY = 'autopilot.v1';
export const SIDEBAR_MODE_KEY = 'autopilot.sidebarMode';
const MAX_SAVED = 50;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

// Sidebar detail level: 'basic' shows the essentials for a first decision;
// 'advanced', every variable. Saved apart from the inputs.
export const readSidebarMode = () => {
  try {
    const m = localStorage.getItem(SIDEBAR_MODE_KEY);
    return m === 'advanced' ? 'advanced' : 'basic';
  } catch {
    return 'basic';
  }
};

/**
 * Turns whatever was saved under STORAGE_KEY into state the app can render:
 * inputs coerced to the shape of DEFAULT_INPUTS, saved scenarios that have an
 * inputs object (each sanitized the same way, with a name and a color), and the
 * imported sources. Returns null when there is nothing usable.
 */
export function sanitizePersisted(data) {
  if (!isPlainObject(data)) return null;
  const saved = Array.isArray(data.saved)
    ? data.saved
        .filter((s) => isPlainObject(s) && isPlainObject(s.inputs))
        .slice(0, MAX_SAVED)
        .map((s, i) => ({
          name:
            typeof s.name === 'string' && s.name.trim()
              ? s.name.slice(0, TEXT_LIMITS.carName)
              : `Escenario ${i + 1}`,
          inputs: sanitizeInputs(s.inputs),
          color:
            typeof s.color === 'string' && HEX_COLOR.test(s.color)
              ? s.color
              : SCENARIO_COLORS[i % SCENARIO_COLORS.length],
        }))
    : [];
  return {
    inputs: sanitizeInputs(data.inputs),
    saved,
    sources: sanitizeSources(data.sources),
  };
}

export const readPersisted = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizePersisted(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
};

/** Deletes everything the app saved; true if storage was reachable. */
export const clearPersisted = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SIDEBAR_MODE_KEY);
    return true;
  } catch {
    return false;
  }
};
