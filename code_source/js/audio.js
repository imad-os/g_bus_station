/**
 * Bus Fever 3D: Traffic Escape — Open-Source CC0 Audio & BGM Engine
 * Complies with My PC Section 7 Audio rules:
 * - Single AudioContext created in onStart (never before)
 * - Loads open-source CC0 WAV assets from ./assets/audio/ with instant procedural fallback
 * - Toggleable background music loop (bgm_loop.wav) + SFX
 * - Suspended/muted in onPause, resumed in onResume, closed in onDestroy
 */

const SOUND_FILES = {
  horn: './assets/audio/horn.wav',
  dispatch: './assets/audio/dispatch.wav',
  pop: './assets/audio/pop.wav',
  booster: './assets/audio/booster.wav',
  depart: './assets/audio/depart.wav',
  win: './assets/audio/win.wav',
  bgm: './assets/audio/bgm_loop.wav',
};

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.bgmGain = null;
    this.bgmSource = null;
    this.buffers = new Map();
    this.loadingStarted = false;

    this.startedAllowed = false;
    this.isPaused = false;
    this.sfxEnabled = true;
    this.musicEnabled = true;
  }

  /**
   * Called strictly inside MyPC onStart callback (or after first user gesture in standalone).
   */
  initInOnStart() {
    this.startedAllowed = true;
    this._ensureContext();
  }

  _ensureContext() {
    if (!this.startedAllowed) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.48;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxEnabled ? 0.95 : 0;
      this.sfxGain.connect(this.masterGain);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = this.musicEnabled ? 0.36 : 0;
      this.bgmGain.connect(this.masterGain);

      this._loadOpenSourceAudioAssets();
    }
    if (this.ctx.state === 'suspended' && !this.isPaused) {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  async _loadOpenSourceAudioAssets() {
    if (this.loadingStarted || !this.ctx) return;
    this.loadingStarted = true;

    const entries = Object.entries(SOUND_FILES);
    for (let i = 0; i < entries.length; i++) {
      const [key, url] = entries[i];
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const arr = await res.arrayBuffer();
        if (!this.ctx) return;
        const audioBuf = await this.ctx.decodeAudioData(arr);
        this.buffers.set(key, audioBuf);
        if (key === 'bgm' && this.musicEnabled && !this.isPaused) {
          this._startBgmLoop();
        }
      } catch (_e) {
        // Fallback procedural synthesis remains active if offline
      }
    }
  }

  _startBgmLoop() {
    if (!this.ctx || !this.bgmGain || this.bgmSource) return;
    const buf = this.buffers.get('bgm');
    if (!buf) return;

    try {
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.connect(this.bgmGain);
      src.start(0);
      this.bgmSource = src;
    } catch (_e) {}
  }

  _stopBgmLoop() {
    if (this.bgmSource) {
      try {
        this.bgmSource.stop();
        this.bgmSource.disconnect();
      } catch (_e) {}
      this.bgmSource = null;
    }
  }

  setMusicEnabled(enabled) {
    this.musicEnabled = Boolean(enabled);
    const ctx = this._ensureContext();
    if (ctx && this.bgmGain) {
      this.bgmGain.gain.setTargetAtTime(
        this.musicEnabled && !this.isPaused ? 0.36 : 0.0001,
        ctx.currentTime,
        0.04
      );
      if (this.musicEnabled && !this.bgmSource) {
        this._startBgmLoop();
      }
    }
    return this.musicEnabled;
  }

  toggleMusic() {
    return this.setMusicEnabled(!this.musicEnabled);
  }

  setSfxEnabled(enabled) {
    this.sfxEnabled = Boolean(enabled);
    if (this.ctx && this.sfxGain) {
      this.sfxGain.gain.setTargetAtTime(
        this.sfxEnabled ? 0.95 : 0.0001,
        this.ctx.currentTime,
        0.02
      );
    }
    return this.sfxEnabled;
  }

  pause() {
    this.isPaused = true;
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  }

  resume() {
    this.isPaused = false;
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.musicEnabled && !this.bgmSource) {
      this._startBgmLoop();
    }
  }

  destroy() {
    this.isPaused = true;
    this._stopBgmLoop();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
      this.masterGain = null;
      this.sfxGain = null;
      this.bgmGain = null;
    }
  }

  _playBuffer(key, playbackRate = 1.0, volume = 0.85) {
    if (!this.sfxEnabled || this.isPaused) return false;
    const ctx = this._ensureContext();
    if (!ctx || !this.sfxGain) return false;

    const buf = this.buffers.get(key);
    if (!buf) return false;

    try {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = playbackRate;

      const gain = ctx.createGain();
      gain.gain.value = volume;

      src.connect(gain);
      gain.connect(this.sfxGain);
      src.start(0);
      return true;
    } catch (_e) {
      return false;
    }
  }

  /**
   * Double horn honk when a blocked bus bumps into an obstacle.
   */
  playHorn() {
    if (this.isPaused || !this.sfxEnabled) return;
    if (this._playBuffer('horn', 1.0, 0.9)) return;

    const ctx = this._ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const playBeep = (startOffset, dur) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(310, now + startOffset);
      osc2.frequency.setValueAtTime(392, now + startOffset);

      gain.gain.setValueAtTime(0.001, now + startOffset);
      gain.gain.linearRampToValueAtTime(0.28, now + startOffset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + dur);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain);

      osc1.start(now + startOffset);
      osc2.start(now + startOffset);
      osc1.stop(now + startOffset + dur + 0.02);
      osc2.stop(now + startOffset + dur + 0.02);
    };

    playBeep(0, 0.09);
    playBeep(0.12, 0.12);
  }

  /**
   * Smooth engine rev when an unblocked bus pulls out of the grid toward a parking bay.
   */
  playBusDispatch() {
    if (this.isPaused || !this.sfxEnabled) return;
    if (this._playBuffer('dispatch', 1.0, 0.85)) return;

    const ctx = this._ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.18);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.24);
  }

  /**
   * Bright ascending pop when a passenger boards a parked bus.
   */
  playPassengerBoard(stepIndex = 0) {
    if (this.isPaused || !this.sfxEnabled) return;
    const rate = 0.92 + Math.min(stepIndex, 16) * 0.045;
    if (this._playBuffer('pop', rate, 0.78)) return;

    const ctx = this._ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const baseFreq = 440 * Math.pow(1.059463, Math.min(stepIndex, 14));
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + 0.075);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.26, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Cheerful chime when a full bus departs the boarding bay off-screen right.
   */
  playBusDepart() {
    if (this.isPaused || !this.sfxEnabled) return;
    if (this._playBuffer('depart', 1.0, 0.88)) return;

    const ctx = this._ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t0 = now + idx * 0.055;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t0);

      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.linearRampToValueAtTime(0.22, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t0);
      osc.stop(t0 + 0.2);
    });
  }

  /**
   * Booster activation sound (VIP airlift, Arrange, Jumble, or +1 Bay unlock).
   */
  playBooster() {
    if (this.isPaused || !this.sfxEnabled) return;
    if (this._playBuffer('booster', 1.0, 0.9)) return;

    const ctx = this._ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t0 = now + idx * 0.045;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t0);

      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.linearRampToValueAtTime(0.24, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.16);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t0);
      osc.stop(t0 + 0.18);
    });
  }

  /**
   * Subtle UI navigation tick for TV Remote / Gamepad D-pad movement.
   */
  playUiTick() {
    if (this.isPaused || !this.sfxEnabled) return;
    const ctx = this._ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.028);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.032);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.038);
  }

  /**
   * Stage victory fanfare.
   */
  playWinFanfare() {
    if (this.isPaused || !this.sfxEnabled) return;
    if (this._playBuffer('win', 1.0, 0.95)) return;

    const ctx = this._ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t0 = now + idx * 0.09;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t0);

      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.linearRampToValueAtTime(0.3, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t0);
      osc.stop(t0 + 0.38);
    });
  }
}
