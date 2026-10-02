import { lazy, Suspense, useState, useEffect, useMemo, useRef } from 'react';
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
import { Sidebar } from './components/Sidebar.jsx';
import { calculate } from './domain/calculate.js';
import { CAR_PRESETS, SCENARIO_COLORS, VEHICLE_TYPES } from './domain/constants.js';
import { DEFAULT_INPUTS } from './domain/defaults.js';
import { STORAGE_KEY, readPersisted } from './storage/persistence.js';
import { FontsAndTheme } from './theme/FontsAndTheme.jsx';
import { ErrorBoundary } from './components/ui/ErrorBoundary.jsx';

// Each tab is its own chunk, loaded the first time it is opened, so the first
// download carries only the shell, the sidebar and the model. Recharts goes with
// the chart tabs.
const lazyNamed = (load, name) => lazy(() => load().then((m) => ({ default: m[name] })));
const Dashboard = lazyNamed(() => import('./components/Dashboard.jsx'), 'Dashboard');
const Comparison = lazyNamed(() => import('./components/Comparison.jsx'), 'Comparison');
const Sensitivity = lazyNamed(() => import('./components/Sensitivity.jsx'), 'Sensitivity');
const MonteCarlo = lazyNamed(() => import('./components/MonteCarlo.jsx'), 'MonteCarlo');
const Formulas = lazyNamed(() => import('./components/Formulas.jsx'), 'Formulas');
const ImportCase = lazyNamed(() => import('./components/ImportCase.jsx'), 'ImportCase');
const Report = lazyNamed(() => import('./components/Report.jsx'), 'Report');
const Glossary = lazyNamed(() => import('./components/Glossary.jsx'), 'Glossary');

const TabError = ({ onRetry, onReset }) => (
  <div className="card" role="alert" style={{ padding: 32 }}>
    <div className="card-title">No se pudo mostrar esta pestaña</div>
    <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
      Puede deberse a datos guardados por una versión anterior. Reintenta, o borra los datos
      guardados para volver a los valores iniciales.
    </p>
    <div style={{ display: 'flex', gap: 8 }}>
      <button className="btn outline" onClick={onRetry}>
        Reintentar
      </button>
      <button className="btn accent" onClick={onReset}>
        Borrar datos guardados
      </button>
    </div>
  </div>
);

const TabLoading = () => (
  <div
    className="card"
    data-loading-tab
    style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}
  >
    Cargando…
  </div>
);

// ============================================================================
// APP
// ----------------------------------------------------------------------------
// Pestañas: Dashboard · Comparar · Sensibilidad · Monte Carlo · Fórmulas ·
// Importar/AI · Reporte · Glosario. Guarda el estado global: inputs, escenarios
// guardados y fuentes importadas. `inputs` es la única fuente de verdad: cambiar
// cualquier variable en el panel lateral recalcula R (useMemo) y todas las
// pestañas lo leen. El estado se guarda en localStorage para sobrevivir a una
// recarga.
// ============================================================================
export default function App() {
  const [persisted] = useState(readPersisted);
  const [inputs, setInputs] = useState(() => persisted?.inputs ?? DEFAULT_INPUTS);
  // Los escenarios guardados se almacenan ligeros (sin el resultado) y se recalculan al cargar.
  const [saved, setSaved] = useState(() =>
    (persisted?.saved ?? []).map((s) => ({ ...s, result: calculate(s.inputs) })),
  );
  const [tab, setTab] = useState('dashboard');
  const [sources, setSources] = useState(persisted?.sources ?? null);
  const colorIdx = useRef(persisted?.saved.length ?? 0);
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
    } catch {
      /* almacenamiento no disponible: no hay nada que borrar */
    }
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
          {/* Si una pestaña falla al dibujarse, sólo esa pestaña muestra el error. */}
          <ErrorBoundary
            key={tab}
            fallback={({ retry }) => (
              <TabError
                onRetry={retry}
                onReset={() => {
                  handleReset();
                  retry();
                }}
              />
            )}
          >
            <Suspense fallback={<TabLoading />}>
              {tab === 'dashboard' && <Dashboard R={R} inputs={inputs} />}
              {tab === 'compare' && (
                <Comparison saved={saved} currentInputs={inputs} setSaved={setSaved} />
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
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
