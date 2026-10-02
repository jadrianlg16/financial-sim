import { CAR_PRESETS } from './constants.js';

/** Car name to display: the preset's, or the imported name for a custom car. */
export function carDisplayName(inputs) {
  if (inputs.carPreset === 'custom' && inputs.carName) return inputs.carName;
  return CAR_PRESETS[inputs.carPreset]?.name || 'auto seleccionado';
}
