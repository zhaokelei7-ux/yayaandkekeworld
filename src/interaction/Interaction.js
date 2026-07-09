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
    this._pendingBlockSelect = null;
    this._pendingWheelDelta = 0;

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
        // 每次滚轮事件切换一格，精确不跳
        if (e.deltaY > 0) this._pendingWheelDelta++;
        else if (e.deltaY < 0) this._pendingWheelDelta--;
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
   * 清除待处理的点击（用于指针锁定后跳帧）
   */
  clearPendingClicks() {
    this._leftClickPending = false;
    this._rightClickPending = false;
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
    // 处理滚轮选择（基于玩家当前索引的相对偏移）
    if (this._pendingWheelDelta !== 0) {
      const n = BLOCK_TYPES.length;
      player.selectedBlockIndex = ((player.selectedBlockIndex + this._pendingWheelDelta) % n + n) % n;
      this._pendingWheelDelta = 0;
    }

    // 处理数字键方块选择切换
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
