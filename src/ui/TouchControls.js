/**
 * 移动端触控控件 — 虚拟摇杆 + 按钮
 * 仅在小屏设备上激活
 */
export class TouchControls {
  /**
   * @param {import('../player/Controls.js').Controls} controls
   */
  constructor(controls) {
    this.controls = controls;
    this.active = window.innerWidth < 768 || ('ontouchstart' in window);
    if (!this.active) return;

    this.container = document.createElement('div');
    this.container.id = 'touch-controls';
    this.container.style.cssText = `
      position: fixed; inset: 0; z-index: 50; touch-action: none; pointer-events: none;
    `;
    document.body.appendChild(this.container);

    this._createJoystick();
    this._createButtons();
  }

  _createJoystick() {
    const joystickZone = document.createElement('div');
    joystickZone.style.cssText = `
      position: absolute; bottom: 40px; left: 40px; width: 130px; height: 130px;
      border-radius: 50%; background: rgba(255,255,255,0.1); border: 2px solid rgba(255,255,255,0.3);
      pointer-events: auto;
    `;

    const knob = document.createElement('div');
    knob.style.cssText = `
      position: absolute; top: 50%; left: 50%; width: 50px; height: 50px;
      transform: translate(-50%, -50%); border-radius: 50%;
      background: rgba(255,255,255,0.4); transition: none;
    `;
    joystickZone.appendChild(knob);
    this.container.appendChild(joystickZone);

    this._joystickKnob = knob;
    this._joystickZone = joystickZone;
    this._joystickCenterX = 0;
    this._joystickCenterY = 0;
    this._joystickRadius = 40;

    // 触控事件
    let touchId = null;

    joystickZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (touchId !== null) return;
      const touch = e.changedTouches[0];
      touchId = touch.identifier;
      const rect = joystickZone.getBoundingClientRect();
      this._joystickCenterX = rect.left + rect.width / 2;
      this._joystickCenterY = rect.top + rect.height / 2;
      this._updateJoystick(touch.clientX, touch.clientY);
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      if (touchId === null) return;
      for (const touch of e.changedTouches) {
        if (touch.identifier === touchId) {
          this._updateJoystick(touch.clientX, touch.clientY);
        }
      }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === touchId) {
          touchId = null;
          this._resetJoystick();
        }
      }
    }, { passive: true });

    document.addEventListener('touchcancel', () => {
      touchId = null;
      this._resetJoystick();
    }, { passive: true });
  }

  _updateJoystick(tx, ty) {
    const dx = tx - this._joystickCenterX;
    const dy = ty - this._joystickCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = this._joystickRadius;

    let clampedX = dx;
    let clampedY = dy;
    if (dist > maxDist) {
      clampedX = dx / dist * maxDist;
      clampedY = dy / dist * maxDist;
    }

    this._joystickKnob.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`;

    // 归一化到 [-1, 1]
    const nx = clampedX / maxDist;
    const ny = clampedY / maxDist;

    // 映射到移动方向：Y轴反转 (上=前进=Z负方向)
    this.controls.setTouchInput(nx, -ny);
  }

  _resetJoystick() {
    this._joystickKnob.style.transform = 'translate(-50%, -50%)';
    this.controls.setTouchInput(0, 0);
  }

  _createButtons() {
    // 跳跃按钮
    this._createActionButton('跳跃', '↑', { bottom: '160px', right: '30px' }, () => {
      this.controls.keys.space = true;
    }, () => {
      this.controls.keys.space = false;
    });

    // 放置按钮
    this._createActionButton('放置', '+', { bottom: '90px', right: '30px' }, () => {
      // 触发左键点击
      document.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
    });

    // 破坏按钮
    this._createActionButton('破坏', '-', { bottom: '20px', right: '30px' }, () => {
      document.dispatchEvent(new MouseEvent('mousedown', { button: 2 }));
    });
  }

  /**
   * 创建动作按钮
   * @param {string} label
   * @param {string} symbol
   * @param {object} pos
   * @param {Function} onStart
   * @param {Function} [onEnd]
   */
  _createActionButton(label, symbol, pos, onStart, onEnd) {
    const btn = document.createElement('div');
    btn.style.cssText = `
      position: absolute; width: 60px; height: 60px; border-radius: 50%;
      background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.4);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 24px; font-weight: bold; pointer-events: auto;
      user-select: none; -webkit-user-select: none;
      bottom: ${pos.bottom}; right: ${pos.right};
    `;
    btn.textContent = symbol;
    btn.title = label;

    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      onStart();
    }, { passive: false });

    if (onEnd) {
      btn.addEventListener('touchend', (e) => { e.preventDefault(); onEnd(); }, { passive: false });
      btn.addEventListener('touchcancel', (e) => { onEnd(); }, { passive: false });
    }

    this.container.appendChild(btn);
  }

  dispose() {
    if (this.container) this.container.remove();
  }
}
