# Auto-Pilot — Uber / New-Car Financial Simulator

Can a new car pay for itself if you drive Uber in your spare time? This app
answers that with an actual financial model instead of vibes: month-by-month
cashflow, amortization, depreciation, break-even driving hours, sensitivity
analysis, and Monte Carlo simulation. Spanish UI, Mexican-market assumptions.

**▶ Try it live:** embedded at [adriangaona.dev](https://adriangaona.dev)
(Selected work → Financial Sim → Launch app). Fully client-side — your numbers
never leave the browser.

## What it models

- **Purchase modes** — cash, credit, or mixed; amortization table, present /
  future value, and a cash-vs-credit verdict in today's pesos.
- **Operation modes** — break-even Uber (how much must I drive?), target
  monthly profit, or plain personal ownership (what does it really cost?).
- **Any powertrain** — gasoline, diesel, hybrid, electric; energy cost per km
  computed accordingly.
- **Total Cost of Ownership** — depreciation + financing + energy + insurance
  + maintenance + registration + platform fees + taxes − resale value, over a
  configurable horizon.
- **Decision tooling** — saved scenario comparison, one-way sensitivity
  analysis, Monte Carlo simulation over the uncertain inputs, and an
  auto-generated narrative report.
- **AI import** — paste a JSON vehicle profile (there's a prompt template for
  researching a car with an LLM) and the simulator loads the case.

## Origin story

Started as an economic-engineering class assignment (evaluate a 2026–2029
vehicle project as a "financial consultant"), then kept growing until it
became a genuinely useful car-purchase decision tool. The class context lives
in `Context from class/`; the app long since outgrew it.

## Run it

```bash
npm install
npm run dev        # http://127.0.0.1:5173

npm run build      # static bundle — host anywhere
# or Docker (nginx)
docker build -t financial-sim .
docker run --rm -p 5006:80 financial-sim
```

## Stack

React 19 · Vite · Recharts · lucide-react — one deliberately self-contained
main component (`uber_car_simulator.jsx`) holding the entire model.

---

Built by [Adrián Gaona](https://adriangaona.dev).
