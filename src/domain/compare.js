import { CAR_PRESETS } from './constants.js';
import { currentYear } from './year.js';

// ============================================================================
// PÁGINA: COMPARAR  ·  Objetivos solicitados por el usuario
// ----------------------------------------------------------------------------
// Peticiones (perfiles de usuario): "Quiero comparar diferentes tipos de carros",
// "Quiero saber qué auto me conviene más", y del alcance original: comparar
// múltiples escenarios lado a lado con líneas sobrepuestas y tabla de diferencias.
//   - Cada escenario guardado es una configuración COMPLETA de variables.
//   - Gráfica de utilidad acumulada por escenario (líneas sobrepuestas).
//   - Tabla comparativa: mensual, equilibrio, hrs/sem, costo del proyecto y
//     resultado final, para decidir cuál opción conviene.
//   - "Actual" siempre se compara contra los guardados sin necesidad de guardarlo.
// ============================================================================
// Aplica un preset de auto a un objeto de inputs (versión mínima en línea de la
// lógica del Sidebar: precio/kmpl/tipo/condición + ajustes típicos de usado). No
// muta: devuelve un nuevo objeto. (FEATURE A)
export function applyCarPresetTo(prev, k) {
  if (k === 'custom') return { ...prev, carPreset: 'custom' };
  const c = CAR_PRESETS[k];
  if (!c) return prev;
  const next = {
    ...prev,
    carPreset: k,
    carPrice: c.price,
    kmpl: c.kmpl || prev.kmpl,
    vehicleType: c.type,
    plugInHybrid: !!c.plugInHybrid,
    kmPerKwh: c.kmPerKwh || prev.kmPerKwh,
    batteryCapacityKwh: c.batteryCapacityKwh || prev.batteryCapacityKwh,
  };
  const cond = c.condition || 'new';
  next.vehicleCondition = cond;
  next.carYear = c.year || currentYear();
  next.odometerKm = c.odometerKm || 0;
  // Los usados ya no tienen garantía de fábrica; los nuevos traen 3 años.
  next.warrantyYearsRemaining = cond === 'used' ? 0 : 3;
  if (cond === 'used') {
    if (!prev.repairReserveAnnual) next.repairReserveAnnual = 6000;
    if (prev.interestRate <= 0.135) next.interestRate = 0.16;
  } else if (prev.repairReserveAnnual === 6000) {
    next.repairReserveAnnual = 0;
  }
  return next;
}
export const cloneInputs = (i) => JSON.parse(JSON.stringify(i));
export const MAX_COMPARE_CARS = 4;

// ----------------------------------------------------------------------------
// FEATURE A — comparar autos lado a lado, EDITABLES en la misma pestaña.
// Antes había que salir de la pestaña, cambiar el sidebar y "Guardar escenario"
// por cada auto (con pérdida y poco obvio). Ahora se sostienen 2–4 autos en
// columnas compactas editables, se recalcula calculate() en vivo por columna, y
// abajo se decide con tabla (mejor por fila) + veredicto (CAE y $/km) + gráfica.
// Los escenarios guardados (props saved/setSaved) siguen disponibles como
// columnas de SÓLO LECTURA, y se puede "cargar la config actual del sidebar".
// ----------------------------------------------------------------------------
