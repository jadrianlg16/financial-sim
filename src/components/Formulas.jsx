import { CreditFormulas } from './formulas/CreditFormulas.jsx';
import { EconomicsFormulas } from './formulas/EconomicsFormulas.jsx';
import { ProjectFormulas } from './formulas/ProjectFormulas.jsx';

// ============================================================================
// PAGE: FÓRMULAS (FORMULAS)
// ----------------------------------------------------------------------------
// Every equation of the simulator with the current values substituted, to audit
// where each number comes from: annuity (plus balloon and lease), PV, FV, cost of
// money, depreciation, contribution per trip, break-even, work intensity,
// inflation, net cost and result, VPN (NPV), TIR (IRR), CAE (EAC), CAT, finance
// vs. cash, $/km, insurance as % of value, and EV charging and range. Each
// formula explains its terms in plain language.
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
