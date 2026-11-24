import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { CityDistrictPacket } from '../contracts/render-bridge.schema.ts';
import type { FleetShip } from '../contracts/v4-systems.schema.ts';
import type { MilitaryUnitStack } from '../contracts/combat-units.schema.ts';
import type { DroneAllocation } from '../contracts/world-state.schema.ts';
import { buildDistrictMesh, buildDroneUnit } from './procedural-models.ts';
import { createHolographic135PlinthTexture } from './procedural-textures.ts';
import {
  buildShowcaseAssetById,
  countGroupGeometryStats,
  SHOWCASE_3D_ASSETS_CATALOG,
  type ShowcaseAssetId,
} from './showcase-assets.ts';

/**
 * [L4] EXW.L4.ISOLATED_INSPECTOR | v5.1.0 | SADT A5.2
 * Dedicated Isolated 3D Scene Controller for:
 * - Building 3D Inspector (B3D): free 3D orbit, wear (<55%) & under-power visual overlays
 * - Fleet Hangar 3D (H3D): renders each owned ship, drone role & military unit with composite PBR meshes
 * - Asset Showcase Gallery (ASSET_SHOWCASE): inspects any of the 10 procedural PBR 3D assets
 * Strict compliance: RoomEnvironment PMREM, isSoftwareGl pacing, DPR<=1.5, full recursive dispose().
 */
export interface BuildingSceneInput {
  readonly kind: 'BUILDING';
  readonly district: CityDistrictPacket;
  readonly underPowered: boolean;
  readonly lightTheme: boolean;
}

export interface HangarSceneInput {
  readonly kind: 'HANGAR';
  readonly fleetShips: readonly FleetShip[];
  readonly drones: DroneAllocation;
  readonly militaryRoster: readonly MilitaryUnitStack[];
  readonly lightTheme: boolean;
}

export type StudioLightingPreset = 'OBSIDIAN' | 'SOLAR_ORBIT' | 'EDEN_SKY';

export interface AssetShowcaseSceneInput {
  readonly kind: 'ASSET_SHOWCASE';
  readonly assetId: ShowcaseAssetId;
  readonly lightTheme: boolean;
  readonly wireframe?: boolean;
  readonly lightingPreset?: StudioLightingPreset;
}

export type IsolatedSceneInput = BuildingSceneInput | HangarSceneInput | AssetShowcaseSceneInput;

function buildHangarShipMesh(ship: FleetShip): THREE.Group {
  const mappedId: ShowcaseAssetId =
    ship.shipClass === 'SHUTTLE_CARGO' ? 'FRIGATE_SOLAR' : ship.shipClass;
  const grp = buildShowcaseAssetById(mappedId);
  grp.scale.setScalar(ship.shipClass === 'SHUTTLE_CARGO' ? 0.52 : 0.62);

  const loadout = ship.loadout ?? [];
  const weapons = loadout.filter((m) => m.slot === 'WEAPON');
  const defenses = loadout.filter((m) => m.slot === 'DEFENSE');
  const props = loadout.filter((m) => m.slot === 'PROPULSION');
  const utils = loadout.filter((m) => m.slot === 'UTILITY');

  // Mounted weapon turrets (dorsal & wing hardpoints)
  weapons.forEach((wpn, idx) => {
    const side = idx % 2 === 0 ? 1 : -1;
    const zOff = 0.25 - Math.floor(idx / 2) * 0.45;
    const turret = new THREE.Group();
    const mount = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.14, 0.14, 10),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.28 }),
    );
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.044, 0.56, 8),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.22 }),
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.05, 0.26);
    const muzzleColor = wpn.tier >= 3 ? 0xf43f5e : wpn.tier === 2 ? 0x38bdf8 : 0xf59e0b;
    const muzzle = new THREE.Mesh(
      new THREE.SphereGeometry(0.052, 8, 8),
      new THREE.MeshStandardMaterial({
        color: muzzleColor,
        emissive: muzzleColor,
        emissiveIntensity: 1.25,
        roughness: 0.15,
      }),
    );
    muzzle.position.set(0, 0.05, 0.54);
    turret.add(mount, barrel, muzzle);
    turret.position.set(side * 0.52, 0.34, zOff);
    grp.add(turret);
  });

  // Mounted shield / defense emitter halo
  if (defenses.length > 0) {
    const maxDefTier = Math.max(...defenses.map((d) => d.tier));
    const shieldColor = maxDefTier >= 2 ? 0x00f0ff : 0x10b981;
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(1.18, 0.028, 10, 40),
      new THREE.MeshStandardMaterial({
        color: shieldColor,
        emissive: shieldColor,
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: 0.72,
        roughness: 0.2,
      }),
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 0.22;
    grp.add(halo);
  }

  // Mounted propulsion thruster nacelles
  if (props.length > 0) {
    for (const side of [-1, 1]) {
      const pod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.14, 0.44, 10),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.75, roughness: 0.3 }),
      );
      pod.rotation.x = Math.PI / 2;
      pod.position.set(side * 0.46, 0.12, -0.96);
      const glow = new THREE.Mesh(
        new THREE.ConeGeometry(0.1, 0.26, 10),
        new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x00f0ff,
          emissiveIntensity: 1.35,
          transparent: true,
          opacity: 0.82,
        }),
      );
      glow.rotation.x = -Math.PI / 2;
      glow.position.set(side * 0.46, 0.12, -1.26);
      grp.add(pod, glow);
    }
  }

  // Mounted ventral utility / science pods
  utils.forEach((u, idx) => {
    const podColor = u.id.includes('bio') ? 0x10b981 : u.id.includes('quantum') ? 0xa855f7 : 0xf59e0b;
    const pod = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.16, 0.36),
      new THREE.MeshStandardMaterial({
        color: 0x334155,
        emissive: podColor,
        emissiveIntensity: 0.35,
        metalness: 0.65,
        roughness: 0.35,
      }),
    );
    pod.position.set((idx % 2 === 0 ? -1 : 1) * 0.24, -0.14, -0.18 + idx * 0.25);
    grp.add(pod);
  });

  return grp;
}

