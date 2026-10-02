import { fmtMXN, fmtPct } from '../../domain/format.js';

// Cómo se paga el auto: arrendamiento, crédito con pago final, crédito tradicional
// o contado, con el CAT, el costo del dinero y la comparación contra pagar de contado.
export const ReportFinancing = ({ R, inputs }) => (
  <>
    {R.isLease ? (
      <>
        <h2>Arrendamiento (renta)</h2>
        <p>
          No estás comprando el auto: lo <strong>rentas</strong> por{' '}
          <strong>{fmtMXN(R.monthlyPayment)}/mes</strong> durante {R.months} meses. Como
          arrendatario <strong>no eres dueño</strong>, así que no hay reventa ni depreciación a tu
          favor al final del plazo. El enganche/depósito inicial de {fmtMXN(R.cashPaid)} normalmente{' '}
          <strong>no es recuperable</strong>.
        </p>
        <p>
          La renta cubre el uso del vehículo, pero el{' '}
          <strong>seguro, la gasolina y el mantenimiento los sigues pagando tú</strong>
          {R.leaseKmPenaltyYear > 0 ? (
            <>
              . Además, con tu kilometraje proyectado se estima una{' '}
              <strong>penalización por exceso de km de {fmtMXN(R.leaseKmPenaltyYear)}/año</strong>
            </>
          ) : (
            ''
          )}
          . Por eso, en arrendamiento el costo total se mide por lo que pagas (renta + operación),
          sin recuperación por venta.
        </p>
      </>
    ) : R.isBalloon && R.financed > 0 ? (
      <>
        <h2>Financiamiento con pago final (globo)</h2>
        <p>
          Financias {fmtMXN(R.financed)} a una tasa de lista de {fmtPct(inputs.interestRate, 1)} por{' '}
          {inputs.loanMonths} meses. Como dejas un <strong>valor residual</strong> (
          {fmtPct(R.balloonPct, 0)} del financiado) sin amortizar, tu mensualidad baja a{' '}
          <strong>{fmtMXN(R.monthlyPayment)}</strong>, pero queda un{' '}
          <strong>pago final ("globo") de {fmtMXN(R.balloonPayment)}</strong> en el mes {R.months}.
          Ese pago lo cubres (o refinancias) para quedarte el auto, o lo saldas vendiéndolo al
          cierre del plazo.
        </p>
        <p>
          La tasa de lista no es el costo real: el <strong>CAT es {fmtPct(R.cat, 1)}</strong>{' '}
          (incluye la comisión de apertura) y la tasa efectiva anual es {fmtPct(R.ear, 1)}. En total
          pagarás {fmtMXN(R.totalInterest)} de intereses más {fmtMXN(R.openingFee)} de apertura.
        </p>
        <FinanceVsCash R={R} />
      </>
    ) : R.financed > 0 ? (
      <>
        <h2>Análisis del financiamiento</h2>
        <p>
          Financias {fmtMXN(R.financed)} a una tasa de lista de {fmtPct(inputs.interestRate, 1)} por{' '}
          {inputs.loanMonths} meses, lo que da una mensualidad de{' '}
          <strong>{fmtMXN(R.monthlyPayment)}</strong>. Pero la tasa de lista no es el costo real: el{' '}
          <strong>CAT es {fmtPct(R.cat, 1)}</strong> (incluye la comisión de apertura) y la tasa
          efectiva anual es {fmtPct(R.ear, 1)}. En total pagarás {fmtMXN(R.totalInterest)} de
          intereses más {fmtMXN(R.openingFee)} de apertura.
        </p>
        <FinanceVsCash R={R} />
      </>
    ) : (
      <>
        <h2>Pago de contado</h2>
        <p>
          Pagas {fmtMXN(R.cashPaid)} de contado. Recuerda el <strong>costo de oportunidad</strong>:
          ese dinero invertido a {fmtPct(R.discountAnnual, 1)} anual generaría ≈
          {fmtMXN(R.opportunityCostUpfront)} en {inputs.horizonYears} años. No es dinero "gratis"
          sólo por no pagar intereses.
        </p>
      </>
    )}
  </>
);

// Financiar vs. pagar de contado, comparados en valor presente.
const FinanceVsCash = ({ R }) => (
  <p
    style={{
      background: R.financeVsCashPV >= 0 ? '#e7f0e4' : '#f7e6e0',
      padding: '12px 16px',
      borderRadius: 4,
      fontSize: 13.5,
    }}
  >
    <strong>¿Financiar o pagar de contado?</strong> Comparando en valor de hoy (tasa de oportunidad{' '}
    {fmtPct(R.discountAnnual, 1)}),{' '}
    {R.financeVsCashPV >= 0 ? (
      <>
        te conviene <strong style={{ color: 'var(--pos)' }}>financiar</strong>: conservar tu dinero
        invertido vale {fmtMXN(R.financeVsCashPV)} más que pagar todo de golpe.
      </>
    ) : (
      <>
        te conviene <strong style={{ color: 'var(--neg)' }}>pagar de contado</strong>: financiar
        cuesta {fmtMXN(Math.abs(R.financeVsCashPV))} más en valor presente.
      </>
    )}
  </p>
);
