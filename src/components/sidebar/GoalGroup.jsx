import { Settings } from 'lucide-react';
import { Field } from '../ui/Field.jsx';
import { Group } from '../ui/Group.jsx';
import { Segmented } from '../ui/Segmented.jsx';

// Goal of the analysis: make the car pay for itself with Uber, earn an amount
// per month, or just learn what owning it costs.
export const GoalGroup = ({ inputs, set }) => {
  return (
    <>
      <Group
        icon={Settings}
        title="¿Qué quieres analizar?"
        blurb="Define el objetivo de tu análisis."
      >
        <Segmented
          value={inputs.operationMode}
          onChange={(v) => set('operationMode', v)}
          options={[
            { value: 'uber-breakeven', label: 'Que se pague solo' },
            { value: 'uber-target-profit', label: 'Ganar X al mes' },
            { value: 'no-uber', label: 'Sin Uber' },
          ]}
        />
        <div
          style={{
            fontSize: 10.5,
            color: 'var(--muted)',
            marginTop: -2,
            marginBottom: 8,
            lineHeight: 1.5,
          }}
        >
          {inputs.operationMode === 'uber-breakeven' &&
            '→ Calculamos lo mínimo que debes trabajar para que el proyecto completo se pague solo.'}
          {inputs.operationMode === 'uber-target-profit' &&
            '→ Calculamos cuánto trabajar para que el proyecto se pague y además te dé la ganancia que defines.'}
          {inputs.operationMode === 'no-uber' &&
            '→ Sólo calculamos cuánto cuesta tener el auto (sin generar ingresos).'}
        </div>
        {inputs.operationMode === 'uber-target-profit' && (
          <Field
            label="Ganancia mensual que quieres"
            value={inputs.monthlyProfitTarget}
            min={0}
            max={30000}
            step={500}
            onChange={(v) => set('monthlyProfitTarget', v)}
            suffix="MXN/mes"
            info="Cuánto quieres ganar al mes por encima de cubrir los gastos del auto."
          />
        )}
      </Group>
    </>
  );
};
