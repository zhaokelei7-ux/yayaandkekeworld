/**
 * 存档管理器 — 使用 localStorage 保存玩家对世界的修改
 *
 * 工作原理：
 * - 玩家放置/破坏方块时，保存整个区块的数据
 * - 下次打开游戏时，先生成地形 + 结构，
 *   然后用存档数据覆盖对应区块，还原玩家的建造
 * - "重新开始" = 清空所有存档数据
 */

const STORAGE_KEY = 'yaya_world_save';

/** 读取全部存档 */
function _loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** 写入全部存档 */
function _saveAll(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('⚠️ 存档空间不足，无法保存最近的修改');
  }
}

export class SaveManager {
  /**
   * 保存一个区块的完整方块数据
   * @param {number} cx - 区块 X 坐标
   * @param {number} cz - 区块 Z 坐标
   * @param {ArrayLike<number>} dataArray - 区块方块数据数组
   */
  static saveChunk(cx, cz, dataArray) {
    const all = _loadAll();
    all[`${cx},${cz}`] = Array.from(dataArray);
    _saveAll(all);
  }

  /**
   * 读取一个区块的存档数据
   * @param {number} cx
   * @param {number} cz
   * @returns {Uint8Array|null} 有存档返回数据，没有返回 null
   */
  static loadChunk(cx, cz) {
    const all = _loadAll();
    const raw = all[`${cx},${cz}`];
    return raw ? new Uint8Array(raw) : null;
  }

  /**
   * 是否有存档
   * @returns {boolean}
   */
  static hasAnySave() {
    return Object.keys(_loadAll()).length > 0;
  }

  /**
   * 清空所有存档（重新开始）
   */
  static clearAll() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
