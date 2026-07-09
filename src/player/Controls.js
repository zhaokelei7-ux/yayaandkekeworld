import * as THREE from 'three';
import { MOUSE_SENSITIVITY } from '../utils/constants.js';

/**
 * 视角控制器 — 支持 PC 鼠标 + 移动端触控
 */
export class Controls {
  /**
   * @param {THREE.PerspectiveCamera} camera
   * @param {HTMLElement} domElement - 渲染器的 canvas 元素
   */
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.domElement.addEventListener('click', () => this._requestPointerLock());

    // 视角状态
    this.yaw = 0;
    this.pitch = 0;
    this.isLocked = false;

    // 帧级鼠标累积 — 在 mousemove 中累加，update() 中逐帧消耗
    // 避免单帧突变（瞬移）的同时做到完全跟手，无滞后
    this._pendingYaw = 0;
    this._pendingPitch = 0;

    // 输入状态
    this.keys = { w: false, a: false, s: false, d: false, space: false, shift: false, control: false };
    this.input = { moveX: 0, moveZ: 0, jump: false };

    // 触控状态
    this.isTouching = false;
    this.lastTouchX = 0;
    this.lastTouchY = 0;
    this._touchMoveX = 0;
    this._touchMoveZ = 0;
    /** @type {boolean} - 刚锁定指针，下帧应跳过交互 */
    this._justLocked = false;
    /** @type {boolean} - 锁定后首个 mousemove 跳过（大跳 delta） */
    this._firstMoveAfterLock = false;

    this._bindEvents();
  }

  _bindEvents() {
    // Pointer Lock
    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.domElement;
      if (this.isLocked) {
        this._justLocked = true;
        this._firstMoveAfterLock = true; // 标记首个事件
      }
    });

    // 鼠标移动 — 累积到 pending，不直接修改 yaw/pitch
    document.addEventListener('mousemove', (e) => {
      if (!this.isLocked) return;
      // 跳过 PointerLock 后首个 mousemove（指针跳到屏幕中心产生巨量 delta）
      if (this._firstMoveAfterLock) {
        this._firstMoveAfterLock = false;
        return;
      }
      this._pendingYaw -= e.movementX * MOUSE_SENSITIVITY;
      this._pendingPitch -= e.movementY * MOUSE_SENSITIVITY;
    });

    // 键盘（使用捕获阶段优先拦截，防止浏览器默认行为）
    document.addEventListener('keydown', (e) => this._onKey(e, true));
    document.addEventListener('keyup', (e) => this._onKey(e, false));

    // 触控
    this.domElement.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
    this.domElement.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false });
    this.domElement.addEventListener('touchend', (e) => this._onTouchEnd(e), { passive: false });
  }

  /** @param {KeyboardEvent} e @param {boolean} pressed */
  _onKey(e, pressed) {
    let key = e.key.toLowerCase();
    // 空格键 e.key 返回 ' '，映射为 'space'
    if (key === ' ') key = 'space';
    if (key in this.keys) {
      this.keys[key] = pressed;
      e.preventDefault();
    }
  }

  /** @param {TouchEvent} e */
  _onTouchStart(e) {
    if (e.touches.length === 1) {
      this.isTouching = true;
      this.lastTouchX = e.touches[0].clientX;
      this.lastTouchY = e.touches[0].clientY;
    }
  }

  /** @param {TouchEvent} e */
  _onTouchMove(e) {
    if (!this.isTouching || e.touches.length !== 1) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - this.lastTouchX;
    const dy = e.touches[0].clientY - this.lastTouchY;
    this._pendingYaw -= dx * MOUSE_SENSITIVITY;
    this._pendingPitch -= dy * MOUSE_SENSITIVITY;
    this.lastTouchX = e.touches[0].clientX;
    this.lastTouchY = e.touches[0].clientY;
  }

  /** @param {TouchEvent} e */
  _onTouchEnd(e) {
    if (e.touches.length === 0) {
      this.isTouching = false;
    }
  }

  /**
   * 处理 Pointer Lock 请求
   * 在移动端不请求
   */
  _requestPointerLock() {
    if (this._isMobile()) return;
    if (!this.isLocked) {
      this.domElement.requestPointerLock();
    }
  }

  /** @returns {boolean} */
  _isMobile() {
    return window.innerWidth < 768 || 'ontouchstart' in window;
  }

  /**
   * 每帧更新 — 平滑视角 + 产出输入状态
   * @param {number} dt
   * @returns {{ moveX: number, moveZ: number, jump: boolean }}
   */
  update(dt) {
    // === 视角旋转：帧累积 + 硬速度上限 + 抗帧时间尖峰 ===
    const MAX_LOOK_SPEED = Math.PI * 2; // 弧度/秒 (360°/s)
    const pitchLimit = Math.PI / 2 - 0.01;
    const MAX_FRAME_TIME = 0.05; // 最大有效帧时间 50ms（>20fps 不受影响）

    const maxDelta = MAX_LOOK_SPEED * Math.min(dt, MAX_FRAME_TIME);
    const maxPending = maxDelta * 2;

    // Yaw — 消费最多 maxDelta，超出部分带至下一帧
    const yawDelta = Math.max(-maxDelta, Math.min(maxDelta, this._pendingYaw));
    this.yaw += yawDelta;
    this._pendingYaw = Math.max(-maxPending, Math.min(maxPending, this._pendingYaw - yawDelta));

    // Pitch — 同上，附加俯仰角限位
    const pitchDelta = Math.max(-maxDelta, Math.min(maxDelta, this._pendingPitch));
    this.pitch = Math.max(-pitchLimit, Math.min(pitchLimit, this.pitch + pitchDelta));
    this._pendingPitch = Math.max(-maxPending, Math.min(maxPending, this._pendingPitch - pitchDelta));

    // 键盘输入 → 移动向量
    let mx = 0, mz = 0;
    if (this.keys.w) mz -= 1;
    if (this.keys.s) mz += 1;
    if (this.keys.a) mx -= 1;
    if (this.keys.d) mx += 1;

    // 如果有触控虚拟摇杆输入，叠加它
    if (this._touchMoveX !== 0 || this._touchMoveZ !== 0) {
      mx = this._touchMoveX;
      mz = this._touchMoveZ;
    }

    // 归一化
    const len = Math.sqrt(mx * mx + mz * mz);
    if (len > 1) {
      mx /= len;
      mz /= len;
    }

    const jump = this.keys.space;

    // Shift：地面模式=加速跑，飞行模式=下降（避免 Ctrl 冲突）
    return { moveX: mx, moveZ: mz, jump, sprint: this.keys.shift, descend: this.keys.shift };
  }

  /**
   * 消费"刚锁定指针"标记（Interaction 跳过一次点击）
   * @returns {boolean}
   */
  consumeJustLocked() {
    const v = this._justLocked;
    this._justLocked = false;
    return v;
  }

  /**
   * 触控摇杆设置（由 TouchControls 调用）
   * @param {number} x - [-1, 1]
   * @param {number} z - [-1, 1]
   */
  setTouchInput(x, z) {
    this._touchMoveX = x;
    this._touchMoveZ = z;
  }
}
