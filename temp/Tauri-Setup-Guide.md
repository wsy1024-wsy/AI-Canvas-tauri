# AI Canvas Tauri 桌面版安装部署指南

> 从双击 `rustup-init.exe` 开始，到成功跑起 Tauri 桌面应用的完整步骤。

---

## 前置说明

- 操作系统：Windows 10 / Windows 11
- 项目路径：`D:\work\AI-Canvas-tauri`
- Tauri 版本：v2
- 本指南假设你已经下载了 `rustup-init.exe`

---

## 第 1 步：安装 Visual C++ 编译工具

当你双击 `rustup-init.exe` 后，如果看到以下提示：

```text
Rust Visual C++ prerequisites
Rust requires a linker and Windows API libraries but they don't seem to be available.
```

说明电脑缺少 Rust 必需的 MSVC 构建工具。

### 操作

1. 在黑色命令窗口中输入 `1`，按回车：

```bash
1
```

2. Rustup 会自动下载 Visual Studio Community 安装器。
3. 下载完成后会弹出 Visual Studio 安装界面。
4. 在安装界面勾选：
   - **使用 C++ 的桌面开发**
5. 点击右下角 **安装**。
6. 等待安装完成（约 10~30 分钟，视网速而定）。
7. 安装完成后 **重启电脑**。

### 备选方案（不想装完整 Visual Studio）

如果希望安装体积更小的 Build Tools：

1. 访问：
   ```text
   https://visualstudio.microsoft.com/visual-cpp-build-tools/
   ```
2. 下载并运行 **Build Tools for Visual Studio**。
3. 同样勾选 **使用 C++ 的桌面开发**。
4. 安装完成后重启电脑。

---

## 第 2 步：配置 Rust 国内镜像源（中国大陆用户）

由于 Rust 官方服务器 `static.rust-lang.org` 在国内可能无法连接，建议先配置国内镜像源。

### PowerShell 环境

在 PowerShell 中执行：

```powershell
$env:RUSTUP_DIST_SERVER="https://mirrors.ustc.edu.cn/rust-static"
$env:RUSTUP_UPDATE_ROOT="https://mirrors.ustc.edu.cn/rust-static/rustup"
```

### CMD 环境

在命令提示符中执行：

```cmd
set RUSTUP_DIST_SERVER=https://mirrors.ustc.edu.cn/rust-static
set RUSTUP_UPDATE_ROOT=https://mirrors.ustc.edu.cn/rust-static/rustup
```

### 如果中科大镜像不可用，可换清华镜像

**PowerShell：**

```powershell
$env:RUSTUP_DIST_SERVER="https://mirrors.tuna.tsinghua.edu.cn/rustup"
$env:RUSTUP_UPDATE_ROOT="https://mirrors.tuna.tsinghua.edu.cn/rustup"
```

**CMD：**

```cmd
set RUSTUP_DIST_SERVER=https://mirrors.tuna.tsinghua.edu.cn/rustup
set RUSTUP_UPDATE_ROOT=https://mirrors.tuna.tsinghua.edu.cn/rustup
```

## 第 3 步：完成 Rust 安装

配置好镜像源后，再次双击运行 `rustup-init.exe`（如果在终端中设置了环境变量，请在同一个终端窗口中运行）。

1. 输入 `1`，按回车（选择默认安装）。
2. 等待 Rust 工具链下载并安装完成。
3. 安装完成后关闭窗口。

> 注意：如果之前已经运行过 rustup-init 并报网络错误，建议先关闭窗口，配置镜像源后重新运行。

---

## 第 3 步：验证 Rust 安装

打开终端（CMD 或 PowerShell），分别执行：

```bash
rustc --version
cargo --version
```

如果看到类似以下输出，说明安装成功：

```text
rustc 1.80.0 (051478957 2024-07-21)
cargo 1.80.0
```

如果提示找不到命令，请检查是否已重启电脑，或 Rust 是否已正确添加到系统环境变量。

