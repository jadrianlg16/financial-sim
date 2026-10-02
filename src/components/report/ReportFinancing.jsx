import { fmtMXN, fmtPct } from '../../domain/format.js';

// How the car is paid for: lease, balloon loan, standard loan or cash, with the
// CAT, the cost of money and the comparison against paying cash.
export const ReportFinancing = ({ result, inputs }) => (
  <>
    {result.isLease ? (
      <>
        <h2>Arrendamiento (renta)</h2>
        <p>
          No estás comprando el auto: lo <strong>rentas</strong> por{' '}
          <strong>{fmtMXN(result.monthlyPayment)}/mes</strong> durante {result.months} meses. Como
          arrendatario <strong>no eres dueño</strong>, así que no hay reventa ni depreciación a tu
          favor al final del plazo. El enganche/depósito inicial de {fmtMXN(result.cashPaid)}{' '}
          normalmente <strong>no es recuperable</strong>.
        </p>
        <p>
          La renta cubre el uso del vehículo, pero el{' '}
          <strong>seguro, la gasolina y el mantenimiento los sigues pagando tú</strong>
          {result.leaseKmPenaltyYear > 0 ? (
            <>
              . Además, con tu kilometraje proyectado se estima una{' '}
              <strong>
                penalización por exceso de km de {fmtMXN(result.leaseKmPenaltyYear)}/año
              </strong>
            </>
          ) : (
            ''
          )}
          . Por eso, en arrendamiento el costo total se mide por lo que pagas (renta + operación),
          sin recuperación por venta.
        </p>
      </>
    ) : result.isBalloon && result.financed > 0 ? (
      <>
        <h2>Financiamiento con pago final (globo)</h2>
        <p>
          Financias {fmtMXN(result.financed)} a una tasa de lista de{' '}
          {fmtPct(inputs.interestRate, 1)} por {inputs.loanMonths} meses. Como dejas un{' '}
          <strong>valor residual</strong> ({fmtPct(result.balloonPct, 0)} del financiado) sin
          amortizar, tu mensualidad baja a <strong>{fmtMXN(result.monthlyPayment)}</strong>, pero
          queda un <strong>pago final ("globo") de {fmtMXN(result.balloonPayment)}</strong> en el
          mes {result.months}. Ese pago lo cubres (o refinancias) para quedarte el auto, o lo saldas
          vendiéndolo al cierre del plazo.
        </p>
        <p>
          La tasa de lista no es el costo real: el <strong>CAT es {fmtPct(result.cat, 1)}</strong>{' '}
          (incluye la comisión de apertura) y la tasa efectiva anual es {fmtPct(result.ear, 1)}. En
          total pagarás {fmtMXN(result.totalInterest)} de intereses más {fmtMXN(result.openingFee)}{' '}
          de apertura.
        </p>
        <FinanceVsCash result={result} />
      </>
    ) : result.financed > 0 ? (
      <>
        <h2>Análisis del financiamiento</h2>
        <p>
          Financias {fmtMXN(result.financed)} a una tasa de lista de{' '}
          {fmtPct(inputs.interestRate, 1)} por {inputs.loanMonths} meses, lo que da una mensualidad
          de <strong>{fmtMXN(result.monthlyPayment)}</strong>. Pero la tasa de lista no es el costo
          real: el <strong>CAT es {fmtPct(result.cat, 1)}</strong> (incluye la comisión de apertura)
          y la tasa efectiva anual es {fmtPct(result.ear, 1)}. En total pagarás{' '}
          {fmtMXN(result.totalInterest)} de intereses más {fmtMXN(result.openingFee)} de apertura.
        </p>
        <FinanceVsCash result={result} />
      </>
    ) : (
      <>
        <h2>Pago de contado</h2>
        <p>
          Pagas {fmtMXN(result.cashPaid)} de contado. Recuerda el{' '}
          <strong>costo de oportunidad</strong>: ese dinero invertido a{' '}
          {fmtPct(result.discountAnnual, 1)} anual generaría ≈
          {fmtMXN(result.opportunityCostUpfront)} en {inputs.horizonYears} años. No es dinero
          "gratis" sólo por no pagar intereses.
        </p>
      </>
    )}
  </>
);

// Financing vs. paying cash, compared in present value.
const FinanceVsCash = ({ result }) => (
  <p
    style={{
      background: result.financeVsCashPV >= 0 ? '#e7f0e4' : '#f7e6e0',
      padding: '12px 16px',
      borderRadius: 4,
      fontSize: 13.5,
    }}
  >
    <strong>¿Financiar o pagar de contado?</strong> Comparando en valor de hoy (tasa de oportunidad{' '}
    {fmtPct(result.discountAnnual, 1)}),{' '}
    {result.financeVsCashPV >= 0 ? (
      <>
        te conviene <strong style={{ color: 'var(--pos)' }}>financiar</strong>: conservar tu dinero
        invertido vale {fmtMXN(result.financeVsCashPV)} más que pagar todo de golpe.
      </>
    ) : (
      <>
        te conviene <strong style={{ color: 'var(--neg)' }}>pagar de contado</strong>: financiar
        cuesta {fmtMXN(Math.abs(result.financeVsCashPV))} más en valor presente.
      </>
    )}
  </p>
);
