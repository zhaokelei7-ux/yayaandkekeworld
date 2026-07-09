import * as THREE from 'three';

/**
 * 天空装饰 — 太阳 + 云朵
 */
export class Sky {
  /**
   * @param {THREE.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this._createSun();
    this._createClouds();
  }

  /** 创建太阳 */
  _createSun() {
    // 太阳球体 (亮黄色)
    const sunGeo = new THREE.SphereGeometry(3, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xFFD54F });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.position.set(-30, 50, -40);
    this.scene.add(sun);

    // 太阳光晕 (大一圈的半透明圈)
    const glowGeo = new THREE.SphereGeometry(4, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xFFF176,
      transparent: true,
      opacity: 0.3,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.set(-30, 50, -40);
    this.scene.add(glow);
  }

  /** 创建云朵 */
  _createClouds() {
    const cloudMat = new THREE.MeshLambertMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.85,
    });

    // 云朵位置: 分布在 y=22..35 范围
    const cloudPositions = [
      // 每一组是 [x, y, z, 水平拉伸, 块数]
      { x: -20, y: 28, z: -30, scale: 1.5, count: 4 },
      { x: 15, y: 25, z: -25, scale: 1.2, count: 3 },
      { x: -10, y: 30, z: 20, scale: 1.0, count: 4 },
      { x: 25, y: 27, z: 15, scale: 1.3, count: 3 },
      { x: -30, y: 26, z: 10, scale: 1.0, count: 3 },
      { x: 5, y: 32, z: -35, scale: 0.8, count: 4 },
      { x: -5, y: 24, z: 30, scale: 1.2, count: 3 },
      { x: 35, y: 29, z: -15, scale: 1.0, count: 3 },
      { x: -40, y: 28, z: -20, scale: 1.1, count: 3 },
      { x: 20, y: 31, z: 25, scale: 0.9, count: 3 },
    ];

    for (const cp of cloudPositions) {
      this._createOneCloud(cp.x, cp.y, cp.z, cp.scale, cp.count, cloudMat);
    }
  }

  /**
   * 创建单朵云 (由多个白色方块组成)
   */
  _createOneCloud(cx, cy, cz, scale, blockCount, mat) {
    const s = 2.0 * scale; // 单块大小
    const half = Math.floor(blockCount / 2);

    for (let i = 0; i < blockCount; i++) {
      const offsetX = (i - half) * s * 0.8;
      // 随机小偏移让云朵更自然
      const offsetZ = (Math.random() - 0.5) * s * 0.6;
      const geo = new THREE.BoxGeometry(s * 1.2, s * 0.5, s * 1.2);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(cx + offsetX, cy, cz + offsetZ);
      this.scene.add(mesh);
    }
  }
}
