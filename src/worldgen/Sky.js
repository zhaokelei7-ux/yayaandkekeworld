import * as THREE from 'three';

/**
 * 天空系统 — 昼夜循环、太阳、月亮、星星、云朵
 * 完整周期：5 分钟（300 秒）
 * 太阳/月亮在极远处轨道运行，玩家永远无法到达
 */
export class Sky {
  /**
   * @param {THREE.Scene} scene
   * @param {{ dirLight?: THREE.DirectionalLight, ambLight?: THREE.AmbientLight }} [options]
   */
  constructor(scene, options = {}) {
    this.scene = scene;
    this.dirLight = options.dirLight || null;
    this.ambLight = options.ambLight || null;

    /** 累积时间（秒） */
    this._time = 0;
    /** 完整昼夜周期（秒）— 5 分钟 */
    this.CYCLE_DURATION = 300;
    /** 轨道半径（极远，玩家永远无法到达） */
    this.ORBIT_RADIUS = 250;

    this._createSun();
    this._createMoon();
    this._createStars();
    this._createClouds();

    // 缓存颜色对象，避免每帧 GC
    this._dayBg = new THREE.Color(0x87CEEB);
    this._nightBg = new THREE.Color(0x0a0a2e);
    this._dayFog = new THREE.Color(0x87CEEB);
    this._nightFog = new THREE.Color(0x0a0a1e);
    this._tempColor = new THREE.Color();
  }

  /** 创建太阳 */
  _createSun() {
    // 使用大球体 + 放远处，视觉大小与之前相当
    const sunGeo = new THREE.SphereGeometry(12, 20, 20);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xFFD54F,
      fog: false, // 不受雾影响，永远可见
    });
    this.sun = new THREE.Mesh(sunGeo, sunMat);
    this.sun.renderOrder = -1; // 在远处渲染，不遮挡方块
    this.scene.add(this.sun);

    // 太阳光晕
    const glowGeo = new THREE.SphereGeometry(18, 20, 20);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xFFF176,
      transparent: true,
      opacity: 0.25,
      fog: false,
    });
    this.sunGlow = new THREE.Mesh(glowGeo, glowMat);
    this.sunGlow.renderOrder = -1;
    this.scene.add(this.sunGlow);
  }

  /** 创建月亮 */
  _createMoon() {
    const moonGeo = new THREE.SphereGeometry(10, 20, 20);
    const moonMat = new THREE.MeshBasicMaterial({
      color: 0xE8E0D0,
      fog: false,
    });
    this.moon = new THREE.Mesh(moonGeo, moonMat);
    this.moon.renderOrder = -1;
    this.scene.add(this.moon);

    // 月亮光晕
    const glowGeo = new THREE.SphereGeometry(14, 20, 20);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xC8C0D0,
      transparent: true,
      opacity: 0.15,
      fog: false,
    });
    this.moonGlow = new THREE.Mesh(glowGeo, glowMat);
    this.moonGlow.renderOrder = -1;
    this.scene.add(this.moonGlow);
  }

  /** 创建星空（仅在夜晚可见） */
  _createStars() {
    const count = 2000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 400 + Math.random() * 100;
      positions[i] = r * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.8,
      transparent: true,
      sizeAttenuation: true,
      fog: false,
    });
    this.stars = new THREE.Points(geo, mat);
    this.stars.renderOrder = -2;
    this.scene.add(this.stars);
  }

  /** 创建云朵（单个长方体，稀疏分布） */
  _createClouds() {
    const CLOUD_COUNT = 20;
    for (let i = 0; i < CLOUD_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 100 + Math.random() * 300;
      this._createOneCloud(
        Math.cos(angle) * dist,
        200 + Math.random() * 60,
        Math.sin(angle) * dist,
      );
    }
  }

  /**
   * 创建单个云朵（单个长方体）
   */
  _createOneCloud(cx, cy, cz) {
    const w = 32 + Math.floor(Math.random() * 24);
    const d = 24 + Math.floor(Math.random() * 20);
    const h = 8 + Math.floor(Math.random() * 8);

    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      fog: false,
    });
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cx, cy, cz);
    mesh.renderOrder = -1;
    this.scene.add(mesh);
  }

  /**
   * 每帧更新天空
   * @param {number} dt - 帧间隔（秒）
   */
  update(dt) {
    if (dt <= 0) return;

    // 累积时间（循环）
    this._time += dt;
    if (this._time >= this.CYCLE_DURATION) {
      this._time -= this.CYCLE_DURATION;
    }

    // 计算轨道角度
    const angle = (this._time / this.CYCLE_DURATION) * Math.PI * 2;
    const r = this.ORBIT_RADIUS;
    const sinA = Math.sin(angle);
    const cosA = Math.cos(angle);

    // === 更新太阳位置（斜椭圆轨道） ===
    const sunX = r * cosA;
    const sunY = 15 + r * sinA;
    const sunZ = r * sinA * 0.4;
    this.sun.position.set(sunX, sunY, sunZ);
    this.sunGlow.position.copy(this.sun.position);

    // === 更新月亮位置（与太阳相对，180° 偏移） ===
    const moonAngle = angle + Math.PI;
    const moonX = r * Math.cos(moonAngle);
    const moonY = 15 + r * Math.sin(moonAngle);
    const moonZ = r * Math.sin(moonAngle) * 0.4;
    this.moon.position.set(moonX, moonY, moonZ);
    this.moonGlow.position.copy(this.moon.position);

    // === 计算昼夜因子（0=全黑夜，1=全白天） ===
    const rawHeight = sinA;
    let dayFactor;
    if (rawHeight > 0.35) {
      dayFactor = 1;
    } else if (rawHeight < -0.35) {
      dayFactor = 0;
    } else {
      dayFactor = (rawHeight + 0.35) / 0.7;
    }

    // === 场景背景色 ===
    this._tempColor.lerpColors(this._nightBg, this._dayBg, dayFactor);
    this.scene.background.copy(this._tempColor);

    // === 雾色 ===
    this._tempColor.lerpColors(this._nightFog, this._dayFog, dayFactor);
    this.scene.fog.color.copy(this._tempColor);

    // === 定向光（阳光）跟随太阳 ===
    if (this.dirLight) {
      this.dirLight.position.copy(this.sun.position);
      this.dirLight.intensity = 0.1 + dayFactor * 1.1;
    }

    // === 环境光 ===
    if (this.ambLight) {
      this.ambLight.intensity = 0.05 + dayFactor * 0.45;
    }

    // === 星星（夜晚可见） ===
    this.stars.visible = dayFactor < 0.3;

    // === 月亮（傍晚到黎明可见） ===
    const moonVisible = dayFactor < 0.55;
    this.moon.visible = moonVisible;
    this.moonGlow.visible = moonVisible;
  }
}
