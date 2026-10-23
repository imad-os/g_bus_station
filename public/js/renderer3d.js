/**
 * Bus Fever 3D: Traffic Escape — Three.js 3-Zone World, Multi-Surface Textures & Dynamic Day/Sunset/Night Engine
 * - Zone A (Top): Textured Dark Slate Looping Passenger Queue Walkway + Illuminated Bus-Stop Shelters
 * - Zone B (Middle): Textured Coarse Weathered Asphalt Boarding Road + 8 Angled Parking Bays + Bay Focus Ring
 * - Zone C (Bottom): Textured Basalt Stone Paver Bus Grid with Cell Markings, Headlight Cones & Dual Focus Ring
 * - Dynamic Lighting: Supports 'day', 'sunset', and 'night' (plus 'auto' level cycling) with zero white backgrounds.
 */

import * as THREE from './vendor/three.module.js';
import {
  CELL_SIZE,
  DIR_VECTORS,
  getBusMeshDimensions,
  getBusWorldCenter,
} from './solver.js';

export const COLOR_PALETTE_HEX = {
  purple: { main: 0xa855f7, light: 0xc084fc, dark: 0x6b21a8, css: '#a855f7' },
  orange: { main: 0xff7a00, light: 0xfb923c, dark: 0xc2410c, css: '#ff7a00' },
  pink:   { main: 0xff3ca6, light: 0xf472b6, dark: 0xbe185d, css: '#ff3ca6' },
  green:  { main: 0x22c55e, light: 0x4ade80, dark: 0x15803d, css: '#22c55e' },
  yellow: { main: 0xfacc15, light: 0xfde047, dark: 0xca8a04, css: '#eab308' },
  cyan:   { main: 0x06b6d4, light: 0x22d3ee, dark: 0x0e7490, css: '#06b6d4' },
  red:    { main: 0xef4444, light: 0xf87171, dark: 0xb91c1c, css: '#ef4444' },
  blue:   { main: 0x3b82f6, light: 0x60a5fa, dark: 0x1d4ed8, css: '#3b82f6' },
};

export const TIME_OF_DAY_PRESETS = {
  day: {
    id: 'day',
    bgHex: 0x1b2d3e,
    fogHex: 0x1b2d3e,
    hemiSky: 0xe0f2fe,
    hemiGround: 0x334155,
    hemiIntensity: 1.45,
    dirColor: 0xfffbeb,
    dirIntensity: 1.55,
    dirPos: [12, 26, 14],
    rimColor: 0x7dd3fc,
    rimIntensity: 0.72,
    groundTint: 0xffffff,
    walkwayTint: 0xffffff,
    curbTint: 0x475569,
    islandTint: 0x86efac,
    asphaltTint: 0xffffff,
    paverTint: 0xffffff,
    headlightOpacity: 0.0,
    shelterGlowHex: 0x38bdf8,
  },
  sunset: {
    id: 'sunset',
    bgHex: 0x261733,
    fogHex: 0x261733,
    hemiSky: 0xfda4af,
    hemiGround: 0x311b4b,
    hemiIntensity: 1.32,
    dirColor: 0xff8a3d,
    dirIntensity: 1.68,
    dirPos: [-16, 19, 12],
    rimColor: 0xc084fc,
    rimIntensity: 0.85,
    groundTint: 0xfdba74,
    walkwayTint: 0xfed7aa,
    curbTint: 0x5b4670,
    islandTint: 0xfda4af,
    asphaltTint: 0xfed7aa,
    paverTint: 0xfecdd3,
    headlightOpacity: 0.28,
    shelterGlowHex: 0xfbbf24,
  },
  night: {
    id: 'night',
    bgHex: 0x0b1322,
    fogHex: 0x0b1322,
    hemiSky: 0x7dd3fc,
    hemiGround: 0x1e293b,
    hemiIntensity: 1.15,
    dirColor: 0xe0f2fe,
    dirIntensity: 1.25,
    dirPos: [6, 26, 10],
    rimColor: 0x38bdf8,
    rimIntensity: 0.92,
    groundTint: 0x93c5fd,
    walkwayTint: 0xbae6fd,
    curbTint: 0x334155,
    islandTint: 0x6ee7b7,
    asphaltTint: 0xbfdbfe,
    paverTint: 0x93c5fd,
    headlightOpacity: 0.46,
    shelterGlowHex: 0x7dd3fc,
  },
};

export const BAY_ANGLE = 0.42; // ~24 degrees (\ \ \ \ tilt)
export const LOT_TOP_EDGE_Z = 0.45; // Fixed top edge of Zone C in vertical mode
export const WIDE_LOT_LEFT_EDGE_X = 1.25; // Fixed left edge of Zone C (Z3) in wide TV mode
export const WIDE_ASPECT_THRESHOLD = 1.05; // Screens with aspect >= 1.05 use Wide (Z1 | Z2 | Z3) layout
export const GRID_ORIGIN_Z = 5.25;
export const ROAD_CENTER_Z = -3.75;
export const LOOP_CENTER_Z = -8.45;
export const GATE_POS = new THREE.Vector3(0, 0.15, -5.55);
export const GATE_POS_WIDE = new THREE.Vector3(-6.7, 0.15, 0);

/**
 * Computes Zone C's center Z from its fixed top edge (LOT_TOP_EDGE_Z = 0.45) in vertical mode,
 * guaranteeing a clean 2.5+ world-unit separation corridor below Zone B's parking bays.
 */
export function getDynamicGridOriginZ(gridHeight = 6) {
  return LOT_TOP_EDGE_Z + (gridHeight * CELL_SIZE) / 2;
}

/**
 * Computes Zone C's center X from its fixed left edge (WIDE_LOT_LEFT_EDGE_X = 1.25) in wide mode,
 * guaranteeing a clean separation corridor to the right of Zone B's vertical parking bays.
 */
export function getDynamicGridOriginX(gridWidth = 6, layoutMode = 'vertical') {
  if (layoutMode === 'wide') {
    return WIDE_LOT_LEFT_EDGE_X + (gridWidth * CELL_SIZE) / 2;
  }
  return 0;
}

// Pre-allocated scratch vectors for zero GC in 60Hz loop
const _projVec = new THREE.Vector3();
const _curvePt = new THREE.Vector3();
const _curveTan = new THREE.Vector3();
const _perpVec = new THREE.Vector3();

/**
 * Detects software WebGL (SwiftShader / llvmpipe) so headless Chromium and low-tier TVs run smoothly.
 */
export function detectSoftwareGl() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch (_e) {
    return false;
  }
}

export class Renderer3D {
  constructor(mountEl, qualityTier = 'mid') {
    this.mountEl = mountEl;
    this.isSoftwareGl = detectSoftwareGl();
    this.lowQuality = qualityTier === 'low' || this.isSoftwareGl;

    this.currentTimePreset = 'night';
    this.headlightOpacity = TIME_OF_DAY_PRESETS.night.headlightOpacity;

    // Dynamic layout mode: 'vertical' (phones) vs 'wide' (TV / desktop: Z1 Left | Z2 Center | Z3 Right)
    const initW = window.innerWidth || 1280;
    const initH = window.innerHeight || 720;
    this.layoutMode = initW / initH >= WIDE_ASPECT_THRESHOLD ? 'wide' : 'vertical';

    // Dynamic grid dimensions for Smart Camera Auto-Zoom & Zone B/C separation
    this.currentGridW = 6;
    this.currentGridH = 6;
    this.currentGridOriginX = getDynamicGridOriginX(6, this.layoutMode);
    this.currentGridOriginZ = this.layoutMode === 'wide' ? 0 : getDynamicGridOriginZ(6);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(TIME_OF_DAY_PRESETS.night.bgHex);
    this.scene.fog = new THREE.Fog(TIME_OF_DAY_PRESETS.night.fogHex, 95, 175);

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.5, 180);
    this.cameraLookTarget = new THREE.Vector3(0, 0, 0.8);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.lowQuality,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.enabled = false; // Crisp drop-shadow planes for 60 FPS Smart TV compliance
    this.renderer.setPixelRatio(
      this.lowQuality ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );

    this.mountEl.innerHTML = '';
    this.mountEl.appendChild(this.renderer.domElement);

    this.raycaster = new THREE.Raycaster();
    this.ndcMouse = new THREE.Vector2();

    // Shared caches for materials and textures
    this.materialCache = new Map();
    this.arrowTextures = new Map();
    this.surfaceTextures = new Map();
    this.bayMeshes = [];
    this.bayClickProxies = [];
    this.busClickProxies = [];
    this.headlightMaterials = [];
    this.shelterLightMaterials = [];

    // Dynamic groups
    this.worldGroup = new THREE.Group();
    this.zoneAGroup = new THREE.Group();
    this.zoneBGroup = new THREE.Group();
    this.zoneCGroup = new THREE.Group();
    this.passengerPoolGroup = new THREE.Group();
    this.runnersGroup = new THREE.Group();
    this.scene.add(this.worldGroup);
    this.worldGroup.add(this.zoneAGroup);
    this.worldGroup.add(this.zoneBGroup);
    this.worldGroup.add(this.zoneCGroup);
    // Attach passengerPoolGroup to zoneAGroup so Z1 (walkway + loop + feeder + passengers) transforms as a single unit in Vertical & Wide modes!
    this.zoneAGroup.add(this.passengerPoolGroup);
    this.worldGroup.add(this.runnersGroup);

    // Pre-allocated 3D Passenger Pool (for turning loop circle + waiting feeder line + runners)
    this.maxVisibleQueuePassengers = 320;
    this.loopCapacityRows = 24; // 24 rows * 5 abreast = 120 passengers turning inside the oval circle
    this.queuePassengerNodes = [];
    this.runnerPool = [];
    this.activeRunners = [];

    // Bus actors map: id -> actor state
    this.busActors = new Map();
    this.focusedBusId = null;
    this.focusRingMesh = null;
    this.focusArrowGroup = null;
    this.focusedBayIndex = -1;
    this.bayFocusMesh = null;
    this.doorGroundPadMat = null;
    this.doorBeaconMat = null;

    // Zone A Curves: Closed Turning Loop Circle + Stationary Top-Right Feeder Waiting Line
    this.loopCurve = null;
    this.feederCurve = null;
    this.walkwayCurve = null;
    this.loopTurnPhase = 0; // Continuous slow rotation phase [0..1) for the circle queue
    this.queueVisualScroll = 0;

