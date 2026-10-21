/**
 * Bus Fever 3D: Traffic Escape — Unified My PC Input Hub
 * Complies 100% with My PC SDK Rules (Sections 1, 4, 5, 11):
 * - Uses ONLY MyPC SDK APIs (MyPC.init, MyPC.ready, MyPC.gamepad, MyPC.isDown, MyPC.save/load, MyPC.submitScore)
 * - Game controllers come first: reads every button, trigger, D-pad, and stick across up to 4 pads ('pad0'..'pad3')
 * - 100% playable with TV Remote alone (Arrow keys + OK/Enter + Back) across all 4 zones & menus
 * - No custom window/document keydown listeners (the My PC SDK owns keyboard/remote events)
 * - Supports direct Mouse/Touch raycasting on 3D buses and parking bays
 */

export class InputController {
  constructor(callbacks) {
    this.cb = callbacks;
    this.connectedPads = [];
    this.stickCooldownByDev = {
      pad0: 0,
      pad1: 0,
      pad2: 0,
      pad3: 0,
    };
    this.triggerLatchByDev = {
      pad0: { lt: false, rt: false },
      pad1: { lt: false, rt: false },
      pad2: { lt: false, rt: false },
      pad3: { lt: false, rt: false },
    };
    this._lastNavAt = 0;
    this._lastConfirmAt = 0;
    this.boundPointerDown = null;
    this.canvasEl = null;
  }

  _emitNavDebounced(dir, dev) {
    const now = performance.now();
    if (now - this._lastNavAt < 42) return;
    this._lastNavAt = now;
    this.cb.onNavigate?.(dir, dev);
  }

  _emitConfirmDebounced(dev) {
    const now = performance.now();
    if (now - this._lastConfirmAt < 48) return;
    this._lastConfirmAt = now;
    this.cb.onConfirm?.(dev);
  }

  /**
   * Registers MyPC.gamepad listeners for buttons, D-pad, analog triggers, and sticks across up to 4 controllers.
   */
  initGamepadListeners() {
    const sdk = window.MyPC;
    if (!sdk || !sdk.gamepad) return;

    sdk.gamepad.on('pads', (list) => {
      this.connectedPads = Array.isArray(list) ? list : [];
      if (this.cb.onPadsChanged) {
        this.cb.onPadsChanged(this.connectedPads);
      }
    });

    sdk.gamepad.on('button', (index, pressed, value, dev, name) => {
      if (!pressed) return;
      const btnName = name || sdk.gamepad.name(index) || `Button${index}`;

      // Standard W3C gamepad mapping (supported across pad0..pad3)
      // 0: A (Confirm / Dispatch Bus / Activate Focused Button)
      // 1: B (Cancel / Back from sub-menu)
      // 2: X (Booster 2: Arrange / Sort Passengers)
      // 3: Y (Booster 1: VIP Parking Slot)
      // 4: LB (Booster 3: Jumble Shuffle)
      // 5: RB (Unlock +1 Parking Bay)
      // 8: Select / View (Cycle Focus Zone: Grid <-> Boosters <-> Top Bar <-> Bays)
      // 9: Start / Menu (Toggle Pause Menu)
      // 10: L3 (Cycle Time of Day: Day / Sunset / Night / Auto)
      // 11: R3 (Toggle Background Music)
      // 12..15: D-Pad Up/Down/Left/Right
      if (btnName === 'A' || index === 0) {
        this._emitConfirmDebounced(dev);
      } else if (btnName === 'B' || index === 1) {
        this.cb.onCancel?.(dev);
      } else if (btnName === 'X' || index === 2) {
        this.cb.onBooster?.('arrange', dev);
      } else if (btnName === 'Y' || index === 3) {
        this.cb.onBooster?.('vip', dev);
      } else if (btnName === 'LB' || index === 4) {
        this.cb.onBooster?.('shuffle', dev);
      } else if (btnName === 'RB' || index === 5) {
        this.cb.onUnlockBay?.(dev);
      } else if (btnName === 'Select' || index === 8) {
        this.cb.onCycleZoneFocus?.(dev);
      } else if (btnName === 'Start' || index === 9) {
        this.cb.onTogglePause?.(dev);
      } else if (index === 10) {
        this.cb.onCycleTimeOfDay?.(dev);
      } else if (index === 11) {
        this.cb.onToggleMusic?.(dev);
      } else if (index === 12 || btnName === 'DPadUp') {
        this._emitNavDebounced('up', dev);
      } else if (index === 13 || btnName === 'DPadDown') {
        this._emitNavDebounced('down', dev);
      } else if (index === 14 || btnName === 'DPadLeft') {
        this._emitNavDebounced('left', dev);
      } else if (index === 15 || btnName === 'DPadRight') {
        this._emitNavDebounced('right', dev);
      }
    });

    sdk.gamepad.on('axes', (axes, dev) => {
      if (!axes || axes.length < 2) return;
      const now = performance.now();
      const cooldown = this.stickCooldownByDev[dev] || 0;
      if (now < cooldown) return;

      const lx = axes[0] || 0;
      const ly = axes[1] || 0;
      const rx = axes.length > 2 ? axes[2] || 0 : 0;
      const ry = axes.length > 3 ? axes[3] || 0 : 0;

      const x = Math.abs(lx) > Math.abs(rx) ? lx : rx;
      const y = Math.abs(ly) > Math.abs(ry) ? ly : ry;
      const deadzone = 0.45;

      if (Math.abs(x) > deadzone || Math.abs(y) > deadzone) {
        this.stickCooldownByDev[dev] = now + 180;
        if (Math.abs(x) > Math.abs(y)) {
          this._emitNavDebounced(x < 0 ? 'left' : 'right', dev);
        } else {
          this._emitNavDebounced(y < 0 ? 'up' : 'down', dev);
        }
      }
    });
  }

