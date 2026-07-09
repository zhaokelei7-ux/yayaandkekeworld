# yayaandkekeworld 3D 像素方块世界 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个类似 Minecraft 风格的 3D 像素方块网页应用，支持 PC + 移动端。

**Architecture:** Vite + Three.js 前后端一体架构，自研 AABB 物理引擎。每个 Chunk 16×16×64 存储方块数据并生成合并网格（带面剔除）。World 管理器动态加载/卸载区块。Game 主循环协调所有子系统。

**Tech Stack:** JavaScript (ESM), Vite 5, Three.js r160, Canvas API (纹理)

## 全局约束

- 零外部图片资源 — 所有纹理通过 Canvas API 程序化生成
- 方块类型 ID: 0=AIR, 1=GRASS, 2=DIRT, 3=STONE, 4=SAND, 5=COZE_RED, 6=COZE_WHITE
- 渲染距离 PC: 6 区块, 移动端: 4 区块
- 物理参数: 重力 9.8, 跳跃速度 5.0, 移速 4.0, 交互距离 5
- 玩家碰撞箱: 0.6×1.8×0.6, 眼睛高度 1.6
- 区块尺寸: 16×16 水平, 高度 64
- 所有文件使用 JSDoc 注释

---

### Task 1: 项目脚手架

**Files:**
- Create: `e:/claude code/CCdemo/yayaandkekeworld/package.json`
- Create: `e:/claude code/CCdemo/yayaandkekeworld/vite.config.js`
- Create: `e:/claude code/CCdemo/yayaandkekeworld/index.html`
- Create: `e:/claude code/CCdemo/yayaandkekeworld/public/favicon.svg`
- Create: `e:/claude code/CCdemo/yayaandkekeworld/src/main.js` (骨架)

**Interfaces:**
- Consumes: 无
- Produces: 可运行的 Vite 项目，显示 Three.js 蓝色场景 + 旋转立方体占位

- [ ] **Step 1: 创建项目目录和 package.json**

```bash
mkdir -p "e:/claude code/CCdemo/yayaandkekeworld/src" "e:/claude code/CCdemo/yayaandkekeworld/public"
```

```json
{
  "name": "yayaandkekeworld",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "three": "^0.160.0"
  },
  "devDependencies": {
    "vite": "^5.4.0"
  }
}
```

- [ ] **Step 2: 创建 vite.config.js**

```js
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});
```

- [ ] **Step 3: 创建 index.html (基础骨架 + 三.js CDN 占位)**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Coze Craft - 3D像素世界</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #1a1a2e; font-family: 'Segoe UI', sans-serif; }
    #app { width: 100%; height: 100%; display: block; }
    canvas { display: block; }
    #no-webgl {
      display: none; position: fixed; inset: 0; z-index: 9999;
      background: #1a1a2e; color: #fff; font-size: 1.2rem;
      align-items: center; justify-content: center; text-align: center; padding: 2rem;
    }
    .no-webgl #no-webgl { display: flex; }
  </style>
</head>
<body>
  <div id="no-webgl">您的浏览器不支持 WebGL，请使用现代浏览器访问。</div>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 4: 创建 favicon.svg**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#4CAF50" rx="4"/>
  <rect x="4" y="4" width="24" height="24" fill="#8B5E3C" rx="2"/>
  <rect x="4" y="4" width="24" height="8" fill="#4CAF50" rx="2"/>
</svg>
```

- [ ] **Step 5: 创建 main.js 骨架 — 测试 Three.js 场景**

```js
import * as THREE from 'three';

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

// 占位旋转方块
const geo = new THREE.BoxGeometry(1, 1, 1);
const mat = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });
const cube = new THREE.Mesh(geo, mat);
scene.add(cube);

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
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.02;
  renderer.render(scene, camera);
}
animate();
```

- [ ] **Step 6: main.js 添加 WebGL 检测**

在 main.js 的顶部，在 Three.js 引入之前，添加 WebGL 检测：

```js
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
```

- [ ] **Step 7: 验证项目可运行**

```bash
cd "e:/claude code/CCdemo/yayaandkekeworld"
npm install
npm run dev
```

预期：浏览器打开 localhost:3000，看到天空蓝背景 + 旋转绿色方块。

---

### Task 2: 常量定义 + 方块纹理系统

**Files:**
- Create: `e:/claude code/CCdemo/yayaandkekeworld/src/utils/constants.js`
- Create: `e:/claude code/CCdemo/yayaandkekeworld/src/blocks/BlockTypes.js`

**Interfaces:**
- Consumes: 无
- Produces: `constants.js` 导出所有全局常量对象；`BlockTypes.js` 导出 `BlockType` 枚举对象、`getTexture(id)` 返回 `THREE.CanvasTexture`、`getBlockProperties(id)` 返回方块属性

- [ ] **Step 1: 创建 constants.js**

```js
/**
 * yayaandkekeworld 全局常量
 * @module constants
 */

/** 重力加速度 (方块/秒²) */
export const GRAVITY = 9.8;
/** 玩家移动速度 (方块/秒) */
export const PLAYER_SPEED = 4.0;
/** 跳跃初速度 (方块/秒) */
export const JUMP_SPEED = 5.0;
/** 交互最大距离 (方块) */
export const REACH_DISTANCE = 5;

/** 玩家碰撞箱尺寸 */
export const PLAYER_WIDTH = 0.6;
export const PLAYER_HEIGHT = 1.8;
export const PLAYER_DEPTH = 0.6;
export const EYE_HEIGHT = 1.6;

/** 区块尺寸 */
export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 64;

/** 渲染距离 (区块数) — 根据设备动态设置 */
export const RENDER_DISTANCE_PC = 6;
export const RENDER_DISTANCE_MOBILE = 4;

/** 鼠标灵敏度 */
export const MOUSE_SENSITIVITY = 0.002;

/** 中心沙质平台半径 */
export const PLATFORM_RADIUS = 10;
export const PLATFORM_Y = 5;

/** 方块尺寸 */
export const BLOCK_SIZE = 1;

/** 纹理像素大小 */
export const TEXTURE_SIZE = 16;
```

- [ ] **Step 2: 创建 BlockTypes.js — 方块枚举 + Canvas 纹理生成**

```js
import * as THREE from 'three';
import { TEXTURE_SIZE } from '../utils/constants.js';

/**
 * 方块类型枚举
 * @readonly
 * @enum {number}
 */
export const BlockType = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  SAND: 4,
  COZE_RED: 5,
  COZE_WHITE: 6,
};

/**
 * 方块属性定义
 * name, solid(是否实体), color/pixels 用于纹理生成
 */
