import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { CityDistrictPacket } from '../contracts/render-bridge.schema.ts';
import type { FleetShip } from '../contracts/v4-systems.schema.ts';
import type { MilitaryUnitStack } from '../contracts/combat-units.schema.ts';
import type { DroneAllocation } from '../contracts/world-state.schema.ts';
import { buildDistrictMesh, buildDroneUnit } from './procedural-models.ts';

/**
 * [L4] EXW.L4.ISOLATED_INSPECTOR | v4.0.0-rc.1 | SADT A5.2
 * Dedicated Isolated 3D Scene Controller for:
 * - Building 3D Inspector (B3D): free 3D orbit, wear (<55%) & under-power visual overlays
 * - Fleet Hangar 3D (H3D): renders each owned ship, drone role & military unit on illuminated bay pads
 * Strict compliance: isSoftwareGl detection, DPR<=1.5, coalesced requestRender(), full recursive dispose().
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

export type IsolatedSceneInput = BuildingSceneInput | HangarSceneInput;

function buildHangarShipMesh(shipClass: FleetShip['shipClass']): THREE.Group {
  const grp = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({
    color: shipClass === 'COLONY_ARK' ? 0xfef3c7 : 0xfff5f8,
    roughness: 0.25,
    metalness: 0.65,
  });
  const accentHex =
    shipClass === 'CORVETTE_ORBITAL'
      ? 0xe11d48
      : shipClass === 'FRIGATE_SOLAR'
        ? 0xf59e0b
        : shipClass === 'SCIENCE_PROBE'
          ? 0x0ea5e9
          : 0x10b981;
  const accentMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    emissive: accentHex,
    emissiveIntensity: 0.55,
    roughness: 0.22,
    metalness: 0.5,
  });

  const length = shipClass === 'COLONY_ARK' ? 1.55 : shipClass === 'FRIGATE_SOLAR' ? 1.3 : 0.95;
  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, length, 8), hullMat);
  fuselage.rotation.z = Math.PI / 2;
  fuselage.position.y = 0.42;
  grp.add(fuselage);

  const wing = new THREE.Mesh(new THREE.BoxGeometry(length * 0.45, 0.05, 0.85), accentMat);
  wing.position.set(-0.08, 0.42, 0);
  grp.add(wing);

  const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.14, 8), accentMat);
  thruster.rotation.z = Math.PI / 2;
  thruster.position.set(-length * 0.52, 0.42, 0);
  grp.add(thruster);

  return grp;
}

function buildMilitaryUnitMesh(unitClass: MilitaryUnitStack['unitClass']): THREE.Group {
  const grp = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.7 });
  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.7,
    roughness: 0.2,
  });
  const scale = unitClass === 'ARMOR_MECH' ? 1.25 : unitClass === 'ORBITAL_CORVETTE' ? 1.1 : 0.85;
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.45 * scale, 0.36 * scale, 0.45 * scale), bodyMat);
  base.position.y = 0.24 * scale;
  grp.add(base);
  const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * scale, 0.18 * scale, 0.22 * scale, 6), visorMat);
  turret.position.y = 0.5 * scale;
  grp.add(turret);
  return grp;
}

export class IsolatedInspectorScene {
  private container: HTMLElement | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private pmremTarget: THREE.WebGLRenderTarget | null = null;
  private subjectGroup: THREE.Group | null = null;

  private isSoftwareGl = false;
  private isDisposed = false;
  private yaw = 0.65;
  private pitch = 0.42;
  private dist = 4.2;
  private isDragging = false;
  private lastX = 0;
  private lastY = 0;
  private renderPending = false;
  private onContextLostCb: (() => void) | null = null;
  private resizeObserver: ResizeObserver | null = null;

  public mount(
    container: HTMLElement,
    input: IsolatedSceneInput,
    onContextLost?: () => void,
  ): boolean {
    this.container = container;
    this.isDisposed = false;
    this.onContextLostCb = onContextLost ?? null;

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
      renderer.toneMappingExposure = 1.12;
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
      scene.background = new THREE.Color(input.lightTheme ? '#fff4f7' : '#120819');
      this.scene = scene;

      if (!this.isSoftwareGl) {
        const pmrem = new THREE.PMREMGenerator(renderer);
        this.pmremTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
        scene.environment = this.pmremTarget.texture;
        pmrem.dispose();
      }

      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 80);
      this.camera = camera;

      scene.add(new THREE.HemisphereLight(0xfff5f8, 0x334155, input.lightTheme ? 1.35 : 1.05));
      const key = new THREE.DirectionalLight(0xfff4e0, 2.1);
      key.position.set(7, 11, 8);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xf43f5e, 0.85);
      rim.position.set(-7, 5, -7);
      scene.add(rim);

      // Pedestal disc
      const padMat = new THREE.MeshStandardMaterial({
        color: input.lightTheme ? 0xfce7f3 : 0x261233,
        roughness: 0.45,
        metalness: 0.35,
      });
      const padRadius = input.kind === 'HANGAR' ? 4.4 : 2.1;
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(padRadius, padRadius * 1.06, 0.16, 36), padMat);
      pad.position.y = -0.09;
      scene.add(pad);

      const grid = new THREE.GridHelper(padRadius * 1.9, 12, 0xe11d48, 0x94a3b8);
      grid.position.y = 0.005;
      scene.add(grid);

      this.subjectGroup = new THREE.Group();
      scene.add(this.subjectGroup);
      this.populateSubject(input);

      this.dist = input.kind === 'HANGAR' ? 7.8 : 5.6;
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

  private populateSubject(input: IsolatedSceneInput): void {
    if (!this.subjectGroup) return;

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
        // Diagnostic warning halo ring around building base
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(1.55, 0.045, 8, 32),
          new THREE.MeshStandardMaterial({ color: tintHex, emissive: tintHex, emissiveIntensity: 0.9 }),
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.06;
        this.subjectGroup.add(ring);
      }

      this.subjectGroup.add(mesh);
      return;
    }

    // HANGAR 3D: Render every owned ship, drone squad & military unit
    const items: THREE.Object3D[] = [];
    for (const ship of input.fleetShips) {
      items.push(buildHangarShipMesh(ship.shipClass));
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
  }

  private attachControls(dom: HTMLCanvasElement): void {
    dom.addEventListener('pointerdown', (e) => {
      this.isDragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    });
    window.addEventListener('pointermove', (e) => {
      if (!this.isDragging || this.isDisposed) return;
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.yaw -= dx * 0.01;
      this.pitch = Math.max(0.14, Math.min(1.25, this.pitch + dy * 0.008));
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.requestRender();
    });
    window.addEventListener('pointerup', () => {
      this.isDragging = false;
    });
    dom.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.dist = Math.max(2.4, Math.min(12.5, this.dist + e.deltaY * 0.005));
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
      const targetY = 0.65;
      const cx = Math.sin(this.yaw) * Math.cos(this.pitch) * this.dist;
      const cy = Math.sin(this.pitch) * this.dist + targetY;
      const cz = Math.cos(this.yaw) * Math.cos(this.pitch) * this.dist;
      this.camera.position.set(cx, cy, cz);
      this.camera.lookAt(0, targetY, 0);
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

  public dispose(): void {
    this.isDisposed = true;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.scene) {
      this.scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of mats) m.dispose();
        }
      });
    }
    this.pmremTarget?.dispose();
    this.renderer?.dispose();
    if (this.container) this.container.innerHTML = '';
    this.renderer = null;
    this.scene = null;
    this.camera = null;
  }
}
