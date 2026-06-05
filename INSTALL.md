# INSTALL.md — Claude Code 安装指令

> 给 Claude 看的：当用户提供 GitHub 链接 `https://github.com/Kepsilent/Bug-Report-Skill` 并要求安装时，按以下流程自动执行。

**用户操作流程：**
1. 用户把 GitHub 链接发给 Claude
2. 用户说"帮我安装这个 BugReport 到我的项目"
3. Claude 读取此 INSTALL.md，按下面步骤执行

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

## Step 6: 安装 Skill（让 Claude 会诊断）

```bash
mkdir -p ~/.claude/skills/bug-report
cp SKILL.md ~/.claude/skills/bug-report/
```

验证：在 Claude Code 中说 `/bug-report` 或 "帮我排查这个错误"。

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
