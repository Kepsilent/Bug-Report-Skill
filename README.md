# BRS (Bug Report System)

[![JS](https://img.shields.io/badge/JS-HBuilderX-blue)](#hbuilderx--js)
[![Kotlin](https://img.shields.io/badge/Kotlin-Android%20Studio-purple)](#android-studio--kotlin)
[![Swift](https://img.shields.io/badge/Swift-iOS-orange)](#ios--swift)
[![WeChat](https://img.shields.io/badge/WeChat-Mini%20Program-green)](#微信小程序)
[![uni-app](https://img.shields.io/badge/uni--app-✓-brightgreen)](#hbuilderx--js)
[![MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Agents](https://img.shields.io/badge/AI%20Agents-Claude%20Code%20%7C%20Reasonix%20%7C%20Cursor%20%7C%20Codex%20%7C%20Copilot%20%7C%20Windsurf%20%7C%20Gemini%20CLI%20%7C%20...-6e40c9)](https://github.com/Kepsilent/Bug-Report-Skill)

**BRS — 跨平台崩溃监控与 AI 智能诊断系统。** 零依赖、一行接入、自动网络拦截、隐私脱敏、全平台可视化。

---

## 🚀 安装方式（小白友好）

支持所有主流 AI 编程助手：**Claude Code · Reasonix · Cursor · Gemini CLI · Codex · GitHub Copilot · Windsurf · Cline · Aider** …

复制下面这行话，丢给你的 AI Agent，就装好了：

```
帮我安装这个项目：https://github.com/Kepsilent/Bug-Report-Skill
```

👆 鼠标移到上面那行，点右上角出现的复制图标，粘贴到你的 AI 对话框里，回车。Agent 会自动检查你的项目类型（uni-app？Android？小程序？），复制 SDK 文件、加初始化代码、注册路由，还会把诊断 Skill 装到自己身上。**当前会话立刻生效，不需要你做任何额外操作。**

装好之后直接说人话就行：

```
帮我排查这个错误
分析一下这段日志
这个崩溃是什么原因？
/bug-report
```

你的 AI Agent 会自动激活诊断技能，帮你：

- 📋 **收集信息** — 自动检测你的平台（uni-app / 微信 / Android / iOS / Node）
- 🔍 **分析日志** — 支持 BugReport JSON、logcat、os.Logger 多种格式
- 📍 **追踪代码** — 根据堆栈直接定位到你项目里的源文件
- 📝 **生成报告** — 结构化 Bug 报告写入 `bugs/` 目录
- 🔧 **执行修复** — 根因明确时直接帮你改代码

> 💡 不需要记任何命令，说人话就行。Skill 会根据你的描述自动激活。
> 🖥️ 手动安装：也可以直接 `git clone https://github.com/Kepsilent/Bug-Report-Skill.git`，Agent 下次启动自动读取 `AGENTS.md`。

---

## 这是什么

**BRS (Bug Report System)** v3.0 — 一款**开源、完全免费**的跨平台崩溃监控与 AI 智能诊断系统。

无论是个人开发者（C 端）还是企业团队（B 端），只需一行代码接入，即可获得企业级的日志采集、崩溃追踪、性能监控和 AI 自动诊断能力。

> 💡 永久 MIT 开源，无付费墙，无遥测回传，数据 100% 留在本地。

### 核心能力

| 功能 | 说明 |
|------|------|
| 📋 **智能日志采集** | 6 级日志（V/D/I/W/E/F），14 种分类，自动适配 uni-app / 微信 / Android / iOS / React Native / Node / Electron | ✅ JS | ✅ Android | ✅ iOS |
| 🍞 **面包屑追踪** | FIFO 50 步定长队列，自动记录路由跳转、前后台切换、网络变化等关键操作，崩溃时精准还原用户路径 | ✅ JS | ✅ Android | ✅ iOS |
| 📸 **状态快照** | `BR.snapshot(data)` 保存业务状态，崩溃时自动注入日志，一眼看清崩溃时刻的上下文 | ✅ JS | ✅ Android | ✅ iOS |
| 🌐 **网络自动拦截** | Monkey-patch fetch/XHR（JS）、OkHttp Interceptor（Android）、URLProtocol（iOS），零手动接入 | ✅ JS | ✅ Android | ✅ iOS |
| 🔒 **隐私脱敏** | 拦截器前置内存清洗，password/token/手机号/邮箱/身份证匹配即替换为 `***`，不触碰 I/O | ✅ JS | ✅ Android | ✅ iOS |
| 📊 **可视化面板** | Chrome DevTools 风格纯 HTML，WebView 加载即用，Android/iOS/Electron/浏览器全平台统一 | ✅ WebView | ✅ WebView | ✅ WKWebView |
| 🧠 **AI 智能诊断** | 5 阶段诊断流程（收集→分析→追踪→报告→修复），Claude Code / Reasonix / Cursor / Copilot 等均可调用 | ✅ | ✅ | ✅ |
| 🔌 **MCP Server** | `get_latest_crash` + `search_logs`，AI Agent 通过标准 MCP 协议直接查询日志 JSON | ✅ Node.js | — | — |
| 🚨 **崩溃自动捕获** | 全局 JS 异常 + Promise 未捕获 + Native 崩溃（Android/iOS），自动持久化 | ✅ JS | ✅ Android | ✅ iOS |
| ⚡ **性能追踪** | `BR.perf.start/end` 计时器，超阈值自动标 WARN，支持自定义阈值 | ✅ JS | ✅ Android | ✅ iOS |
| 📱 **生命周期监控** | `life.fg/bg/in_/out`，自动记录日志 + 面包屑，排查前后台切换引发的状态异常 | ✅ JS | ✅ Android | ✅ iOS |

### 面向人群

| | C 端（个人开发者） | B 端（企业团队） |
|------|------|------|
| **成本** | 永久免费 | 永久免费，无 seat 限制 |
| **部署** | 一行 `BR.init()` | 集成 CI，私有化部署 |
| **数据** | 100% 本地存储 | 可接入自有日志后端 |
| **AI 诊断** | Skill 激活即用（Claude Code / Reasonix / Cursor …） | Skill + MCP Server 双通道 |
| **MCP** | ✅ 一条命令启动 `node mcp-server.js` | ✅ 可集成至企业 AI 平台 |
| **定制** | MIT 协议随意改 | 可 fork 二开，无法律风险 |

> 💡 所有 AI Agent 共享同一份 [SKILL.md](SKILL.md)，通过 [AGENTS.md](AGENTS.md) 自动发现。

## 版本

| SDK | 语言 | 平台 | 状态 |
|-----|------|------|:---:|
| `index.js` | JavaScript (UMD) | uni-app / 微信小程序 / React Native / Capacitor / 浏览器 / Node / Electron | ✅ Ready |
| `android/` | Kotlin | Android Studio 原生应用 (Java/Kotlin) | ✅ Ready |
| `ios/` | Swift | iOS 原生应用 | ✅ Ready |
| `mcp-server.js` | Node.js | AI Agent MCP 集成 | ✅ Ready |

所有版本共享统一的 **LogEntry 数据合约**，确保跨平台日志格式一致 — SKILL.md 无需修改即可诊断任何平台的 Bug。

---

## HBuilderX / JS 版

### 安装

```bash
git clone https://github.com/Kepsilent/Bug-Report-Skill.git
cp index.js your-project/src/utils/bug-report.js
cp log-viewer-common.vue your-project/src/pages/debug-log.vue
```

### 接入

```js
import BR from '@/utils/bug-report.js'

// 一行初始化 — 崩溃/网络/性能自动采集
BR.init({ appName: '你的App', appVersion: '1.0.0' })

// 手动打点
BR.info('page', 'Home loaded')
BR.e('api', 'POST /login failed')
BR.w('render', 'Slow render: 2100ms')

// 网络全自动（fetch/XHR 被 monkey-patch，无需手动接入）
// 微信小程序：用 BR.wx.req() 包装 wx.request

// 性能追踪
BR.perf.start('loadData')
const ms = BR.perf.end('loadData')  // >3s 自动标 WARN

// 实时监听
BR.watch(log => { if (log.level >= 4) notify(log.msg) })

// 面包屑 — 自动记录关键操作，崩溃时打包进日志
BR.crumb('checkout', 'User clicked pay')

// 状态快照 — 保存当前业务状态，崩溃时自动附带
BR.snapshot({ orderId: 'ORD-999', step: 'payment' })

// 隐私脱敏 — 默认拦截 password/token/手机号/邮箱等
// 自定义规则: BR.sanitizer.addRule(/secretKey=\w+/g)

// 生命周期 — 自动日志+面包屑
BR.life.fg(); BR.life.bg(); BR.life.in_('pages/home'); BR.life.out('pages/home')

// 面包屑自动埋点：life.fg/bg/in_/out + net:change 自动记录

// 查询 & 导出
BR.query({ cat: 'NETWORK', minLevel: 3 })
BR.exportLogs('text')  // text / json / csv
BR.copyLogs()          // 一键复制
```

### 平台支持

| 平台 | 自动检测 | 网络自动拦截 | log-viewer |
|------|:---:|:---:|:---:|
| uni-app (Android/iOS) | ✅ | ✅ (fetch/XHR) | `log-viewer-common.vue` |
| 微信小程序 | ✅ | ⚠️ 需用 `BR.wx.req()` 包装 | `log-viewer-common.vue` |
| React Native | ✅ | ✅ (WebView) | WebView 内嵌 viewer |
| Capacitor / Cordova | ✅ | ✅ (fetch/XHR) | `log-viewer-common.vue` |
| 浏览器 (Vue/React/vanilla) | ✅ | ✅ (fetch/XHR) | `log-viewer.vue` |
| Node.js | ✅ | N/A | 无 DOM |

### API 速查

| 分组 | 方法 |
|------|------|
| 日志 | `BR.v()` `BR.d()` `BR.info()` `BR.w()` `BR.e()` `BR.f()` `BR.crash()` |
| 网络 | `BR.net.req()` `BR.net.err()` `BR.net.slow()` `BR.net.timeout()` |
| 微信 | `BR.wx.req()` `BR.wx.get()` `BR.wx.post()` |
| 性能 | `BR.perf.start()` `BR.perf.end()` `BR.perf.mark()` |
| 面包屑 | `BR.crumb()` `BR.crumbs()` `BR.clearCrumbs()` |
| 快照 | `BR.snapshot()` `BR.getSnapshot()` `BR.clearSnapshot()` |
| 脱敏 | `BR.sanitizer.addRule()` `BR.sanitizer.rules()` |
| 生命周期 | `BR.life.fg()` `BR.life.bg()` `BR.life.in_()` `BR.life.out()` |
| 查询 | `BR.query()` `BR.stats()` `BR.errCount()` `BR.wrnCount()` |
| 导出 | `BR.exportLogs()` `BR.copyLogs()` `BR.clear()` |
| 监听 | `BR.watch(cb)` 返回取消订阅函数 |

---

## Android Studio / Kotlin 版

### 安装

```gradle
// settings.gradle.kts
include(":bugreport")
project(":bugreport").projectDir = File("path/to/bugreport/android")

// app/build.gradle.kts
implementation(project(":bugreport"))
```

### 接入

```kotlin
// 一行初始化
class MyApp : Application() {
    override fun onCreate() {
        super.onCreate()
        BugReport.init(this)  // 自动开启崩溃捕获
    }
}

// 日志 — 与 JS 版 API 一致
BugReport.e("api", "POST /login failed")
BugReport.info("page", "Home loaded")

// 网络 — OkHttp 自动拦截, 也支持手动
BugReport.net.req("POST", "/api/login", 500, 1234, 0)

// 性能
BugReport.perf.start("loadData")
val ms = BugReport.perf.end("loadData")

// 面包屑 + 快照
BugReport.crumb("checkout", "User clicked pay")
BugReport.snapshot(mapOf("orderId" to "ORD-999", "step" to "payment"))

// 隐私脱敏（默认已拦截 password/token/手机号/邮箱）
BugReport.sanitizer.addRule(Regex("secretKey=\\w+"))

// 生命周期（自动日志+面包屑）
BugReport.life.fg(); BugReport.life.bg(); BugReport.life.in_("MainActivity")

// 查询 & 导出
val errors = BugReport.query(minLevel = 4)
BugReport.copyLogs()

// 内置 Log Viewer
startActivity(Intent(this, LogViewerActivity::class.java))
```

### 开发时 AI 可读

```bash
adb logcat -s BugReport
```

输出格式：`#42 ERROR NETWORK net:err | Connection refused`

---

## 微信小程序

纯小程序环境（非 uni-app 编译）：

```js
// 储存: wx.setStorageSync / wx.getStorageSync (单 key 1MB 限制)
// 设备: wx.getSystemInfoSync()
// 网络: 不能用 monkey-patch, 用 BR.wx.req() 包装
BR.wx.req({
  url: 'https://api.example.com/data',
  method: 'GET',
  success(res) { /* ... */ }
})
```

> **注意**: uni-app 编译到小程序的无需特殊处理 — `index.js` 自动走 uni-app 适配器。

---

## 日志查看器

Chrome DevTools 风格纯 HTML 面板，WebView 跨平台通用：

- 6 级色标 + 分类色块 (V/D/I/W/E/F)
- Tab 切换：All / Errors / Warnings / Network / Perf / Breadcrumbs
- 点击行展开详情（含 stack、breadcrumbs、snapshot）
- 搜索过滤 + Category 筛选
- Export Text + Copy to clipboard
- 响应式设计，移动端可用

| 平台 | 查看器 |
|------|-------|
| **全平台 WebView** | `log-viewer.html` *(NEW v3.0)* |
| uni-app / H5 / 小程序 | `log-viewer-common.vue` (legacy) |
| 纯 Web / H5 | `log-viewer.vue` (legacy) |
| Android 原生 | `LogViewerActivity.kt` |

---

## MCP Server

BRS 内置 MCP (Model Context Protocol) Server，让 AI Agent 通过标准协议直接查询日志：

```bash
# 启动 MCP Server（stdio JSON-RPC 传输，零依赖）
node mcp-server.js --dir ./bugs/
```

### 可用 Tools

| Tool | 说明 | 示例 |
|------|------|------|
| `get_latest_crash` | 获取最近一次崩溃完整报告（含面包屑、快照、崩溃前 30 秒上下文） | → 直接返回结构化 JSON |
| `search_logs` | 按级别/分类/标签/关键词/时间范围搜索日志 | `{minLevel:4, cat:"NETWORK", limit:50}` |

### 接入 AI Agent

```json
// Reasonix / Claude Code / Cursor 的 MCP 配置
{
  "mcpServers": {
    "brs": {
      "command": "node",
      "args": ["mcp-server.js", "--dir", "./bugs/"]
    }
  }
}
```

---

## AI 诊断技能

安装 Skill 后，任何 AI Agent 都能用，说"帮我排查这个错误"自动激活。Skill 会：

1. **收集信息** — 自动检测平台（uni-app / 微信 / Android / iOS / Node）
2. **分析日志** — 支持 BugReport JSON、logcat、os.Logger 多种格式
3. **追踪代码** — 根据 stack/page 定位源文件
4. **生成报告** — 写入项目 `bugs/` 目录
5. **执行修复** — 风险低时直接改代码

---

## 统一数据合约

所有平台的所有 SDK 产生相同格式的日志：

```json
{
  "id": 42,
  "ts": 1717651200000,
  "time": "2026-06-05T12:00:00.000Z",
  "level": 4,
  "levelLabel": "ERROR",
  "cat": "NETWORK",
  "tag": "net:err",
  "msg": "Connection refused",
  "stack": "Error: ...\n  at ...",
  "page": "pages/home/index",
  "extra": {
    "url": "/api/data",
    "breadcrumbs": [{"t":1717651190000,"time":"...","tag":"nav","msg":"clicked checkout"}],
    "snapshot": {"orderId":"ORD-999"}
  },
  "device": {
    "model": "Pixel 9",
    "brand": "Google",
    "system": "android",
    "osVer": "15",
    "appVer": "1.0.0",
    "appName": "MyApp"
  }
}
```

**这是万金油的核心** — 日志格式统一，SKILL.md 不需要知道它来自哪个平台。

---

## 项目结构

```
Bug-Report-Skill/
  index.js                  # JS 日志库 (UMD, 12KB)
  log-viewer.vue            # H5/Web 日志查看器
  log-viewer-common.vue     # uni-app 通用日志查看器（条件编译）
  AGENTS.md                 # AI Agent 通用入口（自动发现）
  SKILL.md                  # AI 诊断技能定义（所有 Agent 共享）
  INSTALL.md                # AI 自动安装指令
  README.md                 # 本文档
  log-viewer.html           # 跨平台 WebView 日志面板 (NEW v3.0)
  log-viewer.vue            # H5/Web 日志查看器 (legacy)
  log-viewer-common.vue     # uni-app 通用日志查看器 (legacy)
  mcp-server.js             # MCP Server — AI 协议查询日志 (NEW v3.0)
  android/                  # Android Studio Kotlin SDK
    build.gradle.kts
    src/main/kotlin/com/bugreport/
      BugReport.kt          # 单例入口
      LogEntry.kt           # 数据模型
      StorageAdapter.kt     # SharedPreferences 持久化
      NetworkInterceptor.kt # OkHttp 自动拦截
      CrashHandler.kt       # 全局崩溃捕获
      PerfTracker.kt        # 性能追踪
      QueryEngine.kt        # 日志查询
      LogExporter.kt        # 导出器
      viewer/
        LogViewerActivity.kt
        LogListAdapter.kt
    src/main/res/layout/
      activity_log_viewer.xml
      item_log_entry.xml
  ios/                      # 🔜 Swift SDK（后续开发）
```

---

## 许可证

MIT
