import { Wallet, AlertTriangle, CheckCircle2, Battery } from 'lucide-react';
import { fmtFixed, fmtMXN, fmtN } from '../domain/format.js';

// ============================================================================
// BLOQUE: VEREDICTO
// ----------------------------------------------------------------------------
// Resumen de una línea, en lenguaje simple, que responde "¿conviene o no?":
//   - Sin Uber → cuánto cuesta tener el auto y el resultado final.
//   - Uber     → viable / viable pero pesado / inviable, y por qué (pérdida por
//                viaje, autonomía o carga del EV, horas insuficientes, o más de
//                4 viajes por hora, que no es realista).
// ============================================================================
export const Verdict = ({ result, inputs }) => {
  if (!result.isUberMode) {
    return (
      <div className="verdict warn">
        <div className="verdict-icon">
          <Wallet size={22} color="var(--warn)" />
        </div>
        <div>
          <div className="verdict-text">
            Tener el auto cuesta{' '}
            <span className="mono">{fmtMXN(result.monthlyTotalOperative)}</span>/mes
          </div>
          <div className="verdict-sub">
            En {inputs.horizonYears} años gastarás {fmtMXN(result.totalSpentGross)} en total. Al
            vender el auto recuperas {fmtMXN(result.terminalRecovery)} (venta − deuda), dejando un
            costo neto de <strong>{fmtMXN(result.totalProjectCost)}</strong>.
          </div>
        </div>
      </div>
    );
  }
  if (result.tripsPerHourWarn) {
    return (
      <div className="verdict bad">
        <div className="verdict-icon">
          <AlertTriangle size={22} color="var(--neg)" />
        </div>
        <div>
          <div className="verdict-text">Más de 4 viajes/hora no es realista</div>
          <div className="verdict-sub">El modelo asume un tope físico de 4 viajes por hora.</div>
        </div>
      </div>
    );
  }
  if (result.netContributionPerTrip <= 0) {
    return (
      <div className="verdict bad">
        <div className="verdict-icon">
          <AlertTriangle size={22} color="var(--neg)" />
        </div>
        <div>
          <div className="verdict-text">Cada viaje pierde dinero</div>
          <div className="verdict-sub">
            La contribución por viaje es {fmtMXN(result.netContributionPerTrip, 2)} después de
            comisión, impuesto bruto, energía y mantenimiento. Sube tarifa o baja costos/km.
          </div>
        </div>
      </div>
    );
  }
  if (result.evRangeShortfall) {
    return (
      <div className="verdict bad">
        <div className="verdict-icon">
          <Battery size={22} color="var(--neg)" />
        </div>
        <div>
          <div className="verdict-text">La autonomía eléctrica no alcanza</div>
          <div className="verdict-sub">
            El plan requiere {fmtN(result.totalDailyKm)} km/día, pero una carga útil rinde ~
            {fmtN(result.dailyRangeKm)} km. Ajusta batería, km por viaje, días u horas antes de
            considerarlo viable.
          </div>
        </div>
      </div>
    );
  }
  if (result.chargingExceedsAvailableHours) {
    return (
      <div className="verdict bad">
        <div className="verdict-icon">
          <Battery size={22} color="var(--neg)" />
        </div>
        <div>
          <div className="verdict-text">La carga consume la jornada disponible</div>
          <div className="verdict-sub">
            La carga requiere {fmtFixed(result.chargingHoursPerDay)} hrs/día y sólo tienes{' '}
            {fmtFixed(inputs.maxHoursPerDay)} hrs/día disponibles.
          </div>
        </div>
      </div>
    );
  }
  if (!result.feasible) {
    return (
      <div className="verdict bad">
        <div className="verdict-icon">
          <AlertTriangle size={22} color="var(--neg)" />
        </div>
        <div>
          <div className="verdict-text">No alcanzan las horas del día</div>
          <div className="verdict-sub">
            Necesitas {fmtN(result.breakEvenTrips)} viajes/mes pero el máximo posible es{' '}
            {fmtN(result.maxTripsMonth)}.
            {result.chargingHoursPerDay > 0.5 &&
              ` (La carga eléctrica consume ${fmtFixed(result.chargingHoursPerDay)} hrs/día.)`}
          </div>
        </div>
      </div>
    );
  }
  if (result.hoursPerDay > 5) {
    return (
      <div className="verdict warn">
        <div className="verdict-icon">
          <AlertTriangle size={22} color="var(--warn)" />
        </div>
        <div>
          <div className="verdict-text">
            Es viable, pero pesado: {fmtFixed(result.hoursPerDay)} hrs/día
          </div>
          <div className="verdict-sub">
            {fmtN(result.breakEvenTrips)} viajes/mes · {fmtFixed(result.hoursPerWeek)} hrs/semana ·
            podrías ganar {fmtMXN(result.safetyMargin)} extra al máximo
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
          {fmtFixed(result.hoursPerDay)} hrs/día · {fmtFixed(result.weeklyDays)} días/sem ·{' '}
          {fmtFixed(result.hoursPerWeek)} hrs/sem total · holgura para ganar{' '}
          {fmtMXN(result.safetyMargin)} extra
        </div>
      </div>
    </div>
  );
};
