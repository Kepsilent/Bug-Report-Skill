# INSTALL.md — AI Agent 自动安装指令

> 给 **所有 AI Agent** 看的：当用户提供 GitHub 链接 `https://github.com/Kepsilent/Bug-Report-Skill` 并要求安装时，按以下流程自动执行。
> 本文件与 [`AGENTS.md`](AGENTS.md) 配合使用 — AGENTS.md 引导 Agent 来到这里，INSTALL.md 提供具体步骤。

**用户操作流程：**
1. 用户把 GitHub 链接发给 AI Agent（Claude Code / Reasonix / Cursor / Gemini CLI / Codex / Copilot … 任意）
2. 用户说"帮我安装这个 BugReport 到我的项目"
3. AI Agent 读取此 INSTALL.md，按下面步骤执行

---

## Step -1: 检测旧版并清理（⭐ 必须先执行）

**重装场景**：用户可能之前装过旧版 BugReport。必须先清理旧文件，否则新旧文件混在一起会导致：
- 旧版 UMD wrapper 与新版冲突 → 白屏
- 旧版 `log-viewer.vue` 残留 → 路径 404
- 旧版 `pages.json` 中路径与新文件名不匹配
- import 路径指向旧文件但旧文件已改名

### -1.1 扫描旧版痕迹（按平台）

**uni-app / HBuilderX 项目：**
```bash
# 搜索旧版文件
find . -type f \( -name "bug-report.js" -o -name "bug-report-app.js" -o -name "error-logger.js" -o -name "debug-log.vue" -o -name "log-viewer.vue" -o -name "log-viewer-common.vue" \) 2>/dev/null
# 搜索旧版 import/reference
grep -r "bug-report\|error-logger\|errorLogger\|bugReport\|log-viewer\|debug-log" --include="*.js" --include="*.vue" --include="*.json" --include="*.ts" . 2>/dev/null | grep -v node_modules | grep -v ".git/"
```

如果命中任何结果 → 跳到 Step -1.3 执行清理。

**Android Studio 项目：**
```bash
# 搜索旧版 module
grep -r "bugreport\|bug-report" --include="*.kts" --include="*.xml" . 2>/dev/null | grep -v ".gradle/" | grep -v "build/"
find . -type d -name "bugreport" 2>/dev/null
```

如果 `settings.gradle.kts` 中有 `include(":bugreport")` 或存在 `bugreport/` 目录 → 跳到 Step -1.3 执行清理。

**微信小程序项目：**
```bash
find . -type f \( -name "bug-report.js" -o -name "debug-log.vue" \) 2>/dev/null
grep -r "bug-report\|BR\." --include="*.js" --include="*.json" . 2>/dev/null
```

**React Native / Web 项目：**
```bash
grep -r "bug-report\|BugReport" --include="*.js" --include="*.ts" --include="*.tsx" --include="*.json" . 2>/dev/null | grep -v node_modules
find . -type f -name "bug-report.js" 2>/dev/null | grep -v node_modules
```

### -1.2 判断是否需要清理
- 找到任何旧版文件 → ✅ 需要清理，进 Step -1.3
- 找到了 import/reference 但文件已不存在 → ✅ 需要清理残留引用
- 什么都没找到 → ✅ 全新安装，跳过清理，直接进 Step 0

### -1.3 执行清理（逐平台）

**uni-app 清理清单：**
```bash
# 1. 删除旧库文件（不管叫什么名字）
rm -f src/utils/bug-report.js
rm -f src/utils/bug-report-app.js
rm -f src/utils/error-logger.js
rm -f utils/bug-report.js

# 2. 删除旧 log-viewer 页面（各种可能的路径和名字）
rm -f src/pages/debug-log.vue
rm -f src/pages/debug-log/debug-log.vue
rm -f src/pages/log-viewer.vue
rm -f src/components/LogViewer.vue
rm -f pages/debug-log/debug-log.vue

# 3. 清理 App.vue 中的旧 import（用户项目根目录的 App.vue）
#    删除任何包含 bug-report / error-logger 的 import 行
#    删除任何旧版 BR.init() / ErrorLogger.init() 调用

# 4. 清理 pages.json 中的旧路由
#    删除 pages 数组中 path 包含 "debug-log" 或 "log-viewer" 的条目

# 5. 清理 uni-app 条件编译残留（如果有）
rm -f src/utils/bug-report-app.vue
```

