import { BlockType } from '../blocks/BlockTypes.js';
import { PLATFORM_RADIUS, PLATFORM_Y } from '../utils/constants.js';

/**
 * 字母 5x7 矩阵定义 (true = 红色方块)
 * 每个字母是 5 列 x 7 行，从左到右、从下到上
 */
const LETTERS = {
  // All matrices: row 0 = bottom of visual letter = lowest Y
  'L': [
    [1,1,1,1,1],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
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
  'V': [
    [0,0,1,0,0],
    [0,1,0,1,0],
    [0,1,0,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
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
 * 生成 LOVE 文字墙的方块坐标
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
  const startY = PLATFORM_Y + 22; // 上移 2 格

  const letters = ['L', 'O', 'V', 'E'];
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
