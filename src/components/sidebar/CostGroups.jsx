import { Building2, Fuel } from 'lucide-react';
import { Field } from '../ui/Field.jsx';
import { Group } from '../ui/Group.jsx';
import { Info } from '../ui/Info.jsx';
import { Segmented } from '../ui/Segmented.jsx';
import { TIPS } from '../../content/tips.jsx';
import { fmtPct } from '../../domain/format.js';
import { powertrainOf } from './powertrain.js';

// Uso personal y desgaste, y costos recurrentes: energía según el motor, seguro,
// mantenimiento, refrendo y otros gastos mensuales.
export const CostGroups = ({ inputs, set, mode }) => {
  const { usesElectricDrive, usesLiquidFuel } = powertrainOf(inputs);
  return (
    <>
      {mode === 'advanced' && (
        <Group
          icon={Building2}
          title="Uso personal y desgaste"
          blurb="Si usarás el auto también para tu vida normal (no Uber), agrégalo aquí."
        >
          <Field
            label="Km personales/día"
            value={inputs.personalKmDaily}
            min={0}
            max={200}
            step={1}
            onChange={(v) => set('personalKmDaily', v)}
            suffix="km/día (no Uber)"
          />
          {inputs.operationMode !== 'no-uber' && (
            <Field
              label="Desgaste extra por Uber"
              value={inputs.uberWearFactor}
              min={0}
              max={1.5}
              step={0.05}
              decimals={2}
              onChange={(v) => set('uberWearFactor', v)}
              suffix={`+${fmtPct(inputs.uberWearFactor, 0)} mantenimiento`}
              info={TIPS.wear}
            />
          )}
        </Group>
      )}

      <Group
        icon={Fuel}
        title="Costos recurrentes"
        blurb="Gastos que tienes mes a mes (o cada año) por tener el auto."
      >
        {usesLiquidFuel && (
          <Field
            label={inputs.vehicleType === 'diesel' ? 'Precio del diésel' : 'Precio de gasolina'}
            value={inputs.vehicleType === 'diesel' ? inputs.dieselPrice : inputs.fuelPrice}
            min={10}
            max={60}
            step={0.1}
            decimals={2}
            onChange={(v) => set(inputs.vehicleType === 'diesel' ? 'dieselPrice' : 'fuelPrice', v)}
            suffix="MXN por litro"
          />
        )}
        {usesElectricDrive && (
          <Field
            label="Precio de electricidad (casa)"
            value={inputs.electricityPrice}
            min={0.5}
            max={20}
            step={0.1}
            decimals={2}
            onChange={(v) => set('electricityPrice', v)}
            suffix="MXN por kWh (carga casera)"
          />
        )}
        {mode === 'advanced' && usesElectricDrive && (
          <Field
            label="Fracción de carga pública"
            value={inputs.publicChargeFraction}
            min={0}
            max={1}
            step={0.05}
            decimals={2}
            onChange={(v) => set('publicChargeFraction', v)}
            suffix={`${fmtPct(inputs.publicChargeFraction, 0)} en estaciones públicas`}
            info={TIPS.publicChargeFraction}
          />
        )}
        {mode === 'advanced' && usesElectricDrive && inputs.publicChargeFraction > 0 && (
          <Field
            label="Precio de carga pública"
            value={inputs.publicChargePrice}
            min={1}
            max={40}
            step={0.5}
            decimals={2}
            onChange={(v) => set('publicChargePrice', v)}
            suffix="MXN por kWh (cargador público)"
            info={TIPS.publicChargePrice}
          />
        )}
        {mode === 'advanced' && (
          <Field
            label="Inflación combustible/año"
            value={inputs.fuelInflation}
            min={0}
            max={0.3}
            step={0.005}
            decimals={3}
            onChange={(v) => set('fuelInflation', v)}
            suffix={`+${fmtPct(inputs.fuelInflation, 1)} cada año`}
            info={TIPS.fuelInflation}
          />
        )}
        {mode === 'advanced' && usesElectricDrive && (
          <Field
            label="Inflación electricidad/año"
            value={inputs.electricityInflation}
            min={0}
            max={0.3}
            step={0.005}
            decimals={3}
            onChange={(v) => set('electricityInflation', v)}
            suffix={`+${fmtPct(inputs.electricityInflation, 1)} cada año`}
          />
        )}
        <div className="field">
          <div className="field-label" style={{ marginBottom: 4 }}>
            Cómo cobras el seguro <Info text={TIPS.insuranceMode} />
          </div>
          <Segmented
            value={inputs.insuranceMode || 'fixed'}
            onChange={(v) => set('insuranceMode', v)}
            options={[
              { value: 'fixed', label: 'Monto fijo' },
              { value: 'pctOfValue', label: '% del valor' },
            ]}
          />
        </div>
        {(inputs.insuranceMode || 'fixed') === 'pctOfValue' ? (
          <Field
            label="Seguro (% del valor/año)"
            value={inputs.insurancePctOfValue}
            min={0.005}
            max={0.15}
            step={0.005}
            decimals={3}
            onChange={(v) => set('insurancePctOfValue', v)}
            suffix={`${fmtPct(inputs.insurancePctOfValue, 1)}/año · baja al depreciarse`}
            info={TIPS.insurancePctOfValue}
          />
        ) : (
          <Field
            label="Seguro mensual"
            value={inputs.monthlyInsurance}
            min={300}
            max={8000}
            step={50}
            onChange={(v) => set('monthlyInsurance', v)}
            suffix="MXN/mes"
            info={TIPS.insurance}
          />
        )}
        {inputs.operationMode !== 'no-uber' && (
          <div className="field-note">
            ⚠️ Si usas el auto para Uber, muchas aseguradoras exigen una{' '}
            <strong>póliza comercial</strong> más cara que la de un auto particular. Por eso el
            default ya está en $2,000/mes.
          </div>
        )}
        <Field
          label="Mantenimiento base anual"
          value={inputs.annualMaintenance}
          min={1000}
          max={60000}
          step={500}
          onChange={(v) => set('annualMaintenance', v)}
          suffix="MXN/año a 20,000 km"
          info={TIPS.maintenance}
        />
        {mode === 'advanced' && (
          <>
            <Field
              label="Refrendo / Tenencia"
              value={inputs.monthlyRefrendo}
              min={0}
              max={5000}
              step={50}
              onChange={(v) => set('monthlyRefrendo', v)}
              suffix="MXN/mes"
              info={TIPS.refrendo}
            />
            <Field
              label="Datos móviles"
              value={inputs.dataPlan}
              min={0}
              max={3000}
              step={50}
              onChange={(v) => set('dataPlan', v)}
              suffix="MXN/mes"
            />
            <Field
              label="Lavado de auto"
              value={inputs.carWash}
              min={0}
              max={3000}
              step={50}
              onChange={(v) => set('carWash', v)}
              suffix="MXN/mes"
              info={TIPS.carWash}
            />
            <Field
              label="Propinas (lavado/servicio)"
              value={inputs.carWashTips}
              min={0}
              max={2000}
              step={25}
              onChange={(v) => set('carWashTips', v)}
              suffix="MXN/mes"
              info={TIPS.tips}
            />
            <Field
              label="Misceláneos / imprevistos"
              value={inputs.miscellaneous}
              min={0}
              max={10000}
              step={100}
              onChange={(v) => set('miscellaneous', v)}
              suffix="MXN/mes"
              info={TIPS.misc}
            />
            <Field
              label="Accesorios/gadgets"
              value={inputs.accessories}
              min={0}
              max={2000}
              step={25}
              onChange={(v) => set('accessories', v)}
              suffix="MXN/mes"
            />
          </>
        )}
      </Group>
    </>
  );
};
