import { Wallet } from 'lucide-react';
import { Field } from '../ui/Field.jsx';
import { Group } from '../ui/Group.jsx';
import { Info } from '../ui/Info.jsx';
import { Segmented } from '../ui/Segmented.jsx';
import { TIPS } from '../../content/tips.js';
import { fmtMXN, fmtPct } from '../../domain/format.js';

// Forma de pago: contado, crédito (tradicional, con pago final o arrendamiento) o
// mixto, con enganche, tasa, plazo, auto a cuenta y gastos de adquisición.
export const PaymentGroup = ({ inputs, set, mode }) => {
  return (
    <>
      <Group
        icon={Wallet}
        title="¿Cómo lo pagas?"
        blurb="Si ya lo tienes pagado, elige 'Efectivo'. Si lo financias, 'Crédito'."
      >
        <div className="field">
          <div className="field-label" style={{ marginBottom: 4 }}>
            Forma de pago <Info text={TIPS.purchaseMode} />
          </div>
          <Segmented
            value={inputs.purchaseMode}
            onChange={(v) => set('purchaseMode', v)}
            options={[
              { value: 'cash', label: 'Efectivo' },
              { value: 'credit', label: 'Crédito' },
              { value: 'hybrid', label: 'Mixto' },
            ]}
          />
        </div>
        {inputs.purchaseMode === 'credit' && (
          <div className="field">
            <div className="field-label" style={{ marginBottom: 4 }}>
              Tipo de financiamiento <Info text={TIPS.financeType} />
            </div>
            <Segmented
              value={inputs.financeType || 'annuity'}
              onChange={(v) => set('financeType', v)}
              options={[
                { value: 'annuity', label: 'Tradicional' },
                { value: 'balloon', label: 'Pago final' },
                { value: 'lease', label: 'Arrendamiento' },
              ]}
            />
            <div
              style={{
                fontSize: 10.5,
                color: 'var(--muted)',
                marginTop: -2,
                marginBottom: 8,
                lineHeight: 1.5,
              }}
            >
              {(inputs.financeType || 'annuity') === 'annuity' &&
                '→ Mensualidad fija que liquida todo el crédito al final del plazo.'}
              {inputs.financeType === 'balloon' &&
                '→ Dejas un valor residual sin pagar; baja la mensualidad pero hay un pago final grande (el "globo").'}
              {inputs.financeType === 'lease' &&
                '→ Rentas el auto: NO eres dueño, no hay reventa ni depreciación a tu favor.'}
            </div>
          </div>
        )}
        {/* Crédito tradicional o globo: enganche + tasa/plazo + (globo) residual */}
        {inputs.purchaseMode === 'credit' && (inputs.financeType || 'annuity') !== 'lease' && (
          <>
            <div className="field">
              <div className="field-label" style={{ marginBottom: 4 }}>
                Forma del enganche
              </div>
              <Segmented
                value={inputs.downPaymentMode}
                onChange={(v) => set('downPaymentMode', v)}
                options={[
                  { value: 'percent', label: 'Por porcentaje' },
                  { value: 'fixed', label: 'Monto fijo' },
                ]}
              />
            </div>
            {inputs.downPaymentMode === 'percent' ? (
              <Field
                label="Enganche"
                value={inputs.downPaymentPct}
                min={0.05}
                max={0.6}
                step={0.01}
                decimals={2}
                onChange={(v) => set('downPaymentPct', v)}
                suffix={`${fmtPct(inputs.downPaymentPct, 0)} del precio`}
              />
            ) : (
              <Field
                label="Enganche (monto)"
                value={inputs.downPaymentFixed}
                min={10000}
                max={500000}
                step={1000}
                onChange={(v) => set('downPaymentFixed', v)}
                suffix="MXN"
              />
            )}
            {mode === 'advanced' && inputs.financeType === 'balloon' && (
              <Field
                label="Valor residual (globo)"
                value={inputs.balloonPct}
                min={0}
                max={0.6}
                step={0.01}
                decimals={2}
                onChange={(v) => set('balloonPct', v)}
                suffix={`${fmtPct(inputs.balloonPct, 0)} del financiado al final`}
                info={TIPS.balloonPct}
              />
            )}
          </>
        )}
        {/* Arrendamiento: renta + pago inicial + plazo + tope de km */}
        {inputs.purchaseMode === 'credit' && inputs.financeType === 'lease' && (
          <>
            <Field
              label="Renta mensual"
              value={inputs.leaseMonthly}
              min={1000}
              max={30000}
              step={250}
              onChange={(v) => set('leaseMonthly', v)}
              suffix="MXN/mes (sin seguro ni gasolina)"
              info={TIPS.leaseMonthly}
            />
            <Field
              label="Pago inicial del arrendamiento"
              value={inputs.leaseDownPayment}
              min={0}
              max={300000}
              step={1000}
              onChange={(v) => set('leaseDownPayment', v)}
              suffix="MXN (no recuperable)"
              info={TIPS.leaseDownPayment}
            />
            <Field
              label="Plazo del arrendamiento"
              value={inputs.leaseTermMonths}
              min={12}
              max={84}
              step={6}
              onChange={(v) => set('leaseTermMonths', v)}
              suffix="meses"
              info={TIPS.leaseTermMonths}
            />
            <Field
              label="Límite de km al año"
              value={inputs.leaseKmCapYear}
              min={0}
              max={60000}
              step={1000}
              onChange={(v) => set('leaseKmCapYear', v)}
              suffix={inputs.leaseKmCapYear > 0 ? 'km/año incluidos' : 'sin límite'}
              info={TIPS.leaseKmCapYear}
            />
            <Field
              label="Cuota por km excedente"
              value={inputs.leaseExcessKmFee}
              min={0}
              max={20}
              step={0.5}
              decimals={1}
              onChange={(v) => set('leaseExcessKmFee', v)}
              suffix="MXN/km extra"
              info={TIPS.leaseExcessKmFee}
            />
            <div className="field-note">
              En arrendamiento NO eres dueño: no hay reventa ni depreciación a tu favor. Seguro,
              gasolina, refrendo y mantenimiento los sigues pagando tú.
            </div>
          </>
        )}
        {inputs.purchaseMode === 'hybrid' && (
          <Field
            label="Pago inicial en efectivo"
            value={inputs.cashAmount}
            min={0}
            max={2000000}
            step={1000}
            onChange={(v) => set('cashAmount', v)}
            suffix="MXN (el resto se financia)"
          />
        )}
        {/* Tasa/plazo/comisión: para crédito (no lease) y mixto. El lease no usa estos. */}
        {inputs.purchaseMode !== 'cash' &&
          !(inputs.purchaseMode === 'credit' && inputs.financeType === 'lease') && (
            <>
              <Field
                label="Tasa de interés anual"
                value={inputs.interestRate}
                min={0.03}
                max={0.4}
                step={0.001}
                decimals={3}
                onChange={(v) => set('interestRate', v)}
                suffix={`${fmtPct(inputs.interestRate, 1)} anual`}
                info="Créditos automotrices típicos: 10% a 18% anual (usados suelen ser más caros)."
              />
              <Field
                label="Plazo del crédito"
                value={inputs.loanMonths}
                min={6}
                max={84}
                step={6}
                onChange={(v) => set('loanMonths', v)}
                suffix="meses"
              />
              {mode === 'advanced' && (
                <Field
                  label="Comisión de apertura"
                  value={inputs.openingFeePct}
                  min={0}
                  max={0.1}
                  step={0.001}
                  decimals={3}
                  onChange={(v) => set('openingFeePct', v)}
                  suffix={fmtPct(inputs.openingFeePct, 1)}
                  info={TIPS.openingFee}
                />
              )}
            </>
          )}
        {mode === 'advanced' && (
          <>
            <Field
              label="Auto a cuenta (trade-in)"
              value={inputs.tradeInValue}
              min={0}
              max={800000}
              step={5000}
              onChange={(v) => set('tradeInValue', v)}
              suffix={
                inputs.tradeInValue > 0
                  ? `${fmtMXN(inputs.tradeInValue)} a cuenta`
                  : 'Opcional · entregas tu auto actual'
              }
              info={TIPS.tradeIn}
            />
            <Field
              label="Gastos de adquisición"
              value={inputs.acquisitionFees}
              min={0}
              max={100000}
              step={500}
              onChange={(v) => set('acquisitionFees', v)}
              suffix="MXN (placas, alta, ISAN, traspaso)"
              info={TIPS.acquisitionFees}
            />
          </>
        )}
      </Group>
    </>
  );
};
