# BRS (Bug Report System)

[![JS](https://img.shields.io/badge/JS-HBuilderX-blue)](#hbuilderx--js)
[![Kotlin](https://img.shields.io/badge/Kotlin-Android%20Studio-purple)](#android-studio--kotlin)
[![Swift](https://img.shields.io/badge/Swift-iOS-orange)](#ios--swift)
[![WeChat](https://img.shields.io/badge/WeChat-Mini%20Program-green)](#wechat-mini-program)
[![uni-app](https://img.shields.io/badge/uni--app-✓-brightgreen)](#hbuilderx--js)
[![MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Agents](https://img.shields.io/badge/AI%20Agents-Claude%20Code%20%7C%20Reasonix%20%7C%20Cursor%20%7C%20Codex%20%7C%20Copilot%20%7C%20Windsurf%20%7C%20Gemini%20CLI%20%7C%20...-6e40c9)](https://github.com/Kepsilent/Bug-Report-Skill)
[![Tests](https://img.shields.io/badge/Tests-122%2F122%20passed-green)](https://github.com/Kepsilent/Bug-Report-Skill/blob/main/TEST.md)
[![Platforms](https://img.shields.io/badge/Platforms-6%20verified-blue)](#-test-results)
[![iOS](https://img.shields.io/badge/iOS-untested-lightgrey)]()

🌐 [中文](README.md) | English

---

**BRS — Cross-platform crash monitoring & AI diagnosis system.** Zero dependencies, one-line integration, automatic network interception, privacy sanitization, universal visualization.

---

## 🚀 Installation (One Click)

Works with all major AI coding assistants: **Claude Code · Reasonix · Cursor · Gemini CLI · Codex · GitHub Copilot · Windsurf · Cline · Aider** …

Copy the line below and paste it to your AI Agent:

```
请帮我安装这个项目，如果已安装就更新到最新版：https://github.com/Kepsilent/Bug-Report-Skill
```

👆 Hover over the line above, click the copy icon that appears, paste it into your AI dialog, press Enter. Your Agent will automatically detect your project type (uni-app? Android? WeChat Mini Program?), copy SDK files, add initialization code, register routes, and install the diagnostic Skill on itself. **Takes effect immediately — no extra steps.**

After installation, just speak naturally:

```
Help me debug this error
Analyze this crash log
What caused this crash?
/bug-report
```

Your AI Agent will activate the diagnostic skill and:

- 📋 **Collect info** — Auto-detect platform (uni-app / WeChat / Android / iOS / Node)
- 🔍 **Analyze logs** — Support BugReport JSON, logcat, os.Logger formats
- 📍 **Trace code** — Locate source files from stack traces
- 📝 **Generate report** — Structured bug reports written to `bugs/` directory
- 🔧 **Execute fixes** — Directly modify code when root cause is clear

> 💡 No commands to memorize. The Skill activates automatically based on your description.
> 🖥️ Manual install: `git clone https://github.com/Kepsilent/Bug-Report-Skill.git` — the Agent auto-discovers `AGENTS.md` on next launch.

---

## What is BRS?

**BRS (Bug Report System)** v3.0 — an **open-source, completely free** cross-platform crash monitoring and AI-powered diagnosis system.

Whether you're an individual developer (B2C) or an enterprise team (B2B), one line of code gives you enterprise-grade logging, crash tracking, performance monitoring, and AI automatic diagnosis.

> 💡 MIT licensed, forever free. No paywalls, no telemetry, 100% local data.

### Core Capabilities

| Feature | Description | JS | Android | iOS |
|------|------|:--:|:--:|:--:|
| 📋 **Smart Logging** | 6 levels (V/D/I/W/E/F), 14 categories, auto-adaptation for uni-app / WeChat / Android / iOS / React Native / Node / Electron | ✅ | ✅ | ✅ |
| 🍞 **Breadcrumbs** | FIFO 50-step queue, auto-records route changes, foreground/background switches, network changes; precisely recreates user path on crash | ✅ | ✅ | ✅ |
| 📸 **State Snapshots** | `BR.snapshot(data)` saves business state, auto-injected into crash logs | ✅ | ✅ | ✅ |
| 🌐 **Auto Network Interception** | Monkey-patch fetch/XHR (JS), OkHttp Interceptor (Android), URLProtocol (iOS) | ✅ | ✅ | ✅ |
| 🔒 **Privacy Sanitizer** | Pre-I/O memory scrubbing: password/token/phone/email/ID → `***` before touching storage | ✅ | ✅ | ✅ |
| 📊 **Visualization Panel** | Chrome DevTools-style pure HTML, WebView-ready, works across all platforms | ✅ WebView | ✅ WebView | ✅ WKWebView |
| 🧠 **AI Diagnosis** | 5-phase diagnosis (Collect→Analyze→Trace→Report→Fix), works with Claude Code / Reasonix / Cursor / Copilot etc. | ✅ | ✅ | ✅ |
| 🔌 **MCP Server** | `get_latest_crash` + `search_logs`, AI Agents query logs via standard MCP protocol | ✅ Node.js | — | — |
| 🚨 **Crash Capture** | Global JS errors + unhandled Promise rejections + Native crashes (Android/iOS), auto-persisted | ✅ JS | ✅ Android | ✅ iOS |
| ⚡ **Performance Tracking** | `BR.perf.start/end` timers, auto-WARN above threshold, configurable | ✅ JS | ✅ Android | ✅ iOS |
| 📱 **Lifecycle Monitoring** | `life.fg/bg/in_/out`, auto breadcrumbs + logs | ✅ JS | ✅ Android | ✅ iOS |

### Who It's For

| | C-side (Individual Developer) | B-side (Enterprise Team) |
|------|------|------|
| **Cost** | Free forever | Free forever, no seat limits |
| **Deployment** | One-line `BR.init()` | CI integration, self-hosted |
| **Data** | 100% local storage | Connect to your own log backend |
| **AI Diagnosis** | Skill activation (Claude Code / Reasonix / Cursor …) | Skill + MCP Server dual channel |
| **MCP** | ✅ One command: `node mcp-server.js` | ✅ Integrate into enterprise AI platform |
| **Customization** | MIT license — modify freely | Fork and customize, no legal risk |

> 💡 All AI Agents share the same [SKILL.md](SKILL.md), auto-discovered via [AGENTS.md](AGENTS.md).

## SDK Versions

| SDK | Language | Platforms | Status |
|-----|------|------|:---:|
| `index.js` | JavaScript (UMD) | uni-app / WeChat Mini Program / React Native / Capacitor / Browser / Node / Electron | ✅ Ready |
| `android/` | Kotlin | Android Studio (Java/Kotlin) | ✅ Ready |
| `ios/` | Swift | iOS native | ✅ Ready |
| `mcp-server.js` | Node.js | AI Agent MCP integration | ✅ Ready |

All SDKs share a unified **LogEntry data contract** — cross-platform log format consistency ensures SKILL.md can diagnose bugs from any platform without modification.

---

## HBuilderX / JS Edition

### Install

```bash
git clone https://github.com/Kepsilent/Bug-Report-Skill.git
cp index.js your-project/src/utils/bug-report.js
cp log-viewer-common.vue your-project/src/pages/debug-log.vue
```

### Usage

```js
import BR from '@/utils/bug-report.js'

// One-line init — crash/network/performance auto-captured
BR.init({ appName: 'YourApp', appVersion: '1.0.0' })

// Manual logging
BR.info('page', 'Home loaded')
BR.e('api', 'POST /login failed')
BR.w('render', 'Slow render: 2100ms')

// Network fully automatic (fetch/XHR monkey-patched)
// WeChat Mini Program: use BR.wx.req() wrapper

// Performance tracking
BR.perf.start('loadData')
const ms = BR.perf.end('loadData')  // >3s auto-WARN

// Real-time watch
BR.watch(log => { if (log.level >= 4) notify(log.msg) })

// Breadcrumbs — auto-record key operations, packed into crash logs
BR.crumb('checkout', 'User clicked pay')

// State snapshot — save business state, auto-attached on crash
BR.snapshot({ orderId: 'ORD-999', step: 'payment' })

// Privacy sanitizer — defaults: password/token/phone/email
// Custom rule: BR.sanitizer.addRule(/secretKey=\w+/g)

// Lifecycle — auto logs + breadcrumbs
BR.life.fg(); BR.life.bg(); BR.life.in_('pages/home'); BR.life.out('pages/home')

// Query & Export
BR.query({ cat: 'NETWORK', minLevel: 3 })
BR.exportLogs('text')  // text / json / csv
BR.copyLogs()          // one-click copy
```

### Platform Support

| Platform | Auto-Detect | Network Auto-Intercept | Log Viewer |
|------|:---:|:---:|:---:|
| uni-app (Android/iOS) | ✅ | ✅ (fetch/XHR) | `log-viewer-common.vue` |
| WeChat Mini Program | ✅ | ⚠️ Use `BR.wx.req()` wrapper | `log-viewer-common.vue` |
| React Native | ✅ | ✅ (WebView) | WebView embedded |
| Capacitor / Cordova | ✅ | ✅ (fetch/XHR) | `log-viewer-common.vue` |
| Browser (Vue/React/vanilla) | ✅ | ✅ (fetch/XHR) | `log-viewer.vue` |
| Node.js | ✅ | N/A | No DOM |

### API Quick Reference

| Group | Methods |
|------|------|
| Logging | `BR.v()` `BR.d()` `BR.info()` `BR.w()` `BR.e()` `BR.f()` `BR.crash()` |
| Network | `BR.net.req()` `BR.net.err()` `BR.net.slow()` `BR.net.timeout()` |
| WeChat | `BR.wx.req()` `BR.wx.get()` `BR.wx.post()` |
| Performance | `BR.perf.start()` `BR.perf.end()` `BR.perf.mark()` |
| Breadcrumbs | `BR.crumb()` `BR.crumbs()` `BR.clearCrumbs()` |
| Snapshot | `BR.snapshot()` `BR.getSnapshot()` `BR.clearSnapshot()` |
| Sanitizer | `BR.sanitizer.addRule()` `BR.sanitizer.rules()` |
| Lifecycle | `BR.life.fg()` `BR.life.bg()` `BR.life.in_()` `BR.life.out()` |
| Query | `BR.query()` `BR.stats()` `BR.errCount()` `BR.wrnCount()` |
| Export | `BR.exportLogs()` `BR.copyLogs()` `BR.clear()` |
| Watch | `BR.watch(cb)` returns unsubscribe function |

---

## Android Studio / Kotlin Edition

### Install

```gradle
// settings.gradle.kts
include(":bugreport")
project(":bugreport").projectDir = File("path/to/bugreport/android")

// app/build.gradle.kts
implementation(project(":bugreport"))
```

### Usage

```kotlin
// One-line init
class MyApp : Application() {
    override fun onCreate() {
        super.onCreate()
        BugReport.init(this)  // auto-enables crash capture
    }
}

// Logging — API mirrors JS
BugReport.e("api", "POST /login failed")
BugReport.info("page", "Home loaded")

// Network — OkHttp auto-intercept, also manual
BugReport.net.req("POST", "/api/login", 500, 1234, 0)

// Performance
BugReport.perf.start("loadData")
val ms = BugReport.perf.end("loadData")

// Breadcrumbs + Snapshot
BugReport.crumb("checkout", "User clicked pay")
BugReport.snapshot(mapOf("orderId" to "ORD-999", "step" to "payment"))

// Privacy sanitizer (auto-redacts password/token/phone/email)
BugReport.sanitizer.addRule(Regex("secretKey=\\w+"))

// Lifecycle (auto logs + breadcrumbs)
BugReport.life.fg(); BugReport.life.bg(); BugReport.life.in_("MainActivity")

// Query & Export
val errors = BugReport.query(minLevel = 4)
BugReport.copyLogs()

// Built-in Log Viewer
startActivity(Intent(this, LogViewerActivity::class.java))
```

### AI-Readable via ADB

```bash
adb logcat -s BugReport
```

Output format: `#42 ERROR NETWORK net:err | Connection refused`

---

## WeChat Mini Program

Standalone mini program (non uni-app compiled):

```js
// Storage: wx.setStorageSync / wx.getStorageSync (1MB per key limit)
// Device: wx.getSystemInfoSync()
// Network: wx.request cannot be monkey-patched, use BR.wx.req() wrapper
BR.wx.req({
  url: 'https://api.example.com/data',
  method: 'GET',
  success(res) { /* ... */ }
})
```

> **Note**: uni-app compiled to mini program needs no special handling — `index.js` auto-uses uni-app adapter.

---

## Log Viewer

Chrome DevTools-style pure HTML panel, cross-platform via WebView:

- 6-level color coding + category color blocks (V/D/I/W/E/F)
- Tab switching: All / Errors / Warnings / Network / Perf / Breadcrumbs
- Expand rows for detail (stack, breadcrumbs, snapshot)
- Search filter + Category filter
- Export Text + Copy to clipboard
- Responsive design, mobile-ready

| Platform | Viewer |
|------|-------|
| **All Platforms (WebView)** | `log-viewer.html` *(NEW v3.0)* |
| uni-app / H5 / Mini Program | `log-viewer-common.vue` (legacy) |
| Web / H5 | `log-viewer.vue` (legacy) |
| Android Native | `LogViewerActivity.kt` |

---

## MCP Server

BRS includes an MCP (Model Context Protocol) Server, enabling AI Agents to query logs via standard protocol:

```bash
# Start MCP Server (stdio JSON-RPC transport, zero dependencies)
node mcp-server.js --dir ./bugs/
```

### Available Tools

| Tool | Description | Example |
|------|------|------|
| `get_latest_crash` | Get the most recent crash report (breadcrumbs, snapshot, 30s pre-crash context) | → Returns structured JSON |
| `search_logs` | Search logs by level, category, tag, keyword, or time range | `{minLevel:4, cat:"NETWORK", limit:50}` |

### AI Agent Integration

```json
// MCP configuration for Reasonix / Claude Code / Cursor
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

## 🧪 Test Results

| Platform | Test | Status |
|------|--------|:--:|
| Node.js | 122 automated tests | ✅ |
| Browser | 13 tests + panel rendering | ✅ |
| HBuilderX | uni-app build & run | ✅ |
| Android Studio | Kotlin compilation | ✅ |
| Reasonix | Skill diagnosis + MCP calls | ✅ |
| HTML Viewer | WebView panel | ✅ |
| iOS (Xcode) | Swift compilation | ❓ Untested |

> 💡 iOS SDK is fully implemented, awaiting community verification or Xcode build. Full test report → [TEST.md](TEST.md)

---

## Unified Data Contract

All platform SDKs produce logs in the same format:

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

**This is the core value of BRS** — unified log format means SKILL.md diagnoses bugs from any platform without knowing the source.

---

## Project Structure

```
Bug-Report-Skill/
  index.js                  # JS logging lib (UMD)
  log-viewer.vue            # H5/Web log viewer (legacy)
  log-viewer-common.vue     # uni-app universal log viewer (legacy)
  log-viewer.html           # Cross-platform WebView panel (NEW v3.0)
  mcp-server.js             # MCP Server — AI protocol log query (NEW v3.0)
  AGENTS.md                 # AI Agent universal entry point
  SKILL.md                  # AI diagnosis skill spec (shared by all Agents)
  INSTALL.md                # AI auto-install guide
  README.md                 # This document (Chinese)
  README_EN.md              # English version
  android/                  # Android Studio Kotlin SDK
  ios/                      # iOS Swift SDK (SPM ready)
```

---

## License

MIT
