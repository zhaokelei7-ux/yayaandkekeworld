import * as THREE from 'three';
import { TEXTURE_SIZE } from '../utils/constants.js';

/**
 * 方块类型枚举
 * @readonly
 * @enum {number}
 */
export const BlockType = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  SAND: 4,
  COZE_RED: 5,
  COZE_WHITE: 6,
};

/**
 * 方块属性定义
 * name, solid(是否实体), color/pixels 用于纹理生成
 */
const BLOCK_DEFS = {
  [BlockType.GRASS]: {
    name: '草地',
    solid: true,
    topColor: '#4CAF50',
    sideColor: '#8B5E3C',
    bottomColor: '#8B5E3C',
    topStripColor: '#4CAF50',
  },
  [BlockType.DIRT]: {
    name: '泥土',
    solid: true,
    topColor: '#8B5E3C',
    sideColor: '#8B5E3C',
    bottomColor: '#8B5E3C',
  },
  [BlockType.STONE]: {
    name: '石头',
    solid: true,
    topColor: '#808080',
    sideColor: '#808080',
    bottomColor: '#808080',
  },
  [BlockType.SAND]: {
    name: '沙地',
    solid: true,
    topColor: '#F4E4A0',
    sideColor: '#F4E4A0',
    bottomColor: '#F4E4A0',
  },
  [BlockType.COZE_RED]: {
    name: 'COZE红',
    solid: true,
    topColor: '#E53935',
    sideColor: '#E53935',
    bottomColor: '#E53935',
  },
  [BlockType.COZE_WHITE]: {
    name: '白墙',
    solid: true,
    topColor: '#ECEFF1',
    sideColor: '#ECEFF1',
    bottomColor: '#ECEFF1',
  },
};

/**
 * 生成 16×16 像素风格的 Canvas 纹理
 * @param {string} topColor - 顶面颜色
 * @param {string} sideColor - 侧面颜色
 * @param {string} bottomColor - 底面颜色
 * @param {string} [topStripColor] - 草地顶部条颜色
 * @returns {{ top: HTMLCanvasElement, side: HTMLCanvasElement, bottom: HTMLCanvasElement }}
 */
function createBlockTexture(topColor, sideColor, bottomColor, topStripColor) {
  const size = TEXTURE_SIZE;
  const pixelSize = 2; // 2×2 像素块模拟像素风

  const makeCanvas = (color, strips) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    // 填充底色
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);
    // 像素网格线 (暗边)
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < size; x += pixelSize) {
      for (let y = 0; y < size; y += pixelSize) {
        ctx.strokeRect(x, y, pixelSize, pixelSize);
      }
    }
    // 草地特定：顶部绿色条
    if (strips) {
      ctx.fillStyle = strips;
      ctx.fillRect(0, 0, size, 4);
    }
    return canvas;
  };

  return {
    top: makeCanvas(topColor, topStripColor),
    side: makeCanvas(sideColor, topStripColor || null),
    bottom: makeCanvas(bottomColor),
  };
}

/** 纹理缓存 */
const textureCache = new Map();

/**
 * 获取方块的三面纹理 (Three.js CanvasTexture)
 * @param {number} blockType
 * @returns {{ top: THREE.CanvasTexture, side: THREE.CanvasTexture, bottom: THREE.CanvasTexture } | null}
 */
export function getBlockTextures(blockType) {
  if (blockType === BlockType.AIR) return null;
  if (textureCache.has(blockType)) return textureCache.get(blockType);

  const def = BLOCK_DEFS[blockType];
  if (!def) return null;

  const canvases = createBlockTexture(def.topColor, def.sideColor, def.bottomColor, def.topStripColor);
  const textures = {
    top: new THREE.CanvasTexture(canvases.top),
    side: new THREE.CanvasTexture(canvases.side),
    bottom: new THREE.CanvasTexture(canvases.bottom),
  };
  // 纹理过滤设为 NearestFilter 以保持像素感
  for (const key of ['top', 'side', 'bottom']) {
    textures[key].magFilter = THREE.NearestFilter;
    textures[key].minFilter = THREE.NearestFilter;
  }
  textureCache.set(blockType, textures);
  return textures;
}

/**
 * 获取方块是否实体（碰撞 / 遮挡）
 * @param {number} blockType
 * @returns {boolean}
 */
export function isBlockSolid(blockType) {
  if (blockType === BlockType.AIR) return false;
  const def = BLOCK_DEFS[blockType];
  return def ? def.solid : false;
}

/**
 * 获取方块名称
 * @param {number} blockType
 * @returns {string}
 */
export function getBlockName(blockType) {
  const def = BLOCK_DEFS[blockType];
  return def ? def.name : '未知';
}

/** 所有可用的方块类型列表（用于 UI 切换） */
export const BLOCK_TYPES = [BlockType.GRASS, BlockType.DIRT, BlockType.STONE, BlockType.SAND, BlockType.COZE_RED, BlockType.COZE_WHITE];
