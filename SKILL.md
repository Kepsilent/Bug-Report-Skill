---
name: bug-report
description: >
  跨 Agent 万能 Bug 诊断技能。适用于 Claude Code / Reasonix / Cursor / Codex / Copilot / Windsurf / Gemini CLI / Cline 等。
  触发条件：用户说"报bug"、"有问题"、"出错了"、"崩溃"、"帮我排查"、
  "帮我看看这个错误"、"分析日志"、分享错误截图/消息、或任何异常行为描述。
  支持实时日志分析、代码追踪、性能诊断、修复建议。零手动接入网络监控，可嵌入任何项目使用。
 
 覆盖平台：uni-app / 微信小程序 / React Native / Capacitor / Cordova / 浏览器 / Node.js / Android 原生(Kotlin) / iOS 原生(Swift)
---

# BugReport — 全能 Bug 诊断技能

## 概述

这是一个**项目无关**的通用 Bug 诊断技能。无论你用什么框架（uni-app / Vue / React / 原生），
只要集成了 BugReport 日志库（本技能配套 `index.js`），本技能就能：

- 实时捕获并分析错误日志
- 追踪崩溃根因到具体代码行
- 诊断性能瓶颈
- 生成结构化 Bug 报告
- 自动提出修复方案

## 配套工具

本 Skill 自带两个配套文件：

| 文件 | 说明 |
|------|------|
| `index.js` | 零依赖通用日志库 (UMD, 12KB)，自动适配 uni-app / 微信小程序 / React Native / 浏览器 / Node |
| `log-viewer.vue` | H5/Web 日志查看器组件，VS Code 暗色终端风格 |
| `log-viewer-common.vue` | uni-app 通用日志查看器（H5 + 微信小程序 + APP-PLUS 条件编译） |
| `android/` | Android Studio 原生 Kotlin SDK（OkHttp 拦截器 + Logcat + LogViewerActivity） |

### 接入方式

将 `index.js` 复制到项目的 `src/utils/`，一行初始化即可获得自动日志采集、网络拦截、崩溃捕获：

```js
import BR from '@/utils/bug-report.js'
BR.init({ appName: '你的App', appVersion: '1.0.0' })
```

默认已开启的能力：
- 自动拦截全局 JS 崩溃
- 自动拦截未捕获的 Promise 异常
- **自动拦截所有 fetch 和 XMLHttpRequest 网络请求**（无需手动接入）
- 日志自动持久化到本地存储
- 性能追踪、生命周期监控

然后将 `log-viewer.vue` 注册为一个页面，即可在 App 内查看 IDE 风格的实时日志面板。

---

## Phase 1: 信息收集

根据用户描述的问题类型，收集对应信息。**不要逐条机械提问** — 用户一次性说了就提取，
只追问真正缺失的关键信息。

### 必收集字段

| 字段 | 说明 |
|------|------|
| 页面/功能 | 在哪个页面？做了什么操作？ |
| 现象 | 闪退？白屏？卡住？报错弹窗？无响应？ |
| 频率 | 必现 / 偶发 / 特定条件下 |
| 严重度 | Fatal(崩溃/不可用) / Error(核心功能异常) / Warn(部分异常) / Info(仅UI) |

### 平台检测

根据用户描述、日志格式或项目结构，自动识别运行平台：

| 信号 | 平台 | 日志获取方式 |
|------|------|-------------|
| `pages.json` / `manifest.json` / `#ifdef APP-PLUS` | uni-app (HBuilderX) | App 内 log-viewer 面板 → export |
| `wx.` API / WXML / `app.json` / `project.config.json` | 微信小程序 | `BR.wx.req()` 包装器 + 小程序内 viewer 页面 |
| `.kt` / `.java` / `build.gradle` / `adb logcat` | Android 原生 (Android Studio) | `adb logcat -s BugReport` 或 LogViewerActivity |
| `.swift` / Xcode 项目 / `Package.swift` | iOS 原生 | Xcode 控制台或 LogViewerController |
| `navigator.product === 'ReactNative'` | React Native | 同 JS 版，WebView 内 viewer |
| Edge Function 日志 / `Deno` 提及 | Supabase 后端 | 直接粘贴 Function logs |

### 日志获取

日志已自动采集到 App 本地。用户获取方式：
- App 内打开 BugReport 面板 → export → 复制粘贴
- 或用户直接粘贴终端/ADB logcat 输出
- 如有 JSON 导出文件，让用户提供
- **网络日志已是全自动的**，无需开发者在网络层做任何手动接入

