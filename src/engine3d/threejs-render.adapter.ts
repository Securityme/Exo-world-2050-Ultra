import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type {
  RenderAdapterConfig,
  RenderAdapterInterface,
} from '../adapters/render-adapter.interface.ts';
import type {
  AtmosphereTier,
  CameraScale,
  RenderToGameEvent,
  SceneDiffPacket,
  ViewportOverlayMode,
} from '../contracts/render-bridge.schema.ts';
import { animateSectorMarkers, applySectorMarkerStates } from './planet-markers.ts';
import { animatePlanetWeatherFx, updatePlanetWeatherFx } from './planet-weather-fx.ts';
import { buildDistrictMesh, buildDroneUnit } from './procedural-models.ts';
import {
  createAtmosphereHaloMaterial,
  createAtmosphereLimbMaterial,
  createCityGroundTexture,
  createCityHorizonTexture,
  createOpenSkyDomeMaterial,
  createPlanetCloudTexture,
  createPlanetSurfaceTextures,
  type PlanetTextureOptions,
} from './procedural-textures.ts';
import {
  buildCityScaleGroup,
  buildPlanetScaleGroup,
  buildSpaceScaleGroup,
  createStarfield,
  rebuildDossierPins,
  type CityScaleNodes,
  type PlanetScaleNodes,
  type SpaceScaleNodes,
} from './scene-builders.ts';

/**
 * [L4] FUP-007 | SM-05 | SADT A5.3
 * Three.js r170+ RenderAdapterInterface implementation.
 * - Consumes ONLY SceneDiffPacket (R-15)
 * - Preserves Scale 1 (Vue Espace) untouched
 * - High-fidelity PBR Scale 2 (Vue Planète) & Open-Sky Solarpunk Scale 3 (Vue Cité)
 * - Software-WebGL detection + 90ms pacing for headless Chromium stability
 * - WebKit Memory Shield (DPR <= 1.5, full recursive dispose()) (R-17)
 */
const SCALE_CAMERA_PRESETS: Record<CameraScale, { dist: number; pitch: number; targetY: number }> = {
  1: { dist: 27, pitch: 0.58, targetY: 0 },
  2: { dist: 8.4, pitch: 0.26, targetY: 0 },
  3: { dist: 11.4, pitch: 0.46, targetY: 0.78 },
};

export class ThreeJsRenderAdapter implements RenderAdapterInterface {
  private container: HTMLElement | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private pmremTarget: THREE.WebGLRenderTarget | null = null;
  private starfield: THREE.Points | null = null;
  private hemiLight: THREE.HemisphereLight | null = null;
  private keyLight: THREE.DirectionalLight | null = null;
  private rimLight: THREE.DirectionalLight | null = null;

  private spaceNodes: SpaceScaleNodes | null = null;
  private planetNodes: PlanetScaleNodes | null = null;
  private cityNodes: CityScaleNodes | null = null;

  private onGameEvent: ((event: RenderToGameEvent) => void) | null = null;
  private currentScale: CameraScale = 2;
  private currentTier: AtmosphereTier = 'P1';
  private currentAtmoProgress = 0;
  private planetVisualKey = 'P1::PRINTEMPS::1::CLEAR::0';
  private currentLightTheme = true;
  private currentOverlayMode: ViewportOverlayMode = 'STANDARD';
  private currentThemeAccentNum = 0xfb7185;
  private lastSelectedTileIndex: number | null = null;
  private districtSignature = '';
  private droneCountRendered = -1;

  private yaw = 0.55;
  private pitch = 0.26;
  private dist = 8.4;
  private targetDist = 8.4;
  private targetPitch = 0.26;
  private targetY = 0;
  private currentTargetY = 0;
  private cameraShake = 0;

  private isPointerDown = false;
  private dragMoved = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private lastHoverCheckMs = 0;
  private hoverHalo: THREE.Mesh | null = null;
  private readonly heldKeys = new Set<string>();
  private cleanupListeners: (() => void)[] = [];

  private rafId = 0;
  private timerId = 0;
  private isSoftwareGl = false;
  private isDisposed = false;
  private lastFrameTimeMs = 0;
  private elapsedSec = 0;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointerNdc = new THREE.Vector2();
  private readonly scratchVec3 = new THREE.Vector3();
  private readonly scratchQuat = new THREE.Quaternion();
  private readonly upVec = new THREE.Vector3(0, 1, 0);

