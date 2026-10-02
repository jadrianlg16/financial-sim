// ============================================================================
// Nivel de detalle del panel: 'basic' muestra sólo lo esencial para una primera
// decisión; 'advanced' muestra TODAS las variables (comportamiento histórico).
// La preferencia se persiste en localStorage (sin pasar por App/inputs).
export const readSidebarMode = () => {
  try {
    const m = localStorage.getItem('autopilot.sidebarMode');
    return m === 'advanced' ? 'advanced' : 'basic';
  } catch {
    return 'basic';
  }
};
export const STORAGE_KEY = 'autopilot.v1';
export const readPersisted = () => {
  try {
    const raw = typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