const BLOCK_DEFS = {
  [BlockType.GRASS]: {
    name: '草地',
    solid: true,
    topColor: '#4CAF50',
    sideColor: '#8B5E3C',
    bottomColor: '#8B5E3C',
    topStripColor: '#4CAF50',
  },
  [BlockType.DIRT]: {
    name: '泥土',
    solid: true,
    topColor: '#8B5E3C',
    sideColor: '#8B5E3C',
    bottomColor: '#8B5E3C',
  },
  [BlockType.STONE]: {
    name: '石头',
    solid: true,
    topColor: '#808080',
    sideColor: '#808080',
    bottomColor: '#808080',
  },
  [BlockType.SAND]: {
    name: '沙地',
    solid: true,
    topColor: '#F4E4A0',
    sideColor: '#F4E4A0',
    bottomColor: '#F4E4A0',
  },
  [BlockType.COZE_RED]: {
    name: 'COZE红',
    solid: true,
    topColor: '#E53935',
    sideColor: '#E53935',
    bottomColor: '#E53935',
  },
  [BlockType.COZE_WHITE]: {
    name: '白墙',
    solid: true,
    topColor: '#ECEFF1',
    sideColor: '#ECEFF1',
    bottomColor: '#ECEFF1',
  },
};

/**
 * 生成 16×16 像素风格的 Canvas 纹理
 * @param {string} topColor - 顶面颜色
 * @param {string} sideColor - 侧面颜色
 * @param {string} bottomColor - 底面颜色
 * @param {string} [topStripColor] - 草地顶部条颜色
 * @returns {{ top: HTMLCanvasElement, side: HTMLCanvasElement, bottom: HTMLCanvasElement }}
 */
function createBlockTexture(topColor, sideColor, bottomColor, topStripColor) {
  const size = TEXTURE_SIZE;
  const pixelSize = 2; // 2×2 像素块模拟像素风

  const makeCanvas = (color, strips) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    // 填充底色
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);
    // 像素网格线 (暗边)
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < size; x += pixelSize) {
      for (let y = 0; y < size; y += pixelSize) {
        ctx.strokeRect(x, y, pixelSize, pixelSize);
      }
    }
    // 草地特定：顶部绿色条
    if (strips) {
      ctx.fillStyle = strips;
      ctx.fillRect(0, 0, size, 4);
    }
    return canvas;
  };

  return {
    top: makeCanvas(topColor, topStripColor),
    side: makeCanvas(sideColor, topStripColor || null),
    bottom: makeCanvas(bottomColor),
  };
}

/** 纹理缓存 */
const textureCache = new Map();

/**
 * 获取方块的三面纹理 (Three.js CanvasTexture)
 * @param {number} blockType
 * @returns {{ top: THREE.CanvasTexture, side: THREE.CanvasTexture, bottom: THREE.CanvasTexture } | null}
 */
export function getBlockTextures(blockType) {
  if (blockType === BlockType.AIR) return null;
  if (textureCache.has(blockType)) return textureCache.get(blockType);

  const def = BLOCK_DEFS[blockType];
  if (!def) return null;

  const canvases = createBlockTexture(def.topColor, def.sideColor, def.bottomColor, def.topStripColor);
  const textures = {
    top: new THREE.CanvasTexture(canvases.top),
    side: new THREE.CanvasTexture(canvases.side),
    bottom: new THREE.CanvasTexture(canvases.bottom),
  };
  // 纹理过滤设为 NearestFilter 以保持像素感
  for (const key of ['top', 'side', 'bottom']) {
    textures[key].magFilter = THREE.NearestFilter;
    textures[key].minFilter = THREE.NearestFilter;
  }
  textureCache.set(blockType, textures);
  return textures;
}

/**
 * 获取方块是否实体（碰撞 / 遮挡）
 * @param {number} blockType
 * @returns {boolean}
 */
export function isBlockSolid(blockType) {
  if (blockType === BlockType.AIR) return false;
  const def = BLOCK_DEFS[blockType];
  return def ? def.solid : false;
}

/**
 * 获取方块名称
 * @param {number} blockType
 * @returns {string}
 */
export function getBlockName(blockType) {
  const def = BLOCK_DEFS[blockType];
  return def ? def.name : '未知';
}

/** 所有可用的方块类型列表（用于 UI 切换） */
export const BLOCK_TYPES = [BlockType.GRASS, BlockType.DIRT, BlockType.STONE, BlockType.SAND, BlockType.COZE_RED, BlockType.COZE_WHITE];
```

- [ ] **Step 3: 验证 — 在 main.js 中测试纹理生成**

在 `main.js` 中引入 `BlockTypes`，在控制台打印纹理 Canvas 的宽高验证：

```js
import { getBlockTextures, BlockType } from './blocks/BlockTypes.js';
const tex = getBlockTextures(BlockType.GRASS);
console.assert(tex !== null && tex.top instanceof HTMLCanvasElement, '纹理生成失败');
```

---

### Task 3: 地形生成器

**Files:**
- Create: `e:/claude code/CCdemo/yayaandkekeworld/src/worldgen/TerrainGen.js`

**Interfaces:**
- Consumes: `constants.js` (PLATFORM_RADIUS, PLATFORM_Y, CHUNK_SIZE, CHUNK_HEIGHT), `BlockTypes.js` (BlockType 枚举)
- Produces: `generateChunkTerrain(cx, cz)` 返回一个三维数组 `[x][z][y] = blockTypeId`，包含地形 + 沙质平台

- [ ] **Step 1: 实现高度图生成 + 方块填充**

```js
import { BlockType } from '../blocks/BlockTypes.js';
import { CHUNK_SIZE, CHUNK_HEIGHT, PLATFORM_RADIUS, PLATFORM_Y } from '../utils/constants.js';

/**
 * 简易噪声函数 — 正弦波叠加模拟地形起伏
 * @param {number} x
 * @param {number} z
 * @returns {number} 高度值 (0~1)
 */
function noise(x, z) {
  const n = Math.sin(x * 0.1 + 1.3) * Math.cos(z * 0.12 + 0.7) * 0.5
          + Math.sin(x * 0.05 + z * 0.08 + 2.1) * 0.3
          + Math.cos(x * 0.2 + z * 0.15) * 0.2;
  return (n + 1) / 2; // 归一化到 0~1
}

/**
 * 为指定区块生成地形方块数据
 * @param {number} cx - 区块 X 索引
 * @param {number} cz - 区块 Z 索引
 * @returns {Uint8Array} 大小为 CHUNK_SIZE×CHUNK_HEIGHT×CHUNK_SIZE 的扁平数组
 *   索引公式: (x * CHUNK_HEIGHT + y) * CHUNK_SIZE + z
 */
