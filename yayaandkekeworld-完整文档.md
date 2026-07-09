# Yaya & Keke World — 3D 像素方块世界 完整项目文档

> **一个类似 Minecraft 风格的 3D 像素方块网页应用，使用 Three.js + Vite 构建，支持 PC 与移动端。**
>
> 项目名称寓意：用户 "yaya" 和 "keke" 的专属世界，包含 COZE 文字墙、爱心与"主人娅"粉色文字等特色内容。

---

## 目录

1. [项目概览](#1-项目概览)
2. [技术栈](#2-技术栈)
3. [项目结构](#3-项目结构)
4. [快速启动](#4-快速启动)
5. [架构与数据流](#5-架构与数据流)
6. [模块详解](#6-模块详解)
   - [6.1 主入口 — main.js](#61-主入口-mainjs)
   - [6.2 游戏主循环 — Game.js](#62-游戏主循环-gamejs)
   - [6.3 世界管理器 — World.js](#63-世界管理器-worldjs)
   - [6.4 区块系统 — Chunk.js](#64-区块系统-chunkjs)
   - [6.5 方块类型与纹理 — BlockTypes.js](#65-方块类型与纹理-blocktypesjs)
   - [6.6 全局常量 — constants.js](#66-全局常量-constantsjs)
   - [6.7 玩家系统 — Player.js](#67-玩家系统-playerjs)
   - [6.8 视角控制 — Controls.js](#68-视角控制-controlsjs)
   - [6.9 物理系统 — Physics.js](#69-物理系统-physicsjs)
   - [6.10 交互系统 — Interaction.js](#610-交互系统-interactionjs)
   - [6.11 地形生成 — TerrainGen.js](#611-地形生成-terraingenjs)
   - [6.12 COZE 文字墙 — COZEWall.js](#612-coze-文字墙-cozewalljs)
   - [6.13 爱心与主人娅 — Structures.js](#613-爱心与主人娅-structuresjs)
   - [6.14 天空装饰 — Sky.js](#614-天空装饰-skyjs)
   - [6.15 抬头显示 — HUD.js](#615-抬头显示-hudjs)
   - [6.16 触控控件 — TouchControls.js](#616-触控控件-touchcontrolsjs)
7. [方块系统](#7-方块系统)
8. [世界生成](#8-世界生成)
9. [玩家与视角](#9-玩家与视角)
10. [物理系统详解](#10-物理系统详解)
11. [区块系统与性能](#11-区块系统与性能)
12. [交互系统](#12-交互系统)
13. [移动端适配](#13-移动端适配)
14. [开发计划与进度](#14-开发计划与进度)
15. [文件清单](#15-文件清单)

---

## 1. 项目概览

**Yaya & Keke World** 是一个第一人称 3D 像素方块世界网页应用。玩家可以在程序化生成的地形上自由移动、放置和破坏方块。世界中央有一个沙质平台，平台上矗立着爱心图案和"主人娅"粉色文字，作为世界的标志性建筑。

| 特性 | 说明 |
|---|---|
| **渲染** | Three.js WebGL 3D 渲染 |
| **世界** | 无限地形（区块动态加载/卸载） |
| **方块** | 7 种类型：草地、泥土、石头、沙地、COZE红、白墙、粉色 |
| **物理** | 自研 AABB 碰撞引擎 + 重力 |
| **交互** | 第一人称放置与破坏方块 |
| **控制** | PC 鼠标键盘 + 移动端触控 |
| **纹理** | 程序化 Canvas 生成，零外部图片 |

---

## 2. 技术栈

| 层 | 选择 | 版本 | 理由 |
|---|---|---|---|
| 语言 | JavaScript (ES Module) | — | 零类型编译，开发迭代快 |
| 3D 引擎 | Three.js | ^0.160.0 | 成熟 WebGL 封装，社区活跃 |
| 构建工具 | Vite | ^5.4.0 | 极速 HMR，零配置上手 |
| 物理 | 自研 AABB 碰撞系统 | — | 比 cannon.js 轻量百倍，方块世界专用 |
| 纹理 | Canvas API 程序化生成 | — | 零外部图片资源，自包含部署 |
| 包管理 | npm + package.json | — | 标准流程 |

---

## 3. 项目结构

```
yayaandkekeworld/
├── index.html                        # 入口 HTML（挂载点 + 加载遮罩 + 竖屏提示）
├── package.json                      # 依赖：three, dev: vite
├── package-lock.json                 # 依赖锁定
├── vite.config.js                    # Vite 配置（host 0.0.0.0:3000）
├── public/
│   └── favicon.svg                   # 像素风方块图标
├── src/
│   ├── main.js                       # 启动入口：创建 Game 实例并启动
│   ├── core/
│   │   ├── Game.js                   # 游戏主循环 (RAF) + 子系统编排
│   │   ├── World.js                  # 世界管理：区块字典、加载/卸载、更新
│   │   └── Chunk.js                  # 单区块：方块数据存储 + 网格构建(面剔除)
│   ├── blocks/
│   │   └── BlockTypes.js             # 方块枚举、属性、程序化纹理生成
│   ├── player/
│   │   ├── Player.js                 # 玩家位置/速度/碰撞箱/跳跃状态
│   │   └── Controls.js               # PC 鼠标 (PointerLock) + 移动端触控 视角控制
│   ├── physics/
│   │   └── Physics.js                # 重力积分 + AABB vs 方块碰撞检测
│   ├── interaction/
│   │   └── Interaction.js            # Raycaster 射线检测 + 放置/破坏逻辑
│   ├── worldgen/
│   │   ├── TerrainGen.js             # 高度图生成 + 方块填充（草地/泥土/石头）
│   │   ├── COZEWall.js               # COZE 文字墙的方块坐标数组构造
│   │   ├── Structures.js             # 爱心图案 + "主人娅" 粉色文字生成
│   │   └── Sky.js                    # 天空装饰（太阳 + 云朵）
│   ├── ui/
│   │   ├── HUD.js                    # 十字准星 + 方块选择器热栏
│   │   └── TouchControls.js          # 移动端虚拟摇杆 + 跳跃/放置/破坏按钮
│   └── utils/
│       └── constants.js              # 全局常量（重力、移动速度、渲染距离等）
├── plans/
│   └── 2026-07-08-yayaandkekeworld-plan.md    # 实现计划文档
├── specs/
│   └── 2026-07-08-yayaandkekeworld-design.md  # 设计文档
└── .superpowers/
    └── sdd/                          # 子代理驱动开发记录（多个 task-*.report.md）
```

---

## 4. 快速启动

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
# 浏览器访问 http://localhost:3000

# 生产构建
npm run build

# 预览构建产物
npm run preview
```

---

## 5. 架构与数据流

### 5.1 游戏主循环

```
requestAnimationFrame (Game._loop)
  │
  ├─ Controls.update(dt)             → 产出 { moveX, moveZ, jump } 输入向量
  ├─ 同步视角旋转 (Controls → Player)
  ├─ World.update(playerPos)          → 检查区块加载/卸载
  ├─ Player.update(dt, input, world)  → 应用移动 + 物理更新
  │     └─ Physics.update(dt)        → 重力 += -9.8*dt, 三轴依次移动+碰撞回退
  ├─ Interaction.update(camera, world, player) → 射线检测 + 放置/破坏处理
  ├─ 更新 Camera 位置 & 朝向
  ├─ renderer.render(scene, camera)
  └─ HUD.update(player)              → 高亮当前选中方块
```

### 5.2 核心模块职责

| 模块 | 职责 | 不负责 |
|---|---|---|
| **Game** | 启动、循环调度、子系统协调 | 任何具体游戏逻辑 |
| **World** | 区块字典 CRUD、位置到区块映射 | 网格生成细节 |
| **Chunk** | 存储 16×64×16 方块 ID，构建/重建合并 Mesh | 方块的视觉外观 |
| **BlockTypes** | 定义方块颜色、名称、纹理创建 | 场景中的实例 |
| **Player** | 位置、速度、碰撞箱、跳跃 | 渲染、输入原始数据 |
| **Controls** | 将鼠标/触控 → 视角方向 + 移动意图 | 物理、位置计算 |
| **Physics** | 重力积分、AABB vs 方块碰撞响应 | 玩家状态管理 |
| **Interaction** | Raycaster 命中检测、方块放置/破坏 | 区块网格重建（通知 World 触发） |
| **HUD** | 十字准星渲染、热栏方块指示 | 3D 场景渲染 |
| **TouchControls** | 虚拟摇杆 + 按钮 → Controls.setTouchInput | 视角控制本身 |

---

## 6. 模块详解

### 6.1 主入口 — [src/main.js](src/main.js)

```js
import { Game } from './core/Game.js';
const game = new Game();
game.start();
```

仅 3 行代码，创建 Game 实例并启动游戏循环。所有初始化在 Game 构造函数中完成。

---

### 6.2 游戏主循环 — [src/core/Game.js](src/core/Game.js)

**类：`Game`**

构造函数初始化以下内容：

- **Three.js 场景**：天空蓝背景 + 雾效 (Fog, 30~60)
- **透视相机**：75° FOV，0.1~200 裁剪平面
- **WebGL 渲染器**：抗锯齿，PCFSoft 阴影，像素比上限 2
- **光照**：方向光 (强度 1.2) + 环境光 (强度 0.5)
- **子系统**：World、Player、Controls、Interaction、HUD、TouchControls、Sky
- **窗口大小变化监听**（动态调整渲染距离）
- **页面可见性监听**（隐藏时暂停循环）

**主循环顺序：**

1. 计算 delta time（上限 0.05s 防卡顿）
2. `controls.update(dt)` → 获取输入
3. 消费 `consumeJustLocked()` 标记，清除锁定帧的点击
4. 同步 yaw/pitch (Controls → Player)
5. `world.update(player.position)` → 先加载区块，确保物理可用
6. `player.update(dt, input, world)` → 含物理
7. `interaction.update(camera, world, player)` → 放置/破坏
8. 更新相机位置到玩家眼睛高度
9. 应用视角旋转四元数
10. `renderer.render(scene, camera)`
11. `hud.update(player)` → 更新 HUD

---

### 6.3 世界管理器 — [src/core/World.js](src/core/World.js)

**类：`World`**

核心功能：
- 管理 `Map<string, Chunk>` 区块字典
- 根据玩家位置动态加载/卸载区块（圆形距离优化）
- 提供世界坐标 ↔ 方块数据读写

**关键方法：**

| 方法 | 说明 |
|---|---|
| `update(playerPos)` | 检查玩家所在区块坐标变化 → 加载新区块 / 卸载远距离区块 |
| `getBlock(wx, wy, wz)` | 世界坐标 → 方块类型 ID（越界返回 -1） |
| `setBlock(wx, wy, wz, type)` | 世界坐标设置方块 → 自动重建区块网格 |
| `rebuildChunk(cx, cz)` | 重建指定区块的合并网格 |
| `dispose()` | 释放所有区块资源 |

**结构放置**：首次加载完成后（`_placeStructures`）将 COZE 墙、爱心、主人娅文字写入相应区块并重建。

**区块加载逻辑：**
- 计算玩家所在区块坐标 (cx, cz)
- 遍历半径 rd 内的所有区块坐标（圆形裁剪）
- 未加载的 → 创建 Chunk → build() → load()
- 远离的 → unload() → dispose() → 从 Map 删除

---

### 6.4 区块系统 — [src/core/Chunk.js](src/core/Chunk.js)

**类：`Chunk`**

- 存储 16×64×16 方块数据（`Uint8Array`，扁平索引 `(x*64 + y)*16 + z`）
- 通过 TerrainGen 生成初始地形数据
- 构建合并网格（仅可见面，提高渲染性能）

**关键方法：**

| 方法 | 说明 |
|---|---|
| `getBlock(x, y, z)` | 局部坐标获取方块类型 |
| `setBlock(x, y, z, type)` | 局部坐标设置方块类型 |
| `isFaceVisible(x, y, z, face)` | 判断方块指定面是否可见（相邻为空气则可见） |
| `build(neighborChunks?)` | 构建区块合并网格（按类型-面方向分组） |
| `load()` | 将网格组加入 Three.js 场景 |
| `unload()` | 从场景移除网格组 |
| `dispose()` | 释放所有 GPU 资源 |

**网格构建（面剔除）：**
- 遍历所有方块，跳过 AIR
- 对每个实体方块的 6 个面，检测相邻方块
- 相邻为 AIR 或越界 → 生成该面的 2 个三角形（4 个顶点）
- 按 `{方块类型}-{面方向}`（如 `1-top`, `1-side`, `1-bottom`）分组
- 每组创建一个 BufferGeometry + MeshLambertMaterial
- 顶面使用 top 纹理，底面使用 bottom 纹理，侧面使用 side 纹理

**顶点辅助函数：**
- `getFaceVertices(x, y, z, face)` — 4 个顶点坐标
- `getFaceNormal(face)` — 法线方向
- `getFaceUV(face)` — UV 坐标

---

### 6.5 方块类型与纹理 — [src/blocks/BlockTypes.js](src/blocks/BlockTypes.js)

**枚举 `BlockType`：**

| ID | 常量 | 名称 | 颜色 | 用途 |
|---|---|---|---|---|
| 0 | AIR | 空气 | — | 无方块 |
| 1 | GRASS | 草地 | 顶 #4CAF50 / 侧 #8B5E3C / 底 #8B5E3C | 地表 |
| 2 | DIRT | 泥土 | #8B5E3C | 地表下 1-3 层 |
| 3 | STONE | 石头 | #808080 | 地下深部 / 基岩 |
| 4 | SAND | 沙地 | #F4E4A0 | 中心平台 |
| 5 | COZE_RED | COZE红 | #E53935 | 文字墙 / 爱心 |
| 6 | COZE_WHITE | 白墙 | #ECEFF1 | 未使用（保留） |
| 7 | PINK | 粉色 | #F06292 | "主人娅"文字 |

**纹理生成 `createBlockTexture(topColor, sideColor, bottomColor, topStripColor?)`：**

- 使用 Canvas API 创建 16×16 像素纹理
- 2×2 像素块模拟像素风格
- 绘制暗色网格线增加细节
- 草地特有：顶面额外绘制绿色顶部条
- 纹理过滤器设为 `NearestFilter` 保持像素感
- 缓存已生成的纹理（`textureCache` Map）

**导出函数：**
- `getBlockTextures(blockType)` → `{ top, side, bottom }` CanvasTexture
- `isBlockSolid(blockType)` → 是否实体（碰撞/遮挡）
- `getBlockName(blockType)` → 中文名称
- `getBlockProperties(blockType)` → `{ name, solid }`
- `getTexture(blockType)` → 别名，兼容旧接口

---

### 6.6 全局常量 — [src/utils/constants.js](src/utils/constants.js)

| 常量 | 值 | 说明 |
|---|---|---|
| `GRAVITY` | 9.8 | 重力加速度 (方块/秒²) |
| `PLAYER_SPEED` | 4.0 | 移动速度 (方块/秒) |
| `JUMP_SPEED` | 5.0 | 跳跃初速度 (方块/秒) |
| `REACH_DISTANCE` | 5 | 交互最大距离 (方块) |
| `PLAYER_WIDTH` | 0.6 | 玩家碰撞箱宽度 |
| `PLAYER_HEIGHT` | 1.8 | 玩家碰撞箱高度 |
| `PLAYER_DEPTH` | 0.6 | 玩家碰撞箱深度 |
| `EYE_HEIGHT` | 1.6 | 眼睛高度（相机偏移） |
| `CHUNK_SIZE` | 16 | 区块水平尺寸 |
| `CHUNK_HEIGHT` | 64 | 区块垂直高度 |
| `RENDER_DISTANCE_PC` | 6 | PC 端渲染距离 (区块) |
| `RENDER_DISTANCE_MOBILE` | 4 | 移动端渲染距离 (区块) |
| `MOUSE_SENSITIVITY` | 0.002 | 鼠标灵敏度 |
| `PLATFORM_RADIUS` | 10 | 中心沙质平台半径 |
| `PLATFORM_Y` | 5 | 中心平台 Y 高度 |
| `BLOCK_SIZE` | 1 | 方块尺寸 |
| `WORLD_BOUNDARY` | 48 | 世界边界半径 |
| `TEXTURE_SIZE` | 16 | 纹理像素大小 |

---

### 6.7 玩家系统 — [src/player/Player.js](src/player/Player.js)

**类：`Player`**

**属性：**
- `position` — 世界坐标（脚底位置，初始 `{x:0, y:7, z:0}`）
- `velocity` — 速度向量
- `grounded` — 是否在地面
- `yaw` / `pitch` — 视角方向（从 Controls 同步）
- `selectedBlockIndex` — 当前选中方块类型索引

**关键方法：**

| 方法 | 说明 |
|---|---|
| `update(dt, input, world)` | 计算移动方向（基于偏航角）→ 应用速度 → 跳跃 → Physics 更新 → 世界边界限制 |
| `getCameraPosition()` | 返回 `position + EYE_HEIGHT`（相机位置） |

**移动向量计算：**
```
forwardX = sin(yaw)
forwardZ = cos(yaw)
rightX   = cos(yaw)
rightZ   = -sin(yaw)

velocity.x = (rightX * moveX + forwardX * moveZ) * speed
velocity.z = (rightZ * moveX + forwardZ * moveZ) * speed
```

**世界边界：** 水平距离超过 `WORLD_BOUNDARY (48)` 时将位置投影回边界圆内。

---

### 6.8 视角控制 — [src/player/Controls.js](src/player/Controls.js)

**类：`Controls`**

**输入源：**
- PC：PointerLock API + 鼠标移动 + 键盘 (WASD/空格)
- 移动端：触摸拖动旋转视角 + 虚拟摇杆输入（由 TouchControls 调用 `setTouchInput`）

**关键特性：**

- **PointerLock**：点击 canvas 请求锁定，锁定后鼠标移动控制视角
- **首次锁定跳帧**：`_firstMoveAfterLock` 跳过锁定后的首个 mousemove（避免指针瞬移产生巨量 delta）
- **视角限制**：pitch 限制在 ±89°
- **键盘映射**：`w/a/s/d/space` → 方向 + 跳跃
- **输入归一化**：键盘 + 触控摇杆叠加后归一化到单位圆内
- **触控接口**：`setTouchInput(x, z)` 供 TouchControls 调用

**每帧输出：** `{ moveX: number, moveZ: number, jump: boolean }`

---

### 6.9 物理系统 — [src/physics/Physics.js](src/physics/Physics.js)

**类：`Physics`**（全部静态方法）

**核心算法：**

```
每帧更新:
  1. 速度 += 重力 * dt (velocity.y -= GRAVITY * dt)
  2. 限制最大下落速度 (≤ 30)
  3. 三轴依次移动 + 碰撞检测与回退:
     a. X 轴: 移动 → 检测碰撞 → 碰撞则回退并置 velocity.x = 0
     b. Y 轴: 移动 → 检测碰撞 → 
        - 下落碰撞: 置 grounded=true, snap 到方块表面
        - 上升碰撞: 回退并置 velocity.y = 0
     c. Z 轴: 同 X 轴逻辑
  4. Y < 0 的边界防护
```

**碰撞检测 `checkCollision(player, world)`：**

- 计算玩家 AABB（基于 position + PLAYER_WIDTH/HEIGHT/DEPTH）
- 遍历 AABB 覆盖的所有整数方块坐标
- 对每个实体方块检测 AABB 重叠
- 使用 `isBlockSolid()` 判断方块是否可碰撞

**跳跃：** `grounded && input.jump` → `velocity.y = JUMP_SPEED`

---

### 6.10 交互系统 — [src/interaction/Interaction.js](src/interaction/Interaction.js)

**类：`Interaction`**

**射线检测流程：**
1. `raycaster.setFromCamera({x:0, y:0}, camera)` — 从屏幕中心（准星）发射射线
2. 收集所有 chunk mesh → `intersectObjects()`
3. 命中时反推世界坐标：`floor(hitPoint - normal * 0.5)`
4. 返回 `{ position, normal, blockType }`

**交互逻辑：**
- **左键（button 0）**→ 破坏：`setBlock(pos, AIR)`，基岩 (Y=0) 不可破坏
- **右键（button 2）**→ 放置：在法线方向相邻位置放置，检查不与玩家碰撞箱重叠
- **数字键 1-7**：切换当前选中的方块类型
- **滚轮**：已绑定事件（preventDefault 处理）

**特殊处理：**
- `clearPendingClicks()` — 清除待处理的点击（指针锁定后跳帧用）
- `consumeBlockSelect()` — 消费待选择的方块索引

---

### 6.11 地形生成 — [src/worldgen/TerrainGen.js](src/worldgen/TerrainGen.js)

**噪声函数 `noise(x, z)`：**

多层正弦波叠加模拟自然地形起伏：
```js
n = sin(x*0.1 + 1.3) * cos(z*0.12 + 0.7) * 0.5
  + sin(x*0.05 + z*0.08 + 2.1) * 0.3
  + cos(x*0.2 + z*0.15) * 0.2
return (n + 1) / 2  // 归一化到 [0, 1]
```

**地形填充 `generateChunkTerrain(cx, cz)`：**

返回 `Uint8Array`（索引: `(x * 64 + y) * 16 + z`）

- 基岩 (Y=0) → STONE
- 中心沙质平台（`|x|≤10 && |z|≤10`）→ 表面 SAND，平台高度 Y=5
- 自然地形高度范围 4~12
- 地表 → GRASS，下 3 层 → DIRT，更深 → STONE
- 空气填充地表以上

---

### 6.12 COZE 文字墙 — [src/worldgen/COZEWall.js](src/worldgen/COZEWall.js)

**函数 `generateCOZEWall()`**

在沙质平台 Z 负方向边缘生成 "COZE" 四个字母的红色方块墙：

- 每个字母 5×7 方块矩阵
- 字母间距 2 方块
- 使用 `BlockType.COZE_RED`（#E53935）
- 位置：Z = -(PLATFORM_RADIUS + 2)，Y 从 PLATFORM_Y 开始
- 水平居中（基于总宽度计算 startX）

**字母矩阵：**

```
C:  █████    O:  █████    Z:  █████    E:  █████
    ██            ██   █        ██        ██
    ██            ██   █       ██         ██
    ██            ██   █      ██          █████
    ██            ██   █     ██           ██
    ██            ██   █    ██            ██
    █████        █████     █████          █████
```

---

### 6.13 爱心与主人娅 — [src/worldgen/Structures.js](src/worldgen/Structures.js)

**函数 `generateHeart()`**

生成 7×7 爱心图案，使用 `COZE_RED` 方块：
- 位置：中心 x=0, z=-7
- Y 高度 = PLATFORM_Y + 5（视线高度）

```
 █ █
█████
███████
███████
 █████
  ███
   █
```

**函数 `generateZhuRenYa()`**

生成 "主人娅" 三个汉字的粉色像素文字，每个字 5×7 矩阵：
- 使用 `PINK` 方块（#F06292）
- 字间距 2 方块
- 位置：z=-7，Y 从 PLATFORM_Y 开始
- 整体水平居中

**字素矩阵：**

```
"主":  █     "人":  █     "娅":  █ ███
      ███          █          █ █ █
     █████        █          ███ █
       █          ██         ██ █
       █          █          █ █ █
       █         █           █ █ █
       █                     █ ███
```

---

### 6.14 天空装饰 — [src/worldgen/Sky.js](src/worldgen/Sky.js)

**类：`Sky`**

**太阳：**
- 半径 3 的黄色球体 (`0xFFD54F`)
- 位置 (-30, 50, -40)
- 光晕：半径 4 的半透明黄色球体 (opacity 0.3)

**云朵：**
- 10 朵云分布在 y=22~35 范围
- 每朵云由 3-4 个白色半透明方块组成
- 随机偏移使云朵更自然

---

### 6.15 抬头显示 — [src/ui/HUD.js](src/ui/HUD.js)

**类：`HUD`**

- **十字准星**：CSS + SVG 绘制的白色十字线
- **方块热栏**：底部居中，显示所有可用方块
  - 7 个槽位，50×50px
  - 每个槽位用 Canvas 绘制方块颜色预览
  - 当前选中方块高亮边框 + 背景

**颜色映射：**

| 方块类型 | 颜色 |
|---|---|
| GRASS (1) | #4CAF50 |
| DIRT (2) | #8B5E3C |
| STONE (3) | #808080 |
| SAND (4) | #F4E4A0 |
| COZE_RED (5) | #E53935 |
| COZE_WHITE (6) | #ECEFF1 |
| PINK (7) | #F06292 |

---

### 6.16 触控控件 — [src/ui/TouchControls.js](src/ui/TouchControls.js)

**类：`TouchControls`**

仅在移动端激活（`window.innerWidth < 768 || 'ontouchstart' in window`）

**左侧虚拟摇杆：**
- 直径 130px 的圆形区域
- 内部 50px 的摇杆旋钮
- 拖动时计算偏移归一化到 [-1, 1]
- 通过 `controls.setTouchInput(nx, -ny)` 传递

**右侧动作按钮（三个圆形按钮）：**
- **跳跃**（↑）：按下设 `keys.space = true`，松开设 `false`
- **放置**（+）：触发 `mousedown button: 0` 事件
- **破坏**（-）：触发 `mousedown button: 2` 事件

---

## 7. 方块系统

### 7.1 方块类型表

| ID | 常量 | 中文名 | 顶面色 | 侧面色 | 底面色 | 特殊纹理 |
|---|---|---|---|---|---|---|
| 0 | AIR | 空气 | — | — | — | — |
| 1 | GRASS | 草地 | #4CAF50 | #8B5E3C | #8B5E3C | 顶面有绿色条 |
| 2 | DIRT | 泥土 | #8B5E3C | #8B5E3C | #8B5E3C | — |
| 3 | STONE | 石头 | #808080 | #808080 | #808080 | — |
| 4 | SAND | 沙地 | #F4E4A0 | #F4E4A0 | #F4E4A0 | — |
| 5 | COZE_RED | COZE红 | #E53935 | #E53935 | #E53935 | — |
| 6 | COZE_WHITE | 白墙 | #ECEFF1 | #ECEFF1 | #ECEFF1 | — |
| 7 | PINK | 粉色 | #F06292 | #F06292 | #F06292 | — |

### 7.2 纹理生成流程

1. 创建 16×16 Canvas
2. 填充底色
3. 绘制 2×2 像素网格（暗边线，透明度 0.15）
4. 草地额外绘制顶部 4px 绿色条
5. 转换为 `THREE.CanvasTexture`，设置 `NearestFilter`
6. 每次生成三面纹理（top/side/bottom），缓存复用

---

## 8. 世界生成

### 8.1 地形生成

- 多层正弦波叠加 → 高度图 (x, z) → height [4, 12]
- 地表层 → GRASS
- 地表下 3 层 → DIRT
- 更深 → STONE
- Y=0 → 基岩（STONE，不可破坏）

### 8.2 中心沙质平台

- 范围：|x| ≤ 10, |z| ≤ 10
- 高度：y = 5
- 表面：SAND

### 8.3 COZE 文字墙

- 位置：z = -(PLATFORM_RADIUS + 2) = -12
- 字母：C-O-Z-E，5×7 红色方块矩阵
- 水平居中，起始 Y = PLATFORM_Y = 5

### 8.4 爱心

- 位置：z = -7, x 居中
- Y 高度 = 10（视线高度）
- 7×7 经典爱心图案

### 8.5 "主人娅" 粉色文字

- 位置：z = -7, x 居中
- Y 从地面高度起
- 三个汉字各 5×7 粉色方块

---

## 9. 玩家与视角

### 9.1 第一人称参数

| 参数 | 值 |
|---|---|
| 碰撞箱 | 0.6 × 1.8 × 0.6 (宽×高×深) |
| 眼睛高度 | 1.6 |
| 移动速度 | 4.0 方块/秒 |
| 跳跃速度 | 5.0 方块/秒 |
| 重力 | 9.8 方块/秒² |
| 交互距离 | 5 方块 |
| 世界边界 | 半径 48 |

### 9.2 键盘绑定

| 按键 | 动作 |
|---|---|
| W / ↑ | 前进 |
| A / ← | 左移 |
| S / ↓ | 后退 |
| D / → | 右移 |
| 空格 | 跳跃 |
| 鼠标左键 | 放置方块 |
| 鼠标右键 | 破坏方块 |
| 1-7 | 选择方块类型 |

---

## 10. 物理系统详解

### 10.1 重力

```
velocity.y -= 9.8 * dt
velocity.y = max(velocity.y, -30)  // 终端速度限制
```

### 10.2 AABB 碰撞检测

分离轴定理简化版 — 对 X/Y/Z 三轴分别处理：

1. 沿一轴移动玩家位置
2. 计算玩家 AABB（Axis-Aligned Bounding Box）
3. 遍历 AABB 覆盖的所有整数方块坐标
4. 对每个实体方块，检测 AABB 是否重叠
5. 重叠 → 回退位置，置该轴速度为 0

Y 轴特殊处理：
- 下落碰撞 → `grounded = true`，snap 到方块顶部
- 上升碰撞 → 完全回退

### 10.3 跳跃

- 条件：`grounded === true` + 跳跃输入
- 效果：`velocity.y = 5.0`
- 空中不可再次跳跃

---

## 11. 区块系统与性能

### 11.1 区块规格

| 参数 | 值 |
|---|---|
| 水平尺寸 | 16 × 16 |
| 垂直高度 | 64 层 |
| 数据存储 | Uint8Array (16384 元素) |
| PC 渲染距离 | 6 区块半径 |
| 移动端渲染距离 | 4 区块半径 |

### 11.2 区块加载策略

- **圆形裁剪**：跳过对角线过远的区块（`dx² + dz² > rd²`）
- **卸载缓冲**：卸载距离比加载距离多 4 格缓冲（避免频繁加载/卸载）
- **懒加载**：仅当玩家移动到新的区块坐标时触发更新

### 11.3 面剔除

对每个实体方块的 6 个面，检查相邻方块：
- 相邻为 AIR 或超出区块边界 → 生成该面三角形
- 相邻为实体方块 → 跳过（被遮挡，无需渲染）

### 11.4 纹理分组

区块网格按 `{blockType}-{faceDir}` 分组构建：
- 同一类型 + 同方向的方块面合并为一个 Mesh（减少 draw call）
- 顶/底/侧面分别使用对应纹理

### 11.5 其他优化

- 渲染距离外区块自动卸载
- 页面不可见时暂停 RAF（Page Visibility API）
- 像素比上限 2
- 增量时间上限 0.05s（防止物理爆炸）
- 使用 `NearestFilter` 降低纹理采样开销

---

## 12. 交互系统

### 12.1 射线检测

从屏幕中心（十字准星位置）发射射线，检测所有区块网格 Mesh。

**世界坐标反推：**
```js
blockPos = floor(hitPoint - normal * 0.5)
```

### 12.2 方块放置

1. 在命中面的法线方向相邻位置放置
2. 检查新方块不与玩家碰撞箱重叠（防止卡在玩家体内）
3. 默认使用当前选中的方块类型

### 12.3 方块破坏

1. 命中方块 Y > 0（基岩不可破坏）
2. 设置为 AIR
3. 触发区块重建

---

## 13. 移动端适配

### 13.1 响应式断点

| 设备 | 判断条件 | 渲染距离 | 控制方式 |
|---|---|---|---|
| PC | width ≥ 768px + 无触屏 | 6 区块 | PointerLock + 鼠标键盘 |
| 手机 | width < 768px 或 有触屏 | 4 区块 | 触控摇杆 + 按钮 |

### 13.2 触控控件

- **虚拟摇杆**：左侧 130px 圆形区域，拖动控制移动方向
- **视角拖动**：在画布上单指拖动旋转视角
- **动作按钮**：右侧三个 60px 圆形按钮（跳跃/放置/破坏）

### 13.3 UI 适配

- 竖屏提示（`#rotate-hint`）— portrait 方向且宽度 ≤ 768px 时显示
- 加载遮罩（`#loading-screen`）— Game 初始化完成后隐藏
- 最大缩放限制（`maximum-scale=1.0, user-scalable=no`）

---

## 14. 开发计划与进度

项目按 13 个任务分步实现（见 [plans/2026-07-08-yayaandkekeworld-plan.md](plans/2026-07-08-yayaandkekeworld-plan.md)）：

| # | 任务 | 状态 |
|---|---|---|
| 1 | 项目脚手架 (Vite + Three.js) | ✅ 完成 |
| 2 | 常量定义 + 方块纹理系统 | ✅ 完成 |
| 3 | 地形生成器 | ✅ 完成 |
| 4 | 区块系统 (Chunk) | ✅ 完成 |
| 5 | 世界管理器 (World) | ✅ 完成 |
| 6 | COZE 文字墙 | ✅ 完成 |
| 7 | 物理系统 (AABB) | ✅ 完成 |
| 8 | 玩家 + 视角控制 | ✅ 完成 |
| 9 | 方块交互系统 | ✅ 完成 |
| 10 | 游戏主循环 Game + main.js 集成 | ✅ 完成 |
| 11 | HUD 界面 | ✅ 完成 |
| 12 | 移动端触控控件 | ✅ 完成 |
| 13 | 最终集成 + 响应式 + 性能优化 | ✅ 完成 |

---

## 15. 文件清单

### 项目配置文件

| 文件 | 大小 | 说明 |
|---|---|---|
| [index.html](index.html) | ~2.5KB | 入口 HTML，含加载遮罩、竖屏提示、内联样式 |
| [package.json](package.json) | ~0.3KB | npm 配置，依赖 three + vite |
| [package-lock.json](package-lock.json) | — | 依赖锁定文件 |
| [vite.config.js](vite.config.js) | ~0.2KB | Vite 构建配置 |
| [public/favicon.svg](public/favicon.svg) | ~0.2KB | 像素风图标 |

### 源代码 (.js)

| 文件 | 行数 | 说明 |
|---|---|---|
| [src/main.js](src/main.js) | 4 | 启动入口 |
| [src/core/Game.js](src/core/Game.js) | 131 | 游戏主循环 |
| [src/core/World.js](src/core/World.js) | 195 | 世界管理器 |
| [src/core/Chunk.js](src/core/Chunk.js) | 237 | 区块系统 |
| [src/blocks/BlockTypes.js](src/blocks/BlockTypes.js) | 193 | 方块类型与纹理 |
| [src/player/Player.js](src/player/Player.js) | 78 | 玩家状态 |
| [src/player/Controls.js](src/player/Controls.js) | 179 | 视角控制 |
| [src/physics/Physics.js](src/physics/Physics.js) | 101 | 物理系统 |
| [src/interaction/Interaction.js](src/interaction/Interaction.js) | 178 | 交互系统 |
| [src/worldgen/TerrainGen.js](src/worldgen/TerrainGen.js) | 70 | 地形生成 |
| [src/worldgen/COZEWall.js](src/worldgen/COZEWall.js) | 92 | COZE 文字墙 |
| [src/worldgen/Structures.js](src/worldgen/Structures.js) | 111 | 爱心 + 主人娅 |
| [src/worldgen/Sky.js](src/worldgen/Sky.js) | 82 | 天空装饰 |
| [src/ui/HUD.js](src/ui/HUD.js) | 101 | 抬头显示 |
| [src/ui/TouchControls.js](src/ui/TouchControls.js) | 171 | 触控控件 |
| [src/utils/constants.js](src/utils/constants.js) | 43 | 全局常量 |

### 文档

| 文件 | 说明 |
|---|---|
| [plans/2026-07-08-yayaandkekeworld-plan.md](plans/2026-07-08-yayaandkekeworld-plan.md) | 13 步实现计划 |
| [specs/2026-07-08-yayaandkekeworld-design.md](specs/2026-07-08-yayaandkekeworld-design.md) | 系统设计文档 |

---

## 附录

### A. 数据流时序图

```
帧 N:
  Game._loop()
    ├── controls.update(dt)               → 读取键盘/鼠标/触控
    ├── controls.consumeJustLocked()       → 清除锁定帧点击
    ├── player.yaw/pitch = controls.*      → 同步视角
    ├── world.update(player.position)      → 加载/卸载区块
    ├── player.update(dt, input, world)
    │     ├── 计算移动方向 (yaw + input)
    │     ├── 跳跃 (if grounded && jump)
    │     └── Physics.update(dt, player, world)
    │           ├── velocity.y -= GRAVITY * dt
    │           ├── 移动 X → 碰撞检测 → 回退
    │           ├── 移动 Y → 碰撞检测 → grounded/snap
    │           └── 移动 Z → 碰撞检测 → 回退
    ├── interaction.update(camera, world, player)
    │     ├── 方块选择切换 (数字键)
    │     ├── raycaster 射线检测
    │     ├── 左键 → setBlock(AIR)
    │     └── 右键 → setBlock(selected)
    ├── camera.position = player.getCameraPosition()
    ├── camera.quaternion = Euler(yaw, pitch)
    ├── renderer.render(scene, camera)
    └── hud.update(player)                → 高亮热栏
```

### B. 区块数据索引

Chunk 内部使用扁平化 `Uint8Array`，索引公式：

```js
index = (x * CHUNK_HEIGHT + y) * CHUNK_SIZE + z
// 即: (x * 64 + y) * 16 + z
```

其中 x, z 为局部坐标 (0~15)，y 为高度 (0~63)。

世界坐标到区块坐标转换：

```js
cx = Math.floor(worldX / CHUNK_SIZE)       // 区块 X 索引
cz = Math.floor(worldZ / CHUNK_SIZE)       // 区块 Z 索引
lx = ((worldX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE   // 局部 X
lz = ((worldZ % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE   // 局部 Z
```

---

> **献给 — 主人娅 ❤️**
>
> 文档生成日期：2026-07-09