**Android 清理清单：**
```bash
# 1. 从 settings.gradle.kts 中删除 include(":bugreport") 行
# 2. 从 app/build.gradle.kts 中删除 implementation(project(":bugreport")) 行
# 3. 删除 bugreport/ 目录
rm -rf bugreport/

# 4. 从 AndroidManifest.xml 中删除旧 LogViewerActivity 注册
```

**微信小程序清理清单：**
```bash
rm -f utils/bug-report.js
rm -f pages/debug-log/debug-log.vue
# 清理 app.js 中的旧 import
# 清理 app.json 中的旧页面路由
```

**React Native / Web 清理清单：**
```bash
rm -f src/utils/bug-report.js
rm -f src/bug-report.js
# 清理 App.tsx / App.jsx 中的旧 import
```

### -1.4 告知用户
清理完成后，告诉用户：
> 检测到旧版 BugReport，已清理：
> - 删除文件: xxx, xxx
> - 清理引用: App.vue 中的旧 import、pages.json 中的旧路由
> 现在开始安装 v2.1 新版...

如果未检测到旧版，直接进入 Step 0，不废话。

---

## Step 0: 检测项目类型 + 模块系统

先检查用户项目根目录的标识文件：

| 标识文件 | 项目类型 | 模块系统 | 跳转到 |
|---------|---------|---------|--------|
| `manifest.json` + `pages.json` + `vite.config.*` | uni-app (HBuilderX) | **Vite/ESM** → 用 `index.mjs` | Step 1 |
| `manifest.json` + `pages.json`（无 vite.config） | uni-app (旧版) | CommonJS → 用 `index.js` | Step 1 |
| `build.gradle.kts` + `AndroidManifest.xml` | Android Studio | Gradle | Step 2 |
| `app.json` + `project.config.json`（无 manifest.json） | 微信小程序（纯） | CommonJS | Step 3 |
| `package.json` 含 `react-native` | React Native | Metro | Step 4 |
| `package.json` 含 `webpack` 或 `vite` | Web/JS (bundler) | **ESM** → 用 `index.mjs` | Step 5 |
| `package.json` 或 `index.html`（不匹配以上） | 普通 JS/Web | 传统 → 用 `index.js` | Step 5 |
| 无法识别 | — | 问用户 | — |

> **关键**: Vite/Webpack 项目**必须用 `index.mjs`**，否则 `import` 会失败。非 bundler 项目用 `index.js`。 |

---

## Step 1: uni-app (HBuilderX)

### 1.0 扫描已有日志系统（迁移场景）
在复制文件之前，先搜索项目中是否已有旧版 logger：
```bash
# 搜索常见的旧 logger 文件名
grep -r "error-logger\|bug-report\|errorLogger\|bugReport" --include="*.js" --include="*.vue" --include="*.json" 用户项目/src/ 2>/dev/null
```
如果找到旧版（如 `error-logger.js`）：
- 检查 `App.vue` 和 `pages.json` 中旧 logger 的引用
- 安装完成后，把旧的 import 替换为新版，避免两个日志系统并存导致的白屏/冲突
- 告诉用户："发现旧版 logger，已替换为 BugReport v2.1"

### 1.1 复制文件
根据 Step 0 的模块系统检测结果：

```bash
# Vite/Webpack 项目 → 用 index.mjs
cp index.mjs 用户项目/src/utils/bug-report.js

# 非 bundler 项目 → 用 index.js
cp index.js 用户项目/src/utils/bug-report.js

# 复制 uni-app 通用日志查看器
cp log-viewer-common.vue 用户项目/src/pages/debug-log.vue

# 复制 AI 诊断规范（Reasonix/Cursor 等 skill 需要读取）
cp SKILL.md 用户项目/
```

### 1.2 修改 App.vue — 添加初始化
在 `<script>` 顶部添加 import：
```js
import BR from '@/utils/bug-report.js'
```

在 `onLaunch()` 或 `mounted()` 第一个可执行位置添加（**务必外套 try/catch**，避免 init 失败导致整个 App 白屏）：
```js
try {
  BR.init({
    appName: '替换为App名称',
    appVersion: '1.0.0',
    captureNetwork: true  // 自动拦截网络请求
  })
} catch (e) {
  console.warn('[BugReport] init failed:', e.message || e)
}
```

### 1.3 修改 pages.json — 注册 log-viewer 页面
在 `pages` 数组中添加：
```json
{
  "path": "pages/debug-log",
  "style": { "navigationBarTitleText": "BugReport" }
}
```

### 1.4 验证
编译运行后检查：
- 控制台出现 `BugReport v2.1 initialized`
- 打开 `/pages/debug-log` 看到暗色终端风格日志面板
- 发起网络请求后，面板 NETWORK tab 有自动日志

