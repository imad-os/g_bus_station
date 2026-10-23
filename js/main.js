/**
 * Bus Fever 3D: Traffic Escape — Main Game Controller, Dynamic Day/Sunset/Night & My PC SDK Lifecycle
 */

import {
  findBlockingBus,
  getBusWorldCenter,
  getBusCells,
  areBusesAdjacent,
  STAGE_MECHANICS,
  selectMechanicForLevel,
  getCircleActiveQueueLimit,
} from './solver.js';
import { LevelManager } from './levelManager.js';
import { Renderer3D, getDynamicGridOriginZ, getDynamicGridOriginX } from './renderer3d.js';
import { InputController } from './input.js';
import { SoundEngine } from './audio.js';

export const EXTRA_BAY_COSTS = [10, 30, 100];
export const CONTINUE_RECOLOR_COST = 3;

const I18N = {
  en: {
    title: 'Bus Fever 3D: Transit Saga Map',
    subtitle:
      'Clear stages without helpers for +3 Points/Coins (+1 with helpers). Spend 10, 30, or 100 Points to unlock extra Parking Spots!',
    playNow: 'Play Stage',
    level: 'Level',
    stage: 'Unlocked',
    queue: 'Queue',
    vip: 'VIP Slot',
    arrange: 'Arrange',
    jumble: 'Jumble',
    unlockAt: 'Level',
    paused: 'Paused',
    resume: 'Resume Stage',
    restart: 'Restart Stage',
    sagaMapBtn: 'Transit Saga Map (Home)',
    unlockBayBtn: 'Unlock Next Parking Spot',
    exportJson: 'Export Procedural Level JSON',
    stageClear: 'Stage Clear!',
    stageClearSub: 'No-Helper Bonus: +3 Points/Coins earned! Next stop on the Saga Map is unlocked!',
    stageClearHelperSub: 'Stage Clear: +1 Point/Coin earned! Next stop on the Saga Map is unlocked!',
    dockFull: 'Parking Spots Full!',
    dockFullSub:
      'All active parking spots are occupied! Press Continue to change the last parked bus color to match the front waiting passenger.',
    continueMatchBus: 'Continue: Match Last Bus Color',
    nextLevel: 'Next Level',
    tryAgain: 'Replay Stage',
    score: 'Score',
    best: 'Best',
    coins: 'Points / Coins',
    extraBays: 'Extra Spots',
    blockedToast: 'Path blocked by another vehicle!',
    bayUnlockedToast: 'Unlocked Extra Parking Spot #{num}!',
    bayNeedPointsToast: 'Need {cost} PTS to unlock Spot #{num}! (You have {cur} PTS)',
    levelLockedToast: 'Solve Level {prev} first to unlock Level {lvl}!',
    allBaysOpen: 'All 3 Extra Parking Spots Unlocked!',
    recoloredToast: 'Last parked vehicle changed to {color}!',
    lighting: 'Lighting',
    modeAuto: 'Auto',
    modeDay: 'Day',
    modeSunset: 'Sunset',
    modeNight: 'Night',
    musicOn: 'Music: On',
    musicOff: 'Music: Off',
    bgmOn: 'BGM On',
    bgmOff: 'BGM Off',
    controlsHint:
      'TV Remote / D-Pad: Navigate All Zones & Spots · OK / [A]: Select · [Y] VIP · [X] Arrange · [LB] Jumble · [RB] Unlock Spot (10/30/100 PTS)',
  },
  fr: {
    title: 'Bus Fever 3D: Carte Saga Transit',
    subtitle:
      '+3 Points sans aide (+1 avec aide). Débloquez les quais supplémentaires pour 10, 30 et 100 Points !',
    playNow: 'Jouer le Niveau',
    level: 'Niveau',
    stage: 'Débloqué',
    queue: 'File',
    vip: 'Quai VIP',
    arrange: 'Trier',
    jumble: 'Mélanger',
    unlockAt: 'Niveau',
    paused: 'Pause',
    resume: 'Reprendre',
    restart: 'Recommencer',
    sagaMapBtn: 'Carte des Niveaux (Accueil)',
    unlockBayBtn: 'Débloquer +1 Quai',
    exportJson: 'Exporter JSON du Niveau',
    stageClear: 'Niveau Terminé !',
    stageClearSub: 'Bonus Sans Aide : +3 Points gagnés ! Niveau suivant débloqué !',
    stageClearHelperSub: 'Niveau Terminé : +1 Point gagné ! Niveau suivant débloqué !',
    dockFull: 'Quais Complets !',
    dockFullSub:
      'Tous les quais actifs sont occupés ! Changez la couleur du dernier bus garé pour continuer.',
    continueMatchBus: 'Continuer : Changer Couleur du Dernier Bus',
    nextLevel: 'Niveau Suivant',
    tryAgain: 'Rejouer',
    score: 'Score',
    best: 'Record',
    coins: 'Points / Pièces',
    extraBays: 'Quais Extra',
    blockedToast: 'Passage bloqué par un autre bus !',
    bayUnlockedToast: 'Quai supplémentaire #{num} débloqué !',
    bayNeedPointsToast: 'Il faut {cost} PTS pour ouvrir le Quai #{num} ! ({cur} PTS)',
    levelLockedToast: 'Terminez le Niveau {prev} pour débloquer le Niveau {lvl} !',
    allBaysOpen: 'Tous les quais supplémentaires sont ouverts !',
    recoloredToast: 'Dernier bus changé en {color} !',
    lighting: 'Éclairage',
    modeAuto: 'Auto',
    modeDay: 'Jour',
    modeSunset: 'Crépuscule',
    modeNight: 'Nuit',
    musicOn: 'Musique: Oui',
    musicOff: 'Musique: Non',
    bgmOn: 'Musique',
    bgmOff: 'Muet',
    controlsHint:
      'Flèches Télécommande / Manette : Naviguer · OK / [A] : Choisir · [Y] VIP · [X] Trier · [LB] Mélanger · [RB] +1 Quai',
  },
  es: {
    title: 'Bus Fever 3D: Mapa Saga Tránsito',
    subtitle:
      '¡Gana +3 Puntos sin ayudas (+1 con ayuda) y desbloquea bahías extra por 10, 30 y 100 Puntos!',
    playNow: 'Jugar Nivel',
    level: 'Nivel',
    stage: 'Desbloqueado',
    queue: 'Fila',
    vip: 'Bahía VIP',
    arrange: 'Ordenar',
    jumble: 'Mezclar',
    unlockAt: 'Nivel',
    paused: 'Pausa',
    resume: 'Continuar',
    restart: 'Reiniciar Nivel',
    sagaMapBtn: 'Mapa de Niveles (Inicio)',
    unlockBayBtn: 'Desbloquear +1 Bahía',
    exportJson: 'Exportar JSON del Nivel',
    stageClear: '¡Nivel Completado!',
    stageClearSub: '¡Bono sin ayuda: +3 Puntos ganados y siguiente nivel desbloqueado!',
    stageClearHelperSub: '¡Nivel completado: +1 Punto ganado y siguiente nivel desbloqueado!',
    dockFull: '¡Bahías Llenas!',
    dockFullSub:
      '¡Todas las bahías están ocupadas! Cambia el color del último autobús estacionado para continuar.',
    continueMatchBus: 'Continuar: Cambiar Color del Último Bus',
    nextLevel: 'Siguiente Nivel',
    tryAgain: 'Reintentar',
    score: 'Puntos',
    best: 'Mejor',
    coins: 'Puntos / Monedas',
    extraBays: 'Bahías Extra',
    blockedToast: '¡Camino bloqueado por otro autobús!',
    bayUnlockedToast: '¡Bahía extra #{num} desbloqueada!',
    bayNeedPointsToast: '¡Necesitas {cost} PTS para abrir la Bahía #{num}! (Tienes {cur} PTS)',
    levelLockedToast: '¡Supera el Nivel {prev} para desbloquear el Nivel {lvl}!',
    allBaysOpen: '¡Todas las bahías extra abiertas!',
    recoloredToast: '¡Último autobús cambiado a {color}!',
    lighting: 'Luz',
    modeAuto: 'Auto',
    modeDay: 'Día',
    modeSunset: 'Atardecer',
    modeNight: 'Noche',
    musicOn: 'Música: Sí',
    musicOff: 'Música: No',
    bgmOn: 'Música',
    bgmOff: 'Silencio',
    controlsHint:
      'Flechas Control / Mando: Navegar · OK / [A]: Seleccionar · [Y] VIP · [X] Ordenar · [LB] Mezclar · [RB] +1 Bahía',
  },
  ar: {
    title: 'حمى الحافلات 3D: خريطة المراحل',
    subtitle: 'اربح +3 نقاط بدون مساعدة (+1 مع مساعدة) وافتح مواقف إضافية بـ 10 و30 و100 نقطة!',
    playNow: 'العب المستوى',
    level: 'المستوى',
    stage: 'مفتوح',
    queue: 'الطابور',
    vip: 'موقف VIP',
    arrange: 'ترتيب',
    jumble: 'خلط',
    unlockAt: 'مستوى',
    paused: 'إيقاف مؤقت',
    resume: 'استئناف',
    restart: 'إعادة المستوى',
    sagaMapBtn: 'خريطة المراحل (الرئيسية)',
    unlockBayBtn: 'فتح موقف إضافي (+1)',
    exportJson: 'تصدير JSON للمستوى',
    stageClear: 'تم اجتياز المستوى!',
    stageClearSub: 'مكافأة بدون مساعدة: +3 نقاط وتم فتح المستوى التالي!',
    stageClearHelperSub: 'تم اجتياز المستوى: +1 نقطة وتم فتح المستوى التالي!',
    dockFull: 'المواقف ممتلئة!',
    dockFullSub: 'جميع المواقف مشغولة! غيّر لون آخر حافلة متوقفة لمطابقة الراكب المنتظر والمتابعة.',
    continueMatchBus: 'متابعة: تغيير لون آخر حافلة',
    nextLevel: 'المستوى التالي',
    tryAgain: 'إعادة المحاولة',
    score: 'النقاط',
    best: 'الأفضل',
    coins: 'النقاط / العملات',
    extraBays: 'مواقف إضافية',
    blockedToast: 'الطريق مسدود بحافلة أخرى!',
    bayUnlockedToast: 'تم فتح الموقف الإضافي #{num}!',
    bayNeedPointsToast: 'تحتاج إلى {cost} نقطة لفتح الموقف #{num}! (لديك {cur})',
    levelLockedToast: 'أكمل المستوى {prev} أولاً لفتح المستوى {lvl}!',
    allBaysOpen: 'تم فتح جميع المواقف الإضافية!',
    recoloredToast: 'تم تغيير لون الحافلة الأخيرة إلى {color}!',
    lighting: 'الإضاءة',
    modeAuto: 'تلقائي',
    modeDay: 'نهار',
    modeSunset: 'غروب',
    modeNight: 'ليل',
    musicOn: 'الموسيقى: تشغيل',
    musicOff: 'الموسيقى: إيقاف',
    bgmOn: 'موسيقى',
    bgmOff: 'صامت',
    controlsHint:
      'أسهم الريموت / ذراع التحكم: التنقل · موافق / [A]: اختيار · [Y] VIP · [X] ترتيب · [LB] خلط · [RB] +1 موقف',
  },
};

const LIGHTING_MODES = ['auto', 'day', 'sunset', 'night'];
const SAGA_TOTAL_NODES = 100;

export class BusFeverGame {
  constructor() {
    this.levelManager = new LevelManager();
    this.sound = new SoundEngine();
    this.renderer3d = null;
    this.input = null;

    this.lang = 'en';
    this.rtl = false;
    this.qualityTier = 'mid';
    this.appConfig = {
      initialUnlockedBays: 4,
      busSpeed: 20,
      startingVip: 2,
      startingArrange: 2,
      startingShuffle: 2,
      unlockAllBoosters: false,
    };

    // Persistent profile state saved via MyPC.save / MyPC.load
    this.saveData = {
      currentLevel: 1,
      highestLevel: 1,
      openedExtraBays: 0, // 0..3 extra bays unlocked individually (Spot 1: 10 PTS, Spot 2: 30 PTS, Spot 3: 100 PTS)
      score: 0,
      bestScore: 0,
      coins: 0, // Unified Points / Coins currency (+3 per No-Helper clear, +1 with Helper)
      pointsEconomyV2: true,
      lightingMode: 'auto', // 'auto' | 'day' | 'sunset' | 'night'
      musicEnabled: true,
      boosters: {
        vip: 2,
        arrange: 2,
        shuffle: 2,
      },
    };

    // Active stage runtime state
    this.gameState = 'title'; // 'title' | 'playing' | 'paused' | 'gameover'
    this.outcomeType = 'victory'; // 'victory' | 'defeat'
    this.stage = null;
    this.activeGridBuses = [];
    this.passengerQueue = [];
    this.dockSlots = [];
    this.focusedBusId = null;
    this.vipSelectionMode = false;
    this.helpersUsedThisStage = 0;
    this.lastParkedBusId = null;
    this.lastEarnedPoints = 0;

    // 4-Zone Spatial Navigation for TV Remote & Gamepad
    // Zones: 'topbar' (5 buttons) <-> 'bays' (locked '+' bays in Zone B) <-> 'grid' (3D buses in Zone C) <-> 'boosters' (3 cards)
    this.focusZone = 'grid';
    this.focusedTopBtnIdx = 0; // 0: Home/Map, 1: Restart, 2: TimeOfDay, 3: Music, 4: Pause
    this.focusedBaySlotIdx = 5; // Slots 5..7
    this.focusedBoosterIdx = 0; // 0: VIP, 1: Arrange, 2: Jumble
    this.modalButtons = [];
    this.focusedModalBtnIdx = 0;

    // Fixed 60Hz loop timers
    this.rafId = 0;
    this.swTimeoutId = 0;
    this.lastFrameTs = 0;
    this.accumulator = 0;
    this.elapsedSec = 0;
    this.stageStartSec = 0;
    this.boardingCooldown = 0;
    this.deadlockTimer = 0;
    this.totalBusesInStage = 0;
    this.departedBusesCount = 0;

    this.boundResize = () => this._onResize();
  }

