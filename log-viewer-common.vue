<template>
  <view class="br-shell">
    <!-- Toolbar -->
    <view class="br-toolbar">
      <view class="br-tb-left">
        <text class="br-tb-title">BugReport</text>
        <view :class="['br-dot', errCount > 0 ? 'br-dot-err' : 'br-dot-ok']"></view>
        <text class="br-tb-stat">{{ errCount > 0 ? errCount + ' issues' : 'OK' }}</text>
      </view>
      <view class="br-tb-right">
        <view class="br-btn" @tap="autoRefresh = !autoRefresh">
          <text>{{ autoRefresh ? '|| pause' : '> live' }}</text>
        </view>
        <view class="br-btn" @tap="showExport = !showExport">
          <text>export</text>
        </view>
        <view class="br-btn" @tap="showSearch = !showSearch">
          <text>filter</text>
        </view>
      </view>
    </view>

    <!-- Quick Stats -->
    <view class="br-stats">
      <text class="br-stat br-stat-e" @tap="tab = 1">E:{{ errCount }}</text>
      <text class="br-stat br-stat-w" @tap="tab = 2">W:{{ wrnCount }}</text>
      <text class="br-stat br-stat-n" @tap="tab = 3">N:{{ netCount }}</text>
      <text class="br-stat br-stat-p" @tap="tab = 4">P:{{ perfCount }}</text>
      <text class="br-stat br-stat-s">{{ fmtDur(stats.sessionMs) }}</text>
    </view>

    <!-- Filter bar -->
    <view class="br-filter" v-if="showSearch">
      <input
        class="br-input"
        v-model="searchText"
        placeholder="filter: tag, message, page, category..."
      />
      <view class="br-btn br-btn-sm" @tap="searchText=''; showSearch=false">
        <text>close</text>
      </view>
    </view>

    <!-- Tabs -->
    <scroll-view class="br-tabs" scroll-x="true">
      <view :class="['br-tab', { on: tab===0 }]" @tap="tab=0">
        <text>all</text>
        <text class="br-badge" v-if="allLogs.length">{{ allLogs.length }}</text>
      </view>
      <view :class="['br-tab br-tab-e', { on: tab===1 }]" @tap="tab=1">
        <text>errors</text>
        <text class="br-badge br-badge-e" v-if="errCount">{{ errCount }}</text>
      </view>
      <view :class="['br-tab br-tab-w', { on: tab===2 }]" @tap="tab=2">
        <text>warnings</text>
        <text class="br-badge br-badge-w" v-if="wrnCount">{{ wrnCount }}</text>
      </view>
      <view :class="['br-tab', { on: tab===3 }]" @tap="tab=3">
        <text>network</text>
        <text class="br-badge" v-if="netCount">{{ netCount }}</text>
      </view>
      <view :class="['br-tab', { on: tab===4 }]" @tap="tab=4">
        <text>perf</text>
        <text class="br-badge" v-if="perfCount">{{ perfCount }}</text>
      </view>
      <view :class="['br-tab', { on: tab===5 }]" @tap="tab=5">
        <text>crash</text>
        <text class="br-badge br-badge-e" v-if="crashCount">{{ crashCount }}</text>
      </view>
    </scroll-view>

    <!-- Log list -->
    <scroll-view class="br-list" scroll-y="true">
      <view
        v-for="log in filtered"
        :key="log.id"
        :class="['br-entry', 'br-lv-' + log.level]"
        @tap="expand = expand === log.id ? -1 : log.id"
      >
        <!-- Row -->
        <view class="br-row">
          <text class="br-id">#{{ log.id }}</text>
          <text :class="['br-lv-badge', 'br-lv-bg-' + log.level]">{{ log.tagL }}</text>
          <text class="br-time">{{ fmtTime(log.ts) }}</text>
          <text class="br-cat">{{ log.cat }}</text>
          <text class="br-msg">{{ log.msg || log.tag }}</text>
          <text class="br-chev">{{ expand === log.id ? '▲' : '▼' }}</text>
        </view>

        <!-- Expanded detail -->
        <view class="br-detail" v-if="expand === log.id">
          <view class="br-meta">
            <view class="br-meta-row"><text class="br-meta-k">ID</text><text class="br-meta-v">{{ log.id }}</text></view>
            <view class="br-meta-row"><text class="br-meta-k">Level</text><text class="br-meta-v">{{ log.tagN }}</text></view>
            <view class="br-meta-row"><text class="br-meta-k">Category</text><text class="br-meta-v">{{ log.cat }}</text></view>
            <view class="br-meta-row"><text class="br-meta-k">Tag</text><text class="br-meta-v">{{ log.tag }}</text></view>
            <view class="br-meta-row"><text class="br-meta-k">Page</text><text class="br-meta-v">{{ log.page }}</text></view>
            <view class="br-meta-row"><text class="br-meta-k">Time</text><text class="br-meta-v">{{ log.time }}</text></view>
            <view class="br-meta-row" v-if="log.extra"><text class="br-meta-k">Data</text><text class="br-meta-v br-meta-code">{{ fmtExtra(log.extra) }}</text></view>
          </view>
          <view class="br-msg-full" v-if="log.msg"><text>{{ log.msg }}</text></view>
          <view class="br-stack" v-if="log.stack">
            <text class="br-stack-hd">Stack Trace</text>
            <view class="br-stack-pre"><text>{{ log.stack }}</text></view>
          </view>
        </view>
      </view>

      <view class="br-empty" v-if="filtered.length === 0">
        <text>{{ tab === 1 ? 'No errors.' : tab === 2 ? 'No warnings.' : 'No logs.' }}</text>
      </view>
    </scroll-view>

    <!-- Status bar -->
    <view class="br-status">
      <text>{{ allLogs.length }} logs</text>
      <text>|</text>
      <text>{{ fmtDur(stats.sessionMs) }} uptime</text>
      <text>|</text>
      <text>{{ stats.device ? stats.device.model : '' }}</text>
      <view class="br-status-r">
        <view class="br-btn br-btn-sm" @tap="doExport('text')"><text>copy text</text></view>
        <view class="br-btn br-btn-sm" @tap="doExport('json')"><text>copy json</text></view>
        <view class="br-btn br-btn-sm br-btn-d" @tap="doClear"><text>clear</text></view>
      </view>
    </view>

    <!-- Export overlay -->
    <view class="br-overlay" v-if="showExport" @tap="showExport=false">
      <view class="br-overlay-box" @tap.stop>
        <text class="br-overlay-hd">Export Logs</text>
        <view class="br-overlay-opt" @tap="doExport('text')">
          <text class="br-overlay-label">Text format</text>
          <text class="br-overlay-desc">Human-readable, suitable for pasting</text>
        </view>
        <view class="br-overlay-opt" @tap="doExport('json')">
          <text class="br-overlay-label">JSON format</text>
          <text class="br-overlay-desc">Structured data for program analysis</text>
        </view>
        <view class="br-overlay-opt" @tap="doExport('csv')">
          <text class="br-overlay-label">CSV format</text>
          <text class="br-overlay-desc">Spreadsheet-compatible table</text>
        </view>
        <view class="br-overlay-cancel" @tap="showExport=false"><text>Cancel</text></view>
      </view>
    </view>
  </view>