---

## Step 2: Android Studio (Kotlin)

### 2.1 复制 SDK
```bash
# 将 android/ 目录复制到用户项目根目录
cp -r android/ 用户项目/bugreport/
# 复制 AI 诊断规范
cp SKILL.md 用户项目/
```

### 2.2 修改 settings.gradle.kts
添加 module：
```kotlin
include(":bugreport")
```

### 2.3 修改 app/build.gradle.kts
添加依赖：
```kotlin
implementation(project(":bugreport"))
```

### 2.4 修改 Application.onCreate()
找到用户项目的 `Application` 子类（如 `MyApp.kt`），在 `onCreate()` 中添加：
```kotlin
BugReport.init(this) { cfg ->
    cfg.appName = "替换为App名称"
    cfg.appVersion = "1.0.0"
}
```

### 2.5 注册 LogViewerActivity
在 `AndroidManifest.xml` 中添加：
```xml
<activity android:name="com.bugreport.viewer.LogViewerActivity"
    android:theme="@style/Theme.AppCompat.NoActionBar" />
```

### 2.6 验证
- `adb logcat -s BugReport` 看到日志输出
- 编译运行，触发 Error 后打开 LogViewerActivity 看到日志列表

---

## Step 3: 微信小程序（纯）

### 3.1 复制文件
```bash
cp index.js 用户项目/utils/bug-report.js
cp log-viewer-common.vue 用户项目/pages/debug-log/debug-log.vue
cp SKILL.md 用户项目/
```

### 3.2 修改 app.js
在顶部添加：
```js
const BR = require('./utils/bug-report.js')
```

在 `onLaunch()` 中添加：
```js
BR.init({ appName: '替换为App名称', appVersion: '1.0.0' })
```

### 3.3 修改 app.json
在 `pages` 数组中添加：
```
"pages/debug-log/debug-log"
```

### 3.4 网络接入（重要！）
微信小程序的 `wx.request` 不能被自动拦截。需要手动用 `BR.wx.req()` 替代：
```js
// 替换前
wx.request({ url: '...', success: fn })
// 替换后
BR.wx.req({ url: '...', success: fn })
```

### 3.5 验证
- 控制台出现 `BugReport v2.1 initialized`
- debug-log 页面正常显示日志

---

## Step 4: React Native

### 4.1 复制文件
```bash
cp index.js 用户项目/src/utils/bug-report.js
cp SKILL.md 用户项目/
```

### 4.2 修改 App.tsx
在顶部导入并初始化：
```ts
import { BugReport } from './src/utils/bug-report'
// 在 App 组件挂载时
useEffect(() => {
  BugReport.init({ appName: '替换', appVersion: '1.0.0' })
}, [])
```

### 4.3 网络
RN 的 fetch 在 WebView 内可被自动 patch。如需原生网络拦截，考虑使用 RN 桥接或手动调用 `BR.net.req()`。

### 4.4 验证
控制台出现 `BugReport v2.1 initialized`。

---

## Step 5: 普通 JS/Web

### 5.1 方式 A：npm（推荐）
```bash
npm install bugreport
```
```js
import BR from 'bugreport'
BR.init({ appName: 'MyApp' })
```

### 5.2 方式 B：直接复制
```bash
cp index.js 用户项目/src/bug-report.js
cp log-viewer.vue 用户项目/src/components/LogViewer.vue
```
```html
<script src="src/bug-report.js"></script>
<script>BugReport.init({ appName: 'MyApp' })</script>
```

### 5.3 验证
浏览器控制台出现 `BugReport v2.1 initialized`，`window.BugReport` 可用。

---

## Step 6: 安装诊断 Skill — 让 AI Agent 会诊断

⭐ **这是最关键的一步** — 没有安装 Skill，AI 就只会帮你接 SDK 但不会诊断 Bug。

### 6.0 自我身份检测

检查自己的运行时环境，判断自己是什么 Agent：

| 信号 | Agent 类型 | 跳转到 |
|------|-----------|--------|
| 存在 `install_skill` 工具 / `.reasonix/` 目录 | **Reasonix** | Step 6R |
| 存在 `~/.claude/` 目录 / `claude` CLI | **Claude Code** | Step 6C |
| 存在 `.cursor/rules/` 目录 / `.cursorrules` | **Cursor** | Step 6CS |
| 存在 `.github/` 目录 / 项目在 GitHub 上下文中 | **GitHub Copilot** | Step 6CP |
| 存在 `GEMINI.md` 文件 / Gemini CLI 环境 | **Gemini CLI** | Step 6G |
| 项目已有 `.windsurfrules` | **Windsurf** | Step 6W |
| 存在 `.clinerules` / `.cline/` | **Cline** | Step 6CL |
| 以上都不匹配 | **通用兼容模式** | Step 6X |

