import { BLOCK_TYPES, getBlockName, getBlockTextures } from '../blocks/BlockTypes.js';

/**
 * HUD — 十字准星 + 方块选择器
 */
export class HUD {
  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'hud';
    this.container.style.cssText = `
      position: fixed; inset: 0; pointer-events: none; z-index: 100;
      font-family: 'Segoe UI', sans-serif;
    `;
    document.body.appendChild(this.container);

    // 十字准星
    this.crosshair = document.createElement('div');
    this.crosshair.style.cssText = `
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 20px; height: 20px;
    `;
    this.crosshair.innerHTML = `
      <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <line x1="10" y1="2" x2="10" y2="8" stroke="white" stroke-width="2"/>
        <line x1="10" y1="12" x2="10" y2="18" stroke="white" stroke-width="2"/>
        <line x1="2" y1="10" x2="8" y2="10" stroke="white" stroke-width="2"/>
        <line x1="12" y1="10" x2="18" y2="10" stroke="white" stroke-width="2"/>
        <circle cx="10" cy="10" r="1" fill="white"/>
      </svg>
    `;
    this.container.appendChild(this.crosshair);

    // 方块选择器 (Hotbar)
    this.hotbar = document.createElement('div');
    this.hotbar.style.cssText = `
      position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
      display: flex; gap: 4px; background: rgba(0,0,0,0.6); padding: 6px; border-radius: 8px;
    `;
    this.container.appendChild(this.hotbar);

    /** @type {HTMLDivElement[]} */
    this.slots = [];
    for (let i = 0; i < BLOCK_TYPES.length; i++) {
      const slot = document.createElement('div');
      slot.style.cssText = `
        width: 50px; height: 50px; border: 2px solid rgba(255,255,255,0.2);
        border-radius: 4px; background: rgba(0,0,0,0.3);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        transition: border-color 0.15s; position: relative;
      `;
      slot.dataset.index = i;

      // 在 Canvas 上渲染方块纹理预览
      const textures = getBlockTextures(BLOCK_TYPES[i]);
      if (textures) {
        const img = document.createElement('canvas');
        img.width = 32; img.height = 32;
        const ctx = img.getContext('2d');
        // 画一个简单的颜色块
        ctx.fillStyle = getBlockColor(BLOCK_TYPES[i]);
        ctx.fillRect(0, 0, 32, 32);
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.strokeRect(0, 0, 32, 32);
        img.style.cssText = 'width: 32px; height: 32px; image-rendering: pixelated;';
        slot.appendChild(img);
      }

      this.hotbar.appendChild(slot);
      this.slots.push(slot);
    }
  }

  /**
   * 每帧更新 HUD
   * @param {import('../player/Player.js').Player} player
   */
  update(player) {
    const idx = player.selectedBlockIndex;
    this.slots.forEach((slot, i) => {
      slot.style.borderColor = i === idx ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)';
      slot.style.background = i === idx ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.3)';
    });
  }

  dispose() {
    this.container.remove();
  }
}

/**
 * 获取方块颜色 (用于 HUD 预览)
 * @param {number} type
 * @returns {string}
 */
function getBlockColor(type) {
  const colors = {
    1: '#4CAF50', 2: '#8B5E3C', 3: '#808080',
    4: '#F4E4A0', 5: '#E53935', 6: '#ECEFF1', 7: '#F06292',
  };
  return colors[type] || '#888';
}
