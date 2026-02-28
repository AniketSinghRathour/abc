# CreaTech Command Center

Professional frontend software prototype for **AI-driven generative design and autonomous construction site execution**.

## Core capabilities

- Multi-objective generative strategy engine for project methods.
- Predictive Monte Carlo simulation for schedule, cost, and rework risk.
- Real-time sensor loop and one-click adaptive design recalibration.
- Integration health monitoring across BIM/schedule/procurement/IoT tools.
- Scenario lifecycle workflows (new/save/load/export/import).
- Responsive modern command-center UI for real project reviews.

## Technical architecture

- `engine.js`: deterministic, testable core engineering logic.
- `app.js`: UI orchestration and live interaction workflows.
- `index.html` + `styles.css`: production-style dashboard layout/theme.

## Run locally

```bash
python3 -m http.server 4173 --bind 0.0.0.0
```

Open `http://127.0.0.1:4173`.

## Validate

```bash
node --check engine.js
node --check app.js
node tests/engine.test.js
```
