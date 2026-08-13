import { CAR_PRESETS } from './constants.js';

export function carDisplayName(inputs) {
  if (inputs.carPreset === 'custom' && inputs.carName) return inputs.carName;
  return CAR_PRESETS[inputs.carPreset]?.name || 'auto seleccionado';
}