export function generateChunkTerrain(cx, cz) {
  const size = CHUNK_SIZE;
  const height = CHUNK_HEIGHT;
  const total = size * height * size;
  const data = new Uint8Array(total);

  const baseX = cx * size;
  const baseZ = cz * size;

  for (let lx = 0; lx < size; lx++) {
    for (let lz = 0; lz < size; lz++) {
      const wx = baseX + lx;
      const wz = baseZ + lz;

      // 判断是否在中心沙质平台范围
      const inPlatform = Math.abs(wx) <= PLATFORM_RADIUS && Math.abs(wz) <= PLATFORM_RADIUS;

      // 地形高度
      let surfaceY;
      if (inPlatform) {
        surfaceY = PLATFORM_Y;
      } else {
        const n = noise(wx, wz);
        surfaceY = Math.floor(4 + n * 8); // 范围 4~12
      }

      for (let y = 0; y < height; y++) {
        const idx = (lx * height + y) * size + lz;
        if (y === 0) {
          // 基岩 (不可破坏)
          data[idx] = BlockType.STONE;
        } else if (y > surfaceY) {
          data[idx] = BlockType.AIR;
        } else if (inPlatform && y === surfaceY) {
          data[idx] = BlockType.SAND;
        } else if (y === surfaceY) {
          data[idx] = BlockType.GRASS;
        } else if (y > surfaceY - 3) {
          data[idx] = BlockType.DIRT;
        } else {
          data[idx] = BlockType.STONE;
        }
      }
    }
  }
  return data;
}
```

- [ ] **Step 2: 验证地形生成**

```js
// 在 main.js 中测试
import { generateChunkTerrain } from './worldgen/TerrainGen.js';
const data = generateChunkTerrain(0, 0);
// 检查中心某个点是否非空
const idx = (8 * 64 + 5) * 16 + 8; // x=8, y=5, z=8 位置
console.assert(data[idx] > 0, '中心地形应为实体方块');
console.log('地形生成测试通过');
```

---

### Task 4: 区块系统 (Chunk)

**Files:**
- Create: `e:/claude code/CCdemo/yayaandkekeworld/src/core/Chunk.js`

**Interfaces:**
- Consumes: `constants.js`, `BlockTypes.js`, `TerrainGen.js`
- Produces: `Chunk` 类，构造函数 `new Chunk(cx, cz, scene)`。属性：`.mesh` (THREE.Group)，`data` (Uint8Array)。方法：`.build()` 构建网格，`.dispose()` 释放资源

- [ ] **Step 1: 实现 Chunk 类**

```js
import * as THREE from 'three';
import { CHUNK_SIZE, CHUNK_HEIGHT, BLOCK_SIZE } from '../utils/constants.js';
import { BlockType, getBlockTextures, isBlockSolid } from '../blocks/BlockTypes.js';
import { generateChunkTerrain } from '../worldgen/TerrainGen.js';

/**
 * 单区块 — 存储 16×64×16 方块数据 + 构建合并网格
 */
export class Chunk {
  /** @param {number} cx @param {number} cz @param {THREE.Scene} scene */
  constructor(cx, cz, scene) {
    /** 区块坐标 */
    this.cx = cx;
    this.cz = cz;
    /** 世界坐标偏移 */
    this.offsetX = cx * CHUNK_SIZE;
    this.offsetZ = cz * CHUNK_SIZE;
    /** 方块数据 [x][y][z] 扁平存储 */
    this.data = generateChunkTerrain(cx, cz);
    /** Three.js 网格组 */
    this.mesh = new THREE.Group();
    this.mesh.position.set(this.offsetX, 0, this.offsetZ);
    this.scene = scene;
    /** 是否已加载到场景 */
    this.loaded = false;
  }

  /**
   * 获取方块类型
   * @param {number} x - 局部 X (0~15)
   * @param {number} y - Y (0~63)
   * @param {number} z - 局部 Z (0~15)
   * @returns {number}
   */
  getBlock(x, y, z) {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) return -1;
    return this.data[(x * CHUNK_HEIGHT + y) * CHUNK_SIZE + z];
  }

  /**
   * 设置方块类型
   * @param {number} x - 局部 X
   * @param {number} y - Y
   * @param {number} z - 局部 Z
   * @param {number} type
   */
  setBlock(x, y, z, type) {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) return;
    this.data[(x * CHUNK_HEIGHT + y) * CHUNK_SIZE + z] = type;
  }

  /**
   * 判断给定面是否可见（相邻方块为空气或不透明）
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {string} face - 'px'|'nx'|'py'|'ny'|'pz'|'nz'
   * @returns {boolean}
   */
  isFaceVisible(x, y, z, face) {
    const neighbors = {
      'px': { dx: 1, dy: 0, dz: 0 },
      'nx': { dx: -1, dy: 0, dz: 0 },
      'py': { dx: 0, dy: 1, dz: 0 },
      'ny': { dx: 0, dy: -1, dz: 0 },
      'pz': { dx: 0, dy: 0, dz: 1 },
      'nz': { dx: 0, dy: 0, dz: -1 },
    };
    const n = neighbors[face];
    const nx = x + n.dx, ny = y + n.dy, nz = z + n.dz;
    // 超出本区块边界 — 视为可见（由相邻区块处理或边界可见）
    if (nx < 0 || nx >= CHUNK_SIZE || ny < 0 || ny >= CHUNK_HEIGHT || nz < 0 || nz >= CHUNK_SIZE) return true;
    const neighborType = this.getBlock(nx, ny, nz);
    return neighborType === BlockType.AIR || neighborType === -1;
  }

  /**
   * 构建区块网格（仅可见面）
   * @param {Map<string, Chunk>} [neighborChunks] - 相邻区块用于边界面判断
   */
  build(neighborChunks) {
    this.dispose();

    const geometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    // 按材质分组，同一材质的方块面合并到一个 Mesh
    /** @type {Map<number, {positions: number[], normals: number[], uvs: number[], indices: number[]}>} */
    const groups = new Map();

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let y = 0; y < CHUNK_HEIGHT; y++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
          const type = this.getBlock(x, y, z);
          if (type === BlockType.AIR || type === -1) continue;

          if (!groups.has(type)) {
            groups.set(type, { positions: [], normals: [], uvs: [], indices: [] });
          }
          const group = groups.get(type);

          // 检查 6 个面
          const faces = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];
          for (const face of faces) {
            if (!this.isFaceVisible(x, y, z, face)) continue;

            // 生成本方块该面的 4 个顶点（2 个三角形）
            const verts = getFaceVertices(x, y, z, face);
            const norm = getFaceNormal(face);
            const uv = getFaceUV(face);
            const baseIndex = group.positions.length / 3;

            for (let vi = 0; vi < 4; vi++) {
              group.positions.push(verts[vi * 3], verts[vi * 3 + 1], verts[vi * 3 + 2]);
              group.normals.push(norm[0], norm[1], norm[2]);
              group.uvs.push(uv[vi * 2], uv[vi * 2 + 1]);
            }
            // 两个三角形索引 (0-1-2, 0-2-3)
            group.indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
            group.indices.push(baseIndex, baseIndex + 2, baseIndex + 3);
          }
        }
      }
    }

    // 为每个材质类型创建 Mesh
    for (const [type, g] of groups) {
      if (g.positions.length === 0) continue;

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(g.positions, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(g.normals, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(g.uvs, 2));
      geo.setIndex(g.indices);

      const textures = getBlockTextures(type);
      if (!textures) continue;

      // 使用 MultiMaterial 或简单的 MeshLambertMaterial 纹理
      // 简单起见，对侧面使用 side 纹理
      // 但合并网格中不好区分面方向，所以用统一的 side 材质（草地顶面会有差异，可接受）
      const material = new THREE.MeshLambertMaterial({
        map: textures.side,
      });

      const mesh = new THREE.Mesh(geo, material);
      mesh.userData.blockType = type;
      mesh.userData.isChunkMesh = true;
      this.mesh.add(mesh);
    }

    geometry.dispose();
  }

  /** 加载到场景 */
  load() {
    if (!this.loaded) {
      this.scene.add(this.mesh);
      this.loaded = true;
    }
  }

  /** 从场景卸载 */
  unload() {
    if (this.loaded) {
      this.scene.remove(this.mesh);
      this.loaded = false;
    }
  }

  /** 释放 GPU 资源 */
  dispose() {
    while (this.mesh.children.length > 0) {
      const child = this.mesh.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (child.material.map) child.material.map.dispose();
        child.material.dispose();
      }
      this.mesh.remove(child);
    }
  }
}