  t(key) {
    const dict = I18N[this.lang] || I18N.en;
    return dict[key] || I18N.en[key] || key;
  }

  initSdk() {
    const sdk = window.MyPC;
    const autostart = /[?&]autostart=1/i.test(window.location.search);

    if (sdk && typeof sdk.init === 'function') {
      sdk.init({
        ownMenu: true,
        onInit: (info) => {
          this._handleInit(info, autostart);
        },
        onStart: () => {
          this._handleStart(autostart);
        },
        onPause: () => {
          this._handlePauseFromHost();
        },
        onResume: () => {
          this._handleResumeFromHost();
        },
        onDestroy: () => {
          this._handleDestroy();
        },
        onInput: (action, pressed, repeat, dev) => {
          this.input?.handleSdkAction(action, pressed, repeat, dev);
        },
        onMenu: (id) => {
          if (id === 'restart') {
            this.loadStage(this.saveData.currentLevel);
            this.setGameState('playing');
          } else if (id === 'saga_map') {
            this.setGameState('title');
          } else if (id === 'cycle_time') {
            this.cycleTimeOfDay();
          } else if (id === 'toggle_music') {
            this.toggleMusic();
          } else if (id === 'export_json') {
            this.showExportJsonModal();
          }
        },
        onVolume: (v) => {
          if (typeof v === 'object' && v !== null) {
            if (v.muted !== undefined) this.sound.setSfxEnabled(!v.muted);
          }
        },
      });
    } else {
      this._handleInit(
        { standalone: true, lang: 'en', rtl: false, quality: { tier: 'mid' } },
        autostart
      );
      this._handleStart(autostart);
    }
  }

  async _handleInit(info, autostart) {
    const sdk = window.MyPC;
    if (info) {
      if (info.lang && I18N[info.lang]) this.lang = info.lang;
      this.rtl = !!info.rtl;
      document.documentElement.lang = this.lang;
      document.documentElement.dir = this.rtl ? 'rtl' : 'ltr';
      if (info.quality?.tier) this.qualityTier = info.quality.tier;
    }

    const cfg = (sdk && sdk.app_config) || {};
    if (typeof cfg.initialUnlockedBays === 'number') {
      this.appConfig.initialUnlockedBays = Math.max(2, Math.min(7, cfg.initialUnlockedBays));
    }
    if (typeof cfg.startingVip === 'number') this.appConfig.startingVip = cfg.startingVip;
    if (typeof cfg.startingArrange === 'number') this.appConfig.startingArrange = cfg.startingArrange;
    if (typeof cfg.startingShuffle === 'number') this.appConfig.startingShuffle = cfg.startingShuffle;
    if (typeof cfg.unlockAllBoosters === 'boolean') {
      this.appConfig.unlockAllBoosters = cfg.unlockAllBoosters;
    }

    if (sdk && typeof sdk.load === 'function') {
      const saved = sdk.load('bus_fever_save', null);
      if (saved && typeof saved === 'object') {
        this.saveData = {
          ...this.saveData,
          ...saved,
          boosters: {
            ...this.saveData.boosters,
            ...(saved.boosters || {}),
          },
        };
        // Migrate legacy v1 saves that defaulted coins to 150 so all parking spots are not unlocked prematurely
        if (!saved.pointsEconomyV2) {
          this.saveData.coins = 0;
          this.saveData.openedExtraBays = 0;
          this.saveData.pointsEconomyV2 = true;
        }
      }
    }

    this.saveData.coins = Math.max(0, Math.floor(this.saveData.coins || 0));
    this.saveData.openedExtraBays = Math.max(
      0,
      Math.min(3, Math.floor(this.saveData.openedExtraBays || 0))
    );

    // Ensure currentLevel never exceeds highestLevel unless explicitly passed via URL query
    this.saveData.highestLevel = Math.max(1, Math.floor(this.saveData.highestLevel || 1));
    this.saveData.currentLevel = Math.min(
      this.saveData.highestLevel,
      Math.max(1, Math.floor(this.saveData.currentLevel || 1))
    );

    const lvlMatch = /[?&]level=(\d+)/i.exec(window.location.search);
    if (lvlMatch) {
      const requestedLvl = Math.max(1, parseInt(lvlMatch[1], 10));
      this.saveData.currentLevel = requestedLvl;
      if (requestedLvl > this.saveData.highestLevel) {
        this.saveData.highestLevel = requestedLvl;
      }
    }

    const ptsMatch = /[?&](?:points|coins)=(\d+)/i.exec(window.location.search);
    if (ptsMatch) {
      this.saveData.coins = Math.max(0, parseInt(ptsMatch[1], 10));
    }

    const timeMatch = /[?&]time=(day|sunset|night|auto)/i.exec(window.location.search);
    if (timeMatch) {
      this.saveData.lightingMode = timeMatch[1].toLowerCase();
    }

    this.sound.setMusicEnabled(this.saveData.musicEnabled !== false);

    sdk?.progress?.(0.3);

    const mountEl = document.getElementById('canvas-mount');
    this.renderer3d = new Renderer3D(mountEl, this.qualityTier);

    this.input = new InputController({
      onNavigate: (dir) => this.handleNavigate(dir),
      onConfirm: () => this.handleConfirm(),
      onCancel: () => this.handleCancel(),
      onTogglePause: () => this.togglePauseModal(),
      onCycleZoneFocus: () => this.cycleFocusZone(),
      onCycleTimeOfDay: () => this.cycleTimeOfDay(),
      onToggleMusic: () => this.toggleMusic(),
      onBooster: (type) => this.activateBooster(type),
      onUnlockBay: () => this.unlockNextParkingBay(),
      onCanvasRayTap: (ndcX, ndcY) => this.handleCanvasRayTap(ndcX, ndcY),
    });
    this.input.initGamepadListeners();
    this.input.attachCanvasPointer(this.renderer3d.renderer.domElement);

    window.addEventListener('resize', this.boundResize);

    this._buildLevelPickersDom();
    this._bindDomUiEvents();
    this._applyTranslations();

    sdk?.progress?.(0.75);
    await this.levelManager.loadExternalPack();
    sdk?.progress?.(1.0);

    this.loadStage(this.saveData.currentLevel);

    if (sdk && typeof sdk.setMenu === 'function') {
      sdk.setMenu([
        { id: 'saga_map', label: this.t('sagaMapBtn') },
        { id: 'restart', label: this.t('restart') },
        { id: 'cycle_time', label: `${this.t('lighting')}: Day/Sunset/Night` },
        { id: 'toggle_music', label: this.t('musicOn') },
        { id: 'export_json', label: this.t('exportJson') },
      ]);
    }

    if (autostart) {
      this.setGameState('playing');
    } else {
      this.setGameState('title');
    }

    // Start rendering loop immediately so standalone and TV views are live from frame 1
    this.startLoop();

    sdk?.ready?.();
  }

  _handleStart(autostart) {
    this.sound.initInOnStart();
    if (autostart && this.gameState !== 'playing') {
      this.setGameState('playing');
    }
    this.startLoop();
  }

  _handlePauseFromHost() {
    this.stopLoop();
    this.sound.pause();
  }

  _handleResumeFromHost() {
    this.sound.resume();
    this.startLoop();
  }

  _handleDestroy() {
    this.stopLoop();
    window.removeEventListener('resize', this.boundResize);
    this.input?.detachCanvasPointer();
    this.sound.destroy();
    this.renderer3d?.dispose();
  }

  _saveProgress() {
    const sdk = window.MyPC;
    if (sdk && typeof sdk.save === 'function') {
      sdk.save('bus_fever_save', this.saveData);
    }
  }

  /**
   * Cycles Dynamic Time of Day ('auto' -> 'day' -> 'sunset' -> 'night') and updates the 3D scene.
   */
  cycleTimeOfDay() {
    this.sound.initInOnStart();
    const cur = this.saveData.lightingMode || 'auto';
    const nextIdx = (LIGHTING_MODES.indexOf(cur) + 1) % LIGHTING_MODES.length;
    this.saveData.lightingMode = LIGHTING_MODES[nextIdx];
    this._saveProgress();
    this._applyTimeOfDayToScene();
    this.sound.playUiTick();
    this._updateHudDom();
  }

  _applyTimeOfDayToScene() {
    if (!this.renderer3d) return;
    const lvl = this.stage?.level || this.saveData.currentLevel || 1;
    this.renderer3d.setTimeOfDay(this.saveData.lightingMode || 'auto', lvl);
  }

  /**
   * Toggles the open-source Night-Drive Background Music Loop on/off.
   */
  toggleMusic() {
    this.sound.initInOnStart();
    const enabled = this.sound.toggleMusic();
    this.saveData.musicEnabled = enabled;
    this._saveProgress();
    this.sound.playUiTick();
    this._updateHudDom();
  }

  /**
   * Refreshes `unlocked` and `canOpen` flags on all 8 parking slots in Zone B.
   * Extra Spot 1 (Bay 5): 10 PTS, Extra Spot 2 (Bay 6): 30 PTS, Extra Spot 3 (Bay 7): 100 PTS.
   * Only the next sequential locked spot can be unlocked at a time.
   */
  _refreshDockSlotUnlockStates() {
    const initialActive = this.appConfig.initialUnlockedBays || 4;
    const openedExtra = Math.max(0, Math.min(3, Math.floor(this.saveData.openedExtraBays || 0)));
    const curPoints = Math.max(0, Math.floor(this.saveData.coins || 0));

    for (let i = 0; i < this.dockSlots.length; i++) {
      const slot = this.dockSlots[i];
      if (i >= 5) {
        const extraIdx = i - 5; // 0, 1, 2
        const cost = EXTRA_BAY_COSTS[extraIdx] || 100;
        const isExtraOpened = extraIdx < openedExtra;
        const isNextToUnlock = extraIdx === openedExtra;
        slot.cost = cost;
        slot.unlocked = isExtraOpened;
        slot.isNextToUnlock = isNextToUnlock;
        slot.canOpen = isNextToUnlock && curPoints >= cost;
      } else {
        slot.cost = 0;
        slot.unlocked = i === 0 || (i >= 1 && i <= initialActive);
        slot.isNextToUnlock = false;
        slot.canOpen = false;
      }
    }
  }

  /**
   * Loads a stage (from pack-01.json or Reverse-Peel Generator) and initializes Zone A, B, and C.
   */
  loadStage(levelNumber) {
    const requested = Math.max(1, Math.floor(levelNumber || 1));
    const lvl = Math.min(requested, Math.max(1, this.saveData.highestLevel || 1));
    this.saveData.currentLevel = lvl;

    if (this.saveData.highestLevel >= 5 && this.saveData.boosters.vip < 1) {
      this.saveData.boosters.vip = 2;
    }
    if (this.saveData.highestLevel >= 10 && this.saveData.boosters.arrange < 1) {
      this.saveData.boosters.arrange = 2;
    }
    if (this.saveData.highestLevel >= 15 && this.saveData.boosters.shuffle < 1) {
      this.saveData.boosters.shuffle = 2;
    }

    this._saveProgress();

    this.stage = this.levelManager.getStage(lvl);
    this.activeGridBuses = this.stage.buses.map((b) => ({ ...b }));
    this.passengerQueue = this.stage.passengerQueue.slice();
    this.totalBusesInStage = this.stage.buses.length;
    this.departedBusesCount = 0;
    this.vipSelectionMode = false;
    this.helpersUsedThisStage = 0;
    this.lastParkedBusId = null;
    this.lastEarnedPoints = 0;
    this.deadlockTimer = 0;
    this.boardingCooldown = 0;
    this.stageStartSec = this.elapsedSec;

    this.dockSlots = [];
    for (let i = 0; i < 8; i++) {
      const extraIdx = i - 5;
      const cost = i >= 5 ? EXTRA_BAY_COSTS[extraIdx] : 0;
      this.dockSlots.push({
        index: i,
        isVip: i === 0,
        cost,
        isNextToUnlock: false,
        canOpen: false,
        unlocked: false,
        busId: null,
      });
    }
    this._refreshDockSlotUnlockStates();

    this._applyTimeOfDayToScene();
    this.renderer3d.updateBaySlotsVisuals(this.dockSlots);
    this.renderer3d.buildStageBuses(this.stage);
    this.renderer3d.syncPassengerQueueVisuals(this.passengerQueue, this.elapsedSec);

    this._selectDefaultBusFocus();
    this._updateHudDom();

    window.MyPC?.announce?.(`${this.t('level')} ${lvl}`);
  }

