---
name: bug-report
description: 全能 Bug 诊断技能 — 5 阶段：收集→分析→追踪→报告→修复。覆盖 uni-app / 微信小程序 / Android / iOS / React Native / Node
runAs: subagent
allowed-tools: read_file, grep, glob, bash, edit_file, write_file, ls, web_fetch
---

# BRS Bug 诊断技能

## 触发条件
用户说"报bug"、"有问题"、"出错了"、"崩溃"、"帮我排查"、"分析日志"、"/bug-report"时激活。

## 工作方式
本 Skill 自带完整诊断流程，不依赖外部文件。如果项目中有 `SKILL.md`（安装时已复制），优先读取其作为补充参考。

## SDK 安装
如果用户说 "安装 BRS" / "帮我装 BugReport" / "接入 BRS" 等，读取 `INSTALL.md` 并按 Step 0-6 执行安装。

## Phase 1: 信息收集
- 提取：页面/功能、现象（闪退/白屏/报错/卡住）、频率（必现/偶发）、严重度
- 自动检测平台：检查 manifest.json/pages.json → uni-app；build.gradle.kts → Android；app.json+project.config.json → 微信小程序；package.json 含 react-native → RN
- 日志获取：引导用户从 App 内 log-viewer 面板 Export，或粘贴 adb logcat / Xcode 输出

## Phase 2: 日志分析
- 格式识别：BRS JSON（含 "level"/"cat"/"levelLabel"/"device" 字段）、BRS Text（"BugReport Log Export" 头部）、logcat（"E/TAG (PID): msg"）、os.Logger
- 分析框架：时间线重建 → 崩溃链追溯（检查 extra.breadcrumbs 还原用户路径）→ 网络诊断（检查 NETWORK 类别超时/失败）→ 性能诊断（PERF 类别）→ 生命周期检查
- 敏感字段已脱敏为 ***，无需额外处理

## Phase 3: 代码追踪
- 根据 stack/page 定位源文件，检查 try/catch、null 检查、权限声明
- 平台常见问题：uni-app 的 plus is not defined / 小程序域名白名单 / Android NetworkOnMainThreadException / iOS ATS

## Phase 4: 生成报告
写入 bugs/YYYY-MM-DD-<slug>.md，包含：报告时间、严重程度、影响页面、复现步骤、日志分析、根因分析、修复方案、风险等级

## Phase 5: 修复执行
- 根因明确 + 改动 <3 文件 + 低风险 → 直接修改代码
- 根因不明确 → 标记需进一步排查，不强行修复

## 重要原则
- 不要逐条机械提问 — 用户一次性说了就提取，只追问真正缺失的关键信息
- 根因不明确时不要强行修复

完整规范参考：https://github.com/Kepsilent/Bug-Report-Skill/blob/main/SKILL.md
