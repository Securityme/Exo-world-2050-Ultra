import type {
  RenderEngineTarget,
  RenderToGameEvent,
  SceneDiffPacket,
} from '../contracts/render-bridge.schema.ts';

/**
 * [L4] FUP-007 | SM-05 | SADT A5.3 | OPT-02 A+
 * Unity-First Dual-Adapter 3D Render Interface:
 * - Primary Engine: Unity 6 URP (C# / Shader Graph / Burst / IL2CPP / .jslib)
 * - Web Preview Fallback: Three.js r170+ WebGL2/WebGPU
 * Strictly read-only consumer of SceneDiffPacket (R-15).
 */
export interface RenderAdapterConfig {
  readonly lowPowerMode?: boolean;
  readonly maxDpr?: number;
  readonly preferredEngine?: RenderEngineTarget;
}

export interface RenderAdapterInterface {
  readonly engineTarget?: RenderEngineTarget;
  mount(container: HTMLElement, config?: RenderAdapterConfig): void;
  setOnGameEvent(listener: (event: RenderToGameEvent) => void): void;
  applySceneDiff(packet: SceneDiffPacket): void;
  resize(width: number, height: number): void;
  dispose(): void;
}
