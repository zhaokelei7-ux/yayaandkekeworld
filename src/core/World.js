import * as THREE from 'three';
import { Chunk } from './Chunk.js';
import { CHUNK_SIZE, CHUNK_HEIGHT, RENDER_DISTANCE_PC, RENDER_DISTANCE_MOBILE } from '../utils/constants.js';
import { generateCOZEWall } from '../worldgen/COZEWall.js';
import { generateZhuRen } from '../worldgen/Structures.js';
import { SaveManager } from '../utils/SaveManager.js';

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
    /** @type {boolean} */
    this.structuresPlaced = false;
    /** @type {boolean} 存档系统是否就绪（结构放置后激活） */
    this._saveReady = false;
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

          // 如果存档已启用，检查是否有保存的区块数据
          if (this._saveReady) {
            const saved = SaveManager.loadChunk(ccx, ccz);
            if (saved) {
              chunk.data = saved;
            }
          }

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

    // 首次加载完成后放置 COZE 墙 + 主人文字
    if (!this.structuresPlaced && this.chunks.size > 0) {
      this._placeStructures();
      this.structuresPlaced = true;
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

    // 存档：保存被修改的区块
    if (this._saveReady) {
      SaveManager.saveChunk(cx, cz, chunk.data);
    }
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
   * 将 COZE 文字墙 + 主人粉色文字写入已加载的区块
   */
  _placeStructures() {
    // ——— LOVE 文字墙 ———
    const wallBlocks = generateCOZEWall();
    const rebuildSet = new Set();
    this._writeBlocks(wallBlocks, rebuildSet);

    // ——— "主人" 粉色文字 ———
    const nameBlocks = generateZhuRen();
    this._writeBlocks(nameBlocks, rebuildSet);

    // 重建受影响的区块网格
    for (const key of rebuildSet) {
      const chunk = this.chunks.get(key);
      if (chunk) chunk.build();
    }

    // 激活存档系统：应用之前保存的玩家修改
    this._initSave();
  }

  /**
   * 初始化存档系统 — 将已保存的区块数据覆盖到当前加载的区块上
   */
  _initSave() {
    this._saveReady = true;
    let loadedCount = 0;
    for (const [, chunk] of this.chunks) {
      const saved = SaveManager.loadChunk(chunk.cx, chunk.cz);
      if (saved) {
        chunk.data = saved;
        chunk.build();
        loadedCount++;
      }
    }
    if (loadedCount > 0) {
      console.log(`💾 已恢复 ${loadedCount} 个区块的建造`);
    }
  }

  /**
   * 将方块列表写入区块
   * @param {{ x: number, y: number, z: number, type: number }[]} blockList
   * @param {Set<string>} rebuildSet
   */
  _writeBlocks(blockList, rebuildSet) {
    for (const { x, y, z, type } of blockList) {
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
