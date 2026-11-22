import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import packageJson from '../../package.json';
import { auth } from '../services/firebase/firebase-client.ts';

/**
 * [L6] Live runtime & package.json dependency health probe for Main Menu status beacons.
 */
export type BeaconHealthState = 'online' | 'ready' | 'warn' | 'offline';

export interface RuntimeStackStatus {
  readonly serverReachable: boolean;
  readonly serverChecked: boolean;
  readonly geminiConfigured: boolean;
  readonly nodeVersion: string | null;
  readonly webglActive: boolean;
  readonly firebaseInitialized: boolean;
  readonly firebaseSignedIn: boolean;
  readonly firebaseUserLabel: string | null;
  readonly localStorageReady: boolean;
  readonly dependenciesCount: number;
  readonly devDependenciesCount: number;
  readonly totalPackages: number;
  readonly versions: Readonly<Record<string, string>>;
}

interface SystemStatusPayload {
  readonly status?: string;
  readonly nodeVersion?: string;
  readonly dependenciesCount?: number;
  readonly devDependenciesCount?: number;
  readonly totalPackages?: number;
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
  readonly geminiConfigured?: boolean;
}

export function cleanSemver(raw: string | undefined): string {
  if (!raw) return '—';
  return raw.replace(/^[\^~>=<\s]+/, '');
}

function buildVersionMap(
  deps: Record<string, string>,
  devDeps: Record<string, string>,
): Readonly<Record<string, string>> {
  const merged = { ...devDeps, ...deps };
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(merged)) {
    result[key] = cleanSemver(val);
  }
  return result;
}

function detectWebGlSupport(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const existingCanvas = document.querySelector('canvas');
    if (existingCanvas) {
      return true;
    }
    const probe = document.createElement('canvas');
    return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'));
  } catch {
    return false;
  }
}

function detectLocalStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const probeKey = '__exw_storage_probe__';
    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);
    return true;
  } catch {
    return false;
  }
}

const initialDeps = (packageJson.dependencies ?? {}) as Record<string, string>;
const initialDevDeps = (packageJson.devDependencies ?? {}) as Record<string, string>;

export function useRuntimeStackStatus(): RuntimeStackStatus {
  const [status, setStatus] = useState<RuntimeStackStatus>(() => ({
    serverReachable: false,
    serverChecked: false,
    geminiConfigured: false,
    nodeVersion: null,
    webglActive: detectWebGlSupport(),
    firebaseInitialized: Boolean(auth.app?.options?.projectId),
    firebaseSignedIn: Boolean(auth.currentUser),
    firebaseUserLabel: auth.currentUser?.email ?? auth.currentUser?.displayName ?? null,
    localStorageReady: detectLocalStorage(),
    dependenciesCount: Object.keys(initialDeps).length,
    devDependenciesCount: Object.keys(initialDevDeps).length,
    totalPackages: Object.keys(initialDeps).length + Object.keys(initialDevDeps).length,
    versions: buildVersionMap(initialDeps, initialDevDeps),
  }));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setStatus((prev) => ({
        ...prev,
        firebaseInitialized: Boolean(auth.app?.options?.projectId),
        firebaseSignedIn: Boolean(user),
        firebaseUserLabel: user?.email ?? user?.displayName ?? null,
      }));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    let active = true;

    const probeServer = async () => {
      try {
        const res = await fetch('/api/system-status', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = (await res.json()) as SystemStatusPayload;
        if (!active) return;
        const deps = payload.dependencies ?? initialDeps;
        const devDeps = payload.devDependencies ?? initialDevDeps;
        setStatus((prev) => ({
          ...prev,
          serverReachable: payload.status === 'ok',
          serverChecked: true,
          geminiConfigured: Boolean(payload.geminiConfigured),
          nodeVersion: payload.nodeVersion ?? null,
          webglActive: detectWebGlSupport(),
          dependenciesCount: payload.dependenciesCount ?? Object.keys(deps).length,
          devDependenciesCount: payload.devDependenciesCount ?? Object.keys(devDeps).length,
          totalPackages:
            payload.totalPackages ?? Object.keys(deps).length + Object.keys(devDeps).length,
          versions: buildVersionMap(deps, devDeps),
        }));
      } catch {
        if (!active) return;
        setStatus((prev) => ({
          ...prev,
          serverReachable: false,
          serverChecked: true,
          webglActive: detectWebGlSupport(),
        }));
      }
    };

    void probeServer();
    return () => {
      active = false;
    };
  }, []);

  return status;
}