// ============ 面几何辅助函数 ============

/**
 * 获取方块一个面的 4 个顶点坐标 (12个float)
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {string} face
 * @returns {number[]} [x0,y0,z0, x1,y1,z1, ...] 4个顶点
 */
function getFaceVertices(x, y, z, face) {
  const s = BLOCK_SIZE / 2;
  const cx = x + 0.5, cy = y + 0.5, cz = z + 0.5;
  // 偏移到方块中心
  const verts = {
    // 顶面 (py)
    'py': [-s, s, -s,  s, s, -s,  s, s, s,  -s, s, s],
    // 底面 (ny)
    'ny': [-s, -s, s,  s, -s, s,  s, -s, -s,  -s, -s, -s],
    // 正面 (pz)
    'pz': [-s, -s, s,  s, -s, s,  s, s, s,  -s, s, s],
    // 背面 (nz)
    'nz': [s, -s, -s,  -s, -s, -s,  -s, s, -s,  s, s, -s],
    // 右面 (px)
    'px': [s, -s, -s,  s, -s, s,  s, s, s,  s, s, -s],
    // 左面 (nx)
    'nx': [-s, -s, s,  -s, -s, -s,  -s, s, -s,  -s, s, s],
  };
  const v = verts[face];
  return [
    v[0] + cx, v[1] + cy, v[2] + cz,
    v[3] + cx, v[4] + cy, v[5] + cz,
    v[6] + cx, v[7] + cy, v[8] + cz,
    v[9] + cx, v[10] + cy, v[11] + cz,
  ];
}

/** @returns {number[]} 法线向量 [nx, ny, nz] */
function getFaceNormal(face) {
  const norms = {
    'px': [1,0,0], 'nx': [-1,0,0],
    'py': [0,1,0], 'ny': [0,-1,0],
    'pz': [0,0,1], 'nz': [0,0,-1],
  };
  return norms[face];
}

/** @returns {number[]} UV 坐标 [u0,v0, u1,v1, u2,v2, u3,v3] */
function getFaceUV(face) {
  return [0,0, 1,0, 1,1, 0,1];
}
```

- [ ] **Step 2: 验证 — 在 main.js 中渲染一个区块**

```js
import { Chunk } from './core/Chunk.js';
const chunk = new Chunk(0, 0, scene);
chunk.build();
chunk.load();
// 应该能看到一个带地形的区块
```

---

### Task 5: 世界管理器

**Files:**
- Create: `e:/claude code/CCdemo/yayaandkekeworld/src/core/World.js`

**Interfaces:**
- Consumes: `Chunk.js`, `constants.js`
- Produces: `World` 类，方法 `update(playerPos)` 管理区块生命周期，`getBlock(wx, wy, wz)` / `setBlock(wx, wy, wz, type)` 世界坐标方块操作，`rebuildChunk(cx, cz)` 重建指定区块

- [ ] **Step 1: 实现 World 类**

```js
import * as THREE from 'three';
import { Chunk } from './Chunk.js';
import { CHUNK_SIZE, CHUNK_HEIGHT, RENDER_DISTANCE_PC, RENDER_DISTANCE_MOBILE } from '../utils/constants.js';
import { BlockType } from '../blocks/BlockTypes.js';

/**
 * 世界管理器 — 管理所有区块的生命周期
 */
export class World {
  /** @param {THREE.Scene} scene */
  constructor(scene) {
    this.scene = scene;
    /** @type {Map<string, Chunk>} */
    this.chunks = new Map();
    /** 上次更新时的玩家区块坐标 */
    this.lastChunkX = null;
    this.lastChunkZ = null;
    this.renderDistance = window.innerWidth < 768 ? RENDER_DISTANCE_MOBILE : RENDER_DISTANCE_PC;
  }

  /**
   * 获取区块 key
   * @param {number} cx
   * @param {number} cz
   * @returns {string}
   */
  static chunkKey(cx, cz) {
    return `${cx},${cz}`;
  }

  /**
   * 根据玩家位置更新区块加载/卸载
   * @param {{ x: number, y: number, z: number }} playerPos
   */
  update(playerPos) {
    const cx = Math.floor(playerPos.x / CHUNK_SIZE);
    const cz = Math.floor(playerPos.z / CHUNK_SIZE);

    if (this.lastChunkX === cx && this.lastChunkZ === cz) return;
    this.lastChunkX = cx;
    this.lastChunkZ = cz;

    const rd = this.renderDistance;

    // 加载范围内的区块
    for (let dx = -rd; dx <= rd; dx++) {
      for (let dz = -rd; dz <= rd; dz++) {
        // 圆形距离优化 — 跳过对角线太远的区块
        if (dx * dx + dz * dz > rd * rd) continue;
        const ccx = cx + dx;
        const ccz = cz + dz;
        const key = World.chunkKey(ccx, ccz);
        if (!this.chunks.has(key)) {
          const chunk = new Chunk(ccx, ccz, this.scene);
          chunk.build();
          chunk.load();
          this.chunks.set(key, chunk);
        }
      }
    }

    // 卸载范围外的区块
    const toRemove = [];
    for (const [key, chunk] of this.chunks) {
      const dx = chunk.cx - cx;
      const dz = chunk.cz - cz;
      if (dx * dx + dz * dz > rd * rd + 4) { // 留一些缓冲
        toRemove.push(key);
      }
    }
    for (const key of toRemove) {
      const chunk = this.chunks.get(key);
      chunk.unload();
      chunk.dispose();
      this.chunks.delete(key);
    }
  }

