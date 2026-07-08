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