  _selectDefaultBusFocus() {
    if (this.activeGridBuses.length === 0) {
      this.focusedBusId = null;
      this.renderer3d?.setFocusedBus(null);
      return;
    }
    const sorted = this.activeGridBuses.slice().sort((a, b) => a.hz - b.hz || a.hx - b.hx);
    const unblocked = sorted.find(
      (b) =>
        !findBlockingBus(
          b,
          this.activeGridBuses,
          this.stage.grid.width,
          this.stage.grid.height
        )
    );
    this.focusedBusId = (unblocked || sorted[0]).id;
    if (this.focusZone === 'grid') {
      this.renderer3d?.setFocusedBus(this.focusedBusId);
    }
  }

  /**
   * Transitions game state and mirrors to document.body.dataset.state ('title' | 'playing' | 'paused' | 'gameover').
   */
  setGameState(newState) {
    this.gameState = newState;
    document.body.dataset.state = newState;

    const titleModal = document.getElementById('title-modal');
    const pauseModal = document.getElementById('pause-modal');
    const gameoverModal = document.getElementById('gameover-modal');

    if (titleModal) titleModal.hidden = newState !== 'title';
    if (pauseModal) pauseModal.hidden = newState !== 'paused';
    if (gameoverModal) gameoverModal.hidden = newState !== 'gameover';

    this._updateHudDom();

    if (newState === 'playing') {
      if (document.activeElement && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      this.focusZone = 'grid';
      this._selectDefaultBusFocus();
      this._updateHudFocusVisuals();
    } else {
      this.renderer3d?.setFocusedBus(null);
      this.renderer3d?.setFocusedBay(-1);
      if (newState === 'title') {
        this._scrollSagaMapToLevel(this.saveData.currentLevel || this.saveData.highestLevel || 1);
      }
      this._refreshModalButtonsFocus(newState);
    }
  }

  _refreshModalButtonsFocus(state) {
    let containerId = 'title-modal';
    if (state === 'paused') containerId = 'pause-modal';
    if (state === 'gameover') containerId = 'gameover-modal';
    const container = document.getElementById(containerId);
    if (!container) {
      this.modalButtons = [];
      return;
    }

    if (state === 'title') {
      // Order focusable buttons in Title Modal: Primary Play button first, then Unlock Spot / Lighting / Music, then unlocked Saga nodes
      const actionBtns = Array.from(
        container.querySelectorAll('.modal-actions button:not([disabled]):not([hidden])')
      );
      const unlockedNodes = Array.from(
        container.querySelectorAll('.saga-node-btn:not(.is-locked)')
      );
      this.modalButtons = actionBtns.concat(unlockedNodes);
    } else {
      this.modalButtons = Array.from(
        container.querySelectorAll('button:not([disabled]):not([hidden])')
      );
    }

    this.focusedModalBtnIdx = 0;
    this._applyModalButtonFocus();
  }

  _applyModalButtonFocus() {
    for (let i = 0; i < this.modalButtons.length; i++) {
      const isFocused = i === this.focusedModalBtnIdx;
      const btn = this.modalButtons[i];
      btn.classList.toggle('tv-focused', isFocused);
      if (isFocused && btn.classList.contains('saga-node-btn')) {
        btn.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }

  /**
   * Attempts to dispatch a bus from Zone C when clicked or selected with OK/Enter/[A].
   */
  trySelectBus(busId) {
    if (this.gameState !== 'playing') return;
    this.sound.initInOnStart();

    const busIdx = this.activeGridBuses.findIndex((b) => b.id === busId);
    if (busIdx === -1) return;

    const bus = this.activeGridBuses[busIdx];
    this.focusedBusId = busId;
    this.renderer3d.setFocusedBus(busId);

    if (this.vipSelectionMode) {
      this._executeVipAirlift(bus, busIdx);
      return;
    }

    const blocker = findBlockingBus(
      bus,
      this.activeGridBuses,
      this.stage.grid.width,
      this.stage.grid.height
    );

    if (blocker) {
      this.sound.playHorn();
      this.renderer3d.triggerBlockedBump(bus.id, blocker.id);
      this._flashToast(this.t('blockedToast'));
      return;
    }

    let freeBayIndex = -1;
    for (let i = 1; i < this.dockSlots.length; i++) {
      if (this.dockSlots[i].unlocked && !this.dockSlots[i].busId) {
        freeBayIndex = i;
        break;
      }
    }

    if (freeBayIndex === -1) {
      this.sound.playHorn();
      this._flashToast(this.t('dockFull'));
      return;
    }

    this.activeGridBuses.splice(busIdx, 1);
    this.dockSlots[freeBayIndex].busId = bus.id;
    this.lastParkedBusId = bus.id;
    this.sound.playBusDispatch();

    this.renderer3d.triggerDriveToBay(
      bus.id,
      freeBayIndex,
      this.stage.grid.width,
      this.stage.grid.height
    );

    this._selectDefaultBusFocus();
    this._updateHudDom();
  }

  _executeVipAirlift(bus, busIdx) {
    let targetBay = 0;
    if (this.dockSlots[0].busId) {
      targetBay = this.dockSlots.findIndex((s) => s.unlocked && !s.busId);
    }
    if (targetBay === -1) {
      this.vipSelectionMode = false;
      this._updateHudDom();
      return;
    }

    this.vipSelectionMode = false;
    this.helpersUsedThisStage++;
    this.saveData.boosters.vip = Math.max(0, this.saveData.boosters.vip - 1);
    this._saveProgress();

    this.activeGridBuses.splice(busIdx, 1);
    this.dockSlots[targetBay].busId = bus.id;
    this.lastParkedBusId = bus.id;
    this.sound.playBooster();
    this.renderer3d.triggerHeliLiftToBay(bus.id, targetBay);
    this._selectDefaultBusFocus();
    this._updateHudDom();
  }

  /**
   * Unlocks ONLY the single next locked parking spot in Zone B (Slots 5, 6, 7) using Points / Coins:
   * - Extra Spot #1 (Slot 5): 10 Points / Coins
   * - Extra Spot #2 (Slot 6): 30 Points / Coins
   * - Extra Spot #3 (Slot 7): 100 Points / Coins
   */
  unlockNextParkingBay(_specificBayIdx) {
    this.sound.initInOnStart();
    const openedExtra = Math.max(0, Math.min(3, Math.floor(this.saveData.openedExtraBays || 0)));
    if (openedExtra >= 3) {
      this._flashToast(this.t('allBaysOpen'));
      return false;
    }

    // Always unlock strictly one spot at a time (the next locked spot in sequence)
    const nextSlotIdx = 5 + openedExtra;
    const spotNum = openedExtra + 1;
    const requiredPts = EXTRA_BAY_COSTS[openedExtra] || 100;
    const currentPts = Math.max(0, Math.floor(this.saveData.coins || 0));

    if (currentPts < requiredPts) {
      this.sound.playHorn();
      const msg = this.t('bayNeedPointsToast')
        .replace('{cost}', String(requiredPts))
        .replace('{num}', String(spotNum))
        .replace('{cur}', String(currentPts));
      this._flashToast(msg);
      return false;
    }

    this.saveData.coins = Math.max(0, currentPts - requiredPts);
    this.saveData.openedExtraBays = openedExtra + 1;
    this._saveProgress();

    this._refreshDockSlotUnlockStates();
    this.deadlockTimer = 0;
    this.sound.playBooster();
    this.renderer3d.updateBaySlotsVisuals(this.dockSlots);

    const unlockedMsg = this.t('bayUnlockedToast').replace('{num}', String(spotNum));
    this._flashToast(unlockedMsg);

    // If we were focused on bays and no locked bays remain, return focus to the 3D bus grid
    const nextLocked = this.dockSlots.findIndex((s, idx) => idx >= 5 && !s.unlocked);
    if (this.focusZone === 'bays') {
      if (nextLocked !== -1) {
        this.focusedBaySlotIdx = nextLocked;
        this.renderer3d.setFocusedBay(this.focusedBaySlotIdx);
      } else {
        this.focusZone = 'grid';
        this.renderer3d.setFocusedBay(-1);
        this._selectDefaultBusFocus();
      }
    }

    this._updateHudFocusVisuals();
    this._updateHudDom();
    return true;
  }

  /**
   * 1-Button Dock-Full Continue:
   * Immediately changes the color of the LAST parked vehicle in the parking spots to match
   * the front waiting passenger's color (`this.passengerQueue[0]`), without asking the player
   * to pick a color, and balances the remaining queue so all buses still clear cleanly.
   */
  continueByRecoloringLastParkedBus() {
    this.sound.initInOnStart();
    if (this.passengerQueue.length === 0) {
      this.setGameState('playing');
      return true;
    }

    const targetColor = this.passengerQueue[0];

    // Locate the last parked bus actor (or fallback to the last occupied regular bay)
    let targetActor = null;
    if (this.lastParkedBusId) {
      const candidate = this.renderer3d?.busActors.get(this.lastParkedBusId);
      if (candidate && candidate.state === 'parked' && candidate.remainingCapacity > 0) {
        targetActor = candidate;
      }
    }

    if (!targetActor) {
      for (let i = this.dockSlots.length - 1; i >= 0; i--) {
        const bId = this.dockSlots[i].busId;
        if (!bId) continue;
        const act = this.renderer3d?.busActors.get(bId);
        if (act && act.state === 'parked' && act.remainingCapacity > 0) {
          targetActor = act;
          break;
        }
      }
    }

    if (!targetActor) {
      this._performArrangeQueue();
      this.setGameState('playing');
      return true;
    }

    // Spend continue points if available and mark helper used
    this.helpersUsedThisStage++;
    const curPts = Math.max(0, Math.floor(this.saveData.coins || 0));
    if (curPts > 0) {
      this.saveData.coins = Math.max(0, curPts - Math.min(curPts, CONTINUE_RECOLOR_COST));
    }
    this._refreshDockSlotUnlockStates();
    this._saveProgress();

    const oldColor = targetActor.data.color;
    const seatsNeeded = Math.max(1, targetActor.remainingCapacity || 1);

    // Recolor the 3D bus mesh in the bay immediately
    this.renderer3d.recolorBusActor(targetActor.id, targetColor);

    // Maintain exact seat-to-passenger color conservation by converting `seatsNeeded`
    // passengers of `oldColor` (from the back of the queue) into `targetColor`,
    // and bringing `targetColor` passengers to the front of the queue so boarding starts immediately!
    if (oldColor !== targetColor) {
      let converted = 0;
      for (let i = this.passengerQueue.length - 1; i >= 0 && converted < seatsNeeded; i--) {
        if (this.passengerQueue[i] === oldColor) {
          this.passengerQueue[i] = targetColor;
          converted++;
        }
      }
    }

    // Pull `seatsNeeded` matching `targetColor` passengers to the very front of the queue
    const frontBatch = [];
    const restBatch = [];
    for (let i = 0; i < this.passengerQueue.length; i++) {
      const c = this.passengerQueue[i];
      if (c === targetColor && frontBatch.length < seatsNeeded) {
        frontBatch.push(c);
      } else {
        restBatch.push(c);
      }
    }
    this.passengerQueue = frontBatch.concat(restBatch);

    this.deadlockTimer = 0;
    this.boardingCooldown = 0;
    this.sound.playBooster();
    this.renderer3d.updateBaySlotsVisuals(this.dockSlots);
    this.renderer3d.syncPassengerQueueVisuals(this.passengerQueue, this.elapsedSec);

    const toastMsg = this.t('recoloredToast').replace('{color}', targetColor.toUpperCase());
    this._flashToast(toastMsg);

    this.setGameState('playing');
    return true;
  }

  /**
   * Activates one of the 3 Bottom Boosters: 'vip', 'arrange', 'shuffle'.
   */
  activateBooster(type) {
    if (this.gameState !== 'playing') return;
    this.sound.initInOnStart();

    if (type === 'vip') {
      if (this.saveData.boosters.vip <= 0) {
        this.saveData.boosters.vip = 1;
      }
      if (this.focusedBusId) {
        const idx = this.activeGridBuses.findIndex((b) => b.id === this.focusedBusId);
        if (idx !== -1 && !this.dockSlots[0].busId) {
          this._executeVipAirlift(this.activeGridBuses[idx], idx);
          return;
        }
      }
      this.vipSelectionMode = !this.vipSelectionMode;
      this.sound.playBooster();
      this._updateHudDom();
      return;
    }

    if (type === 'arrange') {
      if (this.saveData.boosters.arrange <= 0) {
        this.saveData.boosters.arrange = 1;
      }
      this.helpersUsedThisStage++;
      this.saveData.boosters.arrange = Math.max(0, this.saveData.boosters.arrange - 1);
      this._saveProgress();
      this._performArrangeQueue();
      this.sound.playBooster();
      this._updateHudDom();
      return;
    }

    if (type === 'shuffle') {
      if (this.saveData.boosters.shuffle <= 0) {
        this.saveData.boosters.shuffle = 1;
      }
      if (this.activeGridBuses.length === 0) return;
      this.helpersUsedThisStage++;
      this.saveData.boosters.shuffle = Math.max(0, this.saveData.boosters.shuffle - 1);
      this._saveProgress();
      this._performJumbleGridBuses();
      this.sound.playBooster();
      this._updateHudDom();
    }
  }

  _performArrangeQueue() {
    if (this.passengerQueue.length === 0) return;

    const priorityColors = [];
    for (let i = 0; i < this.dockSlots.length; i++) {
      const busId = this.dockSlots[i].busId;
      if (!busId) continue;
      const actor = this.renderer3d.busActors.get(busId);
      if (actor && actor.remainingCapacity > 0) {
        priorityColors.push({
          color: actor.data.color,
          needed: actor.remainingCapacity,
        });
      }
    }

    if (priorityColors.length === 0 && this.activeGridBuses.length > 0) {
      const unblocked =
        this.activeGridBuses.find(
          (b) =>
            !findBlockingBus(
              b,
              this.activeGridBuses,
              this.stage.grid.width,
              this.stage.grid.height
            )
        ) || this.activeGridBuses[0];
      priorityColors.push({ color: unblocked.color, needed: unblocked.capacity });
    }

    const pool = this.passengerQueue.slice();
    const front = [];

    for (let p = 0; p < priorityColors.length; p++) {
      const { color, needed } = priorityColors[p];
      let pulled = 0;
      for (let i = pool.length - 1; i >= 0 && pulled < needed; i--) {
        if (pool[i] === color) {
          front.push(pool[i]);
          pool.splice(i, 1);
          pulled++;
        }
      }
    }

    this.passengerQueue = front.concat(pool);
    this.deadlockTimer = 0;
    this.renderer3d.syncPassengerQueueVisuals(this.passengerQueue, this.elapsedSec);
  }

  _performJumbleGridBuses() {
    const byCap = new Map();
    for (let i = 0; i < this.activeGridBuses.length; i++) {
      const b = this.activeGridBuses[i];
      if (!byCap.has(b.capacity)) byCap.set(b.capacity, []);
      byCap.get(b.capacity).push(b);
    }

    const frontColor = this.passengerQueue[0];

    for (const group of byCap.values()) {
      if (group.length < 2) continue;
      const colors = group.map((b) => b.color);
      colors.push(colors.shift());
      const unblockedIdx = group.findIndex(
        (b) =>
          !findBlockingBus(
            b,
            this.activeGridBuses,
            this.stage.grid.width,
            this.stage.grid.height
          )
      );
      const frontColorIdx = colors.indexOf(frontColor);
      if (unblockedIdx !== -1 && frontColorIdx !== -1 && unblockedIdx !== frontColorIdx) {
        const tmp = colors[unblockedIdx];
        colors[unblockedIdx] = colors[frontColorIdx];
        colors[frontColorIdx] = tmp;
      }

      for (let i = 0; i < group.length; i++) {
        group[i].color = colors[i];
      }
    }

    const parkedSnapshot = [];
    for (const [id, actor] of this.renderer3d.busActors.entries()) {
      if (actor.state !== 'grid' && actor.state !== 'bumping') {
        parkedSnapshot.push({ id, actor });
      }
    }

    this.renderer3d.buildStageBuses({
      ...this.stage,
      buses: this.activeGridBuses,
    });

    for (let i = 0; i < parkedSnapshot.length; i++) {
      const { id, actor } = parkedSnapshot[i];
      this.renderer3d.zoneCGroup.add(actor.group);
      this.renderer3d.busActors.set(id, actor);
    }

    this._selectDefaultBusFocus();
  }

  /**
   * Full 4-Zone Spatial TV Remote & Gamepad Navigation (supports both Vertical and Wide TV modes):
   * - Modals: Cycles through all visible buttons & level nodes
   * - 'topbar': Home/Map (0), Replay (1), Time of Day (2), Music (3), Pause (4)
   * - 'bays': Locked '+' Parking Spots in Zone B (Slots 5, 6, 7)
   * - 'grid': 3D Bus Puzzle Lot in Zone C
   * - 'boosters': Bottom 3 Booster Cards (VIP, Arrange, Jumble)
   */
  handleNavigate(dir) {
    this.sound.initInOnStart();
    this.sound.playUiTick();

    if (this.gameState !== 'playing') {
      if (this.modalButtons.length === 0) return;
      if (dir === 'up' || dir === 'left') {
        this.focusedModalBtnIdx =
          (this.focusedModalBtnIdx - 1 + this.modalButtons.length) %
          this.modalButtons.length;
      } else {
        this.focusedModalBtnIdx =
          (this.focusedModalBtnIdx + 1) % this.modalButtons.length;
      }
      this._applyModalButtonFocus();
      return;
    }

    const isWide = this.renderer3d?.layoutMode === 'wide';
    const lockedBayIndices = this.dockSlots
      .filter((s, idx) => idx >= 5 && !s.unlocked)
      .map((s) => s.index);

    // 1. Bottom Boosters Bar
    if (this.focusZone === 'boosters') {
      if (dir === 'left') {
        this.focusedBoosterIdx = (this.focusedBoosterIdx + 2) % 3;
      } else if (dir === 'right') {
        this.focusedBoosterIdx = (this.focusedBoosterIdx + 1) % 3;
      } else if (dir === 'up') {
        this.focusZone = 'grid';
        this._selectDefaultBusFocus();
      }
      this._updateHudFocusVisuals();
      return;
    }

    // 2. Top Utility Bar (5 buttons: Home/Map, Restart, Time-of-Day, Music, Pause)
    if (this.focusZone === 'topbar') {
      const topCount = 5;
      if (dir === 'left') {
        this.focusedTopBtnIdx = (this.focusedTopBtnIdx + topCount - 1) % topCount;
      } else if (dir === 'right') {
        this.focusedTopBtnIdx = (this.focusedTopBtnIdx + 1) % topCount;
      } else if (dir === 'down') {
        if (lockedBayIndices.length > 0 && !isWide) {
          this.focusZone = 'bays';
          this.focusedBaySlotIdx = lockedBayIndices[0];
        } else {
          this.focusZone = 'grid';
          this._selectDefaultBusFocus();
        }
      }
      this._updateHudFocusVisuals();
      return;
    }

    // 3. Zone B Locked '+' Parking Spots
    if (this.focusZone === 'bays') {
      if (lockedBayIndices.length === 0) {
        this.focusZone = 'grid';
        this._selectDefaultBusFocus();
        this._updateHudFocusVisuals();
        return;
      }
      const curIdxInLocked = Math.max(0, lockedBayIndices.indexOf(this.focusedBaySlotIdx));
      if (isWide) {
        // In wide TV mode, parking spots form a vertical column in Zone 2 (left of Zone 3 bus lot)
        if (dir === 'up') {
          if (curIdxInLocked > 0) {
            this.focusedBaySlotIdx = lockedBayIndices[curIdxInLocked - 1];
          } else {
            this.focusZone = 'topbar';
          }
        } else if (dir === 'down') {
          if (curIdxInLocked < lockedBayIndices.length - 1) {
            this.focusedBaySlotIdx = lockedBayIndices[curIdxInLocked + 1];
          } else {
            this.focusZone = 'boosters';
          }
        } else if (dir === 'right') {
          this.focusZone = 'grid';
          this._selectDefaultBusFocus();
        }
      } else {
        if (dir === 'left') {
          this.focusedBaySlotIdx =
            lockedBayIndices[(curIdxInLocked - 1 + lockedBayIndices.length) % lockedBayIndices.length];
        } else if (dir === 'right') {
          this.focusedBaySlotIdx =
            lockedBayIndices[(curIdxInLocked + 1) % lockedBayIndices.length];
        } else if (dir === 'up') {
          this.focusZone = 'topbar';
        } else if (dir === 'down') {
          this.focusZone = 'grid';
          this._selectDefaultBusFocus();
        }
      }
      this._updateHudFocusVisuals();
      return;
    }

    // 4. Default: Spatial navigation across 3D buses in Zone C
    if (this.activeGridBuses.length === 0) {
      if (dir === 'down') {
        this.focusZone = 'boosters';
      } else if (dir === 'up') {
        this.focusZone = lockedBayIndices.length > 0 && !isWide ? 'bays' : 'topbar';
        if (this.focusZone === 'bays') this.focusedBaySlotIdx = lockedBayIndices[0];
      } else if (dir === 'left' && isWide && lockedBayIndices.length > 0) {
        this.focusZone = 'bays';
        this.focusedBaySlotIdx = lockedBayIndices[0];
      }
      this._updateHudFocusVisuals();
      return;
    }

    const currentBus =
      this.activeGridBuses.find((b) => b.id === this.focusedBusId) ||
      this.activeGridBuses[0];
    const dynamicOriginZ = getDynamicGridOriginZ(
      this.stage.grid.height,
      this.renderer3d?.layoutMode || 'vertical'
    );
    const dynamicOriginX = getDynamicGridOriginX(
      this.stage.grid.width,
      this.renderer3d?.layoutMode || 'vertical'
    );
    const curPos = getBusWorldCenter(
      currentBus,
      this.stage.grid.width,
      this.stage.grid.height,
      dynamicOriginZ,
      dynamicOriginX
    );

    const dirVec = {
      left: { x: -1, z: 0 },
      right: { x: 1, z: 0 },
      up: { x: 0, z: -1 },
      down: { x: 0, z: 1 },
    }[dir] || { x: 0, z: -1 };

    let bestBus = null;
    let bestScore = Infinity;

    for (let i = 0; i < this.activeGridBuses.length; i++) {
      const candidate = this.activeGridBuses[i];
      if (candidate.id === currentBus.id) continue;
      const candPos = getBusWorldCenter(
        candidate,
        this.stage.grid.width,
        this.stage.grid.height,
        dynamicOriginZ,
        dynamicOriginX
      );
      const dx = candPos.worldX - curPos.worldX;
      const dz = candPos.worldZ - curPos.worldZ;
      const proj = dx * dirVec.x + dz * dirVec.z;
      if (proj <= 0.15) continue;

      const perp = Math.abs(dx * dirVec.z - dz * dirVec.x);
      const distScore = proj + perp * 2.1;
      if (distScore < bestScore) {
        bestScore = distScore;
        bestBus = candidate;
      }
    }

    if (bestBus) {
      this.focusedBusId = bestBus.id;
      this.renderer3d.setFocusedBus(this.focusedBusId);
    } else if (dir === 'left' && isWide && lockedBayIndices.length > 0) {
      this.focusZone = 'bays';
      this.focusedBaySlotIdx = lockedBayIndices[0];
      this.renderer3d.setFocusedBus(null);
      this._updateHudFocusVisuals();
    } else if (dir === 'down') {
      this.focusZone = 'boosters';
      this.renderer3d.setFocusedBus(null);
      this._updateHudFocusVisuals();
    } else if (dir === 'up') {
      if (lockedBayIndices.length > 0 && !isWide) {
        this.focusZone = 'bays';
        this.focusedBaySlotIdx = lockedBayIndices[0];
      } else {
        this.focusZone = 'topbar';
      }
      this.renderer3d.setFocusedBus(null);
      this._updateHudFocusVisuals();
    }
  }

  handleConfirm() {
    this.sound.initInOnStart();

    if (this.gameState !== 'playing') {
      const btn = this.modalButtons[this.focusedModalBtnIdx] || this.modalButtons[0];
      if (btn) btn.click();
      return;
    }

    if (this.focusZone === 'boosters') {
      const types = ['vip', 'arrange', 'shuffle'];
      this.activateBooster(types[this.focusedBoosterIdx]);
      return;
    }

    if (this.focusZone === 'bays') {
      this.unlockNextParkingBay(this.focusedBaySlotIdx);
      return;
    }

    if (this.focusZone === 'topbar') {
      if (this.focusedTopBtnIdx === 0) {
        this.setGameState('title');
      } else if (this.focusedTopBtnIdx === 1) {
        this.loadStage(this.saveData.currentLevel);
      } else if (this.focusedTopBtnIdx === 2) {
        this.cycleTimeOfDay();
      } else if (this.focusedTopBtnIdx === 3) {
        this.toggleMusic();
      } else {
        this.togglePauseModal();
      }
      return;
    }

    if (this.focusedBusId) {
      this.trySelectBus(this.focusedBusId);
    } else {
      this._selectDefaultBusFocus();
      if (this.focusedBusId) this.trySelectBus(this.focusedBusId);
    }
  }

  handleCancel() {
    if (this.vipSelectionMode) {
      this.vipSelectionMode = false;
      this._updateHudDom();
      return;
    }
    if (this.gameState === 'paused') {
      this.setGameState('playing');
    } else if (this.gameState === 'playing') {
      this.togglePauseModal();
    }
  }

  cycleFocusZone() {
    if (this.gameState !== 'playing') return;
    this.sound.playUiTick();
    const hasLockedBays = this.dockSlots.some((s, idx) => idx >= 5 && !s.unlocked);

    if (this.focusZone === 'grid') {
      this.focusZone = 'boosters';
    } else if (this.focusZone === 'boosters') {
      this.focusZone = 'topbar';
    } else if (this.focusZone === 'topbar' && hasLockedBays) {
      this.focusZone = 'bays';
      const firstLocked = this.dockSlots.find((s, idx) => idx >= 5 && !s.unlocked);
      if (firstLocked) this.focusedBaySlotIdx = firstLocked.index;
    } else {
      this.focusZone = 'grid';
      this._selectDefaultBusFocus();
    }
    this._updateHudFocusVisuals();
  }

  togglePauseModal() {
    if (this.gameState === 'playing') {
      this.setGameState('paused');
    } else if (this.gameState === 'paused') {
      this.setGameState('playing');
    }
  }

  handleCanvasRayTap(ndcX, ndcY) {
    if (this.gameState !== 'playing') return;
    this.sound.initInOnStart();

    const hit = this.renderer3d.raycastTap(ndcX, ndcY);
    if (!hit) return;

    if (hit.type === 'bus') {
      this.focusZone = 'grid';
      this._updateHudFocusVisuals();
      this.trySelectBus(hit.busId);
    } else if (hit.type === 'bay') {
      const slot = this.dockSlots[hit.bayIndex];
      if (slot && !slot.unlocked) {
        this.unlockNextParkingBay(hit.bayIndex);
      }
    }
  }

  /**
   * Fixed 60Hz Gameplay Step:
   * - Polls analog gamepad triggers
   * - Streams matching front-of-queue passengers into parked buses in Zone B
   * - Checks stage victory or full-dock deadlock
   */
  updateFixedStep(dt) {
    this.elapsedSec += dt;
    this.input?.pollGamepadFixedStep();

    if (this.gameState !== 'playing') {
      this.renderer3d.update(dt, this.passengerQueue, this.elapsedSec);
      return;
    }

    if (this.boardingCooldown > 0) {
      this.boardingCooldown = Math.max(0, this.boardingCooldown - dt);
    }

    let anyMatchingColorInQueue = false;

    if (this.passengerQueue.length > 0) {
      const currentStageLevel = this.stage?.level || this.saveData.currentLevel || 1;
      const maxLoopPassengers = (this.renderer3d.loopCapacityRows || 18) * 5;
      const circleLimit = getCircleActiveQueueLimit(
        this.passengerQueue,
        maxLoopPassengers,
        3
      );
      const activeCircleColors = new Set(
        this.passengerQueue.slice(0, circleLimit)
      );

      // Check if any parked vehicle matches the <= 3 colors currently turning inside the Revolving Circle
      // (so the deadlock timer fires when all bays are full of Feeder-Line colors not in the circle!)
      for (let i = 0; i < this.dockSlots.length; i++) {
        const slot = this.dockSlots[i];
        if (!slot.busId) continue;
        const actor = this.renderer3d.busActors.get(slot.busId);
        if (actor && actor.state === 'parked' && actor.remainingCapacity > 0) {
          if (activeCircleColors.has(actor.data.color)) {
            anyMatchingColorInQueue = true;
            break;
          }
        }
      }

      // STRICT REVOLVING CIRCLE DOOR BOARDING (MAX 3 COLORS PER CIRCLE):
      // Passengers walking inside the Revolving Circle (<= 3 contiguous color chunks)
      // board a matching parked vehicle when their row steps across the Boarding Door Ground Pad (uLoop near 0).
      const candidateIndices = this.renderer3d.getDoorGateEligibleIndices(
        this.passengerQueue.length,
        this.passengerQueue,
        currentStageLevel
      );

      let matchQueueIdx = -1;
      let matchingActor = null;
      let matchingSlot = null;

      for (let c = 0; c < candidateIndices.length && !matchingActor; c++) {
        const qIdx = candidateIndices[c];
        if (qIdx < 0 || qIdx >= this.passengerQueue.length) continue;
        const candidateColor = this.passengerQueue[qIdx];
        for (let i = 0; i < this.dockSlots.length; i++) {
          const slot = this.dockSlots[i];
          if (!slot.busId) continue;
          const actor = this.renderer3d.busActors.get(slot.busId);
          if (
            actor &&
            actor.state === 'parked' &&
            actor.data.color === candidateColor &&
            actor.remainingCapacity > 0
          ) {
            matchingActor = actor;
            matchingSlot = slot;
            matchQueueIdx = qIdx;
            break;
          }
        }
      }

      if (matchingActor && matchQueueIdx !== -1) {
        this.deadlockTimer = 0;

        if (this.boardingCooldown <= 0) {
          // Fast boarding cadence so 25-seat buses and 40-seat double-deckers board smoothly at the Door Pad
          this.boardingCooldown = 0.052;
          const targetChunkColor = this.passengerQueue[matchQueueIdx];
          const prevSame =
            matchQueueIdx > 0 &&
            this.passengerQueue[matchQueueIdx - 1] === targetChunkColor;
          const nextSame =
            matchQueueIdx + 1 < this.passengerQueue.length &&
            this.passengerQueue[matchQueueIdx + 1] === targetChunkColor;
          const wasLastOfContiguousChunk = !prevSame && !nextSame;

          const [boardedColor] = this.passengerQueue.splice(matchQueueIdx, 1);
          matchingActor.remainingCapacity = Math.max(0, matchingActor.remainingCapacity - 1);
          matchingActor.boardedCount++;

          // When an entire giant color chunk in the Revolving Circle finishes (0 remaining in that chunk),
          // the 3rd color slot in the circle opens up for the Feeder Line! If a parked blocker vehicle in
          // a bay has its contiguous color chunk waiting in the Feeder Line, slide that chunk to the front
          // of the Feeder Line so it walks straight into the newly opened 3rd circle slot!
          if (wasLastOfContiguousChunk && this.passengerQueue.length > 0) {
            const twoChunkLimit = getCircleActiveQueueLimit(
              this.passengerQueue,
              maxLoopPassengers,
              2
            );
            if (twoChunkLimit < this.passengerQueue.length) {
              const parkedWaitingColors = new Set();
              for (let i = 0; i < this.dockSlots.length; i++) {
                const s = this.dockSlots[i];
                if (!s.busId) continue;
                const act = this.renderer3d.busActors.get(s.busId);
                if (act && act.state === 'parked' && act.remainingCapacity > 0) {
                  parkedWaitingColors.add(act.data.color);
                }
              }
              const frontFeederColor = this.passengerQueue[twoChunkLimit];
              if (
                parkedWaitingColors.size > 0 &&
                !parkedWaitingColors.has(frontFeederColor)
              ) {
                let promoStart = -1;
                let promoEnd = -1;
                for (let idx = twoChunkLimit; idx < this.passengerQueue.length; idx++) {
                  const col = this.passengerQueue[idx];
                  if (parkedWaitingColors.has(col)) {
                    promoStart = idx;
                    promoEnd = idx + 1;
                    while (
                      promoEnd < this.passengerQueue.length &&
                      this.passengerQueue[promoEnd] === col
                    ) {
                      promoEnd++;
                    }
                    break;
                  }
                }
                if (promoStart > twoChunkLimit) {
                  const promotedChunk = this.passengerQueue.splice(
                    promoStart,
                    promoEnd - promoStart
                  );
                  this.passengerQueue.splice(twoChunkLimit, 0, ...promotedChunk);
                }
              }
            }
          }

          // Mechanic 9: Dual-Color Coach switches from Front Color to Rear Color halfway through boarding
          const mState = matchingActor.data.mechanicState;
          if (
            matchingActor.data.mechanic === 'dual_color' &&
            mState &&
            !mState.switchedToSecondary &&
            matchingActor.boardedCount >= mState.switchAtSeated &&
            matchingActor.remainingCapacity > 0
          ) {
            mState.switchedToSecondary = true;
            matchingActor.data.color = mState.secondaryColor;
            this.renderer3d.recolorParkedBus(matchingActor.id, mState.secondaryColor);
            this._flashToast(
              `🎨 Dual-Color Coach switched to ${mState.secondaryColor.toUpperCase()}!`
            );
          }

          this.sound.playPassengerBoard(matchingActor.boardedCount);
          this._updateHudDom();

          const targetBusId = matchingActor.id;
          const isFinalSeat = matchingActor.remainingCapacity === 0;
          const slotIndexToFree = matchingSlot.index;

          this.renderer3d.spawnBoardingRunner(boardedColor, targetBusId, () => {
            if (isFinalSeat) {
              if (this.dockSlots[slotIndexToFree]?.busId === targetBusId) {
                this.dockSlots[slotIndexToFree].busId = null;
              }
              this.sound.playBusDepart();
              this.saveData.score += 100;
              if (this.saveData.score > this.saveData.bestScore) {
                this.saveData.bestScore = this.saveData.score;
              }
              this._saveProgress();

              // Mechanic 10: City Lift Barrier opens once the first full vehicle departs a bay
              for (const b of this.activeGridBuses) {
                if (
                  b.mechanic === 'lift_barrier' &&
                  b.mechanicState &&
                  !b.mechanicState.gateOpen
                ) {
                  b.mechanicState.gateOpen = true;
                  this.renderer3d.syncBusMechanicState(b.id);
                  this._flashToast('🚧 City Lift Barrier Raised!');
                }
              }

              this.renderer3d.triggerBusDeparture(targetBusId, () => {
                this.departedBusesCount++;
                this._checkVictoryCondition();
              });
            }
          });
        }
      }
    }

    this.renderer3d.update(dt, this.passengerQueue, this.elapsedSec, () => {
      this.deadlockTimer = 0;
    });

    this._syncParkedCapacityBadgesDom();

    // Check if all unlocked regular bays are occupied by non-matching parked buses
    const activeRegularBays = this.dockSlots.filter((s, idx) => idx >= 1 && s.unlocked);
    const allRegularOccupied =
      activeRegularBays.length > 0 &&
      activeRegularBays.every((s) => {
        if (!s.busId) return false;
        const act = this.renderer3d.busActors.get(s.busId);
        return act && act.state === 'parked' && act.remainingCapacity > 0;
      });

    if (
      allRegularOccupied &&
      !anyMatchingColorInQueue &&
      this.renderer3d.activeRunners.length === 0 &&
      this.passengerQueue.length > 0
    ) {
      this.deadlockTimer += dt;
      if (this.deadlockTimer >= 1.35) {
        this.deadlockTimer = 0;
        this._triggerDockFullDefeat();
      }
    } else {
      this.deadlockTimer = 0;
    }
  }

  _checkVictoryCondition() {
    if (this.gameState !== 'playing') return;
    if (
      this.activeGridBuses.length === 0 &&
      this.passengerQueue.length === 0 &&
      this.departedBusesCount >= this.totalBusesInStage
    ) {
      // Award +3 Points/Coins when cleared without helpers, or +1 Point/Coin when a helper was used
      const pointsEarned = this.helpersUsedThisStage === 0 ? 3 : 1;
      this.lastEarnedPoints = pointsEarned;
      this.saveData.coins = Math.max(0, (this.saveData.coins || 0) + pointsEarned);
      this.saveData.score += 250;
      if (this.saveData.score > this.saveData.bestScore) {
        this.saveData.bestScore = this.saveData.score;
      }

      const completedLvl = this.saveData.currentLevel;
      this.saveData.currentLevel = completedLvl + 1;
      if (this.saveData.currentLevel > this.saveData.highestLevel) {
        this.saveData.highestLevel = this.saveData.currentLevel;
      }
      this._refreshDockSlotUnlockStates();
      this._saveProgress();

      this.sound.playWinFanfare();
      window.MyPC?.submitScore?.(this.saveData.score);
      window.MyPC?.announce?.(this.t('stageClear'));

      this.outcomeType = 'victory';
      this.setGameState('gameover');
    }
  }

  _triggerDockFullDefeat() {
    if (this.gameState !== 'playing') return;
    window.MyPC?.submitScore?.(this.saveData.score);
    window.MyPC?.announce?.(this.t('dockFull'));
    this.outcomeType = 'defeat';
    this.setGameState('gameover');
  }

  startLoop() {
    if (this.rafId || this.swTimeoutId) return;
    this.lastFrameTs = performance.now();
    this.accumulator = 0;

    const STEP_MS = 1000 / 60;
    const STEP_SEC = 1 / 60;

    const tick = (nowTs) => {
      this.rafId = 0;
      this.swTimeoutId = 0;

      const ts = nowTs || performance.now();
      const elapsedMs = Math.min(200, Math.max(0, ts - this.lastFrameTs));
      this.lastFrameTs = ts;
      this.accumulator += elapsedMs;

      while (this.accumulator >= STEP_MS) {
        this.updateFixedStep(STEP_SEC);
        this.accumulator -= STEP_MS;
      }

      this.renderer3d.render();

      if (this.renderer3d.isSoftwareGl) {
        this._afterDrawSoftwareGl(() => {
          this.rafId = requestAnimationFrame(tick);
        });
      } else {
        this.rafId = requestAnimationFrame(tick);
      }
    };

    this.rafId = requestAnimationFrame(tick);
  }

  _afterDrawSoftwareGl(cb) {
    try {
      const gl = this.renderer3d.renderer.getContext();
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (status === gl.UNSIGNALED) {
            this.swTimeoutId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            this.swTimeoutId = window.setTimeout(cb, 65);
          }
        };
        this.swTimeoutId = window.setTimeout(poll, 5);
        return;
      }
    } catch (_e) {}
    this.swTimeoutId = window.setTimeout(cb, 65);
  }

  stopLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    if (this.swTimeoutId) {
      clearTimeout(this.swTimeoutId);
      this.swTimeoutId = 0;
    }
  }

