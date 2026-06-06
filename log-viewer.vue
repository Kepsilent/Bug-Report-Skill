<template>
  <div class="br-shell">
    <!-- Toolbar -->
    <div class="br-toolbar">
      <div class="br-tb-left">
        <span class="br-tb-title">BugReport</span>
        <span :class="['br-dot', errCount > 0 ? 'br-dot-err' : 'br-dot-ok']"></span>
        <span class="br-tb-stat">{{ errCount > 0 ? errCount + ' ' + t('status_issues') : t('status_ok') }}</span>
      </div>
      <div class="br-tb-right">
        <button class="br-btn" @click="autoRefresh = !autoRefresh">
          {{ autoRefresh ? t('btn_pause') : t('btn_live') }}
        </button>
        <button class="br-btn" @click="showExport = !showExport">{{ t('btn_export') }}</button>
        <button class="br-btn" @click="showSearch = !showSearch">{{ t('btn_filter') }}</button>
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
        :placeholder="t('search_placeholder')"
      />
      <button class="br-btn br-btn-sm" @click="searchText=''; showSearch=false">{{ t('btn_close') }}</button>
    </div>

    <!-- Tabs -->
    <div class="br-tabs">
      <span :class="['br-tab', { on: tab===0 }]" @click="tab=0">
        {{ t('tab_all') }}<span class="br-badge" v-if="allLogs.length">{{ allLogs.length }}</span>
      </span>
      <span :class="['br-tab br-tab-e', { on: tab===1 }]" @click="tab=1">
        {{ t('tab_errors') }}<span class="br-badge br-badge-e" v-if="errCount">{{ errCount }}</span>
      </span>
      <span :class="['br-tab br-tab-w', { on: tab===2 }]" @click="tab=2">
        {{ t('tab_warnings') }}<span class="br-badge br-badge-w" v-if="wrnCount">{{ wrnCount }}</span>
      </span>
      <span :class="['br-tab', { on: tab===3 }]" @click="tab=3">
        {{ t('tab_network') }}<span class="br-badge" v-if="netCount">{{ netCount }}</span>
      </span>
      <span :class="['br-tab', { on: tab===4 }]" @click="tab=4">
        {{ t('tab_perf') }}<span class="br-badge" v-if="perfCount">{{ perfCount }}</span>
      </span>
      <span :class="['br-tab', { on: tab===5 }]" @click="tab=5">
        {{ t('tab_crash') }}<span class="br-badge br-badge-e" v-if="crashCount">{{ crashCount }}</span>
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
          <span :class="['br-lv-badge', 'br-lv-bg-' + log.level]">{{ log.levelLabel }}</span>
          <span class="br-time">{{ fmtTime(log.ts) }}</span>
          <span class="br-cat">{{ log.cat }}</span>
          <span class="br-msg">{{ log.msg || log.tag }}</span>
          <span class="br-chev">{{ expand === log.id ? '▲' : '▼' }}</span>
        </div>

        <!-- Expanded detail -->
        <div class="br-detail" v-if="expand === log.id">
          <table class="br-meta">
            <tr><td class="br-meta-k">{{ t('detail_id') }}</td><td>{{ log.id }}</td></tr>
            <tr><td class="br-meta-k">{{ t('detail_level') }}</td><td>{{ log.levelName }}</td></tr>
            <tr><td class="br-meta-k">{{ t('detail_category') }}</td><td>{{ log.cat }}</td></tr>
            <tr><td class="br-meta-k">{{ t('detail_tag') }}</td><td>{{ log.tag }}</td></tr>
            <tr><td class="br-meta-k">{{ t('detail_page') }}</td><td>{{ log.page }}</td></tr>
            <tr><td class="br-meta-k">{{ t('detail_time') }}</td><td>{{ log.time }}</td></tr>
            <tr v-if="log.extra"><td class="br-meta-k">{{ t('detail_data') }}</td><td><code>{{ fmtExtra(log.extra) }}</code></td></tr>
          </table>
          <div class="br-msg-full" v-if="log.msg">{{ log.msg }}</div>
          <div class="br-stack" v-if="log.stack">
            <div class="br-stack-hd">{{ t('stack_trace') }}</div>
            <pre class="br-stack-pre">{{ log.stack }}</pre>
          </div>
        </div>
      </div>

      <div class="br-empty" v-if="filtered.length === 0">
        {{ tab === 1 ? t('empty_errors') : tab === 2 ? t('empty_warnings') : t('empty_all') }}
      </div>
    </div>

    <!-- Status bar -->
    <div class="br-status">
      <span>{{ allLogs.length }} {{ t('status_logs') }}</span>
      <span>|</span>
      <span>{{ t('status_uptime') }} {{ fmtDur(stats.sessionMs) }}</span>
      <span>|</span>
      <span>{{ stats.device ? stats.device.model : '' }}</span>
      <span class="br-status-r">
        <button class="br-btn br-btn-sm" @click="doExport('text')">{{ t('btn_copy_text') }}</button>
        <button class="br-btn br-btn-sm" @click="doExport('json')">{{ t('btn_copy_json') }}</button>
        <button class="br-btn br-btn-sm br-btn-d" @click="doClear">{{ t('btn_clear') }}</button>
      </span>
    </div>

    <!-- Export overlay -->
    <div class="br-overlay" v-if="showExport" @click="showExport=false">
      <div class="br-overlay-box" @click.stop>
        <div class="br-overlay-hd">{{ t('export_title') }}</div>
        <div class="br-overlay-opt" @click="doExport('text')">
          <span class="br-overlay-label">{{ t('export_text_label') }}</span>
          <span class="br-overlay-desc">{{ t('export_text_desc') }}</span>
        </div>
        <div class="br-overlay-opt" @click="doExport('json')">
          <span class="br-overlay-label">{{ t('export_json_label') }}</span>
          <span class="br-overlay-desc">{{ t('export_json_desc') }}</span>
        </div>
        <div class="br-overlay-opt" @click="doExport('csv')">
          <span class="br-overlay-label">{{ t('export_csv_label') }}</span>
          <span class="br-overlay-desc">{{ t('export_csv_desc') }}</span>
        </div>
        <div class="br-overlay-cancel" @click="showExport=false">{{ t('export_cancel') }}</div>
      </div>
    </div>
  </div>
