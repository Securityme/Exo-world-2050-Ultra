# `[L2] src/core` — Noyau Pur Déterministe (`0 I/O`)
Cœur de simulation 100 % pur : `Pcg32`, `sha256Hex`, `TRIGGER_BUS`, `triggers/`, `queues/`, `dispatchers/`, `routers/`, `probability/` et `cycle-orchestrator.ts` (`N0→N5`). Zéro `Math.random()`, `Date.now()` ou `fetch()`.