</template>

<script>
// BugReport Log Viewer — uni-app Common Version
// Works on: H5 / WeChat Mini Program / Android APP-PLUS / iOS APP-PLUS
// Usage: <BugReportViewer :bridge="BR" />
//        Falls back to window.BugReport or uni global

export default {
  name: 'BugReportViewer',
  props: {
    bridge: { type: Object, default: null }
  },
  data() {
    return {
      allLogs: [],
      tab: 0,
      expand: -1,
      searchText: '',
      showSearch: false,
      showExport: false,
      autoRefresh: true,
      errCount: 0,
      wrnCount: 0,
      netCount: 0,
      perfCount: 0,
      crashCount: 0,
      stats: { sessionMs: 0, device: {} }
    }
  },
  computed: {
    filtered() {
      let logs = this.allLogs.slice()
      switch (this.tab) {
        case 1: logs = logs.filter(l => l.level >= 4); break
        case 2: logs = logs.filter(l => l.level === 3); break
        case 3: logs = logs.filter(l => l.cat === 'NETWORK'); break
        case 4: logs = logs.filter(l => l.cat === 'PERF'); break
        case 5: logs = logs.filter(l => l.cat === 'CRASH'); break
      }
      if (this.searchText) {
        const s = this.searchText.toLowerCase()
        logs = logs.filter(l =>
          (l.msg||'').toLowerCase().indexOf(s)>=0 ||
          (l.tag||'').toLowerCase().indexOf(s)>=0 ||
          (l.page||'').toLowerCase().indexOf(s)>=0 ||
          (l.cat||'').toLowerCase().indexOf(s)>=0
        )
      }
      return logs
    }
  },
  methods: {
    getBR() {
      if (this.bridge) return this.bridge
      // #ifdef APP-PLUS
      // Try global (UMD sets globalThis.BugReport), then ESM import, then require
      if (typeof globalThis !== 'undefined' && globalThis.BugReport) return globalThis.BugReport
      try { return require('@/utils/bug-report.js') } catch(e) { /* fall through */ }
      // #endif
      // #ifdef H5
      if (typeof window !== 'undefined' && window.BugReport) return window.BugReport
      // #endif
      return null
    },
    refresh() {
      const BR = this.getBR()
      if (!BR) return
      this.allLogs = BR.query() || []
      this.errCount = BR.errCount()
      this.wrnCount = BR.wrnCount()
      this.netCount = (BR.query({cat:'NETWORK'})||[]).length
      this.perfCount = (BR.query({cat:'PERF'})||[]).length
      this.crashCount = (BR.query({cat:'CRASH'})||[]).length
      this.stats = BR.stats()
    },
    fmtTime(ts) {
      const d = new Date(ts)
      const pad = n => String(n).padStart(2,'0')
      return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + '.' + String(d.getMilliseconds()).padStart(3,'0')
    },
    fmtDur(ms) {
      if (!ms) return '0s'
      const h = Math.floor(ms / 3600000)
      const m = Math.floor((ms % 3600000) / 60000)
      const s = Math.floor((ms % 60000) / 1000)
      return (h ? h+'h ' : '') + (m ? m+'m ' : '') + s + 's'
    },
    fmtExtra(x) {
      try { return JSON.stringify(x) } catch(e) { return String(x) }
    },
    doExport(format) {
      this.showExport = false
      const BR = this.getBR()
      if (!BR) return
      const text = BR.exportLogs(format)
      // #ifdef H5
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard'))
      }
      // #endif
      // #ifndef H5
      // uni-app / WeChat — use platform clipboard
      // #ifdef MP-WEIXIN
      if (typeof wx !== 'undefined' && wx.setClipboardData) {
        wx.setClipboardData({ data: text, success() { wx.showToast({ title: 'Copied' }) } })
        return
      }
      // #endif
      uni.setClipboardData({
        data: text,
        success() { uni.showToast({ title: 'Copied', icon: 'none' }) },
        fail() { uni.showToast({ title: 'Copy failed', icon: 'none' }) }
      })
      // #endif
    },
    doClear() {
      // #ifdef H5
      if (!confirm('Clear all logs?')) return
      // #endif
      // #ifndef H5
      const that = this
      uni.showModal({
        title: 'Clear Logs',
        content: 'Clear all logs?',
        success(res) {
          if (!res.confirm) return
          that._doClear()
        }
      })
      return
      // #endif
      this._doClear()
    },
    _doClear() {
      const BR = this.getBR()
      if (BR) BR.clear()
      this.refresh()
    }
  },
  mounted() {
    this.refresh()
    const BR = this.getBR()
    if (BR) {
      this._unwatch = BR.watch(() => {
        if (this.autoRefresh) this.refresh()
      })
    }
  },
  beforeUnmount() {
    if (this._unwatch) this._unwatch()
  }
}
</script>