---

## 第 4 步：配置 Cargo 国内镜像源（可选但推荐）

Tauri 编译时需要从 crates.io 下载大量 Rust 依赖。如果在中国大陆，建议配置 cargo 国内镜像，避免 `Updating crates.io index` 卡住。

### 完整处理流程（遇到网络错误时）

如果运行 `npm run tauri dev` 后出现类似以下错误：

```text
warning: spurious network error (3 tries remaining): transfer too slow: failed to transfer more than 10 bytes in 30s (transferred 0 bytes)
```

按下面步骤处理：

1. 按 `Ctrl + C` 停止当前进程。
2. 配置 cargo 国内镜像（见下方命令）。
3. 重新运行 `npm run tauri dev`。

### 自动配置（PowerShell）

在 PowerShell 中执行以下命令：

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.cargo"
@"
[source.crates-io]
replace-with = 'ustc'

[source.ustc]
registry = "sparse+https://mirrors.ustc.edu.cn/crates.io-index/"
"@ | Set-Content -Path "$env:USERPROFILE\.cargo\config.toml" -Encoding UTF8
```

配置完成后可以验证：

```powershell
Get-Content "$env:USERPROFILE\.cargo\config.toml"
```

### 自动配置（CMD）

在命令提示符中执行：

```cmd
mkdir "%USERPROFILE%\.cargo"
(
echo [source.crates-io]
echo replace-with = 'ustc'
echo.
echo [source.ustc]
echo registry = "sparse+https://mirrors.ustc.edu.cn/crates.io-index/"
) > "%USERPROFILE%\.cargo\config.toml"
```

### 手动配置

1. 创建目录：`C:\Users\<你的用户名>\.cargo`
2. 在该目录下新建文件 `config.toml`
3. 写入以下内容：

```toml
[source.crates-io]
replace-with = 'ustc'

[source.ustc]
registry = "sparse+https://mirrors.ustc.edu.cn/crates.io-index/"
```

### 备选：清华镜像

**PowerShell：**

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.cargo"
@"
[source.crates-io]
replace-with = 'tuna'

[source.tuna]
registry = "sparse+https://mirrors.tuna.tsinghua.edu.cn/crates.io-index/"
"@ | Set-Content -Path "$env:USERPROFILE\.cargo\config.toml" -Encoding UTF8
```

**CMD：**

```cmd
mkdir "%USERPROFILE%\.cargo"
(
echo [source.crates-io]
echo replace-with = 'tuna'
echo.
echo [source.tuna]
echo registry = "sparse+https://mirrors.tuna.tsinghua.edu.cn/crates.io-index/"
) > "%USERPROFILE%\.cargo\config.toml"
```

## 第 5 步：安装项目前端依赖

进入项目目录：

```bash
cd D:\work\AI-Canvas-tauri
```

安装 npm 依赖：

```bash
npm install
```

等待安装完成。这一步主要下载前端所需的 Node 模块。

---

## 第 5 步：启动 Tauri 桌面开发版

执行：

```bash
npm run tauri dev
```

### 首次启动说明

- 第一次启动会比较慢，因为 Tauri 需要编译 Rust 代码并下载 Rust 依赖。
- 编译时间取决于电脑性能，通常 5~15 分钟。
- 当看到类似以下输出时，表示启动成功：

```text
Finished dev [unoptimized + 1info] ...
Running ai-canvas-tauri.exe
```

- 稍后会自动弹出一个桌面应用窗口。

---

## 第 6 步：配置 ComfyUI 地址

桌面应用启动后：

1. 点击界面中的 **设置**。
2. 找到 **ComfyUI URL** 配置项。
3. 填入云端 ComfyUI 地址：

```text
https://u1127999-b68a-ce6d5874.bjb2.seetacloud.com:8443
```

4. 保存设置。
5. 返回主界面，尝试生成视频/图片。

