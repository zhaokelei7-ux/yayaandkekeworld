/**
 * yayaandkekeworld 全局常量
 * @module constants
 */

/** 重力加速度 (方块/秒²) */
export const GRAVITY = 9.8;
/** 玩家移动速度 (方块/秒) */
export const PLAYER_SPEED = 4.0;
/** 玩家冲刺速度 (方块/秒) */
export const PLAYER_SPRINT_SPEED = 7.0;
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

/** 世界边界半径 (从原点出发，超出后不能移动) */
export const WORLD_BOUNDARY = 48;

/** 纹理像素大小 */
export const TEXTURE_SIZE = 16;