  /**
   * 获取世界坐标处的方块
   * @param {number} wx
   * @param {number} wy
   * @param {number} wz
   * @returns {number} 方块类型 ID，越界返回 -1
   */
  getBlock(wx, wy, wz) {
    if (wy < 0 || wy >= CHUNK_HEIGHT) return -1;
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const key = World.chunkKey(cx, cz);
    const chunk = this.chunks.get(key);
    if (!chunk) return -1;
    const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return chunk.getBlock(lx, wy, lz);
  }

  /**
   * 设置世界坐标处的方块
   * @param {number} wx
   * @param {number} wy
   * @param {number} wz
   * @param {number} type
   */
  setBlock(wx, wy, wz, type) {
    if (wy < 0 || wy >= CHUNK_HEIGHT) return;
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const key = World.chunkKey(cx, cz);
    const chunk = this.chunks.get(key);
    if (!chunk) return;
    const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    chunk.setBlock(lx, wy, lz, type);
    // 重建区块网格
    chunk.build();
  }

  /**
   * 重建指定区块
   * @param {number} cx
   * @param {number} cz
   */
  rebuildChunk(cx, cz) {
    const key = World.chunkKey(cx, cz);
    const chunk = this.chunks.get(key);
    if (chunk) {
      chunk.build();
    }
  }

  /**
   * 释放所有区块
   */
  dispose() {
    for (const [, chunk] of this.chunks) {
      chunk.unload();
      chunk.dispose();
    }
    this.chunks.clear();
  }
}
```

- [ ] **Step 2: 验证 — 在 main.js 中使用 World 替换手动 Chunk 创建**

```js
import { World } from './core/World.js';
const world = new World(scene);
world.update({ x: 0, y: 5, z: 0 });
// 玩家站在 (0,5,0) 应加载周围区块，看到起伏地形
```

---

### Task 6: COZE 文字墙

**Files:**
- Create: `e:/claude code/CCdemo/yayaandkekeworld/src/worldgen/COZEWall.js`

**Interfaces:**
- Consumes: `BlockTypes.js`, `constants.js`
- Produces: `generateCOZEWall()` — 返回一个 `{x, y, z, type}[]` 坐标数组，供 World 在生成地形后写入

- [ ] **Step 1: 实现 COZE 文字墙生成器**

```js
import { BlockType } from '../blocks/BlockTypes.js';
import { PLATFORM_RADIUS, PLATFORM_Y } from '../utils/constants.js';

/**
 * 字母 5×7 矩阵定义 (true = 红色方块)
 * 每个字母是 5 列 × 7 行，从左到右、从下到上
 */
const LETTERS = {
  'C': [
    [1,1,1,1,1],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,1],
  ],
  'O': [
    [1,1,1,1,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,1],
  ],
  'Z': [
    [1,1,1,1,1],
    [0,0,0,0,1],
    [0,0,0,1,0],
    [0,0,1,0,0],
    [0,1,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,1],
  ],
  'E': [
    [1,1,1,1,1],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,1],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,1],
  ],
};

const LETTER_SPACING = 2;  // 字母间空白
const LETTER_WIDTH = 5;
const LETTER_HEIGHT = 7;

/**
 * 生成 COZE 文字墙的方块坐标
 * 墙位于沙质平台 Z 负方向边缘，玩家从原点面对 -Z 方向即可看到
 * @returns {{ x: number, y: number, z: number, type: number }[]}
 */
export function generateCOZEWall() {
  const blocks = [];

  // 计算总宽度: 4个字母各5宽 + 3个间隔各2
  const totalWidth = 4 * LETTER_WIDTH + 3 * LETTER_SPACING;
  // 起始 X：居中
  const startX = -Math.floor(totalWidth / 2);
  // Z 位置：沙质平台边缘再往前一格（-Z 方向）
  const wallZ = -(PLATFORM_RADIUS + 2);
  // 起始 Y：从沙质平台高度起
  const startY = PLATFORM_Y;

  const letters = ['C', 'O', 'Z', 'E'];
  let currentX = startX;

  for (const char of letters) {
    const matrix = LETTERS[char];
    if (!matrix) continue;

    for (let row = 0; row < LETTER_HEIGHT; row++) {
      for (let col = 0; col < LETTER_WIDTH; col++) {
        const isRed = matrix[row][col];
        if (!isRed) continue;

        const wx = currentX + col;
        const wy = startY + row;
        const wz = wallZ;

        blocks.push({ x: wx, y: wy, z: wz, type: BlockType.COZE_RED });
      }
    }

    currentX += LETTER_WIDTH + LETTER_SPACING;
  }

  return blocks;
}
```

- [ ] **Step 2: 整合 COZE 墙到 World.js**

在 `World.js` 的构造函数中添加 `cozeWallPlaced` 标志和 COZE 墙方法：

在 World 构造函数末尾添加：
```js
import { generateCOZEWall } from '../worldgen/COZEWall.js';

// 在 this.chunks = new Map() 之后添加：
/** @type {boolean} */
this.cozeWallPlaced = false;
```

在 World 类中添加方法：
```js
/**
 * 将 COZE 文字墙写入已加载的区块
 */
_placeCOZEWall() {
  const wallBlocks = generateCOZEWall();
  // 收集需要重建的区块 key
  const rebuildSet = new Set();

  for (const { x, y, z, type } of wallBlocks) {
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const key = World.chunkKey(cx, cz);
    const chunk = this.chunks.get(key);
    if (!chunk) continue;

    const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    chunk.setBlock(lx, y, lz, type);
    rebuildSet.add(key);
  }

  // 重建受影响的区块网格
  for (const key of rebuildSet) {
    const chunk = this.chunks.get(key);
    if (chunk) chunk.build();
  }
}
```

在 `update()` 方法末尾添加：
```js
// 首次加载完成后放置 COZE 墙
if (!this.cozeWallPlaced && this.chunks.size > 0) {
  this._placeCOZEWall();
  this.cozeWallPlaced = true;
}
```

---

### Task 7: 物理系统

**Files:**
- Create: `e:/claude code/CCdemo/yayaandkekeworld/src/physics/Physics.js`

**Interfaces:**
- Consumes: `constants.js`, `World.js` (用于碰撞检测的 `getBlock` 方法)
- Produces: `Physics.update(dt, player, world)` — 更新玩家速度和位置，处理重力和碰撞

- [ ] **Step 1: 实现 Physics.js**

```js
import { GRAVITY, PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_DEPTH, BLOCK_SIZE, CHUNK_HEIGHT } from '../utils/constants.js';
import { BlockType, isBlockSolid } from '../blocks/BlockTypes.js';

/**
 * AABB 碰撞检测与响应系统
 */
