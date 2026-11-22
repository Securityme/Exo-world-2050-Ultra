import * as THREE from 'three';
import type { ViewportOverlayMode } from '../contracts/render-bridge.schema.ts';

/**
 * [L4] FUP-007 | SM-05 | SADT A5.3
 * Astrometric Geodesic Reticle Beacons (72 Fibonacci globe sectors):
 * Replaces bulky extruded hexagons with sleek tangent surface survey rings,
 * faceted crystalline beacon cores, and invisible generous circular hit proxies.
 */
export interface PlanetSectorMarker {
  readonly root: THREE.Group;
  readonly ringMesh: THREE.Mesh;
  readonly coreMesh: THREE.Mesh;
  readonly bracketMesh: THREE.Mesh;
  readonly ringMat: THREE.MeshBasicMaterial;
  readonly coreMat: THREE.MeshStandardMaterial;
  readonly bracketMat: THREE.MeshBasicMaterial;
  readonly tileIndex: number;
}

export interface SectorMarkerStateInput {
  readonly selectedTileIndex: number | null;
  readonly capturedSet: ReadonlySet<number>;
  readonly rivalSet: ReadonlySet<number>;
  readonly overlayMode: ViewportOverlayMode;
  readonly accentHex?: number;
}

export function buildPlanetSectorMarkers(
  parentGroup: THREE.Group,
  radius: number,
): {
  readonly tileMarkers: PlanetSectorMarker[];
  readonly tileDirections: THREE.Vector3[];
} {
  const tileMarkers: PlanetSectorMarker[] = [];
  const tileDirections: THREE.Vector3[] = [];

  // Shared geometries across all 72 beacons for minimal draw overhead
  const hitGeo = new THREE.CircleGeometry(0.145, 16);
  hitGeo.rotateX(-Math.PI / 2);

  const ringGeo = new THREE.RingGeometry(0.068, 0.088, 24);
  ringGeo.rotateX(-Math.PI / 2);

  const bracketGeo = new THREE.RingGeometry(0.104, 0.122, 24, 1, 0, Math.PI * 1.45);
  bracketGeo.rotateX(-Math.PI / 2);

  const coreGeo = new THREE.OctahedronGeometry(0.028, 0);
  coreGeo.scale(1, 0.58, 1);

  const hitMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });

  const up = new THREE.Vector3(0, 1, 0);

  for (let i = 0; i < 72; i++) {
    const y = 1 - (i / 71) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = Math.PI * (3 - Math.sqrt(5)) * i;
    const dir = new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).normalize();
    tileDirections.push(dir);

    const root = new THREE.Group();
    root.position.copy(dir).multiplyScalar(radius + 0.01);
    root.quaternion.setFromUnitVectors(up, dir);
    root.userData = { interactable: 'TILE', tileIndex: i };

    // Invisible circular hit proxy for reliable touch/mouse picking
    const hitProxy = new THREE.Mesh(hitGeo, hitMat);
    hitProxy.position.y = 0.004;
    root.add(hitProxy);

    // Flush astrometric telemetry ring
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.34,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 0.005;
    root.add(ringMesh);

    // Outer open targeting arc shown cleanly for active selection / key territory
    const bracketMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const bracketMesh = new THREE.Mesh(bracketGeo, bracketMat);
    bracketMesh.position.y = 0.008;
    bracketMesh.visible = false;
    root.add(bracketMesh);

    // Crystalline geodesic survey core
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      emissive: 0x334155,
      emissiveIntensity: 0.32,
      roughness: 0.2,
      metalness: 0.72,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.y = 0.016;
    root.add(coreMesh);

    parentGroup.add(root);
    tileMarkers.push({
      root,
      ringMesh,
      coreMesh,
      bracketMesh,
      ringMat,
      coreMat,
      bracketMat,
      tileIndex: i,
    });
  }

  return { tileMarkers, tileDirections };
}