---

## Phase 2: 日志分析

收到日志后，提取以下关键信息：

```
F (Fatal)  → 崩溃根因、异常堆栈
E (Error)  → 功能失败、网络超时
W (Warn)   → 潜在问题（慢请求、内存告警）
I (Info)   → 上下文线索（页面切换、网络变化）
D/V        → 追踪操作链路
```

### 日志格式识别

BugReport 支持多种日志来源，收到日志时首先识别格式：

| 格式 | 特征 | 解析方法 |
|------|------|---------|
| BugReport JSON | `"level"`, `"cat"`, `"levelLabel"`, `"device"` 字段 | 直接解析，所有字段已结构化 |
| BugReport Text | `BugReport Log Export` 头部 + `#ID E TIME CAT tag` | 按行解析，提取 ID/级别/分类/消息 |
| Android logcat | `E/TAG ( PID): message` 格式 | 正则 `^([VDIWEF])/(\S+)\s*\(\s*\d+\):\s*(.*)` |
| iOS os.Logger | `timestamp LEVEL Subsystem[pid:tid] message` | 正则解析时间戳和级别 |
| Node.js console | 混合格式，可能含 ANSI 颜色码 | 按 ERROR/WARN 关键词分层，尝试 JSON 解析 |

### 分析框架

1. **时间线重建** — 按 `#ID` 排列，还原用户操作路径；如果 `extra.breadcrumbs` 存在，优先用面包屑重建
2. **崩溃链追溯** — 找到第一个 ERROR/FATAL，向前搜索相关 WARN；检查 `extra.snapshot` 获取崩溃时刻的业务状态
3. **网络诊断** — 检查 NETWORK 类别：超时? 失败? 慢请求? URL 中敏感信息已被自动脱敏 (`***`)
4. **性能诊断** — 检查 PERF 类别：哪个操作慢? 内存压力?
5. **生命周期** — 检查前后台切换是否导致状态异常（面包屑会自动记录 lifecycle 事件）
6. **面包屑追踪** — 崩溃日志的 `extra.breadcrumbs` 包含崩溃前最近 50 步操作，可精确还原用户路径

---

## Phase 3: 代码追踪

根据日志中的 `page`、`tag`、`stack` 字段定位代码：

1. 搜索相关源文件（页面组件、utils、API 层）
2. 检查 `try/catch` 是否吞掉了错误
3. 检查异步操作是否有 timeout 保护
4. 检查 API 返回值是否做了 null 检查
5. 检查权限声明（AndroidManifest / manifest.json）
6. 检查条件编译代码（`#ifdef APP-PLUS` 等）

### 常见根因速查（通用）

| 症状 | 可能原因 |
|------|---------|
| `location is not defined` | uni-app dev 模式 bug，用 `plus.net.XMLHttpRequest` |
| `Network Error` | 超时未设、证书问题、代理失效 |
| 录音无响应 | 权限未声明、文件路径错误 |
| 白屏/空页面 | Vue 渲染异常被吞、数据格式不匹配 |
| 内存溢出 | 图片未释放、大文件未分片 |
| 评分 90+ 但静音 | 未做静音检测，RMS < 50 应判 0 分 |

### 平台特定根因速查

#### uni-app (HBuilderX)
| 症状 | 可能原因 |
|------|---------|
| `uni is not defined` | 非 uni-app 环境调用了 uni API |
| `plus is not defined` | H5 端使用了 App-Plus 专属 API |
| `getCurrentPages` 返回空 | 在 App.vue 的 onLaunch 中调用过早 |
| `hideLoading:fail toast can't be found` | 连续调用 showLoading/hideLoading 时序问题 |
| WebSocket 频繁断开 | APP-PLUS 后台运行时 WebSocket 被系统挂起 |

#### 微信小程序
| 症状 | 可能原因 |
|------|---------|
| `wx.request` 静默失败 | 服务器域名不在白名单中（需在 mp 后台配置） |
| 存储写入失败 | 单 key >1MB 或总存储 >10MB，需清理旧日志 |
| `wx.getSystemInfoSync` 报错 | 小程序基础库版本过低（需 >= 1.0.0） |
| 网络请求无法拦截 | `wx.request` 是 C++ 绑定不能 monkey-patch，需用 `BR.wx.req()` 包装 |
| `<web-view>` 内日志无法获取 | web-view 沙箱隔离，需通过 `postMessage` 桥接 |

