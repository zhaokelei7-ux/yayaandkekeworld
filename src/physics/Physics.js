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
    // 应用重力（当 grounded 时碰撞检测会阻止穿模）
    player.velocity.y -= GRAVITY * dt;
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
        // 下落 → 踩到方块表面，snap 到方块顶部消除抖动
        player.grounded = true;
        player.position.y = Math.floor(player.position.y) + 1;
      } else {
        // 上升 → 撞到天花板，回退
        player.position.y -= player.velocity.y * dt;
      }
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