export class Physics {
  /**
   * 执行一帧物理更新
   * @param {number} dt - 时间增量（秒）
   * @param {import('../player/Player.js').Player} player
   * @param {import('../core/World.js').World} world
   */
  static update(dt, player, world) {
    // 应用重力
    player.velocity.y -= GRAVITY * dt;
    // 限制最大下落速度
    if (player.velocity.y < -30) player.velocity.y = -30;

    // 三轴分别移动 + 碰撞检测
    // X 轴
    player.position.x += player.velocity.x * dt;
    if (Physics.checkCollision(player, world)) {
      player.position.x -= player.velocity.x * dt;
      player.velocity.x = 0;
    }

    // Y 轴
    player.position.y += player.velocity.y * dt;
    if (Physics.checkCollision(player, world)) {
      if (player.velocity.y < 0) {
        player.grounded = true;
      }
      player.position.y -= player.velocity.y * dt;
      player.velocity.y = 0;
    }

    // Z 轴
    player.position.z += player.velocity.z * dt;
    if (Physics.checkCollision(player, world)) {
      player.position.z -= player.velocity.z * dt;
      player.velocity.z = 0;
    }

    // 防止掉出世界底部
    if (player.position.y < 0) {
      player.position.y = 0;
      player.velocity.y = 0;
      player.grounded = true;
    }
  }

  /**
   * 检测玩家 AABB 是否与周围方块碰撞
   * @param {import('../player/Player.js').Player} player
   * @param {import('../core/World.js').World} world
   * @returns {boolean} 是否碰撞
   */
  static checkCollision(player, world) {
    const hw = PLAYER_WIDTH / 2;
    const hd = PLAYER_DEPTH / 2;

    // 玩家 AABB
    const minX = player.position.x - hw;
    const maxX = player.position.x + hw;
    const minY = player.position.y;
    const maxY = player.position.y + PLAYER_HEIGHT;
    const minZ = player.position.z - hd;
    const maxZ = player.position.z + hd;

    // 计算覆盖的方块范围 (AABB → 整数坐标)
    const x0 = Math.floor(minX);
    const x1 = Math.floor(maxX);
    const y0 = Math.floor(minY);
    const y1 = Math.floor(maxY);
    const z0 = Math.floor(minZ);
    const z1 = Math.floor(maxZ);

    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        for (let z = z0; z <= z1; z++) {
          if (y < 0 || y >= CHUNK_HEIGHT) continue;
          const blockType = world.getBlock(x, y, z);
          if (!isBlockSolid(blockType)) continue;

          // 方块 AABB: [x, x+1] × [y, y+1] × [z, z+1]
          // 检测玩家 AABB 与方块 AABB 是否重叠
          if (minX < x + 1 && maxX > x &&
              minY < y + 1 && maxY > y &&
              minZ < z + 1 && maxZ > z) {
            return true;
          }
        }
      }
    }
    return false;
  }
}
```

- [ ] **Step 2: 验证物理 — 在 main.js 中初步测试**

可以使用 setTimeout 模拟一帧物理更新，但这里只需保证代码可加载即可。完整验证在 Task 8 集成 Player 后进行。

---

### Task 8: 玩家 + 视角控制

**Files:**
- Create: `e:/claude code/CCdemo/yayaandkekeworld/src/player/Player.js`
- Create: `e:/claude code/CCdemo/yayaandkekeworld/src/player/Controls.js`

**Interfaces:**
- Player: `position`, `velocity`, `grounded`, `rotation` (yaw/pitch), `update(dt, input, world)`
- Controls: `init(camera, domElement)` — 绑定鼠标/触控事件，`update(dt)` — 更新视角旋转，产出一个 `input` 对象

- [ ] **Step 1: 实现 Player.js**

```js
import { PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_DEPTH, EYE_HEIGHT, PLAYER_SPEED, JUMP_SPEED } from '../utils/constants.js';
import { Physics } from '../physics/Physics.js';

/**
 * 玩家状态
 */
export class Player {
  constructor() {
    /** 世界坐标位置 (脚底) */
    this.position = { x: 0, y: 5, z: 0 };
    /** 速度向量 */
    this.velocity = { x: 0, y: 0, z: 0 };
    /** 是否在地面 */
    this.grounded = false;
    /** 偏航角 (Y轴旋转) */
    this.yaw = 0;
    /** 俯仰角 (X轴旋转) */
    this.pitch = 0;
    /** 当前选中的方块类型索引 */
    this.selectedBlockIndex = 0;
  }

  /**
   * 更新玩家
   * @param {number} dt
   * @param {{ moveX: number, moveZ: number, jump: boolean, sprint: boolean }} input
   * @param {import('../core/World.js').World} world
   */
  update(dt, input, world) {
    if (!input) input = { moveX: 0, moveZ: 0, jump: false };

    // 计算移动方向 (基于偏航角)
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    const forwardX = -sin;
    const forwardZ = -cos;
    const rightX = cos;
    const rightZ = -sin;

    const speed = PLAYER_SPEED;
    let moveX = (rightX * input.moveX + forwardX * input.moveZ) * speed;
    let moveZ = (rightZ * input.moveX + forwardZ * input.moveZ) * speed;

    this.velocity.x = moveX;
    this.velocity.z = moveZ;

    // 跳跃
    if (input.jump && this.grounded) {
      this.velocity.y = JUMP_SPEED;
      this.grounded = false;
    }

    // 物理更新
    Physics.update(dt, this, world);
  }

  /**
   * 获取相机位置 (眼睛高度)
   * @returns {{ x: number, y: number, z: number }}
   */
  getCameraPosition() {
    return {
      x: this.position.x,
      y: this.position.y + EYE_HEIGHT,
      z: this.position.z,
    };
  }
}
```

- [ ] **Step 2: 实现 Controls.js**

```js
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

    this._bindEvents();
  }

  _bindEvents() {
    // Pointer Lock
    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.domElement;
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
   * 触控摇杆设置（由 TouchControls 调用）
   * @param {number} x - [-1, 1]
   * @param {number} z - [-1, 1]
   */
  setTouchInput(x, z) {
    this._touchMoveX = x;
    this._touchMoveZ = z;
  }
}
```

- [ ] **Step 3: 初步验证**

在 main.js 中创建 Player + Controls，连接后确认鼠标锁定后视角可旋转，键盘可改变移动方向（物理碰撞暂未集成到 main.js — 下一任务整合 Game 循环）。

---

### Task 9: 方块交互系统

**Files:**
- Create: `e:/claude code/CCdemo/yayaandkekeworld/src/interaction/Interaction.js`

**Interfaces:**
- Consumes: `World.js`, `BlockTypes.js`, `constants.js`, 相机对象
- Produces: `Interaction` 类，方法 `update(camera, world, player)` — 处理 Raycaster 检测 + 左键放置 / 右键破坏

- [ ] **Step 1: 实现 Interaction.js**

```js
import * as THREE from 'three';
import { REACH_DISTANCE, CHUNK_SIZE } from '../utils/constants.js';
import { BlockType, BLOCK_TYPES, isBlockSolid } from '../blocks/BlockTypes.js';
import { World } from '../core/World.js';

/**
 * 方块交互系统 — 左键放置、右键破坏
 */
