import { CreditFormulas } from './formulas/CreditFormulas.jsx';
import { EconomicsFormulas } from './formulas/EconomicsFormulas.jsx';
import { ProjectFormulas } from './formulas/ProjectFormulas.jsx';

// ============================================================================
// PÁGINA: FÓRMULAS
// ----------------------------------------------------------------------------
// Cada ecuación del simulador con los valores actuales sustituidos, para auditar
// de dónde sale cada número: anualidad (más globo y arrendamiento), VP, VF, costo
// del dinero, depreciación, contribución por viaje, punto de equilibrio,
// intensidad de trabajo, inflación, costo y resultado neto, VPN, TIR, CAE, CAT,
// financiar vs. contado, $/km, seguro como % del valor, y carga y autonomía del
// EV. Cada fórmula explica sus términos en lenguaje simple.
// ============================================================================
export const Formulas = ({ result, inputs }) => (
  <div style={{ maxWidth: 820 }}>
    <h1 className="serif" style={{ fontSize: 38, margin: '0 0 8px' }}>
      Fórmulas usadas
    </h1>
    <p style={{ color: 'var(--muted)', marginBottom: 28, lineHeight: 1.7 }}>
      Todas las ecuaciones del simulador con los valores actuales sustituidos. Las primeras son de
      ingeniería financiera de plazos (anualidad, VP/VF); las nuevas (VPN, TIR, CAE, CAT) son las
      que se usan en una decisión de inversión/compra real.
    </p>

    <CreditFormulas result={result} inputs={inputs} />

    <ProjectFormulas result={result} inputs={inputs} />

    <EconomicsFormulas result={result} inputs={inputs} />
  </div>
);
