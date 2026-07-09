import { PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_DEPTH, EYE_HEIGHT, PLAYER_SPEED, PLAYER_SPRINT_SPEED, JUMP_SPEED } from '../utils/constants.js';
import { Physics } from '../physics/Physics.js';

/**
 * 玩家状态
 */
export class Player {
  constructor() {
    /** 世界坐标位置 (脚底) */
    this.position = { x: 0, y: 100, z: 0 };
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
    /** 是否飞行模式 */
    this.flying = false;
    /** 飞行速度 */
    this.flySpeed = 28.0;
  }

  /**
   * 更新玩家
   * @param {number} dt
   * @param {{ moveX: number, moveZ: number, jump: boolean, sprint: boolean, descend: boolean }} input
   * @param {import('../core/World.js').World} world
   */
  update(dt, input, world) {
    if (!input) input = { moveX: 0, moveZ: 0, jump: false, descend: false };

    // 计算移动方向 (基于偏航角)
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    const forwardX = sin;
    const forwardZ = cos;
    const rightX = cos;
    const rightZ = -sin;

    if (this.flying) {
      // === 飞行模式 ===
      const speed = this.flySpeed;
      this.velocity.x = (rightX * input.moveX + forwardX * input.moveZ) * speed;
      this.velocity.z = (rightZ * input.moveX + forwardZ * input.moveZ) * speed;

      // 上升/下降
      if (input.jump) {
        this.velocity.y = speed;
      } else if (input.descend) {
        this.velocity.y = -speed;
      } else {
        this.velocity.y = 0;
      }

      // 自由移动，无视碰撞
      this.position.x += this.velocity.x * dt;
      this.position.y += this.velocity.y * dt;
      this.position.z += this.velocity.z * dt;
    } else {
      // === 地面模式 ===
      const speed = input.sprint ? PLAYER_SPRINT_SPEED : PLAYER_SPEED;
      this.velocity.x = (rightX * input.moveX + forwardX * input.moveZ) * speed;
      this.velocity.z = (rightZ * input.moveX + forwardZ * input.moveZ) * speed;

      // 跳跃
      if (input.jump && this.grounded) {
        this.velocity.y = JUMP_SPEED;
        this.grounded = false;
      }

      // 物理更新
      Physics.update(dt, this, world);
    }
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