<style>
/* ============================================================
   BugReport Shell — Terminal/IDE Dark Theme
   Zero emoji · Monospace · Geek aesthetic
   Uni-app common version: rpx units, <view>/<text> elements
   ============================================================ */

.br-shell {
  --bg0:    #0d1117;
  --bg1:    #161b22;
  --bg2:    #21262d;
  --fg0:    #c9d1d9;
  --fg1:    #8b949e;
  --fg2:    #6e7681;
  --border: #30363d;
  --blue:   #58a6ff;
  --red:    #f85149;
  --orange: #d29922;
  --green:  #3fb950;
  --purple: #a371f7;

  font-size: 24rpx;
  line-height: 1.5;
  color: var(--fg0);
  background: var(--bg0);
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* ---- Toolbar ---- */
.br-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 32rpx;
  background: var(--bg1);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.br-tb-left  { display: flex; align-items: center; }
.br-tb-left > * { margin-right: 20rpx; }
.br-tb-left > *:last-child { margin-right: 0; }
.br-tb-title { font-weight: 700; font-size: 28rpx; color: #f0f6fc; }
.br-tb-stat  { font-size: 22rpx; color: var(--fg1); }
.br-tb-right { display: flex; }
.br-tb-right > * { margin-right: 12rpx; }
.br-tb-right > *:last-child { margin-right: 0; }

.br-dot {
  width: 16rpx; height: 16rpx; border-radius: 50%;
}
.br-dot-ok  { background: var(--green); }
.br-dot-err { background: var(--red); box-shadow: 0 0 12rpx rgba(248,81,73,0.5); }

/* ---- Buttons ---- */
.br-btn {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 8rpx;
  padding: 8rpx 24rpx;
}
.br-btn:active { background: #30363d; }
.br-btn text { font-size: 22rpx; color: var(--fg0); }
.br-btn-sm { padding: 4rpx 16rpx; }
.br-btn-sm text { font-size: 20rpx; }
.br-btn-d { border-color: rgba(248,81,73,0.3); }
.br-btn-d text { color: var(--red); }
.br-btn-d:active { background: rgba(248,81,73,0.1); }

/* ---- Stats ---- */
.br-stats {
  display: flex;
  padding: 12rpx 32rpx;
  background: var(--bg1);
  border-bottom: 1px solid var(--border);
  font-family: monospace;
  font-size: 22rpx;
  flex-shrink: 0;
}
.br-stats > * { margin-right: 32rpx; }
.br-stats > *:last-child { margin-right: 0; }
.br-stat   { color: var(--fg1); }
.br-stat-e { color: var(--red); }
.br-stat-w { color: var(--orange); }
.br-stat-n { color: var(--blue); }
.br-stat-p { color: var(--purple); }
.br-stat-s { color: var(--fg2); margin-left: auto; }

/* ---- Filter ---- */
.br-filter {
  display: flex;
  padding: 16rpx 32rpx;
  background: var(--bg1);
  border-bottom: 1px solid var(--border);
}
.br-input {
  flex: 1;
  background: var(--bg0);
  border: 1px solid var(--border);
  border-radius: 8rpx;
  padding: 12rpx 24rpx;
  color: var(--fg0);
  font-size: 24rpx;
  font-family: monospace;
  outline: none;
  margin-right: 16rpx;
}
.br-input:focus { border-color: var(--blue); }

/* ---- Tabs ---- */
.br-tabs {
  display: flex;
  flex-direction: row;
  padding: 0 32rpx;
  background: var(--bg1);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  white-space: nowrap;
}
.br-tab {
  padding: 16rpx 28rpx;
  font-size: 22rpx;
  color: var(--fg1);
  border-bottom: 4rpx solid transparent;
  white-space: nowrap;
  display: flex;
  flex-direction: row;
  align-items: center;
}
.br-tab.on    { color: #f0f6fc; border-bottom-color: var(--blue); }
.br-tab-e.on  { border-bottom-color: var(--red); }
.br-tab-w.on  { border-bottom-color: var(--orange); }
.br-badge {
  margin-left: 12rpx;
  background: var(--bg2);
  padding: 2rpx 12rpx;
  border-radius: 16rpx;
  font-size: 20rpx;
  font-family: monospace;
}
.br-badge-e { background: rgba(248,81,73,0.2); color: var(--red); }
.br-badge-w { background: rgba(210,153,34,0.2); color: var(--orange); }

/* ---- List ---- */
.br-list {
  flex: 1;
  overflow-y: auto;
  font-family: monospace;
}
.br-entry {
  border-bottom: 1px solid #161b22;
}
.br-entry:active { background: #161b22; }
.br-lv-4, .br-lv-5 { border-left: 6rpx solid var(--red); background: rgba(248,81,73,0.04); }
.br-lv-3 { border-left: 6rpx solid var(--orange); background: rgba(210,153,34,0.03); }
.br-lv-2 { border-left: 6rpx solid transparent; }
.br-lv-0, .br-lv-1 { border-left: 6rpx solid transparent; opacity: 0.65; }

/* ---- Row ---- */
.br-row {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  padding: 12rpx 24rpx;
  font-size: 24rpx;
}
.br-row > * { margin-right: 16rpx; }
.br-row > *:last-child { margin-right: 0; }

.br-id {
  color: var(--fg2);
  font-size: 20rpx;
  min-width: 88rpx;
  flex-shrink: 0;
}

.br-lv-badge {
  font-size: 20rpx;
  font-weight: 700;
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
  color: #fff;
  min-width: 32rpx;
  text-align: center;
  flex-shrink: 0;
}
.br-lv-bg-0, .br-lv-bg-1 { background: var(--bg2); color: var(--fg2); }
.br-lv-bg-2 { background: #1f6feb; }
.br-lv-bg-3 { background: #9e6a03; }
.br-lv-bg-4, .br-lv-bg-5 { background: #da3633; }

.br-time {
  color: var(--fg2);
  font-size: 22rpx;
  flex-shrink: 0;
  min-width: 144rpx;
}

.br-cat {
  color: var(--blue);
  background: rgba(88,166,255,0.08);
  padding: 2rpx 12rpx;
  border-radius: 6rpx;
  font-size: 20rpx;
  flex-shrink: 0;
}

.br-msg {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--fg0);
}

.br-chev {
  color: var(--fg2);
  font-size: 16rpx;
  flex-shrink: 0;
}

/* ---- Detail ---- */
.br-detail {
  padding: 20rpx 24rpx 24rpx 128rpx;
  border-top: 1px solid var(--border);
  font-size: 24rpx;
}

.br-meta-row {
  display: flex;
  flex-direction: row;
  padding: 4rpx 0;
}
.br-meta-k {
  color: var(--fg2);
  text-align: right;
  min-width: 120rpx;
  font-size: 22rpx;
  margin-right: 24rpx;
}
.br-meta-v {
  font-size: 22rpx;
  color: var(--fg0);
}
.br-meta-code {
  font-family: monospace;
  font-size: 20rpx;
  color: var(--fg1);
  word-break: break-all;
}

.br-msg-full {
  background: var(--bg0);
  border: 1px solid var(--border);
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 24rpx;
  line-height: 1.5;
  margin-top: 16rpx;
}
.br-msg-full text { white-space: pre-wrap; word-break: break-all; }

.br-stack {
  margin-top: 16rpx;
}
.br-stack-hd {
  color: var(--red);
  font-size: 20rpx;
  font-weight: 600;
  margin-bottom: 12rpx;
  text-transform: uppercase;
}
.br-stack-pre {
  background: var(--bg0);
  border: 1px solid var(--border);
  border-radius: 8rpx;
  padding: 20rpx;
  font-family: monospace;
  font-size: 20rpx;
  line-height: 1.45;
  color: var(--fg1);
}
.br-stack-pre text { white-space: pre-wrap; word-break: break-all; }

/* ---- Empty ---- */
.br-empty {
  text-align: center;
  padding: 120rpx 40rpx;
  color: var(--fg2);
}

/* ---- Status bar ---- */
.br-status {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 8rpx 32rpx;
  background: var(--blue);
  flex-shrink: 0;
}
.br-status > * { margin-right: 20rpx; }
.br-status > *:last-child { margin-right: 0; }
.br-status text { font-size: 22rpx; color: #fff; font-family: monospace; }
.br-status-r {
  margin-left: auto;
  display: flex;
  flex-direction: row;
}
.br-status-r > * { margin-right: 12rpx; }
.br-status-r > *:last-child { margin-right: 0; }
.br-status .br-btn {
  background: rgba(255,255,255,0.15);
  border-color: rgba(255,255,255,0.2);
}
.br-status .br-btn text { color: #fff; }
.br-status .br-btn:active { background: rgba(255,255,255,0.25); }
.br-status .br-btn-d text { color: #ffb3b0; }

/* ---- Overlay ---- */
.br-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 9999;
}
.br-overlay-box {
  width: 100%;
  background: var(--bg1);
  border: 1px solid var(--border);
  border-radius: 16rpx 16rpx 0 0;
  padding: 48rpx;
}
.br-overlay-hd {
  font-weight: 700;
  font-size: 28rpx;
  color: #f0f6fc;
  margin-bottom: 32rpx;
  text-align: center;
}
.br-overlay-opt {
  padding: 28rpx 24rpx;
  border-radius: 12rpx;
}
.br-overlay-opt:active { background: var(--bg2); }
.br-overlay-label { display: block; font-size: 26rpx; font-weight: 600; color: var(--fg0); }
.br-overlay-desc  { display: block; font-size: 22rpx; color: var(--fg1); margin-top: 4rpx; }
.br-overlay-cancel {
  text-align: center;
  padding: 28rpx;
  color: var(--fg1);
  margin-top: 16rpx;
  font-size: 24rpx;
}

/* ---- H5 overrides ---- */
/* #ifdef H5 */
.br-shell { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
.br-stats, .br-list, .br-input, .br-badge, .br-meta-code, .br-stack-pre, .br-status text { font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace; }
/* #endif */
</style>