---

### Step 6C: Claude Code

```bash
mkdir -p ~/.claude/skills/bug-report
cp SKILL.md ~/.claude/skills/bug-report/
```

> 告知用户：以后在 Claude Code 中说 `/bug-report` 或 "帮我排查这个错误" 即可激活诊断。

---

### Step 6R: Reasonix

使用 Reasonix 的 `install_skill` 工具安装：

- **name**: `bug-report`
- **description**: `全能 Bug 诊断技能 — 5 阶段：收集→分析→追踪→报告→修复。覆盖 uni-app / 微信小程序 / Android / iOS / React Native / Node`
- **runAs**: `subagent`
- **allowedTools**: `read_file, grep, glob, bash, edit_file, write_file, ls, web_fetch`
- **scope**: `project`（写入用户项目的 `.reasonix/skills/bug-report.md`）

Skill body 内容（**自包含完整诊断流程，不依赖外部文件**）：

```markdown
# BRS Bug 诊断技能

## 触发条件
用户说"报bug"、"有问题"、"出错了"、"崩溃"、"帮我排查"、"分析日志"、"/bug-report"时激活。

## Phase 1: 信息收集
- 提取：页面/功能、现象（闪退/白屏/报错/卡住）、频率（必现/偶发）、严重度
- 自动检测平台：检查 manifest.json/pages.json → uni-app；build.gradle.kts → Android；app.json+project.config.json → 微信小程序；package.json 含 react-native → RN
- 日志获取：引导用户从 App 内 log-viewer 面板 Export，或粘贴 adb logcat / Xcode 输出

## Phase 2: 日志分析
- 格式识别：BRS JSON（含 "level"/"cat"/"levelLabel"/"device" 字段）、BRS Text（"BugReport Log Export" 头部）、logcat（"E/TAG (PID): msg"）、os.Logger
- 分析框架：时间线重建 → 崩溃链追溯（检查 extra.breadcrumbs 还原用户路径）→ 网络诊断（检查 NETWORK 类别超时/失败）→ 性能诊断（PERF 类别）→ 生命周期检查
- 敏感字段已脱敏为 ***，无需额外处理

## Phase 3: 代码追踪
- 根据 stack/page 定位源文件，检查 try/catch、null 检查、权限声明
- 平台常见问题：uni-app 的 plus is not defined / 小程序域名白名单 / Android NetworkOnMainThreadException / iOS ATS

## Phase 4: 生成报告
写入 bugs/YYYY-MM-DD-<slug>.md，包含：报告时间、严重程度、影响页面、复现步骤、日志分析、根因分析、修复方案、风险等级

## Phase 5: 修复执行
- 根因明确 + 改动 <3 文件 + 低风险 → 直接修改代码
- 根因不明确 → 标记需进一步排查，不强行修复

完整规范参考：https://github.com/Kepsilent/Bug-Report-Skill/blob/main/SKILL.md
```

> 告知用户：以后在 Reasonix 中说 `/bug-report` 或 "帮我排查这个错误" 即可激活诊断。

---

### Step 6CS: Cursor

将 SKILL.md 内容改写为 Cursor Rules 格式，写入 `.cursor/rules/bug-report.mdc`：

```bash
mkdir -p .cursor/rules
```

文件内容：
```markdown
---
description: 全能 Bug 诊断技能 — 5 阶段：收集→分析→追踪→报告→修复
globs: **/*
alwaysApply: false
---

[在这里粘贴 SKILL.md 中 Phase 1-5 的核心流程内容]
```

> 告知用户：以后在 Cursor 中可以用 `/bug-report` 或在 Chat 中说 "帮我排查这个错误" 来激活。

---

### Step 6CP: GitHub Copilot

将诊断指令写入 `.github/copilot-instructions.md`：

```bash
mkdir -p .github
touch .github/copilot-instructions.md
```

写入内容（精简版 Phase 1-5）：
```markdown
# BugReport 诊断技能

当用户说"帮我排查"、"报bug"、"崩溃"、"分析日志"、"有问题"时激活：

## 诊断流程
1. 信息收集 — 检测平台、获取日志
2. 日志分析 — 识别格式、定位错误
3. 代码追踪 — 根据 stack 定位源文件
4. 生成报告 — 写入 bugs/ 目录
5. 修复执行 — 风险低时直接改代码

完整规范见 https://github.com/Kepsilent/Bug-Report-Skill/blob/main/SKILL.md
```

