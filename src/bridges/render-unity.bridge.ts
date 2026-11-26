import type { RenderAdapterConfig, RenderAdapterInterface } from '../adapters/render-adapter.interface.ts';
import {
  UnityUrpRenderProfileSchema,
  type RenderToGameEvent,
  type SceneDiffPacket,
  type UnityUrpRenderProfile,
} from '../contracts/render-bridge.schema.ts';
import {
  generateUnityCSharpBridgeScript,
  generateUnityJslibPluginScript,
  parseUnityToGameEvent,
  serializeSceneDiffForUnity,
} from '../parsers/unity-bridge.parser.ts';

/**
 * [L4/L5] FUP-007 / FUP-010 | SM-05 | SADT A5.3 | OPT-02 A+
 * PRIMARY 3D Render Bridge — Unity 6 URP (C# / Shader Graph / Burst / IL2CPP / .jslib).
 * Priority engine over Three.js Web Preview whenever a Unity 6 WebGL/Native host is present,
 * and authoritative generator for Unity 6 URP C#/.jslib/Prefab manifests.
 */
export interface UnityInstanceHandle {
  SendMessage(gameObjectName: string, methodName: string, value?: string | number): void;
  Quit?: () => Promise<void>;
}

declare global {
  interface Window {
    unityInstance?: UnityInstanceHandle;
    __EXO_UNITY_ON_EVENT__?: (rawJson: string) => void;
  }
}

export const DEFAULT_UNITY_URP_PROFILE: UnityUrpRenderProfile = UnityUrpRenderProfileSchema.parse({
  engineTarget: 'UNITY_6_URP',
  urpPipelineAsset: 'Assets/Settings/URP_ExoWorld2050_AAA.asset',
  shaderGraphPreset: 'Assets/Shaders/SG_RayleighMie_OpenSky.shadergraph',
  qualityPreset: 'URP_DESKTOP_AAA',
  burstJobsEnabled: true,
  il2cppTarget: 'WEBGPU_WASM',
  jslibBridgeObject: 'ExoWorldBridge',
  addressablesGroup: 'ExoWorld2050_Prefabs_URP',
});

export function isUnity6RuntimeAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.unityInstance === 'object' &&
    window.unityInstance !== null &&
    typeof window.unityInstance.SendMessage === 'function'
  );
}

export interface UnityBridgeDiagnostics {
  readonly primaryEngine: 'UNITY_6_URP';
  readonly runtimeConnected: boolean;
  readonly packetsDispatched: number;
  readonly lastTickSynced: number | null;
  readonly profile: UnityUrpRenderProfile;
}

export class Unity6UrpRenderAdapter implements RenderAdapterInterface {
  public readonly engineTarget = 'UNITY_6_URP' as const;
  private readonly profile: UnityUrpRenderProfile;
  private listener: ((event: RenderToGameEvent) => void) | null = null;
  private packetsDispatched = 0;
  private lastTickSynced: number | null = null;

  public constructor(profile: UnityUrpRenderProfile = DEFAULT_UNITY_URP_PROFILE) {
    this.profile = profile;
  }

  public mount(_container: HTMLElement, _config?: RenderAdapterConfig): void {
    if (typeof window !== 'undefined') {
      window.__EXO_UNITY_ON_EVENT__ = (rawJson: string) => {
        const [err, event] = parseUnityToGameEvent(rawJson);
        if (err === null && this.listener) {
          this.listener(event);
        }
      };
    }
  }

  public setOnGameEvent(listener: (event: RenderToGameEvent) => void): void {
    this.listener = listener;
  }

  public applySceneDiff(packet: SceneDiffPacket): void {
    const [err, serialized] = serializeSceneDiffForUnity(packet);
    if (err !== null) return;
    this.packetsDispatched += 1;
    this.lastTickSynced = packet.tick;
    if (isUnity6RuntimeAvailable()) {
      window.unityInstance!.SendMessage(
        this.profile.jslibBridgeObject,
        'ApplySceneDiff',
        serialized,
      );
    }
  }

  public resize(width: number, height: number): void {
    if (isUnity6RuntimeAvailable()) {
      window.unityInstance!.SendMessage(
        this.profile.jslibBridgeObject,
        'SetViewportSize',
        JSON.stringify({ width, height }),
      );
    }
  }

  public dispose(): void {
    if (typeof window !== 'undefined' && window.__EXO_UNITY_ON_EVENT__) {
      delete window.__EXO_UNITY_ON_EVENT__;
    }
    this.listener = null;
  }

  public getDiagnostics(): UnityBridgeDiagnostics {
    return {
      primaryEngine: 'UNITY_6_URP',
      runtimeConnected: isUnity6RuntimeAvailable(),
      packetsDispatched: this.packetsDispatched,
      lastTickSynced: this.lastTickSynced,
      profile: this.profile,
    };
  }
}

export function buildUnity6UrpExportBundle(
  profile: UnityUrpRenderProfile = DEFAULT_UNITY_URP_PROFILE,
): {
  readonly csharpScript: string;
  readonly jslibScript: string;
  readonly profile: UnityUrpRenderProfile;
} {
  return {
    csharpScript: generateUnityCSharpBridgeScript(profile),
    jslibScript: generateUnityJslibPluginScript(),
    profile,
  };
}
