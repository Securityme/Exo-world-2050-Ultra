# `src/bridges/` (L4 / L5 — Bridges & Dual-Adapter 3D Unity-First)

- `render-unity.bridge.ts` — **Moteur 3D Principal Unity 6 URP (`OPT-02 A+`)** : `Unity6UrpRenderAdapter`, `SendMessage('ExoWorldBridge', 'ApplySceneDiff', ...)`, écouteur bidirectionnel `__EXO_UNITY_ON_EVENT__`, profil URP (`Burst`, `IL2CPP`, `Shader Graph`, `Addressables`) et générateur d'export C# / `.jslib`.
- `render-dual.bridge.ts` — Routeur Unity-First (`resolvePreferredRenderEngine()`) priorisant `UNITY_6_URP` avec repli transparent vers l'aperçu Web léger `THREEJS_WEB_PREVIEW`.
- `sim-worker.bridge.ts` — Pont Web Worker déterministe `PCG32` / `SHA-256`.
