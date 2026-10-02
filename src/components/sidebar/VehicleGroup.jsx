import { Car } from 'lucide-react';
import { Field } from '../ui/Field.jsx';
import { Group } from '../ui/Group.jsx';
import { Info } from '../ui/Info.jsx';
import { Segmented } from '../ui/Segmented.jsx';
import { TIPS } from '../../content/tips.js';
import { applyCarPresetTo } from '../../domain/compare.js';
import { CAR_PRESETS } from '../../domain/constants.js';
import { fmtN, fmtPct } from '../../domain/format.js';
import { currentYear } from '../../domain/year.js';
import { powertrainOf } from './powertrain.js';

// Car: preset or free entry, powertrain, condition, price, year and efficiency.
// Picking a preset or switching between new and used adjusts typical assumptions
// (warranty, repair reserve, rate) without overwriting values already edited.
export const VehicleGroup = ({ inputs, setInputs, set, mode }) => {
  const applyCarPreset = (k) => setInputs((prev) => applyCarPresetTo(prev, k));
  // Switching between new and used adjusts typical assumptions (only while they
  // still hold their default, so values the user edited by hand are kept).
  const applyCondition = (cond) =>
    setInputs((prev) => {
      const next = { ...prev, vehicleCondition: cond };
      if (cond === 'used') {
        if (!prev.repairReserveAnnual) next.repairReserveAnnual = 6000; // used cars do need repairs
        if (prev.depreciationMethod === 'straight') next.depreciationMethod = 'declining';
        if (prev.interestRate <= 0.135) next.interestRate = 0.16; // used-car loans cost more
        next.warrantyYearsRemaining = 0; // a used car has no factory warranty left
      } else {
        if (prev.repairReserveAnnual === 6000) next.repairReserveAnnual = 0;
        next.odometerKm = 0;
        next.warrantyYearsRemaining = 3; // a new car comes with a 3-year warranty
      }
      return next;
    });
  const { isPlugInHybrid, usesElectricDrive, usesLiquidFuel } = powertrainOf(inputs);
  return (
    <>
      <Group
        icon={Car}
        title="Tu vehículo"
        blurb="Elige un auto preconfigurado o personalízalo (incluye tu auto actual)."
      >
        <div className="field">
          <div className="field-label" style={{ marginBottom: 4 }}>
            Modelo
          </div>
          <select
            className="select"
            value={inputs.carPreset}
            onChange={(e) => applyCarPreset(e.target.value)}
          >
            {Object.entries(CAR_PRESETS).map(([k, c]) => (
              <option key={k} value={k}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <div className="field-label" style={{ marginBottom: 4 }}>
            Tipo de motor <Info text={TIPS.vehicleType} />
          </div>
          <Segmented
            value={inputs.vehicleType}
            onChange={(v) => set('vehicleType', v)}
            options={[
              { value: 'gasoline', label: 'Gasolina' },
              { value: 'diesel', label: 'Diésel' },
              { value: 'hybrid', label: 'Híbrido' },
              { value: 'electric', label: 'Eléctrico' },
            ]}
          />
        </div>
        <div className="field">
          <div className="field-label" style={{ marginBottom: 4 }}>
            Condición <Info text={TIPS.vehicleCondition} />
          </div>
          <Segmented
            value={inputs.vehicleCondition || 'new'}
            onChange={(v) => applyCondition(v)}
            options={[
              { value: 'new', label: 'Nuevo' },
              { value: 'used', label: 'Usado / seminuevo' },
            ]}
          />
        </div>
        <Field
          label="Precio del auto"
          value={inputs.carPrice}
          min={50000}
          max={1500000}
          step={1000}
          onChange={(v) => set('carPrice', v)}
          suffix="MXN"
          info="Auto nuevo, usado, o el que ya tienes. Puedes escribir cualquier monto."
        />
        <Field
          label="Año modelo"
          value={inputs.carYear}
          min={2000}
          max={currentYear() + 1}
          step={1}
          onChange={(v) => set('carYear', v)}
          suffix={
            inputs.carYear < currentYear()
              ? `≈${Math.max(0, currentYear() - inputs.carYear)} años de antigüedad`
              : 'nuevo'
          }
        />
        {mode === 'advanced' && inputs.vehicleCondition === 'used' && (
          <>
            <Field
              label="Kilometraje actual"
              value={inputs.odometerKm}
              min={0}
              max={300000}
              step={1000}
              onChange={(v) => set('odometerKm', v)}
              suffix="km en el odómetro"
              info="Km que ya trae el auto. Más km = más cerca de reparaciones mayores; ajusta la reserva de reparaciones."
            />
            <Field
              label="Depreciación de usados/año"
              value={inputs.usedDepreciationRate}
              min={0.04}
              max={0.3}
              step={0.01}
              decimals={2}
              onChange={(v) => set('usedDepreciationRate', v)}
              suffix={`${fmtPct(inputs.usedDepreciationRate, 0)} del valor restante (más lento que nuevo)`}
              info={TIPS.usedDepreciationRate}
            />
            <div className="field-note">
              Para usados, abre <strong>Ingeniería financiera</strong> y sube la{' '}
              <strong>reserva de reparaciones</strong>; usa método de depreciación{' '}
              <strong>Saldo decreciente</strong> sobre el precio ya rebajado.
            </div>
          </>
        )}
        {mode === 'advanced' && (
          <Field
            label="Garantía restante"
            value={inputs.warrantyYearsRemaining}
            min={0}
            max={10}
            step={1}
            onChange={(v) => set('warrantyYearsRemaining', v)}
            suffix={
              inputs.warrantyYearsRemaining > 0
                ? `${fmtN(inputs.warrantyYearsRemaining)} años sin reserva de reparaciones`
                : 'sin garantía (reserva aplica desde el año 1)'
            }
            info={TIPS.warrantyYearsRemaining}
          />
        )}
        {usesLiquidFuel && (
          <Field
            label="Rendimiento"
            value={inputs.kmpl}
            min={5}
            max={40}
            step={0.1}
            decimals={1}
            onChange={(v) => set('kmpl', v)}
            suffix="km por litro"
            info="Kilómetros por litro. Más alto = más eficiente."
          />
        )}
        {mode === 'advanced' && inputs.vehicleType === 'hybrid' && (
          <div className="field" style={{ marginTop: 4 }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                fontSize: 12,
                color: 'var(--ink-2)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={!!inputs.plugInHybrid}
                onChange={(e) => set('plugInHybrid', e.target.checked)}
                style={{ marginTop: 2 }}
              />
              <span>
                Híbrido enchufable{' '}
                <Info text="Actívalo sólo si el híbrido se carga con enchufe. Un híbrido convencional usa gasolina y no consume tiempo de carga." />
              </span>
            </label>
          </div>
        )}
        {usesElectricDrive && (
          <>
            <Field
              label="Rendimiento eléctrico"
              value={inputs.kmPerKwh}
              min={2}
              max={12}
              step={0.1}
              decimals={1}
              onChange={(v) => set('kmPerKwh', v)}
              suffix="km por kWh"
            />
            {mode === 'advanced' && (
              <>
                <Field
                  label="Capacidad batería"
                  value={inputs.batteryCapacityKwh}
                  min={5}
                  max={150}
                  step={1}
                  onChange={(v) => set('batteryCapacityKwh', v)}
                  suffix="kWh"
                />
                <Field
                  label="Potencia cargador casero"
                  value={inputs.chargerPowerKw}
                  min={1.5}
                  max={50}
                  step={0.5}
                  decimals={1}
                  onChange={(v) => set('chargerPowerKw', v)}
                  suffix="kW"
                  info="1.8 kW (contacto normal), 7 kW (instalación dedicada), 11+ kW (rápido casero)."
                />
                {isPlugInHybrid && (
                  <Field
                    label="Fracción en modo eléctrico"
                    value={inputs.hybridElectricFraction}
                    min={0}
                    max={1}
                    step={0.05}
                    decimals={2}
                    onChange={(v) => set('hybridElectricFraction', v)}
                    suffix={`${fmtPct(inputs.hybridElectricFraction, 0)} del tiempo en eléctrico`}
                  />
                )}
              </>
            )}
          </>
        )}
      </Group>
    </>
  );
};
