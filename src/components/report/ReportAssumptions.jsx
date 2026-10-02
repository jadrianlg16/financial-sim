import { SourceCell, sourceLabel } from '../ui/SourceCell.jsx';
import { fmtMXN, fmtPct } from '../../domain/format.js';

// Liquidation scenarios, analysis assumptions, sources of an imported case and user notes.
export const ReportAssumptions = ({ result, inputs, labels, sources }) => (
  <>
    <h2>Escenarios de liquidación</h2>
    <table className="tbl">
      <thead>
        <tr>
          <th>Caso</th>
          <th>Condición</th>
          <th className="num">Resultado</th>
        </tr>
      </thead>
      <tbody>
        <tr style={{ background: result.remainingDebt === 0 ? 'var(--bg-2)' : 'transparent' }}>
          <td>Crédito ya pagado</td>
          <td style={{ fontFamily: 'Manrope' }}>Horizonte ≥ plazo del crédito</td>
          <td className="num pos">
            {result.remainingDebt === 0 ? `Ganancia: ${fmtMXN(result.actualSalePrice)}` : '—'}
          </td>
        </tr>
        <tr
          style={{
            background:
              result.remainingDebt > 0 && result.actualSalePrice >= result.remainingDebt
                ? 'var(--bg-2)'
                : 'transparent',
          }}
        >
          <td>Crédito vivo, venta cubre saldo</td>
          <td style={{ fontFamily: 'Manrope' }}>Valor venta ≥ saldo restante</td>
          <td className="num">
            {result.remainingDebt > 0 && result.actualSalePrice >= result.remainingDebt
              ? `Ganancia: ${fmtMXN(result.finalPosition)}`
              : '—'}
          </td>
        </tr>
        <tr
          style={{
            background:
              result.remainingDebt > 0 && result.actualSalePrice < result.remainingDebt
                ? 'var(--bg-2)'
                : 'transparent',
          }}
        >
          <td>Crédito vivo, déficit</td>
          <td style={{ fontFamily: 'Manrope' }}>Valor venta &lt; saldo restante</td>
          <td className="num neg">
            {result.remainingDebt > 0 && result.actualSalePrice < result.remainingDebt
              ? `Déficit: ${fmtMXN(Math.abs(result.finalPosition))}`
              : '—'}
          </td>
        </tr>
      </tbody>
    </table>
    <h2>Supuestos clave del análisis</h2>
    <table className="tbl">
      <tbody>
        <tr>
          <td>Tipo de financiamiento</td>
          <td className="num">{labels.financeLabel}</td>
        </tr>
        {result.isBalloon && (
          <tr>
            <td>Pago final (globo)</td>
            <td className="num">
              {fmtMXN(result.balloonPayment)} en mes {result.months}
            </td>
          </tr>
        )}
        {result.isUberMode && (
          <tr>
            <td>Régimen fiscal del ingreso</td>
            <td className="num">{labels.taxRegimeLabel}</td>
          </tr>
        )}
        <tr>
          <td>Modo de seguro</td>
          <td className="num">{labels.insuranceModeLabel}</td>
        </tr>
        <tr>
          <td>Tasa de descuento (costo de oportunidad)</td>
          <td className="num">{fmtPct(result.discountAnnual, 1)} anual</td>
        </tr>
        <tr>
          <td>Inflación general de costos</td>
          <td className="num">{fmtPct(result.generalInflation, 1)}/año</td>
        </tr>
        <tr>
          <td>Método de depreciación</td>
          <td className="num" style={{ textTransform: 'capitalize' }}>
            {inputs.depreciationMethod} · {fmtPct(inputs.depreciationRate, 0)}/año
          </td>
        </tr>
        <tr>
          <td>Factor de reventa / costo de venta</td>
          <td className="num">
            {inputs.salesFactor.toFixed(2)}× · {fmtPct(result.sellingCostPct, 1)}
          </td>
        </tr>
        {result.tradeInValue > 0 && (
          <tr>
            <td>Auto a cuenta (trade-in)</td>
            <td className="num">{fmtMXN(result.tradeInValue)}</td>
          </tr>
        )}
        {result.acquisitionFees > 0 && (
          <tr>
            <td>Gastos de adquisición</td>
            <td className="num">{fmtMXN(result.acquisitionFees)}</td>
          </tr>
        )}
        {result.totalRepairReserve > 0 && (
          <tr>
            <td>Reserva de reparaciones (horizonte)</td>
            <td className="num">{fmtMXN(result.totalRepairReserve)}</td>
          </tr>
        )}
      </tbody>
    </table>

    {sources && (
      <>
        <h2>Fuentes de los datos</h2>
        <table className="tbl">
          <thead>
            <tr>
              <th>Variable</th>
              <th>Fuente</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(sources).map(([k, v]) => (
              <tr key={k}>
                <td style={{ fontFamily: 'Manrope', fontWeight: 500 }}>{sourceLabel(k)}</td>
                <td style={{ wordBreak: 'break-all', fontSize: 11 }}>
                  <SourceCell value={v} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    )}

    {inputs.userNotes && inputs.userNotes.trim() && (
      <>
        <h2>Notas y fuentes del usuario</h2>
        <p
          style={{
            whiteSpace: 'pre-wrap',
            fontSize: 13.5,
            background: 'var(--bg-2)',
            padding: '14px 16px',
            borderRadius: 4,
          }}
        >
          {inputs.userNotes.trim()}
        </p>
      </>
    )}
  </>
);