#### Android 原生 (Kotlin)
| 症状 | 可能原因 |
|------|---------|
| `NetworkOnMainThreadException` | 主线程发起 HTTP 请求，需用协程/线程池 |
| `WindowManager$BadTokenException` | 在已销毁的 Activity 上弹 Dialog |
| `OutOfMemoryError` | Bitmap/大文件未回收，日志缓冲区过大 |
| `SecurityException` (存储权限) | Android 11+ 的 scoped storage，需声明 `MANAGE_EXTERNAL_STORAGE` |
| OkHttp 拦截器不生效 | 未使用 OkHttp 客户端，或自定义了 client builder |
| `adb logcat` 日志被截断 | logcat 单条消息限制 ~4KB，长 JSON 需分段输出 |

#### iOS 原生 (Swift)
| 症状 | 可能原因 |
|------|---------|
| ATS 阻止 HTTP 请求 | 需在 Info.plist 中配置 NSAppTransportSecurity |
| `NSInternalInconsistencyException` | AutoLayout 约束冲突 |
| URLProtocol 不拦截请求 | WKWebView 默认不走 URLSession，需私有 API |
| 后台任务被杀死 | iOS 后台限制，仅 30s 执行时间 |

#### 后端 (Supabase Edge Functions / Node)
| 症状 | 可能原因 |
|------|---------|
| Edge Function 超时 | 默认 30s 限制，需分块处理或改用异步 |
| `Cannot find module 'wx-server-sdk'` | 微信云函数依赖未安装，需 `npm install` |
| `Request path contains unescaped characters` | URL 包含中文或特殊字符未 encode |
| Supabase 连接超时 | 冷启动延迟，或数据库连接池耗尽 |

---

## Phase 4: 生成报告

写入项目 `bugs/` 目录，文件名格式: `YYYY-MM-DD-<slug>.md`

```markdown
# [Bug 标题 — 简短描述]

| 字段 | 值 |
|------|-----|
| **报告时间** | YYYY-MM-DD HH:MM |
| **严重程度** | Fatal / Error / Warn / Info |
| **状态** | Open / Verified / Fixed |
| **影响页面** | pages/xxx/xxx |
| **复现概率** | 必现 / 偶发 / 特定条件 |
| **设备** | (品牌 型号, OS 版本) |

## 问题描述
(用户角度：做了什么 → 期望什么 → 实际发生了什么)

## 复现步骤
1. 打开页面 xxx
2. 点击 xxx
3. 观察 xxx

## 日志分析
(粘贴关键日志片段，标注关键行)

## 代码分析
### 相关文件
- `src/pages/xxx/xxx.vue` — (说明)
- `src/utils/xxx.js` — (说明)

### 根因分析
(技术层面解释为什么会发生)

## 修复方案
### 方案
(具体改动描述)
### 影响范围
(哪些文件、是否影响其他功能)
### 风险等级
低 / 中 / 高
```

---

## Phase 5: 修复执行

如果根因明确且修复风险低（改动 < 3 个文件，不影响核心逻辑），主动提出：

> 根因：[一句话]。要直接修吗？改动范围：[文件列表]。

用户确认后直接修改代码，更新报告状态。

如果根因不明确，**不要强行修复** — 在报告中标记需要进一步排查，让用户收集更多日志。

---

## 网络诊断速查

| HTTP 状态 | 含义 | 排查方向 |
|-----------|------|---------|
| 401/403 | 认证失败 | Token 过期？签名错误？ |
| 404 | 资源不存在 | URL 路径错误？文件被删除？ |
| 413 | 请求体过大 | 音频文件太大？需压缩？ |
| 429 | 限流 | 请求太频繁，加节流 |
| 5xx | 服务端错误 | 查 Supabase / Edge Function 日志 |
| timeout | 超时 | 网络差？超时设太短？DNS 解析慢？ |

## 性能诊断速查

| 阈值 | 级别 | 排查方向 |
|------|------|---------|
| 视频加载 > 5s | WARN | 文件太大？CDN 慢？ |
| 网络请求 > 3s | WARN | 服务端慢？连接数过多？ |
| 网络请求 > 10s | ERROR | 几乎确定超时 |
| 录音 > 15s | WARN | 文件过大，考虑裁剪 |
| 评测 > 30s | ERROR | WS 断开？Edge Function 超时？ |
| 页面渲染 > 2s | WARN | 组件过多？图片未压缩？ |