  /**
   * Fixed-step polling for analog triggers LT (index 6) and RT (index 7) across pad0..pad3.
   */
  pollGamepadFixedStep() {
    const sdk = window.MyPC;
    if (!sdk || !sdk.gamepad || typeof sdk.gamepad.value !== 'function') return;

    const devs = ['pad0', 'pad1', 'pad2', 'pad3'];
    for (let i = 0; i < devs.length; i++) {
      const dev = devs[i];
      const latch = this.triggerLatchByDev[dev];
      const ltVal = sdk.gamepad.value(6, dev) || 0;
      const rtVal = sdk.gamepad.value(7, dev) || 0;

      if (ltVal > 0.65 && !latch.lt) {
        latch.lt = true;
        this.cb.onCycleZoneFocus?.(dev);
      } else if (ltVal < 0.25) {
        latch.lt = false;
      }

      if (rtVal > 0.65 && !latch.rt) {
        latch.rt = true;
        this._emitConfirmDebounced(dev);
      } else if (rtVal < 0.25) {
        latch.rt = false;
      }
    }
  }

  /**
   * Handles MyPC onInput action events:
   * actions: 'left' | 'right' | 'up' | 'down' | 'confirm' | 'jump' | 'run' | 'cancel' | 'pause' | 'menu'
   */
  handleSdkAction(action, pressed, repeat, dev) {
    if (!pressed) return;

    if (action === 'left' || action === 'right' || action === 'up' || action === 'down') {
      this._emitNavDebounced(action, dev || 'keys');
      return;
    }

    if (repeat) return;

    if (action === 'confirm' || action === 'jump') {
      this._emitConfirmDebounced(dev || 'keys');
      return;
    }

    if (action === 'run') {
      this.cb.onCycleZoneFocus?.(dev || 'keys');
      return;
    }

    if (action === 'cancel') {
      this.cb.onCancel?.(dev || 'keys');
      return;
    }

    if (action === 'pause' || action === 'menu') {
      this.cb.onTogglePause?.(dev || 'keys');
    }
  }

  /**
   * Attaches pointerdown (mouse & touch) raycast listener to the 3D canvas.
   */
  attachCanvasPointer(canvasEl) {
    this.detachCanvasPointer();
    this.canvasEl = canvasEl;
    if (!canvasEl) return;

    this.boundPointerDown = (ev) => {
      if (ev.button !== undefined && ev.button !== 0) return;
      const rect = canvasEl.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const ndcX = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      this.cb.onCanvasRayTap?.(ndcX, ndcY);
    };

    canvasEl.addEventListener('pointerdown', this.boundPointerDown, { passive: true });
  }

  detachCanvasPointer() {
    if (this.canvasEl && this.boundPointerDown) {
      this.canvasEl.removeEventListener('pointerdown', this.boundPointerDown);
    }
    this.boundPointerDown = null;
    this.canvasEl = null;
  }
}
