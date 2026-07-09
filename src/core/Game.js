import * as THREE from 'three';
import { World } from './World.js';
import { Player } from '../player/Player.js';
import { Controls } from '../player/Controls.js';
import { Interaction } from '../interaction/Interaction.js';
import { HUD } from '../ui/HUD.js';
import { TouchControls } from '../ui/TouchControls.js';
import { Sky } from '../worldgen/Sky.js';
import { SaveManager } from '../utils/SaveManager.js';
import { showConfirmModal } from '../utils/Modal.js';

/**
 * 游戏主控制器 — 协调所有子系统
 */
export class Game {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.Fog(0x87CEEB, 80, 300);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
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

    // 天空系统（昼夜循环、太阳、月亮）
    this.sky = new Sky(this.scene, { dirLight, ambLight });

    // 隐藏加载画面
    const loading = document.getElementById('loading-screen');
    if (loading) loading.classList.add('hidden');

    // 移动端降低渲染距离
    if (window.innerWidth < 768) {
      this.world.renderDistance = 4;
    }

    // 窗口自适应
    window.addEventListener('resize', () => this._onResize());

    // 可见性变化暂停 / 保存
    document.addEventListener('visibilitychange', () => {
      this._paused = document.hidden;
      if (document.hidden) {
        this._savePlayerState();
      }
    });

    // 页面关闭/刷新前保存
    window.addEventListener('beforeunload', () => {
      this._savePlayerState();
    });

    // R 键切换飞行模式（仅在游戏中生效）
    document.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'r' && document.pointerLockElement) {
        this.player.flying = !this.player.flying;
        if (!this.player.flying) {
          this.player.velocity.y = 0;
        }
      }
    });

    // ESC 释放指针锁定 → 回到开始界面
    document.addEventListener('pointerlockchange', () => {
      if (!document.pointerLockElement && this._gameStarted) {
        this._paused = true;
        this._showStartScreen();
      }
    });

    this._lastTime = performance.now();
    this._paused = false;
    this._playerPosRestored = false;
    this._lastSaveTime = 0;
    this._gameStarted = false;

    // 初始化开始界面
    this._showStartScreen();
  }

  /**
   * 显示开始界面（支持多次调用）
   */
  _showStartScreen() {
    const startScreen = document.getElementById('start-screen');
    if (!startScreen) return;
    startScreen.classList.remove('hidden');

    const btnContinue = document.getElementById('btn-continue');
    const btnRestart = document.getElementById('btn-restart');
    if (!btnContinue || !btnRestart) return;

    // 更新按钮文字和颜色
    if (this._gameStarted) {
      btnContinue.textContent = '▶ 继续玩';
      btnContinue.style.background = 'linear-gradient(135deg, #f8a4c8, #f48fb1)';
    } else {
      btnContinue.textContent = '▶ 开始新游戏';
      btnContinue.style.background = 'linear-gradient(135deg, #ff6b9d, #d6336c)';
    }
    btnContinue.style.opacity = '1';

    // 克隆替换以移除旧监听器
    const newContinue = btnContinue.cloneNode(true);
    const newRestart = btnRestart.cloneNode(true);
    btnContinue.parentNode.replaceChild(newContinue, btnContinue);
    btnRestart.parentNode.replaceChild(newRestart, btnRestart);

    newContinue.addEventListener('click', () => {
      startScreen.classList.add('hidden');
      if (this._gameStarted) {
        this._paused = false;
        if (!this._isMobile()) {
          this.renderer.domElement.requestPointerLock();
        }
      } else {
        this.start();
      }
    });

    newRestart.addEventListener('click', async () => {
      const confirmed = await showConfirmModal(
        '所有建造的方块和进度都会被清除，世界将回到最初的起点...',
        '————— 确认重置 —————'
      );
      if (confirmed) {
        startScreen.classList.add('hidden');
        window.__yayaRestarting = true;
        SaveManager.clearAll();
        location.reload();
      }
    });
  }

  _isMobile() {
    return window.innerWidth < 768 || 'ontouchstart' in window;
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.world.renderDistance = w < 768 ? 4 : 6;
  }

  _savePlayerState() {
    if (window.__yayaRestarting) return;
    if (this._playerPosRestored) {
      SaveManager.savePlayerState(
        this.player.position,
        this.player.yaw,
        this.player.pitch,
        this.player.selectedBlockIndex,
      );
    }
  }

  start() {
    this._gameStarted = true;
    this._lastTime = performance.now();
    this._loop();
  }

  _loop() {
    requestAnimationFrame(() => this._loop());

    if (this._paused) return;

    const now = performance.now();
    const dt = Math.min((now - this._lastTime) / 1000, 0.05);
    this._lastTime = now;

    // 1. 更新控制 → 获取输入
    const input = this.controls.update(dt);

    // 刚锁定指针时跳过交互点击
    if (this.controls.consumeJustLocked()) {
      this.interaction.clearPendingClicks();
    }

    // 1.5 同步视角旋转
    this.player.yaw = this.controls.yaw;
    this.player.pitch = this.controls.pitch;

    // 1.8 更新天空（昼夜循环）
    this.sky.update(dt);

    // 2. 先更新世界（加载区块）
    this.world.update(this.player.position);

    // 2.5 世界就绪后恢复玩家位置（仅第一次）
    if (this.world._saveReady && !this._playerPosRestored) {
      const saved = SaveManager.loadPlayerState();
      if (saved) {
        this.player.position.x = saved.x;
        this.player.position.y = saved.y;
        this.player.position.z = saved.z;
        this.player.yaw = saved.yaw;
        this.player.pitch = saved.pitch;
        this.player.selectedBlockIndex = saved.selectedBlock || 0;
        this.controls.yaw = saved.yaw;
        this.controls.pitch = saved.pitch;
      }
      this._playerPosRestored = true;
    }

    // 3. 更新玩家
    this.player.update(dt, input, this.world);

    // 3.5 定期保存玩家位置（每 3 秒）
    if (this._playerPosRestored && now - this._lastSaveTime > 3000) {
      this._savePlayerState();
      this._lastSaveTime = now;
    }

    // 4. 更新交互
    this.interaction.update(this.camera, this.world, this.player);

    // 5. 更新相机位置
    const camPos = this.player.getCameraPosition();
    this.camera.position.set(camPos.x, camPos.y, camPos.z);

    // 6. 应用视角旋转
    const euler = new THREE.Euler(this.player.pitch, this.player.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);

    // 7. 渲染
    this.renderer.render(this.scene, this.camera);

    // 8. 更新 HUD
    this.hud.update(this.player);
  }
}
