# BugReport — Android SDK (Kotlin)

**一行初始化，万金油日志系统 — Android Studio 原生版**

## 安装

### 方式 1: 源码引入
将 `android/` 目录整个复制到你的 Android Studio 项目中作为 module：
```gradle
// settings.gradle.kts
include(":bugreport")
project(":bugreport").projectDir = File("path/to/bugreport/android")

// app/build.gradle.kts
implementation(project(":bugreport"))
```

### 方式 2: JitPack (WIP)
```gradle
repositories { maven { url = uri("https://jitpack.io") } }
dependencies { implementation("com.github.kepsilent:bugreport:2.1.0") }
```

## 使用

```kotlin
// 1. 在你的 Application 中一行初始化
class MyApp : Application() {
    override fun onCreate() {
        super.onCreate()
        BugReport.init(this)  // 就这一行
    }
}

// 2. 日志记录 — API 与 JS 版一致
BugReport.v("render", "Component mounted")
BugReport.d("data", "User data loaded")
BugReport.info("page", "Home page loaded")
BugReport.w("memory", "High memory usage: 85%")
BugReport.e("api", "POST /login failed")
BugReport.f("crash", "NullPointer in render")

// 3. 网络日志 — 自动拦截 OkHttp 请求
// 你的 OkHttpClient 自动被拦截，无需手动接入
BugReport.net.req("POST", "/api/login", 500, 1234, 0)
BugReport.net.err("/api/data", "Connection refused")

// 4. 性能追踪
BugReport.perf.start("loadData")
// ... 加载数据 ...
val ms = BugReport.perf.end("loadData")  // >3s 自动标 WARN

// 5. 查询日志
val errors = BugReport.query(minLevel = BugReport.LogLevel.ERROR.value)
val networkLogs = BugReport.query(cat = "NETWORK")
val stats = BugReport.stats()

// 6. 导出
val text = BugReport.exportLogs("text")   // 人类可读
val json = BugReport.exportLogs("json")   // 结构化
BugReport.copyLogs()                       // 一键复制到剪贴板

// 7. 打开内置 Log Viewer
startActivity(Intent(this, LogViewerActivity::class.java))
```

## 开发模式 vs 生产模式

| 特性 | 开发模式 (debuggable=true) | 生产模式 |
|------|--------------------------|---------|
| Logcat 输出 | ✅ `adb logcat -s BugReport` AI 可读 | ❌ 默认关闭 |
| 崩溃捕获 | ✅ 自动捕获并记录 | ✅ 自动捕获并记录 |
| 网络拦截 | ✅ OkHttp 自动拦截 | 按需配置 |
| 日志持久化 | ✅ SharedPreferences | ✅ SharedPreferences |

## 平台覆盖

与 JS 版共享统一的数据合约（LogEntry），SKILL.md 无需修改即可跨平台诊断。

## 许可证

MIT
