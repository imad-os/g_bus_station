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
export const GRID_ORIGIN_Z = 3.65;
export const ROAD_CENTER_Z = -3.75;
export const LOOP_CENTER_Z = -8.45;
export const GATE_POS = new THREE.Vector3(0, 0.15, -5.55);

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

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(TIME_OF_DAY_PRESETS.night.bgHex);
    this.scene.fog = new THREE.Fog(TIME_OF_DAY_PRESETS.night.fogHex, 90, 150);

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.5, 140);
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
    this.worldGroup.add(this.passengerPoolGroup);
    this.worldGroup.add(this.runnersGroup);

    // Pre-allocated 3D Passenger Pool (for loop queue + boarding runners)
    this.maxVisibleQueuePassengers = 240;
    this.queuePassengerNodes = [];
    this.runnerPool = [];
    this.activeRunners = [];

    // Bus actors map: id -> actor state
    this.busActors = new Map();
    this.focusedBusId = null;
    this.focusRingMesh = null;
    this.focusedBayIndex = -1;
    this.bayFocusMesh = null;

    // Walkway spline
    this.walkwayCurve = null;
    this.queueVisualScroll = 0;

    this._initSurfaceTextures();
    this._setupLights();
    this._buildStaticEnvironment();
    this._initPassengerPools();
    this._buildSelectionRings();
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
    // ZONE A: Top 3D Looping Passenger Queue Walkway
    // =========================================================================
    const curvePoints = [
      new THREE.Vector3(-0.6, 0.14, -5.75),  // Front left of gate (boards first!)
      new THREE.Vector3(-2.4, 0.14, -6.05),
      new THREE.Vector3(-4.0, 0.14, -7.05),
      new THREE.Vector3(-4.5, 0.14, -8.55),
      new THREE.Vector3(-3.8, 0.14, -10.05),
      new THREE.Vector3(-1.8, 0.14, -10.95),
      new THREE.Vector3(0.8, 0.14, -10.95),
      new THREE.Vector3(3.1, 0.14, -10.15),
      new THREE.Vector3(4.3, 0.14, -8.65),
      new THREE.Vector3(3.9, 0.14, -7.05),
      new THREE.Vector3(2.2, 0.14, -6.05),
      new THREE.Vector3(1.1, 0.14, -5.85),   // Right side of gate loop
      new THREE.Vector3(3.5, 0.14, -6.65),
      new THREE.Vector3(4.7, 0.14, -8.65),
      new THREE.Vector3(5.3, 0.14, -11.05),  // Feeder path curving up to top-right
      new THREE.Vector3(6.2, 0.14, -14.0),
      new THREE.Vector3(6.8, 0.14, -16.8),
    ];
    this.walkwayCurve = new THREE.CatmullRomCurve3(curvePoints, false, 'centripetal', 0.5);

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
    const roadWidth = 26;
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

    const leftTopCurb = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.09, 0.16), roadCurbMat);
    leftTopCurb.position.set(-7.2, 0.045, ROAD_CENTER_Z - roadDepth / 2);
    this.zoneBGroup.add(leftTopCurb);

    const rightTopCurb = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.09, 0.16), roadCurbMat);
    rightTopCurb.position.set(7.2, 0.045, ROAD_CENTER_Z - roadDepth / 2);
    this.zoneBGroup.add(rightTopCurb);

    const bottomCurb = new THREE.Mesh(curbGeo, roadCurbMat);
    bottomCurb.position.set(0, 0.045, ROAD_CENTER_Z + roadDepth / 2);
    this.zoneBGroup.add(bottomCurb);

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
    const gateConnectorGeo = new THREE.PlaneGeometry(2.5, 1.1);
    const gateConnector = new THREE.Mesh(gateConnectorGeo, this.walkwayPathMat);
    gateConnector.rotation.x = -Math.PI / 2;
    gateConnector.position.set(0, 0.145, -5.45);
    this.zoneAGroup.add(gateConnector);
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
   * - Slots 5..7: Locked slate bays with glowing green '+' icon (unlockable via TV remote or click)
   */
  _buildParkingBays() {
    this.bayMeshes = [];
    this.bayClickProxies = [];

    const totalSlots = 8;
    const spacingX = 1.62;
    const startX = -((totalSlots - 1) * spacingX) / 2;

    for (let i = 0; i < totalSlots; i++) {
      const x = startX + i * spacingX;
      const z = ROAD_CENTER_Z + 0.05;
      const isVip = i === 0;
      const isDefaultUnlocked = i >= 1 && i <= 4;
      const mode = isVip ? 'vip' : isDefaultUnlocked ? 'active' : 'locked';

      const bayGroup = new THREE.Group();
      bayGroup.position.set(x, 0.025, z);
      bayGroup.rotation.y = BAY_ANGLE;

      const tex = this._createBayTexture(mode);
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
        x,
        z,
        mode,
        group: bayGroup,
        planeMesh,
        planeMat,
      });
    }
  }

  _createBayTexture(mode) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 256, 512);

    // Subtle dark recessed stall fill
    ctx.fillStyle =
      mode === 'vip'
        ? 'rgba(251, 191, 36, 0.09)'
        : mode === 'active'
        ? 'rgba(56, 189, 248, 0.08)'
        : 'rgba(15, 23, 42, 0.35)';
    ctx.fillRect(26, 28, 204, 456);

    const strokeColor =
      mode === 'vip'
        ? '#fbbf24'
        : mode === 'active'
        ? '#7dd3fc'
        : 'rgba(148, 163, 184, 0.55)';

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
    } else if (mode === 'locked') {
      // Glowing green '+' icon in center of locked bay
      ctx.fillStyle = 'rgba(34, 197, 94, 0.22)';
      ctx.beginPath();
      ctx.arc(128, 256, 48, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.moveTo(128 - 28, 256);
      ctx.lineTo(128 + 28, 256);
      ctx.moveTo(128, 256 - 28);
      ctx.lineTo(128, 256 + 28);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Updates bay slot visual state when unlocked during gameplay.
   */
  updateBaySlotsVisuals(dockSlots) {
    for (let i = 0; i < this.bayMeshes.length; i++) {
      const bay = this.bayMeshes[i];
      const slotInfo = dockSlots[i];
      if (!slotInfo) continue;
      const desiredMode = slotInfo.isVip
        ? 'vip'
        : slotInfo.unlocked
        ? 'active'
        : 'locked';
      if (bay.mode !== desiredMode) {
        bay.mode = desiredMode;
        if (bay.planeMat.map) bay.planeMat.map.dispose();
        bay.planeMat.map = this._createBayTexture(desiredMode);
        bay.planeMat.needsUpdate = true;
      }
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

    for (let i = 0; i < 24; i++) {
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
   * Builds the high-contrast 3D selection rings for TV Remote & Gamepad focus (Bus Grid + Parking Bays).
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

    // Textured dark basalt stone paver pad beneath the grid with recessed cell borders
    if (this.lotPadMesh) {
      this.zoneCGroup.remove(this.lotPadMesh);
      if (this.lotPadMat?.map) this.lotPadMat.map.dispose();
    }
    if (this.lotRimMesh) {
      this.zoneCGroup.remove(this.lotRimMesh);
    }

    const padW = gridW * CELL_SIZE;
    const padH = gridH * CELL_SIZE;

    // Outer dark steel curb framing the puzzle grid
    const rimGeo = new THREE.BoxGeometry(padW + 0.55, 0.06, padH + 0.55);
    const rimMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    this.lotRimMesh = new THREE.Mesh(rimGeo, rimMat);
    this.lotRimMesh.position.set(0, -0.02, GRID_ORIGIN_Z);
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
    this.lotPadMesh.position.set(0, 0.012, GRID_ORIGIN_Z);
    this.zoneCGroup.add(this.lotPadMesh);

    for (let i = 0; i < stage.buses.length; i++) {
      const busData = stage.buses[i];
      const posInfo = getBusWorldCenter(busData, gridW, gridH, GRID_ORIGIN_Z);
      const busGroup = this._createCompositeBusMesh(busData);

      busGroup.position.set(posInfo.worldX, 0, posInfo.worldZ);
      busGroup.rotation.y = posInfo.rotY;

      this.zoneCGroup.add(busGroup);

      this.busActors.set(busData.id, {
        id: busData.id,
        data: busData,
        group: busGroup,
        state: 'grid',
        baseX: posInfo.worldX,
        baseZ: posInfo.worldZ,
        baseRotY: posInfo.rotY,
        bumpTimer: 0,
        shakeTimer: 0,
        waypoints: [],
        waypointIdx: 0,
        bayIndex: -1,
        remainingCapacity: busData.capacity,
        boardedCount: 0,
        bounceTimer: 0,
      });
    }
  }

  /**
   * Builds a composite 11-part 3D vehicle mesh (minivan, bus, or coach) with night headlight beams.
   */
  _createCompositeBusMesh(busData) {
    const L = busData.length || 2;
    const { meshWidth, meshLength } = getBusMeshDimensions(L);
    const palette = COLOR_PALETTE_HEX[busData.color] || COLOR_PALETTE_HEX.purple;
    const meshHeight = busData.type === 'coach' ? 0.94 : busData.type === 'minivan' ? 0.78 : 0.86;

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

    // 2. Lower darker chassis skirt / bumper
    const chassisGeo = new THREE.BoxGeometry(meshWidth * 0.98, 0.22, meshLength * 0.98);
    const chassisMat = new THREE.MeshLambertMaterial({ color: palette.dark });
    const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
    chassisMesh.position.y = 0.2;
    group.add(chassisMesh);

    // 3. Main glossy body hull
    const bodyGeo = new THREE.BoxGeometry(meshWidth, meshHeight - 0.2, meshLength * 0.95);
    const bodyMat = new THREE.MeshPhongMaterial({
      color: palette.main,
      emissive: palette.dark,
      emissiveIntensity: 0.14,
      specular: 0x777777,
      shininess: 60,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.22 + (meshHeight - 0.2) / 2;
    group.add(bodyMesh);

    // 4. Rounded roof cap
    const roofCapGeo = new THREE.BoxGeometry(meshWidth * 0.88, 0.1, meshLength * 0.88);
    const roofCapMat = new THREE.MeshPhongMaterial({
      color: palette.light,
      emissive: palette.main,
      emissiveIntensity: 0.1,
      specular: 0x888888,
      shininess: 68,
    });
    const roofCapMesh = new THREE.Mesh(roofCapGeo, roofCapMat);
    roofCapMesh.position.y = meshHeight + 0.04;
    group.add(roofCapMesh);

    // 5. Dark front windshield (at -Z local forward edge)
    const glassMat = new THREE.MeshPhongMaterial({
      color: 0x0f172a,
      emissive: 0x1e293b,
      emissiveIntensity: 0.25,
      specular: 0xbae6fd,
      shininess: 95,
    });
    const windshieldGeo = new THREE.BoxGeometry(meshWidth * 0.84, meshHeight * 0.36, 0.08);
    const windshieldMesh = new THREE.Mesh(windshieldGeo, glassMat);
    windshieldMesh.position.set(0, meshHeight * 0.66, -meshLength * 0.46);
    group.add(windshieldMesh);

    // 6. Side passenger windows strip
    const sideWinGeo = new THREE.BoxGeometry(meshWidth * 1.015, meshHeight * 0.3, meshLength * 0.68);
    const sideWinMesh = new THREE.Mesh(sideWinGeo, glassMat);
    sideWinMesh.position.set(0, meshHeight * 0.66, 0.04);
    group.add(sideWinMesh);

    // 7. Front headlights & rear brake lights
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const taillightMat = new THREE.MeshBasicMaterial({ color: 0xf87171 });
    const lightGeo = new THREE.BoxGeometry(0.18, 0.1, 0.06);

    const hlLeft = new THREE.Mesh(lightGeo, headlightMat);
    hlLeft.position.set(-meshWidth * 0.3, 0.28, -meshLength * 0.475);
    group.add(hlLeft);

    const hlRight = new THREE.Mesh(lightGeo, headlightMat);
    hlRight.position.set(meshWidth * 0.3, 0.28, -meshLength * 0.475);
    group.add(hlRight);

    // 7b. Dynamic Sunset/Night Headlight Floor Beams (projecting forward in -Z)
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

    // 8. 4 Black Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.14, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x090d16 });
    const wheelZOffset = meshLength * 0.29;
    const wheelXOffset = meshWidth * 0.48;
    const wheelPositions = [
      [-wheelXOffset, 0.19, -wheelZOffset],
      [wheelXOffset, 0.19, -wheelZOffset],
      [-wheelXOffset, 0.19, wheelZOffset],
      [wheelXOffset, 0.19, wheelZOffset],
    ];
    for (let w = 0; w < wheelPositions.length; w++) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(...wheelPositions[w]);
      group.add(wheel);
    }

    // 9. High-contrast Directional Arrow on the roof (points -Z in local bus space)
    const arrowPlaneGeo = new THREE.PlaneGeometry(meshWidth * 0.72, meshWidth * 0.92);
    const arrowMat = new THREE.MeshBasicMaterial({
      map: this._getRoofArrowTexture(),
      transparent: true,
      depthWrite: false,
    });
    const arrowMesh = new THREE.Mesh(arrowPlaneGeo, arrowMat);
    arrowMesh.rotation.x = -Math.PI / 2;
    arrowMesh.position.set(0, meshHeight + 0.095, 0);
    group.add(arrowMesh);

    // 10. Invisible click proxy box for instant raycasting
    const proxyGeo = new THREE.BoxGeometry(meshWidth * 1.05, meshHeight + 0.25, meshLength * 1.02);
    const proxyMesh = new THREE.Mesh(
      proxyGeo,
      new THREE.MeshBasicMaterial({ visible: false })
    );
    proxyMesh.position.y = (meshHeight + 0.2) / 2;
    proxyMesh.userData = { busId: busData.id };
    group.add(proxyMesh);
    this.busClickProxies.push(proxyMesh);

    return group;
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
   * Triggers the Unblocked Bus 3-Segment Waypoint Drive-to-Bay Animation.
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

    const halfGridW = (gridWidth * CELL_SIZE) / 2 + 0.82;
    const halfGridH = (gridHeight * CELL_SIZE) / 2 + 0.85;
    const roadApproachZ = ROAD_CENTER_Z + 1.15;

    const waypoints = [];

    if (dir === 'N') {
      waypoints.push({ x: startX, z: roadApproachZ, rotY: 0 });
      if (Math.abs(startX - bay.x) > 0.3) {
        waypoints.push({
          x: bay.x + 0.35,
          z: roadApproachZ,
          rotY: startX < bay.x ? -Math.PI / 2 : Math.PI / 2,
        });
      }
    } else if (dir === 'W') {
      const leftLaneX = Math.min(-halfGridW, startX - 1.1);
      waypoints.push({ x: leftLaneX, z: startZ, rotY: Math.PI / 2 });
      waypoints.push({ x: leftLaneX, z: roadApproachZ, rotY: 0 });
      waypoints.push({ x: bay.x + 0.35, z: roadApproachZ, rotY: -Math.PI / 2 });
    } else if (dir === 'E') {
      const rightLaneX = Math.max(halfGridW, startX + 1.1);
      waypoints.push({ x: rightLaneX, z: startZ, rotY: -Math.PI / 2 });
      waypoints.push({ x: rightLaneX, z: roadApproachZ, rotY: 0 });
      waypoints.push({ x: bay.x + 0.35, z: roadApproachZ, rotY: Math.PI / 2 });
    } else {
      // dir === 'S'
      const bottomLaneZ = GRID_ORIGIN_Z + halfGridH;
      const sideLaneX = startX <= 0 ? -halfGridW : halfGridW;
      waypoints.push({ x: startX, z: bottomLaneZ, rotY: Math.PI });
      waypoints.push({
        x: sideLaneX,
        z: bottomLaneZ,
        rotY: sideLaneX < startX ? Math.PI / 2 : -Math.PI / 2,
      });
      waypoints.push({ x: sideLaneX, z: roadApproachZ, rotY: 0 });
      waypoints.push({
        x: bay.x + 0.35,
        z: roadApproachZ,
        rotY: sideLaneX < bay.x ? -Math.PI / 2 : Math.PI / 2,
      });
    }

    waypoints.push({
      x: bay.x,
      z: bay.z,
      rotY: BAY_ANGLE,
    });

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

    actor.state = 'helilift';
    actor.bayIndex = bayIndex;
    actor.heliProgress = 0;
    actor.heliStartX = actor.group.position.x;
    actor.heliStartZ = actor.group.position.z;
    actor.heliTargetX = bay.x;
    actor.heliTargetZ = bay.z;
  }

  /**
   * Spawns a 3D passenger runner from the loop gate to a parked bus in Zone B.
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

    this._setPassengerNodeColor(runnerNode, colorName);
    runnerNode.group.visible = true;
    runnerNode.group.position.copy(GATE_POS);
    runnerNode.group.scale.set(1, 1, 1);

    this.queueVisualScroll += 0.25;

    this.activeRunners.push({
      node: runnerNode,
      targetBusId,
      progress: 0,
      startX: GATE_POS.x + (Math.random() - 0.5) * 0.4,
      startZ: GATE_POS.z,
      targetX: actor.group.position.x,
      targetZ: actor.group.position.z - 0.35,
      onArrive: onArriveCallback,
    });
  }

  /**
   * Triggers a full parked bus to pull out of its angled bay and depart off-screen to the right.
   */
  triggerBusDeparture(busId, onGoneCallback) {
    const actor = this.busActors.get(busId);
    if (!actor) return;
    actor.state = 'departing';
    actor.onGone = onGoneCallback;
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
    actor.waypointIdx = 0;
  }

  /**
   * Updates the 3D Passenger Queue positions along the CatmullRomCurve3 in tightly packed rows of 5 abreast.
   */
  syncPassengerQueueVisuals(passengerQueue, elapsedSec) {
    const queueLen = passengerQueue.length;
    const abreast = 5;

    const visualCount =
      queueLen === 0
        ? 0
        : Math.min(
            this.maxVisibleQueuePassengers,
            Math.max(queueLen, Math.min(this.maxVisibleQueuePassengers, queueLen * 4))
          );

    for (let i = 0; i < this.maxVisibleQueuePassengers; i++) {
      const node = this.queuePassengerNodes[i];
      if (i >= visualCount) {
        node.group.visible = false;
        continue;
      }

      node.group.visible = true;
      const colorName = passengerQueue[i % queueLen];
      this._setPassengerNodeColor(node, colorName);

      const rowIdx = Math.floor(i / abreast);
      const colIdx = i % abreast;

      const effectiveRow = rowIdx + this.queueVisualScroll;
      const u = Math.min(0.985, 0.008 + effectiveRow * 0.0202);

      this.walkwayCurve.getPointAt(u, _curvePt);
      this.walkwayCurve.getTangentAt(u, _curveTan);

      _perpVec.set(-_curveTan.z, 0, _curveTan.x).normalize();
      const lateralOffset = (colIdx - (abreast - 1) / 2) * 0.35;

      const bob = Math.sin(elapsedSec * 7.5 + i * 0.7) * 0.025;
      node.group.position.set(
        _curvePt.x + _perpVec.x * lateralOffset,
        _curvePt.y + Math.max(0, bob),
        _curvePt.z + _perpVec.z * lateralOffset
      );
    }
  }

  /**
   * Updates the 3D selection ring around the focused bus in Zone C.
   */
  setFocusedBus(busId) {
    this.focusedBusId = busId;
    if (!busId || !this.busActors.has(busId)) {
      this.focusRingMesh.visible = false;
      return;
    }
    const actor = this.busActors.get(busId);
    if (actor.state !== 'grid' && actor.state !== 'bumping') {
      this.focusRingMesh.visible = false;
      return;
    }
    this.focusRingMesh.visible = true;
    this.focusRingMesh.position.x = actor.group.position.x;
    this.focusRingMesh.position.z = actor.group.position.z;
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
    if (this.queueVisualScroll > 0.001) {
      this.queueVisualScroll *= Math.exp(-10 * dt);
      if (this.queueVisualScroll < 0.002) this.queueVisualScroll = 0;
    }

    this.syncPassengerQueueVisuals(passengerQueue, elapsedSec);

    // Update active boarding runners
    for (let i = this.activeRunners.length - 1; i >= 0; i--) {
      const r = this.activeRunners[i];
      r.progress += dt * 4.4;
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
        if (actor.heliProgress >= 1) {
          actor.group.position.set(actor.heliTargetX, 0, actor.heliTargetZ);
          actor.group.rotation.y = BAY_ANGLE;
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
            actor.baseRotY + (BAY_ANGLE - actor.baseRotY) * smooth;
        }
      }
    }

    // Pulse selection ring scale subtly
    if (this.focusRingMesh && this.focusRingMesh.visible && this.focusedBusId) {
      const focusedActor = this.busActors.get(this.focusedBusId);
      if (focusedActor && (focusedActor.state === 'grid' || focusedActor.state === 'bumping')) {
        this.focusRingMesh.position.x = focusedActor.group.position.x;
        this.focusRingMesh.position.z = focusedActor.group.position.z;
        const pulse = 1 + Math.sin(elapsedSec * 7.0) * 0.05;
        this.focusRingMesh.scale.set(pulse, 1, pulse);
      } else {
        this.focusRingMesh.visible = false;
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
      _projVec.set(
        actor.group.position.x + Math.sin(BAY_ANGLE) * 1.38,
        0.48,
        actor.group.position.z + Math.cos(BAY_ANGLE) * 1.38
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

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const w = window.innerWidth || 1280;
    const h = window.innerHeight || 720;
    const aspect = w / h;

    this.camera.aspect = aspect;

    let camHeight = 33.8;
    let camZ = 21.8;
    let lookZ = 0.15;

    if (aspect < 0.85) {
      const scale = Math.max(1.0, 0.72 / Math.max(0.42, aspect));
      camHeight = 29.2 * scale;
      camZ = 19.0 * scale;
      lookZ = -0.15;
    } else if (aspect > 1.35) {
      camHeight = 34.4;
      camZ = 22.2;
      lookZ = 0.25;
    }

    this.camera.position.set(0, camHeight, camZ);
    this.cameraLookTarget.set(0, 0, lookZ);
    this.camera.lookAt(this.cameraLookTarget);
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(w, h);
  }

  dispose() {
    this.renderer.dispose();
  }
}
