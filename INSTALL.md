# INSTALL.md — Claude Code 安装指令

> 给 Claude 看的：当用户提供 GitHub 链接 `https://github.com/Kepsilent/Bug-Report-Skill` 并要求安装时，按以下流程自动执行。

**用户操作流程：**
1. 用户把 GitHub 链接发给 Claude
2. 用户说"帮我安装这个 BugReport 到我的项目"
3. Claude 读取此 INSTALL.md，按下面步骤执行

---

## Step 0: 检测项目类型

先检查用户项目根目录的标识文件：

| 标识文件 | 项目类型 | 跳转到 |
|---------|---------|--------|
| `manifest.json` + `pages.json` | uni-app (HBuilderX) | Step 1 |
| `build.gradle.kts` + `AndroidManifest.xml` | Android Studio | Step 2 |
| `app.json` + `project.config.json`（无 manifest.json） | 微信小程序（纯） | Step 3 |
| `package.json` 含 `react-native` | React Native | Step 4 |
| `package.json` 或 `index.html`（不匹配以上） | 普通 JS/Web | Step 5 |
| 无法识别 | — | 问用户用什么框架 |

---

## Step 1: uni-app (HBuilderX)

### 1.1 复制文件
```bash
# 从 BugReport 仓库复制 JS 日志库
cp index.js 用户项目/src/utils/bug-report.js

# 复制 uni-app 通用日志查看器
cp log-viewer-common.vue 用户项目/src/pages/debug-log.vue
```

### 1.2 修改 App.vue — 添加初始化
在 `<script>` 顶部添加 import：
```js
import BR from '@/utils/bug-report.js'
```

在 `onLaunch()` 或 `mounted()` 第一个可执行位置添加：
```js
BR.init({
  appName: '替换为App名称',
  appVersion: '1.0.0',
  captureNetwork: true  // 自动拦截网络请求
})
```

### 1.3 修改 pages.json — 注册 log-viewer 页面
在 `pages` 数组中添加：
```json
{
  "path": "pages/debug-log",
  "style": { "navigationBarTitleText": "BugReport" }
}
```

### 1.4 验证
编译运行后检查：
- 控制台出现 `BugReport v2.1 initialized`
- 打开 `/pages/debug-log` 看到暗色终端风格日志面板
- 发起网络请求后，面板 NETWORK tab 有自动日志

---

## Step 2: Android Studio (Kotlin)

### 2.1 复制 SDK
```bash
# 将 android/ 目录复制到用户项目根目录
cp -r android/ 用户项目/bugreport/
```

### 2.2 修改 settings.gradle.kts
添加 module：
```kotlin
include(":bugreport")
```

### 2.3 修改 app/build.gradle.kts
添加依赖：
```kotlin
implementation(project(":bugreport"))
```

### 2.4 修改 Application.onCreate()
找到用户项目的 `Application` 子类（如 `MyApp.kt`），在 `onCreate()` 中添加：
```kotlin
BugReport.init(this) { cfg ->
    cfg.appName = "替换为App名称"
    cfg.appVersion = "1.0.0"
}
```

### 2.5 注册 LogViewerActivity
在 `AndroidManifest.xml` 中添加：
```xml
<activity android:name="com.bugreport.viewer.LogViewerActivity"
    android:theme="@style/Theme.AppCompat.NoActionBar" />
```

### 2.6 验证
- `adb logcat -s BugReport` 看到日志输出
- 编译运行，触发 Error 后打开 LogViewerActivity 看到日志列表

---

## Step 3: 微信小程序（纯）

### 3.1 复制文件
```bash
cp index.js 用户项目/utils/bug-report.js
cp log-viewer-common.vue 用户项目/pages/debug-log/debug-log.vue
```

### 3.2 修改 app.js
在顶部添加：
```js
const BR = require('./utils/bug-report.js')
```

在 `onLaunch()` 中添加：
```js
BR.init({ appName: '替换为App名称', appVersion: '1.0.0' })
```

### 3.3 修改 app.json
在 `pages` 数组中添加：
```
"pages/debug-log/debug-log"
```

### 3.4 网络接入（重要！）
微信小程序的 `wx.request` 不能被自动拦截。需要手动用 `BR.wx.req()` 替代：
```js
// 替换前
wx.request({ url: '...', success: fn })
// 替换后
BR.wx.req({ url: '...', success: fn })
```

### 3.5 验证
- 控制台出现 `BugReport v2.1 initialized`
- debug-log 页面正常显示日志

---

## Step 4: React Native

### 4.1 复制文件
```bash
cp index.js 用户项目/src/utils/bug-report.js
```

### 4.2 修改 App.tsx
在顶部导入并初始化：
```ts
import { BugReport } from './src/utils/bug-report'
// 在 App 组件挂载时
useEffect(() => {
  BugReport.init({ appName: '替换', appVersion: '1.0.0' })
}, [])
```

### 4.3 网络
RN 的 fetch 在 WebView 内可被自动 patch。如需原生网络拦截，考虑使用 RN 桥接或手动调用 `BR.net.req()`。

### 4.4 验证
控制台出现 `BugReport v2.1 initialized`。

---

## Step 5: 普通 JS/Web

### 5.1 方式 A：npm（推荐）
```bash
npm install bugreport
```
```js
import BR from 'bugreport'
BR.init({ appName: 'MyApp' })
```

### 5.2 方式 B：直接复制
```bash
cp index.js 用户项目/src/bug-report.js
cp log-viewer.vue 用户项目/src/components/LogViewer.vue
```
```html
<script src="src/bug-report.js"></script>
<script>BugReport.init({ appName: 'MyApp' })</script>
```

### 5.3 验证
浏览器控制台出现 `BugReport v2.1 initialized`，`window.BugReport` 可用。

---

## Step 6: 安装 Skill（让 Claude 会诊断）

```bash
mkdir -p ~/.claude/skills/bug-report
cp SKILL.md ~/.claude/skills/bug-report/
```

验证：在 Claude Code 中说 `/bug-report` 或 "帮我排查这个错误"。

---

## 通用验证清单

安装完成后，逐项检查：

- [ ] `BR.init()` 调用不报错
- [ ] 控制台/logcat/Xcode 出现 `BugReport v2.1 initialized`
- [ ] `BR.e('test', 'verify install')` 产生一条 ERROR 日志
- [ ] `BR.query()` 返回刚写入的日志
- [ ] `BR.exportLogs('text')` 返回格式化文本
- [ ] log-viewer 页面可正常打开并显示日志列表
- [ ] 网络请求被自动拦截（非小程序平台）
