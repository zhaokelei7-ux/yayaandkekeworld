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

    // 输入状态
    this.keys = { w: false, a: false, s: false, d: false, space: false };
    this.input = { moveX: 0, moveZ: 0, jump: false };

    // 触控状态
    this.isTouching = false;
    this.lastTouchX = 0;
    this.lastTouchY = 0;
    this._touchMoveX = 0;
    this._touchMoveZ = 0;
    /** @type {boolean} - 刚锁定指针，下帧应跳过交互 */
    this._justLocked = false;

    this._bindEvents();
  }

  _bindEvents() {
    // Pointer Lock
    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.domElement;
      if (this.isLocked) this._justLocked = true;
    });

    // 鼠标移动
    document.addEventListener('mousemove', (e) => {
      if (!this.isLocked) return;
      this.yaw -= e.movementX * MOUSE_SENSITIVITY;
      this.pitch -= e.movementY * MOUSE_SENSITIVITY;
      this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
    });

    // 键盘
    document.addEventListener('keydown', (e) => this._onKey(e, true));
    document.addEventListener('keyup', (e) => this._onKey(e, false));

    // 触控
    this.domElement.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
    this.domElement.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false });
    this.domElement.addEventListener('touchend', (e) => this._onTouchEnd(e), { passive: false });
  }

  /** @param {KeyboardEvent} e @param {boolean} pressed */
  _onKey(e, pressed) {
    const key = e.key.toLowerCase();
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
    this.yaw -= dx * MOUSE_SENSITIVITY;
    this.pitch -= dy * MOUSE_SENSITIVITY;
    this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
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
   * 每帧更新 — 产出输入状态
   * @param {number} dt
   * @returns {{ moveX: number, moveZ: number, jump: boolean }}
   */
  update(dt) {
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

    return { moveX: mx, moveZ: mz, jump };
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
