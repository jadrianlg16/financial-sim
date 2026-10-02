# Architecture

The app is a client-side Vite + React 19 single page. There is no backend: every
number is computed in the browser, and the app's own code makes no requests. The
only network traffic at runtime is the page's own static assets, fonts included
(they are bundled from the Fontsource packages in `main.jsx`). Your figures never
leave your machine.

## Layers

```text
src/
  main.jsx            entry point — mounts <App/>
  App.jsx             tab routing (each tab lazy-loaded), top-level state, localStorage persistence
  domain/             the financial model — pure JS, no React
  content/            user-facing copy (tips, glossary, source labels)
  components/         presentation
    sidebar/          the side panel's input groups
    report/           report sections, plus its text and Markdown builders (plain JS)
    ui/               reusable primitives (Field, Group, Info, Segmented, SourceCell, ErrorBoundary)
  theme/              fonts + CSS custom properties
  storage/            localStorage read helpers
test/                 Vitest suites for domain/ and report/reportText.js
```

The dependency rule is one-directional:

```text
components/ ──▶ domain/   ──▶ (nothing outside domain/)
     │
     └────────▶ content/  ──▶ (nothing)
```

`domain/` imports no React and never imports from `components/`. That is enforced
by convention and is easy to check:

```bash
grep -l "from 'react'" src/domain/*.js     # expect no matches
grep -n "from '../components" src/domain/*.js  # expect no matches
```

Keeping the model pure means every financial function can be called from a test,
a script, or a future server without dragging a rendering framework along.

## The domain layer

