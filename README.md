# 万金油 Bug Report System

[![JS](https://img.shields.io/badge/JS-HBuilderX-blue)](#hbuilderx--js)
[![Kotlin](https://img.shields.io/badge/Kotlin-Android%20Studio-purple)](#android-studio--kotlin)
[![Swift](https://img.shields.io/badge/Swift-iOS-orange)](#ios--swift)
[![WeChat](https://img.shields.io/badge/WeChat-Mini%20Program-green)](#微信小程序)
[![uni-app](https://img.shields.io/badge/uni--app-✓-brightgreen)](#hbuilderx--js)
[![MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

**一套 Skill，通吃所有平台。** 零依赖、一行接入、自动网络拦截、统一暗色终端可视化。

---

## 🚀 小白三分钟上手

看不懂下面一堆技术名词？没关系，只要你会用 Claude Code 就行。

### 第 1 步：把链接发给 Claude Code

复制下面这个链接，粘贴给 Claude Code：

```
https://github.com/Kepsilent/Bug-Report-Skill
```

### 第 2 步：告诉它帮你装

> "帮我安装这个 BugReport 到我的项目"

Claude 会自动读取项目的 [INSTALL.md](INSTALL.md)，识别你的项目是什么类型（uni-app？Android Studio？小程序？），然后自动复制文件、加代码、注册页面。**全程不用你动脑子。**

### 第 3 步：装好了，直接用嘴说就行

安装完成后，所有能力自动生效。你想用的时候直接用自然语言：

> "帮我排查这个错误"
> "分析一下这段日志"
> "这个崩溃是什么原因？"
> "/bug-report"

Claude 会自动激活诊断技能，帮你：

- 📋 **收集信息** — 自动检测你的平台（uni-app / 微信 / Android / iOS / Node）
- 🔍 **分析日志** — 支持 BugReport JSON、logcat、os.Logger 多种格式
- 📍 **追踪代码** — 根据堆栈直接定位到你项目里的源文件
- 📝 **生成报告** — 结构化 Bug 报告写入 `bugs/` 目录
- 🔧 **执行修复** — 根因明确时直接帮你改代码

> 💡 不需要记任何命令，说人话就行。Skill 会根据你的描述自动激活。

> 如果你是开发者想手动接入，往下翻各平台说明 ↓

---

## 这是什么

一个 Claude Code Skill + 多语言日志库的集合体：

- **Skill** — 教会 Claude 如何诊断 Bug（5 阶段：收集→分析→追踪→报告→修复）
- **日志库** — 自动采集崩溃/网络/性能数据，一行代码接入
- **可视化面板** — IDE 暗色终端风格，开发时 AI 可读，发布后用户可看

## 版本

| SDK | 语言 | 平台 | 状态 |
|-----|------|------|:---:|
| `index.js` | JavaScript (UMD) | uni-app / 微信小程序 / React Native / Capacitor / 浏览器 / Node | ✅ Ready |
| `android/` | Kotlin | Android Studio 原生应用 (Java/Kotlin) | ✅ Ready |
| `ios/` | Swift | iOS 原生应用 | ✅ Ready |

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

所有平台统一暗色终端主题（VS Code 风格）：

- 6 级色标 (V/D/I/W/E/F)
- Tab 切换：全部 / 错误 / 警告 / 网络 / 性能 / 崩溃
- 搜索过滤
- 导出 Text / JSON / CSV
- 一键复制
- 实时刷新 / 暂停

| 平台 | 查看器文件 |
|------|-----------|
| uni-app / H5 / 小程序 | `log-viewer-common.vue` |
| 纯 Web / H5 | `log-viewer.vue` |
| Android 原生 | `LogViewerActivity.kt` |

---

## Claude Code Skill

安装 Skill 后，说"帮我排查这个错误"自动激活。Skill 会：

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
  "extra": { "url": "/api/data" },
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
  SKILL.md                  # Claude Code Skill 定义
  README.md                 # 本文档
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
