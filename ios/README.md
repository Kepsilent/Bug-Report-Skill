# BugReport — iOS SDK (Swift)

**一行初始化，万金油日志系统 — iOS 原生版**

## 安装

### Swift Package Manager
```
https://github.com/Kepsilent/Bug-Report-Skill.git
```
添加 `BugReport` 到你的 target。

### 使用

```swift
// 1. 在 AppDelegate 或 App.init() 中一行初始化
BugReport.init_(appName: "声小言", appVersion: "1.0.0")

// 2. 日志记录 — API 与 JS/Kotlin 版一致
BugReport.v("render", "Component mounted")
BugReport.d("data", "User data loaded")
BugReport.info("page", "Home page loaded")
BugReport.w("memory", "High memory usage: 85%")
BugReport.e("api", "POST /login failed")
BugReport.f("crash", "NullPointer in render")

// 3. 网络日志 — 自动拦截 URLSession 请求
BugReport.net.req(method: "POST", url: "/api/login", status: 500, dur: 1234, size: 0)
BugReport.net.err(url: "/api/data", error: "Connection refused")

// 4. 性能追踪
BugReport.perf.start("loadData")
let ms = BugReport.perf.end("loadData")  // >3s 自动标 WARN

// 5. 查询日志
let errors = BugReport.query(minLevel: 4)
let stats = BugReport.stats()

// 6. 导出
let text = BugReport.exportLogs("text")   // 人类可读
let json = BugReport.exportLogs("json")   // 结构化
BugReport.copyLogs()                      // 一键复制

// 7. 打开内置 Log Viewer
let vc = LogViewerController()
navigationController?.pushViewController(vc, animated: true)
```

## 开发模式 vs 生产模式

| 特性 | DEBUG 构建 | RELEASE 构建 |
|------|-----------|-------------|
| os.Logger 输出 | ✅ Xcode 控制台 AI 可读 | ❌ 默认关闭 |
| 崩溃捕获 | ✅ 自动捕获 | ✅ 自动捕获 |
| 网络拦截 | ✅ URLProtocol 自动 | ✅ URLProtocol 自动 |
| 日志持久化 | ✅ UserDefaults | ✅ UserDefaults |

## 许可证
MIT
