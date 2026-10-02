import { describe, expect, it } from 'vitest';
import { sourceLabel } from '../src/components/ui/SourceCell.jsx';
import { applyImportedJson, importCaseText, MAX_IMPORT_CHARS } from '../src/domain/aiCase.js';
import { DEFAULT_INPUTS } from '../src/domain/defaults.js';
import { sanitizeSources, SOURCE_LIMITS, sourceUrl } from '../src/domain/inputSchema.js';

describe('sanitizeSources', () => {
  it('drops a __proto__ key without touching Object.prototype', () => {
    const raw = JSON.parse('{"price":"https://example.com","__proto__":"x"}');
    expect(Object.keys(raw)).toContain('__proto__');
    const out = sanitizeSources(raw);
    expect(Object.keys(out)).toEqual(['price']);
    expect({}.x).toBeUndefined();
  });

  it('keeps only string values under plain keys', () => {
    const out = sanitizeSources({
      price: 'https://example.com',
      kmpl: null,
      nested: { a: 1 },
      list: ['x'],
      empty: '  ',
      'bad key': 'x',
      constructor: 'fabricante',
    });
    expect(out).toEqual({ price: 'https://example.com', constructor: 'fabricante' });
    expect(Object.getPrototypeOf(out)).toBe(Object.prototype);
  });

  it('caps the number of entries and their length', () => {
    const many = Object.fromEntries(
      Array.from({ length: 500 }, (_, i) => [`k${i}`, 'x'.repeat(2000)]),
    );
    const out = sanitizeSources(many);
    expect(Object.keys(out)).toHaveLength(SOURCE_LIMITS.keys);
    expect(out.k0).toHaveLength(SOURCE_LIMITS.value);
  });

  it('returns null when nothing usable is left', () => {
    expect(sanitizeSources({ a: 1 })).toBeNull();
    expect(sanitizeSources('https://example.com')).toBeNull();
  });
});

describe('sourceLabel', () => {
  it('only reads the label table’s own keys', () => {
    expect(sourceLabel('price')).toBe('Precio');
    expect(sourceLabel('constructor')).toBe('constructor');
    expect(sourceLabel('__proto__')).toBe('__proto__');
    expect(sourceLabel('toString')).toBe('toString');
  });
});

describe('sourceUrl', () => {
  it('accepts only http and https links', () => {
    expect(sourceUrl('https://www.example.com/precio?x=1').hostname).toBe('www.example.com');
    expect(sourceUrl(' http://example.com ').hostname).toBe('example.com');
    for (const bad of [
      'javascript:alert(1)',
      'http:javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'ftp://example.com',
      '[ESTIMACIÓN] promedio',
      null,
    ]) {
      expect(sourceUrl(bad)).toBeNull();
    }
  });
});

describe('import size limits', () => {
  it('reports dropped sources and trims long text', () => {
    const json = JSON.parse(
      `{"vehicle":{"justification":"${'x'.repeat(5000)}"},"sources":{"price":"https://example.com","__proto__":"x","kmpl":null}}`,
    );
    const { inputs, sources, ignored, trimmed } = applyImportedJson(json, DEFAULT_INPUTS);
    expect(inputs.carJustification).toHaveLength(1000);
    expect(trimmed).toEqual(['vehicle.justification']);
    expect(sources).toEqual({ price: 'https://example.com' });
    expect(ignored).toEqual(['sources (2 omitidas)']);
  });

  it('refuses pasted text above the size limit', () => {
    const huge = `{"vehicle":{"name":"${'x'.repeat(MAX_IMPORT_CHARS)}"}}`;
    expect(importCaseText(huge, DEFAULT_INPUTS)).toMatchObject({ ok: false });
  });
});
