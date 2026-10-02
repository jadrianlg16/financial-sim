import { fmtFixed, fmtMXN, fmtN, fmtPct } from '../../domain/format.js';

// Costo total de propiedad por categoría y tabla resumen con todas las cifras clave.
export const ReportTables = ({ R, inputs, yearEnd, car, vehicleLabel, breakdown }) => (
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
            <strong>{fmtMXN(R.totalSpentGross)}</strong>
          </td>
        </tr>
        <tr>
          <td>(−/+) Recuperación terminal real (venta − deuda)</td>
          <td className={`num ${R.terminalRecovery >= 0 ? 'pos' : 'neg'}`}>
            {R.terminalRecovery >= 0
              ? `−${fmtMXN(R.terminalRecovery)}`
              : `+${fmtMXN(Math.abs(R.terminalRecovery))}`}
          </td>
        </tr>
        <tr>
          <td>
            <strong>Costo neto del proyecto</strong>
          </td>
          <td className="num">
            <strong>{fmtMXN(R.totalProjectCost)}</strong>
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
          <td className="num">{fmtMXN(R.upfrontCash)}</td>
        </tr>
        {R.financed > 0 && (
          <>
            <tr>
              <td>Monto financiado</td>
              <td className="num">{fmtMXN(R.financed)}</td>
            </tr>
            <tr>
              <td>Tasa / Plazo</td>
              <td className="num">
                {fmtPct(inputs.interestRate, 1)} / {inputs.loanMonths} meses
              </td>
            </tr>
            <tr>
              <td>Mensualidad</td>
              <td className="num">{fmtMXN(R.monthlyPayment)}</td>
            </tr>
            <tr>
              <td>VF (nominal total)</td>
              <td className="num">{fmtMXN(R.fvTotal)}</td>
            </tr>
            <tr>
              <td>VP (descontado)</td>
              <td className="num">{fmtMXN(R.pvTotal)}</td>
            </tr>
            <tr>
              <td>Costo del dinero (VF − VP)</td>
              <td className="num">{fmtMXN(R.timeValueOfMoney)}</td>
            </tr>
            <tr>
              <td>Intereses pagados</td>
              <td className="num">{fmtMXN(R.totalInterest)}</td>
            </tr>
          </>
        )}
        {R.oneTimeUberCosts > 0 && (
          <tr>
            <td>Trámites iniciales Uber (único)</td>
            <td className="num">{fmtMXN(R.oneTimeUberCosts)}</td>
          </tr>
        )}
        <tr>
          <td>Seguro mensual</td>
          <td className="num">{fmtMXN(R.monthlyIns)}</td>
        </tr>
        <tr>
          <td>Refrendo/tenencia mensual</td>
          <td className="num">{fmtMXN(R.monthlyRefrendo)}</td>
        </tr>
        <tr>
          <td>Lavado + propinas mensual</td>
          <td className="num">{fmtMXN(R.monthlyCarWash + R.monthlyTips)}</td>
        </tr>
        <tr>
          <td>Misceláneos mensual</td>
          <td className="num">{fmtMXN(R.monthlyMisc)}</td>
        </tr>
        <tr>
          <td>Egresos operativos mensuales</td>
          <td className="num">{fmtMXN(R.monthlyTotalOperative)}</td>
        </tr>
        {R.isUberMode && (
          <>
            <tr>
              <td>Ingreso neto antes de km/viaje</td>
              <td className="num pos">{fmtMXN(R.netPerTrip, 2)}</td>
            </tr>
            <tr>
              <td>Contribución después de km/viaje</td>
              <td className={`num ${R.netContributionPerTrip >= 0 ? 'pos' : 'neg'}`}>
                {fmtMXN(R.netContributionPerTrip, 2)}
              </td>
            </tr>
            <tr>
              <td>Equilibrio operativo</td>
              <td className="num">{fmtN(R.operatingBreakEvenTrips, 0)} viajes/mes</td>
            </tr>
            <tr>
              <td>Recuperación mensual del proyecto</td>
              <td className="num">{fmtMXN(R.projectRecoveryMonthly)}</td>
            </tr>
            <tr>
              <td>
                <strong>Punto de equilibrio del proyecto</strong>
              </td>
              <td className="num">
                <strong>{fmtN(R.breakEvenTrips, 0)} viajes/mes</strong>
              </td>
            </tr>
            <tr>
              <td>
                <strong>Intensidad: días/semana</strong>
              </td>
              <td className="num">
                <strong>{fmtFixed(R.weeklyDays)} días</strong>
              </td>
            </tr>
            <tr>
              <td>
                <strong>Intensidad: horas/día</strong>
              </td>
              <td className="num">
                <strong>{fmtFixed(R.hoursPerDay)} hrs</strong>
              </td>
            </tr>
            <tr>
              <td>
                <strong>Intensidad: horas/semana</strong>
              </td>
              <td className="num">
                <strong>{fmtFixed(R.hoursPerWeek)} hrs</strong>
              </td>
            </tr>
            <tr>
              <td>Viajes/día</td>
              <td className="num">{fmtFixed(R.tripsPerDay)}</td>
            </tr>
          </>
        )}
        <tr>
          <td>Valor depreciado en {yearEnd}</td>
          <td className="num">{fmtMXN(R.valueAtEnd)}</td>
        </tr>
        <tr>
          <td>Precio venta esperado (× {inputs.salesFactor.toFixed(2)})</td>
          <td className="num">{fmtMXN(R.actualSalePrice)}</td>
        </tr>
        <tr>
          <td>Saldo crédito en {yearEnd}</td>
          <td className="num">{fmtMXN(R.remainingDebt)}</td>
        </tr>
        <tr>
          <td>
            <strong>Costo neto del proyecto</strong>
          </td>
          <td className="num">
            <strong>{fmtMXN(R.totalProjectCost)}</strong>
          </td>
        </tr>
        <tr>
          <td>Resultado de liquidación (venta − deuda)</td>
          <td className={`num ${R.liquidationPosition >= 0 ? 'pos' : 'neg'}`}>
            {fmtMXN(R.liquidationPosition)}
          </td>
        </tr>
        {R.isUberMode && (
          <tr>
            <td>
              <strong>Resultado neto del proyecto</strong>
            </td>
            <td className={`num ${R.netProjectResult >= 0 ? 'pos' : 'neg'}`}>
              <strong>{fmtMXN(R.netProjectResult)}</strong>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </>
);
