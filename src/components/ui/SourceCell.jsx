import { SOURCE_LABELS } from '../../content/sources.js';
import { sourceUrl } from '../../domain/inputSchema.js';

/** Readable name of a source key; unknown keys are shown as they came. */
export const sourceLabel = (key) => (Object.hasOwn(SOURCE_LABELS, key) ? SOURCE_LABELS[key] : key);

/**
 * One cited source: an http(s) URL becomes a link with its hostname next to it,
 * so the destination is visible before clicking; anything else is plain text.
 * Estimates (marked [ESTIMACIÓN]) can be highlighted.
 */
export const SourceCell = ({ value, highlightEstimates = false }) => {
  const url = sourceUrl(value);
  if (url) {
    return (
      <>
        <a
          href={url.href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--accent)' }}
        >
          {value}
        </a>{' '}
        <span style={{ color: 'var(--muted)' }}>({url.hostname})</span>
      </>
    );
  }
  if (!highlightEstimates) return String(value);
  return (
    <span style={{ color: String(value).includes('[ESTIM') ? 'var(--warn)' : 'var(--muted)' }}>
      {String(value)}
    </span>
  );
};
