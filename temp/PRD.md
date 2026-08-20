# AI Canvas 产品需求文档（PRD）

## 目录

1. [产品概述](#1-产品概述)
2. [目标用户](#2-目标用户)
3. [核心功能模块](#3-核心功能模块)
4. [用户界面结构](#4-用户界面结构)
5. [关键用户流程](#5-关键用户流程)
6. [技术架构](#6-技术架构)
7. [开发环境](#7-开发环境)
8. [配置说明](#8-配置说明)
9. [开发规范](#9-开发规范)
10. [路线图](#10-路线图)
11. [风险与依赖](#11-风险与依赖)
12. [附录](#12-附录)

---

## 1. 产品概述

### 1.1 产品名称

AI Canvas

### 1.2 产品定位

AI Canvas 是一款面向 AI 内容创作的可视化工作流编辑器，基于节点化（Node-based）交互方式，让用户通过拖拽、连接节点来构建复杂的 AI 生成 pipeline。产品支持文生图、文生视频、图生视频等多种 AI 创作场景，并深度集成 ComfyUI 作为底层执行引擎。

### 1.3 产品形态

| 形态 | 说明 | 适用场景 |
| --- | --- | --- |
| 桌面应用 | 基于 Tauri v2 构建的跨平台桌面客户端（Windows / macOS / Linux） | 生产使用，调用原生能力 |
| Web 应用 | 基于 Vite + React 的浏览器版本 | 开发调试、轻量使用 |

### 1.4 核心能力

- 可视化节点编辑
- ComfyUI 工作流执行
- AI 对话助手
- 媒体资产管理

---

## 2. 目标用户

| 用户类型 | 特征 | 核心诉求 |
| --- | --- | --- |
| AI 创作者 | 使用 Midjourney / Stable Diffusion / ComfyUI 生成图片/视频 | 降低 ComfyUI 使用门槛，快速搭建工作流 |
| 设计师 | 需要将 AI 生成内容融入设计流程 | 可视化管理生成参数和结果 |
| 开发者 | 熟悉 ComfyUI 和工作流 JSON | 希望有一个更易用的前端界面 |
| 团队协作 | 多人共享工作流和生成结果 | 项目化管理、资产复用 |

---

## 3. 核心功能模块

### 3.1 节点画布（Canvas）

- 基于 React Flow 的无限画布
- 支持节点的拖拽、缩放、多选、对齐
- 节点连线和端口验证
- 撤销/重做（Undo/Redo）
- 画布背景主题切换

### 3.2 节点系统

- **基础节点**：文本输入、图片输入、模型选择、参数调节
- **ComfyUI 节点**：自动同步 ComfyUI `/object_info` 接口的节点定义
- **自定义节点**：支持用户导入自定义 ComfyUI 工作流 JSON
- **AI Agent 节点**：支持大模型驱动的智能工作流构建

### 3.3 ComfyUI 集成

- 连接本地或云端 ComfyUI 服务
- 工作流提交、队列管理、进度轮询
- 生成结果自动拉取和展示
- 支持视频、图片等多种输出格式

### 3.4 AI 助手

- 内置多模型对话能力（OpenAI / Claude / 自定义接口）
- 通过自然语言生成或修改工作流
- AI 工具调用（Tool Use）扩展

### 3.5 媒体资产管理

- 生成结果自动归档
- 图片/视频预览
- 资产导入导出
- 按项目组织媒体文件

### 3.6 项目管理

- 多项目切换
- 项目设置（默认模型、输出目录等）
- 工作流历史版本
- 项目导入导出

---

## 4. 用户界面结构

### 4.1 主界面布局

```text
┌─────────────────────────────────────────────────────────────┐
│  顶部工具栏（项目切换、运行、设置、AI 助手）                    │
├──────────┬──────────────────────────────────────┬───────────┤
│          │                                      │           │
│  左侧    │           中央画布                    │  右侧     │
│  工具栏  │        （节点编辑区域）                │  属性面板  │
│          │                                      │           │
├──────────┴──────────────────────────────────────┴───────────┤
│  底部状态栏（连接状态、任务队列、缩放控制）                     │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 左侧面板

- 节点库
- 媒体资产
- 模型管理
- 工作流模板

### 4.3 右侧面板

- 节点属性
- 项目设置
- AI 助手聊天

---

## 5. 关键用户流程

### 5.1 创建并运行文生视频

1. 用户打开 AI Canvas
2. 从模板库选择 "MiniMax H3 文生视频" 模板
3. 在文本节点输入提示词
4. 调整分辨率、时长、模型参数
5. 点击运行按钮
6. 系统提交工作流到 ComfyUI
7. 轮询任务进度并展示
8. 生成完成后在媒体资产中展示视频

### 5.2 通过 AI 助手生成工作流

1. 用户描述需求："生成一个小鸡吃米的动画"
2. AI 助手解析意图
3. 自动生成或推荐合适的工作流模板
4. 用户确认后填充到画布
5. 用户点击运行

---

## 6. 技术架构

### 6.1 前端技术栈

| 技术 | 版本/说明 |
| --- | --- |
| 框架 | React 19 |
| 构建工具 | Vite 8 |
| 状态管理 | Zustand 5 |
| 节点编辑 | @xyflow/react 12 |
| 样式 | Tailwind CSS 3 |
| 动画 | Framer Motion / GSAP |

### 6.2 桌面端技术栈

| 技术 | 说明 |
| --- | --- |
| 框架 | Tauri v2 |
| 后端语言 | Rust |
| 原生能力 | 文件系统访问、系统对话框、全局快捷键、自动更新 |

### 6.3 AI 集成

- **协议**：OpenAI Compatible API
- **多厂商支持**：OpenAI、Anthropic、Google、xAI、自定义 OpenAI 接口
- **MCP**：Model Context Protocol 支持

### 6.4 部署模式

| 模式 | 说明 | 适用场景 |
| --- | --- | --- |
| Web Dev | 浏览器开发模式，通过 Vite 代理访问 ComfyUI | 本地开发调试 |
| Tauri Dev | 桌面开发模式 | 原生能力调试 |
| Tauri Build | 打包桌面应用 | 生产发布 |

---

## 7. 开发环境

### 7.1 前置依赖

- Node.js（建议 LTS 版本）
- Rust + Cargo
- npm 或 pnpm

### 7.2 安装依赖

```powershell
cd D:\vscode\work\AI-Canvas-tauri-master
npm install
```

### 7.3 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 浏览器开发模式 |
| `npm run tauri dev` | Tauri 桌面开发模式 |
| `npm run tauri build` | 构建桌面应用 |
| `npm run check` | 代码类型检查和 lint |

### 7.4 目录结构

| 路径 | 说明 |
| --- | --- |
| `vite.config.ts` | Vite 代理配置 |
| `src-tauri/` | Tauri Rust 源码 |
| `src/services/comfyPolling.ts` | ComfyUI HTTP 通道与轮询 |
| `src/store/store.config.ts` | 应用配置状态 |

### 7.5 常见问题与排查

#### 问题 1：PowerShell 无法运行 npm 脚本

**现象**：

```text
npm : 无法加载文件 D:\node\npm.ps1，因为在此系统上禁止运行脚本。
CategoryInfo : SecurityError: (:) [], PSSecurityException
FullyQualifiedErrorId : UnauthorizedAccess
```

**原因**：PowerShell 默认执行策略禁止运行 `.ps1` 脚本。

**解决**：以管理员身份运行 PowerShell，执行：

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

输入 `Y` 确认即可。该配置一次设置，后续永久生效。

---

#### 问题 2：启动时提示端口 1420 被占用

**现象**：

```text
Error: Port 1420 is already in use
```

**原因**：之前启动的 `npm run dev` 或 `npm run tauri dev` 进程未退出，或其他程序占用了 1420 端口。

**解决**：查找并结束占用进程：

```powershell
netstat -ano | findstr :1420
```

记录最后一列的 PID，然后：

```powershell
taskkill /PID <PID> /F
```

之后重新执行 `npm run tauri dev`。

---

#### 问题 3：npm 提示找不到 `package.json`

**现象**：

```text
npm ERR! code ENOENT
npm ERR! path C:\WINDOWS\system32\package.json
npm ERR! enoent Could not read package.json
```

**原因**：当前目录不在项目根目录下，npm 找不到 `package.json`。

**解决**：先 `cd` 到项目目录，再执行 npm 命令：

```powershell
cd D:\vscode\work\AI-Canvas-tauri-master
npm run tauri dev
```

---

## 8. 配置说明

### 8.1 ComfyUI 连接配置

- **浏览器开发模式**：通过 Vite 代理 `/api/comfyui` 转发到 ComfyUI 服务
- **Tauri 桌面模式**：通过 Rust 原生 HTTP 代理访问 ComfyUI
- **默认地址**：可在设置中配置本地或云端 ComfyUI URL

### 8.2 AI 模型配置

- 支持配置多个 AI 提供商
- API Key 通过 Tauri 安全存储或浏览器凭证管理
- 支持自定义 OpenAI 兼容接口

---

## 9. 开发规范

### 9.1 代码规范

- TypeScript 严格模式
- ESLint + React Hooks 规则
- 单元测试使用 Vitest

### 9.2 提交规范

- 使用 setup-hooks 自动配置 Git Hooks
- 提交前自动运行类型检查和 lint

---

## 10. 路线图

### Phase 1：基础功能（已完成）

- [x] 节点画布基础编辑
- [x] ComfyUI 工作流执行
- [x] 媒体资产管理
- [x] Tauri 桌面应用框架

### Phase 2：AI 助手增强

- [ ] 自然语言生成工作流
- [ ] AI 节点推荐
- [ ] 工作流错误自动修复

### Phase 3：协作与生态

- [ ] 云端工作流市场
- [ ] 团队项目共享
- [ ] 工作流版本管理

---

## 11. 风险与依赖

### 11.1 外部依赖

- ComfyUI 服务可用性
- 云端 GPU 实例稳定性
- 第三方 AI API 配额和价格

### 11.2 技术风险

- Tauri v2 跨平台兼容性
- 大文件上传性能
- Rust 与前端状态同步复杂度

---

## 12. 附录

### 12.1 相关文件

- `vite.config.ts`：Vite 代理配置
- `src-tauri/`：Tauri Rust 源码
- `src/services/comfyPolling.ts`：ComfyUI HTTP 通道与轮询
- `src/store/store.config.ts`：应用配置状态

### 12.2 参考链接

- [Tauri 官方文档](https://tauri.app/)
- [Vite 官方文档](https://vitejs.dev/)
- [ComfyUI 官方文档](https://github.com/comfyanonymous/ComfyUI)