---

## 常见问题排查

### 问题 1：提示缺少 WebView2

**表现**：Tauri 窗口无法弹出，或报错找不到 WebView2。

**解决**：访问以下地址下载安装：

```text
https://developer.microsoft.com/en-us/microsoft-edge/webview2/
```

Windows 11 通常自带 WebView2，一般不需要额外安装。

---

### 问题 2：端口 1420 被占用

**表现**：启动时报错 `Port 1420 is already in use`。

**解决**：

1. 查找占用 1420 端口的进程：

```bash
netstat -ano | findstr :1420
```

2. 记下最后一列的 PID，执行：

```bash
taskkill /PID <PID> /F
```

3. 重新运行 `npm run tauri dev`。

---

### 问题 3：PowerShell 无法运行 npm

**表现**：执行 `npm run dev` 时报错：

```text
无法加载文件 D:\node\npm.ps1，因为在此系统上禁止运行脚本。
```

**解决**（二选一）：

**方案 A**：修改 PowerShell 执行策略

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**方案 B**：使用 CMD 运行

```bash
cmd
npm run tauri dev
```

---

### 问题 4：Rust 编译卡住或特别慢

**表现**：`cargo build` 长时间没有进度。

**解决**：

1. 检查网络连接，Rust 依赖需要从 crates.io 下载。
2. 可以尝试切换为国内镜像源，编辑 `C:\Users\<你的用户名>\.cargo\config.toml`：

```toml
[source.crates-io]
replace-with = 'ustc'

[source.ustc]
registry = "sparse+https://mirrors.ustc.edu.cn/crates.io-index/"
```

3. 删除旧的编译缓存后重新启动：

```bash
cd D:\work\AI-Canvas-tauri\src-tauri
cargo clean
cd D:\work\AI-Canvas-tauri
npm run tauri dev
```

---

### 问题 5：前端类型检查报错（onNodeDrag 事件类型不兼容）

**表现**：执行 `npm run tauri build` 后，在 `beforeBuildCommand 'npm run build'` 阶段报错，错误集中在 `src/components/Canvas.tsx` 的 `onNodeDragStart` / `onNodeDrag` / `onNodeDragStop`：

```text
error TS2322: Type '(evt: React.MouseEvent, node: RFNode<BaseNodeData>) => void'
is not assignable to type 'OnNodeDrag<Node<BaseNodeData>>'.
```

**原因**：`@xyflow/react`（React Flow 12）的 `OnNodeDrag` 类型要求事件参数是原生 DOM 事件 `MouseEvent | TouchEvent`，但项目代码里写成了 `React.MouseEvent`，TypeScript 严格模式下类型不兼容。

**解决**：把三个拖拽处理函数的参数类型改为 `MouseEvent | TouchEvent`，并对 `clientX/clientY` 做鼠标/触摸兼容读取。

修改 `src/hooks/useNodeSnap.ts`：

```ts
const onNodeDragStart = useCallback(
  (_evt: MouseEvent | TouchEvent, node: Node<BaseNodeData>) => {
    // ...
  },
  [buildCandidates]
);
```

修改 `src/components/Canvas.tsx`，新增辅助函数并替换三个 handler：

