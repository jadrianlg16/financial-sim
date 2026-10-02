import { Activity } from 'lucide-react';
import { Info } from '../ui/Info.jsx';
import { TIPS } from '../../content/tips.js';
import { fmtFixed, fmtMXN, fmtN, fmtPct } from '../../domain/format.js';

// The Uber work plan: per-trip economics, trips and hours needed, capacity used.
export const OperationPlan = ({ result, inputs }) => {
  if (!result.isUberMode) return null;
  return (
    <div className="card">
      <div className="card-title">
        <Activity size={11} /> Plan de operación sugerido{' '}
        <Info text="Lo que tendrías que trabajar para alcanzar tu objetivo." />
      </div>
      <table className="tbl">
        <tbody>
          <tr>
            <td>Ingreso neto antes de km</td>
            <td className="num pos">{fmtMXN(result.netRevenuePerTrip, 2)}</td>
            <td>
              Tarifa {fmtMXN(result.grossPerTrip)} − Uber {fmtMXN(result.platformCommission, 2)} −
              impuesto bruto {fmtMXN(result.taxAmountPerTrip, 2)}
            </td>
          </tr>
          <tr>
            <td>(−) Costo variable por viaje</td>
            <td className="num neg">{fmtMXN(result.variableCostPerTrip, 2)}</td>
            <td>
              {fmtN(result.kmPerTrip, 1)} km/viaje × (energía + mantenimiento base/km con desgaste
              Uber)
            </td>
          </tr>
          <tr>
            <td>
              <strong>Contribución por viaje</strong> <Info text={TIPS.kmPerTrip} />
            </td>
            <td className="num">
              <strong>{fmtMXN(result.netContributionPerTrip, 2)}</strong>
            </td>
            <td>lo que cada viaje aporta a cubrir fijos</td>
          </tr>
          <tr>
            <td>Equilibrio operativo</td>
            <td className="num">{fmtN(result.operatingBreakEvenTrips, 0)}</td>
            <td>Sólo costos mensuales: {fmtMXN(result.operatingFixedMonthlyCosts)}</td>
          </tr>
          <tr>
            <td>Viajes/mes objetivo</td>
            <td className="num">
              <strong>{fmtN(result.breakEvenTrips, 0)}</strong>
            </td>
            <td>
              Operativo {fmtMXN(result.operatingFixedMonthlyCosts)}
              {result.projectRecoveryMonthly > 0 &&
                ` + recuperación proyecto ${fmtMXN(result.projectRecoveryMonthly)}`}
              {result.profitTarget > 0 && ` + meta ${fmtMXN(result.profitTarget)}`}
            </td>
          </tr>
          <tr>
            <td>Viajes por día</td>
            <td className="num">{fmtFixed(result.tripsPerDay)}</td>
            <td>
              en {inputs.workDaysPerMonth} días/mes · {fmtN(result.uberMonthlyKm)} km Uber/mes
            </td>
          </tr>
          <tr>
            <td>
              <strong>Horas por día</strong>
            </td>
            <td className="num">
              <strong>{fmtFixed(result.hoursPerDay)} hrs</strong>
            </td>
            <td>a {inputs.tripsPerHour} viajes/hora</td>
          </tr>
          <tr>
            <td>
              <strong>Horas por semana</strong>
            </td>
            <td className="num">
              <strong>{fmtFixed(result.hoursPerWeek)} hrs</strong>
            </td>
            <td>
              {fmtFixed(result.weeklyDays)} días/sem × {fmtFixed(result.hoursPerDay)} hrs/día
            </td>
          </tr>
          <tr>
            <td>
              Capacidad utilizada <Info text={TIPS.capacity} />
            </td>
            <td className="num">{fmtPct(result.capacityUsage, 1)}</td>
            <td>Tope: {fmtN(result.maxTripsMonth)} viajes/mes</td>
          </tr>
          {result.chargingHoursPerDay > 0 && (
            <tr>
              <td>Carga eléctrica diaria</td>
              <td className="num">{fmtFixed(result.chargingHoursPerDay)} hrs</td>
              <td>Te resta tiempo de trabajo</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
