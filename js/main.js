/**
 * Bus Fever 3D: Traffic Escape — Main Game Controller, Dynamic Day/Sunset/Night & My PC SDK Lifecycle
 */

import {
  findBlockingBus,
  getBusWorldCenter,
} from './solver.js';
import { LevelManager } from './levelManager.js';
import { Renderer3D, GRID_ORIGIN_Z } from './renderer3d.js';
import { InputController } from './input.js';
import { SoundEngine } from './audio.js';

const I18N = {
  en: {
    title: 'Bus Fever 3D: Traffic Escape',
    subtitle: 'Clear the 3D bus jam, park in angled bays, and board the looping passenger crowd!',
    playNow: 'Play Stage',
    level: 'Level',
    stage: 'Stage',
    queue: 'Queue',
    vip: 'VIP Slot',
    arrange: 'Arrange',
    jumble: 'Jumble',
    unlockAt: 'Level',
    paused: 'Paused',
    resume: 'Resume',
    restart: 'Restart Stage',
    unlockBayBtn: '+1 Parking Bay',
    exportJson: 'Export Procedural Level JSON',
    stageClear: 'Stage Clear!',
    stageClearSub: 'All passengers boarded and every bus escaped the traffic jam!',
    dockFull: 'Parking Bays Full!',
    dockFullSub: 'All active parking bays are occupied! Auto-sorting & unlocking a bay to continue.',
    nextLevel: 'Next Level',
    tryAgain: 'Replay Stage',
    score: 'Score',
    best: 'Best',
    coins: 'Coins',
    blockedToast: 'Path blocked by another bus!',
    bayUnlockedToast: 'Unlocked +1 Parking Bay!',
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
      'TV Remote Arrows / D-Pad: Navigate All Zones & Bays · OK / [A]: Select · [Y] VIP · [X] Arrange · [LB] Jumble · [RB] +1 Bay',
  },
  fr: {
    title: 'Bus Fever 3D: Traffic Escape',
    subtitle: 'Dégagez les bus 3D, garez-vous en épi et embarquez la foule de passagers !',
    playNow: 'Jouer le Niveau',
    level: 'Niveau',
    stage: 'Niveau',
    queue: 'File',
    vip: 'Quai VIP',
    arrange: 'Trier',
    jumble: 'Mélanger',
    unlockAt: 'Niveau',
    paused: 'Pause',
    resume: 'Reprendre',
    restart: 'Recommencer',
    unlockBayBtn: '+1 Quai de Bus',
    exportJson: 'Exporter JSON du Niveau',
    stageClear: 'Niveau Terminé !',
    stageClearSub: 'Tous les passagers sont montés à bord !',
    dockFull: 'Quais Complets !',
    dockFullSub: 'Tous les quais actifs sont occupés.',
    nextLevel: 'Niveau Suivant',
    tryAgain: 'Rejouer',
    score: 'Score',
    best: 'Record',
    coins: 'Pièces',
    blockedToast: 'Passage bloqué par un autre bus !',
    bayUnlockedToast: '+1 Quai débloqué !',
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
    title: 'Bus Fever 3D: Traffic Escape',
    subtitle: '¡Despeja el atasco 3D, aparca en las bahías y embarca a los pasajeros!',
    playNow: 'Jugar Nivel',
    level: 'Nivel',
    stage: 'Nivel',
    queue: 'Fila',
    vip: 'Bahía VIP',
    arrange: 'Ordenar',
    jumble: 'Mezclar',
    unlockAt: 'Nivel',
    paused: 'Pausa',
    resume: 'Continuar',
    restart: 'Reiniciar Nivel',
    unlockBayBtn: '+1 Bahía Extra',
    exportJson: 'Exportar JSON del Nivel',
    stageClear: '¡Nivel Completado!',
    stageClearSub: '¡Todos los pasajeros subieron y los autobuses escaparon!',
    dockFull: '¡Bahías Llenas!',
    dockFullSub: 'Todas las bahías activas están ocupadas.',
    nextLevel: 'Siguiente Nivel',
    tryAgain: 'Reintentar',
    score: 'Puntos',
    best: 'Mejor',
    coins: 'Monedas',
    blockedToast: '¡Camino bloqueado por otro autobús!',
    bayUnlockedToast: '¡+1 Bahía desbloqueada!',
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
    title: 'حمى الحافلات 3D: الهروب من الزحام',
    subtitle: 'فك تشابك الحافلات ثلاثية الأبعاد، اركن في المواقف المائلة، وأركب المسافرين!',
    playNow: 'العب المستوى',
    level: 'المستوى',
    stage: 'المستوى',
    queue: 'الطابور',
    vip: 'موقف VIP',
    arrange: 'ترتيب',
    jumble: 'خلط',
    unlockAt: 'مستوى',
    paused: 'إيقاف مؤقت',
    resume: 'استئناف',
    restart: 'إعادة المستوى',
    unlockBayBtn: '+1 موقف إضافي',
    exportJson: 'تصدير JSON للمستوى',
    stageClear: 'تم اجتياز المستوى!',
    stageClearSub: 'صعد جميع الركاب وانطلقت كل الحافلات بنجاح!',
    dockFull: 'المواقف ممتلئة!',
    dockFullSub: 'جميع المواقف مشغولة حالياً.',
    nextLevel: 'المستوى التالي',
    tryAgain: 'إعادة المحاولة',
    score: 'النقاط',
    best: 'الأفضل',
    coins: 'العملات',
    blockedToast: 'الطريق مسدود بحافلة أخرى!',
    bayUnlockedToast: 'تم فتح موقف إضافي!',
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
      score: 0,
      bestScore: 0,
      coins: 150,
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

    // 4-Zone Spatial Navigation for TV Remote & Gamepad
    // Zones: 'topbar' (4 buttons) <-> 'bays' (locked '+' bays in Zone B) <-> 'grid' (3D buses in Zone C) <-> 'boosters' (3 cards)
    this.focusZone = 'grid';
    this.focusedTopBtnIdx = 0; // 0: Restart, 1: TimeOfDay, 2: Music, 3: Pause
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
          } else if (id === 'next_level') {
            this.loadStage(this.saveData.currentLevel + 1);
            this.setGameState('playing');
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
      }
    }

    const lvlMatch = /[?&]level=(\d+)/i.exec(window.location.search);
    if (lvlMatch) {
      this.saveData.currentLevel = Math.max(1, parseInt(lvlMatch[1], 10));
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
        { id: 'restart', label: this.t('restart') },
        { id: 'next_level', label: this.t('nextLevel') },
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
   * Loads a stage (from pack-01.json or Reverse-Peel Generator) and initializes Zone A, B, and C.
   */
  loadStage(levelNumber) {
    const lvl = Math.max(1, Math.floor(levelNumber || 1));
    this.saveData.currentLevel = lvl;
    if (lvl > this.saveData.highestLevel) {
      this.saveData.highestLevel = lvl;
    }

    if (lvl >= 5 && this.saveData.boosters.vip < 1) this.saveData.boosters.vip = 2;
    if (lvl >= 10 && this.saveData.boosters.arrange < 1) this.saveData.boosters.arrange = 2;
    if (lvl >= 15 && this.saveData.boosters.shuffle < 1) this.saveData.boosters.shuffle = 2;

    this._saveProgress();

    this.stage = this.levelManager.getStage(lvl);
    this.activeGridBuses = this.stage.buses.map((b) => ({ ...b }));
    this.passengerQueue = this.stage.passengerQueue.slice();
    this.totalBusesInStage = this.stage.buses.length;
    this.departedBusesCount = 0;
    this.vipSelectionMode = false;
    this.deadlockTimer = 0;
    this.boardingCooldown = 0;
    this.stageStartSec = this.elapsedSec;

    const initialActive = this.appConfig.initialUnlockedBays || 4;
    this.dockSlots = [];
    for (let i = 0; i < 8; i++) {
      this.dockSlots.push({
        index: i,
        isVip: i === 0,
        unlocked: i === 0 || (i >= 1 && i <= initialActive),
        busId: null,
      });
    }

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
      this._refreshModalButtonsFocus(newState);
    }

    this._updateHudDom();
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
    this.modalButtons = Array.from(
      container.querySelectorAll('button:not([disabled]):not([hidden])')
    );
    this.focusedModalBtnIdx = 0;
    this._applyModalButtonFocus();
  }

  _applyModalButtonFocus() {
    for (let i = 0; i < this.modalButtons.length; i++) {
      this.modalButtons[i].classList.toggle('tv-focused', i === this.focusedModalBtnIdx);
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
    this.saveData.boosters.vip = Math.max(0, this.saveData.boosters.vip - 1);
    this._saveProgress();

    this.activeGridBuses.splice(busIdx, 1);
    this.dockSlots[targetBay].busId = bus.id;
    this.sound.playBooster();
    this.renderer3d.triggerHeliLiftToBay(bus.id, targetBay);
    this._selectDefaultBusFocus();
    this._updateHudDom();
  }

  /**
   * Unlocks the next locked '+' parking bay in Zone B (Slots 5, 6, 7).
   */
  unlockNextParkingBay(specificBayIdx) {
    this.sound.initInOnStart();
    let target = -1;
    if (
      specificBayIdx !== undefined &&
      this.dockSlots[specificBayIdx] &&
      !this.dockSlots[specificBayIdx].unlocked
    ) {
      target = specificBayIdx;
    } else {
      target = this.dockSlots.findIndex((s, idx) => idx >= 5 && !s.unlocked);
    }

    if (target === -1) return;

    this.dockSlots[target].unlocked = true;
    this.deadlockTimer = 0;
    this.sound.playBooster();
    this.renderer3d.updateBaySlotsVisuals(this.dockSlots);
    this._flashToast(this.t('bayUnlockedToast'));

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
   * Full 4-Zone Spatial TV Remote & Gamepad Navigation:
   * - Modals: Cycles through all visible buttons & level chips
   * - 'topbar': Replay (0), Time of Day (1), Music (2), Pause (3)
   * - 'bays': Locked '+' Parking Bays in Zone B (Slots 5, 6, 7)
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

    // 2. Top Utility Bar (4 buttons: Restart, Time-of-Day, Music, Pause)
    if (this.focusZone === 'topbar') {
      if (dir === 'left') {
        this.focusedTopBtnIdx = (this.focusedTopBtnIdx + 3) % 4;
      } else if (dir === 'right') {
        this.focusedTopBtnIdx = (this.focusedTopBtnIdx + 1) % 4;
      } else if (dir === 'down') {
        if (lockedBayIndices.length > 0) {
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

    // 3. Zone B Locked '+' Parking Bays
    if (this.focusZone === 'bays') {
      if (lockedBayIndices.length === 0) {
        this.focusZone = 'grid';
        this._selectDefaultBusFocus();
        this._updateHudFocusVisuals();
        return;
      }
      const curIdxInLocked = Math.max(0, lockedBayIndices.indexOf(this.focusedBaySlotIdx));
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
      this._updateHudFocusVisuals();
      return;
    }

    // 4. Default: Spatial navigation across 3D buses in Zone C
    if (this.activeGridBuses.length === 0) {
      if (dir === 'down') {
        this.focusZone = 'boosters';
      } else if (dir === 'up') {
        this.focusZone = lockedBayIndices.length > 0 ? 'bays' : 'topbar';
        if (this.focusZone === 'bays') this.focusedBaySlotIdx = lockedBayIndices[0];
      }
      this._updateHudFocusVisuals();
      return;
    }

    const currentBus =
      this.activeGridBuses.find((b) => b.id === this.focusedBusId) ||
      this.activeGridBuses[0];
    const curPos = getBusWorldCenter(
      currentBus,
      this.stage.grid.width,
      this.stage.grid.height,
      GRID_ORIGIN_Z
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
        GRID_ORIGIN_Z
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
    } else if (dir === 'down') {
      this.focusZone = 'boosters';
      this.renderer3d.setFocusedBus(null);
      this._updateHudFocusVisuals();
    } else if (dir === 'up') {
      if (lockedBayIndices.length > 0) {
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
        this.loadStage(this.saveData.currentLevel);
      } else if (this.focusedTopBtnIdx === 1) {
        this.cycleTimeOfDay();
      } else if (this.focusedTopBtnIdx === 2) {
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
   * - Checks stage victory or full-dock auto-rescue
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

    let anyBoardingPossible = false;

    if (this.passengerQueue.length > 0) {
      const frontColor = this.passengerQueue[0];

      let matchingActor = null;
      let matchingSlot = null;
      for (let i = 0; i < this.dockSlots.length; i++) {
        const slot = this.dockSlots[i];
        if (!slot.busId) continue;
        const actor = this.renderer3d.busActors.get(slot.busId);
        if (
          actor &&
          actor.state === 'parked' &&
          actor.data.color === frontColor &&
          actor.remainingCapacity > 0
        ) {
          matchingActor = actor;
          matchingSlot = slot;
          break;
        }
      }

      if (matchingActor) {
        anyBoardingPossible = true;
        this.deadlockTimer = 0;

        if (this.boardingCooldown <= 0) {
          this.boardingCooldown = 0.105;
          const boardedColor = this.passengerQueue.shift();
          matchingActor.remainingCapacity = Math.max(0, matchingActor.remainingCapacity - 1);
          matchingActor.boardedCount++;

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
      !anyBoardingPossible &&
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
      this.saveData.score += 250;
      this.saveData.coins += 50;
      if (this.saveData.score > this.saveData.bestScore) {
        this.saveData.bestScore = this.saveData.score;
      }

      const completedLvl = this.saveData.currentLevel;
      this.saveData.currentLevel = completedLvl + 1;
      if (this.saveData.currentLevel > this.saveData.highestLevel) {
        this.saveData.highestLevel = this.saveData.currentLevel;
      }
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
    this.renderer3d?.resize();
  }

  _flashToast(msg) {
    const banner = document.getElementById('hud-toast');
    if (!banner) return;
    banner.textContent = msg;
    banner.classList.add('visible');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      banner.classList.remove('visible');
    }, 1400);
  }

  _syncParkedCapacityBadgesDom() {
    const container = document.getElementById('parked-badges-layer');
    if (!container || !this.renderer3d) return;

    const badges = this.renderer3d.getParkedBusScreenBadges(
      window.innerWidth,
      window.innerHeight
    );

    while (container.children.length < badges.length) {
      const el = document.createElement('div');
      el.className = 'parked-capacity-badge';
      container.appendChild(el);
    }
    for (let i = 0; i < container.children.length; i++) {
      const el = container.children[i];
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
  }

  _updateHudFocusVisuals() {
    const topBtns = [
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
    const setTxt = (id, text) => {
      const el = document.getElementById(id);
      if (el && el.textContent !== String(text)) el.textContent = String(text);
    };

    setTxt('hud-level-title', `${this.t('level')} ${lvlNum}`);
    setTxt('hud-sub-meta', `${this.t('queue')}: ${this.passengerQueue.length}`);

    const modeName = this._getLightingModeDisplayName();
    setTxt('hud-time-label', modeName);
    setTxt('btn-title-time', `${this.t('lighting')}: ${modeName}`);
    setTxt('btn-pause-time', `${this.t('lighting')}: ${modeName}`);

    const musicEnabled = this.saveData.musicEnabled !== false;
    setTxt('hud-music-label', musicEnabled ? this.t('bgmOn') : this.t('bgmOff'));
    setTxt('btn-title-music', musicEnabled ? this.t('musicOn') : this.t('musicOff'));
    setTxt('btn-pause-music', musicEnabled ? this.t('musicOn') : this.t('musicOff'));

    // Title Modal stats
    setTxt('title-stat-lv-val', lvlNum);
    setTxt('title-stat-score-val', this.saveData.bestScore);
    setTxt('title-stat-coins-val', this.saveData.coins);
    setTxt('btn-title-play', `${this.t('playNow')} · ${this.t('level')} ${lvlNum}`);

    // Update active level chip highlight in pickers
    const allChips = document.querySelectorAll('.btn-level-chip');
    allChips.forEach((chip) => {
      const chipLvl = parseInt(chip.getAttribute('data-level') || '1', 10);
      chip.classList.toggle('is-current', chipLvl === lvlNum);
    });

    // Update Bottom Booster Bar cards (Milestone unlocks at Level 5, Level 10, Level 15)
    const unlockAll = this.appConfig.unlockAllBoosters;
    const vipUnlocked = unlockAll || this.saveData.highestLevel >= 5 || lvlNum >= 5;
    const arrangeUnlocked = unlockAll || this.saveData.highestLevel >= 10 || lvlNum >= 10;
    const shuffleUnlocked = unlockAll || this.saveData.highestLevel >= 15 || lvlNum >= 15;

    this._renderBoosterCardDom('vip', vipUnlocked, 5, this.saveData.boosters.vip, this.vipSelectionMode);
    this._renderBoosterCardDom('arrange', arrangeUnlocked, 10, this.saveData.boosters.arrange, false);
    this._renderBoosterCardDom('shuffle', shuffleUnlocked, 15, this.saveData.boosters.shuffle, false);

    // Game Over / Victory Modal content
    if (this.gameState === 'gameover') {
      if (this.outcomeType === 'victory') {
        setTxt('gameover-modal-heading', this.t('stageClear'));
        setTxt('gameover-modal-sub', this.t('stageClearSub'));
        setTxt(
          'btn-gameover-next',
          `${this.t('nextLevel')} (${this.t('level')} ${this.saveData.currentLevel})`
        );
      } else {
        setTxt('gameover-modal-heading', this.t('dockFull'));
        setTxt('gameover-modal-sub', this.t('dockFullSub'));
        setTxt('btn-gameover-next', this.t('resume'));
      }
      setTxt('go-stat-lv-val', lvlNum);
      setTxt('go-stat-score-val', this.saveData.score);
      setTxt('go-stat-coins-val', this.saveData.coins);
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

  _buildLevelPickersDom() {
    const buildInContainer = (containerId) => {
      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = '';
      const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15];
      levels.forEach((lvl) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-level-chip';
        btn.setAttribute('data-level', String(lvl));
        btn.textContent = `Lv.${lvl}`;
        btn.addEventListener('click', () => {
          this.sound.initInOnStart();
          this.loadStage(lvl);
          this.setGameState('playing');
        });
        container.appendChild(btn);
      });
    };

    buildInContainer('title-level-picker');
    buildInContainer('pause-level-picker');
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
    setTxt('title-stat-coins-kicker', 'coins');
    setTxt('hud-controls-strip', 'controlsHint');
    setTxt('pause-modal-heading', 'paused');
    setTxt('btn-pause-resume', 'resume');
    setTxt('btn-pause-restart', 'restart');
    setTxt('btn-pause-unlock-bay', 'unlockBayBtn');
    setTxt('btn-pause-export', 'exportJson');
    setTxt('go-stat-lv-kicker', 'stage');
    setTxt('go-stat-score-kicker', 'score');
    setTxt('go-stat-coins-kicker', 'coins');
    setTxt('btn-gameover-retry', 'tryAgain');
  }

  _bindDomUiEvents() {
    const blurAndRun = (ev, fn) => {
      if (ev && ev.currentTarget instanceof HTMLElement) {
        ev.currentTarget.blur();
      }
      fn();
    };

    // Title Modal buttons
    document.getElementById('btn-title-play')?.addEventListener('click', (e) =>
      blurAndRun(e, () => {
        this.sound.initInOnStart();
        this.setGameState('playing');
      })
    );
    document.getElementById('btn-title-time')?.addEventListener('click', (e) =>
      blurAndRun(e, () => this.cycleTimeOfDay())
    );
    document.getElementById('btn-title-music')?.addEventListener('click', (e) =>
      blurAndRun(e, () => this.toggleMusic())
    );

    // Top HUD Bar buttons
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
    document.getElementById('btn-pause-time')?.addEventListener('click', (e) =>
      blurAndRun(e, () => this.cycleTimeOfDay())
    );
    document.getElementById('btn-pause-music')?.addEventListener('click', (e) =>
      blurAndRun(e, () => this.toggleMusic())
    );
    document.getElementById('btn-pause-unlock-bay')?.addEventListener('click', (e) =>
      blurAndRun(e, () => {
        this.unlockNextParkingBay();
        this.setGameState('playing');
      })
    );
    document.getElementById('btn-pause-export')?.addEventListener('click', (e) =>
      blurAndRun(e, () => this.showExportJsonModal())
    );

    // Game Over / Victory Modal buttons
    document.getElementById('btn-gameover-next')?.addEventListener('click', (e) =>
      blurAndRun(e, () => {
        if (this.outcomeType === 'defeat') {
          this.unlockNextParkingBay();
          this._performArrangeQueue();
          this.setGameState('playing');
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
  }
}

// Boot the game
const game = new BusFeverGame();
window.__busFeverGame = game;
game.initSdk();
