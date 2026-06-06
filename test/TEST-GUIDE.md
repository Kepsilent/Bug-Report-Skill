# BRS v3.0 — 全平台测试指南

> 每个平台独立验证，打开对应的测试项目，按指引操作。全部通过后再投入生产。

---

## 1. 🟢 Node.js（最快，0 秒启动）

```bash
cd test

# 逐一运行
node smoke.js          # 8 项 - 核心 API
node crumb-test.js     # 9 项 - 面包屑追踪
node snapshot-test.js  # 7 项 - 状态快照
node sanitizer-test.js # 9 项 - 隐私脱敏
node boundary-test.js  # 50 项 - 边界条件
node esm-test.mjs      # 5 项 - ESM 导入
node globalThis-test.js # 3 项 - 白屏修复
node wx-adapter-test.js # 6 项 - 微信适配器
node mcp-test.js       # 4 项 - MCP Server

# 或一键跑全部
for f in smoke.js crumb-test.js snapshot-test.js sanitizer-test.js boundary-test.js esm-test.mjs globalThis-test.js wx-adapter-test.js mcp-test.js; do echo "=== $f ===" && node $f && echo ""; done
```

**预期**：每个文件输出 "All XX tests passed. ✅" 或 "XX passed, 0 failed. ✅"

**总计**：101 项自动化测试

---

## 2. 🌐 浏览器（Web）

```
1. 用浏览器打开 test/browser-test.html
2. 点 "▶ Run All" 按钮
3. 看页面显示 — 全部 ✅ 即通过
4. 点 "📊 Open Viewer" 打开日志查看器
```

**预期**：26 项全部 ✅，查看器正常显示日志列表

也可以直接双击 `log-viewer.html` 打开跨平台可视化面板。

---

## 3. 📱 uni-app (HBuilderX) — ⭐ 最完整

```
1. 打开 HBuilderX
2. 文件 → 打开目录 → 选择 test/uni-app-demo/
3. 运行 → 运行到浏览器 → Chrome（先测 H5）
4. 页面显示 "✅ BRS loaded" 后，点 "▶ Run All Tests"
5. 所有测试项显示 ✅
6. 点 "📊 Open Log Viewer" 查看 BRS Log Viewer 面板
7. 查看器 Tab 切换：All / Errors / Warnings / Network / Perf / Breadcrumbs
8. 点某行日志展开详情 — 应有 stack、breadcrumbs、snapshot
9. 再试试 运行 → 运行到手机或模拟器 → Android（测 APP-PLUS）
```

**预期**：H5 和 Android 两个环境全部 ✅

---

## 4. 🤖 Android 原生 (Android Studio)

```
1. 打开 Android Studio
2. File → Open → 选择 test/android-demo/
3. 等待 Gradle sync 完成
4. 点击 Run 'app'（绿色三角形）
5. App 启动后自动运行测试
6. 点 "Open Log Viewer" 查看内置 LogViewerActivity
7. 开终端运行 adb logcat -s BugReport 看 AI 可读日志
```

**预期**：App 内全部 ✅，logcat 输出 `#1 INFO APP app:launch | BRS v3.0 initialized`

---

## 5. 🧠 Reasonix MCP 接入测试

在 Reasonix 项目中，确认 `reasonix.toml` 已配置：

```toml
[[plugins]]
name    = "brs"
command = "node"
args    = ["./mcp-server.js", "--dir", "./bugs/"]
```

重启 Reasonix，然后在对话中说：

```
查一下最近的崩溃日志
```

如果 MCP 接入成功，Reasonix 会调用 `search_logs` 工具返回结果。

也可以直接测试 MCP Server 连通性：

```bash
node mcp-test.js
```

**预期**：4/4 ✅

---

## 6. 🧪 Reasonix Skill 诊断测试

在安装了 BRS 的项目中：

```
/bug-report
```

或

```
帮我排查测试错误
```

**预期**：Skill 激活，进入 Phase 1 信息收集，询问平台和问题

---

## 7. 🍎 iOS 原生 (Xcode)

```
1. 打开 Xcode
2. 将 ios/ 目录的 Swift Package 添加到项目
3. 在 AppDelegate 中初始化：
   BugReport.init_(appName: "Test", appVersion: "1.0.0")
4. 编译运行到模拟器
5. Xcode 控制台出现 "BRS v3.0 initialized (iOS)"
```

---

## 📊 验证清单

| # | 平台 | 验证方式 | 测试数 | 结果 |
|---|------|---------|:---:|:---:|
| 1 | Node.js | `node test/*.js` | 101 | |
| 2 | 浏览器 | 打开 browser-test.html | 26 | |
| 3 | uni-app H5 | HBuilderX → Chrome | 30+ | |
| 4 | uni-app Android | HBuilderX → APK | 30+ | |
| 5 | Android 原生 | Android Studio → Run | 自动 | |
| 6 | Reasonix MCP | `node mcp-test.js` | 4 | |
| 7 | Reasonix Skill | 对话 `/bug-report` | 1 | |
| 8 | iOS 原生 | Xcode → Run | 手动 | |
| 9 | WebView 面板 | 打开 log-viewer.html | 1 | |

> **全部通过 = BRS v3.0 生产就绪。**
