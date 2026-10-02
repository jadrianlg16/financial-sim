// Characterization tests for calculate().
//
// Each scenario's complete result object (every key, in the order calculate()
// returns them, including amortization rows and the year-by-year cash flow) is
// pinned to a JSON file under __snapshots__/calculate/. The files were captured
// from the model before it was split into stages, so any refactor that changes a
// single number, key or key order fails here.
import { describe, expect, it } from 'vitest';
import { calculate } from '../src/domain/calculate.js';
import { SCENARIOS, SNAPSHOT_YEAR } from './fixtures/scenarios.js';
import { serialize } from './helpers/serialize.js';

describe('calculate() characterization', () => {
  it.each(SCENARIOS.map((s) => [s.name, s.inputs]))('%s', async (name, inputs) => {
    const output = serialize(calculate(inputs, { year: SNAPSHOT_YEAR }));
    await expect(output).toMatchFileSnapshot(`./__snapshots__/calculate/${name}.json`);
  });
});
