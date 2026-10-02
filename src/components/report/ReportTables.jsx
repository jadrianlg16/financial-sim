import { fmtFixed, fmtMXN, fmtN, fmtPct } from '../../domain/format.js';

// Total cost of ownership by category and a summary table with every key figure.
export const ReportTables = ({ result, inputs, yearEnd, car, vehicleLabel, breakdown }) => (
  <>
    <h2>Costo total de propiedad ({inputs.horizonYears} años)</h2>
    <table className="tbl">
      <thead>
        <tr>
          <th>Concepto</th>
          <th className="num">Total del período</th>
        </tr>
      </thead>
      <tbody>
        {breakdown.map((b, i) => (
          <tr key={i}>
            <td style={{ fontFamily: 'Manrope', fontWeight: 500 }}>{b.name}</td>
            <td className="num">{fmtMXN(b.total)}</td>
          </tr>
        ))}
        <tr style={{ borderTop: '2px solid var(--line)' }}>
          <td>
            <strong>Gasto bruto total</strong>
          </td>
          <td className="num">
            <strong>{fmtMXN(result.totalSpentGross)}</strong>
          </td>
        </tr>
        <tr>
          <td>(−/+) Recuperación terminal real (venta − deuda)</td>
          <td className={`num ${result.terminalRecovery >= 0 ? 'pos' : 'neg'}`}>
            {result.terminalRecovery >= 0
              ? `−${fmtMXN(result.terminalRecovery)}`
              : `+${fmtMXN(Math.abs(result.terminalRecovery))}`}
          </td>
        </tr>
        <tr>
          <td>
            <strong>Costo neto del proyecto</strong>
          </td>
          <td className="num">
            <strong>{fmtMXN(result.totalProjectCost)}</strong>
          </td>
        </tr>
      </tbody>
    </table>
    <h2>Tabla resumen</h2>
    <table className="tbl">
      <tbody>
        <tr>
          <td>Vehículo</td>
          <td className="num">
            {car} · {vehicleLabel}
          </td>
        </tr>
        <tr>
          <td>Precio</td>
          <td className="num">{fmtMXN(inputs.carPrice)}</td>
        </tr>
        <tr>
          <td>Modo de compra</td>
          <td className="num" style={{ textTransform: 'capitalize' }}>
            {inputs.purchaseMode}
          </td>
        </tr>
        <tr>
          <td>Desembolso inicial</td>
          <td className="num">{fmtMXN(result.upfrontCash)}</td>
        </tr>
        {result.financed > 0 && (
          <>
            <tr>
              <td>Monto financiado</td>
              <td className="num">{fmtMXN(result.financed)}</td>
            </tr>
            <tr>
              <td>Tasa / Plazo</td>
              <td className="num">
                {fmtPct(inputs.interestRate, 1)} / {inputs.loanMonths} meses
              </td>
            </tr>
            <tr>
              <td>Mensualidad</td>
              <td className="num">{fmtMXN(result.monthlyPayment)}</td>
            </tr>
            <tr>
              <td>VF (nominal total)</td>
              <td className="num">{fmtMXN(result.fvTotal)}</td>
            </tr>
            <tr>
              <td>VP (descontado)</td>
              <td className="num">{fmtMXN(result.pvTotal)}</td>
            </tr>
            <tr>
              <td>Costo del dinero (VF − VP)</td>
              <td className="num">{fmtMXN(result.timeValueOfMoney)}</td>
            </tr>
            <tr>
              <td>Intereses pagados</td>
              <td className="num">{fmtMXN(result.totalInterest)}</td>
            </tr>
          </>
        )}
        {result.oneTimeUberCosts > 0 && (
          <tr>
            <td>Trámites iniciales Uber (único)</td>
            <td className="num">{fmtMXN(result.oneTimeUberCosts)}</td>
          </tr>
        )}
        <tr>
          <td>Seguro mensual</td>
          <td className="num">{fmtMXN(result.monthlyIns)}</td>
        </tr>
        <tr>
          <td>Refrendo/tenencia mensual</td>
          <td className="num">{fmtMXN(result.monthlyRefrendo)}</td>
        </tr>
        <tr>
          <td>Lavado + propinas mensual</td>
          <td className="num">{fmtMXN(result.monthlyCarWash + result.monthlyTips)}</td>
        </tr>
        <tr>
          <td>Misceláneos mensual</td>
          <td className="num">{fmtMXN(result.monthlyMisc)}</td>
        </tr>
        <tr>
          <td>Egresos operativos mensuales</td>
          <td className="num">{fmtMXN(result.monthlyTotalOperative)}</td>
        </tr>
        {result.isUberMode && (
          <>
            <tr>
              <td>Ingreso neto antes de km/viaje</td>
              <td className="num pos">{fmtMXN(result.netPerTrip, 2)}</td>
            </tr>
            <tr>
              <td>Contribución después de km/viaje</td>
              <td className={`num ${result.netContributionPerTrip >= 0 ? 'pos' : 'neg'}`}>
                {fmtMXN(result.netContributionPerTrip, 2)}
              </td>
            </tr>
            <tr>
              <td>Equilibrio operativo</td>
              <td className="num">{fmtN(result.operatingBreakEvenTrips, 0)} viajes/mes</td>
            </tr>
            <tr>
              <td>Recuperación mensual del proyecto</td>
              <td className="num">{fmtMXN(result.projectRecoveryMonthly)}</td>
            </tr>
            <tr>
              <td>
                <strong>Punto de equilibrio del proyecto</strong>
              </td>
              <td className="num">
                <strong>{fmtN(result.breakEvenTrips, 0)} viajes/mes</strong>
              </td>
            </tr>
            <tr>
              <td>
                <strong>Intensidad: días/semana</strong>
              </td>
              <td className="num">
                <strong>{fmtFixed(result.weeklyDays)} días</strong>
              </td>
            </tr>
            <tr>
              <td>
                <strong>Intensidad: horas/día</strong>
              </td>
              <td className="num">
                <strong>{fmtFixed(result.hoursPerDay)} hrs</strong>
              </td>
            </tr>
            <tr>
              <td>
                <strong>Intensidad: horas/semana</strong>
              </td>
              <td className="num">
                <strong>{fmtFixed(result.hoursPerWeek)} hrs</strong>
              </td>
            </tr>
            <tr>
              <td>Viajes/día</td>
              <td className="num">{fmtFixed(result.tripsPerDay)}</td>
            </tr>
          </>
        )}
        <tr>
          <td>Valor depreciado en {yearEnd}</td>
          <td className="num">{fmtMXN(result.valueAtEnd)}</td>
        </tr>
        <tr>
          <td>Precio venta esperado (× {inputs.salesFactor.toFixed(2)})</td>
          <td className="num">{fmtMXN(result.actualSalePrice)}</td>
        </tr>
        <tr>
          <td>Saldo crédito en {yearEnd}</td>
          <td className="num">{fmtMXN(result.remainingDebt)}</td>
        </tr>
        <tr>
          <td>
            <strong>Costo neto del proyecto</strong>
          </td>
          <td className="num">
            <strong>{fmtMXN(result.totalProjectCost)}</strong>
          </td>
        </tr>
        <tr>
          <td>Resultado de liquidación (venta − deuda)</td>
          <td className={`num ${result.liquidationPosition >= 0 ? 'pos' : 'neg'}`}>
            {fmtMXN(result.liquidationPosition)}
          </td>
        </tr>
        {result.isUberMode && (
          <tr>
            <td>
              <strong>Resultado neto del proyecto</strong>
            </td>
            <td className={`num ${result.netProjectResult >= 0 ? 'pos' : 'neg'}`}>
              <strong>{fmtMXN(result.netProjectResult)}</strong>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </>
);
