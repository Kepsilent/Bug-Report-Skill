<template>
  <div class="br-shell">
    <!-- Toolbar -->
    <div class="br-toolbar">
      <div class="br-tb-left">
        <span class="br-tb-title">BugReport</span>
        <span :class="['br-dot', errCount > 0 ? 'br-dot-err' : 'br-dot-ok']"></span>
        <span class="br-tb-stat">{{ errCount > 0 ? errCount + ' issues' : 'OK' }}</span>
      </div>
      <div class="br-tb-right">
        <button class="br-btn" @click="autoRefresh = !autoRefresh">
          {{ autoRefresh ? '|| pause' : '> live' }}
        </button>
        <button class="br-btn" @click="showExport = !showExport">export</button>
        <button class="br-btn" @click="showSearch = !showSearch">filter</button>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="br-stats">
      <span class="br-stat br-stat-e" @click="tab = 1">E:{{ errCount }}</span>
      <span class="br-stat br-stat-w" @click="tab = 2">W:{{ wrnCount }}</span>
      <span class="br-stat br-stat-n" @click="tab = 3">N:{{ netCount }}</span>
      <span class="br-stat br-stat-p" @click="tab = 4">P:{{ perfCount }}</span>
      <span class="br-stat br-stat-s">{{ fmtDur(stats.sessionMs) }}</span>
    </div>

    <!-- Filter bar -->
    <div class="br-filter" v-if="showSearch">
      <input
        class="br-input"
        v-model="searchText"
        placeholder="filter: tag, message, page, category..."
      />
      <button class="br-btn br-btn-sm" @click="searchText=''; showSearch=false">close</button>
    </div>

    <!-- Tabs -->
    <div class="br-tabs">
      <span :class="['br-tab', { on: tab===0 }]" @click="tab=0">
        all<span class="br-badge" v-if="allLogs.length">{{ allLogs.length }}</span>
      </span>
      <span :class="['br-tab br-tab-e', { on: tab===1 }]" @click="tab=1">
        errors<span class="br-badge br-badge-e" v-if="errCount">{{ errCount }}</span>
      </span>
      <span :class="['br-tab br-tab-w', { on: tab===2 }]" @click="tab=2">
        warnings<span class="br-badge br-badge-w" v-if="wrnCount">{{ wrnCount }}</span>
      </span>
      <span :class="['br-tab', { on: tab===3 }]" @click="tab=3">
        network<span class="br-badge" v-if="netCount">{{ netCount }}</span>
      </span>
      <span :class="['br-tab', { on: tab===4 }]" @click="tab=4">
        perf<span class="br-badge" v-if="perfCount">{{ perfCount }}</span>
      </span>
      <span :class="['br-tab', { on: tab===5 }]" @click="tab=5">
        crash<span class="br-badge br-badge-e" v-if="crashCount">{{ crashCount }}</span>
      </span>
    </div>

    <!-- Log list -->
    <div class="br-list" ref="listRef">
      <div
        v-for="log in filtered"
        :key="log.id"
        :class="['br-entry', 'br-lv-' + log.level]"
        @click="expand = expand === log.id ? -1 : log.id"
      >
        <!-- Row -->
        <div class="br-row">
          <span class="br-id">#{{ log.id }}</span>
          <span :class="['br-lv-badge', 'br-lv-bg-' + log.level]">{{ log.tagL }}</span>
          <span class="br-time">{{ fmtTime(log.ts) }}</span>
          <span class="br-cat">{{ log.cat }}</span>
          <span class="br-msg">{{ log.msg || log.tag }}</span>
          <span class="br-chev">{{ expand === log.id ? '▲' : '▼' }}</span>
        </div>

        <!-- Expanded detail -->
        <div class="br-detail" v-if="expand === log.id">
          <table class="br-meta">
            <tr><td class="br-meta-k">ID</td><td>{{ log.id }}</td></tr>
            <tr><td class="br-meta-k">Level</td><td>{{ log.tagN }}</td></tr>
            <tr><td class="br-meta-k">Category</td><td>{{ log.cat }}</td></tr>
            <tr><td class="br-meta-k">Tag</td><td>{{ log.tag }}</td></tr>
            <tr><td class="br-meta-k">Page</td><td>{{ log.page }}</td></tr>
            <tr><td class="br-meta-k">Time</td><td>{{ log.time }}</td></tr>
            <tr v-if="log.extra"><td class="br-meta-k">Data</td><td><code>{{ fmtExtra(log.extra) }}</code></td></tr>
          </table>
          <div class="br-msg-full" v-if="log.msg">{{ log.msg }}</div>
          <div class="br-stack" v-if="log.stack">
            <div class="br-stack-hd">Stack Trace</div>
            <pre class="br-stack-pre">{{ log.stack }}</pre>
          </div>
        </div>
      </div>

      <div class="br-empty" v-if="filtered.length === 0">
        {{ tab === 1 ? 'No errors.' : tab === 2 ? 'No warnings.' : 'No logs.' }}
      </div>
    </div>

    <!-- Status bar -->
    <div class="br-status">
      <span>{{ allLogs.length }} logs</span>
      <span>|</span>
      <span>{{ fmtDur(stats.sessionMs) }} uptime</span>
      <span>|</span>
      <span>{{ stats.device ? stats.device.model : '' }}</span>
      <span class="br-status-r">
        <button class="br-btn br-btn-sm" @click="doExport('text')">copy text</button>
        <button class="br-btn br-btn-sm" @click="doExport('json')">copy json</button>
        <button class="br-btn br-btn-sm br-btn-d" @click="doClear">clear</button>
      </span>
    </div>

    <!-- Export overlay -->
    <div class="br-overlay" v-if="showExport" @click="showExport=false">
      <div class="br-overlay-box" @click.stop>
        <div class="br-overlay-hd">Export Logs</div>
        <div class="br-overlay-opt" @click="doExport('text')">
          <span class="br-overlay-label">Text format</span>
          <span class="br-overlay-desc">Human-readable, suitable for pasting</span>
        </div>
        <div class="br-overlay-opt" @click="doExport('json')">
          <span class="br-overlay-label">JSON format</span>
          <span class="br-overlay-desc">Structured data for program analysis</span>
        </div>
        <div class="br-overlay-opt" @click="doExport('csv')">
          <span class="br-overlay-label">CSV format</span>
          <span class="br-overlay-desc">Spreadsheet-compatible table</span>
        </div>
        <div class="br-overlay-cancel" @click="showExport=false">Cancel</div>
      </div>
    </div>
  </div>
