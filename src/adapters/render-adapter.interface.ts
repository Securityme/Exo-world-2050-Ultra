import type { RenderToGameEvent, SceneDiffPacket } from '../contracts/render-bridge.schema.ts';

/**
 * [L4] FUP-007 | SM-05 | SADT A5.3 | OPT-02 A
 * Dual-Adapter 3D Render Interface (Three.js r170+ ↔ Unity 6 URP V5).
 * Strictly read-only consumer of SceneDiffPacket (R-15).
 */
export interface RenderAdapterConfig {
  readonly lowPowerMode?: boolean;
  readonly maxDpr?: number;
}

export interface RenderAdapterInterface {
  mount(container: HTMLElement, config?: RenderAdapterConfig): void;
  setOnGameEvent(listener: (event: RenderToGameEvent) => void): void;
  applySceneDiff(packet: SceneDiffPacket): void;
  resize(width: number, height: number): void;
  dispose(): void;
}
