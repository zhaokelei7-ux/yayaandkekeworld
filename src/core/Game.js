import * as THREE from 'three';
import { World } from './World.js';
import { Player } from '../player/Player.js';
import { Controls } from '../player/Controls.js';
import { Interaction } from '../interaction/Interaction.js';
import { HUD } from '../ui/HUD.js';
import { TouchControls } from '../ui/TouchControls.js';

/**
 * 游戏主控制器 — 协调所有子系统
 */
export class Game {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.Fog(0x87CEEB, 80, 150); // 雾效优化

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
    this.camera.position.set(0, 1.6, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const app = document.getElementById('app');
    app.appendChild(this.renderer.domElement);

    // 光照
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambLight);

    // 子系统
    this.world = new World(this.scene);
    this.player = new Player();
    this.controls = new Controls(this.camera, this.renderer.domElement);
    this.interaction = new Interaction();
    this.hud = new HUD();
    this.touchControls = new TouchControls(this.controls);

    // 窗口自适应
    window.addEventListener('resize', () => this._onResize());

    // 可见性变化暂停
    document.addEventListener('visibilitychange', () => {
      this._paused = document.hidden;
    });

    this._lastTime = performance.now();
    this._paused = false;
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  start() {
    this._lastTime = performance.now();
    this._loop();
  }

  _loop() {
    requestAnimationFrame(() => this._loop());

    if (this._paused) return;

    const now = performance.now();
    const dt = Math.min((now - this._lastTime) / 1000, 0.05); // 限制最大 dt
    this._lastTime = now;

    // 1. 更新控制 → 获取输入
    const input = this.controls.update(dt);

    // 刚锁定指针时跳过交互点击（锁定点击不应触发放置/破坏）
    if (this.controls.consumeJustLocked()) {
      this.interaction.clearPendingClicks();
    }

    // 1.5 同步视角旋转 (Controls → Player)
    this.player.yaw = this.controls.yaw;
    this.player.pitch = this.controls.pitch;

    // 2. 更新玩家 (含物理)
    this.player.update(dt, input, this.world);

    // 3. 更新世界区块
    this.world.update(this.player.position);

    // 4. 更新交互
    this.interaction.update(this.camera, this.world, this.player);

    // 5. 更新相机位置
    const camPos = this.player.getCameraPosition();
    this.camera.position.set(camPos.x, camPos.y, camPos.z);

    // 6. 应用视角旋转 (yaw/pitch)
    const euler = new THREE.Euler(this.player.pitch, this.player.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);

    // 7. 渲染
    this.renderer.render(this.scene, this.camera);

    // 8. 更新 HUD
    this.hud.update(this.player);
  }
}
