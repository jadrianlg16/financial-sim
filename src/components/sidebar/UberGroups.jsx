import { MapPin, Receipt } from 'lucide-react';
import { Field } from '../ui/Field.jsx';
import { Group } from '../ui/Group.jsx';
import { Info } from '../ui/Info.jsx';
import { Segmented } from '../ui/Segmented.jsx';
import { TIPS } from '../../content/tips.js';
import { CITY_PRESETS } from '../../domain/constants.js';
import { fmtPct } from '../../domain/format.js';
import { TEXT_LIMITS } from '../../domain/inputSchema.js';

// Platform operation (city, fare, commission, tax regime, hours) and one-time
// sign-up paperwork. They only appear when the analysis includes Uber.
export const UberGroups = ({ inputs, setInputs, set, mode }) => {
  const applyCityPreset = (k) => {
    const c = CITY_PRESETS[k];
    setInputs((prev) => ({
      ...prev,
      city: k,
      cityName: c.name,
      avgFare: c.fare,
      fuelPrice: c.fuel,
      electricityPrice: c.electricity,
    }));
  };
  return (
    <>
      {inputs.operationMode !== 'no-uber' && (
        <Group
          icon={MapPin}
          title="Operación Uber"
          blurb="Los presets ajustan tarifa y precios por ciudad. Puedes sobreescribir cualquier valor."
        >
          <div className="field">
            <div className="field-label" style={{ marginBottom: 4 }}>
              Ciudad (preset)
            </div>
            <select
              className="select"
              value={inputs.city}
              onChange={(e) => applyCityPreset(e.target.value)}
            >
              {Object.entries(CITY_PRESETS).map(([k, c]) => (
                <option key={k} value={k}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <div className="field-label" style={{ marginBottom: 4 }}>
              Nombre de la ciudad
            </div>
            <input
              className="input"
              type="text"
              value={inputs.cityName}
              maxLength={TEXT_LIMITS.cityName}
              onChange={(e) => set('cityName', e.target.value)}
              placeholder="Escribe tu ciudad"
            />
          </div>
          <Field
            label="Tarifa promedio por viaje"
            value={inputs.avgFare}
            min={50}
            max={500}
            step={5}
            onChange={(v) => set('avgFare', v)}
            suffix="MXN por viaje"
            info="Cuánto te pagan en promedio por viaje (antes de comisión)."
          />
          <Field
            label="Comisión Uber"
            value={inputs.uberCommission}
            min={0.1}
            max={0.4}
            step={0.01}
            decimals={2}
            onChange={(v) => set('uberCommission', v)}
            suffix={`Uber se queda ${fmtPct(inputs.uberCommission, 0)}`}
            info={TIPS.uberCommission}
          />
          <div className="field">
            <div className="field-label" style={{ marginBottom: 4 }}>
              Régimen fiscal <Info text={TIPS.taxRegime} />
            </div>
            <Segmented
              value={inputs.taxRegime || 'resico'}
              onChange={(v) => set('taxRegime', v)}
              options={[
                { value: 'resico', label: 'RESICO (real)' },
                { value: 'gross', label: 'Bruto (simple)' },
                { value: 'net', label: 'Utilidad' },
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
              {(inputs.taxRegime || 'resico') === 'resico' &&
                '→ Retención de plataforma sobre tu ingreso bruto (lo realista hoy en México).'}
              {inputs.taxRegime === 'gross' &&
                '→ % de la tarifa bruta (p. ej. 30%). Es un supuesto simplificado: sobreestima el impuesto.'}
              {inputs.taxRegime === 'net' &&
                '→ % sobre la utilidad del viaje (tarifa − comisión − costo variable).'}
            </div>
          </div>
          {(inputs.taxRegime || 'resico') === 'resico' ? (
            <Field
              label="Retención RESICO"
              value={inputs.resicoRate}
              min={0}
              max={0.1}
              step={0.001}
              decimals={3}
              onChange={(v) => set('resicoRate', v)}
              suffix={`${fmtPct(inputs.resicoRate, 1)} del ingreso bruto`}
              info={TIPS.resicoRate}
            />
          ) : (
            <Field
              label="Impuestos"
              value={inputs.taxRate}
              min={0}
              max={0.45}
              step={0.01}
              decimals={2}
              onChange={(v) => set('taxRate', v)}
              suffix={
                inputs.taxRegime === 'net'
                  ? `${fmtPct(inputs.taxRate, 0)} sobre utilidad`
                  : `${fmtPct(inputs.taxRate, 0)} de la tarifa bruta`
              }
              info={TIPS.tax}
            />
          )}
          <Field
            label="Viajes por hora"
            value={inputs.tripsPerHour}
            min={0.5}
            max={5}
            step={0.1}
            decimals={1}
            onChange={(v) => set('tripsPerHour', v)}
            suffix={inputs.tripsPerHour > 4 ? '⚠️ Más de 4 no es realista' : 'viajes/hora'}
            info="El modelo asume un tope realista de 4 viajes por hora."
          />
          <Field
            label="Horas máx. disponibles/día"
            value={inputs.maxHoursPerDay}
            min={1}
            max={16}
            step={0.5}
            decimals={1}
            onChange={(v) => set('maxHoursPerDay', v)}
            suffix="horas/día"
          />
          <Field
            label="Días trabajados al mes"
            value={inputs.workDaysPerMonth}
            min={1}
            max={31}
            step={1}
            onChange={(v) => set('workDaysPerMonth', v)}
            suffix="días"
          />
          {mode === 'advanced' && (
            <Field
              label="Km por viaje (incl. traslados)"
              value={inputs.uberKmPerTrip}
              min={1}
              max={40}
              step={0.5}
              decimals={1}
              onChange={(v) => set('uberKmPerTrip', v)}
              suffix="km/viaje"
              info="Kilómetros que recorres por cada viaje, incluyendo el traslado para recoger al pasajero. Conecta los viajes con el gasto de combustible y mantenimiento."
            />
          )}
          <div className="field-note">
            El punto de equilibrio Uber incluye la recuperación del proyecto completo: costos
            mensuales más el desembolso inicial que no quede cubierto por la venta final del auto
            menos la deuda.
          </div>
        </Group>
      )}

      {mode === 'advanced' && inputs.operationMode !== 'no-uber' && (
        <Group
          icon={Receipt}
          title="Pagos iniciales únicos"
          blurb="Trámites que pagas UNA sola vez para darte de alta en Uber."
        >
          <Field
            label="Examen toxicológico"
            value={inputs.toxicologyReport}
            min={0}
            max={3000}
            step={50}
            onChange={(v) => set('toxicologyReport', v)}
            suffix="MXN (una vez)"
            info={TIPS.toxicology}
          />
          <Field
            label="Certificación inicial Uber"
            value={inputs.uberCertification}
            min={0}
            max={5000}
            step={50}
            onChange={(v) => set('uberCertification', v)}
            suffix="MXN (una vez)"
            info={TIPS.certification}
          />
        </Group>
      )}
    </>
  );
};
