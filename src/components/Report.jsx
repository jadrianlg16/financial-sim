import { useMemo } from 'react';
import { FileText, AlertTriangle, CheckCircle2, Download } from 'lucide-react';
import { ReportAssumptions } from './report/ReportAssumptions.jsx';
import { ReportFinancing } from './report/ReportFinancing.jsx';
import { ReportRisk } from './report/ReportRisk.jsx';
import { ReportTables } from './report/ReportTables.jsx';
import {
  buildMarkdown,
  buildNarrative,
  buildRecommendation,
  glanceRows,
  horizonBreakdown,
  reportLabels,
} from './report/reportText.js';
import { PRINT_CSS, RESPONSIVE_CSS } from './report/reportStyles.js';
import { carDisplayName } from '../domain/carDisplay.js';
import { CITY_PRESETS, VEHICLE_TYPES } from '../domain/constants.js';
import { fmtMXN, fmtN, fmtPct } from '../domain/format.js';
import { runMonteCarlo } from '../domain/monteCarlo.js';
import { currentYear, projectionYear } from '../domain/year.js';

// Número de simulaciones del rango probable: rápido y suficiente para P10/P50/P90.
const REPORT_MC_RUNS = 800;

// ============================================================================
// PÁGINA: REPORTE
// ----------------------------------------------------------------------------
// El análisis completo como documento: recomendación de asesor, cifras clave,
// financiamiento, costo total de propiedad, rango probable (Monte Carlo ligero),
// escenarios de liquidación, supuestos, fuentes de un caso importado, notas del
// usuario y una versión en prosa. Se imprime o guarda como PDF con el diálogo del
// navegador y se descarga como Markdown.
// ============================================================================
export const Report = ({ R, inputs, sources }) => {
  const car = carDisplayName(inputs);
  const city = inputs.cityName || CITY_PRESETS[inputs.city]?.name || 'la ciudad';
  const yearStart = currentYear();
  const yearEnd = projectionYear(inputs.horizonYears, yearStart);
  const vehicleLabel = VEHICLE_TYPES[inputs.vehicleType]?.label;
  const carAge = Math.max(0, yearStart - inputs.carYear);
  const isUsed = inputs.vehicleCondition === 'used';
  const incomePct =
    inputs.monthlyIncome > 0 ? R.monthlyTotalOperative / inputs.monthlyIncome : null;
  const energyName =
    inputs.vehicleType === 'electric'
      ? 'Energía eléctrica'
      : inputs.vehicleType === 'diesel'
        ? 'Diésel'
        : 'Combustible';
  const labels = reportLabels(R);

  // Se recalcula sólo cuando cambian los inputs.
  const mc = useMemo(() => {
    try {
      return runMonteCarlo(inputs, REPORT_MC_RUNS);
    } catch {
      return null;
    }
  }, [inputs]);
  const mcRuns = mc?.iterations || REPORT_MC_RUNS;

  const handlePrint = () => {
    try {
      window.print();
    } catch {
      /* algunos navegadores embebidos no permiten imprimir: no hay alternativa */
    }
  };

  const rec = buildRecommendation(R, inputs, incomePct);
  const recColor =
    rec.level === 'ok' ? 'var(--pos)' : rec.level === 'warn' ? 'var(--warn)' : 'var(--neg)';
  const breakdown = horizonBreakdown(R, energyName);
  const narrative = buildNarrative(R, inputs, { car, city, vehicleLabel, yearEnd });
  const glance = glanceRows(R, inputs, labels, yearEnd);

  const downloadMarkdown = () => {
    const md = buildMarkdown(R, inputs, {
      car,
      city,
      vehicleLabel,
      isUsed,
      yearStart,
      yearEnd,
      rec,
      incomePct,
      labels,
      breakdown,
      mc,
      mcRuns,
    });
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analisis_${car
      .replace(/[^a-z0-9]+/gi, '_')
      .toLowerCase()
      .slice(0, 60)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card report-body" style={{ padding: '40px 50px' }}>
      <style media="print">{PRINT_CSS}</style>
      <style>{RESPONSIVE_CSS}</style>
      <div
        className="report-noprint"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 24,
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <span className="pill accent">Análisis de decisión</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn outline" onClick={handlePrint}>
            <FileText size={11} /> Imprimir / Guardar PDF
          </button>
          <button className="btn outline" onClick={downloadMarkdown}>
            <Download size={11} /> Descargar .md
          </button>
        </div>
      </div>
      <h1>
        {R.isUberMode
          ? 'Comprar un auto y pagarlo con Uber'
          : 'Comprar un auto: ¿conviene y cuánto cuesta?'}
      </h1>
      <div
        style={{
          fontFamily: 'Manrope',
          fontSize: 13,
          color: 'var(--muted)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        {isUsed ? 'Usado/seminuevo' : 'Nuevo'} · {car} · {vehicleLabel} · {city} · {yearStart}–
        {yearEnd}
      </div>
      {inputs.carDescription && (
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>
          {inputs.carDescription}
          {carAge > 0
            ? ` · Modelo ${inputs.carYear} (≈${carAge} ${carAge === 1 ? 'año' : 'años'}${inputs.odometerKm > 0 ? `, ${fmtN(inputs.odometerKm)} km` : ''}).`
            : ` · Modelo ${inputs.carYear} (nuevo).`}
        </p>
      )}

      <div
        className="verdict"
        style={{
          borderLeft: `4px solid ${recColor}`,
          marginTop: 18,
          marginBottom: 8,
          alignItems: 'flex-start',
        }}
      >
        <div className="verdict-icon">
          {rec.level === 'ok' ? (
            <CheckCircle2 size={22} color={recColor} />
          ) : (
            <AlertTriangle size={22} color={recColor} />
          )}
        </div>
        <div>
          <div className="verdict-text" style={{ color: recColor }}>
            Recomendación: {rec.title}
          </div>
          <ul
            style={{
              margin: '8px 0 0',
              paddingLeft: 18,
              color: 'var(--ink-2)',
              fontFamily: 'Manrope',
              fontSize: 13.5,
              lineHeight: 1.6,
            }}
          >
            {rec.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      </div>
      {incomePct != null && (
        <p
          style={{
            background: 'var(--bg-2)',
            padding: '12px 16px',
            borderRadius: 4,
            fontSize: 13.5,
            marginTop: 14,
          }}
        >
          <strong>Asequibilidad:</strong> con un ingreso de {fmtMXN(inputs.monthlyIncome)}/mes, el
          auto consume el{' '}
          <strong
            style={{
              color:
                incomePct > 0.3 ? 'var(--neg)' : incomePct > 0.2 ? 'var(--warn)' : 'var(--pos)',
            }}
          >
            {fmtPct(incomePct, 1)}
          </strong>{' '}
          de tu sueldo. La regla sana: ≤20%.
        </p>
      )}

      <h2>La decisión de un vistazo</h2>
      <table className="tbl">
        <tbody>
          {glance.map((g, i) => (
            <tr key={i}>
              <td style={{ fontFamily: 'Manrope', fontWeight: g.strong ? 700 : 500 }}>{g.k}</td>
              <td className="num">{g.strong ? <strong>{g.v}</strong> : g.v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {inputs.carJustification && (
        <>
          <h2>Por qué este vehículo</h2>
          <p>{inputs.carJustification}</p>
        </>
      )}

      <ReportFinancing R={R} inputs={inputs} />
      <ReportTables
        R={R}
        inputs={inputs}
        yearEnd={yearEnd}
        car={car}
        vehicleLabel={vehicleLabel}
        breakdown={breakdown}
      />
      <ReportRisk R={R} mc={mc} mcRuns={mcRuns} />

      <ReportAssumptions R={R} inputs={inputs} labels={labels} sources={sources} />

      <h2 style={{ color: 'var(--muted)' }}>Apéndice · Conclusión narrativa</h2>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: -4 }}>
        El mismo análisis en prosa corrida, listo para copiar a un documento.
      </p>
      {narrative.map((p, i) => (
        <p key={i} style={{ fontSize: 13.5 }}>
          {p}
        </p>
      ))}

      <div
        style={{
          marginTop: 30,
          fontSize: 11,
          color: 'var(--muted)',
          fontStyle: 'italic',
          borderTop: '1px solid var(--line)',
          paddingTop: 14,
        }}
      >
        Análisis generado por Auto·Pilot con ingeniería económica (VPN, TIR, CAE, CAT). Los precios,
        tasas y costos son estimaciones referenciales: valídalos con fuentes oficiales (fabricante,
        AMDA, Profeco, CFE, tu banco/aseguradora) antes de decidir.
      </div>
    </div>
  );
};