export class Interaction {
  constructor() {
    /** @type {THREE.Raycaster} */
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = REACH_DISTANCE;

    /** 当前指向的高亮方块 (用于视觉反馈) */
    this.highlightedPos = null;

    /** 鼠标/触屏点击状态 */
    this._mouseDown = { left: false, right: false };
    this._leftClickPending = false;
    this._rightClickPending = false;

    this._bindEvents();
  }

  _bindEvents() {
    document.addEventListener('mousedown', (e) => {
      if (e.button === 0) this._leftClickPending = true;
      if (e.button === 2) this._rightClickPending = true;
    });
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    // 滚轮切换方块
    document.addEventListener('wheel', (e) => {
      if (document.pointerLockElement) {
        e.preventDefault();
      }
    }, { passive: false });

    // 数字键 1-6 选择方块
    document.addEventListener('keydown', (e) => {
      const num = parseInt(e.key);
      if (num >= 1 && num <= BLOCK_TYPES.length) {
        // 由外部读取 selectedBlockIndex
        this._pendingBlockSelect = num - 1;
      }
    });
  }

  /**
   * 当前待选择的方块索引
   * @returns {number|null}
   */
  consumeBlockSelect() {
    const val = this._pendingBlockSelect;
    this._pendingBlockSelect = null;
    return val;
  }

  /**
   * 执行交互检测
   * @param {THREE.PerspectiveCamera} camera
   * @param {import('../core/World.js').World} world
   * @param {import('../player/Player.js').Player} player
   * @returns {{ hit: boolean, position: THREE.Vector3, normal: THREE.Vector3, blockType: number } | null}
   */
  raycast(camera, world, player) {
    this.raycaster.setFromCamera({ x: 0, y: 0 }, camera);

    // 收集所有区块的 Mesh
    const meshes = [];
    for (const [, chunk] of world.chunks) {
      for (const child of chunk.mesh.children) {
        if (child.isMesh && child.userData.isChunkMesh) {
          meshes.push(child);
        }
      }
    }

    const intersects = this.raycaster.intersectObjects(meshes);
    if (intersects.length === 0) {
      this.highlightedPos = null;
      return null;
    }

    const hit = intersects[0];
    const face = hit.face;
    if (!face) return null;

    // 从 hit point 反推方块的世界坐标
    const pos = hit.point.clone();
    // 法线方向
    const normal = face.normal.clone();
    // Transform normal from local to world space
    normal.transformDirection(hit.object.matrixWorld);

    // 计算被击中方块的世界坐标 (向下取整)
    const blockPos = new THREE.Vector3(
      Math.floor(pos.x - normal.x * 0.5),
      Math.floor(pos.y - normal.y * 0.5),
      Math.floor(pos.z - normal.z * 0.5)
    );

    const blockType = world.getBlock(blockPos.x, blockPos.y, blockPos.z);

    this.highlightedPos = blockPos;

    return {
      hit: true,
      position: blockPos,
      normal: normal,
      blockType: blockType,
    };
  }

  /**
   * 每帧更新 — 处理交互
   * @param {THREE.PerspectiveCamera} camera
   * @param {import('../core/World.js').World} world
   * @param {import('../player/Player.js').Player} player
   */
  update(camera, world, player) {
    // 处理方块选择切换
    const selectIdx = this.consumeBlockSelect();
    if (selectIdx !== null && selectIdx < BLOCK_TYPES.length) {
      player.selectedBlockIndex = selectIdx;
    }

    const result = this.raycast(camera, world, player);
    if (!result) return;

    // 左键 → 破坏
    if (this._leftClickPending) {
      this._leftClickPending = false;
      const { position, blockType } = result;
      // 不能破坏基岩 (Y=0 的石头)
      if (position.y > 0) {
        world.setBlock(position.x, position.y, position.z, BlockType.AIR);
      }
    }

    // 右键 → 放置
    if (this._rightClickPending) {
      this._rightClickPending = false;
      const { position, normal } = result;
      // 在法线方向相邻位置放置
      const placeX = position.x + Math.round(normal.x);
      const placeY = position.y + Math.round(normal.y);
      const placeZ = position.z + Math.round(normal.z);

      // 检查是否与玩家碰撞箱重叠
      const playerBox = {
        minX: player.position.x - 0.3,
        maxX: player.position.x + 0.3,
        minY: player.position.y,
        maxY: player.position.y + 1.8,
        minZ: player.position.z - 0.3,
        maxZ: player.position.z + 0.3,
      };
      if (placeX < playerBox.maxX && placeX + 1 > playerBox.minX &&
          placeY < playerBox.maxY && placeY + 1 > playerBox.minY &&
          placeZ < playerBox.maxZ && placeZ + 1 > playerBox.minZ) {
        return; // 不能放在玩家身上
      }

      const blockType = BLOCK_TYPES[player.selectedBlockIndex] || BlockType.SAND;
      world.setBlock(placeX, placeY, placeZ, blockType);
    }
  }
}
```

- [ ] **Step 2: 验证**

集成到 Game 循环中测试，确认点击方块可以放置/破坏。

---

### Task 10: 游戏主循环 Game + main.js 最终集成

**Files:**
- Create: `e:/claude code/CCdemo/yayaandkekeworld/src/core/Game.js`
- Modify: `e:/claude code/CCdemo/yayaandkekeworld/src/main.js`

**Interfaces:**
- Game 类：构造时初始化所有子系统，`.start()` 启动主循环

- [ ] **Step 1: 实现 Game.js**

```js
import * as THREE from 'three';
import { World } from './World.js';
import { Player } from '../player/Player.js';
import { Controls } from '../player/Controls.js';
import { Interaction } from '../interaction/Interaction.js';

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
  }
}
```

- [ ] **Step 2: 更新 main.js**

```js
import { Game } from './core/Game.js';

const game = new Game();
game.start();
```

- [ ] **Step 3: 验证**

```bash
npm run dev
```

预期：页面加载后，点击画面锁定鼠标，WASD 移动，空格跳跃，可以看到地形世界和 COZE 文字墙，鼠标点击可以放置和破坏方块。

---

### Task 11: HUD 界面

**Files:**
- Create: `e:/claude code/CCdemo/yayaandkekeworld/src/ui/HUD.js`

**Interfaces:**
- Consumes: `BlockTypes.js`, `Player.js`
- Produces: HUD 类，`update(player)` 渲染到画面上

- [ ] **Step 1: 实现 HUD.js**

```js
import { BLOCK_TYPES, getBlockName, getBlockTextures } from '../blocks/BlockTypes.js';

/**
 * HUD — 十字准星 + 方块选择器
 */
export class HUD {
  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'hud';
    this.container.style.cssText = `
      position: fixed; inset: 0; pointer-events: none; z-index: 100;
      font-family: 'Segoe UI', sans-serif;
    `;
    document.body.appendChild(this.container);

