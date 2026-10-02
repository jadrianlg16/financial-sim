import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BarChart3,
  FileText,
  Sliders,
  GitCompareArrows,
  Dice5,
  Calculator,
  Upload,
  HelpCircle,
} from 'lucide-react';
import { Comparison } from './components/Comparison.jsx';
import { Dashboard } from './components/Dashboard.jsx';
import { Formulas } from './components/Formulas.jsx';
import { Glossary } from './components/Glossary.jsx';
import { ImportCase } from './components/ImportCase.jsx';
import { MonteCarlo } from './components/MonteCarlo.jsx';
import { Report } from './components/Report.jsx';
import { Sensitivity } from './components/Sensitivity.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { calculate } from './domain/calculate.js';
import { CAR_PRESETS, SCENARIO_COLORS, VEHICLE_TYPES } from './domain/constants.js';
import { DEFAULT_INPUTS } from './domain/defaults.js';
import { STORAGE_KEY, readPersisted } from './storage/persistence.js';
import { FontsAndTheme } from './theme/FontsAndTheme.jsx';

// ============================================================================
// APP (router de páginas)  ·  Conecta las 7 pestañas pedidas por el usuario:
// Dashboard · Comparar · Sensibilidad · Monte Carlo · Fórmulas · Importar/AI ·
// Reporte. Mantiene el estado global de inputs, escenarios guardados y las
// fuentes importadas. 'inputs' es la única fuente de verdad: cambiar cualquier
// variable en el Sidebar recalcula R (useMemo) y actualiza todas las páginas.
// ============================================================================
// Persistencia local: el estado sobrevive a recargar la página. (mejora #persist)
export default function App() {
  const persisted = useRef(readPersisted()).current;
  const [inputs, setInputs] = useState(() =>
    persisted?.inputs ? { ...DEFAULT_INPUTS, ...persisted.inputs } : DEFAULT_INPUTS,
  );
  // Los escenarios guardados se almacenan ligeros (sin el resultado) y se recalculan al cargar.
  const [saved, setSaved] = useState(() =>
    Array.isArray(persisted?.saved)
      ? persisted.saved.map((s) => ({ ...s, result: calculate(s.inputs) }))
      : [],
  );
  const [tab, setTab] = useState('dashboard');
  const [sources, setSources] = useState(persisted?.sources || null);
  const colorIdx = useRef(Array.isArray(persisted?.saved) ? persisted.saved.length : 0);
  const R = useMemo(() => calculate(inputs), [inputs]);
  useEffect(() => {
    try {
      const slimSaved = saved.map(({ name, inputs, color }) => ({ name, inputs, color }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ inputs, saved: slimSaved, sources }));
    } catch {
      /* almacenamiento lleno o no disponible: el cálculo sigue funcionando */
    }
  }, [inputs, saved, sources]);
  const handleSave = () => {
    const carName = CAR_PRESETS[inputs.carPreset]?.name.split(' ').slice(0, 2).join(' ') || 'Auto';
    const cityName = inputs.operationMode !== 'no-uber' ? inputs.cityName || 'Custom' : 'Personal';
    const motorTag = VEHICLE_TYPES[inputs.vehicleType]?.label.charAt(0) || '?';
    const purchaseTag =
      inputs.purchaseMode === 'cash' ? '$' : inputs.purchaseMode === 'hybrid' ? 'M' : 'C';
    const name = `${carName} · ${cityName} · ${motorTag}${purchaseTag}`;
    const color = SCENARIO_COLORS[colorIdx.current % SCENARIO_COLORS.length];
    colorIdx.current++;
    setSaved([...saved, { name, inputs: { ...inputs }, result: R, color }]);
  };
  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
    setSaved([]);
    setSources(null);
    colorIdx.current = 0;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };
  return (
    <div className="app-root">
      <FontsAndTheme />
      <div className="layout">
        <Sidebar inputs={inputs} setInputs={setInputs} onSave={handleSave} onReset={handleReset} />
        <main className="main">
          <div className="tabs">
            <button
              className={`tab ${tab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setTab('dashboard')}
            >
              <BarChart3 size={13} /> Dashboard
            </button>
            <button
              className={`tab ${tab === 'compare' ? 'active' : ''}`}
              onClick={() => setTab('compare')}
            >
              <GitCompareArrows size={13} /> Comparar{' '}
              <span className="pill" style={{ marginLeft: 4 }}>
                {saved.length}
              </span>
            </button>
            <button
              className={`tab ${tab === 'sens' ? 'active' : ''}`}
              onClick={() => setTab('sens')}
            >
              <Sliders size={13} /> Sensibilidad
            </button>
            <button className={`tab ${tab === 'mc' ? 'active' : ''}`} onClick={() => setTab('mc')}>
              <Dice5 size={13} /> Monte Carlo
            </button>
            <button
              className={`tab ${tab === 'formulas' ? 'active' : ''}`}
              onClick={() => setTab('formulas')}
            >
              <Calculator size={13} /> Fórmulas
            </button>
            <button
              className={`tab ${tab === 'import' ? 'active' : ''}`}
              onClick={() => setTab('import')}
            >
              <Upload size={13} /> Importar / AI
            </button>
            <button
              className={`tab ${tab === 'report' ? 'active' : ''}`}
              onClick={() => setTab('report')}
            >
              <FileText size={13} /> Reporte
            </button>
            <button
              className={`tab ${tab === 'glossary' ? 'active' : ''}`}
              onClick={() => setTab('glossary')}
            >
              <HelpCircle size={13} /> Glosario
            </button>
          </div>
          {tab === 'dashboard' && <Dashboard R={R} inputs={inputs} />}
          {tab === 'compare' && (
            <Comparison saved={saved} current={R} currentInputs={inputs} setSaved={setSaved} />
          )}
          {tab === 'sens' && <Sensitivity inputs={inputs} />}
          {tab === 'mc' && <MonteCarlo inputs={inputs} />}
          {tab === 'formulas' && <Formulas R={R} inputs={inputs} />}
          {tab === 'import' && (
            <ImportCase
              inputs={inputs}
              setInputs={setInputs}
              sources={sources}
              setSources={setSources}
            />
          )}
          {tab === 'report' && <Report R={R} inputs={inputs} sources={sources} />}
          {tab === 'glossary' && <Glossary />}
        </main>
      </div>
    </div>
  );
}
