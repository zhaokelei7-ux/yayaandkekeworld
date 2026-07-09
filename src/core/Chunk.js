import * as THREE from 'three';
import { CHUNK_SIZE, CHUNK_HEIGHT, BLOCK_SIZE } from '../utils/constants.js';
import { BlockType, getBlockTextures, isBlockSolid } from '../blocks/BlockTypes.js';
import { generateChunkTerrain } from '../worldgen/TerrainGen.js';

/**
 * 单区块 — 存储 16×64×16 方块数据 + 构建合并网格
 */
export class Chunk {
  /** @param {number} cx @param {number} cz @param {THREE.Scene} scene */
  constructor(cx, cz, scene) {
    /** 区块坐标 */
    this.cx = cx;
    this.cz = cz;
    /** 世界坐标偏移 */
    this.offsetX = cx * CHUNK_SIZE;
    this.offsetZ = cz * CHUNK_SIZE;
    /** 方块数据 [x][y][z] 扁平存储 */
    this.data = generateChunkTerrain(cx, cz);
    /** Three.js 网格组 */
    this.mesh = new THREE.Group();
    this.mesh.position.set(this.offsetX, 0, this.offsetZ);
    this.scene = scene;
    /** 是否已加载到场景 */
    this.loaded = false;
  }

  /**
   * 获取方块类型
   * @param {number} x - 局部 X (0~15)
   * @param {number} y - Y (0~63)
   * @param {number} z - 局部 Z (0~15)
   * @returns {number}
   */
  getBlock(x, y, z) {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) return -1;
    return this.data[(x * CHUNK_HEIGHT + y) * CHUNK_SIZE + z];
  }

  /**
   * 设置方块类型
   * @param {number} x - 局部 X
   * @param {number} y - Y
   * @param {number} z - 局部 Z
   * @param {number} type
   */
  setBlock(x, y, z, type) {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) return;
    this.data[(x * CHUNK_HEIGHT + y) * CHUNK_SIZE + z] = type;
  }

  /**
   * 判断给定面是否可见（相邻方块为空气或不透明）
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {string} face - 'px'|'nx'|'py'|'ny'|'pz'|'nz'
   * @returns {boolean}
   */
  isFaceVisible(x, y, z, face) {
    const neighbors = {
      'px': { dx: 1, dy: 0, dz: 0 },
      'nx': { dx: -1, dy: 0, dz: 0 },
      'py': { dx: 0, dy: 1, dz: 0 },
      'ny': { dx: 0, dy: -1, dz: 0 },
      'pz': { dx: 0, dy: 0, dz: 1 },
      'nz': { dx: 0, dy: 0, dz: -1 },
    };
    const n = neighbors[face];
    const nx = x + n.dx, ny = y + n.dy, nz = z + n.dz;
    // 超出本区块边界 — 视为可见（由相邻区块处理或边界可见）
    if (nx < 0 || nx >= CHUNK_SIZE || ny < 0 || ny >= CHUNK_HEIGHT || nz < 0 || nz >= CHUNK_SIZE) return true;
    const neighborType = this.getBlock(nx, ny, nz);
    return neighborType === -1 || !isBlockSolid(neighborType);
  }

    /**
   * 构建区块网格（仅可见面）
   * 按面方向分三组：顶/底/侧，分别使用对应纹理
   * @param {Map<string, Chunk>} [neighborChunks]
   */
  build(neighborChunks) {
    this.dispose();

    // 按"类型-面方向"分组：key = `${type}-${faceDir}` (faceDir = 'top'|'bottom'|'side')
    /** @type {Map<string, {positions: number[], normals: number[], uvs: number[], indices: number[]}>} */
    const groups = new Map();

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let y = 0; y < CHUNK_HEIGHT; y++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
          const type = this.getBlock(x, y, z);
          if (type === BlockType.AIR || type === -1) continue;

          // 检查 6 个面
          const faces = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];
          for (const face of faces) {
            if (!this.isFaceVisible(x, y, z, face)) continue;

            // 根据面方向决定纹理组
            const faceDir = face === 'py' ? 'top' : face === 'ny' ? 'bottom' : 'side';
            const groupKey = `${type}-${faceDir}`;

            if (!groups.has(groupKey)) {
              groups.set(groupKey, { positions: [], normals: [], uvs: [], indices: [] });
            }
            const group = groups.get(groupKey);

            // 生成本方块该面的 4 个顶点（2 个三角形）
            const verts = getFaceVertices(x, y, z, face);
            const norm = getFaceNormal(face);
            const uv = getFaceUV(face);
            const baseIndex = group.positions.length / 3;

            for (let vi = 0; vi < 4; vi++) {
              group.positions.push(verts[vi * 3], verts[vi * 3 + 1], verts[vi * 3 + 2]);
              group.normals.push(norm[0], norm[1], norm[2]);
              group.uvs.push(uv[vi * 2], uv[vi * 2 + 1]);
            }
            // 两个三角形索引 (0-1-2, 0-2-3)
            group.indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
            group.indices.push(baseIndex, baseIndex + 2, baseIndex + 3);
          }
        }
      }
    }

    // 为每个 (类型-面方向) 组创建 Mesh
    for (const [groupKey, g] of groups) {
      if (g.positions.length === 0) continue;

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(g.positions, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(g.normals, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(g.uvs, 2));
      geo.setIndex(g.indices);

      // 从 groupKey 解析出 blockType 和 faceDir
      const [typeStr, faceDir] = groupKey.split('-');
      const textures = getBlockTextures(Number(typeStr));
      if (!textures) continue;

      const material = new THREE.MeshLambertMaterial({
        map: textures[faceDir],
      });

      const mesh = new THREE.Mesh(geo, material);
      mesh.userData.blockType = Number(typeStr);
      mesh.userData.isChunkMesh = true;
      this.mesh.add(mesh);
    }

  }

  /** 加载到场景 */
  load() {
    if (!this.loaded) {
      this.scene.add(this.mesh);
      this.loaded = true;
    }
  }

  /** 从场景卸载 */
  unload() {
    if (this.loaded) {
      this.scene.remove(this.mesh);
      this.loaded = false;
    }
  }

  /** 释放 GPU 资源 */
  dispose() {
    while (this.mesh.children.length > 0) {
      const child = this.mesh.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (child.material.map) child.material.map.dispose();
        child.material.dispose();
      }
      this.mesh.remove(child);
    }
    this.loaded = false;
  }
}