| Module | Responsibility |
|---|---|
| `constants.js` | Car presets, city presets, powertrain types, chart colors |
| `defaults.js` | `DEFAULT_INPUTS` — the starting scenario |
| `year.js` | `currentYear()` and `projectionYear()` — the only code that reads the clock |
| `format.js` | MXN / number / percent formatters and numeric guards (`clamp`, `positive`, …) |
| `finance.js` | Loan math: `pmt`, amortization tables (standard and balloon), `npv`, `irr`, `solvePeriodicRate`, `equivalentAnnualCost` |
| `depreciation.js` | `effectiveDepRate`, `depreciatedValue` — resale value over the horizon, aged against the reference year |
| `energy.js` | `calculateEnergyCost` — per-km energy cost across gasoline / diesel / hybrid / EV |
| `calculate.js` | **The core model.** Takes one `inputs` object, returns the full result set consumed by every tab |
| `sensitivity.js` | One-variable-at-a-time swings around the base case, measured on break-even trips (or on net project cost when there is no Uber income) |
| `monteCarlo.js` | `MC_VARIATIONS` (what varies and by how much), `randomNormal` and `runMonteCarlo` — repeats `calculate()` over randomized inputs (3,000 runs by default in the Monte Carlo tab, 800 for the report's risk band) |
| `aiCase.js` | Builds the research prompt; parses, validates and applies an imported JSON case |
| `inputSchema.js` | Allowed option values, `INPUT_LIMITS` (horizon ≤ 30 years, loan and lease terms ≤ 120 months), text limits, and the checks for saved inputs, imported sources and source URLs |
| `compare.js` | Car-preset application (shared by the sidebar and the comparison tab), cloning, max cars |
| `carDisplay.js` | Human-readable car name from inputs |

### `calculate()`

`calculate(inputs, { year })` runs eight named stages, each taking only what it
needs from the earlier ones:

| Stage | Produces |
|---|---|
| `financingStage` | Down payment, amount financed, loan / balloon / lease terms, PV and FV of the credit |
| `operatingCostStage` | Energy and maintenance cost per km, fixed monthly costs, day-one cash |
| `liquidationStage` | Market value at the horizon, sale price net of selling costs, live debt, terminal recovery |
| `breakEvenStage` | Net contribution of one trip under the tax regime, trips per month to cover the plan |
| `usageStage` | Kilometres, energy and maintenance implied by those trips |
| `feasibilityStage` | Hours, trips per hour, EV range and charging time; the `feasible` flag |
| `cashflowStage` | Year-by-year cash flow with inflation, repairs, payments, revenue and totals |
| `economicsStage` | NPV, IRR, present value and EAC of ownership, TCO per year and per km, CAT, finance vs. cash |

`calculate()` then returns the keys listed in `RESULT_KEYS`, in that order.
`year` is the calendar year treated as "now" (projection year 1 and the reference
for a used car's age); it defaults to `currentYear()`, and tests whose results
depend on it pass it explicitly or fake the clock.

`calculate()` is the hub: `App.jsx` calls it whenever the inputs change and hands
the result to every tab, while `sensitivity`, `monteCarlo` and the comparison tab
call it again with modified inputs rather than re-deriving figures. Adding a cost
line means changing it in one place and having every tab, chart, and the
narrative report pick it up.

## State

`App.jsx` owns the app state — `inputs` (the scenario), `saved` (scenarios saved
for comparison), `sources` (the provenance citations attached to an imported case)
and the active tab — and passes it down. There is no state library; the tree is
shallow enough that prop drilling stays legible.

Persistence touches `localStorage` in three places, and every access is wrapped in
`try/catch` so full or blocked storage never stops the calculation. That includes
a sandboxed iframe with an opaque origin (how the portfolio embeds the demo), where
even reading `localStorage` throws: the app then keeps its state in memory only.

- `storage/persistence.js` reads the `autopilot.v1` key (inputs, saved scenarios,
  sources) and the `autopilot.sidebarMode` Basic/Advanced preference. Saved state
  is untrusted, so `sanitizePersisted` keeps only known input keys coerced to their
  default's type and limits, drops saved scenarios without an inputs object, and
  filters the sources.
- `App.jsx` writes `autopilot.v1` whenever inputs, saved scenarios or sources
  change, and removes it on reset.
- `components/Sidebar.jsx` writes `autopilot.sidebarMode` when the Basic/Advanced
  toggle changes.

Two error boundaries keep a render error from blanking the page: one around the
tab area (keyed by tab) shows Retry and Clear saved data while the sidebar keeps
working, and one around the whole app (`main.jsx`) shows `CrashScreen`, which
clears storage and reloads.

## Content vs. code

Explanatory copy lives in `content/`, not inline in components:

- `tips.js` — the `?` tooltip text for every technical term
- `glossary.js` — the Glossary tab's labels and sections
- `sources.js` — labels for citation sources on an imported case

This split exists because the copy is the product here: the app's stated goal is
that someone who does not know finance can still follow the reasoning. Editing an
explanation should not mean touching a component.

## Tests

`npm test` runs Vitest in Node; nothing needs a browser or the network.

- **Characterization snapshots** (`test/calculate.characterization.test.js`) pin the
  complete output of `calculate()` for the seven input sets in
  `test/fixtures/scenarios.js`, one JSON file per scenario under
  `test/__snapshots__/calculate/`. `test/helpers/serialize.js` keeps key order and
  spells out `NaN`, `±Infinity`, `-0` and `undefined`, which `JSON.stringify` would
  lose, so a refactor that changes a single number, key or key order fails. The
  fixtures carry their own copy of the default inputs, so editing
  `DEFAULT_INPUTS` does not silently rewrite them. After an intended model change,
  run `npx vitest run -u` and review the JSON diff.
- **Unit tests** cover the finance functions, depreciation, `calculate()`'s internal
  identities per mode, sensitivity, the reference year, the preset logic, the
  input limits, the import, saved-state and sources checks, and the report's text
  builders, including Markdown escaping.
- **Determinism**: the year is passed explicitly (or the clock is faked), and the
  Monte Carlo tests inject a seeded generator from `test/helpers/rng.js`.

Lint (`npm run lint`, ESLint with React and React Hooks rules) and formatting
(`npm run format:check`, Prettier) run alongside the tests in
`.github/workflows/ci.yml`.

## History

This codebase was originally a single 2,980-line `uber_car_simulator.jsx`. It was
split into the modules above with no behavior change, and the file-header
requirements log became [REQUISITOS.md](REQUISITOS.md). Later, `calculate()` was
divided into the stages above under the characterization snapshots, and the two
largest components (the sidebar and the report) were split into the `sidebar/`
and `report/` folders.
