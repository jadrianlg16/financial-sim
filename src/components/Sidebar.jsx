import { useState } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import { CostGroups } from './sidebar/CostGroups.jsx';
import { GoalGroup } from './sidebar/GoalGroup.jsx';
import { PaymentGroup } from './sidebar/PaymentGroup.jsx';
import { ProjectionGroups } from './sidebar/ProjectionGroups.jsx';
import { UberGroups } from './sidebar/UberGroups.jsx';
import { VehicleGroup } from './sidebar/VehicleGroup.jsx';
import { Segmented } from './ui/Segmented.jsx';
import { readSidebarMode, SIDEBAR_MODE_KEY } from '../storage/persistence.js';

// ============================================================================
// SIDEBAR
// ----------------------------------------------------------------------------
// Captures every variable of the scenario, grouped by topic (sidebar/*). Each
// numeric field combines a slider and a typed entry (ui/Field): the typed value
// may go past the slider's range and is the one the calculation uses. Básico
// (basic) mode shows the essentials for a first decision; Avanzado (advanced),
// every variable. The preference is saved in localStorage.
// ============================================================================
export const Sidebar = ({ inputs, setInputs, onReset, onSave }) => {
  const [mode, setMode] = useState(readSidebarMode);
  const changeMode = (m) => {
    setMode(m);
    try {
      localStorage.setItem(SIDEBAR_MODE_KEY, m);
    } catch {
      /* storage unavailable: the mode only lasts this session */
    }
  };
  // Deleting everything takes a second click on a different button. It is an
  // in-page confirmation rather than window.confirm(), which sandboxed iframes
  // (the portfolio) block; it also keeps a single tricked click from wiping data.
  const [confirmingReset, setConfirmingReset] = useState(false);
  const set = (k, v) => setInputs((prev) => ({ ...prev, [k]: v }));
  const groupProps = { inputs, setInputs, set, mode };
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
        <button
          className="btn ghost"
          onClick={() => setConfirmingReset((c) => !c)}
          title="Resetear"
          aria-expanded={confirmingReset}
        >
          <RotateCcw size={12} />
        </button>
      </div>
      {confirmingReset && (
        <div className="field-note" role="alert" style={{ marginTop: -10, marginBottom: 18 }}>
          ¿Borrar el escenario, los escenarios guardados y las fuentes importadas?
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button
              className="btn accent"
              style={{ fontSize: 11 }}
              onClick={() => {
                setConfirmingReset(false);
                onReset();
              }}
            >
              Sí, borrar todo
            </button>
            <button
              className="btn outline"
              style={{ fontSize: 11 }}
              onClick={() => setConfirmingReset(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

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

      <GoalGroup {...groupProps} />
      <VehicleGroup {...groupProps} />
      <PaymentGroup {...groupProps} />
      <UberGroups {...groupProps} />
      <CostGroups {...groupProps} />
      <ProjectionGroups {...groupProps} />
    </aside>
  );
};
