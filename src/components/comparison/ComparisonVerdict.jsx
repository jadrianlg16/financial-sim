import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { fmtMXN } from '../../domain/format.js';

// Which car wins on equivalent annual cost, and whether the cheapest per km agrees.
export const ComparisonVerdict = ({ bestEac, bestPerKm, eacKmAgree }) => {
  return (
    <div className={`verdict ${eacKmAgree ? 'ok' : 'warn'}`} style={{ marginBottom: 18 }}>
      <div className="verdict-icon">
        {eacKmAgree ? (
          <CheckCircle2 size={22} color="var(--pos)" />
        ) : (
          <AlertTriangle size={22} color="var(--warn)" />
        )}
      </div>
      <div>
        {bestEac ? (
          <>
            <div className="verdict-text">
              Mejor valor por CAE: <span style={{ color: 'var(--accent)' }}>{bestEac.label}</span>
            </div>
            <div className="verdict-sub">
              Menor costo anual equivalente: {fmtMXN(bestEac.result.eac)}/año (CAE).{' '}
              {bestPerKm
                ? eacKmAgree
                  ? `Y además es el más barato por km (${fmtMXN(bestPerKm.result.costPerKm, 2)}/km): ambos criterios coinciden.`
                  : `Pero ${bestPerKm.label} es más barato por km (${fmtMXN(bestPerKm.result.costPerKm, 2)}/km): ${bestEac.label} gana en CAE y ${bestPerKm.label} en $/km — decide según si te importa más el costo anual de poseerlo o el costo por kilómetro recorrido.`
                : 'Agrega km personales o un horizonte para obtener el costo por km.'}
            </div>
          </>
        ) : (
          <div className="verdict-text">Agrega autos para comparar.</div>
        )}
      </div>
    </div>
  );
};