    this._initSurfaceTextures();
    this._setupLights();
    this._buildStaticEnvironment();
    this._initPassengerPools();
    this._buildSelectionRings();
    this._applyLayoutModeTransform();
    this.setTimeOfDay('night');
    this.resize();
  }

  /**
   * Builds rich tileable multi-zone surface textures and loads CC0 SVG texture assets from ./assets/textures/.
   */
  _initSurfaceTextures() {
    const loader = new THREE.TextureLoader();

    // 1. Weathered Coarse Asphalt Texture (Zone B Road)
    const asphaltCanvas = document.createElement('canvas');
    asphaltCanvas.width = 512;
    asphaltCanvas.height = 256;
    const actx = asphaltCanvas.getContext('2d');
    actx.fillStyle = '#263140';
    actx.fillRect(0, 0, 512, 256);

    // Coarse aggregate grain
    for (let i = 0; i < 1600; i++) {
      const x = (i * 97) % 512;
      const y = (i * 151) % 256;
      actx.fillStyle = i % 2 === 0 ? 'rgba(148, 163, 184, 0.16)' : 'rgba(15, 23, 42, 0.35)';
      actx.fillRect(x, y, 3, 3);
    }

    // Amber-gold dashed safety edge lines along top & bottom of boarding road
    actx.strokeStyle = '#f59e0b';
    actx.lineWidth = 6;
    actx.setLineDash([28, 20]);
    actx.beginPath();
    actx.moveTo(0, 14);
    actx.lineTo(512, 14);
    actx.moveTo(0, 242);
    actx.lineTo(512, 242);
    actx.stroke();

    const asphaltTex = new THREE.CanvasTexture(asphaltCanvas);
    asphaltTex.colorSpace = THREE.SRGBColorSpace;
    asphaltTex.wrapS = THREE.RepeatWrapping;
    asphaltTex.wrapT = THREE.RepeatWrapping;
    asphaltTex.repeat.set(6, 1);
    this.surfaceTextures.set('asphalt', asphaltTex);

    // 2. Dark Slate Tactile Walkway Tile Texture (Zone A Passenger Loop)
    const walkwayCanvas = document.createElement('canvas');
    walkwayCanvas.width = 256;
    walkwayCanvas.height = 256;
    const wctx = walkwayCanvas.getContext('2d');
    wctx.fillStyle = '#2d3d54';
    wctx.fillRect(0, 0, 256, 256);
    wctx.strokeStyle = '#162030';
    wctx.lineWidth = 4;
    for (let r = 0; r < 4; r++) {
      const y = r * 64;
      const offset = (r % 2) * 64;
      for (let c = -1; c < 4; c++) {
        wctx.fillStyle = (r + c) % 2 === 0 ? '#364963' : '#2b3b52';
        wctx.fillRect(c * 128 + offset + 3, y + 3, 122, 58);
        wctx.strokeRect(c * 128 + offset + 2, y + 2, 124, 60);
      }
    }
    const walkwayTex = new THREE.CanvasTexture(walkwayCanvas);
    walkwayTex.colorSpace = THREE.SRGBColorSpace;
    walkwayTex.wrapS = THREE.RepeatWrapping;
    walkwayTex.wrapT = THREE.RepeatWrapping;
    walkwayTex.repeat.set(6, 4);
    this.surfaceTextures.set('walkway', walkwayTex);

    // 3. Dark Turf / Architectural Plaza Surroundings Texture
    const turfCanvas = document.createElement('canvas');
    turfCanvas.width = 256;
    turfCanvas.height = 256;
    const tctx = turfCanvas.getContext('2d');
    tctx.fillStyle = '#1b2838';
    tctx.fillRect(0, 0, 256, 256);

    // Architectural dark plaza tiles with subtle emerald-slate courtyard inlay
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        tctx.fillStyle = (r + c) % 2 === 0 ? '#203042' : '#1b2838';
        tctx.fillRect(c * 64 + 2, r * 64 + 2, 60, 60);
      }
    }
    tctx.strokeStyle = '#131d2a';
    tctx.lineWidth = 3;
    for (let i = 0; i <= 256; i += 64) {
      tctx.beginPath();
      tctx.moveTo(i, 0);
      tctx.lineTo(i, 256);
      tctx.moveTo(0, i);
      tctx.lineTo(256, i);
      tctx.stroke();
    }
    for (let i = 0; i < 500; i++) {
      const x = (i * 97) % 256;
      const y = (i * 61) % 256;
      tctx.fillStyle = i % 3 === 0 ? 'rgba(148, 163, 184, 0.08)' : 'rgba(15, 23, 42, 0.2)';
      tctx.fillRect(x, y, 3, 3);
    }
    const turfTex = new THREE.CanvasTexture(turfCanvas);
    turfTex.colorSpace = THREE.SRGBColorSpace;
    turfTex.wrapS = THREE.RepeatWrapping;
    turfTex.wrapT = THREE.RepeatWrapping;
    turfTex.repeat.set(18, 18);
    this.surfaceTextures.set('turf', turfTex);

    // Preload open-source CC0 SVG texture assets from ./assets/textures/ into cache
    ['./assets/textures/asphalt.svg', './assets/textures/walkway.svg', './assets/textures/turf.svg', './assets/textures/pavers.svg'].forEach((url) => {
      loader.load(url, () => {}, undefined, () => {});
    });
  }

  /**
   * Generates a custom cell-aligned basalt stone paver texture for Zone C's grid dimensions.
   */
  _createLotGridPaverTexture(gridW, gridH) {
    const cellPx = 96;
    const canvas = document.createElement('canvas');
    canvas.width = gridW * cellPx;
    canvas.height = gridH * cellPx;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let gx = 0; gx < gridW; gx++) {
      for (let gz = 0; gz < gridH; gz++) {
        const x = gx * cellPx;
        const y = gz * cellPx;

        // Checkerboard tactile basalt stone paver variation
        ctx.fillStyle = (gx + gz) % 2 === 0 ? '#2b3b52' : '#243247';
        ctx.fillRect(x + 4, y + 4, cellPx - 8, cellPx - 8);

        // Recessed stone joint border
        ctx.strokeStyle = '#3b5170';
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 5, y + 5, cellPx - 10, cellPx - 10);

        // Crisp tactical corner ticks inside each grid cell
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.42)';
        ctx.lineWidth = 2.5;
        const pad = 14;
        const tick = 11;
        ctx.beginPath();
        ctx.moveTo(x + pad, y + pad + tick);
        ctx.lineTo(x + pad, y + pad);
        ctx.lineTo(x + pad + tick, y + pad);
        ctx.moveTo(x + cellPx - pad - tick, y + pad);
        ctx.lineTo(x + cellPx - pad, y + pad);
        ctx.lineTo(x + cellPx - pad, y + pad + tick);
        ctx.moveTo(x + pad, y + cellPx - pad - tick);
        ctx.lineTo(x + pad, y + cellPx - pad);
        ctx.lineTo(x + pad + tick, y + cellPx - pad);
        ctx.moveTo(x + cellPx - pad - tick, y + cellPx - pad);
        ctx.lineTo(x + cellPx - pad, y + cellPx - pad);
        ctx.lineTo(x + cellPx - pad, y + cellPx - pad - tick);
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }

  _setupLights() {
    this.hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 1.15);
    this.hemiLight.position.set(0, 28, 0);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfffbeb, 1.35);
    this.dirLight.position.set(10, 25, 14);
    this.scene.add(this.dirLight);

    this.rimLight = new THREE.DirectionalLight(0x38bdf8, 0.72);
    this.rimLight.position.set(-12, 18, -12);
    this.scene.add(this.rimLight);
  }

  /**
   * Applies 'day', 'sunset', or 'night' lighting & material tints across the 3D scene.
   */
  setTimeOfDay(mode = 'night', levelNum = 1) {
    let resolved = mode;
    if (mode === 'auto') {
      const cycle = ['day', 'sunset', 'night'];
      resolved = cycle[(Math.max(1, levelNum) - 1) % cycle.length];
    }
    const preset = TIME_OF_DAY_PRESETS[resolved] || TIME_OF_DAY_PRESETS.night;
    this.currentTimePreset = preset.id;
    this.headlightOpacity = preset.headlightOpacity;

    this.scene.background.setHex(preset.bgHex);
    this.scene.fog.color.setHex(preset.fogHex);

    this.hemiLight.color.setHex(preset.hemiSky);
    this.hemiLight.groundColor.setHex(preset.hemiGround);
    this.hemiLight.intensity = preset.hemiIntensity;

    this.dirLight.color.setHex(preset.dirColor);
    this.dirLight.intensity = preset.dirIntensity;
    this.dirLight.position.set(...preset.dirPos);

    this.rimLight.color.setHex(preset.rimColor);
    this.rimLight.intensity = preset.rimIntensity;

    if (this.groundMat) this.groundMat.color.setHex(preset.groundTint);
    if (this.walkwayPathMat) this.walkwayPathMat.color.setHex(preset.walkwayTint);
    if (this.walkwayCurbMat) this.walkwayCurbMat.color.setHex(preset.curbTint);
    if (this.islandCenterMat) this.islandCenterMat.color.setHex(preset.islandTint);
    if (this.roadMat) this.roadMat.color.setHex(preset.asphaltTint);
    if (this.lotPadMat) this.lotPadMat.color.setHex(preset.paverTint);

    for (let i = 0; i < this.headlightMaterials.length; i++) {
      const mat = this.headlightMaterials[i];
      mat.opacity = preset.headlightOpacity;
      mat.visible = preset.headlightOpacity > 0.01;
    }

    for (let i = 0; i < this.shelterLightMaterials.length; i++) {
      this.shelterLightMaterials[i].color.setHex(preset.shelterGlowHex);
    }

    return preset.id;
  }

  /**
   * Builds Zone A (Textured Looping Walkway + 2 Illuminated Blue Shelters),
   * Zone B (Textured Weathered Asphalt Boarding Road + 8 Angled Parking Bays),
   * and Base Textured Surroundings (Zero White Surfaces).
   */
  _buildStaticEnvironment() {
    // Base textured dark plaza/turf ground plane
    const groundGeo = new THREE.PlaneGeometry(90, 90);
    this.groundMat = new THREE.MeshLambertMaterial({
      color: TIME_OF_DAY_PRESETS.night.groundTint,
      map: this.surfaceTextures.get('turf'),
    });
    const ground = new THREE.Mesh(groundGeo, this.groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    this.worldGroup.add(ground);

    // =========================================================================
    // ZONE A: Top 3D Looping Passenger Queue Walkway (Turning Circle + Waiting Feeder Line)
    // =========================================================================
    // 1. Closed 360-degree elliptical loop track where passengers continuously revolve in a circle.
    //    Starts at u = 0 at the bottom-center Boarding Gate (x = 0, z = LOOP_CENTER_Z + 2.02)
    //    and circles clockwise around the central island.
    const loopPts = [];
    const loopSegments = 16;
    const rx = 4.05;
    const rz = 2.02;
    for (let s = 0; s < loopSegments; s++) {
      // Angle 0 at bottom center (x = 0, z = +rz), advancing clockwise around the oval
      const theta = (s / loopSegments) * Math.PI * 2;
      const lx = -Math.sin(theta) * rx;
      const lz = LOOP_CENTER_Z + Math.cos(theta) * rz;
      loopPts.push(new THREE.Vector3(lx, 0.14, lz));
    }
    this.loopCurve = new THREE.CatmullRomCurve3(loopPts, true, 'centripetal', 0.5);

    // 2. Stationary Top-Right Feeder Line where overflow passengers wait in line before entering the circle
    const feederPts = [
      new THREE.Vector3(3.85, 0.14, -9.55),
      new THREE.Vector3(4.85, 0.14, -10.95),
      new THREE.Vector3(5.65, 0.14, -12.75),
      new THREE.Vector3(6.25, 0.14, -14.75),
      new THREE.Vector3(6.75, 0.14, -16.85),
    ];
    this.feederCurve = new THREE.CatmullRomCurve3(feederPts, false, 'centripetal', 0.5);
    this.walkwayCurve = this.loopCurve;

    this._buildWalkwayLoopGeometry();

    // Flank Zone A with two low-poly Illuminated Blue Bus-Stop Shelters on left and right
    const leftShelter = this._createBusShelterGroup();
    leftShelter.position.set(-6.9, 0, -7.2);
    leftShelter.rotation.y = 0.42;
    this.zoneAGroup.add(leftShelter);

    const rightShelter = this._createBusShelterGroup();
    rightShelter.position.set(6.9, 0, -7.2);
    rightShelter.rotation.y = -0.42;
    this.zoneAGroup.add(rightShelter);

    // =========================================================================
    // ZONE B: Middle Weathered Dark Asphalt Boarding Road & 8 Angled Parking Bays
    // =========================================================================
    const roadWidth = 28;
    const roadDepth = 3.35;
    const roadGeo = new THREE.PlaneGeometry(roadWidth, roadDepth);
    this.roadMat = new THREE.MeshLambertMaterial({
      color: TIME_OF_DAY_PRESETS.night.asphaltTint,
      map: this.surfaceTextures.get('asphalt'),
    });
    const roadMesh = new THREE.Mesh(roadGeo, this.roadMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.set(0, 0.01, ROAD_CENTER_Z);
    this.zoneBGroup.add(roadMesh);

    // Top & Bottom dark steel-slate curb strips (no white!)
    const curbGeo = new THREE.BoxGeometry(roadWidth, 0.09, 0.16);
    const roadCurbMat = new THREE.MeshLambertMaterial({ color: 0x334155 });

    const leftTopCurb = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.09, 0.16), roadCurbMat);
    leftTopCurb.position.set(-7.4, 0.045, ROAD_CENTER_Z - roadDepth / 2);
    this.zoneBGroup.add(leftTopCurb);

    const rightTopCurb = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.09, 0.16), roadCurbMat);
    rightTopCurb.position.set(7.4, 0.045, ROAD_CENTER_Z - roadDepth / 2);
    this.zoneBGroup.add(rightTopCurb);

    const bottomCurb = new THREE.Mesh(curbGeo, roadCurbMat);
    bottomCurb.position.set(0, 0.045, ROAD_CENTER_Z + roadDepth / 2);
    this.zoneBGroup.add(bottomCurb);

    // Clean Dark Asphalt Exit/Approach Buffer Corridor between Zone B Parking Bays (z = -2.075)
    // and Zone C Bus Puzzle Lot Top Edge (z = +0.45), creating a clear visual separation space
    const bufferDepth = LOT_TOP_EDGE_Z - (ROAD_CENTER_Z + roadDepth / 2) - 0.25;
    const bufferCenterZ = (ROAD_CENTER_Z + roadDepth / 2 + LOT_TOP_EDGE_Z) * 0.5;
    const bufferGeo = new THREE.PlaneGeometry(roadWidth, Math.max(1.2, bufferDepth));
    const bufferMat = new THREE.MeshLambertMaterial({
      color: 0x1e293b,
      map: this.surfaceTextures.get('walkway'),
    });
    const bufferMesh = new THREE.Mesh(bufferGeo, bufferMat);
    bufferMesh.rotation.x = -Math.PI / 2;
    bufferMesh.position.set(0, 0.004, bufferCenterZ);
    this.zoneBGroup.add(bufferMesh);

    this._buildParkingBays();
  }

  _buildWalkwayLoopGeometry() {
    const outerLoopShape = new THREE.Shape();
    outerLoopShape.absellipse(0, LOOP_CENTER_Z, 5.55, 3.15, 0, Math.PI * 2, false, 0);

    const outerExtrude = new THREE.ExtrudeGeometry(outerLoopShape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.03,
      bevelSegments: 2,
      curveSegments: 36,
    });
    outerExtrude.rotateX(Math.PI / 2);
    this.walkwayCurbMat = new THREE.MeshLambertMaterial({
      color: TIME_OF_DAY_PRESETS.night.curbTint,
    });
    const outerMesh = new THREE.Mesh(outerExtrude, this.walkwayCurbMat);
    outerMesh.position.y = 0.11;
    this.zoneAGroup.add(outerMesh);

    // Textured dark-slate walkway path surface
    const pathShape = new THREE.Shape();
    pathShape.absellipse(0, LOOP_CENTER_Z, 5.25, 2.85, 0, Math.PI * 2, false, 0);
    const pathGeo = new THREE.ShapeGeometry(pathShape, 36);
    pathGeo.rotateX(Math.PI / 2);
    this.walkwayPathMat = new THREE.MeshLambertMaterial({
      color: TIME_OF_DAY_PRESETS.night.walkwayTint,
      map: this.surfaceTextures.get('walkway'),
    });
    const pathMesh = new THREE.Mesh(pathGeo, this.walkwayPathMat);
    pathMesh.position.y = 0.14;
    this.zoneAGroup.add(pathMesh);

    // Top-right curved feeder walkway extension
    const feederCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(3.6, 0.06, -9.4),
      new THREE.Vector3(4.9, 0.06, -11.0),
      new THREE.Vector3(5.9, 0.06, -13.6),
      new THREE.Vector3(6.5, 0.06, -16.6),
    ]);
    const feederTubeOuter = new THREE.TubeGeometry(feederCurve, 20, 1.52, 12, false);
    feederTubeOuter.scale(1, 0.09, 1);
    const feederOuterMesh = new THREE.Mesh(feederTubeOuter, this.walkwayCurbMat);
    this.zoneAGroup.add(feederOuterMesh);

    const feederTubeInner = new THREE.TubeGeometry(feederCurve, 20, 1.28, 12, false);
    feederTubeInner.scale(1, 0.11, 1);
    const feederInnerMesh = new THREE.Mesh(feederTubeInner, this.walkwayPathMat);
    this.zoneAGroup.add(feederInnerMesh);

    // Center island inside the oval loop (dark slate rim + landscaped dark turf center)
    const islandRimShape = new THREE.Shape();
    islandRimShape.absellipse(0, LOOP_CENTER_Z, 2.85, 1.18, 0, Math.PI * 2, false, 0);
    const islandRimGeo = new THREE.ExtrudeGeometry(islandRimShape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.03,
      bevelSegments: 2,
      curveSegments: 28,
    });
    islandRimGeo.rotateX(Math.PI / 2);
    const islandRimMesh = new THREE.Mesh(islandRimGeo, this.walkwayCurbMat);
    islandRimMesh.position.y = 0.17;
    this.zoneAGroup.add(islandRimMesh);

    const islandCenterShape = new THREE.Shape();
    islandCenterShape.absellipse(0, LOOP_CENTER_Z, 2.62, 0.96, 0, Math.PI * 2, false, 0);
    const islandCenterGeo = new THREE.ShapeGeometry(islandCenterShape, 28);
    islandCenterGeo.rotateX(Math.PI / 2);
    this.islandCenterMat = new THREE.MeshLambertMaterial({
      color: TIME_OF_DAY_PRESETS.night.islandTint,
      map: this.surfaceTextures.get('turf'),
    });
    const islandCenterMesh = new THREE.Mesh(islandCenterGeo, this.islandCenterMat);
    islandCenterMesh.position.y = 0.185;
    this.zoneAGroup.add(islandCenterMesh);

    // Gate opening dark stone connector at bottom center of loop
    const gateConnectorGeo = new THREE.PlaneGeometry(2.7, 1.35);
    const gateConnector = new THREE.Mesh(gateConnectorGeo, this.walkwayPathMat);
    gateConnector.rotation.x = -Math.PI / 2;
    gateConnector.position.set(0, 0.142, -5.52);
    this.zoneAGroup.add(gateConnector);

    // High-Contrast Distinctive Boarding Door Ground Pad (Neon Emerald + Gold Chevron Platform)
    // Positioned right where the revolving passenger circle passes uLoop = 0 (x = 0, z = -6.15)
    const doorPadTex = this._createDoorGroundPadTexture();
    this.doorGroundPadMat = new THREE.MeshBasicMaterial({
      map: doorPadTex,
      transparent: true,
      opacity: 0.98,
      depthWrite: false,
    });
    const doorPadMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.68, 1.48),
      this.doorGroundPadMat
    );
    doorPadMesh.rotation.x = -Math.PI / 2;
    doorPadMesh.position.set(0, 0.156, -6.15);
    this.zoneAGroup.add(doorPadMesh);

    // Flanking Illuminated Boarding Door Gate Pillars (Left & Right of Door Ground Pad)
    const pillarMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
    const collarMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    this.doorBeaconMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });

    [-1.42, 1.42].forEach((px) => {
      const pillarGroup = new THREE.Group();
      pillarGroup.position.set(px, 0.14, -5.85);

      const base = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.28), collarMat);
      base.position.y = 0.05;
      pillarGroup.add(base);

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.72, 10), pillarMat);
      post.position.y = 0.42;
      pillarGroup.add(post);

      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), this.doorBeaconMat);
      beacon.position.y = 0.84;
      pillarGroup.add(beacon);

      this.zoneAGroup.add(pillarGroup);
    });
  }

  /**
   * Creates a very distinctive, high-contrast Neon Emerald & Gold Checkered Boarding Door Ground Pad texture
   * so players immediately see the exact door zone where circling passengers can board buses.
   */
  _createDoorGroundPadTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Deep emerald-black base with glowing neon border
    ctx.fillStyle = '#052e16';
    ctx.fillRect(8, 8, 496, 240);

    // Bold gold & neon-emerald hazard chevron border along top and bottom
    const stripeW = 32;
    for (let x = -256; x < 512; x += stripeW) {
      ctx.fillStyle = (Math.floor(x / stripeW) % 2 === 0) ? '#facc15' : '#10b981';
      ctx.beginPath();
      ctx.moveTo(x, 8);
      ctx.lineTo(x + stripeW, 8);
      ctx.lineTo(x + stripeW + 24, 38);
      ctx.lineTo(x + 24, 38);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x, 248);
      ctx.lineTo(x + stripeW, 248);
      ctx.lineTo(x + stripeW - 24, 218);
      ctx.lineTo(x - 24, 218);
      ctx.closePath();
      ctx.fill();
    }

    // Vibrant emerald center mat
    const grad = ctx.createLinearGradient(0, 40, 0, 216);
    grad.addColorStop(0, '#047857');
    grad.addColorStop(0.5, '#10b981');
    grad.addColorStop(1, '#047857');
    ctx.fillStyle = grad;
    ctx.fillRect(20, 42, 472, 172);

    // Crisp outer neon frame
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 8;
    ctx.strokeRect(12, 12, 488, 232);

    // Downward boarding chevrons + "BOARDING DOOR" stencil
    ctx.fillStyle = '#fef08a';
    ctx.font = '900 44px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('▼ BOARDING DOOR ▼', 256, 128);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }

  /**
   * Builds a composite multi-part low-poly blue bus-stop shelter with an illuminated night canopy strip.
   */
  _createBusShelterGroup() {
    const group = new THREE.Group();

    const shadowGeo = new THREE.PlaneGeometry(2.5, 1.5);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x020617,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.015;
    group.add(shadow);

    // Dark slate base platform under shelter
    const basePad = new THREE.Mesh(
      new THREE.BoxGeometry(2.3, 0.08, 1.3),
      new THREE.MeshLambertMaterial({ color: 0x1e293b })
    );
    basePad.position.y = 0.04;
    group.add(basePad);

    const postGeo = new THREE.CylinderGeometry(0.055, 0.055, 1.35, 8);
    const postMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
    const postPositions = [
      [-0.95, 0.675, -0.45],
      [0.95, 0.675, -0.45],
      [-0.95, 0.675, 0.45],
      [0.95, 0.675, 0.45],
    ];
    for (let i = 0; i < postPositions.length; i++) {
      const p = new THREE.Mesh(postGeo, postMat);
      p.position.set(...postPositions[i]);
      group.add(p);
    }

    const roofTrim = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.12, 1.2),
      new THREE.MeshLambertMaterial({ color: 0x0284c7 })
    );
    roofTrim.position.set(0, 1.38, 0);
    group.add(roofTrim);

    const roofTop = new THREE.Mesh(
      new THREE.BoxGeometry(2.04, 0.08, 1.04),
      new THREE.MeshLambertMaterial({ color: 0x38bdf8 })
    );
    roofTop.position.set(0, 1.45, 0);
    group.add(roofTop);

    // Illuminated canopy light strip underneath roof
    const lampMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc });
    this.shelterLightMaterials.push(lampMat);
    const lampStrip = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.04, 0.25), lampMat);
    lampStrip.position.set(0, 1.31, 0);
    group.add(lampStrip);

    // Warm wooden bench inside shelter
    const benchSeat = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.1, 0.42),
      new THREE.MeshLambertMaterial({ color: 0xd97706 })
    );
    benchSeat.position.set(0, 0.42, -0.12);
    group.add(benchSeat);

    const benchBack = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.32, 0.08),
      new THREE.MeshLambertMaterial({ color: 0xb45309 })
    );
    benchBack.position.set(0, 0.62, -0.3);
    group.add(benchBack);

    const signPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.95, 8),
      postMat
    );
    signPole.position.set(1.35, 0.475, 0.2);
    group.add(signPole);

    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.38, 0.06),
      new THREE.MeshLambertMaterial({ color: 0x0ea5e9 })
    );
    signBoard.position.set(1.35, 0.92, 0.2);
    group.add(signBoard);

    return group;
  }

  /**
   * Builds the 8 Angled Parking Bays in Zone B:
   * - Slot 0: Gold VIP bay
   * - Slots 1..4: Unlocked neon-cyan/white bays
   * - Slots 5..7: Extra bays unlocked individually with Points/Coins (Spot 1: 10 PTS, Spot 2: 30 PTS, Spot 3: 100 PTS)
   */
  _buildParkingBays() {
    this.bayMeshes = [];
    this.bayClickProxies = [];

    const totalSlots = 8;
    const spacingX = 1.62;
    const startX = -((totalSlots - 1) * spacingX) / 2;
    const extraBayCosts = [10, 30, 100];

    for (let i = 0; i < totalSlots; i++) {
      const localX = startX + i * spacingX;
      const localZ = ROAD_CENTER_Z + 0.05;
      const isVip = i === 0;
      const isDefaultUnlocked = i >= 1 && i <= 4;
      const pointCost = i >= 5 ? extraBayCosts[i - 5] || 100 : 0;
      const mode = isVip ? 'vip' : isDefaultUnlocked ? 'active' : `locked_${pointCost}`;

      const bayGroup = new THREE.Group();
      bayGroup.position.set(localX, 0.025, localZ);
      bayGroup.rotation.y = BAY_ANGLE;

      const tex = this._createBayTexture(mode, pointCost);
      const planeMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
      });
      const planeMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.32, 2.48), planeMat);
      planeMesh.rotation.x = -Math.PI / 2;
      bayGroup.add(planeMesh);

      const proxyMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 0.2, 2.4),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      proxyMesh.userData = { bayIndex: i };
      bayGroup.add(proxyMesh);
      this.bayClickProxies.push(proxyMesh);

      this.zoneBGroup.add(bayGroup);
      this.bayMeshes.push({
        index: i,
        localX,
        x: localX,
        z: localZ,
        worldX: localX,
        worldZ: localZ,
        worldRotY: BAY_ANGLE,
        pointCost,
        mode,
        group: bayGroup,
        planeMesh,
        planeMat,
      });
    }
  }

  _createBayTexture(mode, pointCost = 10) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 256, 512);

    const isReadyToUnlock = String(mode).startsWith('ready');
    const isPointLocked = String(mode).startsWith('locked_') || String(mode).startsWith('milestone_');

    // Subtle dark recessed stall fill
    ctx.fillStyle =
      mode === 'vip'
        ? 'rgba(251, 191, 36, 0.09)'
        : mode === 'active'
        ? 'rgba(56, 189, 248, 0.08)'
        : isReadyToUnlock
        ? 'rgba(34, 197, 94, 0.14)'
        : 'rgba(15, 23, 42, 0.45)';
    ctx.fillRect(26, 28, 204, 456);

    const strokeColor =
      mode === 'vip'
        ? '#fbbf24'
        : mode === 'active'
        ? '#7dd3fc'
        : isReadyToUnlock
        ? '#4ade80'
        : 'rgba(100, 116, 139, 0.52)';

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = mode === 'vip' ? 14 : 11;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const padX = 22;
    const padY = 24;
    const w = 256 - padX * 2;
    const h = 512 - padY * 2;
    const r = 26;
    const gap = 58;

    // Left bracket
    ctx.beginPath();
    ctx.moveTo(128 - gap / 2, padY);
    ctx.lineTo(padX + r, padY);
    ctx.quadraticCurveTo(padX, padY, padX, padY + r);
    ctx.lineTo(padX, padY + h - r);
    ctx.quadraticCurveTo(padX, padY + h, padX + r, padY + h);
    ctx.lineTo(128 - gap / 2, padY + h);
    ctx.stroke();

    // Right bracket
    ctx.beginPath();
    ctx.moveTo(128 + gap / 2, padY);
    ctx.lineTo(padX + w - r, padY);
    ctx.quadraticCurveTo(padX + w, padY, padX + w, padY + r);
    ctx.lineTo(padX + w, padY + h - r);
    ctx.quadraticCurveTo(padX + w, padY + h, padX + w - r, padY + h);
    ctx.lineTo(128 + gap / 2, padY + h);
    ctx.stroke();

    if (mode === 'vip') {
      ctx.save();
      ctx.translate(128, 256);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = '#fbbf24';
      ctx.font = '900 72px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('VIP', 0, 0);
      ctx.restore();
    } else if (isReadyToUnlock) {
      // Glowing green '+' icon when the player has enough Coins/Points for the NEXT spot
      ctx.fillStyle = 'rgba(34, 197, 94, 0.26)';
      ctx.beginPath();
      ctx.arc(128, 212, 44, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(128 - 24, 212);
      ctx.lineTo(128 + 24, 212);
      ctx.moveTo(128, 212 - 24);
      ctx.lineTo(128, 212 + 24);
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.font = '900 32px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${pointCost} PTS`, 128, 294);

      ctx.fillStyle = '#86efac';
      ctx.font = '900 26px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('UNLOCK', 128, 336);
    } else if (isPointLocked) {
      // Gold padlock + 10 PTS / 30 PTS / 100 PTS badge
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(128, 190, 22, Math.PI, 0, false);
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.roundRect(96, 190, 64, 50, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(128, 215, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.font = '900 33px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${pointCost} PTS`, 128, 286);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '800 23px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('+1 SPOT', 128, 328);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Updates bay slot visual state for individual point-based unlocking (10 / 30 / 100 PTS).
   */
  updateBaySlotsVisuals(dockSlots) {
    for (let i = 0; i < this.bayMeshes.length; i++) {
      const bay = this.bayMeshes[i];
      const slotInfo = dockSlots[i];
      if (!slotInfo) continue;
      const pointCost =
        slotInfo.pointCost || slotInfo.requiredPoints || (i === 5 ? 10 : i === 6 ? 30 : 100);
      const desiredMode = slotInfo.isVip
        ? 'vip'
        : slotInfo.unlocked
        ? 'active'
        : slotInfo.canOpen
        ? `ready_${pointCost}`
        : `locked_${pointCost}`;
      if (bay.mode !== desiredMode || bay.pointCost !== pointCost) {
        bay.mode = desiredMode;
        bay.pointCost = pointCost;
        if (bay.planeMat.map) bay.planeMat.map.dispose();
        bay.planeMat.map = this._createBayTexture(desiredMode, pointCost);
        bay.planeMat.needsUpdate = true;
      }
    }
  }

  /**
   * Computes the world-space position & rotation of a parking bay in either 'vertical' or 'wide' layout.
   */
  getBayWorldPose(bayIndex) {
    const bay = this.bayMeshes[bayIndex];
    if (!bay) return { worldX: 0, worldZ: ROAD_CENTER_Z, worldRotY: BAY_ANGLE };
    return {
      worldX: bay.worldX,
      worldZ: bay.worldZ,
      worldRotY: bay.worldRotY,
    };
  }

  /**
   * Applies the active layout mode ('vertical' for phones vs 'wide' Z1 | Z2 | Z3 for TV/wide screens)
   * across Zone A (Z1), Zone B (Z2), and Zone C (Z3).
   */
  _applyLayoutModeTransform() {
    const isWide = this.layoutMode === 'wide';

    if (isWide) {
      // Z1 (Left Column): Rotate Zone A by +90 deg so the turning loop & feeder queue sit on the left
      // and the Boarding Gate faces right toward Z2
      this.zoneAGroup.position.set(-1.15, 0, 0);
      this.zoneAGroup.rotation.y = Math.PI / 2;

      // Z2 (Center Column): Rotate Zone B by +90 deg so the 8 angled parking bays form a vertical column in the center
      this.zoneBGroup.position.set(0.85, 0, 0);
      this.zoneBGroup.rotation.y = Math.PI / 2;
    } else {
      // Vertical Phone Mode: Z1 Top -> Z2 Middle -> Z3 Bottom
      this.zoneAGroup.position.set(0, 0, 0);
      this.zoneAGroup.rotation.y = 0;

      this.zoneBGroup.position.set(0, 0, 0);
      this.zoneBGroup.rotation.y = 0;
    }

    // Update each parking bay's local & world coordinates so index 0..7 is Left->Right in vertical mode
    // and Top->Bottom in wide mode
    for (let i = 0; i < this.bayMeshes.length; i++) {
      const bay = this.bayMeshes[i];
      if (isWide) {
        bay.x = -bay.localX;
        bay.group.position.set(bay.x, 0.025, bay.z);
        bay.worldX = 0.85 + bay.z; // -2.85 in world space
        bay.worldZ = bay.localX;   // -5.67 (top) to +5.67 (bottom)
        bay.worldRotY = Math.PI / 2 + BAY_ANGLE;
      } else {
        bay.x = bay.localX;
        bay.group.position.set(bay.x, 0.025, bay.z);
        bay.worldX = bay.localX;
        bay.worldZ = bay.z;
        bay.worldRotY = BAY_ANGLE;
      }
    }

    if (this.focusedBayIndex >= 0 && this.bayMeshes[this.focusedBayIndex] && this.bayFocusMesh) {
      const fb = this.bayMeshes[this.focusedBayIndex];
      this.bayFocusMesh.position.x = fb.x;
      this.bayFocusMesh.position.z = fb.z;
    }

    // Reposition Zone C (Z3) pad, rim, and any active buses when switching layout mode
    this.currentGridOriginX = getDynamicGridOriginX(this.currentGridW, this.layoutMode);
    this.currentGridOriginZ = isWide ? 0 : getDynamicGridOriginZ(this.currentGridH);

    if (this.lotRimMesh) {
      this.lotRimMesh.position.set(this.currentGridOriginX, -0.02, this.currentGridOriginZ);
    }
    if (this.lotPadMesh) {
      this.lotPadMesh.position.set(this.currentGridOriginX, 0.012, this.currentGridOriginZ);
    }

    for (const actor of this.busActors.values()) {
      if (actor.state === 'grid' || actor.state === 'bumping') {
        const posInfo = getBusWorldCenter(
          actor.data,
          this.currentGridW,
          this.currentGridH,
          this.currentGridOriginZ,
          this.currentGridOriginX
        );
        actor.baseX = posInfo.worldX;
        actor.baseZ = posInfo.worldZ;
        actor.baseRotY = posInfo.rotY;
        actor.group.position.set(posInfo.worldX, 0, posInfo.worldZ);
        actor.group.rotation.y = posInfo.rotY;
      } else if (actor.state === 'parked' && actor.bayIndex >= 0) {
        const pose = this.getBayWorldPose(actor.bayIndex);
        actor.group.position.set(pose.worldX, 0, pose.worldZ);
        actor.group.rotation.y = pose.worldRotY;
      }
    }

    if (this.focusedBusId) {
      this.setFocusedBus(this.focusedBusId);
    }
  }

  /**
   * Pre-allocates the 3D low-poly passenger pool (cylinder torso + sphere head + shadow)
   * so the 60Hz loop never allocates new meshes.
   */
  _initPassengerPools() {
    const bodyGeo = new THREE.CylinderGeometry(0.2, 0.23, 0.42, 12);
    const headGeo = new THREE.SphereGeometry(0.205, 12, 10);
    const shadowGeo = new THREE.CircleGeometry(0.25, 10);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x020617,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });

    const createPassengerNode = () => {
      const group = new THREE.Group();

      const shadow = new THREE.Mesh(shadowGeo, shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.01;
      group.add(shadow);

      const mat = this._getPassengerMaterial('purple');
      const body = new THREE.Mesh(bodyGeo, mat);
      body.position.y = 0.22;
      group.add(body);

      const head = new THREE.Mesh(headGeo, mat);
      head.position.y = 0.56;
      group.add(head);

      group.visible = false;
      return { group, body, head, colorName: 'purple' };
    };

    for (let i = 0; i < this.maxVisibleQueuePassengers; i++) {
      const node = createPassengerNode();
      this.passengerPoolGroup.add(node.group);
      this.queuePassengerNodes.push(node);
    }

    for (let i = 0; i < 36; i++) {
      const node = createPassengerNode();
      this.runnersGroup.add(node.group);
      this.runnerPool.push(node);
    }
  }

  _getPassengerMaterial(colorName) {
    const key = `pax_${colorName}`;
    if (this.materialCache.has(key)) return this.materialCache.get(key);
    const entry = COLOR_PALETTE_HEX[colorName] || COLOR_PALETTE_HEX.purple;
    const mat = new THREE.MeshPhongMaterial({
      color: entry.main,
      emissive: entry.dark,
      emissiveIntensity: 0.16,
      specular: 0x666666,
      shininess: 52,
    });
    this.materialCache.set(key, mat);
    return mat;
  }

  _setPassengerNodeColor(node, colorName) {
    if (node.colorName === colorName) return;
    node.colorName = colorName;
    const mat = this._getPassengerMaterial(colorName);
    node.body.material = mat;
    node.head.material = mat;
  }

  /**
   * Builds the high-contrast 3D selection rings AND the overhead Flipped Arrow (▼)
   * for TV Remote & Gamepad focus (Bus Grid + Parking Bays).
   * The overhead flipped arrow stays clearly visible even when a vehicle is surrounded by tall buses.
   */
  _buildSelectionRings() {
    const focusGroup = new THREE.Group();

    const outerRingGeo = new THREE.RingGeometry(0.92, 1.16, 36);
    outerRingGeo.rotateX(-Math.PI / 2);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    focusGroup.add(new THREE.Mesh(outerRingGeo, outerRingMat));

    const innerRingGeo = new THREE.RingGeometry(0.74, 0.86, 36);
    innerRingGeo.rotateX(-Math.PI / 2);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    focusGroup.add(new THREE.Mesh(innerRingGeo, innerRingMat));

    focusGroup.position.y = 0.045;
    focusGroup.visible = false;
    this.focusRingMesh = focusGroup;
    this.zoneCGroup.add(this.focusRingMesh);

    // Overhead 3D Flipped Downward-Pointing Pointer Arrow (▼) above the selected vehicle
    const arrowGroup = new THREE.Group();
    const arrowGoldMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const arrowCyanMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    // Downward cone tip (flipped 180 deg so apex points straight down at the vehicle roof)
    const tipGeo = new THREE.ConeGeometry(0.42, 0.56, 4);
    tipGeo.rotateX(Math.PI);
    const tipMesh = new THREE.Mesh(tipGeo, arrowGoldMat);
    tipMesh.position.y = 0.28;
    arrowGroup.add(tipMesh);

    // Upper vertical stem of the flipped arrow
    const stemGeo = new THREE.BoxGeometry(0.22, 0.44, 0.22);
    const stemMesh = new THREE.Mesh(stemGeo, arrowGoldMat);
    stemMesh.position.y = 0.72;
    arrowGroup.add(stemMesh);

    // Glowing cyan collar ring around the arrow
    const collarGeo = new THREE.TorusGeometry(0.34, 0.055, 8, 24);
    collarGeo.rotateX(Math.PI / 2);
    const collarMesh = new THREE.Mesh(collarGeo, arrowCyanMat);
    collarMesh.position.y = 0.52;
    arrowGroup.add(collarMesh);

    arrowGroup.position.y = 1.85;
    arrowGroup.visible = false;
    this.focusArrowGroup = arrowGroup;
    this.zoneCGroup.add(this.focusArrowGroup);

    // 3D Bay Focus Frame for unlocking '+' bays with TV Remote / Gamepad
    const bayFrameGeo = new THREE.RingGeometry(0.88, 1.12, 4);
    bayFrameGeo.rotateZ(Math.PI / 4);
    bayFrameGeo.rotateX(-Math.PI / 2);
    bayFrameGeo.scale(0.85, 1, 1.55);
    const bayFrameMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    this.bayFocusMesh = new THREE.Mesh(bayFrameGeo, bayFrameMat);
    this.bayFocusMesh.position.y = 0.06;
    this.bayFocusMesh.rotation.y = BAY_ANGLE;
    this.bayFocusMesh.visible = false;
    this.zoneBGroup.add(this.bayFocusMesh);
  }

  /**
   * Highlights a parking bay in Zone B when navigated to via TV Remote / Gamepad.
   */
  setFocusedBay(bayIndex) {
    this.focusedBayIndex = bayIndex;
    if (bayIndex === null || bayIndex < 0 || !this.bayMeshes[bayIndex]) {
      if (this.bayFocusMesh) this.bayFocusMesh.visible = false;
      return;
    }
    const bay = this.bayMeshes[bayIndex];
    this.bayFocusMesh.visible = true;
    this.bayFocusMesh.position.x = bay.x;
    this.bayFocusMesh.position.z = bay.z;
  }

  /**
   * Builds a stage's 3D bus meshes in Zone C on a textured Basalt Paver Grid.
   */
  buildStageBuses(stage) {
    for (const actor of this.busActors.values()) {
      this.zoneCGroup.remove(actor.group);
    }
    this.busActors.clear();
    this.busClickProxies = [];
    this.headlightMaterials = [];
    this.activeRunners = [];
    for (let i = 0; i < this.runnerPool.length; i++) {
      this.runnerPool[i].group.visible = false;
    }

    const gridW = stage.grid.width;
    const gridH = stage.grid.height;
    this.currentGridW = gridW;
    this.currentGridH = gridH;
    this.currentGridOriginX = getDynamicGridOriginX(gridW, this.layoutMode);
    this.currentGridOriginZ = this.layoutMode === 'wide' ? 0 : getDynamicGridOriginZ(gridH);

    if (this.lotPadMesh) {
      this.zoneCGroup.remove(this.lotPadMesh);
      if (this.lotPadMat?.map) this.lotPadMat.map.dispose();
    }
    if (this.lotRimMesh) {
      this.zoneCGroup.remove(this.lotRimMesh);
    }

    const padW = gridW * CELL_SIZE;
    const padH = gridH * CELL_SIZE;

    const rimGeo = new THREE.BoxGeometry(padW + 0.55, 0.06, padH + 0.55);
    const rimMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    this.lotRimMesh = new THREE.Mesh(rimGeo, rimMat);
    this.lotRimMesh.position.set(this.currentGridOriginX, -0.02, this.currentGridOriginZ);
    this.zoneCGroup.add(this.lotRimMesh);

    const padGeo = new THREE.PlaneGeometry(padW, padH);
    const paverTex = this._createLotGridPaverTexture(gridW, gridH);
    const preset = TIME_OF_DAY_PRESETS[this.currentTimePreset] || TIME_OF_DAY_PRESETS.night;
    this.lotPadMat = new THREE.MeshLambertMaterial({
      color: preset.paverTint,
      map: paverTex,
    });
    this.lotPadMesh = new THREE.Mesh(padGeo, this.lotPadMat);
    this.lotPadMesh.rotation.x = -Math.PI / 2;
    this.lotPadMesh.position.set(this.currentGridOriginX, 0.012, this.currentGridOriginZ);
    this.zoneCGroup.add(this.lotPadMesh);

    for (let i = 0; i < stage.buses.length; i++) {
      this._spawnSingleBusActor(stage.buses[i], gridW, gridH);
    }

    this.resize();
  }

  _spawnSingleBusActor(busData, gridW = this.currentGridW, gridH = this.currentGridH) {
    const posInfo = getBusWorldCenter(
      busData,
      gridW,
      gridH,
      this.currentGridOriginZ,
      this.currentGridOriginX
    );
    const busGroup = this._createCompositeBusMesh(busData);

    busGroup.position.set(posInfo.worldX, 0, posInfo.worldZ);
    busGroup.rotation.y = posInfo.rotY;

    this.zoneCGroup.add(busGroup);

    const actor = {
      id: busData.id,
      data: busData,
      group: busGroup,
      state: 'grid',
      baseX: posInfo.worldX,
      baseZ: posInfo.worldZ,
      baseRotY: posInfo.rotY,
      roofHeight: busGroup.userData?.roofHeight || 0.96,
      bumpTimer: 0,
      shakeTimer: 0,
      waypoints: [],
      waypointIdx: 0,
      bayIndex: -1,
      remainingCapacity: busData.capacity,
      boardedCount: 0,
      bounceTimer: 0,
    };
    this.busActors.set(busData.id, actor);
    this.syncBusMechanicState(busData.id);
    return actor;
  }

  /**
   * Spawns the reserve vehicle from an Underground Tunnel ('tunnel_spawner') onto the grid.
   */
  spawnTunnelReserveBus(busData) {
    const actor = this._spawnSingleBusActor(busData, this.currentGridW, this.currentGridH);
    actor.bounceTimer = 0.25;
    return actor;
  }

  /**
   * Dynamically recolors an existing 3D bus actor (used by 1-button Dock-Full Continue
   * and Dual-Color Coach mid-boarding color transition).
   */
  recolorBusActor(busId, newColorName) {
    const actor = this.busActors.get(busId);
    if (!actor) return false;
    const palette = COLOR_PALETTE_HEX[newColorName] || COLOR_PALETTE_HEX.purple;
    actor.data.color = newColorName;
    if (actor.group.userData?.chassisMat) {
      actor.group.userData.chassisMat.color.setHex(palette.dark);
    }
    if (actor.group.userData?.bodyMat) {
      actor.group.userData.bodyMat.color.setHex(palette.main);
      actor.group.userData.bodyMat.emissive.setHex(palette.dark);
    }
    if (actor.group.userData?.rearBodyMat) {
      actor.group.userData.rearBodyMat.color.setHex(palette.main);
      actor.group.userData.rearBodyMat.emissive.setHex(palette.dark);
    }
    if (actor.group.userData?.roofCapMat) {
      actor.group.userData.roofCapMat.color.setHex(palette.light);
      actor.group.userData.roofCapMat.emissive.setHex(palette.main);
    }
    actor.bounceTimer = 0.22;
    return true;
  }

  /**
   * Synchronizes the 3D mechanic attachments on a vehicle with its live `bus.mechanicState`.
   */
  syncBusMechanicState(busId) {
    const actor = this.busActors.get(busId);
    if (!actor) return;
    const bus = actor.data;
    const ud = actor.group.userData || {};
    const st = bus.mechanicState || {};

    if (bus.mechanic === 'mystery_tint') {
      const revealed = Boolean(st.revealed);
      const palette = COLOR_PALETTE_HEX[bus.color] || COLOR_PALETTE_HEX.purple;
      if (ud.bodyMat) {
        ud.bodyMat.color.setHex(revealed ? palette.main : 0x1e293b);
        ud.bodyMat.emissive.setHex(revealed ? palette.dark : 0x0f172a);
      }
      if (ud.roofCapMat) {
        ud.roofCapMat.color.setHex(revealed ? palette.light : 0x334155);
      }
      if (ud.mysteryGroup) {
        ud.mysteryGroup.visible = !revealed;
      }
    } else if (bus.mechanic === 'traffic_light') {
      const isGreen = st.green !== false;
      if (ud.signalGreenMat) {
        ud.signalGreenMat.color.setHex(isGreen ? 0x22c55e : 0x14532d);
      }
      if (ud.signalRedMat) {
        ud.signalRedMat.color.setHex(!isGreen ? 0xef4444 : 0x450a0a);
      }
    } else if (bus.mechanic === 'vip_rope') {
      const rem = st.ropesRemaining ?? 0;
      if (ud.ropeGroup) {
        ud.ropeGroup.visible = rem > 0;
      }
    } else if (bus.mechanic === 'sleeping_driver') {
      const awake = Boolean(st.awake);
      if (ud.zzzGroup) {
        ud.zzzGroup.visible = !awake;
      }
    } else if (bus.mechanic === 'direction_flipper') {
      const posInfo = getBusWorldCenter(
        bus,
        this.currentGridW,
        this.currentGridH,
        this.currentGridOriginZ,
        this.currentGridOriginX
      );
      actor.baseX = posInfo.worldX;
      actor.baseZ = posInfo.worldZ;
      actor.baseRotY = posInfo.rotY;
      if (actor.state === 'grid') {
        actor.group.position.set(posInfo.worldX, 0, posInfo.worldZ);
        actor.group.rotation.y = posInfo.rotY;
      }
    } else if (bus.mechanic === 'express_bonus') {
      if (ud.expressGroup) {
        ud.expressGroup.visible = (st.movesRemaining ?? 0) > 0 && actor.state === 'grid';
      }
    } else if (bus.mechanic === 'lift_barrier') {
      if (ud.barrierArm) {
        ud.barrierArm.rotation.z = st.gateOpen ? Math.PI * 0.44 : 0;
      }
    }
  }

  /**
   * Builds a rich, detailed multi-part 3D vehicle mesh for the 4 vehicle classes:
   * 1. 'taxi'       (capacity: 3,  length: 2) — Sedan with hood, trunk, cabin greenhouse, checkered stripe & TAXI sign
   * 2. 'minibus'    (capacity: 15, length: 2) — High-roof shuttle van with panoramic windows, sliding door & roof AC
   * 3. 'bus'        (capacity: 25, length: 3) — Full-size city transit coach with LED route header, 5 window bays & 6 wheels
   * 4. 'double_bus' (capacity: 40, length: 3) — Towering double-decker bus with lower/upper decks, beltline & 6 wheels
   */
  _createCompositeBusMesh(busData) {
    const vType = busData.type || 'bus';
    const L = busData.length || (vType === 'bus' || vType === 'double_bus' ? 3 : 2);
    const { meshWidth, meshLength } = getBusMeshDimensions(L);
    const palette = COLOR_PALETTE_HEX[busData.color] || COLOR_PALETTE_HEX.purple;
    const secondaryPalette = busData.secondaryColor
      ? COLOR_PALETTE_HEX[busData.secondaryColor] || palette
      : null;

    const meshHeight =
      vType === 'double_bus'
        ? 1.44
        : vType === 'bus'
        ? 0.98
        : vType === 'minibus'
        ? 0.86
        : 0.68; // taxi

    const group = new THREE.Group();

    // 1. Soft dark alpha contact drop-shadow plane underneath
    const shadowGeo = new THREE.PlaneGeometry(meshWidth * 1.18, meshLength * 1.14);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x020617,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.018;
    group.add(shadowMesh);

    // 2. Lower darker chassis skirt / heavy bumpers
    const chassisGeo = new THREE.BoxGeometry(meshWidth * 1.0, 0.22, meshLength * 0.99);
    const chassisMat = new THREE.MeshLambertMaterial({ color: palette.dark });
    const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
    chassisMesh.position.y = 0.19;
    group.add(chassisMesh);

    // Front & Rear metallic bumper bars
    const bumperMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const frontBumper = new THREE.Mesh(
      new THREE.BoxGeometry(meshWidth * 1.02, 0.12, 0.08),
      bumperMat
    );
    frontBumper.position.set(0, 0.17, -meshLength * 0.49);
    group.add(frontBumper);

    const rearBumper = new THREE.Mesh(
      new THREE.BoxGeometry(meshWidth * 1.02, 0.12, 0.08),
      bumperMat
    );
    rearBumper.position.set(0, 0.17, meshLength * 0.49);
    group.add(rearBumper);

    // Shared materials
    const bodyMat = new THREE.MeshPhongMaterial({
      color: palette.main,
      emissive: palette.dark,
      emissiveIntensity: 0.15,
      specular: 0x888888,
      shininess: 64,
    });
    let rearBodyMat = null;
    if (busData.mechanic === 'dual_color' && secondaryPalette) {
      rearBodyMat = new THREE.MeshPhongMaterial({
        color: secondaryPalette.main,
        emissive: secondaryPalette.dark,
        emissiveIntensity: 0.15,
        specular: 0x888888,
        shininess: 64,
      });
    }

    const roofCapMat = new THREE.MeshPhongMaterial({
      color: palette.light,
      emissive: palette.main,
      emissiveIntensity: 0.1,
      specular: 0x999999,
      shininess: 70,
    });

    const glassMat = new THREE.MeshPhongMaterial({
      color: 0x0f172a,
      emissive: 0x1e293b,
      emissiveIntensity: 0.28,
      specular: 0xbae6fd,
      shininess: 98,
    });

    const trimMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
    const goldTrimMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

    // 3. Vehicle Class-Specific Bodywork & Detailing
    if (vType === 'taxi') {
      // TAXI (Capacity 3): Sleek 3-Box Sedan with Hood, Cabin Greenhouse, Trunk, Side Checkers & Glowing TAXI Sign
      const lowerHullGeo = new THREE.BoxGeometry(meshWidth * 0.98, 0.26, meshLength * 0.95);
      const lowerHull = new THREE.Mesh(lowerHullGeo, bodyMat);
      lowerHull.position.y = 0.34;
      group.add(lowerHull);

      // Cabin greenhouse (centered slightly rear of front hood)
      const cabinLen = meshLength * 0.54;
      const cabinGeo = new THREE.BoxGeometry(meshWidth * 0.86, 0.25, cabinLen);
      const cabinMesh = new THREE.Mesh(cabinGeo, roofCapMat);
      cabinMesh.position.set(0, 0.56, 0.04);
      group.add(cabinMesh);

      // Front & rear sloped windshields + side cabin windows
      const taxiWindshield = new THREE.Mesh(
        new THREE.BoxGeometry(meshWidth * 0.78, 0.21, 0.07),
        glassMat
      );
      taxiWindshield.position.set(0, 0.56, 0.04 - cabinLen * 0.49);
      group.add(taxiWindshield);

      const taxiRearGlass = new THREE.Mesh(
        new THREE.BoxGeometry(meshWidth * 0.76, 0.2, 0.07),
        glassMat
      );
      taxiRearGlass.position.set(0, 0.56, 0.04 + cabinLen * 0.49);
      group.add(taxiRearGlass);

      const taxiSideGlass = new THREE.Mesh(
        new THREE.BoxGeometry(meshWidth * 0.89, 0.19, cabinLen * 0.82),
        glassMat
      );
      taxiSideGlass.position.set(0, 0.56, 0.04);
      group.add(taxiSideGlass);

      // Iconic Yellow Checkered Taxi Side Trim Band
      const taxiStripe = new THREE.Mesh(
        new THREE.BoxGeometry(meshWidth * 1.01, 0.055, meshLength * 0.88),
        goldTrimMat
      );
      taxiStripe.position.set(0, 0.36, 0);
      group.add(taxiStripe);

      // Illuminated Yellow 'TAXI' Roof Light Box
      const signBase = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.13, 0.22),
        goldTrimMat
      );
      signBase.position.set(0, meshHeight + 0.06, -0.05);
      group.add(signBase);
    } else if (vType === 'double_bus') {
      // DOUBLE BUS (Capacity 40): Towering Two-Deck Coach with Lower & Upper Window Bays + Gold Mid-Deck Beltline
      const hullH = meshHeight - 0.22;
      if (rearBodyMat) {
        const frontHalf = new THREE.Mesh(
          new THREE.BoxGeometry(meshWidth, hullH, meshLength * 0.475),
          bodyMat
        );
        frontHalf.position.set(0, 0.22 + hullH / 2, -meshLength * 0.238);
        group.add(frontHalf);

        const rearHalf = new THREE.Mesh(
          new THREE.BoxGeometry(meshWidth, hullH, meshLength * 0.475),
          rearBodyMat
        );
        rearHalf.position.set(0, 0.22 + hullH / 2, meshLength * 0.238);
        group.add(rearHalf);
      } else {
        const bodyMesh = new THREE.Mesh(
          new THREE.BoxGeometry(meshWidth, hullH, meshLength * 0.95),
          bodyMat
        );
        bodyMesh.position.y = 0.22 + hullH / 2;
        group.add(bodyMesh);
      }

      // Rounded upper roof cap
      const roofCapMesh = new THREE.Mesh(
        new THREE.BoxGeometry(meshWidth * 0.9, 0.09, meshLength * 0.9),
        roofCapMat
      );
      roofCapMesh.position.y = meshHeight + 0.035;
      group.add(roofCapMesh);

      // Lower-deck front windshield & side windows
      const lowerWindshield = new THREE.Mesh(
        new THREE.BoxGeometry(meshWidth * 0.86, 0.32, 0.08),
        glassMat
      );
      lowerWindshield.position.set(0, 0.56, -meshLength * 0.46);
      group.add(lowerWindshield);

      const lowerSideWin = new THREE.Mesh(
        new THREE.BoxGeometry(meshWidth * 1.018, 0.28, meshLength * 0.78),
        glassMat
      );
      lowerSideWin.position.set(0, 0.56, 0.02);
      group.add(lowerSideWin);

      // Mid-deck cream/gold separation beltline
      const midBelt = new THREE.Mesh(
        new THREE.BoxGeometry(meshWidth * 1.025, 0.065, meshLength * 0.96),
        goldTrimMat
      );
      midBelt.position.set(0, 0.84, 0);
      group.add(midBelt);

      // Upper-deck panoramic front observation window & side windows
      const upperWindshield = new THREE.Mesh(
        new THREE.BoxGeometry(meshWidth * 0.86, 0.32, 0.08),
        glassMat
      );
      upperWindshield.position.set(0, 1.16, -meshLength * 0.46);
      group.add(upperWindshield);

      const upperSideWin = new THREE.Mesh(
        new THREE.BoxGeometry(meshWidth * 1.018, 0.3, meshLength * 0.82),
        glassMat
      );
      upperSideWin.position.set(0, 1.16, 0);
      group.add(upperSideWin);

      // Vertical window mullions for realistic multi-bay double-decker look
      for (let m = -2; m <= 2; m++) {
        const pillar = new THREE.Mesh(
          new THREE.BoxGeometry(meshWidth * 1.03, hullH * 0.86, 0.06),
          bodyMat
        );
        pillar.position.set(0, 0.24 + hullH * 0.43, m * (meshLength * 0.16));
        group.add(pillar);
      }

      // Twin rooftop HVAC pods
      [-0.75, 0.75].forEach((oz) => {
        const acPod = new THREE.Mesh(
          new THREE.BoxGeometry(meshWidth * 0.54, 0.08, 0.48),
          trimMat
        );
        acPod.position.set(0, meshHeight + 0.09, oz);
        group.add(acPod);
      });
    } else {
      // MINIBUS (Capacity 15, Length 2) & CITY BUS (Capacity 25, Length 3)
      const hullH = meshHeight - 0.2;
      if (rearBodyMat) {
        const frontHalf = new THREE.Mesh(
          new THREE.BoxGeometry(meshWidth, hullH, meshLength * 0.475),
          bodyMat
        );
        frontHalf.position.set(0, 0.22 + hullH / 2, -meshLength * 0.238);
        group.add(frontHalf);

        const rearHalf = new THREE.Mesh(
          new THREE.BoxGeometry(meshWidth, hullH, meshLength * 0.475),
          rearBodyMat
        );
        rearHalf.position.set(0, 0.22 + hullH / 2, meshLength * 0.238);
        group.add(rearHalf);
      } else {
        const bodyMesh = new THREE.Mesh(
          new THREE.BoxGeometry(meshWidth, hullH, meshLength * 0.95),
          bodyMat
        );
        bodyMesh.position.y = 0.22 + hullH / 2;
        group.add(bodyMesh);
      }

      const roofCapMesh = new THREE.Mesh(
        new THREE.BoxGeometry(meshWidth * 0.88, 0.1, meshLength * 0.88),
        roofCapMat
      );
      roofCapMesh.position.y = meshHeight + 0.04;
      group.add(roofCapMesh);

      // Front windshield + side windows
      const windshieldMesh = new THREE.Mesh(
        new THREE.BoxGeometry(meshWidth * 0.84, meshHeight * 0.36, 0.08),
        glassMat
      );
      windshieldMesh.position.set(0, meshHeight * 0.66, -meshLength * 0.46);
      group.add(windshieldMesh);

      const sideWinMesh = new THREE.Mesh(
        new THREE.BoxGeometry(meshWidth * 1.015, meshHeight * 0.32, meshLength * 0.74),
        glassMat
      );
      sideWinMesh.position.set(0, meshHeight * 0.66, 0.03);
      group.add(sideWinMesh);

      // Metallic beltline side trim + window pillars + rooftop AC pod
      const sideBelt = new THREE.Mesh(
        new THREE.BoxGeometry(meshWidth * 1.02, 0.045, meshLength * 0.92),
        trimMat
      );
      sideBelt.position.set(0, 0.42, 0);
      group.add(sideBelt);

      const pillarCount = vType === 'bus' ? 4 : 2;
      for (let p = 0; p < pillarCount; p++) {
        const pz = ((p - (pillarCount - 1) / 2) * (meshLength * 0.62)) / Math.max(1, pillarCount - 1);
        const pillar = new THREE.Mesh(
          new THREE.BoxGeometry(meshWidth * 1.025, meshHeight * 0.34, 0.055),
          bodyMat
        );
        pillar.position.set(0, meshHeight * 0.66, pz);
        group.add(pillar);
      }

      // Rooftop HVAC unit(s)
      const acPod = new THREE.Mesh(
        new THREE.BoxGeometry(meshWidth * 0.56, 0.09, vType === 'bus' ? 0.68 : 0.46),
        trimMat
      );
      acPod.position.set(0, meshHeight + 0.09, -meshLength * 0.18);
      group.add(acPod);

      if (vType === 'bus') {
        // Illuminated LED Route Header Board above front windshield
        const routeBoard = new THREE.Mesh(
          new THREE.BoxGeometry(meshWidth * 0.64, 0.09, 0.06),
          goldTrimMat
        );
        routeBoard.position.set(0, meshHeight * 0.9, -meshLength * 0.47);
        group.add(routeBoard);
      }
    }

    // Side Mirrors (Left & Right at front cab)
    [-1, 1].forEach((side) => {
      const mirror = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.12, 0.08),
        bumperMat
      );
      mirror.position.set(side * (meshWidth * 0.54), meshHeight * 0.58, -meshLength * 0.42);
      group.add(mirror);
    });

    // Front headlights & rear brake lights
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const taillightMat = new THREE.MeshBasicMaterial({ color: 0xf87171 });
    const lightGeo = new THREE.BoxGeometry(0.18, 0.1, 0.06);

    const hlLeft = new THREE.Mesh(lightGeo, headlightMat);
    hlLeft.position.set(-meshWidth * 0.3, 0.28, -meshLength * 0.475);
    group.add(hlLeft);

    const hlRight = new THREE.Mesh(lightGeo, headlightMat);
    hlRight.position.set(meshWidth * 0.3, 0.28, -meshLength * 0.475);
    group.add(hlRight);

    // Dynamic Sunset/Night Headlight Floor Beams (projecting forward in -Z)
    const beamConeMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: this.headlightOpacity,
      visible: this.headlightOpacity > 0.01,
      depthWrite: false,
    });
    this.headlightMaterials.push(beamConeMat);
    const beamGeo = new THREE.PlaneGeometry(meshWidth * 0.88, 1.15);
    const beamMesh = new THREE.Mesh(beamGeo, beamConeMat);
    beamMesh.rotation.x = -Math.PI / 2;
    beamMesh.position.set(0, 0.026, -meshLength * 0.48 - 0.56);
    group.add(beamMesh);

    const tlLeft = new THREE.Mesh(lightGeo, taillightMat);
    tlLeft.position.set(-meshWidth * 0.3, 0.28, meshLength * 0.475);
    group.add(tlLeft);

    const tlRight = new THREE.Mesh(lightGeo, taillightMat);
    tlRight.position.set(meshWidth * 0.3, 0.28, meshLength * 0.475);
    group.add(tlRight);

    // Wheels (4 wheels for L=2 taxi/minibus, 6 wheels with dual rear axles for L=3 bus/double_bus)
    const wheelGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.14, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x090d16 });
    const hubGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.15, 8);
    hubGeo.rotateZ(Math.PI / 2);

    const wheelXOffset = meshWidth * 0.49;
    const zOffsets =
      L >= 3
        ? [-meshLength * 0.32, meshLength * 0.16, meshLength * 0.34]
        : [-meshLength * 0.29, meshLength * 0.29];

    for (let zIdx = 0; zIdx < zOffsets.length; zIdx++) {
      const wz = zOffsets[zIdx];
      [-wheelXOffset, wheelXOffset].forEach((wx) => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.position.set(wx, 0.19, wz);
        group.add(wheel);

        const hub = new THREE.Mesh(hubGeo, trimMat);
        hub.position.set(wx, 0.19, wz);
        group.add(hub);
      });
    }

    // High-contrast Directional Arrow on the roof (points -Z in local bus space)
    const arrowPlaneGeo = new THREE.PlaneGeometry(meshWidth * 0.68, meshWidth * 0.86);
    const arrowMat = new THREE.MeshBasicMaterial({
      map: this._getRoofArrowTexture(),
      transparent: true,
      depthWrite: false,
    });
    const arrowMesh = new THREE.Mesh(arrowPlaneGeo, arrowMat);
    arrowMesh.rotation.x = -Math.PI / 2;
    arrowMesh.position.set(0, meshHeight + 0.098, 0.06);
    group.add(arrowMesh);

    group.userData = {
      chassisMat,
      bodyMat,
      rearBodyMat,
      roofCapMat,
      roofHeight: meshHeight,
    };

    // Attach 3D Mechanic Prop if this vehicle carries the level's active mechanic
    if (busData.mechanic) {
      this._attachMechanic3DProps(group, busData, meshWidth, meshHeight, meshLength);
    }

    // Invisible click proxy box for instant raycasting
    const proxyGeo = new THREE.BoxGeometry(meshWidth * 1.06, meshHeight + 0.35, meshLength * 1.04);
    const proxyMesh = new THREE.Mesh(
      proxyGeo,
      new THREE.MeshBasicMaterial({ visible: false })
    );
    proxyMesh.position.y = (meshHeight + 0.25) / 2;
    proxyMesh.userData = { busId: busData.id };
    group.add(proxyMesh);
    this.busClickProxies.push(proxyMesh);

    return group;
  }

  /**
   * Builds distinct 3D visual attachments for the 10 progressive stage mechanics.
   */
  _attachMechanic3DProps(group, busData, meshWidth, meshHeight, meshLength) {
    const mech = busData.mechanic;
    const ud = group.userData;

    if (mech === 'mystery_tint') {
      const mGroup = new THREE.Group();
      const qBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.46, 0.46),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
      );
      qBox.position.set(0, meshHeight + 0.38, 0);
      qBox.rotation.y = Math.PI / 4;
      mGroup.add(qBox);
      group.add(mGroup);
      ud.mysteryGroup = mGroup;
    } else if (mech === 'traffic_light') {
      const sigGroup = new THREE.Group();
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.56, 0.26),
        new THREE.MeshLambertMaterial({ color: 0x0f172a })
      );
      box.position.set(0, meshHeight + 0.36, -meshLength * 0.25);
      sigGroup.add(box);

      const redMat = new THREE.MeshBasicMaterial({ color: 0x450a0a });
      const greenMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
      const redSphere = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), redMat);
      redSphere.position.set(0, meshHeight + 0.47, -meshLength * 0.25);
      sigGroup.add(redSphere);

      const greenSphere = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), greenMat);
      greenSphere.position.set(0, meshHeight + 0.25, -meshLength * 0.25);
      sigGroup.add(greenSphere);

      group.add(sigGroup);
      ud.signalRedMat = redMat;
      ud.signalGreenMat = greenMat;
    } else if (mech === 'vip_rope') {
      const ropeGroup = new THREE.Group();
      const postMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const velvetMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });

      [-meshWidth * 0.56, meshWidth * 0.56].forEach((rx) => {
        [-meshLength * 0.42, meshLength * 0.42].forEach((rz) => {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.72, 8), postMat);
          post.position.set(rx, 0.36, rz);
          ropeGroup.add(post);
        });
      });

      const frontRope = new THREE.Mesh(
        new THREE.BoxGeometry(meshWidth * 1.15, 0.08, 0.08),
        velvetMat
      );
      frontRope.position.set(0, 0.62, -meshLength * 0.42);
      ropeGroup.add(frontRope);

      const topRope = new THREE.Mesh(
        new THREE.BoxGeometry(meshWidth * 1.06, 0.08, 0.14),
        velvetMat
      );
      topRope.position.set(0, meshHeight + 0.14, 0);
      ropeGroup.add(topRope);

      group.add(ropeGroup);
      ud.ropeGroup = ropeGroup;
    } else if (mech === 'tunnel_spawner') {
      const tunnelGroup = new THREE.Group();
      const archMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
      const glowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

      const archTop = new THREE.Mesh(
        new THREE.BoxGeometry(meshWidth * 1.24, 0.22, 0.44),
        archMat
      );
      archTop.position.set(0, meshHeight + 0.18, meshLength * 0.46);
      tunnelGroup.add(archTop);

      const archGlow = new THREE.Mesh(
        new THREE.BoxGeometry(meshWidth * 1.1, 0.09, 0.48),
        glowMat
      );
      archGlow.position.set(0, meshHeight + 0.31, meshLength * 0.46);
      tunnelGroup.add(archGlow);

      group.add(tunnelGroup);
      ud.tunnelGroup = tunnelGroup;
    } else if (mech === 'tow_truck') {
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      const lightbar = new THREE.Mesh(
        new THREE.BoxGeometry(meshWidth * 0.72, 0.16, 0.24),
        beaconMat
      );
      lightbar.position.set(0, meshHeight + 0.16, -0.15);
      group.add(lightbar);

      const boomArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.14, 0.85),
        new THREE.MeshLambertMaterial({ color: 0xca8a04 })
      );
      boomArm.position.set(0, meshHeight + 0.15, meshLength * 0.24);
      boomArm.rotation.x = 0.45;
      group.add(boomArm);
      ud.towBeaconMat = beaconMat;
    } else if (mech === 'sleeping_driver') {
      const zzzGroup = new THREE.Group();
      const pillow = new THREE.Mesh(
        new THREE.BoxGeometry(0.52, 0.26, 0.32),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      pillow.position.set(0, meshHeight + 0.34, -meshLength * 0.22);
      zzzGroup.add(pillow);
      group.add(zzzGroup);
      ud.zzzGroup = zzzGroup;
    } else if (mech === 'direction_flipper') {
      const padMesh = new THREE.Mesh(
        new THREE.RingGeometry(0.55, 0.78, 24),
        new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          side: THREE.DoubleSide,
        })
      );
      padMesh.rotation.x = -Math.PI / 2;
      padMesh.position.y = 0.032;
      group.add(padMesh);
      ud.flipperPad = padMesh;
    } else if (mech === 'express_bonus') {
      const expGroup = new THREE.Group();
      const crown = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.26, 0),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
      );
      crown.position.set(0, meshHeight + 0.38, 0);
      expGroup.add(crown);
      group.add(expGroup);
      ud.expressGroup = expGroup;
    } else if (mech === 'lift_barrier') {
      const barrierPivot = new THREE.Group();
      barrierPivot.position.set(-meshWidth * 0.52, 0.52, -meshLength * 0.54);
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(meshWidth * 1.12, 0.12, 0.12),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
      );
      arm.position.set(meshWidth * 0.56, 0, 0);
      barrierPivot.add(arm);
      group.add(barrierPivot);
      ud.barrierArm = barrierPivot;
    }
  }

  _getRoofArrowTexture() {
    if (this.arrowTextures.has('up')) return this.arrowTextures.get('up');
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 256, 256);

    ctx.beginPath();
    ctx.moveTo(128, 28);
    ctx.lineTo(212, 118);
    ctx.lineTo(160, 118);
    ctx.lineTo(160, 224);
    ctx.lineTo(96, 224);
    ctx.lineTo(96, 118);
    ctx.lineTo(44, 118);
    ctx.closePath();

    ctx.lineJoin = 'round';
    ctx.lineWidth = 18;
    ctx.strokeStyle = 'rgba(9, 13, 22, 0.78)';
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    this.arrowTextures.set('up', tex);
    return tex;
  }

  /**
   * Triggers the Blocked Bus Bump Animation:
   * - Clicked bus lunges 0.35 units along its arrow vector and rebounds
   * - Blocking bus performs a quick tilt-shake
   */
  triggerBlockedBump(busId, blockerBusId) {
    const actor = this.busActors.get(busId);
    if (actor && actor.state === 'grid') {
      actor.state = 'bumping';
      actor.bumpTimer = 0.28;
    }
    if (blockerBusId) {
      const blocker = this.busActors.get(blockerBusId);
      if (blocker) {
        blocker.shakeTimer = 0.28;
      }
    }
  }

  /**
   * Drives a 0-passenger service vehicle ('tow_truck') straight off the grid along its exit vector
   * without occupying a parking bay.
   */
  triggerDirectServiceExit(busId, onGoneCallback) {
    const actor = this.busActors.get(busId);
    if (!actor) return;
    actor.state = 'departing';
    actor.onGone = onGoneCallback;
    const vec = DIR_VECTORS[actor.data.dir] || DIR_VECTORS.N;
    actor.waypoints = [
      {
        x: actor.group.position.x + vec.dx * 16.5,
        z: actor.group.position.z + vec.dz * 16.5,
        rotY: vec.rotY,
      },
    ];
    actor.waypointIdx = 0;
  }

  /**
   * Triggers the Unblocked Bus Waypoint Drive-to-Bay Animation for both 'vertical' and 'wide' layouts.
   */
  triggerDriveToBay(busId, bayIndex, gridWidth, gridHeight) {
    const actor = this.busActors.get(busId);
    const bay = this.bayMeshes[bayIndex];
    if (!actor || !bay) return;

    actor.state = 'driving';
    actor.bayIndex = bayIndex;

    const startX = actor.group.position.x;
    const startZ = actor.group.position.z;
    const dir = actor.data.dir;
    const pose = this.getBayWorldPose(bayIndex);

    const halfGridW = (gridWidth * CELL_SIZE) / 2 + 0.82;
    const halfGridH = (gridHeight * CELL_SIZE) / 2 + 0.85;
    const waypoints = [];

    if (this.layoutMode === 'wide') {
      const originX = this.currentGridOriginX || getDynamicGridOriginX(gridWidth, 'wide');
      const roadApproachX = -1.55;
      const topLaneZ = -halfGridH;
      const bottomLaneZ = halfGridH;
      const rightLaneX = originX + halfGridW;

      if (dir === 'W') {
        waypoints.push({ x: roadApproachX, z: startZ, rotY: Math.PI / 2 });
      } else if (dir === 'N') {
        waypoints.push({ x: startX, z: topLaneZ, rotY: 0 });
        waypoints.push({ x: roadApproachX, z: topLaneZ, rotY: Math.PI / 2 });
      } else if (dir === 'S') {
        waypoints.push({ x: startX, z: bottomLaneZ, rotY: Math.PI });
        waypoints.push({ x: roadApproachX, z: bottomLaneZ, rotY: Math.PI / 2 });
      } else {
        const laneZ = startZ <= 0 ? topLaneZ : bottomLaneZ;
        waypoints.push({ x: rightLaneX, z: startZ, rotY: -Math.PI / 2 });
        waypoints.push({
          x: rightLaneX,
          z: laneZ,
          rotY: laneZ < startZ ? 0 : Math.PI,
        });
        waypoints.push({ x: roadApproachX, z: laneZ, rotY: Math.PI / 2 });
      }

      waypoints.push({
        x: roadApproachX,
        z: pose.worldZ,
        rotY: pose.worldZ < startZ ? 0 : Math.PI,
      });
      waypoints.push({
        x: pose.worldX,
        z: pose.worldZ,
        rotY: pose.worldRotY,
      });
    } else {
      const roadApproachZ = ROAD_CENTER_Z + 1.15;

      if (dir === 'N') {
        waypoints.push({ x: startX, z: roadApproachZ, rotY: 0 });
        if (Math.abs(startX - pose.worldX) > 0.3) {
          waypoints.push({
            x: pose.worldX + 0.35,
            z: roadApproachZ,
            rotY: startX < pose.worldX ? -Math.PI / 2 : Math.PI / 2,
          });
        }
      } else if (dir === 'W') {
        const leftLaneX = Math.min(-halfGridW, startX - 1.1);
        waypoints.push({ x: leftLaneX, z: startZ, rotY: Math.PI / 2 });
        waypoints.push({ x: leftLaneX, z: roadApproachZ, rotY: 0 });
        waypoints.push({ x: pose.worldX + 0.35, z: roadApproachZ, rotY: -Math.PI / 2 });
      } else if (dir === 'E') {
        const rightLaneX = Math.max(halfGridW, startX + 1.1);
        waypoints.push({ x: rightLaneX, z: startZ, rotY: -Math.PI / 2 });
        waypoints.push({ x: rightLaneX, z: roadApproachZ, rotY: 0 });
        waypoints.push({ x: pose.worldX + 0.35, z: roadApproachZ, rotY: Math.PI / 2 });
      } else {
        const originZ = this.currentGridOriginZ || getDynamicGridOriginZ(gridHeight);
        const bottomLaneZ = originZ + halfGridH;
        const sideLaneX = startX <= 0 ? -halfGridW : halfGridW;
        waypoints.push({ x: startX, z: bottomLaneZ, rotY: Math.PI });
        waypoints.push({
          x: sideLaneX,
          z: bottomLaneZ,
          rotY: sideLaneX < startX ? Math.PI / 2 : -Math.PI / 2,
        });
        waypoints.push({ x: sideLaneX, z: roadApproachZ, rotY: 0 });
        waypoints.push({
          x: pose.worldX + 0.35,
          z: roadApproachZ,
          rotY: sideLaneX < pose.worldX ? -Math.PI / 2 : Math.PI / 2,
        });
      }

      waypoints.push({
        x: pose.worldX,
        z: pose.worldZ,
        rotY: pose.worldRotY,
      });
    }

    actor.waypoints = waypoints;
    actor.waypointIdx = 0;
  }

  /**
   * Triggers VIP / Heli-Lift animation that lifts a blocked or unblocked bus straight up and lands it in a bay.
   */
  triggerHeliLiftToBay(busId, bayIndex) {
    const actor = this.busActors.get(busId);
    const bay = this.bayMeshes[bayIndex];
    if (!actor || !bay) return;

    const pose = this.getBayWorldPose(bayIndex);
    actor.state = 'helilift';
    actor.bayIndex = bayIndex;
    actor.heliProgress = 0;
    actor.heliStartX = actor.group.position.x;
    actor.heliStartZ = actor.group.position.z;
    actor.heliTargetX = pose.worldX;
    actor.heliTargetZ = pose.worldZ;
    actor.heliTargetRotY = pose.worldRotY;
  }

  /**
   * Spawns a 3D passenger runner from the Boarding Door Ground Pad to a parked bus in Zone B.
   */
  spawnBoardingRunner(colorName, targetBusId, onArriveCallback) {
    const actor = this.busActors.get(targetBusId);
    if (!actor) {
      onArriveCallback?.();
      return;
    }

    let runnerNode = null;
    for (let i = 0; i < this.runnerPool.length; i++) {
      if (!this.runnerPool[i].group.visible) {
        runnerNode = this.runnerPool[i];
        break;
      }
    }

    if (!runnerNode) {
      onArriveCallback?.();
      return;
    }

    const gateOrigin = this.layoutMode === 'wide' ? GATE_POS_WIDE : GATE_POS;

    this._setPassengerNodeColor(runnerNode, colorName);
    runnerNode.group.visible = true;
    runnerNode.group.position.copy(gateOrigin);
    runnerNode.group.scale.set(1, 1, 1);

    this.queueVisualScroll += 0.25;

    this.activeRunners.push({
      node: runnerNode,
      targetBusId,
      progress: 0,
      startX: gateOrigin.x + (Math.random() - 0.5) * 0.35,
      startZ: gateOrigin.z + (Math.random() - 0.5) * 0.35,
      targetX: actor.group.position.x,
      targetZ: actor.group.position.z - (this.layoutMode === 'wide' ? 0 : 0.35),
      onArrive: onArriveCallback,
    });
  }

  /**
   * Triggers a full parked bus to pull out of its angled bay and depart off-screen.
   */
  triggerBusDeparture(busId, onGoneCallback) {
    const actor = this.busActors.get(busId);
    if (!actor) return;
    actor.state = 'departing';
    actor.onGone = onGoneCallback;

    if (this.layoutMode === 'wide') {
      actor.waypoints = [
        {
          x: -3.2,
          z: actor.group.position.z - 0.8,
          rotY: 0,
        },
        {
          x: -3.2,
          z: -16.5,
          rotY: 0,
        },
      ];
    } else {
      actor.waypoints = [
        {
          x: actor.group.position.x + 0.8,
          z: ROAD_CENTER_Z - 0.25,
          rotY: -Math.PI / 2,
        },
        {
          x: 16.5,
          z: ROAD_CENTER_Z - 0.25,
          rotY: -Math.PI / 2,
        },
      ];
    }
    actor.waypointIdx = 0;
  }

  /**
   * Returns the array of passengerQueue indices (0 <= idx < queueLen) that are currently
   * walking across the high-contrast Boarding Door Ground Pad (near uLoop = 0).
   * Passengers can ONLY board a parked vehicle when their circling row reaches this door zone!
   */
  getDoorGateEligibleIndices(queueLen) {
    if (queueLen <= 0) return [];
    const abreast = 5;
    const maxLoopRows = this.loopCapacityRows || 24;
    const activeLoopRows = Math.min(maxLoopRows, Math.max(1, Math.ceil(queueLen / abreast)));
    const maxLoopPassengers = Math.min(queueLen, activeLoopRows * abreast);

    // Door Ground Pad spans +/- 0.16 of the loop around uLoop = 0 (expanded slightly when few rows remain)
    const doorThreshold = activeLoopRows <= 4 ? 0.28 : 0.16;
    const eligibleRows = [];

    for (let r = 0; r < activeLoopRows; r++) {
      const uLoop = ((r / activeLoopRows) + this.loopTurnPhase) % 1.0;
      const distFromDoor = Math.min(uLoop, 1.0 - uLoop);
      if (distFromDoor <= doorThreshold) {
        eligibleRows.push({ rowIdx: r, distFromDoor });
      }
    }

    // Sort by closeness to the exact center of the Boarding Door Ground Pad
    eligibleRows.sort((a, b) => a.distFromDoor - b.distFromDoor);

    const eligibleIndices = [];
    for (let i = 0; i < eligibleRows.length; i++) {
      const baseIdx = eligibleRows[i].rowIdx * abreast;
      for (let c = 0; c < abreast; c++) {
        const pIdx = baseIdx + c;
        if (pIdx < maxLoopPassengers) {
          eligibleIndices.push(pIdx);
        }
      }
    }
    return eligibleIndices;
  }

  /**
   * Updates the 3D Passenger Queue positions in tightly packed rows of 5 abreast:
   * - Circle passengers revolve continuously around `this.loopCurve` and step across the
   *   Neon Emerald & Gold Boarding Door Ground Pad (`uLoop = 0`).
   * - Overflow passengers wait in line along `this.feederCurve`.
   */
  syncPassengerQueueVisuals(passengerQueue, elapsedSec) {
    const queueLen = passengerQueue.length;
    const abreast = 5;
    const maxLoopRows = this.loopCapacityRows || 24;
    const activeLoopRows = Math.min(maxLoopRows, Math.max(1, Math.ceil(queueLen / abreast)));

    const visualCount = Math.min(this.maxVisibleQueuePassengers, queueLen);

    for (let i = 0; i < this.maxVisibleQueuePassengers; i++) {
      const node = this.queuePassengerNodes[i];
      if (i >= visualCount) {
        node.group.visible = false;
        continue;
      }

      node.group.visible = true;
      const colorName = passengerQueue[i];
      this._setPassengerNodeColor(node, colorName);

      const rowIdx = Math.floor(i / abreast);
      const colIdx = i % abreast;

      let atDoorBoost = 0;
      if (rowIdx < activeLoopRows) {
        // Inside the Oval Circle: continuously revolves at a steady pace
        const uLoop = ((rowIdx / activeLoopRows) + this.loopTurnPhase) % 1.0;
        this.loopCurve.getPointAt(uLoop, _curvePt);
        this.loopCurve.getTangentAt(uLoop, _curveTan);

        const distFromDoor = Math.min(uLoop, 1.0 - uLoop);
        if (distFromDoor <= 0.14) {
          atDoorBoost = (1 - distFromDoor / 0.14) * 0.055;
        }
      } else {
        // Overflow Feeder Line: waits in line and steps forward as passengers board
        const feederRow = rowIdx - activeLoopRows + this.queueVisualScroll;
        const uFeeder = Math.min(0.985, 0.035 + feederRow * 0.042);
        this.feederCurve.getPointAt(uFeeder, _curvePt);
        this.feederCurve.getTangentAt(uFeeder, _curveTan);
      }

      _perpVec.set(-_curveTan.z, 0, _curveTan.x).normalize();
      const lateralOffset = (colIdx - (abreast - 1) / 2) * 0.34;

      const isTurning = rowIdx < activeLoopRows;
      const bobFreq = isTurning ? 8.6 : 4.5;
      const bobAmp = isTurning ? 0.032 : 0.014;
      const bob = Math.sin(elapsedSec * bobFreq + i * 0.7) * bobAmp;

      node.group.position.set(
        _curvePt.x + _perpVec.x * lateralOffset,
        _curvePt.y + Math.max(0, bob) + atDoorBoost,
        _curvePt.z + _perpVec.z * lateralOffset
      );
    }
  }

  /**
   * Updates both the 3D ground selection ring AND the overhead Flipped Arrow (▼)
   * around the focused vehicle in Zone C.
   */
  setFocusedBus(busId) {
    this.focusedBusId = busId;
    if (!busId || !this.busActors.has(busId)) {
      this.focusRingMesh.visible = false;
      if (this.focusArrowGroup) this.focusArrowGroup.visible = false;
      return;
    }
    const actor = this.busActors.get(busId);
    if (actor.state !== 'grid' && actor.state !== 'bumping') {
      this.focusRingMesh.visible = false;
      if (this.focusArrowGroup) this.focusArrowGroup.visible = false;
      return;
    }
    this.focusRingMesh.visible = true;
    this.focusRingMesh.position.x = actor.group.position.x;
    this.focusRingMesh.position.z = actor.group.position.z;

    if (this.focusArrowGroup) {
      this.focusArrowGroup.visible = true;
      this.focusArrowGroup.position.x = actor.group.position.x;
      this.focusArrowGroup.position.z = actor.group.position.z;
      this.focusArrowGroup.position.y = (actor.roofHeight || 0.98) + 0.65;
    }
  }

  /**
   * Raycasts normalized device coordinates (ndcX, ndcY) against buses in Zone C and bays in Zone B.
   */
  raycastTap(ndcX, ndcY) {
    this.ndcMouse.set(ndcX, ndcY);
    this.raycaster.setFromCamera(this.ndcMouse, this.camera);

    const busHits = this.raycaster.intersectObjects(this.busClickProxies, false);
    for (let i = 0; i < busHits.length; i++) {
      const busId = busHits[i].object.userData?.busId;
      const actor = this.busActors.get(busId);
      if (actor && (actor.state === 'grid' || actor.state === 'bumping')) {
        return { type: 'bus', busId };
      }
    }

    const bayHits = this.raycaster.intersectObjects(this.bayClickProxies, false);
    if (bayHits.length > 0) {
      const bayIndex = bayHits[0].object.userData?.bayIndex;
      if (bayIndex !== undefined) {
        return { type: 'bay', bayIndex };
      }
    }

    return null;
  }

  /**
   * Fixed 60Hz delta-time update for all 3D animations (zero allocations).
   */
  update(dt, passengerQueue, elapsedSec, onBusArrivedInBay) {
    // Advance the continuous steady rotation of the passenger queue circle
    this.loopTurnPhase = (this.loopTurnPhase + dt * 0.082) % 1.0;

    if (this.queueVisualScroll > 0.001) {
      this.queueVisualScroll *= Math.exp(-10 * dt);
      if (this.queueVisualScroll < 0.002) this.queueVisualScroll = 0;
    }

    this.syncPassengerQueueVisuals(passengerQueue, elapsedSec);

    // Pulse Door Ground Pad beacons
    if (this.doorBeaconMat) {
      const glow = Math.sin(elapsedSec * 6.0) > 0 ? 0x34d399 : 0x10b981;
      this.doorBeaconMat.color.setHex(glow);
    }

    // Update active boarding runners
    for (let i = this.activeRunners.length - 1; i >= 0; i--) {
      const r = this.activeRunners[i];
      r.progress += dt * 4.8;
      if (r.progress >= 1) {
        r.node.group.visible = false;
        r.onArrive?.();
        const targetBus = this.busActors.get(r.targetBusId);
        if (targetBus) {
          targetBus.bounceTimer = 0.14;
        }
        this.activeRunners.splice(i, 1);
      } else {
        const t = r.progress;
        const x = r.startX + (r.targetX - r.startX) * t;
        const z = r.startZ + (r.targetZ - r.startZ) * t;
        const jumpArc = Math.sin(t * Math.PI) * 0.55;
        const popScale = t > 0.75 ? 1 + (1 - t) * 1.4 : 1;
        r.node.group.position.set(x, 0.14 + jumpArc, z);
        r.node.group.scale.set(popScale, popScale, popScale);
      }
    }

    // Update all bus actors
    const driveSpeed = 20.0;
    for (const actor of this.busActors.values()) {
      const ud = actor.group.userData || {};
      if (ud.mysteryGroup && ud.mysteryGroup.visible) {
        ud.mysteryGroup.rotation.y = elapsedSec * 2.4;
      }
      if (ud.expressGroup && ud.expressGroup.visible) {
        ud.expressGroup.rotation.y = elapsedSec * 3.2;
      }
      if (ud.zzzGroup && ud.zzzGroup.visible) {
        ud.zzzGroup.position.y = Math.sin(elapsedSec * 4.5) * 0.08;
      }

      if (actor.shakeTimer > 0) {
        actor.shakeTimer = Math.max(0, actor.shakeTimer - dt);
        const shakeAngle = Math.sin(actor.shakeTimer * 48) * 0.12 * (actor.shakeTimer / 0.28);
        actor.group.rotation.z = shakeAngle;
      } else {
        actor.group.rotation.z = 0;
      }

      if (actor.bounceTimer > 0) {
        actor.bounceTimer = Math.max(0, actor.bounceTimer - dt);
        const s = 1 + Math.sin((actor.bounceTimer / 0.14) * Math.PI) * 0.09;
        actor.group.scale.set(s, 1 / s, s);
      } else {
        actor.group.scale.set(1, 1, 1);
      }

      if (actor.state === 'bumping') {
        actor.bumpTimer -= dt;
        const vec = DIR_VECTORS[actor.data.dir] || DIR_VECTORS.N;
        if (actor.bumpTimer <= 0) {
          actor.state = 'grid';
          actor.group.position.set(actor.baseX, 0, actor.baseZ);
          actor.group.rotation.x = 0;
        } else {
          const phase = 1 - actor.bumpTimer / 0.28;
          const lunge = Math.sin(phase * Math.PI) * 0.35;
          actor.group.position.x = actor.baseX + vec.dx * lunge;
          actor.group.position.z = actor.baseZ + vec.dz * lunge;
          actor.group.rotation.x = Math.sin(phase * Math.PI * 2) * 0.07;
        }
      } else if (actor.state === 'driving' || actor.state === 'departing') {
        const wp = actor.waypoints[actor.waypointIdx];
        if (!wp) continue;

        const dx = wp.x - actor.group.position.x;
        const dz = wp.z - actor.group.position.z;
        const dist = Math.hypot(dx, dz);
        const step = driveSpeed * dt;

        let diffRot = wp.rotY - actor.group.rotation.y;
        while (diffRot > Math.PI) diffRot -= Math.PI * 2;
        while (diffRot < -Math.PI) diffRot += Math.PI * 2;
        actor.group.rotation.y += diffRot * Math.min(1, dt * 16);

        if (dist <= step) {
          actor.group.position.x = wp.x;
          actor.group.position.z = wp.z;
          actor.group.rotation.y = wp.rotY;
          actor.waypointIdx++;

          if (actor.waypointIdx >= actor.waypoints.length) {
            if (actor.state === 'driving') {
              actor.state = 'parked';
              actor.bounceTimer = 0.16;
              onBusArrivedInBay?.(actor.id, actor.bayIndex);
            } else if (actor.state === 'departing') {
              actor.state = 'gone';
              actor.group.visible = false;
              actor.onGone?.(actor.id);
            }
          }
        } else {
          actor.group.position.x += (dx / dist) * step;
          actor.group.position.z += (dz / dist) * step;
        }
      } else if (actor.state === 'helilift') {
        actor.heliProgress += dt * 1.9;
        const targetRot =
          actor.heliTargetRotY !== undefined
            ? actor.heliTargetRotY
            : this.layoutMode === 'wide'
            ? Math.PI / 2 + BAY_ANGLE
            : BAY_ANGLE;
        if (actor.heliProgress >= 1) {
          actor.group.position.set(actor.heliTargetX, 0, actor.heliTargetZ);
          actor.group.rotation.y = targetRot;
          actor.state = 'parked';
          actor.bounceTimer = 0.18;
          onBusArrivedInBay?.(actor.id, actor.bayIndex);
        } else {
          const t = actor.heliProgress;
          const smooth = t * t * (3 - 2 * t);
          actor.group.position.x =
            actor.heliStartX + (actor.heliTargetX - actor.heliStartX) * smooth;
          actor.group.position.z =
            actor.heliStartZ + (actor.heliTargetZ - actor.heliStartZ) * smooth;
          actor.group.position.y = Math.sin(t * Math.PI) * 3.8;
          actor.group.rotation.y =
            actor.baseRotY + (targetRot - actor.baseRotY) * smooth;
        }
      }
    }

    // Pulse selection ring AND bob/rotate overhead Flipped Arrow (▼)
    if (this.focusRingMesh && this.focusRingMesh.visible && this.focusedBusId) {
      const focusedActor = this.busActors.get(this.focusedBusId);
      if (focusedActor && (focusedActor.state === 'grid' || focusedActor.state === 'bumping')) {
        this.focusRingMesh.position.x = focusedActor.group.position.x;
        this.focusRingMesh.position.z = focusedActor.group.position.z;
        const pulse = 1 + Math.sin(elapsedSec * 7.0) * 0.05;
        this.focusRingMesh.scale.set(pulse, 1, pulse);

        if (this.focusArrowGroup) {
          this.focusArrowGroup.visible = true;
          this.focusArrowGroup.position.x = focusedActor.group.position.x;
          this.focusArrowGroup.position.z = focusedActor.group.position.z;
          const baseRoof = focusedActor.roofHeight || 0.98;
          this.focusArrowGroup.position.y =
            baseRoof + 0.56 + Math.sin(elapsedSec * 7.5) * 0.16;
          this.focusArrowGroup.rotation.y = elapsedSec * 2.6;
        }
      } else {
        this.focusRingMesh.visible = false;
        if (this.focusArrowGroup) this.focusArrowGroup.visible = false;
      }
    }
  }

  /**
   * Computes 2D screen coordinates for parked buses' capacity badges in Zone B.
   */
  getParkedBusScreenBadges(viewportW, viewportH) {
    const badges = [];
    for (const actor of this.busActors.values()) {
      if (actor.state !== 'parked' || actor.remainingCapacity <= 0) continue;
      const rot = actor.group.rotation.y;
      _projVec.set(
        actor.group.position.x + Math.sin(rot) * 1.38,
        0.52,
        actor.group.position.z + Math.cos(rot) * 1.38
      );
      _projVec.project(this.camera);
      if (_projVec.z >= -1 && _projVec.z <= 1) {
        const sx = ((_projVec.x + 1) * 0.5) * viewportW;
        const sy = ((-_projVec.y + 1) * 0.5) * viewportH;
        const palette = COLOR_PALETTE_HEX[actor.data.color] || COLOR_PALETTE_HEX.purple;
        badges.push({
          id: actor.id,
          x: sx,
          y: sy,
          capacity: actor.remainingCapacity,
          cssColor: palette.css,
        });
      }
    }
    return badges;
  }

  /**
   * Computes 2D screen coordinates for the active mechanic badge on the grid vehicle in Zone C.
   */
  getGridMechanicScreenBadge(viewportW, viewportH) {
    for (const actor of this.busActors.values()) {
      if (actor.state !== 'grid' && actor.state !== 'bumping') continue;
      const bus = actor.data;
      if (!bus.mechanic) continue;
      const st = bus.mechanicState || {};
      let label = '';
      let color = '#facc15';

      switch (bus.mechanic) {
        case 'mystery_tint':
          if (st.revealed) continue;
          label = '❓ VIP TINT';
          color = '#c084fc';
          break;
        case 'traffic_light':
          label = st.green !== false ? '🟢 GO' : '🔴 STOP';
          color = st.green !== false ? '#4ade80' : '#f87171';
          break;
        case 'vip_rope':
          if ((st.ropesRemaining ?? 0) <= 0) continue;
          label = `🪢 ROPE ×${st.ropesRemaining}`;
          color = '#fb7185';
          break;
        case 'tunnel_spawner':
          if (st.spawned) continue;
          label = '🚇 TUNNEL +1';
          color = '#38bdf8';
          break;
        case 'tow_truck':
          label = '🚜 SWEEPER (0 PAX)';
          color = '#facc15';
          break;
        case 'sleeping_driver':
          if (st.awake) continue;
          label = '💤 ZZZ';
          color = '#60a5fa';
          break;
        case 'direction_flipper':
          label = '🔄 180° PAD';
          color = '#22d3ee';
          break;
        case 'express_bonus':
          if ((st.movesRemaining ?? 0) <= 0) continue;
          label = `⏱️ +2 PTS (${st.movesRemaining})`;
          color = '#facc15';
          break;
        case 'dual_color':
          label = '🎨 2-TONE';
          color = '#f472b6';
          break;
        case 'lift_barrier':
          if (st.gateOpen) continue;
          label = '🚧 GATE LOCKED';
          color = '#fb923c';
          break;
        default:
          continue;
      }

      _projVec.set(
        actor.group.position.x,
        (actor.roofHeight || 0.98) + 0.42,
        actor.group.position.z
      );
      _projVec.project(this.camera);
      if (_projVec.z >= -1 && _projVec.z <= 1) {
        return {
          id: actor.id,
          x: ((_projVec.x + 1) * 0.5) * viewportW,
          y: ((-_projVec.y + 1) * 0.5) * viewportH,
          label,
          color,
        };
      }
    }
    return null;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Smart Dual-Mode Camera Auto-Zoom:
   * - Mode 1 ('vertical', aspect < 1.05): Frames Top Z1 (Passenger Queue) -> Middle Z2 (Parking Bays) -> Bottom Z3 (Vehicle Lot).
   * - Mode 2 ('wide', aspect >= 1.05): Frames Left Z1 (Passenger Queue) | Center Z2 (Parking Bays) | Right Z3 (Vehicle Lot).
   * Automatically zooms out as more buses/cars generate so 100% of transportation vehicles stay visible.
   */
  resize() {
    const w = window.innerWidth || 1280;
    const h = window.innerHeight || 720;
    const aspect = w / h;

    const desiredLayout = aspect >= WIDE_ASPECT_THRESHOLD ? 'wide' : 'vertical';
    if (desiredLayout !== this.layoutMode) {
      this.layoutMode = desiredLayout;
      this._applyLayoutModeTransform();
    }

    this.camera.aspect = aspect;

    const gridW = this.currentGridW || 6;
    const gridH = this.currentGridH || 6;

    if (this.layoutMode === 'wide') {
      const worldLeftX = -14.8;
      const worldRightX = WIDE_LOT_LEFT_EDGE_X + gridW * CELL_SIZE + 1.8;
      const totalWidthX = worldRightX - worldLeftX;
      const lookX = (worldLeftX + worldRightX) * 0.5 + 0.2;

      const worldTopZ = -Math.max(8.2, (gridH * CELL_SIZE) * 0.5 + 2.4);
      const worldBottomZ = Math.max(8.2, (gridH * CELL_SIZE) * 0.5 + 2.6);
      const totalDepthZ = worldBottomZ - worldTopZ;
      const lookZ = 0.25;

      const vFovRad = THREE.MathUtils.degToRad(this.camera.fov);
      const hFovRad = 2 * Math.atan(Math.tan(vFovRad / 2) * aspect);

      const distForWidth = (totalWidthX * 0.54) / Math.tan(hFovRad / 2);
      const distForDepth = (totalDepthZ * 0.64) / Math.tan(vFovRad / 2);
      const camDist = Math.max(24.5, distForWidth, distForDepth);

      const camHeight = camDist * 0.86;
      const camZ = lookZ + camDist * 0.51;

      this.camera.position.set(lookX, camHeight, camZ);
      this.cameraLookTarget.set(lookX, 0, lookZ);
    } else {
      const lotBottomZ = LOT_TOP_EDGE_Z + gridH * CELL_SIZE;
      const worldTopZ = -13.2;
      const worldBottomZ = lotBottomZ + 2.8;
      const totalDepthZ = worldBottomZ - worldTopZ;
      const baselineDepthZ = 25.0;
      const depthZoomFactor = Math.max(1.0, totalDepthZ / baselineDepthZ);

      const requiredWorldWidth = Math.max(15.2, gridW * CELL_SIZE + 4.4);
      const baselineWidth = 14.5;
      const widthZoomFactor = Math.max(1.0, requiredWorldWidth / baselineWidth);

      let lookZ = (worldTopZ + worldBottomZ) * 0.5 - 0.15;
      let camHeight = 34.5 * Math.max(depthZoomFactor, widthZoomFactor * 0.92);
      let camZ = lookZ + camHeight * 0.63;

      if (aspect < 0.85) {
        const portraitScale = Math.max(
          depthZoomFactor * 1.04,
          (0.74 / Math.max(0.42, aspect)) * widthZoomFactor
        );
        camHeight = 30.2 * portraitScale;
        lookZ = (worldTopZ + worldBottomZ) * 0.5 - 0.35;
        camZ = lookZ + camHeight * 0.64;
      } else {
        const tabletScale = Math.max(depthZoomFactor, (1.18 / aspect) * widthZoomFactor * 0.95);
        camHeight = 34.5 * tabletScale;
        camZ = lookZ + camHeight * 0.63;
      }

      this.camera.position.set(0, camHeight, camZ);
      this.cameraLookTarget.set(0, 0, lookZ);
    }

    this.camera.lookAt(this.cameraLookTarget);
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(w, h);
  }

  dispose() {
    this.renderer.dispose();
  }
}
