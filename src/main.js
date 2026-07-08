// WebGL 支持检测
function checkWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch (e) {
    return false;
  }
}
if (!checkWebGL()) {
  document.body.classList.add('no-webgl');
  throw new Error('WebGL not supported');
}

import * as THREE from 'three';
import { getBlockTextures, BlockType } from './blocks/BlockTypes.js';
import { generateChunkTerrain } from './worldgen/TerrainGen.js';
import { World } from './core/World.js';

const tex = getBlockTextures(BlockType.GRASS);
console.assert(tex !== null, '纹理生成失败');

// 地形生成验证
const data = generateChunkTerrain(0, 0);
const idx = (8 * 64 + 5) * 16 + 8; // x=8, y=5, z=8 位置
console.assert(data[idx] > 0, '中心地形应为实体方块');
console.log('地形生成测试通过');

/** @type {THREE.Scene} */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // 天空蓝

/** @type {THREE.PerspectiveCamera} */
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 2, 5);

/** @type {THREE.WebGLRenderer} */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById('app').appendChild(renderer.domElement);

// 世界管理器
const world = new World(scene);
world.update({ x: 0, y: 5, z: 0 });

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

// 窗口自适应
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
