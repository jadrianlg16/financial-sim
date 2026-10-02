import { useState } from 'react';
import { FileText, Sparkles, Upload, Copy, FileJson, BrainCircuit, Receipt } from 'lucide-react';
import { SOURCE_LABELS } from '../content/sources.js';
import { applyImportedJson, buildAIPrompt } from '../domain/aiCase.js';

export const ImportCase = ({ inputs, setInputs, sources, setSources }) => {
  const [carName, setCarName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [toast, setToast] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const generate = () => {
    if (!carName.trim()) {
      setToast({ type: 'error', msg: 'Escribe el nombre/modelo del vehículo primero.' });
      return;
    }
    setPrompt(buildAIPrompt(carName));
    setToast(null);
  };
  const copy = () => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };
  const importJson = () => {
    try {
      const cleaned = jsonText
        .replace(/```json\s*/g, '')
        .replace(/```\s*$/g, '')
        .trim();
      const parsed = JSON.parse(cleaned);
      const {
        ok,
        inputs: newInputs,
        error,
        sources: newSources,
      } = applyImportedJson(parsed, inputs);
      if (ok) {
        setInputs(newInputs);
        if (newSources) setSources(newSources);
        setToast({
          type: 'success',
          msg: '¡Caso importado! Ve al Dashboard para visualizar. Las fuentes aparecen abajo.',
        });
      } else setToast({ type: 'error', msg: `Error: ${error}` });
    } catch (e) {
      setToast({ type: 'error', msg: `JSON inválido: ${e.message}` });
    }
  };
  return (
    <div style={{ maxWidth: 880 }}>
      <h1 className="serif" style={{ fontSize: 38, margin: '0 0 8px' }}>
        Importar otro vehículo
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: 28, lineHeight: 1.7 }}>
        ¿Quieres probar otro auto? Genera un prompt para que una IA (Claude, ChatGPT, Gemini,
        Perplexity) investigue TODAS las variables del vehículo{' '}
        <strong>con una fuente para cada dato</strong>, copia la respuesta JSON aquí, y la app
        cargará el caso automáticamente — incluyendo las ligas de respaldo para que verifiques la
        información.
      </p>
      <div className="card" style={{ marginBottom: 22 }}>
        <div className="card-title">
          <BrainCircuit size={11} /> Paso 1 · Generar prompt para la IA
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div className="field-label" style={{ marginBottom: 4 }}>
              ¿Qué vehículo quieres investigar?
            </div>
            <input
              className="input"
              type="text"
              value={carName}
              onChange={(e) => setCarName(e.target.value)}
              placeholder="Ej. Tesla Model 3 2026, Ford Ranger Diesel, BYD Atto 3..."
            />
          </div>
          <button className="btn accent" onClick={generate}>
            <Sparkles size={12} /> Generar prompt
          </button>
        </div>
        {prompt && (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <span className="pill accent">Prompt generado</span>
              <button className="btn outline" onClick={copy}>
                <Copy size={11} /> {copySuccess ? 'Copiado ✓' : 'Copiar al portapapeles'}
              </button>
            </div>
            <pre className="json-out">{prompt}</pre>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10, marginBottom: 0 }}>
              Pega esto en tu IA preferida. Te devolverá un JSON con cada variable y su fuente, que
              copias al paso 2.
            </p>
          </>
        )}
      </div>
      <div className="card" style={{ marginBottom: sources ? 22 : 0 }}>
        <div className="card-title">
          <FileJson size={11} /> Paso 2 · Importar el JSON
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 0, marginBottom: 12 }}>
          Pega el JSON que recibiste de la IA. La app aplicará todos los valores al escenario actual
          y guardará las fuentes.
        </p>
        <textarea
          className="textarea"
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder={
            '{\n  "vehicle": {...},\n  "costs": {...},\n  "oneTime": {...},\n  "projection": {...},\n  "sources": {...}\n}'
          }
          style={{ minHeight: 220 }}
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
          <button className="btn accent" onClick={importJson} disabled={!jsonText.trim()}>
            <Upload size={11} /> Importar y aplicar
          </button>
          <button
            className="btn outline"
            onClick={() => {
              setJsonText('');
              setToast(null);
            }}
          >
            Limpiar
          </button>
        </div>
        {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
      </div>
      {sources && (
        <div className="card" style={{ marginBottom: 22 }}>
          <div className="card-title">
            <FileText size={11} /> Fuentes de los datos importados
          </div>
          <div className="card-blurb">
            Cada dato del vehículo importado, con su liga de respaldo. Verifica que provengan de
            fuentes confiables.
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Variable</th>
                <th>Fuente</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(sources).map(([k, v]) => (
                <tr key={k}>
                  <td style={{ fontFamily: 'Manrope', fontWeight: 500 }}>
                    {SOURCE_LABELS[k] || k}
                  </td>
                  <td style={{ wordBreak: 'break-all', fontSize: 11 }}>
                    {typeof v === 'string' && v.startsWith('http') ? (
                      <a
                        href={v}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--accent)' }}
                      >
                        {v}
                      </a>
                    ) : (
                      <span
                        style={{
                          color: v && String(v).includes('[ESTIM') ? 'var(--warn)' : 'var(--muted)',
                        }}
                      >
                        {String(v)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* FEATURE 4 — notas y fuentes libres del usuario: fluyen al Reporte y se descargan en el .md */}
      <div className="card">
        <div className="card-title">
          <Receipt size={11} /> Notas y fuentes
        </div>
        <div className="card-blurb">
          Anota de dónde salieron tus números: precios de lista o cotizaciones de agencia, tasas de
          tu banco, cotizaciones de seguro, ligas de referencia, supuestos personales. Lo que
          escribas aquí aparece en el Reporte y se incluye al descargar el .md.
        </div>
        <textarea
          className="textarea"
          value={inputs.userNotes}
          onChange={(e) => setInputs((prev) => ({ ...prev, userNotes: e.target.value }))}
          placeholder={
            'Ej.\n- Precio: cotización agencia KIA Monterrey, 15-jun-2026.\n- Tasa 13.5%: simulador BBVA Auto.\n- Seguro $2,000/mes: cotización Qualitas cobertura amplia comercial.\n- Gasolina $24.5: promedio CRE Nuevo León.'
          }
          style={{ minHeight: 160 }}
        />
      </div>
    </div>
  );
};

// ============================================================================
// PÁGINA: REPORTE  ·  Objetivos solicitados por el usuario
// ----------------------------------------------------------------------------
// Entregable académico del problema (Actividades 1-A a 1-D):
//   - Portada/intro, conclusiones narrativas siguiendo la plantilla del problema,
//     y tabla resumen con todos los números clave.
//   - Act. 1-B: mostrar VP, VF y el "costo del dinero" (VF − VP) diferenciados.
//   - Act. 1-C: punto de equilibrio + intensidad (días/sem, horas/día, horas/sem).
//     El usuario pidió explícitamente que las HORAS POR SEMANA aparezcan en la
//     pantalla final ("recuerda las instrucciones especificaron...").
//   - Act. 1-D: depreciación, valor de rescate y los 3 escenarios de liquidación
//     (crédito pagado / venta cubre saldo / venta NO cubre saldo = déficit).
// Peticiones posteriores integradas aquí:
//   - TODAS las variables nuevas deben verse en el reporte: seguro mensual,
//     refrendo, lavado, propinas, misceláneos, y los pagos iniciales únicos
//     (toxicológico + certificación) como desembolso de una sola vez.
//   - Desglose de gasto total del horizonte + costo neto del proyecto.
//   - Si se importó un auto con IA, listar la TABLA DE FUENTES (una liga por dato)
//     para poder verificar que la info viene de fuentes reputables.
//   - Si el usuario llenó su ingreso mensual (opcional), mostrar qué % se va al auto.
// ============================================================================
