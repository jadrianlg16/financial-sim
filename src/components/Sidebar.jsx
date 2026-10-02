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
// PANEL LATERAL
// ----------------------------------------------------------------------------
// Captura todas las variables del escenario, agrupadas por tema (sidebar/*).
// Cada campo numérico combina slider y entrada manual (ui/Field): el valor
// escrito puede salir del rango del slider y es el que entra al cálculo.
// El modo Básico muestra lo esencial para una primera decisión; Avanzado, todas
// las variables. La preferencia se guarda en localStorage.
// ============================================================================
export const Sidebar = ({ inputs, setInputs, onReset, onSave }) => {
  const [mode, setMode] = useState(readSidebarMode);
  const changeMode = (m) => {
    setMode(m);
    try {
      localStorage.setItem(SIDEBAR_MODE_KEY, m);
    } catch {
      /* almacenamiento no disponible: el modo sólo dura esta sesión */
    }
  };
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

      <GoalGroup {...groupProps} />
      <VehicleGroup {...groupProps} />
      <PaymentGroup {...groupProps} />
      <UberGroups {...groupProps} />
      <CostGroups {...groupProps} />
      <ProjectionGroups {...groupProps} />
    </aside>
  );
};
