# CreaTech Command Center

Production-grade frontend prototype for **AI-driven generative design and autonomous construction site execution**.

## What this software delivers

- Generative construction strategy engine with weighted multi-objective scoring.
- Predictive simulation with Monte Carlo risk modeling (delay, cost overrun, rework).
- Real-time sensor matrix driving continuous model recalibration.
- Adaptive action feed for mitigation decisions.
- Integration health table for common project systems (BIM/P6/ERP/IoT).
- Scenario lifecycle support: create, save, load, export, and import.
- Professional responsive dashboard UI suitable for live demos and pilot workflows.

## Run locally

```bash
python3 -m http.server 4173 --bind 0.0.0.0
```

Open:

- `http://127.0.0.1:4173`

## Notes

- Scenario storage uses browser `localStorage`.
- JSON export/import can be used for handoff between teams or environments.