</template>

<script>
// BugReport Log Viewer — H5/Web version (i18n: zh-CN / en)

var T = {
  zh: {
    status_ok: '正常', status_issues: '个问题',
    btn_pause: '|| 暂停', btn_live: '> 实时',
    btn_export: '导出', btn_filter: '筛选', btn_close: '关闭',
    tab_all: '全部', tab_errors: '错误', tab_warnings: '警告',
    tab_network: '网络', tab_perf: '性能', tab_crash: '崩溃',
    search_placeholder: '搜索：标签、消息、页面、分类...',
    detail_id: 'ID', detail_level: '级别', detail_category: '分类',
    detail_tag: '标签', detail_page: '页面', detail_time: '时间', detail_data: '数据',
    stack_trace: '堆栈追踪',
    empty_errors: '暂无错误。', empty_warnings: '暂无警告。', empty_all: '暂无日志。',
    status_logs: '条日志', status_uptime: '运行时长',
    btn_copy_text: '复制文本', btn_copy_json: '复制JSON', btn_clear: '清空',
    export_title: '导出日志',
    export_text_label: '文本格式', export_text_desc: '可读文本，适合粘贴分享',
    export_json_label: 'JSON格式', export_json_desc: '结构化数据，适合程序分析',
    export_csv_label: 'CSV格式', export_csv_desc: '电子表格兼容格式',
    export_cancel: '取消',
    copied: '已复制到剪贴板',
    dialog_clear_content: '确定清空所有日志吗？'
  },
  en: {
    status_ok: 'OK', status_issues: 'issues',
    btn_pause: '|| pause', btn_live: '> live',
    btn_export: 'export', btn_filter: 'filter', btn_close: 'close',
    tab_all: 'all', tab_errors: 'errors', tab_warnings: 'warnings',
    tab_network: 'network', tab_perf: 'perf', tab_crash: 'crash',
    search_placeholder: 'filter: tag, message, page, category...',
    detail_id: 'ID', detail_level: 'Level', detail_category: 'Category',
    detail_tag: 'Tag', detail_page: 'Page', detail_time: 'Time', detail_data: 'Data',
    stack_trace: 'Stack Trace',
    empty_errors: 'No errors.', empty_warnings: 'No warnings.', empty_all: 'No logs.',
    status_logs: 'logs', status_uptime: 'uptime',
    btn_copy_text: 'copy text', btn_copy_json: 'copy json', btn_clear: 'clear',
    export_title: 'Export Logs',
    export_text_label: 'Text format', export_text_desc: 'Human-readable, suitable for pasting',
    export_json_label: 'JSON format', export_json_desc: 'Structured data for program analysis',
    export_csv_label: 'CSV format', export_csv_desc: 'Spreadsheet-compatible table',
    export_cancel: 'Cancel',
    copied: 'Copied to clipboard',
    dialog_clear_content: 'Clear all logs?'
  }
}

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
      stats: { sessionMs: 0, device: {} },
      lang: 'en'
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
    t(key) { return (T[this.lang] || T.en)[key] || key },
    detectLang() {
      var loc = (typeof navigator !== 'undefined' && navigator.language) || ''
      this.lang = String(loc).toLowerCase().startsWith('zh') ? 'zh' : 'en'
    },
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
      var vm = this
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function() { alert(vm.t('copied')) })
      }
    },
    doClear() {
      if (!confirm(this.t('dialog_clear_content'))) return
      const BR = this.getBR()
      if (BR) BR.clear()
      this.refresh()
    }
  },
  mounted() {
    this.detectLang()
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
