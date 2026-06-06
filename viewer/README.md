# BRS Log Viewer — 跨平台 WebView 集成指南

`log-viewer.html` 是纯 HTML + 原生 CSS 的日志查看器面板，Chrome DevTools 风格。
可在所有平台通过 WebView 加载使用。

## 使用方式

### 方式 1：浏览器直接打开
直接双击 `log-viewer.html` 或在浏览器中打开。通过 console 注入日志数据：
```js
BRSViewer.load([{id:1,ts:1717651200000,time:"2026-06-05T12:00:00.000Z",level:4,levelLabel:"E",levelName:"ERROR",cat:"NETWORK",tag:"net:err",msg:"Connection refused",stack:"",page:"pages/home",extra:null}])
```

### 方式 2：Android WebView
```kotlin
val webView = WebView(context)
webView.settings.javaScriptEnabled = true
webView.loadUrl("file:///android_asset/log-viewer.html")

// 从 BRS SDK 推送日志到 WebView
val json = BugReport.exportLogs("json")
webView.evaluateJavascript("BRSViewer.load($json)", null)
```

### 方式 3：iOS WKWebView
```swift
let webView = WKWebView()
webView.load(URLRequest(url: Bundle.main.url(forResource: "log-viewer", withExtension: "html")!))

// 推送日志
let json = BugReport.exportLogs("json")
webView.evaluateJavaScript("BRSViewer.load(\(json))")
```

### 方式 4：Electron
```js
// main process
const win = new BrowserWindow({...})
win.loadFile('log-viewer.html')
// renderer process
const BR = require('./bug-report')
win.webContents.executeJavaScript(`BRSViewer.load(${BR.exportLogs('json')})`)
```

## JS API

| 方法 | 说明 |
|------|------|
| `BRSViewer.load(logArray)` | 载入完整的日志 JSON 数组 |
| `BRSViewer.push(logObject)` | 追加单条日志 |
| `BRSViewer.clear()` | 清空日志 |

## 面板功能

- 6 级色标 (V/D/I/W/E/F)
- Tab 切换：All / Errors / Warnings / Network / Perf / Breadcrumbs
- 搜索过滤 + Category 筛选
- 点击行展开详情（含 stack、breadcrumbs、snapshot）
- Export Text + Copy to clipboard
- 响应式设计，移动端可用
