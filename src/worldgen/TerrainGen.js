import { BlockType } from '../blocks/BlockTypes.js';
import { CHUNK_SIZE, CHUNK_HEIGHT, PLATFORM_RADIUS, PLATFORM_Y } from '../utils/constants.js';

/**
 * 简易噪声函数 — 正弦波叠加模拟地形起伏
 */
function noise(x, z) {
  const n = Math.sin(x * 0.1 + 1.3) * Math.cos(z * 0.12 + 0.7) * 0.5
          + Math.sin(x * 0.05 + z * 0.08 + 2.1) * 0.3
          + Math.cos(x * 0.2 + z * 0.15) * 0.2;
  return (n + 1) / 2;
}

/**
 * 简单的基于坐标的伪随机（保证同位置生成一致）
 */
function hash(x, z, seed) {
  let h = x * 374761393 + z * 668265263 + seed;
  h = (h ^ (h >> 13)) * 1274126177;
  return (h ^ (h >> 16)) & 0x7fffffff;
}

/**
 * 检查是否在结构保护区内（避免树木遮挡 LOVE 墙 / 主人文字）
 */
function isInProtectedZone(wx, wz) {
  // 保护范围：LOVE墙 + 主人 + 爱心区域
  const protectX = 26;  // x: -26 ~ 26
  const protectZMin = -16; // z: -16 ~ 2
  const protectZMax = 2;
  return Math.abs(wx) <= protectX && wz >= protectZMin && wz <= protectZMax;
}

/**
 * 在指定位置生成一棵小树
 */
function placeSmallTree(data, cx, cz, tx, tz, surfaceY) {
  const size = CHUNK_SIZE;
  const height = CHUNK_HEIGHT;

  const trunkHeight = 4 + (hash(tx + cx * 16, tz + cz * 16, 1) % 3); // 4~6

  for (let ly = 1; ly <= trunkHeight; ly++) {
    const y = surfaceY + ly;
    if (y >= height) break;
    const idx = (tx * height + y) * size + tz;
    data[idx] = BlockType.WOOD;
  }

  // 树叶（3层）
  for (let ly = -1; ly <= 2; ly++) {
    const y = surfaceY + trunkHeight + ly;
    if (y < 0 || y >= height) continue;

    let radius;
    if (ly === -1) radius = 1;
    else if (ly === 0) radius = 2;
    else if (ly === 1) radius = 1;
    else radius = 0;

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        if (Math.abs(dx) === radius && Math.abs(dz) === radius) continue;
        const lx = tx + dx;
        const lz = tz + dz;
        if (lx < 0 || lx >= size || lz < 0 || lz >= size) continue;
        const idx = (lx * height + y) * size + lz;
        if (data[idx] === BlockType.AIR) {
          data[idx] = BlockType.LEAVES;
        }
      }
    }
  }
}

/**
 * 在指定位置生成一棵大树
 */
function placeBigTree(data, cx, cz, tx, tz, surfaceY) {
  const size = CHUNK_SIZE;
  const height = CHUNK_HEIGHT;

  const trunkHeight = 7 + (hash(tx + cx * 16, tz + cz * 16, 7) % 3); // 7~9

  // 树干（更粗 2×2）
  for (let dx = 0; dx <= 1; dx++) {
    for (let dz = 0; dz <= 1; dz++) {
      const lx = tx + dx;
      const lz = tz + dz;
      if (lx < 0 || lx >= size || lz < 0 || lz >= size) continue;
      for (let ly = 1; ly <= trunkHeight; ly++) {
        const y = surfaceY + ly;
        if (y >= height) break;
        const idx = (lx * height + y) * size + lz;
        data[idx] = BlockType.WOOD;
      }
    }
  }

  // 树叶（更大范围 4层）
  for (let ly = -2; ly <= 2; ly++) {
    const y = surfaceY + trunkHeight + ly;
    if (y < 0 || y >= height) continue;

    let radius;
    if (ly === -2) radius = 1;
    else if (ly === -1) radius = 3;
    else if (ly === 0) radius = 3;
    else if (ly === 1) radius = 2;
    else radius = 0;

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        // 切角圆形
        if (Math.abs(dx) === radius && Math.abs(dz) === radius) continue;
        // 底部两层有中心凹陷让树干露出
        if (ly === -2 || ly === -1) {
          if (Math.abs(dx) <= 1 && Math.abs(dz) <= 1) continue;
        }
        const lx = tx + dx;
        const lz = tz + dz;
        if (lx < 0 || lx >= size || lz < 0 || lz >= size) continue;
        const idx = (lx * height + y) * size + lz;
        if (data[idx] === BlockType.AIR) {
          data[idx] = BlockType.LEAVES;
        }
      }
    }
  }
}

/**
 * 为指定区块生成地形方块数据
 */
export function generateChunkTerrain(cx, cz) {
  const size = CHUNK_SIZE;
  const height = CHUNK_HEIGHT;
  const total = size * height * size;
  const data = new Uint8Array(total);

  const baseX = cx * size;
  const baseZ = cz * size;

  // 第一步：生成基础地形
  const surfaceMap = new Map();

  for (let lx = 0; lx < size; lx++) {
    for (let lz = 0; lz < size; lz++) {
      const wx = baseX + lx;
      const wz = baseZ + lz;

      const inPlatform = Math.abs(wx) <= PLATFORM_RADIUS && Math.abs(wz) <= PLATFORM_RADIUS;

      let surfaceY;
      if (inPlatform) {
        surfaceY = PLATFORM_Y;
      } else {
        const n = noise(wx, wz);
        surfaceY = Math.floor(4 + n * 8);
      }

      surfaceMap.set(`${lx},${lz}`, surfaceY);

      for (let y = 0; y < height; y++) {
        const idx = (lx * height + y) * size + lz;
        if (y === 0) {
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

  // 第二步：种树
  for (let lx = 2; lx < size - 2; lx++) {
    for (let lz = 2; lz < size - 2; lz++) {
      const wx = baseX + lx;
      const wz = baseZ + lz;

      // 不在沙质平台种树
      if (Math.abs(wx) <= PLATFORM_RADIUS + 2 && Math.abs(wz) <= PLATFORM_RADIUS + 2) continue;
      // 不遮挡 LOVE墙 / 主人文字 / 爱心
      if (isInProtectedZone(wx, wz)) continue;

      const surfaceY = surfaceMap.get(`${lx},${lz}`);
      if (surfaceY <= 1) continue;

      const r = hash(wx, wz, 42) % 1000;
      if (r < 40) {
        placeSmallTree(data, cx, cz, lx, lz, surfaceY);
      } else if (r < 55) {
        placeBigTree(data, cx, cz, lx, lz, surfaceY);
      }
    }
  }

  return data;
}
