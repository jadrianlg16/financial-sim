import React from 'react';
import { Wallet, AlertTriangle, CheckCircle2, Battery } from 'lucide-react';
import { fmtFixed, fmtMXN, fmtN } from '../domain/format.js';

// ============================================================================
// BLOQUE: VEREDICTO  ·  Objetivos solicitados por el usuario
// ----------------------------------------------------------------------------
// Resumen de una línea, en lenguaje simple, que responde la pregunta central:
// "¿conviene o no?". Cubre los 3 modos de operación que pidió el usuario:
//   - Sin Uber  → cuánto cuesta tener el auto + resultado final.
//   - Uber      → viable / viable-pero-pesado / inviable (no alcanzan las horas).
//   - Respeta el supuesto del problema: máx 4 viajes/hora (avisa si se excede).
// ============================================================================
export const Verdict = ({ R, inputs }) => {
  if (!R.isUberMode) {
    return (
      <div className="verdict warn">
        <div className="verdict-icon">
          <Wallet size={22} color="var(--warn)" />
        </div>
        <div>
          <div className="verdict-text">
            Tener el auto cuesta <span className="mono">{fmtMXN(R.monthlyTotalOperative)}</span>/mes
          </div>
          <div className="verdict-sub">
            En {inputs.horizonYears} años gastarás {fmtMXN(R.totalSpentGross)} en total. Al vender
            el auto recuperas {fmtMXN(R.terminalRecovery)} (venta − deuda), dejando un costo neto de{' '}
            <strong>{fmtMXN(R.totalProjectCost)}</strong>.
          </div>
        </div>
      </div>
    );
  }
  if (R.tripsPerHourWarn) {
    return (
      <div className="verdict bad">
        <div className="verdict-icon">
          <AlertTriangle size={22} color="var(--neg)" />
        </div>
        <div>
          <div className="verdict-text">Más de 4 viajes/hora no es realista</div>
          <div className="verdict-sub">El problema asume un tope físico de 4 viajes por hora.</div>
        </div>
      </div>
    );
  }
  if (R.netContributionPerTrip <= 0) {
    return (
      <div className="verdict bad">
        <div className="verdict-icon">
          <AlertTriangle size={22} color="var(--neg)" />
        </div>
        <div>
          <div className="verdict-text">Cada viaje pierde dinero</div>
          <div className="verdict-sub">
            La contribución por viaje es {fmtMXN(R.netContributionPerTrip, 2)} después de comisión,
            impuesto bruto, energía y mantenimiento. Sube tarifa o baja costos/km.
          </div>
        </div>
      </div>
    );
  }
  if (R.evRangeShortfall) {
    return (
      <div className="verdict bad">
        <div className="verdict-icon">
          <Battery size={22} color="var(--neg)" />
        </div>
        <div>
          <div className="verdict-text">La autonomía eléctrica no alcanza</div>
          <div className="verdict-sub">
            El plan requiere {fmtN(R.totalDailyKm)} km/día, pero una carga útil rinde ~
            {fmtN(R.dailyRangeKm)} km. Ajusta batería, km por viaje, días u horas antes de
            considerarlo viable.
          </div>
        </div>
      </div>
    );
  }
  if (R.chargingExceedsAvailableHours) {
    return (
      <div className="verdict bad">
        <div className="verdict-icon">
          <Battery size={22} color="var(--neg)" />
        </div>
        <div>
          <div className="verdict-text">La carga consume la jornada disponible</div>
          <div className="verdict-sub">
            La carga requiere {fmtFixed(R.chargingHoursPerDay)} hrs/día y sólo tienes{' '}
            {fmtFixed(inputs.maxHoursPerDay)} hrs/día disponibles.
          </div>
        </div>
      </div>
    );
  }
  if (!R.feasible) {
    return (
      <div className="verdict bad">
        <div className="verdict-icon">
          <AlertTriangle size={22} color="var(--neg)" />
        </div>
        <div>
          <div className="verdict-text">No alcanzan las horas del día</div>
          <div className="verdict-sub">
            Necesitas {fmtN(R.breakEvenTrips)} viajes/mes pero el máximo posible es{' '}
            {fmtN(R.maxTripsMonth)}.
            {R.chargingHoursPerDay > 0.5 &&
              ` (La carga eléctrica consume ${fmtFixed(R.chargingHoursPerDay)} hrs/día.)`}
          </div>
        </div>
      </div>
    );
  }
  if (R.hoursPerDay > 5) {
    return (
      <div className="verdict warn">
        <div className="verdict-icon">
          <AlertTriangle size={22} color="var(--warn)" />
        </div>
        <div>
          <div className="verdict-text">
            Es viable, pero pesado: {fmtFixed(R.hoursPerDay)} hrs/día
          </div>
          <div className="verdict-sub">
            {fmtN(R.breakEvenTrips)} viajes/mes · {fmtFixed(R.hoursPerWeek)} hrs/semana · podrías
            ganar {fmtMXN(R.safetyMargin)} extra al máximo
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="verdict ok">
      <div className="verdict-icon">
        <CheckCircle2 size={22} color="var(--pos)" />
      </div>
      <div>
        <div className="verdict-text">Viable y manejable</div>
        <div className="verdict-sub">
          {fmtFixed(R.hoursPerDay)} hrs/día · {fmtFixed(R.weeklyDays)} días/sem ·{' '}
          {fmtFixed(R.hoursPerWeek)} hrs/sem total · holgura para ganar {fmtMXN(R.safetyMargin)}{' '}
          extra
        </div>
      </div>
    </div>
  );
};
