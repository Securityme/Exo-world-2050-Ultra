# `src/parsers/` (L0 — Result-Pattern Boundary Parsers)

- `zod-boundary.parser.ts` — Validation Zod typée `[Error | null, T | null]`.
- `unity-bridge.parser.ts` — Sérialisation `SceneDiffPacket` → Unity 6 URP JSON, parsing des événements Unity → Jeu (`TILE_SELECTED`, `DISTRICT_CLICKED`, etc.), et génération C# / `.jslib` (`OPT-02 A+`).
- `gemini-dualpass.parser.ts` — Sas Dual-Pass Gemini (`Free Tier Strict 0 USD`, `R-68`).
- `snapshot-gzip.parser.ts` — Compression/décompression des snapshots de tour.