export function applySectorMarkerStates(
  markers: readonly PlanetSectorMarker[],
  input: SectorMarkerStateInput,
): void {
  const { selectedTileIndex, capturedSet, rivalSet, overlayMode, accentHex = 0xfb7185 } = input;

  for (const m of markers) {
    const idx = m.tileIndex;
    const isSelected = selectedTileIndex === idx;
    const isPlayer = capturedSet.has(idx);
    const isRival = rivalSet.has(idx);

    if (isSelected) {
      const hex = overlayMode === 'MAINTENANCE' ? 0xf43f5e : accentHex;
      m.ringMat.color.setHex(hex);
      m.ringMat.opacity = 0.96;
      m.coreMat.color.setHex(0xffffff);
      m.coreMat.emissive.setHex(hex);
      m.coreMat.emissiveIntensity = 1.65;
      m.coreMesh.scale.setScalar(1.42);
      m.bracketMat.color.setHex(hex);
      m.bracketMat.opacity = 0.92;
      m.bracketMesh.visible = true;
      continue;
    }

    m.bracketMesh.visible = false;
    m.bracketMat.opacity = 0;

    if (overlayMode === 'MAINTENANCE') {
      if (isRival) {
        m.ringMat.color.setHex(0xef4444);
        m.ringMat.opacity = 0.85;
        m.coreMat.color.setHex(0xfca5a5);
        m.coreMat.emissive.setHex(0xdc2626);
        m.coreMat.emissiveIntensity = 1.1;
        m.coreMesh.scale.setScalar(1.15);
      } else if (isPlayer) {
        m.ringMat.color.setHex(accentHex);
        m.ringMat.opacity = 0.82;
        m.coreMat.color.setHex(0xfff1f5);
        m.coreMat.emissive.setHex(accentHex);
        m.coreMat.emissiveIntensity = 0.95;
        m.coreMesh.scale.setScalar(1.12);
      } else {
        m.ringMat.color.setHex(0xf59e0b);
        m.ringMat.opacity = 0.48;
        m.coreMat.color.setHex(0xfcd34d);
        m.coreMat.emissive.setHex(0xd97706);
        m.coreMat.emissiveIntensity = 0.45;
        m.coreMesh.scale.setScalar(0.85);
      }
    } else if (overlayMode === 'LOGISTICS') {
      if (isPlayer) {
        m.ringMat.color.setHex(0x2dd4bf);
        m.ringMat.opacity = 0.88;
        m.coreMat.color.setHex(0xccfbf1);
        m.coreMat.emissive.setHex(0x14b8a6);
        m.coreMat.emissiveIntensity = 1.2;
        m.coreMesh.scale.setScalar(1.18);
      } else if (isRival) {
        m.ringMat.color.setHex(0xfb7185);
        m.ringMat.opacity = 0.52;
        m.coreMat.color.setHex(0xfda4af);
        m.coreMat.emissive.setHex(0x9f1239);
        m.coreMat.emissiveIntensity = 0.42;
        m.coreMesh.scale.setScalar(0.95);
      } else {
        m.ringMat.color.setHex(0x64748b);
        m.ringMat.opacity = 0.24;
        m.coreMat.color.setHex(0x64748b);
        m.coreMat.emissive.setHex(0x0f172a);
        m.coreMat.emissiveIntensity = 0.16;
        m.coreMesh.scale.setScalar(0.76);
      }
    } else if (isPlayer) {
      m.ringMat.color.setHex(0x34d399);
      m.ringMat.opacity = 0.85;
      m.coreMat.color.setHex(0xd1fae5);
      m.coreMat.emissive.setHex(0x10b981);
      m.coreMat.emissiveIntensity = 0.9;
      m.coreMesh.scale.setScalar(1.18);
    } else if (isRival) {
      m.ringMat.color.setHex(0xf43f5e);
      m.ringMat.opacity = 0.78;
      m.coreMat.color.setHex(0xfecdd3);
      m.coreMat.emissive.setHex(0xe11d48);
      m.coreMat.emissiveIntensity = 0.78;
      m.coreMesh.scale.setScalar(1.1);
    } else {
      m.ringMat.color.setHex(0x94a3b8);
      m.ringMat.opacity = 0.34;
      m.coreMat.color.setHex(0xcbd5e1);
      m.coreMat.emissive.setHex(0x1e293b);
      m.coreMat.emissiveIntensity = 0.24;
      m.coreMesh.scale.setScalar(0.8);
    }
  }
}

export function animateSectorMarkers(
  markers: readonly PlanetSectorMarker[],
  selectedTileIndex: number | null,
  elapsedSec: number,
): void {
  for (const m of markers) {
    if (m.tileIndex === selectedTileIndex) {
      m.bracketMesh.rotation.y = elapsedSec * 1.35;
      m.coreMesh.rotation.y = elapsedSec * 1.9;
      m.coreMesh.position.y = 0.02 + Math.sin(elapsedSec * 4.0) * 0.005;
    } else if (m.coreMesh.position.y !== 0.016) {
      m.coreMesh.position.y = 0.016;
    }
  }
}