  _onResize() {
    const prevMode = this.renderer3d?.layoutMode;
    this.renderer3d?.resize();
    if (this.renderer3d && prevMode !== this.renderer3d.layoutMode) {
      this.renderer3d.syncPassengerQueueVisuals(this.passengerQueue, this.elapsedSec);
    }
    const isWideNow = window.innerWidth / Math.max(1, window.innerHeight) >= 1.05;
    if (this._sagaIsWide !== isWideNow) {
      this._buildLevelPickersDom();
      this._updateHudDom();
      if (this.gameState === 'title') {
        this._scrollSagaMapToLevel(this.saveData.currentLevel || this.saveData.highestLevel || 1);
      }
    }
  }

  _flashToast(msg) {
    const banner = document.getElementById('hud-toast');
    if (!banner) return;
    banner.textContent = msg;
    banner.classList.add('visible');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      banner.classList.remove('visible');
    }, 1900);
  }

  _syncParkedCapacityBadgesDom() {
    const container = document.getElementById('parked-badges-layer');
    if (!container || !this.renderer3d) return;

    const badges = this.renderer3d.getParkedBusScreenBadges(
      window.innerWidth,
      window.innerHeight
    );

    // Ensure pool of capacity badges
    while (container.querySelectorAll('.parked-capacity-badge').length < badges.length) {
      const el = document.createElement('div');
      el.className = 'parked-capacity-badge';
      container.appendChild(el);
    }
    const capEls = container.querySelectorAll('.parked-capacity-badge');
    for (let i = 0; i < capEls.length; i++) {
      const el = capEls[i];
      if (i >= badges.length) {
        el.style.display = 'none';
      } else {
        const b = badges[i];
        el.style.display = 'flex';
        el.style.transform = `translate3d(${Math.round(b.x)}px, ${Math.round(b.y)}px, 0) translate(-50%, -50%)`;
        el.style.backgroundColor = b.cssColor;
        const txt = String(b.capacity);
        if (el.textContent !== txt) el.textContent = txt;
      }
    }

    // Floating 3D Mechanic status badge over the stage's single mechanic vehicle
    let mechBadgeEl = document.getElementById('grid-mechanic-floating-badge');
    if (!mechBadgeEl) {
      mechBadgeEl = document.createElement('div');
      mechBadgeEl.id = 'grid-mechanic-floating-badge';
      mechBadgeEl.className = 'grid-mechanic-badge';
      container.appendChild(mechBadgeEl);
    }

    const mechInfo =
      this.gameState === 'playing'
        ? this.renderer3d.getGridMechanicScreenBadge(window.innerWidth, window.innerHeight)
        : null;

    if (!mechInfo) {
      mechBadgeEl.style.display = 'none';
    } else {
      mechBadgeEl.style.display = 'inline-flex';
      mechBadgeEl.style.transform = `translate3d(${Math.round(mechInfo.x)}px, ${Math.round(mechInfo.y)}px, 0) translate(-50%, -100%)`;
      mechBadgeEl.style.borderColor = mechInfo.borderCss || '#38bdf8';
      const label = `${mechInfo.icon} ${mechInfo.text}`;
      if (mechBadgeEl.textContent !== label) {
        mechBadgeEl.textContent = label;
      }
    }
  }

  _updateHudFocusVisuals() {
    const topBtns = [
      document.getElementById('btn-top-home'),
      document.getElementById('btn-top-restart'),
      document.getElementById('btn-top-time'),
      document.getElementById('btn-top-music'),
      document.getElementById('btn-top-pause'),
    ];
    const boosterCards = [
      document.getElementById('btn-booster-vip'),
      document.getElementById('btn-booster-arrange'),
      document.getElementById('btn-booster-shuffle'),
    ];

    for (let i = 0; i < topBtns.length; i++) {
      topBtns[i]?.classList.toggle(
        'tv-focused',
        this.focusZone === 'topbar' && this.focusedTopBtnIdx === i
      );
    }

    for (let i = 0; i < boosterCards.length; i++) {
      boosterCards[i]?.classList.toggle(
        'tv-focused',
        this.focusZone === 'boosters' && this.focusedBoosterIdx === i
      );
    }

    if (this.focusZone === 'bays') {
      this.renderer3d?.setFocusedBay(this.focusedBaySlotIdx);
      this.renderer3d?.setFocusedBus(null);
    } else if (this.focusZone === 'grid') {
      this.renderer3d?.setFocusedBay(-1);
      this.renderer3d?.setFocusedBus(this.focusedBusId);
    } else {
      this.renderer3d?.setFocusedBay(-1);
      this.renderer3d?.setFocusedBus(null);
    }
  }

  _getLightingModeDisplayName() {
    const m = this.saveData.lightingMode || 'auto';
    if (m === 'day') return this.t('modeDay');
    if (m === 'sunset') return this.t('modeSunset');
    if (m === 'night') return this.t('modeNight');
    const activeId = this.renderer3d?.currentTimePreset || 'night';
    const sub =
      activeId === 'day'
        ? this.t('modeDay')
        : activeId === 'sunset'
        ? this.t('modeSunset')
        : this.t('modeNight');
    return `${this.t('modeAuto')} (${sub})`;
  }

  _updateHudDom() {
    const lvlNum = this.stage?.level || this.saveData.currentLevel || 1;
    const highestLvl = Math.max(1, this.saveData.highestLevel || 1);
    const curPoints = Math.max(0, Math.floor(this.saveData.coins || 0));
    const setTxt = (id, text) => {
      const el = document.getElementById(id);
      if (el && el.textContent !== String(text)) el.textContent = String(text);
    };

    setTxt('hud-level-title', `STATION ${String(lvlNum).padStart(2, '0')}`);
    setTxt('hud-sub-meta', `${this.t('queue')}: ${this.passengerQueue.length}`);
    setTxt('hud-coins-meta', `🪙 ${curPoints} PTS`);

    // Active stage mechanic badge in the top HUD bar
    const mechPill = document.getElementById('hud-mechanic-pill');
    if (mechPill) {
      const activeMech = this.stage?.activeMechanic;
      if (activeMech) {
        mechPill.hidden = false;
        const txt = `${activeMech.icon} ${activeMech.name}`;
        if (mechPill.textContent !== txt) mechPill.textContent = txt;
        mechPill.title = activeMech.shortRule || '';
      } else {
        mechPill.hidden = true;
      }
    }

    const modeName = this._getLightingModeDisplayName();
    setTxt('hud-time-label', modeName);
    setTxt('btn-title-time', `${this.t('lighting')}: ${modeName}`);
    setTxt('btn-pause-time', `${this.t('lighting')}: ${modeName}`);

    const musicEnabled = this.saveData.musicEnabled !== false;
    setTxt('hud-music-label', musicEnabled ? this.t('bgmOn') : this.t('bgmOff'));
    setTxt('btn-title-music', musicEnabled ? this.t('musicOn') : this.t('musicOff'));
    setTxt('btn-pause-music', musicEnabled ? this.t('musicOn') : this.t('musicOff'));

    // Count extra bays opened (Slots 5, 6, 7)
    const openedExtraCount = Math.max(
      0,
      Math.min(3, Math.floor(this.saveData.openedExtraBays || 0))
    );

    // Title Modal (Full-Screen Saga Map Home Page) stats
    setTxt('title-stat-lv-val', `${highestLvl} / ${SAGA_TOTAL_NODES}`);
    setTxt('title-stat-score-val', this.saveData.bestScore);
    setTxt('title-stat-points-val', `🪙 ${curPoints}`);
    setTxt('title-stat-coins-val', `${openedExtraCount} / 3`);
    setTxt(
      'btn-title-play',
      `▶ ${this.t('playNow')} · STATION ${String(lvlNum).padStart(2, '0')}`
    );

    // Update '+1 Parking Spot' unlocker buttons in both Title Saga Map & Pause Menu
    const updateSpotUnlockerBtn = (btnId) => {
      const btn = document.getElementById(btnId);
      if (!btn) return;
      if (openedExtraCount >= 3) {
        btn.textContent = this.t('allBaysOpen');
        btn.classList.add('is-disabled-milestone');
      } else {
        const spotNum = openedExtraCount + 1;
        const reqPts = EXTRA_BAY_COSTS[openedExtraCount] || 100;
        const canAfford = curPoints >= reqPts;
        btn.textContent = canAfford
          ? `🔓 Unlock Spot #${spotNum} (${reqPts} PTS · Ready!)`
          : `🔒 Unlock Spot #${spotNum} (${reqPts} PTS · Have ${curPoints})`;
        btn.classList.toggle('is-disabled-milestone', !canAfford);
      }
    };
    updateSpotUnlockerBtn('btn-title-unlock-bay');
    updateSpotUnlockerBtn('btn-pause-unlock-bay');

    // Update City Route Saga Map nodes & progress line
    this._updateSagaMapDom(lvlNum, highestLvl);

    // Update Bottom Booster Bar cards (Milestone unlocks at Level 5, Level 10, Level 15)
    const unlockAll = this.appConfig.unlockAllBoosters;
    const vipUnlocked = unlockAll || highestLvl >= 5 || lvlNum >= 5;
    const arrangeUnlocked = unlockAll || highestLvl >= 10 || lvlNum >= 10;
    const shuffleUnlocked = unlockAll || highestLvl >= 15 || lvlNum >= 15;

    this._renderBoosterCardDom('vip', vipUnlocked, 5, this.saveData.boosters.vip, this.vipSelectionMode);
    this._renderBoosterCardDom('arrange', arrangeUnlocked, 10, this.saveData.boosters.arrange, false);
    this._renderBoosterCardDom('shuffle', shuffleUnlocked, 15, this.saveData.boosters.shuffle, false);

    // Game Over / Victory Modal content
    if (this.gameState === 'gameover') {
      if (this.outcomeType === 'victory') {
        setTxt('gameover-modal-heading', this.t('stageClear'));
        setTxt(
          'gameover-modal-sub',
          this.lastEarnedPoints >= 3 ? this.t('stageClearSub') : this.t('stageClearHelperSub')
        );
        setTxt(
          'btn-gameover-next',
          `${this.t('nextLevel')} (STATION ${String(this.saveData.currentLevel).padStart(2, '0')})`
        );
        setTxt('go-stat-lv-val', Math.max(1, this.saveData.currentLevel - 1));
      } else {
        const frontPassengerColor = (this.passengerQueue[0] || 'matching').toUpperCase();
        setTxt('gameover-modal-heading', this.t('dockFull'));
        setTxt('gameover-modal-sub', this.t('dockFullSub'));
        const costTag =
          curPoints >= CONTINUE_RECOLOR_COST ? ` (-${CONTINUE_RECOLOR_COST} PTS)` : '';
        setTxt(
          'btn-gameover-next',
          `🎨 ${this.t('continueMatchBus')} → ${frontPassengerColor}${costTag}`
        );
        setTxt('go-stat-lv-val', lvlNum);
      }
      setTxt('go-stat-score-val', this.saveData.score);
      setTxt('go-stat-coins-val', `🪙 ${curPoints}`);
    }
  }

  _renderBoosterCardDom(key, isUnlocked, unlockLevel, count, isActiveMode) {
    const card = document.getElementById(`btn-booster-${key}`);
    const lockBadge = document.getElementById(`lock-booster-${key}`);
    const iconWrap = document.getElementById(`icon-booster-${key}`);
    const countBadge = document.getElementById(`badge-booster-${key}`);
    const labelEl = document.getElementById(`label-booster-${key}`);

    if (!card) return;
    card.classList.toggle('is-locked', !isUnlocked);
    card.classList.toggle('is-active-mode', !!isActiveMode);

    if (lockBadge) lockBadge.hidden = isUnlocked;
    if (iconWrap) iconWrap.hidden = !isUnlocked;
    if (countBadge) {
      countBadge.hidden = !isUnlocked;
      countBadge.textContent = count > 0 ? String(count) : '+';
      countBadge.classList.toggle('is-plus', count <= 0);
    }

    if (labelEl) {
      if (!isUnlocked) {
        labelEl.textContent = `${this.t('unlockAt')} ${unlockLevel}`;
      } else if (key === 'vip') {
        labelEl.textContent = this.t('vip');
      } else if (key === 'arrange') {
        labelEl.textContent = this.t('arrange');
      } else {
        labelEl.textContent = this.t('jumble');
      }
    }
  }

  showExportJsonModal() {
    const exportTextarea = document.getElementById('export-json-box');
    if (this.gameState !== 'paused') {
      this.setGameState('paused');
    }
    if (exportTextarea) {
      exportTextarea.hidden = false;
      exportTextarea.value = this.levelManager.exportStageJson(this.saveData.currentLevel);
    }
  }

  /**
   * Builds the 100-Station Winding City Route Saga Map inside #title-level-picker.
   * - On TV Wide-Screen (`aspect >= 1.05`): renders a HORIZONTAL Winding City Route
   *   meandering through city blocks, green parks, rivers/canals, and crosswalks (never a straight highway).
   * - On Vertical Mobile (`aspect < 1.05`): renders a VERTICAL Winding City Route.
   * - Each level is a Transit Station (`STN 01` .. `STN 100`), with debut tags for the 10 progressive mechanics.
   */
  _buildLevelPickersDom() {
    const scrollEl = document.getElementById('title-saga-scroll');
    const container = document.getElementById('title-level-picker');
    if (!container) return;
    container.innerHTML = '';

    const isWide = window.innerWidth / Math.max(1, window.innerHeight) >= 1.05;
    this._sagaIsWide = isWide;

    if (scrollEl) {
      scrollEl.classList.toggle('is-wide-horizontal', isWide);
    }
    container.classList.toggle('is-wide-horizontal', isWide);

    const totalNodes = Math.max(SAGA_TOTAL_NODES, (this.saveData.highestLevel || 1) + 5);
    const coords = [];

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'saga-path-svg');
    svg.setAttribute('preserveAspectRatio', 'none');

    if (isWide) {
      // HORIZONTAL WINDING CITY ROUTE (TV / Wide Screen)
      const stepX = 118;
      const padX = 110;
      const totalWidth = padX * 2 + (totalNodes - 1) * stepX;
      const svgH = 540;

      container.style.width = `${totalWidth}px`;
      container.style.height = '100%';
      svg.setAttribute('viewBox', `0 0 ${totalWidth} ${svgH}`);

      for (let i = 0; i < totalNodes; i++) {
        const lvl = i + 1;
        const xPx = padX + i * stepX;
        // Organic winding city street curve (combining two harmonics so it meanders around city blocks and parks)
        const wave = Math.sin(i * 0.62) * 28 + Math.cos(i * 0.27) * 11;
        const yPct = Math.max(16, Math.min(84, 51 + wave));
        const svgY = (yPct / 100) * svgH;
        coords.push({ lvl, xPx, yPct, svgX: xPx, svgY });
      }

      // Render atmospheric city blocks, parks, rivers/canals, and avenues behind the road
      const cityDecorGroup = document.createElementNS(svgNS, 'g');
      for (let bx = 40; bx < totalWidth - 80; bx += 236) {
        const idx = Math.floor(bx / 236);
        // Canal / River crossing every 5th block
        if (idx % 5 === 2) {
          const river = document.createElementNS(svgNS, 'path');
          river.setAttribute(
            'd',
            `M ${bx + 70} 0 Q ${bx + 115} ${svgH * 0.5} ${bx + 60} ${svgH}`
          );
          river.setAttribute('fill', 'none');
          river.setAttribute('stroke', 'rgba(14, 116, 144, 0.34)');
          river.setAttribute('stroke-width', '54');
          cityDecorGroup.appendChild(river);
        }

        // Top & bottom city blocks / parks
        const topIsPark = idx % 3 === 1;
        const topRect = document.createElementNS(svgNS, 'rect');
        topRect.setAttribute('x', String(bx));
        topRect.setAttribute('y', '18');
        topRect.setAttribute('width', '175');
        topRect.setAttribute('height', '115');
        topRect.setAttribute('rx', '16');
        topRect.setAttribute(
          'fill',
          topIsPark ? 'rgba(16, 185, 129, 0.13)' : 'rgba(30, 41, 59, 0.55)'
        );
        topRect.setAttribute(
          'stroke',
          topIsPark ? 'rgba(52, 211, 153, 0.25)' : 'rgba(71, 85, 105, 0.38)'
        );
        topRect.setAttribute('stroke-width', '2');
        cityDecorGroup.appendChild(topRect);

        const botIsPark = idx % 3 === 2;
        const botRect = document.createElementNS(svgNS, 'rect');
        botRect.setAttribute('x', String(bx + 28));
        botRect.setAttribute('y', String(svgH - 138));
        botRect.setAttribute('width', '182');
        botRect.setAttribute('height', '116');
        botRect.setAttribute('rx', '16');
        botRect.setAttribute(
          'fill',
          botIsPark ? 'rgba(16, 185, 129, 0.13)' : 'rgba(30, 41, 59, 0.55)'
        );
        botRect.setAttribute(
          'stroke',
          botIsPark ? 'rgba(52, 211, 153, 0.25)' : 'rgba(71, 85, 105, 0.38)'
        );
        botRect.setAttribute('stroke-width', '2');
        cityDecorGroup.appendChild(botRect);

        // Cross-street avenue grid lines
        const crossSt = document.createElementNS(svgNS, 'line');
        crossSt.setAttribute('x1', String(bx + 90));
        crossSt.setAttribute('y1', '0');
        crossSt.setAttribute('x2', String(bx + 90));
        crossSt.setAttribute('y2', String(svgH));
        crossSt.setAttribute('stroke', 'rgba(51, 65, 85, 0.32)');
        crossSt.setAttribute('stroke-width', '14');
        cityDecorGroup.appendChild(crossSt);
      }
      svg.appendChild(cityDecorGroup);
    } else {
      // VERTICAL WINDING CITY ROUTE (Phone / Portrait Screen)
      const stepY = 86;
      const padTop = 64;
      const totalHeight = padTop * 2 + (totalNodes - 1) * stepY;
      const svgW = 600;

      container.style.width = '100%';
      container.style.height = `${totalHeight}px`;
      svg.setAttribute('viewBox', `0 0 ${svgW} ${totalHeight}`);

      for (let i = 0; i < totalNodes; i++) {
        const lvl = i + 1;
        const wave = Math.sin(i * 0.72) * 28 + Math.cos(i * 0.31) * 8;
        const xPct = Math.max(16, Math.min(84, 50 + wave));
        const svgX = (xPct / 100) * svgW;
        const yPx = padTop + i * stepY;
        coords.push({ lvl, xPct, yPx, svgX, svgY: yPx });
      }

      const cityDecorGroup = document.createElementNS(svgNS, 'g');
      for (let by = 50; by < totalHeight - 100; by += 240) {
        const idx = Math.floor(by / 240);
        if (idx % 5 === 2) {
          const river = document.createElementNS(svgNS, 'path');
          river.setAttribute(
            'd',
            `M 0 ${by + 70} Q ${svgW * 0.5} ${by + 115} ${svgW} ${by + 60}`
          );
          river.setAttribute('fill', 'none');
          river.setAttribute('stroke', 'rgba(14, 116, 144, 0.32)');
          river.setAttribute('stroke-width', '46');
          cityDecorGroup.appendChild(river);
        }

        const leftRect = document.createElementNS(svgNS, 'rect');
        leftRect.setAttribute('x', '18');
        leftRect.setAttribute('y', String(by));
        leftRect.setAttribute('width', '130');
        leftRect.setAttribute('height', '165');
        leftRect.setAttribute('rx', '16');
        leftRect.setAttribute(
          'fill',
          idx % 3 === 1 ? 'rgba(16, 185, 129, 0.13)' : 'rgba(30, 41, 59, 0.52)'
        );
        cityDecorGroup.appendChild(leftRect);

        const rightRect = document.createElementNS(svgNS, 'rect');
        rightRect.setAttribute('x', String(svgW - 148));
        rightRect.setAttribute('y', String(by + 30));
        rightRect.setAttribute('width', '130');
        rightRect.setAttribute('height', '165');
        rightRect.setAttribute('rx', '16');
        rightRect.setAttribute(
          'fill',
          idx % 3 === 2 ? 'rgba(16, 185, 129, 0.13)' : 'rgba(30, 41, 59, 0.52)'
        );
        cityDecorGroup.appendChild(rightRect);
      }
      svg.appendChild(cityDecorGroup);
    }

    this._sagaNodeCoords = coords;

    // Build smooth cubic Bezier SVG path string for either Horizontal or Vertical city route
    const buildSvgPath = (pts) => {
      if (pts.length === 0) return '';
      let d = `M ${pts[0].svgX.toFixed(1)} ${pts[0].svgY.toFixed(1)}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        if (isWide) {
          const midX = (p0.svgX + p1.svgX) / 2;
          d += ` C ${midX.toFixed(1)} ${p0.svgY.toFixed(1)}, ${midX.toFixed(1)} ${p1.svgY.toFixed(1)}, ${p1.svgX.toFixed(1)} ${p1.svgY.toFixed(1)}`;
        } else {
          const midY = (p0.svgY + p1.svgY) / 2;
          d += ` C ${p0.svgX.toFixed(1)} ${midY.toFixed(1)}, ${p1.svgX.toFixed(1)} ${midY.toFixed(1)}, ${p1.svgX.toFixed(1)} ${p1.svgY.toFixed(1)}`;
        }
      }
      return d;
    };

    this._buildSagaSvgPathFn = buildSvgPath;
    const fullPathD = buildSvgPath(coords);

    // 1. City sidewalk / curb outline
    const roadBorder = document.createElementNS(svgNS, 'path');
    roadBorder.setAttribute('d', fullPathD);
    roadBorder.setAttribute('fill', 'none');
    roadBorder.setAttribute('stroke', '#475569');
    roadBorder.setAttribute('stroke-width', '40');
    roadBorder.setAttribute('stroke-linecap', 'round');
    svg.appendChild(roadBorder);

    // 2. Dark city asphalt road surface
    const roadBase = document.createElementNS(svgNS, 'path');
    roadBase.setAttribute('d', fullPathD);
    roadBase.setAttribute('fill', 'none');
    roadBase.setAttribute('stroke', '#0f172a');
    roadBase.setAttribute('stroke-width', '30');
    roadBase.setAttribute('stroke-linecap', 'round');
    svg.appendChild(roadBase);

    // 3. Glowing unlocked transit line trail
    const progressPath = document.createElementNS(svgNS, 'path');
    progressPath.setAttribute('id', 'saga-progress-path');
    progressPath.setAttribute('d', '');
    progressPath.setAttribute('fill', 'none');
    progressPath.setAttribute('stroke', '#38bdf8');
    progressPath.setAttribute('stroke-width', '10');
    progressPath.setAttribute('stroke-linecap', 'round');
    svg.appendChild(progressPath);

    // 4. Dashed amber city lane divider
    const centerLine = document.createElementNS(svgNS, 'path');
    centerLine.setAttribute('d', fullPathD);
    centerLine.setAttribute('fill', 'none');
    centerLine.setAttribute('stroke', 'rgba(250, 204, 21, 0.55)');
    centerLine.setAttribute('stroke-width', '3');
    centerLine.setAttribute('stroke-dasharray', '10 12');
    centerLine.setAttribute('stroke-linecap', 'round');
    svg.appendChild(centerLine);

    container.appendChild(svg);

    // 5 City Districts across 100 Stations
    const districtTitles = {
      1: '🏙️ District 1 · Downtown Loop (Stations 1–20)',
      21: '⚓ District 2 · Harbor Docks (Stations 21–40)',
      41: '🌇 District 3 · Midtown Plaza (Stations 41–60)',
      61: '🧪 District 4 · Tech Campus (Stations 61–80)',
      81: '🌃 District 5 · Uptown Skyline (Stations 81–100)',
    };

    // Debut levels for the 10 progressive mechanics (1 new mechanic every 10 levels)
    const mechanicDebutByLevel = {};
    STAGE_MECHANICS.forEach((m) => {
      mechanicDebutByLevel[m.debutLevel] = m;
    });

    const spotCostTags = {
      4: { spot: 1, cost: 10 },
      15: { spot: 2, cost: 30 },
      35: { spot: 3, cost: 100 },
    };

    // Create interactive 3D Station node buttons along the winding city street
    coords.forEach((pt) => {
      const { lvl } = pt;

      if (districtTitles[lvl]) {
        const banner = document.createElement('div');
        banner.className = 'saga-district-banner';
        if (isWide) {
          banner.style.left = `${pt.xPx}px`;
          banner.style.top = '18px';
        } else {
          banner.style.top = `${Math.max(18, pt.yPx - 46)}px`;
        }
        banner.textContent = districtTitles[lvl];
        container.appendChild(banner);
      }

      if (spotCostTags[lvl]) {
        const info = spotCostTags[lvl];
        const tag = document.createElement('div');
        tag.className = 'saga-milestone-tag';
        tag.setAttribute('data-spot-idx', String(info.spot));
        tag.setAttribute('data-spot-cost', String(info.cost));
        if (isWide) {
          tag.style.left = `${pt.xPx}px`;
          tag.style.top = `${pt.yPct > 50 ? pt.yPct - 22 : pt.yPct + 22}%`;
        } else {
          const tagXPct = pt.xPct > 50 ? pt.xPct - 24 : pt.xPct + 24;
          tag.style.left = `${tagXPct}%`;
          tag.style.top = `${pt.yPx}px`;
        }
        tag.textContent = `🅿️ SPOT #${info.spot} · ${info.cost} PTS`;
        container.appendChild(tag);
      }

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'saga-node-btn';
      btn.setAttribute('data-level', String(lvl));
      if (mechanicDebutByLevel[lvl]) {
        btn.setAttribute(
          'data-mech-debut',
          `${mechanicDebutByLevel[lvl].icon} NEW: ${mechanicDebutByLevel[lvl].name}`
        );
      }

      if (isWide) {
        btn.style.left = `${pt.xPx}px`;
        btn.style.top = `${pt.yPct}%`;
      } else {
        btn.style.left = `${pt.xPct}%`;
        btn.style.top = `${pt.yPx}px`;
      }

      btn.addEventListener('click', () => {
        this.sound.initInOnStart();
        const highestLvl = Math.max(1, this.saveData.highestLevel || 1);
        if (lvl > highestLvl) {
          this.sound.playHorn();
          const msg = this.t('levelLockedToast')
            .replace('{prev}', String(lvl - 1))
            .replace('{lvl}', String(lvl));
          this._flashToast(msg);
          return;
        }
        this.loadStage(lvl);
        this.setGameState('playing');
      });

      container.appendChild(btn);
    });
  }

  /**
   * Updates all 100 Station nodes on the City Route Saga Map.
   */
  _updateSagaMapDom(currentLvl, highestLvl) {
    const container = document.getElementById('title-level-picker');
    if (!container) return;

    const coords = this._sagaNodeCoords || [];
    const progressPath = document.getElementById('saga-progress-path');
    if (progressPath && coords.length > 0 && this._buildSagaSvgPathFn) {
      const unlockedPts = coords.slice(0, Math.min(coords.length, highestLvl));
      if (unlockedPts.length <= 1) {
        progressPath.setAttribute('d', '');
      } else {
        progressPath.setAttribute('d', this._buildSagaSvgPathFn(unlockedPts));
      }
    }

    const openedExtra = Math.max(0, Math.min(3, Math.floor(this.saveData.openedExtraBays || 0)));
    const curPoints = Math.max(0, Math.floor(this.saveData.coins || 0));

    // Highlight active District Quick-Jump Tab
    const districtTabs = document.querySelectorAll('.saga-district-tab');
    districtTabs.forEach((tab) => {
      const startLvl = parseInt(tab.getAttribute('data-start-level') || '1', 10);
      const isCurrentDistrict = currentLvl >= startLvl && currentLvl < startLvl + 20;
      tab.classList.toggle('is-active', isCurrentDistrict);
    });

    // Update parking spot milestone tags
    const milestoneTags = container.querySelectorAll('.saga-milestone-tag');
    milestoneTags.forEach((tag) => {
      const spotIdx = parseInt(tag.getAttribute('data-spot-idx') || '1', 10);
      const cost = parseInt(tag.getAttribute('data-spot-cost') || '10', 10);
      const isOpened = openedExtra >= spotIdx;
      const isReady = openedExtra === spotIdx - 1 && curPoints >= cost;
      tag.classList.toggle('is-earned', isOpened || isReady);
      if (isOpened) {
        tag.textContent = `✅ SPOT #${spotIdx} UNLOCKED`;
      } else if (isReady) {
        tag.textContent = `🔓 SPOT #${spotIdx} · ${cost} PTS READY!`;
      } else {
        tag.textContent = `🔒 SPOT #${spotIdx} · ${cost} PTS`;
      }
    });

    const nodes = container.querySelectorAll('.saga-node-btn');
    nodes.forEach((btn) => {
      const lvl = parseInt(btn.getAttribute('data-level') || '1', 10);
      const isCompleted = lvl < highestLvl;
      const isFrontier = lvl === highestLvl;
      const isLocked = lvl > highestLvl;
      const isSelected = lvl === currentLvl;
      const mechDebut = btn.getAttribute('data-mech-debut') || '';

      btn.classList.toggle('is-completed', isCompleted);
      btn.classList.toggle('is-frontier', isFrontier);
      btn.classList.toggle('is-locked', isLocked);
      btn.classList.toggle('is-selected', isSelected && !isFrontier);
      btn.setAttribute(
        'aria-label',
        isLocked ? `Station ${lvl} Locked` : `Play Station ${lvl}`
      );

      const desiredStateKey = `${lvl}_${isCompleted ? 'c' : isFrontier ? 'f' : 'l'}`;
      if (btn.getAttribute('data-render-key') !== desiredStateKey) {
        btn.setAttribute('data-render-key', desiredStateKey);
        const stnCode = `STN ${String(lvl).padStart(2, '0')}`;
        const mechBadgeHtml = mechDebut
          ? `<span class="saga-node-mech-badge">${mechDebut}</span>`
          : '';

        if (isCompleted) {
          btn.innerHTML = `
            <span class="saga-node-stars">★★★</span>
            <span class="saga-node-stn-kicker">${stnCode}</span>
            <span class="saga-node-num">${lvl}</span>
            ${mechBadgeHtml}
          `;
        } else if (isFrontier) {
          btn.innerHTML = `
            <span class="saga-node-bus-pin">🚌 PLAY</span>
            <span class="saga-node-stn-kicker">${stnCode}</span>
            <span class="saga-node-num">${lvl}</span>
            ${mechBadgeHtml}
          `;
        } else {
          btn.innerHTML = `
            <span class="saga-node-stn-kicker">${stnCode}</span>
            <span class="saga-node-num">${lvl}</span>
            <svg class="saga-node-lock-svg" viewBox="0 0 24 24" fill="none">
              <path d="M7 10V7a5 5 0 0 1 10 0v3" stroke="#d97706" stroke-width="2.6" stroke-linecap="round"/>
              <rect x="5" y="10" width="14" height="11" rx="3" fill="#f59e0b" stroke="#b45309" stroke-width="1.5"/>
            </svg>
            ${mechBadgeHtml}
          `;
        }
      }
    });
  }

  _scrollSagaMapToLevel(targetLvl) {
    const scrollEl = document.getElementById('title-saga-scroll');
    const container = document.getElementById('title-level-picker');
    if (!scrollEl || !container) return;
    const node = container.querySelector(`.saga-node-btn[data-level="${targetLvl}"]`);
    if (node instanceof HTMLElement) {
      if (this._sagaIsWide) {
        const left = Math.max(0, node.offsetLeft - scrollEl.clientWidth / 2 + 34);
        scrollEl.scrollTo({ left, top: 0, behavior: 'smooth' });
      } else {
        const top = Math.max(0, node.offsetTop - scrollEl.clientHeight / 2 + 34);
        scrollEl.scrollTo({ top, left: 0, behavior: 'smooth' });
      }
    }
  }

  _applyTranslations() {
    const setTxt = (id, key) => {
      const el = document.getElementById(id);
      if (el) el.textContent = this.t(key);
    };
    setTxt('title-modal-heading', 'title');
    setTxt('title-modal-sub', 'subtitle');
    setTxt('title-stat-lv-kicker', 'stage');
    setTxt('title-stat-score-kicker', 'best');
    setTxt('title-stat-points-kicker', 'coins');
    setTxt('title-stat-coins-kicker', 'extraBays');
    setTxt('hud-controls-strip', 'controlsHint');
    setTxt('pause-modal-heading', 'paused');
    setTxt('btn-pause-resume', 'resume');
    setTxt('btn-pause-restart', 'restart');
    setTxt('btn-pause-map', 'sagaMapBtn');
    setTxt('btn-pause-unlock-bay', 'unlockBayBtn');
    setTxt('btn-pause-export', 'exportJson');
    setTxt('go-stat-lv-kicker', 'stage');
    setTxt('go-stat-score-kicker', 'score');
    setTxt('go-stat-coins-kicker', 'coins');
    setTxt('btn-gameover-retry', 'tryAgain');
    setTxt('btn-gameover-map', 'sagaMapBtn');
  }

  _bindDomUiEvents() {
    const blurAndRun = (ev, fn) => {
      if (ev && ev.currentTarget instanceof HTMLElement) {
        ev.currentTarget.blur();
      }
      fn();
    };

    // Title Modal (Full-Screen Transit Saga Map Home Page) buttons
    document.getElementById('btn-title-play')?.addEventListener('click', (e) =>
      blurAndRun(e, () => {
        this.sound.initInOnStart();
        this.loadStage(this.saveData.currentLevel || this.saveData.highestLevel || 1);
        this.setGameState('playing');
      })
    );
    document.getElementById('btn-title-unlock-bay')?.addEventListener('click', (e) =>
      blurAndRun(e, () => {
        this.unlockNextParkingBay();
      })
    );
    document.getElementById('btn-title-time')?.addEventListener('click', (e) =>
      blurAndRun(e, () => this.cycleTimeOfDay())
    );
    document.getElementById('btn-title-music')?.addEventListener('click', (e) =>
      blurAndRun(e, () => this.toggleMusic())
    );

    // 5 City District Quick-Jump Tabs on the Saga Map
    document.querySelectorAll('.saga-district-tab').forEach((tab) => {
      tab.addEventListener('click', (e) =>
        blurAndRun(e, () => {
          const startLvl = parseInt(tab.getAttribute('data-start-level') || '1', 10);
          document.querySelectorAll('.saga-district-tab').forEach((t) => {
            t.classList.toggle('is-active', t === tab);
          });
          this._scrollSagaMapToLevel(startLvl);
        })
      );
    });

    // Top HUD Bar buttons (including direct Home / Saga Map button)
    document.getElementById('btn-top-home')?.addEventListener('click', (e) =>
      blurAndRun(e, () => {
        this.sound.initInOnStart();
        this.setGameState('title');
      })
    );
    document.getElementById('btn-top-restart')?.addEventListener('click', (e) =>
      blurAndRun(e, () => {
        this.sound.initInOnStart();
        this.loadStage(this.saveData.currentLevel);
        this.setGameState('playing');
      })
    );
    document.getElementById('btn-top-time')?.addEventListener('click', (e) =>
      blurAndRun(e, () => this.cycleTimeOfDay())
    );
    document.getElementById('btn-top-music')?.addEventListener('click', (e) =>
      blurAndRun(e, () => this.toggleMusic())
    );
    document.getElementById('btn-top-pause')?.addEventListener('click', (e) =>
      blurAndRun(e, () => this.togglePauseModal())
    );

    // Bottom Booster cards (VIP, Arrange, Jumble)
    document.getElementById('btn-booster-vip')?.addEventListener('click', (e) =>
      blurAndRun(e, () => this.activateBooster('vip'))
    );
    document.getElementById('btn-booster-arrange')?.addEventListener('click', (e) =>
      blurAndRun(e, () => this.activateBooster('arrange'))
    );
    document.getElementById('btn-booster-shuffle')?.addEventListener('click', (e) =>
      blurAndRun(e, () => this.activateBooster('shuffle'))
    );

    // Pause Modal buttons
    document.getElementById('btn-pause-resume')?.addEventListener('click', (e) =>
      blurAndRun(e, () => this.setGameState('playing'))
    );
    document.getElementById('btn-pause-restart')?.addEventListener('click', (e) =>
      blurAndRun(e, () => {
        this.loadStage(this.saveData.currentLevel);
        this.setGameState('playing');
      })
    );
    document.getElementById('btn-pause-map')?.addEventListener('click', (e) =>
      blurAndRun(e, () => {
        this.setGameState('title');
      })
    );
    document.getElementById('btn-pause-time')?.addEventListener('click', (e) =>
      blurAndRun(e, () => this.cycleTimeOfDay())
    );
    document.getElementById('btn-pause-music')?.addEventListener('click', (e) =>
      blurAndRun(e, () => this.toggleMusic())
    );
    document.getElementById('btn-pause-unlock-bay')?.addEventListener('click', (e) =>
      blurAndRun(e, () => {
        this.unlockNextParkingBay();
      })
    );
    document.getElementById('btn-pause-export')?.addEventListener('click', (e) =>
      blurAndRun(e, () => this.showExportJsonModal())
    );

    // Game Over / Victory Modal buttons
    document.getElementById('btn-gameover-next')?.addEventListener('click', (e) =>
      blurAndRun(e, () => {
        if (this.outcomeType === 'defeat') {
          this.continueByRecoloringLastParkedBus();
        } else {
          this.loadStage(this.saveData.currentLevel);
          this.setGameState('playing');
        }
      })
    );
    document.getElementById('btn-gameover-retry')?.addEventListener('click', (e) =>
      blurAndRun(e, () => {
        const retryLvl =
          this.outcomeType === 'victory'
            ? Math.max(1, this.saveData.currentLevel - 1)
            : this.saveData.currentLevel;
        this.loadStage(retryLvl);
        this.setGameState('playing');
      })
    );
    document.getElementById('btn-gameover-map')?.addEventListener('click', (e) =>
      blurAndRun(e, () => {
        this.setGameState('title');
      })
    );
  }
}

// Boot the game
const game = new BusFeverGame();
window.__busFeverGame = game;
game.initSdk();
