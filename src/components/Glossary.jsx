import { HelpCircle } from 'lucide-react';
import { GLOSSARY_LABELS, GLOSSARY_SECTIONS } from '../content/glossary.js';
import { TIPS } from '../content/tips.js';

// ============================================================================
// PAGE: GLOSARIO (GLOSSARY)
// ----------------------------------------------------------------------------
// The same explanations as the "?" tooltips (TIPS), gathered to read in one go.
// GLOSSARY_LABELS gives each term a readable label and GLOSSARY_SECTIONS groups
// them by topic; a term that is in no section falls into "Otros" (other), so no
// definition is lost.
// ============================================================================
const humanizeSlug = (k) =>
  k
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
export const Glossary = () => {
  // TIPS terms left out of every section go to "Otros" so they are not lost.
  const placed = new Set(GLOSSARY_SECTIONS.flatMap((s) => s.keys));
  const leftovers = Object.keys(TIPS).filter((k) => !placed.has(k));
  const sections = leftovers.length
    ? [...GLOSSARY_SECTIONS, { title: 'Otros', keys: leftovers }]
    : GLOSSARY_SECTIONS;
  return (
    <div className="report-body" style={{ maxWidth: 820 }}>
      <h1 className="serif" style={{ fontSize: 38, margin: '0 0 6px' }}>
        Glosario
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: 24, lineHeight: 1.7 }}>
        Todos los términos del simulador explicados en lenguaje sencillo. Son las mismas notas que
        aparecen al tocar el ícono{' '}
        <span className="info" style={{ position: 'static', display: 'inline-flex' }}>
          <HelpCircle />
        </span>{' '}
        en cada campo, reunidas aquí para leerlas de corrido.
      </p>
      {sections.map((sec) => {
        const items = sec.keys.filter((k) => TIPS[k]);
        if (!items.length) return null;
        return (
          <div key={sec.title} style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 20 }}>{sec.title}</h2>
            <dl style={{ margin: 0 }}>
              {items.map((k) => (
                <div key={k} className="card" style={{ marginBottom: 10, padding: '14px 18px' }}>
                  <dt
                    style={{
                      fontFamily: 'Manrope',
                      fontWeight: 600,
                      fontSize: 14,
                      color: 'var(--ink)',
                      marginBottom: 5,
                    }}
                  >
                    {GLOSSARY_LABELS[k] || humanizeSlug(k)}
                  </dt>
                  <dd
                    style={{
                      margin: 0,
                      fontFamily: 'Manrope',
                      fontSize: 13.5,
                      lineHeight: 1.6,
                      color: 'var(--ink-2)',
                    }}
                    dangerouslySetInnerHTML={{ __html: TIPS[k] }}
                  />
                </div>
              ))}
            </dl>
          </div>
        );
      })}
    </div>
  );
};