function buildMilitaryUnitMesh(unitClass: MilitaryUnitStack['unitClass']): THREE.Group {
  switch (unitClass) {
    case 'ARMOR_MECH': {
      const mech = buildShowcaseAssetById('ARMOR_MECH');
      mech.scale.setScalar(0.55);
      return mech;
    }
    case 'ORBITAL_CORVETTE': {
      const corvette = buildShowcaseAssetById('CORVETTE_ORBITAL');
      corvette.scale.setScalar(0.56);
      return corvette;
    }
    case 'DRONE_SWARM': {
      const aero = buildShowcaseAssetById('AERO_INTERCEPTOR');
      aero.scale.setScalar(0.54);
      return aero;
    }
    case 'INFANTRY_EXO': {
      const exo = buildShowcaseAssetById('ARMOR_MECH');
      exo.scale.setScalar(0.42);
      return exo;
    }
    case 'CYBER_EW': {
      const probe = buildShowcaseAssetById('SCIENCE_PROBE');
      probe.scale.setScalar(0.52);
      return probe;
    }
  }
}

export class IsolatedInspectorScene {
  private container: HTMLElement | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private pmremTarget: THREE.WebGLRenderTarget | null = null;
  private subjectGroup: THREE.Group | null = null;
  private keyLight: THREE.DirectionalLight | null = null;
  private rimLight: THREE.DirectionalLight | null = null;
  private fillLight: THREE.DirectionalLight | null = null;
  private hemiLight: THREE.HemisphereLight | null = null;
  private holoArcGroup: THREE.Group | null = null;

  private isSoftwareGl = false;
  private isDisposed = false;
  private yaw = 0.68;
  private pitch = 0.36;
  private dist = 4.2;
  private targetY = 0.85;
  private wireframeMode = false;
  private autoRotate = false;
  private autoRotateTimer: number | null = null;
  private isDragging = false;
  private lastX = 0;
  private lastY = 0;
  private renderPending = false;
  private onContextLostCb: (() => void) | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private boundPointerMove: ((e: PointerEvent) => void) | null = null;
  private boundPointerUp: (() => void) | null = null;

  public mount(
    container: HTMLElement,
    input: IsolatedSceneInput,
    onContextLost?: () => void,
  ): boolean {
    this.container = container;
    this.isDisposed = false;
    this.onContextLostCb = onContextLost ?? null;
    this.wireframeMode = input.kind === 'ASSET_SHOWCASE' ? Boolean(input.wireframe) : false;

    const width = Math.max(260, container.clientWidth || 480);
    const height = Math.max(220, container.clientHeight || 320);

    try {
      const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      const gl = renderer.getContext();
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      const rStr = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) ?? '') : '';
      this.isSoftwareGl = /SwiftShader|llvmpipe|Software|Warp/i.test(rStr);

      renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      renderer.shadowMap.enabled = false;
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        this.onContextLostCb?.();
      });

      container.innerHTML = '';
      container.appendChild(renderer.domElement);
      this.renderer = renderer;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(input.lightTheme ? '#f5f2eb' : '#090e1c');
      this.scene = scene;

      // Studio PMREM reflections on all devices so metallic & ceramic PBR surfaces read crisply
      const pmrem = new THREE.PMREMGenerator(renderer);
      this.pmremTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
      scene.environment = this.pmremTarget.texture;
      scene.environmentIntensity = input.lightTheme ? 0.85 : 0.65;
      pmrem.dispose();

      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 80);
      this.camera = camera;

      const hemi = new THREE.HemisphereLight(0xf1f5f9, 0x1e293b, input.lightTheme ? 0.95 : 0.65);
      this.hemiLight = hemi;
      scene.add(hemi);
      const key = new THREE.DirectionalLight(0xfff3dc, 1.45);
      key.position.set(7, 11, 8);
      this.keyLight = key;
      scene.add(key);
      const cyanRim = new THREE.DirectionalLight(0x00f0ff, 0.65);
      cyanRim.position.set(-7, 5, -6);
      this.rimLight = cyanRim;
      scene.add(cyanRim);
      const warmFill = new THREE.DirectionalLight(0xffb800, 0.35);
      warmFill.position.set(5, 2.5, -7);
      this.fillLight = warmFill;
      scene.add(warmFill);

      if (input.kind === 'ASSET_SHOWCASE' && input.lightingPreset) {
        this.applyLightingPreset(input.lightingPreset, input.lightTheme);
      }

      // Graduated 135-degree Holographic Turntable Pedestal + Telemetry Arcs
      const padRadius = input.kind === 'HANGAR' ? 4.4 : 2.15;
      const padMat = new THREE.MeshStandardMaterial({
        color: input.lightTheme ? 0xcbd5e1 : 0x0f172a,
        roughness: 0.36,
        metalness: 0.62,
      });
      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(padRadius, padRadius * 1.06, 0.16, 48),
        padMat,
      );
      pad.position.y = -0.09;
      scene.add(pad);

      const plinthDialTex = createHolographic135PlinthTexture(input.lightTheme);
      const dialMat = new THREE.MeshStandardMaterial({
        map: plinthDialTex,
        emissiveMap: plinthDialTex,
        emissive: new THREE.Color(input.lightTheme ? '#0284c7' : '#00f0ff'),
        emissiveIntensity: input.lightTheme ? 0.16 : 0.38,
        roughness: 0.42,
        metalness: 0.28,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
      const dialDisc = new THREE.Mesh(new THREE.CircleGeometry(padRadius * 0.985, 48), dialMat);
      dialDisc.rotation.x = -Math.PI / 2;
      dialDisc.position.y = -0.008;
      scene.add(dialDisc);

      const holoArcGroup = new THREE.Group();
      const arcSweep135 = (135 * Math.PI) / 180;
      const cyanArc = new THREE.Mesh(
        new THREE.TorusGeometry(padRadius * 0.99, 0.026, 8, 48, arcSweep135),
        new THREE.MeshStandardMaterial({
          color: 0x00f0ff,
          emissive: 0x00f0ff,
          emissiveIntensity: input.lightTheme ? 0.45 : 0.9,
          roughness: 0.2,
          metalness: 0.55,
        }),
      );
      cyanArc.rotation.x = Math.PI / 2;
      cyanArc.position.y = 0.006;
      holoArcGroup.add(cyanArc);

      const emeraldArc = new THREE.Mesh(
        new THREE.TorusGeometry(padRadius * 1.035, 0.018, 8, 48, arcSweep135),
        new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x10b981,
          emissiveIntensity: input.lightTheme ? 0.4 : 0.85,
          roughness: 0.22,
          metalness: 0.5,
        }),
      );
      emeraldArc.rotation.x = Math.PI / 2;
      emeraldArc.rotation.z = Math.PI;
      emeraldArc.position.y = 0.004;
      holoArcGroup.add(emeraldArc);
      scene.add(holoArcGroup);
      this.holoArcGroup = holoArcGroup;

      const grid = new THREE.GridHelper(
        padRadius * 1.85,
        12,
        input.lightTheme ? 0x0284c7 : 0x00f0ff,
        input.lightTheme ? 0xcbd5e1 : 0x1e293b,
      );
      grid.position.y = -0.012;
      scene.add(grid);

      this.subjectGroup = new THREE.Group();
      scene.add(this.subjectGroup);
      this.populateSubject(input);

      this.attachControls(renderer.domElement);
      this.resizeObserver = new ResizeObserver(() => {
        if (!this.container || !this.renderer || !this.camera || this.isDisposed) return;
        const w = Math.max(240, this.container.clientWidth);
        const h = Math.max(200, this.container.clientHeight);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        this.requestRender();
      });
      this.resizeObserver.observe(container);
      this.requestRender();
      return true;
    } catch {
      this.onContextLostCb?.();
      return false;
    }
  }

  public getSubjectStats(): { readonly meshCount: number; readonly triangleCount: number } {
    if (!this.subjectGroup) return { meshCount: 0, triangleCount: 0 };
    return countGroupGeometryStats(this.subjectGroup);
  }

  public setWireframe(enabled: boolean): void {
    this.wireframeMode = enabled;
    if (!this.subjectGroup) return;
    this.subjectGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
          if ('wireframe' in m) {
            (m as THREE.MeshStandardMaterial).wireframe = enabled;
          }
        }
      }
    });
    this.requestRender();
  }

  public resetView(): void {
    this.yaw = 0.68;
    this.pitch = 0.36;
    this.requestRender();
  }

  public applyLightingPreset(preset: StudioLightingPreset, lightTheme = false): void {
    if (!this.scene || !this.keyLight || !this.rimLight || !this.fillLight || !this.hemiLight) return;
    if (preset === 'SOLAR_ORBIT') {
      this.scene.background = new THREE.Color(lightTheme ? '#fff7eb' : '#130b14');
      this.keyLight.color.setHex(0xffe0a3);
      this.keyLight.intensity = 1.65;
      this.rimLight.color.setHex(0xf43f5e);
      this.rimLight.intensity = 0.72;
      this.fillLight.color.setHex(0x38bdf8);
      this.fillLight.intensity = 0.4;
      this.hemiLight.intensity = lightTheme ? 0.95 : 0.58;
    } else if (preset === 'EDEN_SKY') {
      this.scene.background = new THREE.Color(lightTheme ? '#eef9f4' : '#081a1c');
      this.keyLight.color.setHex(0xf5fff8);
      this.keyLight.intensity = 1.5;
      this.rimLight.color.setHex(0x10b981);
      this.rimLight.intensity = 0.78;
      this.fillLight.color.setHex(0x38bdf8);
      this.fillLight.intensity = 0.45;
      this.hemiLight.intensity = lightTheme ? 1.05 : 0.72;
    } else {
      this.scene.background = new THREE.Color(lightTheme ? '#f5f2eb' : '#090e1c');
      this.keyLight.color.setHex(0xfff3dc);
      this.keyLight.intensity = 1.45;
      this.rimLight.color.setHex(0x00f0ff);
      this.rimLight.intensity = 0.65;
      this.fillLight.color.setHex(0xffb800);
      this.fillLight.intensity = 0.35;
      this.hemiLight.intensity = lightTheme ? 0.95 : 0.65;
    }
    this.requestRender();
  }

  public setAutoRotate(enabled: boolean): void {
    this.autoRotate = enabled;
    if (this.autoRotateTimer !== null) {
      window.clearInterval(this.autoRotateTimer);
      this.autoRotateTimer = null;
    }
    if (!enabled || this.isDisposed) return;
    const intervalMs = this.isSoftwareGl ? 180 : 32;
    const step = this.isSoftwareGl ? 0.08 : 0.014;
    this.autoRotateTimer = window.setInterval(() => {
      if (this.isDisposed || !this.autoRotate || this.isDragging) return;
      this.yaw += step;
      if (this.holoArcGroup) {
        this.holoArcGroup.rotation.y -= step * 0.45;
      }
      this.requestRender();
    }, intervalMs);
  }

  private populateSubject(input: IsolatedSceneInput): void {
    if (!this.subjectGroup) return;

    if (input.kind === 'ASSET_SHOWCASE') {
      const spec =
        SHOWCASE_3D_ASSETS_CATALOG.find((item) => item.id === input.assetId) ??
        SHOWCASE_3D_ASSETS_CATALOG[0]!;
      const mesh = buildShowcaseAssetById(spec.id);
      this.subjectGroup.add(mesh);
      this.dist = spec.recommendedDistance;
      this.targetY = spec.targetY;
      if (this.wireframeMode) {
        this.setWireframe(true);
      }
      return;
    }

    if (input.kind === 'BUILDING') {
      const mesh = buildDistrictMesh(input.district);
      mesh.scale.setScalar(1.12);

      const isWorn = input.district.integrity < 55;
      if (isWorn || input.underPowered) {
        const tintHex = input.underPowered ? 0xf59e0b : 0xf43f5e;
        mesh.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            child.material.emissive.setHex(tintHex);
            child.material.emissiveIntensity = input.underPowered ? 0.42 : 0.55;
          }
        });
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(1.55, 0.045, 8, 32),
          new THREE.MeshStandardMaterial({ color: tintHex, emissive: tintHex, emissiveIntensity: 0.9 }),
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.06;
        this.subjectGroup.add(ring);
      }

      this.subjectGroup.add(mesh);
      this.dist = 5.4;
      this.targetY = 0.72;
      return;
    }

    // HANGAR 3D: Render every owned ship (with mounted weapons/modules), drone squad & military unit
    const items: THREE.Object3D[] = [];
    for (const ship of input.fleetShips) {
      items.push(buildHangarShipMesh(ship));
    }
    const droneRoles: readonly [string, number][] = [
      ['construction', input.drones.construction],
      ['defense', input.drones.defense],
      ['attack', input.drones.attack],
      ['recon', input.drones.recon],
    ];
    for (const [, count] of droneRoles) {
      if (count > 0) {
        const d = buildDroneUnit();
        d.position.y = 0.65;
        items.push(d);
      }
    }
    for (const unit of input.militaryRoster) {
      if (unit.count > 0) items.push(buildMilitaryUnitMesh(unit.unitClass));
    }

    const total = Math.max(1, items.length);
    const cols = Math.min(4, total);
    items.forEach((obj, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const x = (col - (cols - 1) / 2) * 1.95;
      const z = (row - Math.floor((total - 1) / cols) / 2) * 1.85;
      obj.position.x = x;
      obj.position.z = z;
      this.subjectGroup?.add(obj);
    });
    this.dist = 7.8;
    this.targetY = 0.7;
  }

  private attachControls(dom: HTMLCanvasElement): void {
    dom.addEventListener('pointerdown', (e) => {
      this.isDragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    });
    this.boundPointerMove = (e: PointerEvent) => {
      if (!this.isDragging || this.isDisposed) return;
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.yaw -= dx * 0.01;
      this.pitch = Math.max(0.14, Math.min(1.25, this.pitch + dy * 0.008));
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.requestRender();
    };
    this.boundPointerUp = () => {
      this.isDragging = false;
    };
    window.addEventListener('pointermove', this.boundPointerMove);
    window.addEventListener('pointerup', this.boundPointerUp);
    dom.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.dist = Math.max(2.2, Math.min(12.5, this.dist + e.deltaY * 0.005));
        this.requestRender();
      },
      { passive: false },
    );
  }

  public rotateStep(deltaYaw: number): void {
    this.yaw += deltaYaw;
    this.requestRender();
  }

  public requestRender(): void {
    if (this.isDisposed || this.renderPending) return;
    this.renderPending = true;
    const draw = () => {
      this.renderPending = false;
      if (this.isDisposed || !this.renderer || !this.scene || !this.camera) return;
      const cx = Math.sin(this.yaw) * Math.cos(this.pitch) * this.dist;
      const cy = Math.sin(this.pitch) * this.dist + this.targetY;
      const cz = Math.cos(this.yaw) * Math.cos(this.pitch) * this.dist;
      this.camera.position.set(cx, cy, cz);
      this.camera.lookAt(0, this.targetY, 0);
      this.renderer.render(this.scene, this.camera);
    };
    if (this.isSoftwareGl) {
      setTimeout(() => {
        if (!this.isDisposed) requestAnimationFrame(draw);
      }, 40);
    } else {
      requestAnimationFrame(draw);
    }
  }

  private disposeMaterial(mat: THREE.Material): void {
    if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
      mat.map?.dispose();
      mat.normalMap?.dispose();
      mat.bumpMap?.dispose();
      mat.roughnessMap?.dispose();
      mat.metalnessMap?.dispose();
      mat.aoMap?.dispose();
      mat.emissiveMap?.dispose();
      mat.alphaMap?.dispose();
    } else if (mat instanceof THREE.MeshBasicMaterial || mat instanceof THREE.PointsMaterial) {
      mat.map?.dispose();
      mat.alphaMap?.dispose();
    }
    mat.dispose();
  }

  public dispose(): void {
    this.isDisposed = true;
    this.autoRotate = false;
    if (this.autoRotateTimer !== null) {
      window.clearInterval(this.autoRotateTimer);
      this.autoRotateTimer = null;
    }
    if (this.boundPointerMove) {
      window.removeEventListener('pointermove', this.boundPointerMove);
      this.boundPointerMove = null;
    }
    if (this.boundPointerUp) {
      window.removeEventListener('pointerup', this.boundPointerUp);
      this.boundPointerUp = null;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.scene) {
      this.scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of mats) this.disposeMaterial(m);
        }
      });
    }
    this.pmremTarget?.dispose();
    this.renderer?.dispose();
    if (this.container) this.container.innerHTML = '';
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.subjectGroup = null;
    this.holoArcGroup = null;
  }
}
