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
// PÁGINA: DASHBOARD
// ----------------------------------------------------------------------------
// Pantalla principal de resultados: el veredicto (viable, pesado, inviable o sólo
// costo), el resumen de decisión de compra, el impacto en el ingreso (sólo si se
// capturó), los KPIs del crédito y del proyecto con su explicación en un tooltip,
// y las gráficas de largo plazo: amortización, estructura mensual de costos, gasto
// acumulado por categoría (incluye el desembolso inicial) y valor del auto contra
// la deuda. Una tabla clasifica cada costo como fijo o variable y directo o
// indirecto.
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
