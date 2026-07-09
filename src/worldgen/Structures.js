import { BlockType } from '../blocks/BlockTypes.js';
import { PLATFORM_Y } from '../utils/constants.js';

/**
 * ============================================================
 * 献给 — 主人娅 ❤️
 * ============================================================
 */

/**
 * 生成爱心图案 (红色方块)
 * @returns {{ x: number, y: number, z: number, type: number }[]}
 */
export function generateHeart() {
  const blocks = [];
  const by = PLATFORM_Y;

  // 经典 7×7 爱心, 中心 x=0, z=-7
  const design = [
    [0,0,1,0,1,0,0],  // row 6 (顶部两瓣)
    [0,1,1,1,1,1,0],  // row 5
    [1,1,1,1,1,1,1],  // row 4
    [1,1,1,1,1,1,1],  // row 3
    [0,1,1,1,1,1,0],  // row 2
    [0,0,1,1,1,0,0],  // row 1
    [0,0,0,1,0,0,0],  // row 0 (心尖)
  ];

  for (let row = 0; row < design.length; row++) {
    for (let col = 0; col < 7; col++) {
      if (design[row][col]) {
        blocks.push({
          x: col - 3,
          y: by + row + 5, // 抬高 5 格，让心在视线高度
          z: -7,
          type: BlockType.COZE_RED,
        });
      }
    }
  }

  return blocks;
}

/**
 * 生成 "主人" 粉色像素文字（居中放置）
 * 主 9宽, 人 7宽, 间隔 3 格
 * @returns {{ x: number, y: number, z: number, type: number }[]}
 */
export function generateZhuRen() {
  const blocks = [];
  const by = PLATFORM_Y + 4; // 抬高到视线高度附近

  // —— 巨型爱心背景 (15×15, z=-6, 主文字后方) ——
  // row 0 = bottom（心尖），row 14 = top（两瓣）
  const giantHeart = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],  // row 0
    [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],  // row 1  — 心尖
    [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0],  // row 2
    [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0],  // row 3
    [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0],  // row 4
    [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0],  // row 5
    [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0],  // row 6
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0],  // row 7  — 最宽
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0],  // row 8  — 最宽
    [0,0,1,1,1,1,1,0,1,1,1,1,1,0,0],  // row 9  — 开始分裂
    [0,0,0,1,1,1,0,0,0,1,1,1,0,0,0],  // row 10
    [0,0,0,0,1,0,0,0,0,0,1,0,0,0,0],  // row 11
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],  // row 12 — 去掉顶部两瓣
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],  // row 13
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],  // row 14
  ];
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      if (giantHeart[row][col]) {
        blocks.push({
          x: col - 7,
          y: by + row + 1,  // 靠近地面 1 格
          z: -8,             // 往后移 2 格（原 -6 → -8）
          type: BlockType.COZE_RED,
        });
      }
    }
  }

  // heart 7×7 (row 0 = 底部/心尖, row 6 = 顶部)
  const heart7 = [
    [0,0,0,1,0,0,0],  // row 0 — point (bottom)
    [0,0,1,1,1,0,0],  // row 1
    [0,1,1,1,1,1,0],  // row 2
    [1,1,1,1,1,1,1],  // row 3
    [1,1,1,1,1,1,1],  // row 4
    [0,1,1,0,1,1,0],  // row 5 — 去掉中间方块
    [0,0,0,0,0,0,0],  // row 6 — 去掉最上方两个方块
  ];

  // —— "主" 12行×9列 (row 0=底部，row 11=顶部) ——
  const zhu = [
    [0,0,0,0,0,0,0,0,0],  // row 0  bottom — EMPTY
    [0,0,0,0,0,0,0,0,0],  // row 1  — EMPTY
    [0,1,1,1,1,1,1,1,0],  // row 2  — 下横 (7 wide)
    [0,0,0,0,1,0,0,0,0],  // row 3  — vertical
    [0,0,0,0,1,0,0,0,0],  // row 4  — vertical
    [0,0,1,1,1,1,1,0,0],  // row 5  — 中横 (5 wide, shorter)
    [0,0,0,0,1,0,0,0,0],  // row 6  — vertical
    [0,0,0,0,1,0,0,0,0],  // row 7  — vertical
    [0,1,1,1,1,1,1,1,0],  // row 8  — 上横 (7 wide)
    [0,0,0,0,0,0,0,0,0],  // row 9  — 空格
    [0,0,0,0,1,0,0,0,0],  // row 10 — 点
    [0,0,0,0,0,0,0,0,0],  // row 11 — 留白
  ];
  // —— "人" 11行×7列 (row 0=底部，row 10=顶部) ——
  const ren = [
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [1,0,0,0,0,0,1],
    [1,1,0,0,0,1,1],
    [0,1,0,0,0,1,0],
    [0,1,1,0,1,1,0],
    [0,0,1,1,1,0,0],
    [0,0,0,1,0,0,0],
    [0,0,0,1,0,0,0],
    [0,0,0,1,0,0,0],
  ];

  // Order: heart, 主, 人, heart
  const elements = [heart7, zhu, ren, heart7];
  const widths = [7, 9, 7, 7];
  const types = [BlockType.COZE_RED, BlockType.PINK, BlockType.PINK, BlockType.COZE_RED];
  const heights = [7, 12, 11, 7];
  const extraOffset = [0, 0, -1, 0]; // 额外偏移量：人下降1格

  const gap = 3;
  const totalWidth = 7 + gap + 9 + gap + 7 + gap + 7; // = 39
  const startX = -Math.floor(totalWidth / 2); // = -19
  const textZ = -5;
  const textY = by;

  let curX = startX;
  for (let ci = 0; ci < elements.length; ci++) {
    const matrix = elements[ci];
    const w = widths[ci];
    const h = heights[ci];
    const type = types[ci];

    // Vertically center each element relative to the tallest (12 rows)
    const yOffset = Math.floor((12 - h) / 2) + (extraOffset[ci] || 0);

    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        if (matrix[row] && matrix[row][col]) {
          blocks.push({
            x: curX + col,
            y: textY + yOffset + row,
            z: textZ,
            type: type,
          });
        }
      }
    }
    curX += w + gap;
  }

  return blocks;
}
