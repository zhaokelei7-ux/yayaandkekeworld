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
