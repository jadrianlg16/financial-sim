import { useState } from 'react';
import {
  Car,
  MapPin,
  Wallet,
  Settings,
  Save,
  TrendingUp,
  RotateCcw,
  Building2,
  Calculator,
  Fuel,
  PiggyBank,
  Receipt,
} from 'lucide-react';
import { Field } from './ui/Field.jsx';
import { Group } from './ui/Group.jsx';
import { Info } from './ui/Info.jsx';
import { Segmented } from './ui/Segmented.jsx';
import { TIPS } from '../content/tips.jsx';
import { CAR_PRESETS, CITY_PRESETS } from '../domain/constants.js';
import { depreciatedValue, effectiveDepRate } from '../domain/depreciation.js';
import { fmtMXN, fmtN, fmtPct } from '../domain/format.js';
import { currentYear } from '../domain/year.js';
import { readSidebarMode } from '../storage/persistence.js';

// ============================================================================
// PANEL LATERAL (SIDEBAR)  ·  Objetivos solicitados por el usuario
// ----------------------------------------------------------------------------
// Es donde se capturan TODAS las variables. Consolida muchas peticiones:
//   MODOS:
//     - Compra: efectivo / crédito / mixto (3 opciones).
//     - Operación: "que se pague solo" (break-even) / "ganar X al mes" / "sin Uber".
//     - Enganche: por porcentaje O por monto fijo (toggle).
//     - Tipo de motor: gasolina / diésel / híbrido / eléctrico, con costos de
//       energía propios; EV/híbrido enchufable agregan tiempo de carga que descuenta horas.
//   FLEXIBILIDAD DE CAPTURA (petición clave):
//     - "Todos los campos con slider también permiten escribir el valor manual."
//     - "El slider sigue, pero puedo capturar un valor FUERA del rango si lo
//       necesito" → ver componente Field: el input manual acepta cualquier número
//       y el slider se marca en ámbar (out-of-range) sin recortar el valor real.
//   CIUDAD: dropdown de presets + campo de texto editable para escribir la ciudad.
//   VARIABLES NUEVAS pedidas (todas interconectadas con el motor de cálculo):
//     - Seguro MENSUAL (default $2,000, con nota de que sube por póliza Uber).
//     - Refrendo/tenencia mensual (default $500).
//     - Lavado ($800) y propinas ($400) por separado. Misceláneos ($2,000).
//     - Pagos iniciales ÚNICOS: examen toxicológico ($400) y certificación Uber ($900).
//     - Km personales aparte de los de Uber + factor de desgaste extra por Uber.
//     - Inflación anual de combustible y de electricidad.
//   INGRESO mensual: campo OPCIONAL (si es 0 se ignora).
//   AYUDA: lenguaje técnico PERO con explicaciones vía tooltips (ícono ? al hover)
//          y blurbs cortos, para no ocupar mucho espacio visual.
export const Sidebar = ({ inputs, setInputs, onReset, onSave }) => {
  const [mode, setMode] = useState(readSidebarMode);
  const changeMode = (m) => {
    setMode(m);
    try {
      localStorage.setItem('autopilot.sidebarMode', m);
    } catch {
      /* almacenamiento no disponible: el modo sólo dura esta sesión */
    }
  };
  const set = (k, v) => setInputs((prev) => ({ ...prev, [k]: v }));
  const applyCarPreset = (k) => {
    if (k === 'custom') {
      setInputs((prev) => ({ ...prev, carPreset: 'custom' }));
      return;
    }
    const c = CAR_PRESETS[k];
    setInputs((prev) => {
      const next = {
        ...prev,
        carPreset: k,
        carPrice: c.price,
        kmpl: c.kmpl || prev.kmpl,
        vehicleType: c.type,
        plugInHybrid: !!c.plugInHybrid,
        kmPerKwh: c.kmPerKwh || prev.kmPerKwh,
        batteryCapacityKwh: c.batteryCapacityKwh || prev.batteryCapacityKwh,
      };
      const cond = c.condition || 'new';
      next.vehicleCondition = cond;
      next.carYear = c.year || currentYear();
      next.odometerKm = c.odometerKm || 0;
      // FEATURE 1(b) — garantía: usados sin garantía (0), nuevos con 3 años.
      next.warrantyYearsRemaining = cond === 'used' ? 0 : 3;
      if (cond === 'used') {
        if (!prev.repairReserveAnnual) next.repairReserveAnnual = 6000;
        if (prev.interestRate <= 0.135) next.interestRate = 0.16;
      } else if (prev.repairReserveAnnual === 6000) {
        next.repairReserveAnnual = 0;
      }
      return next;
    });
  };
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
  // Cambiar entre nuevo/usado ajusta supuestos típicos (sólo si siguen en su default,
  // para no pisar valores que el usuario ya editó a mano).
  const applyCondition = (cond) =>
    setInputs((prev) => {
      const next = { ...prev, vehicleCondition: cond };
      if (cond === 'used') {
        if (!prev.repairReserveAnnual) next.repairReserveAnnual = 6000; // los usados sí tienen reparaciones
        if (prev.depreciationMethod === 'straight') next.depreciationMethod = 'declining';
        if (prev.interestRate <= 0.135) next.interestRate = 0.16; // crédito de usado suele ser más caro
        next.warrantyYearsRemaining = 0; // FEATURE 1(b): usado sin garantía
      } else {
        if (prev.repairReserveAnnual === 6000) next.repairReserveAnnual = 0;
        next.odometerKm = 0;
        next.warrantyYearsRemaining = 3; // FEATURE 1(b): nuevo con garantía
      }
      return next;
    });
  const isPlugInHybrid = inputs.vehicleType === 'hybrid' && !!inputs.plugInHybrid;
  const usesElectricDrive = inputs.vehicleType === 'electric' || isPlugInHybrid;
  // Combustible líquido incluye DIÉSEL (antes lo excluía y ocultaba sus campos). (audit fix #4)
  const usesLiquidFuel =
    inputs.vehicleType === 'gasoline' ||
    inputs.vehicleType === 'diesel' ||
    inputs.vehicleType === 'hybrid';
  const usesGas = usesLiquidFuel; // alias para compatibilidad con el resto del JSX
  return (
    <aside className="sidebar">
      <div className="brand-row">
        <div>
          <div className="brand">
            Auto<em>·</em>Pilot
          </div>
          <div className="brand-sub">¿Conviene comprar un auto?</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 18 }}>
        <button className="btn outline" style={{ flex: 1, fontSize: 11 }} onClick={onSave}>
          <Save size={11} /> Guardar escenario
        </button>
        <button className="btn ghost" onClick={onReset} title="Resetear">
          <RotateCcw size={12} />
        </button>
      </div>

      <div style={{ marginBottom: 18 }}>
        <Segmented
          value={mode}
          onChange={changeMode}
          options={[
            { value: 'basic', label: 'Básico' },
            { value: 'advanced', label: 'Avanzado' },
          ]}
        />
        <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 6, lineHeight: 1.5 }}>
          {mode === 'basic' ? 'Lo esencial para decidir.' : 'Todas las variables y supuestos.'}
        </div>
      </div>

      <Group
        icon={Settings}
        title="¿Qué quieres analizar?"
        blurb="Define el objetivo de tu análisis."
      >
        <Segmented
          value={inputs.operationMode}
          onChange={(v) => set('operationMode', v)}
          options={[
            { value: 'uber-breakeven', label: 'Que se pague solo' },
            { value: 'uber-target-profit', label: 'Ganar X al mes' },
            { value: 'no-uber', label: 'Sin Uber' },
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
          {inputs.operationMode === 'uber-breakeven' &&
            '→ Calculamos lo mínimo que debes trabajar para que el proyecto completo se pague solo.'}
          {inputs.operationMode === 'uber-target-profit' &&
            '→ Calculamos cuánto trabajar para que el proyecto se pague y además te dé la ganancia que defines.'}
          {inputs.operationMode === 'no-uber' &&
            '→ Sólo calculamos cuánto cuesta tener el auto (sin generar ingresos).'}
        </div>
        {inputs.operationMode === 'uber-target-profit' && (
          <Field
            label="Ganancia mensual que quieres"
            value={inputs.monthlyProfitTarget}
            min={0}
            max={30000}
            step={500}
            onChange={(v) => set('monthlyProfitTarget', v)}
            suffix="MXN/mes"
            info="Cuánto quieres ganar al mes por encima de cubrir los gastos del auto."
          />
        )}
      </Group>

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
        {usesGas && (
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
                { value: 'gross', label: 'Bruto (escolar)' },
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
                '→ % de la tarifa bruta. Es el supuesto escolar/del problema (30%); sobreestima el impuesto.'}
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
            suffix={inputs.tripsPerHour > 4 ? '⚠️ Máx. 4 según el problema' : 'viajes/hora'}
            info="El problema asume un tope realista de 4 viajes por hora."
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
        {usesGas && (
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
    </aside>
  );
};
