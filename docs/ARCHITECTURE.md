# Architecture

The app is a client-side Vite + React 19 single page. There is no backend and no
network call anywhere in the codebase — every number is computed in the browser,
which is why the app can promise that your figures never leave your machine.

## Layers

```
src/
  main.jsx            entry point — mounts <App/>
  App.jsx             tab routing, top-level state, localStorage persistence
  domain/             the financial model — pure JS, no React
  content/            user-facing copy (tips, glossary, source labels)
  components/         presentation
    ui/               reusable primitives (Field, Group, Info, Segmented)
  theme/              fonts + CSS custom properties
  storage/            localStorage read/write helpers
```

The dependency rule is one-directional:

```
components/ ──▶ domain/ ──▶ (nothing)
     │              ▲
     └──▶ content/ ─┘
```

`domain/` imports no React and never imports from `components/`. That is enforced
by convention today and is easy to check:

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
| `format.js` | MXN / number / percent formatters and numeric guards (`clamp`, `positive`, …) |
| `finance.js` | Loan math: `pmt`, amortization tables (standard and balloon), `npv`, `irr`, `solvePeriodicRate`, `equivalentAnnualCost` |
| `depreciation.js` | `effectiveDepRate`, `depreciatedValue` — resale value over the horizon |
| `energy.js` | `calculateEnergyCost` — per-km energy cost across gasoline / diesel / hybrid / EV |
| `calculate.js` | **The core model.** Takes one `inputs` object, returns the full result set consumed by every tab |
| `sensitivity.js` | One-variable-at-a-time swings around the break-even point |
| `monteCarlo.js` | `randomNormal` + `runMonteCarlo` — repeats `calculate()` thousands of times over randomized inputs |
| `aiCase.js` | Builds the research prompt and validates/applies an imported JSON case |
| `compare.js` | Helpers for the multi-car comparison (preset application, cloning, max cars) |
| `carDisplay.js` | Human-readable car name from inputs |

`calculate()` is the hub: `sensitivity`, `monteCarlo`, and every component call it
rather than re-deriving figures. Adding a cost line means changing it in one
place and having every tab, chart, and the narrative report pick it up.

## State

`App.jsx` owns two pieces of state — `inputs` (the scenario) and `sources` (the
provenance citations attached to an imported case) — and passes them down. There
is no state library; the tree is shallow enough that prop drilling stays legible.

Persistence is deliberately narrow: `storage/persistence.js` reads and writes the
`autopilot.v1` localStorage key and the sidebar Basic/Advanced preference.
Nothing else touches `localStorage`.

## Content vs. code

Explanatory copy lives in `content/`, not inline in components:

- `tips.jsx` — the `?` tooltip text for every technical term
- `glossary.js` — the Glossary tab's labels and sections
- `sources.js` — labels for citation sources on an imported case

This split exists because the copy is the product here: the app's stated goal is
that someone who does not know finance can still follow the reasoning. Editing an
explanation should not mean touching a component.

## History

This codebase was originally a single 2,980-line `uber_car_simulator.jsx`. It was
split into the modules above with no behavior change; the rationale comments that
were attached to each section moved with their code, and the file-header
requirements log became [REQUISITOS.md](REQUISITOS.md).
