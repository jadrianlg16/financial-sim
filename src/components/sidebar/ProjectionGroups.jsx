import { TrendingUp, Calculator, PiggyBank } from 'lucide-react';
import { Field } from '../ui/Field.jsx';
import { Group } from '../ui/Group.jsx';
import { Info } from '../ui/Info.jsx';
import { Segmented } from '../ui/Segmented.jsx';
import { TIPS } from '../../content/tips.jsx';
import { depreciatedValue, effectiveDepRate } from '../../domain/depreciation.js';
import { fmtMXN, fmtPct } from '../../domain/format.js';

// Supuestos financieros (tasa de oportunidad, inflación, reservas, riesgo de
// pérdida total), proyección de valor y venta del auto, e ingreso opcional.
export const ProjectionGroups = ({ inputs, set, mode }) => {
  return (
    <>
      {mode === 'advanced' && (
        <Group
          icon={Calculator}
          title="Ingeniería financiera"
          defaultOpen={false}
          blurb="El corazón del análisis: tasa de oportunidad para VPN/CAE e inflación de costos."
        >
          <Field
            label="Tasa de descuento (oportunidad)"
            value={inputs.discountRate}
            min={0}
            max={0.3}
            step={0.005}
            decimals={3}
            onChange={(v) => set('discountRate', v)}
            suffix={`${fmtPct(inputs.discountRate, 1)} anual · CETES ≈ 10-11%`}
            info={TIPS.discountRate}
          />
          <Field
            label="Inflación general de costos"
            value={inputs.generalInflation}
            min={0}
            max={0.2}
            step={0.005}
            decimals={3}
            onChange={(v) => set('generalInflation', v)}
            suffix={`+${fmtPct(inputs.generalInflation, 1)} cada año`}
            info={TIPS.generalInflation}
          />
          <Field
            label="Reserva de reparaciones/año"
            value={inputs.repairReserveAnnual}
            min={0}
            max={60000}
            step={500}
            onChange={(v) => set('repairReserveAnnual', v)}
            suffix={
              inputs.repairReserveAnnual > 0
                ? `${fmtMXN(inputs.repairReserveAnnual)}/año (crece con la edad)`
                : 'Opcional · súbelo para usados'
            }
            info={TIPS.repairReserve}
          />
          <Field
            label="Riesgo pérdida total/robo (anual)"
            value={inputs.theftLossProbAnnual}
            min={0}
            max={0.1}
            step={0.001}
            decimals={3}
            onChange={(v) => set('theftLossProbAnnual', v)}
            suffix={`${fmtPct(inputs.theftLossProbAnnual, 1)}/año · sólo afecta el Monte Carlo`}
            info={TIPS.theftLossProbAnnual}
          />
          <Field
            label="Deducible cobertura amplia"
            value={inputs.theftDeductiblePct}
            min={0}
            max={0.2}
            step={0.005}
            decimals={3}
            onChange={(v) => set('theftDeductiblePct', v)}
            suffix={`${fmtPct(inputs.theftDeductiblePct, 1)} del valor (lo absorbes en pérdida total)`}
            info={TIPS.theftDeductiblePct}
          />
        </Group>
      )}

      <Group
        icon={TrendingUp}
        title="Proyección y venta"
        defaultOpen={mode === 'basic' ? true : false}
        blurb="Cómo proyectamos el valor del auto a futuro."
      >
        <Field
          label="Horizonte de análisis"
          value={inputs.horizonYears}
          min={1}
          max={15}
          step={1}
          onChange={(v) => set('horizonYears', v)}
          suffix="años"
        />
        {mode === 'advanced' && (
          <>
            <div className="field">
              <div className="field-label" style={{ marginBottom: 4 }}>
                Método de depreciación <Info text={TIPS.depreciationMethod} />
              </div>
              <Segmented
                value={inputs.depreciationMethod || 'declining'}
                onChange={(v) => set('depreciationMethod', v)}
                options={[
                  { value: 'declining', label: 'Saldo decreciente' },
                  { value: 'straight', label: 'Lineal' },
                  { value: 'realistic', label: 'Realista' },
                ]}
              />
            </div>
            <Field
              label="Depreciación anual"
              value={inputs.depreciationRate}
              min={0.02}
              max={0.5}
              step={0.01}
              decimals={2}
              onChange={(v) => set('depreciationRate', v)}
              suffix={`${fmtPct(inputs.depreciationRate, 0)} ${inputs.depreciationMethod === 'straight' ? 'del precio original' : 'del valor restante'}/año`}
              info={TIPS.depreciation}
            />
            {inputs.depreciationMethod === 'realistic' && (
              <Field
                label="Caída del primer año"
                value={inputs.firstYearDepreciation}
                min={0.05}
                max={0.5}
                step={0.01}
                decimals={2}
                onChange={(v) => set('firstYearDepreciation', v)}
                suffix={`−${fmtPct(inputs.firstYearDepreciation, 0)} al salir de la agencia`}
              />
            )}
            <div
              style={{
                fontSize: 10.5,
                color: 'var(--muted)',
                marginTop: -6,
                marginBottom: 10,
                lineHeight: 1.5,
              }}
            >
              {inputs.depreciationMethod === 'declining' &&
                `Saldo decreciente (lo más realista): cada año pierde ${fmtPct(inputs.depreciationRate, 0)} del valor restante. `}
              {inputs.depreciationMethod === 'straight' &&
                `Lineal: resta el mismo monto cada año; en ${Math.floor(1 / Math.max(0.01, inputs.depreciationRate))} años llegaría a $0. `}
              {inputs.depreciationMethod === 'realistic' &&
                `Realista: −${fmtPct(inputs.firstYearDepreciation, 0)} el primer año, luego ${fmtPct(inputs.depreciationRate, 0)} de saldo decreciente. `}
              {inputs.vehicleCondition === 'used' &&
                `Usado: deprecia más lento — se aplica ≈${fmtPct(effectiveDepRate(inputs), 0)}/año (tasa de usados afinada por antigüedad) en vez de la tasa de lista. `}
              En {inputs.horizonYears} años conservaría ≈
              {fmtPct(depreciatedValue(1, inputs, inputs.horizonYears), 0)} del precio.
            </div>
            <Field
              label="Factor venta real"
              value={inputs.salesFactor}
              min={0.3}
              max={2.0}
              step={0.01}
              decimals={2}
              onChange={(v) => set('salesFactor', v)}
              suffix={`${inputs.salesFactor.toFixed(2)}× del valor calculado`}
              info={TIPS.salesFactor}
            />
            <Field
              label="Costo de venta al liquidar"
              value={inputs.sellingCostPct}
              min={0}
              max={0.15}
              step={0.005}
              decimals={3}
              onChange={(v) => set('sellingCostPct', v)}
              suffix={`${fmtPct(inputs.sellingCostPct, 1)} (comisión/traspaso)`}
              info={TIPS.sellingCost}
            />
          </>
        )}
      </Group>

      <Group
        icon={PiggyBank}
        title="Tu ingreso (opcional)"
        defaultOpen={false}
        blurb="Si llenas tu ingreso, te mostramos qué porcentaje de tu sueldo se iría al auto."
      >
        <Field
          label="Ingreso mensual"
          value={inputs.monthlyIncome}
          min={0}
          max={150000}
          step={500}
          onChange={(v) => set('monthlyIncome', v)}
          suffix={
            inputs.monthlyIncome > 0
              ? `${fmtMXN(inputs.monthlyIncome)}/mes`
              : 'Opcional · déjalo en 0 para ignorar'
          }
          info={TIPS.income}
        />
      </Group>
    </>
  );
};