---

### Step 6G: Gemini CLI

将诊断提示写入项目中的 `GEMINI.md`（如果不存在则创建）：

```bash
touch GEMINI.md
```

在文件顶部添加：
```markdown
## BugReport 诊断技能

当用户报告 Bug、错误、崩溃时，按以下流程诊断：
1. 读取本项目的 SKILL.md 了解完整 5 阶段诊断流程
2. 收集信息 → 分析日志 → 追踪代码 → 生成报告 → 修复执行

触发词：报bug、有问题、出错了、崩溃、帮我排查、分析日志、/bug-report
```

---

### Step 6W: Windsurf

将诊断规则写入 `.windsurfrules`：

```markdown
## BugReport 诊断

当用户说"报bug"、"崩溃"、"帮我排查"、"分析日志"、"/bug-report"时：
按 SKILL.md 的 5 阶段诊断流程执行（收集→分析→追踪→报告→修复）。
```

---

### Step 6CL: Cline

将诊断规则写入 `.clinerules`：

```markdown
## BugReport 诊断技能

触发：报bug、崩溃、帮我排查、分析日志、/bug-report
流程：收集信息 → 分析日志 → 追踪代码 → 生成报告 → 修复
详见：SKILL.md

安装 BugReport SDK 到用户项目时，走 INSTALL.md 的 Step 1-5 按平台安装。
```

---

### Step 6X: 通用兼容模式

创建项目根目录的 `AGENTS.md`（如不存在）：

```markdown
## BugReport 诊断技能已安装

触发词：报bug、有问题、出错了、崩溃、帮我排查、分析日志、/bug-report

诊断流程：按 SKILL.md 的 5 阶段执行（收集→分析→追踪→报告→修复）。

完整规范：https://github.com/Kepsilent/Bug-Report-Skill/blob/main/SKILL.md
```

> 如无法自动判断 Agent 类型，跳过 Skill 安装，告知用户手动参考 README.md 中的"AI 诊断技能"章节。

---

## 通用验证清单

安装完成后，**必须逐项验证**，否则用户可能遇到白屏等严重问题：

- [ ] 编译通过，App 不白屏
- [ ] `BR.init()` 调用不报错
- [ ] 控制台/logcat/Xcode 出现 `BugReport v2.1 initialized`
- [ ] `BR.e('test', 'verify install')` 产生一条 ERROR 日志
- [ ] `BR.query()` 返回刚写入的日志
- [ ] `BR.exportLogs('text')` 返回格式化文本
- [ ] log-viewer 页面可正常打开并显示日志列表
- [ ] 网络请求被自动拦截（非小程序平台）

---

## 常见问题排查

### ❌ 安装后 App 白屏

**原因分析：**
1. **UMD root 变量为 undefined** — uni-app 的 app-service 环境中 `self` 不存在、严格模式 `this` 为 `undefined`，导致 `root.BugReport = ...` 抛出 `TypeError: Cannot set property 'BugReport' of undefined`
   - **修复：** 确保 `index.js` / `index.mjs` 的 UMD 包装器使用 `globalThis` 作为最优先兜底（v2.1+ 已内置此修复）
2. **ESM 导入失败** — Vite 项目用了 UMD 版 `index.js`，`import` 失败导致整个模块链断裂
   - **修复：** 改用 `index.mjs` 重新安装
3. **Init 失败导致整个 App 崩溃** — `BR.init()` 抛出异常没有被捕获，导致 App.vue onLaunch 中断
   - **修复：** `BR.init()` 外套 `try/catch`：`try { BR.init(...) } catch(e) { console.warn(e) }`
4. **双 logger 冲突** — 旧的 `error-logger.js` 和新 `bug-report.js` 两个 `init()` 冲突
   - **修复：** 删除旧 logger 的 import 和 init 调用，只保留新版
5. **pages.json 路径错误** — 注册的页面路径跟实际文件位置对不上
   - **修复：** 确认 `pages.json` 中的路径与文件实际路径一致

### ❌ `import BR from ...` 报错

- **Vite/Webpack 项目**：改用 `index.mjs`（不是 `index.js`）
- **小程序**：改用 `const BR = require('./bug-report.js')`
- **传统 `<script>` 标签**：直接用 `window.BugReport`，不需要 import

### ❌ log-viewer 页面打不开

- 检查 `pages.json` 中是否正确注册了页面路径
- 检查 `.vue` 文件是否复制到了对应位置
- 检查页面路径是否与其他路由冲突
