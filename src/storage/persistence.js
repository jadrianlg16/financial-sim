// Lecturas de localStorage, envueltas en try/catch: en modo privado o con el
// almacenamiento bloqueado la app sigue calculando, sólo sin persistencia.

// Nivel de detalle del panel: 'basic' muestra lo esencial para una primera
// decisión; 'advanced', todas las variables. Se guarda aparte de los inputs.
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