</template>

<script>
// ---- Props ----
// bridge: optional, a BugReport instance. If not provided, imports from '../index.js'

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
      return this.bridge || (typeof window !== 'undefined' && window.BugReport) || null
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
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard'))
      }
    },
    doClear() {
      if (!confirm('Clear all logs?')) return
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
  --font:   'SF Mono', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace;
  --sans:   -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;

  font-family: var(--sans);
  font-size: 12px;
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
  padding: 8px 16px;
  background: var(--bg1);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.br-tb-left  { display: flex; align-items: center; gap: 10px; }
.br-tb-title { font-weight: 700; font-size: 14px; color: #f0f6fc; }
.br-tb-stat  { font-size: 11px; color: var(--fg1); }
.br-tb-right { display: flex; gap: 6px; }

.br-dot {
  width: 8px; height: 8px; border-radius: 50%;
}
.br-dot-ok  { background: var(--green); }
.br-dot-err { background: var(--red); box-shadow: 0 0 6px rgba(248,81,73,0.5); }

/* ---- Buttons ---- */
.br-btn {
  background: var(--bg2);
  border: 1px solid var(--border);
  color: var(--fg0);
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  font-family: var(--sans);
}
.br-btn:hover   { background: #30363d; }
.br-btn-sm       { padding: 2px 8px; font-size: 10px; }
.br-btn-d        { color: var(--red); border-color: rgba(248,81,73,0.3); }
.br-btn-d:hover  { background: rgba(248,81,73,0.1); }

/* ---- Stats ---- */
.br-stats {
  display: flex;
  gap: 16px;
  padding: 6px 16px;
  background: var(--bg1);
  border-bottom: 1px solid var(--border);
  font-family: var(--font);
  font-size: 11px;
  flex-shrink: 0;
}
.br-stat   { cursor: pointer; color: var(--fg1); }
.br-stat-e { color: var(--red); }
.br-stat-w { color: var(--orange); }
.br-stat-n { color: var(--blue); }
.br-stat-p { color: var(--purple); }
.br-stat-s { color: var(--fg2); margin-left: auto; cursor: default; }

/* ---- Filter ---- */
.br-filter {
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  background: var(--bg1);
  border-bottom: 1px solid var(--border);
}
.br-input {
  flex: 1;
  background: var(--bg0);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 6px 12px;
  color: var(--fg0);
  font-size: 12px;
  font-family: var(--font);
  outline: none;
}
.br-input:focus { border-color: var(--blue); }
.br-input::placeholder { color: var(--fg2); }

/* ---- Tabs ---- */
.br-tabs {
  display: flex;
  gap: 2px;
  padding: 0 16px;
  background: var(--bg1);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  overflow-x: auto;
}
.br-tab {
  padding: 8px 14px;
  font-size: 11px;
  color: var(--fg1);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  transition: all 0.1s;
}
.br-tab:hover { color: var(--fg0); }
.br-tab.on    { color: #f0f6fc; border-bottom-color: var(--blue); }
.br-tab-e.on  { border-bottom-color: var(--red); }
.br-tab-w.on  { border-bottom-color: var(--orange); }
.br-badge {
  margin-left: 6px;
  background: var(--bg2);
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-family: var(--font);
}
.br-badge-e { background: rgba(248,81,73,0.2); color: var(--red); }
.br-badge-w { background: rgba(210,153,34,0.2); color: var(--orange); }

/* ---- List ---- */
.br-list {
  flex: 1;
  overflow-y: auto;
  font-family: var(--font);
}
.br-entry {
  border-bottom: 1px solid #161b22;
  cursor: pointer;
}
.br-entry:hover { background: #161b22; }
.br-lv-4, .br-lv-5 { border-left: 3px solid var(--red); background: rgba(248,81,73,0.04); }
.br-lv-3 { border-left: 3px solid var(--orange); background: rgba(210,153,34,0.03); }
.br-lv-2 { border-left: 3px solid transparent; }
.br-lv-0, .br-lv-1 { border-left: 3px solid transparent; opacity: 0.65; }

/* ---- Row ---- */
.br-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 6px 12px;
  font-size: 12px;
}

.br-id {
  color: var(--fg2);
  font-size: 10px;
  min-width: 44px;
  flex-shrink: 0;
}

.br-lv-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
  color: #fff;
  min-width: 16px;
  text-align: center;
  flex-shrink: 0;
}
.br-lv-bg-0, .br-lv-bg-1 { background: var(--bg2); color: var(--fg2); }
.br-lv-bg-2 { background: #1f6feb; }
.br-lv-bg-3 { background: #9e6a03; }
.br-lv-bg-4, .br-lv-bg-5 { background: #da3633; }

.br-time {
  color: var(--fg2);
  font-size: 11px;
  flex-shrink: 0;
  min-width: 72px;
}

.br-cat {
  color: var(--blue);
  background: rgba(88,166,255,0.08);
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 10px;
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
  font-size: 8px;
  flex-shrink: 0;
}

/* ---- Detail ---- */
.br-detail {
  padding: 10px 12px 12px 64px;
  border-top: 1px solid var(--border);
  font-size: 12px;
}

.br-meta {
  border-collapse: collapse;
  margin-bottom: 10px;
}
.br-meta td {
  padding: 2px 12px 2px 0;
  font-size: 11px;
}
.br-meta-k {
  color: var(--fg2);
  text-align: right;
  min-width: 60px;
}
.br-meta code {
  font-family: var(--font);
  font-size: 10px;
  color: var(--fg1);
  word-break: break-all;
}

.br-msg-full {
  background: var(--bg0);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 10px;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  margin-bottom: 10px;
}

.br-stack {
  margin-top: 8px;
}
.br-stack-hd {
  color: var(--red);
  font-size: 10px;
  font-weight: 600;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.br-stack-pre {
  background: var(--bg0);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 10px;
  font-family: var(--font);
  font-size: 10px;
  line-height: 1.45;
  color: var(--fg1);
  white-space: pre-wrap;
  word-break: break-all;
  overflow-x: auto;
  margin: 0;
}

/* ---- Empty ---- */
.br-empty {
  text-align: center;
  padding: 60px 20px;
  color: var(--fg2);
}

/* ---- Status bar ---- */
.br-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 16px;
  background: var(--blue);
  color: #fff;
  font-size: 11px;
  font-family: var(--font);
  flex-shrink: 0;
}
.br-status-r {
  margin-left: auto;
  display: flex;
  gap: 6px;
}
.br-status .br-btn {
  background: rgba(255,255,255,0.15);
  border-color: rgba(255,255,255,0.2);
  color: #fff;
}
.br-status .br-btn:hover { background: rgba(255,255,255,0.25); }
.br-status .br-btn-d { color: #ffb3b0; }

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
  max-width: 480px;
  background: var(--bg1);
  border: 1px solid var(--border);
  border-radius: 8px 8px 0 0;
  padding: 24px;
}
.br-overlay-hd {
  font-weight: 700;
  font-size: 14px;
  color: #f0f6fc;
  margin-bottom: 16px;
  text-align: center;
}
.br-overlay-opt {
  padding: 14px 12px;
  border-radius: 6px;
  cursor: pointer;
}
.br-overlay-opt:hover { background: var(--bg2); }
.br-overlay-label { display: block; font-size: 13px; font-weight: 600; color: var(--fg0); }
.br-overlay-desc  { display: block; font-size: 11px; color: var(--fg1); margin-top: 2px; }
.br-overlay-cancel {
  text-align: center;
  padding: 14px;
  color: var(--fg1);
  cursor: pointer;
  margin-top: 8px;
  font-size: 12px;
}
</style>
