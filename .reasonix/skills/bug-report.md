---
name: bug-report
description: 全能 Bug 诊断技能 — 5 阶段：收集→分析→追踪→报告→修复。覆盖 uni-app / 微信小程序 / Android / iOS / React Native / Node
runAs: subagent
allowed-tools: read_file, grep, glob, bash, edit_file, write_file, ls, delete_range, delete_symbol, multi_edit, web_fetch
---

# BugReport — 全能 Bug 诊断技能 (Reasonix 版)

## 工作方式

**项目根目录的 `SKILL.md` 是本技能的完整规范定义。** 每次被调用时，先读取它获取完整的 Phase 1-5 流程。

1. 第一件事：读取 `SKILL.md` 了解完整诊断流程
2. 根据用户描述的问题，按 SKILL.md 的 5 个 Phase 执行
3. 所有 Phase 细节（格式识别、平台特有问题、报告模板等）都在 SKILL.md 中

## SDK 安装

如果用户说 "安装 BugReport" / "帮我装" / "接入 BugReport" 等，读取 `INSTALL.md` 并按 Step 0-6 执行安装（含检测平台、复制文件、注册路由、安装本 Skill）。

所有 Agent 通过本项目的 `AGENTS.md` → `INSTALL.md` 自动发现安装流程。`SKILL.md` 是诊断规范的唯一真相源。

## 快速入口

### 触发条件
用户说类似以下内容时激活：
- "报bug" / "有问题" / "出错了" / "崩溃"
- "帮我排查" / "帮我看看这个错误"
- "分析日志"
- 分享错误截图/消息
- 任何异常行为描述
- `/bug-report`

### Phase 概览（详细步骤见 SKILL.md）

1. **信息收集** — 自动检测平台（uni-app/微信/Android/iOS/Node），获取日志
2. **日志分析** — 识别格式（BugReport JSON / logcat / os.Logger），分析时间线/崩溃链/网络/性能
3. **代码追踪** — 根据 stack/page 定位源文件，检查常见根因
4. **生成报告** — 写入项目 `bugs/` 目录，结构化 Markdown
5. **修复执行** — 根因明确且风险低时直接改代码

### 重要原则
- 不要逐条机械提问 — 用户一次性说了就提取，只追问真正缺失的关键信息
- 根因不明确时不要强行修复 — 在报告中标记需要进一步排查
- 所有日志格式细节、平台特定问题、报告模板都在 SKILL.md 中
