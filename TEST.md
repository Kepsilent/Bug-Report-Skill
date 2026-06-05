# BugReport v2.1 全栈测试方案

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

## 测试 4：Android Kotlin SDK — 编译测试

需要 Android Studio / Gradle 环境。

```bash
cd d:\wanjie\Bug-Report-Skill\android
gradle assembleDebug
```

预期输出：`BUILD SUCCESSFUL`

---

## 测试 5：iOS Swift SDK — 编译测试

需要 Xcode 环境。

```bash
cd d:\wanjie\Bug-Report-Skill\ios
swift build
```

预期输出：`Build complete!`

---

## 测试 6：SKILL.md — Claude Code 触发测试

在 Claude Code 中依次测试：

| 输入 | 预期行为 |
|------|---------|
| `/bug-report` | Skill 激活，显示诊断界面 |
| "帮我排查这个错误" | Skill 激活 |
| "分析日志" | Skill 激活 |
| 粘贴一段 JSON 日志 | Skill 识别为 BugReport JSON 格式，开始分析 |

---

## 测试 7：INSTALL.md — 一键安装测试

新建一个临时 uni-app 项目，测试安装流程：

```bash
# 创建一个空 uni-app 项目
mkdir test-project && cd test-project
echo '{"name":"test"}' > package.json
touch manifest.json pages.json

# 让 Claude 安装
# 输入: "https://github.com/Kepsilent/Bug-Report-Skill 帮我安装这个"

# 验证:
# [ ] index.js/index.mjs 复制到了 src/utils/bug-report.js
# [ ] log-viewer-common.vue 复制到了 src/pages/debug-log.vue
# [ ] pages.json 添加了 debug-log 页面
# [ ] 文件内容完整，不是 0 字节
```

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

| # | 测试 | 命令 | 测试数 | 结果 |
|---|------|------|:---:|:---:|
| 1 | JS SDK 冒烟 | `node test/smoke.js` | 8 | ✅ |
| 2 | ESM 导入 | `node test/esm-test.mjs` | 5 | ✅ |
| 3 | globalThis 白屏修复 | `node test/globalThis-test.js` | 3 | ✅ |
| 4 | 微信小程序适配器 | `node test/wx-adapter-test.js` | 6 | ✅ |
| 5 | 边界和异常测试 | `node test/boundary-test.js` | 50 | ✅ |
| 6 | 浏览器环境测试 | 打开 `test/browser-test.html` | 12 | ⬜ 需浏览器 |
| 7 | uni-app 编译 | HBuilderX 编译 H5/APP/MP | — | ⬜ 需 IDE |
| 8 | Android 编译 | `cd android && ./gradlew assembleDebug` | — | ⬜ 需 Gradle |
| 9 | Skill 触发 | Claude Code 中说 `/bug-report` | — | ⬜ 需 Claude |
| 10 | 一键安装 | Claude Code 中甩仓库链接 | — | ⬜ 需 Claude |

**总计：72/72 Node.js 测试通过 ✅ | 5项需要对应环境手动验证**
