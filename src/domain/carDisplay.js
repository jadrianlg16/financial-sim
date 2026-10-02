import { CAR_PRESETS } from './constants.js';

/** Nombre a mostrar del auto: el del preset, o el nombre importado si es personalizado. */
export function carDisplayName(inputs) {
  if (inputs.carPreset === 'custom' && inputs.carName) return inputs.carName;
  return CAR_PRESETS[inputs.carPreset]?.name || 'auto seleccionado';
}