// ============ 面几何辅助函数 ============

/**
 * 获取方块一个面的 4 个顶点坐标 (12个float)
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {string} face
 * @returns {number[]} [x0,y0,z0, x1,y1,z1, ...] 4个顶点
 */
function getFaceVertices(x, y, z, face) {
  const s = BLOCK_SIZE / 2;
  const cx = x + 0.5, cy = y + 0.5, cz = z + 0.5;
  // 偏移到方块中心
  const verts = {
    // 顶面 (py) — 从 +Y 看向原点，CCW 绕序
    'py': [-s, s, s,  s, s, s,  s, s, -s,  -s, s, -s],
    // 底面 (ny) — 从 -Y 看向原点，CCW 绕序
    'ny': [-s, -s, -s,  s, -s, -s,  s, -s, s,  -s, -s, s],
    // 正面 (pz)
    'pz': [-s, -s, s,  s, -s, s,  s, s, s,  -s, s, s],
    // 背面 (nz)
    'nz': [s, -s, -s,  -s, -s, -s,  -s, s, -s,  s, s, -s],
    // 右面 (px) — 从 +X 看向原点，CCW 绕序
    'px': [s, s, -s,  s, s, s,  s, -s, s,  s, -s, -s],
    // 左面 (nx) — 从 -X 看向原点，CCW 绕序
    'nx': [-s, s, s,  -s, s, -s,  -s, -s, -s,  -s, -s, s],
  };
  const v = verts[face];
  return [
    v[0] + cx, v[1] + cy, v[2] + cz,
    v[3] + cx, v[4] + cy, v[5] + cz,
    v[6] + cx, v[7] + cy, v[8] + cz,
    v[9] + cx, v[10] + cy, v[11] + cz,
  ];
}

/** @returns {number[]} 法线向量 [nx, ny, nz] */
function getFaceNormal(face) {
  const norms = {
    'px': [1,0,0], 'nx': [-1,0,0],
    'py': [0,1,0], 'ny': [0,-1,0],
    'pz': [0,0,1], 'nz': [0,0,-1],
  };
  return norms[face];
}

/** @returns {number[]} UV 坐标 [u0,v0, u1,v1, u2,v2, u3,v3] */
function getFaceUV(face) {
  // pz/nz 面：V0/V1 在底部（y=-s），V2/V3 在顶部（y=s）
  // 需要 V2/V3 得到 v=0（绿色条纹），V0/V1 得到 v=1（棕色）
  if (face === 'pz' || face === 'nz') return [0,1, 1,1, 1,0, 0,0];
  return [0,0, 1,0, 1,1, 0,1];
}