```ts
// 兼容 React Flow 的 OnNodeDrag 事件类型（MouseEvent | TouchEvent）
const getPointerPosition = (event: MouseEvent | TouchEvent) => {
  if (event instanceof TouchEvent && event.touches.length > 0) {
    return { clientX: event.touches[0].clientX, clientY: event.touches[0].clientY };
  }
  return { clientX: (event as MouseEvent).clientX, clientY: (event as MouseEvent).clientY };
};

const handleNodeDragStart = useCallback(
  (evt: MouseEvent | TouchEvent, node: RFNode<BaseNodeData>) => {
    // ...
  },
  [commitToHistory, duplicateNode, onNodeDragStart, setCanvasInteraction]
);

const handleNodeDrag = useCallback(
  (e: MouseEvent | TouchEvent, node: RFNode) => {
    const { clientX, clientY } = getPointerPosition(e);
    // ...
  },
  [findStoryboardDropHit, clearSbDropTarget, clearGhostNodeHidden, findShotlistDropHit, clearShotlistDropTarget]
);

const handleNodeDragStop = useCallback(
  (event: MouseEvent | TouchEvent, node: RFNode) => {
    const { clientX, clientY } = getPointerPosition(event);
    // ...
  },
  [onNodeDragStop, settleNodeGroupingOnDragStop, findStoryboardDropHit, clearSbDropTarget, clearGhostNodeHidden, setCanvasInteraction, findShotlistDropHit, clearShotlistDropTarget]
);
```

改完后先验证前端构建：

```bash
npm run build
```

通过后再重新执行：

```bash
npm run tauri build
```

---

### 问题 6：打包 msi 时 WiX 下载超时（`timeout: global`）

**表现**：Rust 编译完成后，Tauri 尝试下载 WiX 工具集时失败：

```text
Downloading https://github.com/wixtoolset/wix3/releases/download/wix3141rtm/wix314-binaries.zip
failed to bundle project `timeout: global`
Error failed to bundle project `timeout: global`
```

**原因**：Windows `.msi` 安装包依赖 **WiX Toolset v3**，Tauri 默认从 GitHub 下载。国内访问 GitHub 容易超时。

**解决（推荐手动放置 WiX 缓存）**：

1. 手动下载 WiX 二进制包：

   ```text
   https://github.com/wixtoolset/wix3/releases/download/wix3141rtm/wix314-binaries.zip
   ```
   如果直接下载慢，可用 GitHub 代理：
   - `https://gh-proxy.com/https://github.com/wixtoolset/wix3/releases/download/wix3141rtm/wix314-binaries.zip`
   - `https://mirror.ghproxy.com/https://github.com/wixtoolset/wix3/releases/download/wix3141rtm/wix314-binaries.zip`

2. 解压到 Tauri 的 WiX 缓存目录：

   ```text
   C:\Users\<你的用户名>\AppData\Local\tauri\wix314-binaries
   ```
   确保目录下包含 `candle.exe`、`light.exe` 等文件。

3. 重新执行打包：

   ```bash
   npm run tauri build
   ```

**替代方案**：

- 开启代理后打包：

  ```powershell
  $env:HTTP_PROXY="http://127.0.0.1:7890"
  $env:HTTPS_PROXY="http://127.0.0.1:7890"
  npm run tauri build
  ```

- 如果只需要可执行文件、不需要安装包：

  ```bash
  cd src-tauri
  cargo build --release
  ```
  产物在 `src-tauri\target\release\ai-canvas-tauri.exe`。

---

## 后续操作

### 构建生产版

如果需要打包成可安装的 `.exe`：

```bash
npm run tauri build
```

构建结果通常在：

```text
src-tauri\target\release\bundle
```

---

### 常用命令速查

| 命令 | 说明 |
|-----|------|
| `npm run dev` | 浏览器开发模式 |
| `npm run tauri dev` | Tauri 桌面开发模式 |
| `npm run tauri build` | 打包桌面应用 |
| `npm run lint` | 运行 ESLint 检查 |
| `npm run typecheck` | 运行 TypeScript 类型检查 |

---

## 总结流程图

```
安装 rustup-init.exe
    ↓
安装 Visual C++ 桌面开发工具
    ↓
重启电脑
    ↓
再次运行 rustup-init.exe 完成 Rust 安装
    ↓
验证 rustc --version / cargo --version
    ↓
cd D:\work\AI-Canvas-tauri
    ↓
npm install
    ↓
npm run tauri dev
    ↓
等待编译，弹出桌面窗口
    ↓
设置 ComfyUI URL
    ↓
开始生成内容
```
