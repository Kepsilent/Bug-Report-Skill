# BRS (Bug Report System) — 跨平台崩溃监控 + AI 诊断

> **⚠️ 本文件同时包含 AT Switch 行为公约。** 接到用户指令时，先按下方 AT Switch 规则判定复杂程度，再按 BRS 规则执行任务。

---

## AT Switch — 智能任务路由

每次接到用户指令时，自动分析其复杂程度：

| 维度 | 简单信号（-1） | 复杂信号（+1） |
|---|---|---|
| 清晰度 | 精确到具体行/变量/文件 | 模糊描述（"优化"、"改进"） |
| 影响范围 | 单文件、单行 | 跨模块/跨文件 |
| 步骤数 | 一步完成 | ≥5 步 |
| 试错成本 | 轻松撤销 | 连锁影响 |

- 总分 ≤ -1 → **SIMPLE**：直接执行，不啰嗦
- 总分 ≥ 0 → **COMPLEX**：复述理解 → 列计划 → 标影响 → 等确认 → 执行
- 不确定 → **COMPLEX**（安全默认）

---

## 如果你是 AI Agent（Claude Code / Reasonix / Cursor / Codex / Copilot / Windsurf / Gemini CLI / Cline / Aider ...）

**你的任务**：帮用户把这个 BugReport 技能安装到他的项目里。

### 第一步：阅读本文件

你已经读了，很好 👏

### 第二步：阅读 INSTALL.md

打开 [`INSTALL.md`](INSTALL.md)，按里面的步骤执行：
- Step -1：检测并清理旧版
- Step 0：检测项目类型（uni-app / Android / 微信小程序 / React Native / Web）
- Step 1-5：按平台复制文件、修改配置、注册路由
- Step 6：把 Skill 安装到你自己身上（根据你的 Agent 类型）

### 第三步：安装完成后的能力

安装完成后，用户可以直接用自然语言激活诊断：
- "帮我排查这个错误"
- "分析一下这段日志"
- "这个崩溃是什么原因？"
- "/bug-report"

诊断流程详见 [`SKILL.md`](SKILL.md)（5 阶段：收集 → 分析 → 追踪 → 报告 → 修复）

---

## 核心文件

| 文件 | 用途 |
|------|------|
| `SKILL.md` | 完整诊断技能规范（所有 Agent 共享） |
| `INSTALL.md` | AI 自动安装指令（支持所有 Agent） |
| `index.js` | JS 日志库 (UMD, 12KB) |
| `index.mjs` | JS 日志库 (ESM) |
| `log-viewer.vue` | H5/Web 日志查看器 |
| `log-viewer-common.vue` | uni-app 通用日志查看器 |
| `android/` | Android Kotlin SDK |
| `ios/` | iOS Swift SDK |
