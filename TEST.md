# BRS v3.0 — 全栈测试方案

## 测试 1：JS SDK — Node.js 冒烟测试（⭐ 最优先，0 依赖立即跑）

```bash
cd d:\wanjie\Bug-Report-Skill
node test/smoke.js
```

预期输出：
```
PASS  [1/8] init() returns device info
PASS  [2/8] e() produces ERROR log
PASS  [3/8] w() produces WARN log
PASS  [4/8] info() produces INFO log
PASS  [5/8] query() filters by level
PASS  [6/8] query() filters by category
PASS  [7/8] exportLogs('text') produces formatted output
PASS  [8/8] stats() returns correct counts

All 8 tests passed. ✅
```

---

## 测试 2：ESM 导入 — Vite 兼容性测试

```bash
cd d:\wanjie\Bug-Report-Skill
node test/esm-test.mjs
```

预期输出：
```
PASS  ESM import works in Node.js module mode
PASS  init() works after ESM import
PASS  exportLogs() works after ESM import
```

---

## 测试 3：UMD globalThis — 白屏修复验证

```bash
cd d:\wanjie\Bug-Report-Skill
node test/globalThis-test.js
```

预期输出：
```
PASS  BugReport is defined on globalThis
PASS  BugReport.init() does not throw
PASS  CJS module.exports path sets globalThis.BugReport
```

---

## 测试 4：uni-app 编译测试（HBuilderX）

### 步骤

1. 打开 **HBuilderX**
2. 文件 → 打开目录 → 选择 `test/uni-app-demo/`
3. 工具栏点 **运行 → 运行到浏览器 → Chrome**（H5 测试）
4. 页面应该显示 BugReport Test，点 **Run All Tests** 按钮
5. 预期：全部 10 项 ✅ 通过
6. 点 **Open Log Viewer** → 打开暗色终端日志面板
7. 再试试 **运行 → 运行到手机或模拟器 → Android**（APP-PLUS 测试）

### 测试项目包含什么
- `App.vue` — `BR.init()` 初始化
- `pages/index/index.vue` — 10 项自动化测试 + 按钮
- `pages/debug-log/debug-log.vue` — 日志查看器
- `utils/bug-report.js` — BugReport 库

---

## 测试 5：Android Studio 编译测试

### 步骤

1. 打开 **Android Studio**
2. File → Open → 选择 `test/android-demo/`
3. 等待 Gradle sync 完成
4. 点击 **Run 'app'**（绿色三角形）
5. 选择模拟器或真机
6. App 启动后自动运行测试，预期全部 ✅
7. 点 **Open Log Viewer** 查看暗色终端日志面板
8. 另开终端运行 `adb logcat -s BugReport` 确认 AI 可读日志输出

### 测试项目包含什么
- `DemoApp.kt` — `BugReport.init(this)` 一行初始化
- `MainActivity.kt` — 自动化测试 + 按钮 + 查看器入口
- 依赖 `:bugreport` 库模块（指向 `../../android`）

---

## 测试 6：SKILL.md — Claude Code 触发测试

把 `SKILL.md` 复制到 Claude Code 的 skills 目录，然后依次测试：

| 输入 | 预期行为 |
|------|---------|
| `/bug-report` | Skill 激活 |
| "帮我排查这个错误" | Skill 激活 |
| "帮我安装这个 BugReport" | Claude 读取 INSTALL.md 自动安装 |

---

## 测试 7：INSTALL.md — 一键安装测试

在 Claude Code 中：
1. 输入 `https://github.com/Kepsilent/Bug-Report-Skill`
2. 然后说"帮我安装这个 BugReport 到我的项目"
3. 验证 Claude 是否正确检测了项目类型、复制了文件、添加了代码

---

## 测试 8：微信小程序适配器

```bash
node test/wx-adapter-test.js
```

预期输出：
```
PASS  BR.wx.req() wraps wx.request
PASS  BR.wx.get() shorthand works
PASS  BR.wx.post() shorthand works
```

---

## 测试总结清单

| # | 测试 | 平台 | 测试数 | 结果 |
|---|------|------|:---:|:---:|
| 1 | JS SDK 冒烟 | Node.js | 8 | ✅ |
| 2 | ESM 导入 | Node.js | 5 | ✅ |
| 3 | globalThis 白屏修复 | Node.js | 3 | ✅ |
| 4 | 微信小程序适配器 | Node.js | 6 | ✅ |
| 5 | 边界和异常测试 | Node.js | 50 | ✅ |
| 6 | 浏览器环境测试 | Browser | 13 | ✅ |
| 7 | **面包屑 (Breadcrumbs)** | Node.js | 9 | ✅ |
| 8 | **状态快照 (Snapshot)** | Node.js | 7 | ✅ |
| 9 | **隐私脱敏 (Sanitizer)** | Node.js | 9 | ✅ |
| 10 | **MCP Server** | Node.js | 4 | ✅ |
| 11 | MCP 真实调用 | BRS MCP | 2 | ✅ |
| 12 | Skill 诊断 | Reasonix | 5 阶段 | ✅ |
| 13 | uni-app 编译 | HBuilderX | 30+ | ✅ |
| 14 | Android 编译 | Android Studio | — | ✅ |
| 15 | HTML 面板 | Browser | — | ✅ |
| 16 | 一键安装 | Reasonix | — | ✅ |
| 17 | iOS 编译 | Xcode | — | ❓ 未测试 |

**总计：122/122 自动化测试通过 ✅ (Node.js) | 6/6 平台手动验证通过 ✅ | 1 项未测试 (iOS Xcode)**

> 💡 iOS SDK 代码已完整实现（Swift, Package.swift, SPM 就绪），但未在 Xcode 中编译验证。欢迎社区贡献者通过 PR 完成 iOS 测试。