  public mount(container: HTMLElement, config?: RenderAdapterConfig): void {
    this.container = container;
    this.isDisposed = false;

    const width = Math.max(320, container.clientWidth || window.innerWidth);
    const height = Math.max(240, container.clientHeight || window.innerHeight);

    const renderer = new THREE.WebGLRenderer({
      antialias: !config?.lowPowerMode,
      powerPreference: 'high-performance',
      alpha: false,
    });
    const glCtx = renderer.getContext();
    let rendererStr = '';
    const dbg = glCtx.getExtension('WEBGL_debug_renderer_info');
    if (dbg) {
      rendererStr = String(glCtx.getParameter(dbg.UNMASKED_RENDERER_WEBGL) ?? '');
    }
    this.isSoftwareGl = /SwiftShader|llvmpipe|Software|ANGLE.*Direct3D.*Warp/i.test(rendererStr);

    const maxDpr = config?.maxDpr ?? 1.5;
    renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, maxDpr));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = !this.isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    container.dataset.cameraScale = String(this.currentScale);
    container.dataset.cameraDist = this.targetDist.toFixed(2);
    this.renderer = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#070d1a');
    scene.fog = new THREE.FogExp2('#070d1a', 0.011);
    this.scene = scene;

    // Universal studio RoomEnvironment IBL reflections across hardware & software WebGL
    const pmrem = new THREE.PMREMGenerator(renderer);
    this.pmremTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = this.pmremTarget.texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 180);
    this.camera = camera;

    // 3-point atmospheric lighting: warm directional key (2048px PCFSoftShadowMap) + sky/ground hemisphere + rim
    const hemi = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 0.95);
    scene.add(hemi);
    this.hemiLight = hemi;

    const keyLight = new THREE.DirectionalLight(0xfff4e0, 2.15);
    keyLight.position.set(14, 16, 12);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 48;
    keyLight.shadow.camera.left = -14;
    keyLight.shadow.camera.right = 14;
    keyLight.shadow.camera.top = 14;
    keyLight.shadow.camera.bottom = -14;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.02;
    keyLight.shadow.radius = 2.5;
    scene.add(keyLight);
    this.keyLight = keyLight;

    const rimLight = new THREE.DirectionalLight(this.currentThemeAccentNum, 0.78);
    rimLight.position.set(-14, 6, -12);
    scene.add(rimLight);
    this.rimLight = rimLight;

    const stars = createStarfield();
    scene.add(stars);
    this.starfield = stars;

    // Subtle 3D Hover Selection Ring for raycast hover feedback
    const hoverHalo = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.06, 8, 32),
      new THREE.MeshBasicMaterial({
        color: this.currentThemeAccentNum,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      }),
    );
    hoverHalo.visible = false;
    scene.add(hoverHalo);
    this.hoverHalo = hoverHalo;

    this.spaceNodes = buildSpaceScaleGroup();
    this.planetNodes = buildPlanetScaleGroup('P1');
    this.cityNodes = buildCityScaleGroup('P1');

    scene.add(this.spaceNodes.group, this.planetNodes.group, this.cityNodes.group);
    this.syncScaleVisibility(2);

    if (!this.isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    this.attachPointerListeners(renderer.domElement);
    this.attachKeyboardListeners();
    this.startRenderLoop();
  }

  public setOnGameEvent(listener: (event: RenderToGameEvent) => void): void {
    this.onGameEvent = listener;
  }

  public resize(width: number, height: number): void {
    if (!this.renderer || !this.camera || width <= 0 || height <= 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public applySceneDiff(packet: SceneDiffPacket): void {
    if (!this.scene || !this.planetNodes || !this.spaceNodes || !this.cityNodes) return;

    const isLight = packet.themeMode === 'LIGHT_ANNO';
    const themeOrScaleChanged =
      isLight !== this.currentLightTheme || packet.activeScale !== this.currentScale;
    this.currentLightTheme = isLight;

    const bgHex =
      isLight
        ? packet.activeScale === 3
          ? '#fdebf1'
          : '#1b1024'
        : packet.activeScale === 3
          ? '#241129'
          : '#070d1a';
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.set(bgHex);
    } else {
      this.scene.background = new THREE.Color(bgHex);
    }
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.set(bgHex);
      this.scene.fog.density = packet.activeScale === 3 ? 0.024 : 0.011;
    }

    if (packet.activeScale !== this.currentScale) {
      this.currentScale = packet.activeScale;
      const preset = SCALE_CAMERA_PRESETS[packet.activeScale];
      this.targetDist = preset.dist;
      this.targetPitch = preset.pitch;
      this.targetY = preset.targetY;
      this.cameraShake = 0.06;
      if (this.hoverHalo) this.hoverHalo.visible = false;
      this.syncCameraDataset();
      this.syncScaleVisibility(packet.activeScale);
    }

    if (themeOrScaleChanged) {
      this.syncScaleLighting(packet.activeScale, isLight);
      const oldSky = this.cityNodes.skyDomeMesh.material;
      if (oldSky instanceof THREE.Material) oldSky.dispose();
      this.cityNodes.skyDomeMesh.material = createOpenSkyDomeMaterial(
        isLight,
        packet.atmosphereTier,
        packet.atmosphereProgress,
      );
    }

    const season = packet.season ?? 'PRINTEMPS';
    const progressBucket = Math.floor((packet.atmosphereProgress ?? 0) / 10);
    const nextVisualKey = `${packet.atmosphereTier}::${season}::${packet.activeSlotIndex}::${packet.weatherState}::${progressBucket}`;
    if (packet.atmosphereTier !== this.currentTier || nextVisualKey !== this.planetVisualKey) {
      this.currentTier = packet.atmosphereTier;
      this.currentAtmoProgress = packet.atmosphereProgress ?? 0;
      this.planetVisualKey = nextVisualKey;
      this.updateAtmosphereVisuals(
        {
          tier: packet.atmosphereTier,
          season,
          weatherState: packet.weatherState,
          slotIndex: packet.activeSlotIndex,
        },
        isLight,
        this.currentAtmoProgress,
      );
    }

    if (packet.themeAccentHex) {
      const parsedAccent = Number.parseInt(packet.themeAccentHex.replace('#', ''), 16);
      if (Number.isFinite(parsedAccent) && parsedAccent !== this.currentThemeAccentNum) {
        this.currentThemeAccentNum = parsedAccent;
        if (this.hoverHalo && this.hoverHalo.material instanceof THREE.MeshBasicMaterial) {
          this.hoverHalo.material.color.setHex(parsedAccent);
        }
        if (this.rimLight && this.currentScale !== 3) {
          this.rimLight.color.setHex(parsedAccent);
        }
      }
    }

    // Update orbital slots unlock state (Scale 1 untouched)
    this.spaceNodes.slotMeshes.forEach((mesh, idx) => {
      const slotNum = idx + 1;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const unlocked = slotNum <= packet.unlockedSlots;
      mat.emissive.setHex(
        slotNum === packet.activeSlotIndex ? this.currentThemeAccentNum : unlocked ? 0x064e3b : 0x000000,
      );
      mat.emissiveIntensity = slotNum === packet.activeSlotIndex ? 0.65 : unlocked ? 0.25 : 0;
      mat.opacity = unlocked ? 1 : 0.45;
      mat.transparent = !unlocked;
    });

    const overlayMode: ViewportOverlayMode = packet.overlayMode ?? 'STANDARD';
    this.currentOverlayMode = overlayMode;
    this.lastSelectedTileIndex = packet.selectedTileIndex;

    // Update 72 planet astrometric sector beacons & animated weather/telemetry overlay
    applySectorMarkerStates(this.planetNodes.tileMarkers, {
      selectedTileIndex: packet.selectedTileIndex,
      capturedSet: new Set(packet.capturedTiles),
      rivalSet: new Set(packet.rivalTiles),
      overlayMode,
      accentHex: this.currentThemeAccentNum,
    });

    updatePlanetWeatherFx(this.planetNodes.weatherFx, {
      weatherState: packet.weatherState,
      season,
      atmosphereTier: packet.atmosphereTier,
      overlayMode,
      capturedTiles: packet.capturedTiles,
      rivalTiles: packet.rivalTiles,
      tileDirections: this.planetNodes.tileDirections,
    });

    rebuildDossierPins(this.planetNodes, packet.activeDossierPins);

    // Rebuild city districts when structural diff or overlayMode changes
    const sig = `${overlayMode}:${this.currentThemeAccentNum}::` + packet.districts
      .map((d) => `${d.id}:${d.level}:${d.modulesCount}:${Math.round(d.integrity / 10)}`)
      .join('|');
    if (sig !== this.districtSignature) {
      this.districtSignature = sig;
      this.clearGroup(this.cityNodes.districtsGroup);
      for (const dist of packet.districts) {
        const mesh = buildDistrictMesh(dist);
        mesh.position.set(dist.gridX * 2.55, 0, dist.gridZ * 2.55);
        if (overlayMode !== 'STANDARD') {
          const wearScore = Math.max(0, Math.min(100, (100 - dist.integrity) + dist.level * 10));
          const maintHex = wearScore >= 55 ? 0xf43f5e : wearScore >= 32 ? 0xf59e0b : 0x10b981;
          const logisticsHex =
            dist.kind === 'ENERGY' || dist.kind === 'INDUSTRY' ? 0x10b981 : this.currentThemeAccentNum;
          const tintHex = overlayMode === 'MAINTENANCE' ? maintHex : logisticsHex;
          mesh.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
              child.material.emissive.setHex(tintHex);
              child.material.emissiveIntensity = overlayMode === 'MAINTENANCE' ? 0.55 : 0.42;
            }
          });
        }
        this.cityNodes.districtsGroup.add(mesh);
      }
    }

    // Update autonomous patrolling shuttles/drones (capped visually to 12 for crisp perf)
    const visualDrones = Math.min(12, Math.max(3, Math.round(packet.droneCount / 3)));
    if (visualDrones !== this.droneCountRendered) {
      this.droneCountRendered = visualDrones;
      this.clearGroup(this.cityNodes.dronesGroup);
      for (let i = 0; i < visualDrones; i++) {
        const d = buildDroneUnit();
        d.userData = {
          orbitPhase: (i / visualDrones) * Math.PI * 2,
          orbitR: 3.1 + (i % 3) * 1.55,
          orbitY: 2.4 + (i % 3) * 0.55,
        };
        this.cityNodes.dronesGroup.add(d);
      }
    }
  }

  public dispose(): void {
    this.isDisposed = true;
    cancelAnimationFrame(this.rafId);
    window.clearTimeout(this.timerId);
    for (const off of this.cleanupListeners) off();
    this.cleanupListeners = [];
    this.heldKeys.clear();
    if (this.scene) {
      this.scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of mats) {
            this.disposeMaterialWithMaps(m);
          }
        }
      });
    }
    this.pmremTarget?.dispose();
    this.renderer?.dispose();
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.hoverHalo = null;
  }

  private disposeMaterialWithMaps(mat: THREE.Material): void {
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
    } else if (mat instanceof THREE.ShaderMaterial) {
      for (const uniform of Object.values(mat.uniforms)) {
        if (uniform && uniform.value instanceof THREE.Texture) {
          uniform.value.dispose();
        }
      }
    }
    mat.dispose();
  }

  private syncScaleVisibility(scale: CameraScale): void {
    if (!this.spaceNodes || !this.planetNodes || !this.cityNodes) return;
    this.spaceNodes.group.visible = scale === 1;
    this.planetNodes.group.visible = scale === 2;
    this.cityNodes.group.visible = scale === 3;
    if (this.starfield) {
      this.starfield.visible = scale !== 3;
    }
  }

  private syncScaleLighting(scale: CameraScale, isLight: boolean): void {
    if (!this.hemiLight || !this.keyLight || !this.rimLight) return;
    if (scale === 3) {
      if (isLight) {
        this.hemiLight.color.setHex(0xfff1f5);
        this.hemiLight.groundColor.setHex(0xd6bfc7);
        this.hemiLight.intensity = 1.35;
        this.keyLight.color.setHex(0xfff6e5);
        this.keyLight.intensity = 2.35;
        this.keyLight.position.set(16, 22, 14);
        this.rimLight.color.setHex(0xfb7185);
        this.rimLight.intensity = 0.85;
      } else {
        this.hemiLight.color.setHex(0xfbcfe8);
        this.hemiLight.groundColor.setHex(0x281330);
        this.hemiLight.intensity = 1.05;
        this.keyLight.color.setHex(0xffe4d6);
        this.keyLight.intensity = 1.9;
        this.keyLight.position.set(14, 18, 12);
        this.rimLight.color.setHex(0xf43f5e);
        this.rimLight.intensity = 1.0;
      }
    } else {
      // Preserved Scale 1 & Scale 2 cosmic 3-point lighting
      this.hemiLight.color.setHex(0xfde8ef);
      this.hemiLight.groundColor.setHex(0x1e1326);
      this.hemiLight.intensity = 0.95;
      this.keyLight.color.setHex(0xfff4e0);
      this.keyLight.intensity = 2.15;
      this.keyLight.position.set(14, 16, 12);
      this.rimLight.color.setHex(this.currentThemeAccentNum);
      this.rimLight.intensity = 0.78;
    }
  }

  private updateAtmosphereVisuals(
    opts: PlanetTextureOptions,
    isLight: boolean,
    atmosphereProgress?: number,
  ): void {
    if (!this.planetNodes || !this.cityNodes) return;
    const { tier } = opts;

    const { map, normalMap, bumpMap, roughnessMap, emissiveMap } = createPlanetSurfaceTextures(opts);
    const sMat = this.planetNodes.surfaceMesh.material as THREE.MeshStandardMaterial;
    sMat.map?.dispose();
    sMat.normalMap?.dispose();
    sMat.bumpMap?.dispose();
    sMat.roughnessMap?.dispose();
    sMat.emissiveMap?.dispose();
    sMat.map = map;
    sMat.normalMap = normalMap;
    sMat.bumpMap = bumpMap;
    sMat.roughnessMap = roughnessMap;
    sMat.emissiveMap = emissiveMap;
    sMat.needsUpdate = true;

    const nextCloudTex = createPlanetCloudTexture(opts);
    const cMat = this.planetNodes.cloudsMesh.material as THREE.MeshStandardMaterial;
    cMat.map?.dispose();
    cMat.map = nextCloudTex;
    cMat.opacity = tier === 'P1' ? 0.56 : tier === 'P2' ? 0.76 : 0.9;
    cMat.needsUpdate = true;

    const cirMat = this.planetNodes.cirrusMesh.material as THREE.MeshBasicMaterial;
    cirMat.map = nextCloudTex;
    cirMat.opacity = tier === 'P1' ? 0.16 : 0.24;
    cirMat.needsUpdate = true;

    if (this.planetNodes.haloMesh.material instanceof THREE.Material) {
      this.planetNodes.haloMesh.material.dispose();
    }
    this.planetNodes.haloMesh.material = createAtmosphereHaloMaterial(tier, atmosphereProgress);

    if (this.planetNodes.limbMesh.material instanceof THREE.Material) {
      this.planetNodes.limbMesh.material.dispose();
    }
    this.planetNodes.limbMesh.material = createAtmosphereLimbMaterial(tier, atmosphereProgress);

    const gMat = this.cityNodes.groundMesh.material as THREE.MeshStandardMaterial;
    gMat.map?.dispose();
    gMat.map = createCityGroundTexture(tier);
    gMat.needsUpdate = true;

    const hMat = this.cityNodes.horizonMesh.material as THREE.MeshStandardMaterial;
    hMat.map?.dispose();
    hMat.map = createCityHorizonTexture(tier);
    hMat.needsUpdate = true;

    if (this.cityNodes.skyDomeMesh.material instanceof THREE.Material) {
      this.cityNodes.skyDomeMesh.material.dispose();
    }
    this.cityNodes.skyDomeMesh.material = createOpenSkyDomeMaterial(isLight, tier, atmosphereProgress);
  }

  private clearGroup(group: THREE.Group): void {
    while (group.children.length > 0) {
      const child = group.children[0];
      if (!child) break;
      group.remove(child);
      child.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of mats) this.disposeMaterialWithMaps(m);
        }
      });
    }
  }

  private syncCameraDataset(): void {
    if (!this.container) return;
    this.container.dataset.cameraScale = String(this.currentScale);
    this.container.dataset.cameraDist = this.targetDist.toFixed(2);
  }

  private getZoomBounds(): { readonly minD: number; readonly maxD: number } {
    if (this.currentScale === 1) return { minD: 14, maxD: 38 };
    if (this.currentScale === 2) return { minD: 4.8, maxD: 15.0 };
    return { minD: 5.5, maxD: 22.0 };
  }

  private attachPointerListeners(dom: HTMLCanvasElement): void {
    const activePointers = new Map<number, { x: number; y: number }>();
    let lastPinchDist = 0;

    const onPointerDown = (e: PointerEvent) => {
      try {
        dom.setPointerCapture(e.pointerId);
      } catch {
        // Synthetic pointer events in headless tests may not have OS capture handles
      }
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activePointers.size === 1) {
        this.isPointerDown = true;
        this.dragMoved = false;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
        lastPinchDist = 0;
      } else if (activePointers.size >= 2) {
        this.isPointerDown = false;
        this.dragMoved = true;
        const pts = Array.from(activePointers.values());
        const p0 = pts[0];
        const p1 = pts[1];
        if (p0 && p1) {
          lastPinchDist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (activePointers.has(e.pointerId)) {
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }
      if (activePointers.size >= 2) {
        const pts = Array.from(activePointers.values());
        const p0 = pts[0];
        const p1 = pts[1];
        if (p0 && p1) {
          const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
          if (lastPinchDist > 0 && dist > 0) {
            const minDim = Math.max(
              240,
              Math.min(dom.clientWidth || window.innerWidth, dom.clientHeight || window.innerHeight),
            );
            const normDelta = (lastPinchDist - dist) / minDim;
            const { minD, maxD } = this.getZoomBounds();
            this.targetDist = Math.max(
              minD,
              Math.min(maxD, this.targetDist + normDelta * this.targetDist * 2.15),
            );
            this.syncCameraDataset();
          }
          lastPinchDist = dist;
        }
        return;
      }
      if (!this.isPointerDown) {
        const now = performance.now();
        if (now - this.lastHoverCheckMs >= 65) {
          this.lastHoverCheckMs = now;
          this.updateHoverHighlight(e.clientX, e.clientY, dom);
        }
        return;
      }
      const dx = e.clientX - this.lastPointerX;
      const dy = e.clientY - this.lastPointerY;
      if (Math.abs(dx) + Math.abs(dy) > 4) this.dragMoved = true;
      this.yaw -= dx * 0.006;
      const minPitch = this.currentScale === 3 ? 0.14 : -0.9;
      this.targetPitch = Math.max(minPitch, Math.min(1.25, this.targetPitch + dy * 0.005));
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
    };

    const clearPointer = (e: PointerEvent) => {
      try {
        if (dom.hasPointerCapture(e.pointerId)) {
          dom.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore release errors on synthetic pointers
      }
      if (this.isPointerDown && !this.dragMoved && activePointers.size <= 1) {
        this.handleCanvasClick(e.clientX, e.clientY, dom);
      }
      activePointers.delete(e.pointerId);
      if (activePointers.size < 2) lastPinchDist = 0;
      if (activePointers.size === 1) {
        const remaining = Array.from(activePointers.values())[0];
        if (remaining) {
          this.isPointerDown = true;
          this.dragMoved = true;
          this.lastPointerX = remaining.x;
          this.lastPointerY = remaining.y;
        }
      } else if (activePointers.size === 0) {
        this.isPointerDown = false;
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { minD, maxD } = this.getZoomBounds();
      const sensitivity = e.ctrlKey ? 0.022 : 0.008;
      this.targetDist = Math.max(minD, Math.min(maxD, this.targetDist + e.deltaY * sensitivity));
      this.syncCameraDataset();
    };

    const preventGesture = (e: Event) => {
      e.preventDefault();
    };

    // Native TouchEvent 2-finger pinch zoom backup for iOS Safari WebKit
    let touchPinchStartDist = 0;
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        e.preventDefault();
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        if (t0 && t1) {
          const d = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
          if (touchPinchStartDist > 0 && d > 0) {
            const minDim = Math.max(240, Math.min(dom.clientWidth || window.innerWidth, dom.clientHeight || window.innerHeight));
            const normDelta = (touchPinchStartDist - d) / minDim;
            const { minD, maxD } = this.getZoomBounds();
            this.targetDist = Math.max(minD, Math.min(maxD, this.targetDist + normDelta * this.targetDist * 1.8));
            this.syncCameraDataset();
          }
          touchPinchStartDist = d;
        }
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) touchPinchStartDist = 0;
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', clearPointer);
    window.addEventListener('pointercancel', clearPointer);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('touchmove', onTouchMove, { passive: false });
    dom.addEventListener('touchend', onTouchEnd, { passive: true });
    dom.addEventListener('gesturestart', preventGesture, { passive: false });
    dom.addEventListener('gesturechange', preventGesture, { passive: false });

    this.cleanupListeners.push(() => {
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', clearPointer);
      window.removeEventListener('pointercancel', clearPointer);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('touchmove', onTouchMove);
      dom.removeEventListener('touchend', onTouchEnd);
      dom.removeEventListener('gesturestart', preventGesture);
      dom.removeEventListener('gesturechange', preventGesture);
    });
  }

  private attachKeyboardListeners(): void {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      this.heldKeys.add(e.key.toLowerCase());
    };
    const onKeyUp = (e: KeyboardEvent) => {
      this.heldKeys.delete(e.key.toLowerCase());
    };
    const onBlur = () => {
      this.heldKeys.clear();
      this.isPointerDown = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    this.cleanupListeners.push(() => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    });
  }

  private updateHoverHighlight(clientX: number, clientY: number, dom: HTMLCanvasElement): void {
    if (!this.camera || !this.hoverHalo) return;
    const rect = dom.getBoundingClientRect();
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      this.hoverHalo.visible = false;
      return;
    }
    this.pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);

    const activeGroup =
      this.currentScale === 1
        ? this.spaceNodes?.group
        : this.currentScale === 2
          ? this.planetNodes?.group
          : this.cityNodes?.districtsGroup;
    if (!activeGroup) {
      this.hoverHalo.visible = false;
      return;
    }

    const hits = this.raycaster.intersectObjects(activeGroup.children, true);
    for (const hit of hits) {
      let cur: THREE.Object3D | null = hit.object;
      while (cur) {
        const data = cur.userData as Record<string, unknown>;
        if (
          data.interactable === 'DOSSIER_PIN' ||
          data.interactable === 'TILE' ||
          data.interactable === 'SLOT' ||
          data.interactable === 'DISTRICT'
        ) {
          dom.style.cursor = 'pointer';
          cur.getWorldPosition(this.scratchVec3);
          this.hoverHalo.position.copy(this.scratchVec3);
          if (data.interactable === 'DISTRICT') {
            this.hoverHalo.position.y = 0.22;
            this.hoverHalo.rotation.set(Math.PI / 2, 0, 0);
            this.hoverHalo.scale.setScalar(1.25);
          } else if (data.interactable === 'TILE' || data.interactable === 'DOSSIER_PIN') {
            this.scratchQuat.setFromUnitVectors(
              this.upVec,
              this.scratchVec3.clone().normalize(),
            );
            this.hoverHalo.quaternion.copy(this.scratchQuat);
            this.hoverHalo.rotateX(Math.PI / 2);
            this.hoverHalo.scale.setScalar(data.interactable === 'DOSSIER_PIN' ? 0.24 : 0.16);
          } else {
            this.hoverHalo.rotation.set(Math.PI / 2, 0, 0);
            this.hoverHalo.scale.setScalar(1.05);
          }
          this.hoverHalo.visible = true;
          return;
        }
        cur = cur.parent;
      }
    }
    dom.style.cursor = this.isPointerDown ? 'grabbing' : 'grab';
    this.hoverHalo.visible = false;
  }

  private handleCanvasClick(clientX: number, clientY: number, dom: HTMLCanvasElement): void {
    if (!this.camera || !this.scene || !this.onGameEvent) return;
    const rect = dom.getBoundingClientRect();
    this.pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);

    const activeGroup =
      this.currentScale === 1
        ? this.spaceNodes?.group
        : this.currentScale === 2
          ? this.planetNodes?.group
          : this.cityNodes?.districtsGroup;
    if (!activeGroup) return;

    const hits = this.raycaster.intersectObjects(activeGroup.children, true);
    for (const hit of hits) {
      let cur: THREE.Object3D | null = hit.object;
      while (cur) {
        const data = cur.userData as Record<string, unknown>;
        if (data.interactable === 'DOSSIER_PIN' && typeof data.dossierId === 'string') {
          this.cameraShake = 0.04;
          this.onGameEvent({ type: 'DOSSIER_PIN_CLICKED', dossierId: data.dossierId });
          return;
        }
        if (data.interactable === 'TILE' && typeof data.tileIndex === 'number') {
          this.cameraShake = 0.03;
          this.onGameEvent({ type: 'TILE_SELECTED', tileIndex: data.tileIndex });
          return;
        }
        if (data.interactable === 'SLOT' && typeof data.slotIndex === 'number') {
          this.cameraShake = 0.04;
          this.onGameEvent({ type: 'SLOT_SELECTED', slotIndex: data.slotIndex });
          return;
        }
        if (data.interactable === 'DISTRICT' && typeof data.districtId === 'string') {
          this.cameraShake = 0.035;
          this.onGameEvent({ type: 'DISTRICT_CLICKED', districtId: data.districtId });
          return;
        }
        cur = cur.parent;
      }
    }
  }

  private afterDraw(next: () => void): void {
    if (!this.isSoftwareGl || !this.renderer) {
      this.rafId = requestAnimationFrame(next);
      return;
    }
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (typeof gl.fenceSync === 'function') {
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (this.isDisposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const status = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
        if (status === gl.UNSIGNALED) {
          this.timerId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          this.timerId = window.setTimeout(() => {
            if (!this.isDisposed) this.rafId = requestAnimationFrame(next);
          }, 80);
        }
      };
      this.timerId = window.setTimeout(poll, 5);
      return;
    }
    this.timerId = window.setTimeout(() => {
      if (!this.isDisposed) this.rafId = requestAnimationFrame(next);
    }, 85);
  }

  private startRenderLoop(): void {
    this.lastFrameTimeMs = performance.now();
    this.elapsedSec = 0;
    const tick = (): void => {
      if (this.isDisposed || !this.renderer || !this.scene || !this.camera) return;
      const now = performance.now();
      const dt = Math.min(Math.max(0, (now - this.lastFrameTimeMs) / 1000), 0.05);
      this.lastFrameTimeMs = now;
      this.elapsedSec += dt;
      const t = this.elapsedSec;

      // Held keyboard camera orbit & zoom controls (WASD / ZQSD / Arrows + Q/E)
      const panSpeed = 1.25;
      const minPitch = this.currentScale === 3 ? 0.14 : -0.9;
      const { minD, maxD } = this.getZoomBounds();
      let userControlling = this.isPointerDown;

      if (this.heldKeys.has('a') || this.heldKeys.has('q') || this.heldKeys.has('arrowleft')) {
        this.yaw -= dt * panSpeed;
        userControlling = true;
      }
      if (this.heldKeys.has('d') || this.heldKeys.has('arrowright')) {
        this.yaw += dt * panSpeed;
        userControlling = true;
      }
      if (this.heldKeys.has('w') || this.heldKeys.has('z') || this.heldKeys.has('arrowup')) {
        this.targetPitch = Math.min(1.25, this.targetPitch + dt * 0.85);
        userControlling = true;
      }
      if (this.heldKeys.has('s') || this.heldKeys.has('arrowdown')) {
        this.targetPitch = Math.max(minPitch, this.targetPitch - dt * 0.85);
        userControlling = true;
      }
      if (this.heldKeys.has('e') || this.heldKeys.has('+')) {
        this.targetDist = Math.max(minD, this.targetDist - dt * 6.5);
        this.syncCameraDataset();
        userControlling = true;
      }
      if (this.heldKeys.has('r') || this.heldKeys.has('-')) {
        this.targetDist = Math.min(maxD, this.targetDist + dt * 6.5);
        this.syncCameraDataset();
        userControlling = true;
      }

      if (!userControlling) {
        this.yaw += dt * (this.currentScale === 2 ? 0.08 : 0.045);
      }

      // Frame-rate-independent exponential damping
      this.dist = THREE.MathUtils.damp(this.dist, this.targetDist, 6.5, dt);
      this.pitch = THREE.MathUtils.damp(this.pitch, this.targetPitch, 6.5, dt);
      this.currentTargetY = THREE.MathUtils.damp(this.currentTargetY, this.targetY, 6.5, dt);
      this.cameraShake = THREE.MathUtils.damp(this.cameraShake, 0, 12, dt);

      const shakeX = this.cameraShake > 0.001 ? Math.sin(t * 48) * this.cameraShake : 0;
      const shakeY = this.cameraShake > 0.001 ? Math.cos(t * 53) * this.cameraShake * 0.7 : 0;

      const aspectScale =
        this.camera.aspect < 0.85 ? 1 + (0.85 - this.camera.aspect) * 0.95 : 1;
      const effDist = this.dist * aspectScale;
      const cx = Math.sin(this.yaw) * Math.cos(this.pitch) * effDist + shakeX;
      const cy = Math.sin(this.pitch) * effDist + this.currentTargetY + shakeY;
      const cz = Math.cos(this.yaw) * Math.cos(this.pitch) * effDist;
      this.camera.position.set(cx, cy, cz);
      this.camera.lookAt(0, this.currentTargetY, 0);

      if (this.planetNodes && this.planetNodes.group.visible) {
        this.planetNodes.cloudsMesh.rotation.y = t * 0.032;
        this.planetNodes.cirrusMesh.rotation.y = -t * 0.018 + 1.4;
        if (this.keyLight) {
          this.scratchVec3.copy(this.keyLight.position).normalize();
          const sMat = this.planetNodes.surfaceMesh.material as THREE.MeshStandardMaterial;
          const nightU = sMat.userData.nightUniforms as { uSunDir?: { value: THREE.Vector3 } } | undefined;
          if (nightU?.uSunDir) {
            nightU.uSunDir.value.copy(this.scratchVec3);
          }
          const haloMat = this.planetNodes.haloMesh.material;
          if (haloMat instanceof THREE.ShaderMaterial && haloMat.uniforms.uSunDir?.value instanceof THREE.Vector3) {
            haloMat.uniforms.uSunDir.value.copy(this.scratchVec3);
          }
          const limbMat = this.planetNodes.limbMesh.material;
          if (limbMat instanceof THREE.ShaderMaterial && limbMat.uniforms.uSunDir?.value instanceof THREE.Vector3) {
            limbMat.uniforms.uSunDir.value.copy(this.scratchVec3);
          }
        }
        animateSectorMarkers(this.planetNodes.tileMarkers, this.lastSelectedTileIndex, t);
        animatePlanetWeatherFx(this.planetNodes.weatherFx, t);
        const sat1 = this.planetNodes.satellites[0];
        if (sat1) {
          const a1 = t * 0.42;
          sat1.position.set(Math.cos(a1) * 4.4, Math.sin(a1) * 0.78, Math.sin(a1) * 4.4);
          sat1.rotation.y = -a1;
        }
        const sat2 = this.planetNodes.satellites[1];
        if (sat2) {
          const a2 = -t * 0.34 + 2.1;
          sat2.position.set(Math.cos(a2) * 3.95, Math.sin(a2) * 3.1, Math.sin(a2) * 2.4);
          sat2.rotation.y = a2;
        }
        this.planetNodes.pinGroup.children.forEach((pin, idx) => {
          const core = pin.getObjectByName('pinCore');
          if (core) {
            core.rotation.y = t * 1.6 + idx;
          }
        });
      }

      if (this.spaceNodes && this.spaceNodes.group.visible) {
        this.spaceNodes.station.position.x = Math.cos(t * 0.45) * 3.4;
        this.spaceNodes.station.position.z = Math.sin(t * 0.45) * 3.4;
        this.spaceNodes.station.rotation.y = -t * 0.45;
      }

      if (this.cityNodes && this.cityNodes.group.visible) {
        this.cityNodes.dronesGroup.children.forEach((drone, idx) => {
          const phase = Number(drone.userData.orbitPhase ?? 0);
          const r = Number(drone.userData.orbitR ?? 3.5);
          const baseY = Number(drone.userData.orbitY ?? 2.6);
          const a = t * 0.48 + phase;
          drone.position.set(
            Math.cos(a) * r,
            baseY + Math.sin(t * 1.8 + idx) * 0.18,
            Math.sin(a) * r,
          );
          drone.rotation.y = -a;
        });

        // Living Dual Maglev Shuttles (Civil inner + Military Freight outer counter-flow)
        this.cityNodes.shuttlesGroup.children.forEach((shuttle) => {
          const phase = Number(shuttle.userData.orbitPhase ?? 0);
          const r = Number(shuttle.userData.orbitR ?? 6.2);
          const baseY = Number(shuttle.userData.orbitY ?? 0.74);
          const spd = Number(shuttle.userData.speed ?? 0.38);
          const a = t * spd + phase;
          shuttle.position.set(Math.cos(a) * r, baseY, Math.sin(a) * r);
          shuttle.rotation.y = spd >= 0 ? -a : -a + Math.PI;
        });

        // OpenRW-style Citizen Waypoint Walkers gliding along promenades
        this.cityNodes.pedestriansGroup.children.forEach((walker, idx) => {
          const phase = Number(walker.userData.orbitPhase ?? 0);
          const r = Number(walker.userData.orbitR ?? 4.5);
          const spd = Number(walker.userData.speed ?? 0.16);
          const a = t * spd + phase;
          walker.position.set(
            Math.cos(a) * r,
            0.13 + Math.abs(Math.sin(t * 5.2 + idx)) * 0.04,
            Math.sin(a) * r,
          );
        });

        // Subtle Solar Day/Night directional arc in Scale 3 + Rayleigh/Mie Open-Sky Shader Sync
        if (this.keyLight) {
          const sunAngle = t * 0.06 + 0.6;
          this.keyLight.position.set(
            Math.cos(sunAngle) * 18,
            13 + Math.sin(sunAngle) * 8,
            Math.sin(sunAngle) * 14,
          );
          const skyMat = this.cityNodes.skyDomeMesh.material;
          if (skyMat instanceof THREE.ShaderMaterial) {
            if (skyMat.uniforms.uSunDir?.value instanceof THREE.Vector3) {
              skyMat.uniforms.uSunDir.value.copy(this.keyLight.position).normalize();
            }
            if (skyMat.uniforms.uTime) {
              skyMat.uniforms.uTime.value = t;
            }
          }
        }

        // Animated emissive Maglev rail pulses & Solarpunk pollen/atmospheric motes
        this.cityNodes.civilRailTex.offset.x = -(t * 0.48) % 1;
        this.cityNodes.freightRailTex.offset.x = (t * 0.32) % 1;
        this.cityNodes.atmoMotes.rotation.y = t * 0.04;
        this.cityNodes.atmoMotes.position.y = Math.sin(t * 0.9) * 0.08;

        this.cityNodes.wildlifeGroup.children.forEach((bird, idx) => {
          const phase = Number(bird.userData.orbitPhase ?? 0);
          const r = Number(bird.userData.orbitR ?? 7);
          const baseY = Number(bird.userData.orbitY ?? 3.2);
          const spd = Number(bird.userData.speed ?? 0.3);
          const a = t * spd + phase;
          bird.position.set(
            Math.cos(a) * r,
            baseY + Math.sin(t * 1.4 + idx) * 0.25,
            Math.sin(a) * r,
          );
          bird.rotation.y = -a;
          const flap = Math.sin(t * 6.5 + idx * 1.3) * 0.38;
          const lw = bird.getObjectByName('leftWing');
          const rw = bird.getObjectByName('rightWing');
          if (lw) lw.rotation.z = flap;
          if (rw) rw.rotation.z = -flap;
        });

        this.cityNodes.windRotors.forEach((rotor, idx) => {
          rotor.rotation.z = -t * (1.2 + (idx % 3) * 0.25);
        });
      }

      this.renderer.render(this.scene, this.camera);
      this.afterDraw(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }
}
