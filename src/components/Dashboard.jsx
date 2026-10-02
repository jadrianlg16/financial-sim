import { Battery } from 'lucide-react';
import { CostClassification } from './dashboard/CostClassification.jsx';
import { CostStructure } from './dashboard/CostStructure.jsx';
import { costBreakdownOf } from './dashboard/costBreakdown.js';
import { CumulativeSpend } from './dashboard/CumulativeSpend.jsx';
import { FinancingCard } from './dashboard/FinancingCard.jsx';
import { KpiGrid } from './dashboard/KpiGrid.jsx';
import { OperationPlan } from './dashboard/OperationPlan.jsx';
import { ValueVsDebt } from './dashboard/ValueVsDebt.jsx';
import { DecisionSummary } from './DecisionSummary.jsx';
import { IncomeImpact } from './IncomeImpact.jsx';
import { Verdict } from './Verdict.jsx';
import { fmtN } from '../domain/format.js';

// ============================================================================
// PAGE: DASHBOARD
// ----------------------------------------------------------------------------
// Main results screen: the verdict (viable, heavy, not viable or cost only),
// the purchase decision summary, the impact on income (only when an income was
// entered), the loan and project KPIs with an explanation in a tooltip, and the
// long-term charts: amortization, monthly cost structure, cumulative spend by
// category (including the day-one cash) and the car value against the debt. A
// table classifies each cost as fixed or variable and direct or indirect.
// ============================================================================
export const Dashboard = ({ result, inputs }) => {
  const costBreakdown = costBreakdownOf(result, inputs);
  return (
    <>
      <Verdict result={result} inputs={inputs} />
      {!result.isUberMode && result.evRangeShortfall && (
        <div className="verdict bad" style={{ marginTop: -12 }}>
          <div className="verdict-icon">
            <Battery size={22} color="var(--neg)" />
          </div>
          <div>
            <div className="verdict-text">Autonomía eléctrica ajustada</div>
            <div className="verdict-sub">
              Manejas {fmtN(result.totalDailyKm)} km/día pero una carga rinde ~
              {fmtN(result.dailyRangeKm)} km. Esto bloquea la viabilidad hasta ajustar batería,
              carga, km por viaje o días de trabajo.
            </div>
          </div>
        </div>
      )}
      <DecisionSummary result={result} inputs={inputs} />
      <IncomeImpact result={result} inputs={inputs} />
      <KpiGrid result={result} inputs={inputs} />

      <div className="row-2">
        <FinancingCard result={result} inputs={inputs} />
        <CostStructure result={result} costBreakdown={costBreakdown} />
      </div>

      <CumulativeSpend result={result} />

      <CostClassification result={result} costBreakdown={costBreakdown} />

      <ValueVsDebt result={result} />

      <OperationPlan result={result} inputs={inputs} />
    </>
  );
};