    // 十字准星
    this.crosshair = document.createElement('div');
    this.crosshair.style.cssText = `
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 20px; height: 20px;
    `;
    this.crosshair.innerHTML = `
      <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <line x1="10" y1="2" x2="10" y2="8" stroke="white" stroke-width="2"/>
        <line x1="10" y1="12" x2="10" y2="18" stroke="white" stroke-width="2"/>
        <line x1="2" y1="10" x2="8" y2="10" stroke="white" stroke-width="2"/>
        <line x1="12" y1="10" x2="18" y2="10" stroke="white" stroke-width="2"/>
        <circle cx="10" cy="10" r="1" fill="white"/>
      </svg>
    `;
    this.container.appendChild(this.crosshair);

    // 方块选择器 (Hotbar)
    this.hotbar = document.createElement('div');
    this.hotbar.style.cssText = `
      position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
      display: flex; gap: 4px; background: rgba(0,0,0,0.6); padding: 6px; border-radius: 8px;
    `;
    this.container.appendChild(this.hotbar);

    /** @type {HTMLDivElement[]} */
    this.slots = [];
    for (let i = 0; i < BLOCK_TYPES.length; i++) {
      const slot = document.createElement('div');
      slot.style.cssText = `
        width: 50px; height: 50px; border: 2px solid rgba(255,255,255,0.2);
        border-radius: 4px; background: rgba(0,0,0,0.3);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        transition: border-color 0.15s; position: relative;
      `;
      slot.dataset.index = i;

      // 在 Canvas 上渲染方块纹理预览
      const textures = getBlockTextures(BLOCK_TYPES[i]);
      if (textures) {
        const img = document.createElement('canvas');
        img.width = 32; img.height = 32;
        const ctx = img.getContext('2d');
        // 画一个简单的颜色块
        ctx.fillStyle = getBlockColor(BLOCK_TYPES[i]);
        ctx.fillRect(0, 0, 32, 32);
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.strokeRect(0, 0, 32, 32);
        img.style.cssText = 'width: 32px; height: 32px; image-rendering: pixelated;';
        slot.appendChild(img);
      }

      this.hotbar.appendChild(slot);
      this.slots.push(slot);
    }
  }

  /**
   * 每帧更新 HUD
   * @param {import('../player/Player.js').Player} player
   */
  update(player) {
    const idx = player.selectedBlockIndex;
    this.slots.forEach((slot, i) => {
      slot.style.borderColor = i === idx ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)';
      slot.style.background = i === idx ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.3)';
    });
  }

  dispose() {
    this.container.remove();
  }
}

/**
 * 获取方块颜色 (用于 HUD 预览)
 * @param {number} type
 * @returns {string}
 */
function getBlockColor(type) {
  const colors = {
    1: '#4CAF50', 2: '#8B5E3C', 3: '#808080',
    4: '#F4E4A0', 5: '#E53935', 6: '#ECEFF1',
  };
  return colors[type] || '#888';
}
```

- [ ] **Step 2: 集成 HUD 到 Game.js**

在 `Game` 构造函数中添加：

```js
import { HUD } from '../ui/HUD.js';
// 在 controls 初始化之后添加：
this.hud = new HUD();
```

在 `_loop` 方法最后（render 之前或之后）添加：

```js
this.hud.update(this.player);
```

---

### Task 12: 移动端触控控件

**Files:**
- Create: `e:/claude code/CCdemo/yayaandkekeworld/src/ui/TouchControls.js`

**Interfaces:**
- 在移动端显示虚拟摇杆和动作按钮，通过 Controls.setTouchInput() 传递输入

- [ ] **Step 1: 实现 TouchControls.js**

```js
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
```

- [ ] **Step 2: 集成到 Game.js**

```js
import { TouchControls } from '../ui/TouchControls.js';
// 在 hud init 之后
this.touchControls = new TouchControls(this.controls);
```

---

### Task 13: 最终集成 + 响应式 + 性能优化

**Files:**
- Modify: `e:/claude code/CCdemo/yayaandkekeworld/index.html` — 完整样式 + 加载提示
- Modify: `e:/claude code/CCdemo/yayaandkekeworld/src/core/Game.js` — 完善响应式、性能优化

- [ ] **Step 1: 完善 index.html — 移动端适配样式 + 加载遮罩**

在 `index.html` 中添加移动端优化样式：

```html
<style>
  /* ... 已有样式 ... */
  
  /* 竖屏提示 */
  @media (orientation: portrait) and (max-width: 768px) {
    #rotate-hint {
      display: flex !important;
    }
  }
  
  #rotate-hint {
    display: none;
    position: fixed; inset: 0; z-index: 9998;
    background: #1a1a2e; color: white;
    flex-direction: column; align-items: center; justify-content: center;
    font-size: 1.2rem; text-align: center; padding: 2rem;
  }
  
  #loading-screen {
    position: fixed; inset: 0; z-index: 9997;
    background: #1a1a2e; color: white;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    font-size: 1.5rem; font-family: 'Segoe UI', sans-serif;
    transition: opacity 0.5s;
  }
  
  #loading-screen .sub {
    font-size: 0.9rem; color: #888; margin-top: 1rem;
  }
  
  #loading-screen.hidden {
    opacity: 0; pointer-events: none;
  }
</style>
```

添加元素到 body：

```html
<div id="rotate-hint">
  <div style="font-size: 4rem; margin-bottom: 2rem;">🔄</div>
  <div>请横屏使用以获得最佳体验</div>
</div>

<div id="loading-screen">
  <div>⛏️ yayaandkekeworld</div>
  <div class="sub">正在生成方块世界...</div>
</div>
```

- [ ] **Step 2: Game.js 加载完成隐藏 loading**

```js
// 在 Game 构造函数最后：
const loading = document.getElementById('loading-screen');
if (loading) loading.classList.add('hidden');
```

- [ ] **Step 3: 渲染距离动态适配**

在 Game 构造函数中根据屏幕尺寸和性能动态设置 `World` 的渲染距离：

```js
// 移动端降低渲染距离
if (window.innerWidth < 768) {
  this.world.renderDistance = RENDER_DISTANCE_MOBILE;
}
// 监听窗口变化
window.addEventListener('resize', () => {
  this.world.renderDistance = window.innerWidth < 768 
    ? RENDER_DISTANCE_MOBILE 
    : RENDER_DISTANCE_PC;
});
```

- [ ] **Step 4: 最终集成验证**

```bash
npm run dev
```

完整测试：
1. ✅ PC 端点击画面锁定鼠标，视角跟随
2. ✅ WASD 移动、空格跳跃
3. ✅ 可以看到地形世界、沙质平台、COZE 文字墙
4. ✅ 左键放置方块、右键破坏方块
5. ✅ 数字键 1-6 切换方块，滚轮切换
6. ✅ 移动端触控摇杆 + 视角拖拽 + 按钮
7. ✅ 区块动态加载/卸载
8. ✅ 响应式布局
