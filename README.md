# Bug-Report-Skill

**Claude Code Skill — 全能 Bug 诊断与日志系统**

A Claude Code skill for comprehensive bug diagnosis, paired with a zero-dependency logging library that works in any JavaScript app — uni-app, React Native, Capacitor, Cordova, Vue, React, vanilla JS, Node.js. **Network requests are auto-captured — no manual wiring needed.**

```
E:3  W:12  N:45  P:5   36m uptime

all  errors(3)  warnings(12)  network(45)  perf(5)  crash(0)

#47 E 19:32:05.231 NETWORK net:err
     POST /api/evaluate-speech timeout (30s)
     STACK TRACE
     > at evaluate (speech-eval.js:142)
```

## What's Inside

| File | Purpose |
|------|---------|
| `SKILL.md` | **主文件** — Claude Code Skill 定义，安装到 `~/.claude/skills/bug-report/` |
| `index.js` | 配套 — 零依赖通用日志库 (UMD, 12KB)，自动适配 uni-app / React Native / Capacitor / 浏览器 / Node。**自动拦截 fetch 和 XHR** |
| `log-viewer.vue` | 配套 — IDE 暗色终端风日志查看器，VS Code 风格 |

## Install the Skill

```bash
# 1. Clone this repo
git clone https://github.com/Kepsilent/Bug-Report-Skill.git

# 2. Copy the skill to Claude Code
cp SKILL.md ~/.claude/skills/bug-report/SKILL.md

# 3. Copy the library to your project
cp index.js your-project/src/utils/bug-report.js
cp log-viewer.vue your-project/src/pages/debug-log.vue
```

## Use the Skill

In Claude Code, just type `/bug-report` or say "帮我排查这个错误" — the skill activates automatically.

## Use the Library

```js
import BR from './bug-report.js'

// One-line init — auto-captures crashes, promise errors, and ALL network requests
BR.init({ appName: 'MyApp', appVersion: '1.0.0' })

// Log anything
BR.info('page', 'Home loaded')
BR.w('render', 'Slow render: 2100ms')
BR.e('api', 'POST /login failed')

// Network requests are auto-captured via fetch/XHR interception (on by default)
// Just use fetch() or XMLHttpRequest as normal — BugReport logs every request automatically

// Performance tracing
BR.perf.start('loadData')
const ms = BR.perf.end('loadData')  // logs WARN if > 3s

// Real-time watch
BR.watch(log => { if (log.level >= 4) notify(log.msg) })

// Export all logs
BR.copyLogs()  // Promise<boolean>
```

## API Overview

### Levels
`V(0)` `D(1)` `I(2)` `W(3)` `E(4)` `F(5)`

### Categories
`CRASH` `NETWORK` `RENDER` `LIFECYCLE` `PERF` `STORAGE` `AUDIO` `VIDEO` `EVAL` `APP` `USER` `SYSTEM`

### Methods

| Group | Methods |
|-------|---------|
| Core | `init()` `v()` `d()` `info()` `w()` `e()` `f()` |
| Network | `net.req(method,url,status,dur,size)` `net.err()` `net.slow()` `net.timeout()` |
| Perf | `perf.start(name)` `perf.end(name,threshold?)` `perf.mark(name,ms)` |
| Lifecycle | `life.fg()` `life.bg()` `life.in_()` `life.out()` |
| Query | `query({level,cat,search,limit})` `stats()` `errCount()` `wrnCount()` |
| Export | `exportLogs('text'|'json'|'csv')` `copyLogs()` `clear()` |
| Watch | `watch(cb)` returns unsubscribe function |

## Log Viewer

Dark terminal theme. VS Code aesthetic. Zero emoji.

- Sequential `#ID` numbering
- Color-coded level badges (V/D/I/W/E/F)
- Monospace font (SF Mono / Cascadia Code)
- Expandable stack traces
- Network req details (method + status + duration + size)
- Performance timing
- Search/filter by level, category, keyword
- Export as Text / JSON / CSV

## Platform Support

| Platform | Auto-detected | Network Auto-Capture |
|----------|:---:|:---:|
| uni-app (Android/iOS) | Yes | Yes (WebView) |
| React Native | Yes | Yes |
| Capacitor / Cordova | Yes | Yes |
| Browser (Vue/React/vanilla) | Yes | Yes |
| Node.js | Yes | N/A (no fetch/XHR) |
| Custom | via `BR.adapter()` | — |

> Note: Pure native Android (Java/Kotlin) is not supported. This library targets JavaScript runtimes. For native Android, a Java port is planned separately.

## License

MIT
