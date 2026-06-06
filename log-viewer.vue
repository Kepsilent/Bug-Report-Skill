<template>
  <div class="br-shell">
    <!-- Toolbar -->
    <div class="br-toolbar">
      <div class="br-tb-left">
        <span class="br-tb-title">BRS</span>
        <span class="br-tb-ver">v3.0</span>
        <span :class="['br-dot', errCount > 0 ? 'br-dot-err' : 'br-dot-ok']"></span>
        <span class="br-tb-stat">{{ errCount > 0 ? errCount + ' ' + t('issues') : t('ok') }}</span>
      </div>
      <div class="br-tb-right">
        <button class="br-btn" @click="autoRefresh = !autoRefresh">{{ autoRefresh ? t('pause') : t('live') }}</button>
        <button class="br-btn" @click="showSearch = !showSearch">{{ t('filter') }}</button>
        <button class="br-btn" @click="showExport = !showExport">{{ t('export') }}</button>
      </div>
    </div>

    <!-- Collapsed bar (shown when tabs are hidden) -->
    <div class="br-collapsed-bar" v-if="tabsCollapsed" @click="tabsCollapsed = false">
      <span class="br-collapsed-title">{{ tabLabel() }}</span>
      <span class="br-collapsed-count">{{ allLogs.length }} {{ t('logs') }}</span>
      <span class="br-collapsed-chev">▼ {{ t('expand_filter') }}</span>
    </div>

    <!-- Quick Stats -->
    <div class="br-stats" v-if="!tabsCollapsed">
      <span class="br-stat br-stat-e" @click="tab = 1">{{ t('err') }}:{{ errCount }}</span>
      <span class="br-stat br-stat-w" @click="tab = 2">{{ t('warn') }}:{{ wrnCount }}</span>
      <span class="br-stat br-stat-n" @click="tab = 3">{{ t('net') }}:{{ netCount }}</span>
      <span class="br-stat br-stat-p" @click="tab = 4">{{ t('perf') }}:{{ perfCount }}</span>
      <span class="br-stat br-stat-b" @click="tab = 6">{{ t('crumb') }}:{{ crumbCount }}</span>
      <span class="br-stat br-stat-s">{{ fmtDur(stats.sessionMs) }}</span>
    </div>

    <!-- Filter bar -->
    <div class="br-filter" v-if="showSearch && !tabsCollapsed">
      <input class="br-input" v-model="searchText" :placeholder="t('search_ph')" />
      <button class="br-btn br-btn-sm" @click="searchText=''; showSearch=false">{{ t('close') }}</button>
    </div>

    <!-- Tabs -->
    <div class="br-tabs" v-if="!tabsCollapsed">
      <span :class="['br-tab', { on: tab===0 }]" @click="tabToggle(0)">{{ t('all') }}<span class="br-badge" v-if="allLogs.length">{{ allLogs.length }}</span></span>
content": "      <span :class="['br-tab br-tab-e', { on: tab===1 }]" @click="selectTab(1)">{{ t('errors') }}<span class="br-badge br-badge-e" v-if="errCount">{{ errCount }}</span></span>
      <span :class="['br-tab br-tab-w', { on: tab===2 }]" @click="selectTab(2)">{{ t('warnings') }}<span class="br-badge br-badge-w" v-if="wrnCount">{{ wrnCount }}</span></span>
      <span :class="['br-tab', { on: tab===3 }]" @click="selectTab(3)">{{ t('network') }}<span class="br-badge" v-if="netCount">{{ netCount }}</span></span>
      <span :class="['br-tab', { on: tab===4 }]" @click="selectTab(4)">{{ t('perf_tab') }}<span class="br-badge" v-if="perfCount">{{ perfCount }}</span></span>
      <span :class="['br-tab br-tab-e', { on: tab===5 }]" @click="selectTab(5)">{{ t('crash_tab') }}<span class="br-badge br-badge-e" v-if="crashCount">{{ crashCount }}</span></span>
      <span :class="['br-tab', { on: tab===6 }]" @click="selectTab(6)">{{ t('crumbs') }}<span class="br-badge" v-if="crumbCount">{{ crumbCount }}</span></span>
    </div>

    <!-- Log list -->
    <div class="br-list">
      <!-- Timeline mode for breadcrumb tab -->
      <div v-if="tab === 6">
        <div class="br-timeline" v-if="crumbTimeline.length">
          <div class="br-tl-entry" v-for="(c, i) in crumbTimeline" :key="'c'+i">
            <div class="br-tl-dot" :class="c.isError ? 'br-tl-dot-e' : ''"></div>
            <div class="br-tl-line" v-if="i < crumbTimeline.length - 1"></div>
            <div class="br-tl-body">
              <span class="br-tl-time">{{ fmtTime(c.ts || c.t) }}</span>
              <span class="br-tl-tag">{{ c.tag }}</span>
              <span class="br-tl-msg">{{ c.msg }}</span>
            </div>
          </div>
        </div>
        <div class="br-empty" v-else>{{ t('no_crumbs') }}</div>
      </div>

      <!-- Normal log list -->
      <div v-else>
        <div v-for="log in filtered" :key="log.id" :class="['br-entry', 'br-lv-' + log.level]" @click="expand = expand === log.id ? -1 : log.id">
          <div class="br-row">
            <span class="br-id">#{{ log.id }}</span>
            <span :class="['br-lv-badge', 'br-lv-bg-' + log.level]">{{ log.levelLabel }}</span>
            <span class="br-time">{{ fmtTime(log.ts) }}</span>
            <span class="br-cat" :class="'br-cat-' + (log.cat || '')">{{ log.cat }}</span>
            <span class="br-msg">{{ log.msg || log.tag }}</span>
            <span class="br-chev">{{ expand === log.id ? '▲' : '▼' }}</span>
          </div>

          <div class="br-detail" v-if="expand === log.id">
            <table class="br-meta">
              <tr><td class="br-meta-k">{{ t('d_id') }}</td><td>#{{ log.id }}</td></tr>
              <tr><td class="br-meta-k">{{ t('d_level') }}</td><td :class="'br-lv-' + log.levelLabel">{{ log.levelName }}</td></tr>
              <tr><td class="br-meta-k">{{ t('d_cat') }}</td><td>{{ log.cat }}</td></tr>
              <tr><td class="br-meta-k">{{ t('d_tag') }}</td><td>{{ log.tag }}</td></tr>
              <tr><td class="br-meta-k">{{ t('d_page') }}</td><td>{{ log.page || '—' }}</td></tr>
              <tr><td class="br-meta-k">{{ t('d_time') }}</td><td>{{ log.time }}</td></tr>
              <tr v-if="log.extra && log.extra.duration != null"><td class="br-meta-k">{{ t('d_dur') }}</td><td>{{ log.extra.duration }}ms</td></tr>
              <tr v-if="log.extra && log.extra.status != null"><td class="br-meta-k">{{ t('d_status') }}</td><td>{{ log.extra.status }}</td></tr>
              <tr v-if="log.extra && log.extra.url != null"><td class="br-meta-k">{{ t('d_url') }}</td><td>{{ log.extra.url }}</td></tr>
            </table>

            <div class="br-msg-full" v-if="log.msg && log.msg !== log.tag">{{ log.msg }}</div>

            <div class="br-stack" v-if="log.stack">
              <div class="br-stack-hd">{{ t('stack') }}</div>
              <pre class="br-stack-pre">{{ log.stack }}</pre>
            </div>

            <div class="br-section" v-if="log.extra && log.extra.breadcrumbs && log.extra.breadcrumbs.length">
              <div class="br-section-hd">{{ t('crumb_trail') }} ({{ log.extra.breadcrumbs.length }})</div>
              <div class="br-timeline br-timeline-sm">
                <div class="br-tl-entry" v-for="(c, i) in log.extra.breadcrumbs" :key="'bc'+i">
                  <div class="br-tl-dot br-tl-dot-sm"></div>
                  <div class="br-tl-line br-tl-line-sm" v-if="i < log.extra.breadcrumbs.length - 1"></div>
                  <div class="br-tl-body">
                    <span class="br-tl-tag">{{ c.tag }}</span>
                    <span class="br-tl-time" style="display:block;">{{ fmtTime(c.ts || c.t) }}</span>
                    <span class="br-tl-msg">{{ c.msg }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="br-section" v-if="log.extra && log.extra.snapshot">
              <div class="br-section-hd">{{ t('snapshot_data') }}</div>
              <pre class="br-stack-pre">{{ fmtExtra(log.extra.snapshot) }}</pre>
            </div>

            <div class="br-section" v-if="log.extra && hasOtherExtra(log.extra)">
              <div class="br-section-hd">{{ t('extra_data') }}</div>
              <pre class="br-stack-pre">{{ fmtExtra(log.extra) }}</pre>
            </div>
          </div>
        </div>

        <div class="br-empty" v-if="filtered.length === 0">
          {{ tab === 1 ? t('no_errors') : tab === 2 ? t('no_warns') : tab === 5 ? t('no_crashes') : t('no_logs') }}
        </div>
      </div>
    </div>

    <!-- Status bar -->
    <div class="br-status">
      <span>{{ allLogs.length }} {{ t('logs') }}</span>
      <span>|</span>
      <span>{{ t('uptime') }} {{ fmtDur(stats.sessionMs) }}</span>
      <span>|</span>
      <span>{{ stats.device ? (stats.device.brand + ' ' + stats.device.model) : '' }}</span>
      <div class="br-status-r">
        <button class="br-btn br-btn-sm" @click="doExport('text')">{{ t('copy_text') }}</button>
        <button class="br-btn br-btn-sm" @click="doExport('json')">{{ t('copy_json') }}</button>
        <button class="br-btn br-btn-sm br-btn-d" @click="doClear">{{ t('clear') }}</button>
      </div>
    </div>

    <!-- Export overlay -->
    <div class="br-overlay" v-if="showExport" @click="showExport=false">
      <div class="br-overlay-box" @click.stop>
        <div class="br-overlay-hd">{{ t('exp_title') }}</div>
        <div class="br-overlay-opt" @click="doExport('text')">
          <span class="br-overlay-label">{{ t('exp_text') }}</span>
          <span class="br-overlay-desc">{{ t('exp_text_desc') }}</span>
        </div>
        <div class="br-overlay-opt" @click="doExport('json')">
          <span class="br-overlay-label">{{ t('exp_json') }}</span>
          <span class="br-overlay-desc">{{ t('exp_json_desc') }}</span>
        </div>
        <div class="br-overlay-opt" @click="doExport('csv')">
          <span class="br-overlay-label">{{ t('exp_csv') }}</span>
          <span class="br-overlay-desc">{{ t('exp_csv_desc') }}</span>
        </div>
        <div class="br-overlay-cancel" @click="showExport=false">{{ t('cancel') }}</div>
      </div>
    </div>
  </div>
</template>

<script>
// ============================================================
// BRS Log Viewer — Web/H5 Version (i18n: zh-CN / en)
// ============================================================

var T = {
  zh: {
    ok: '正常', issues: '个问题',
    pause: '暂停', live: '实时', export: '导出', filter: '筛选', close: '关闭',
    all: '全部', errors: '错误', warnings: '警告', network: '网络',
    perf_tab: '性能', crash_tab: '崩溃', crumbs: '面包屑',
    err: 'E', warn: 'W', net: 'N', perf: 'P', crumb: 'C',
    search_ph: '搜索：标签、消息、页面、分类...',
    d_id: 'ID', d_level: '级别', d_cat: '分类', d_tag: '标签',
    d_page: '页面', d_time: '时间', d_dur: '耗时', d_status: '状态码', d_url: 'URL',
    stack: '堆栈追踪', crumb_trail: '面包屑追踪', snapshot_data: '状态快照', extra_data: '附加数据',
    no_errors: '暂无错误', no_warns: '暂无警告', no_crashes: '暂无崩溃',
    no_logs: '暂无日志', no_crumbs: '暂无面包屑数据',
    logs: '条日志', uptime: '运行时长',
    copy_text: '复制文本', copy_json: '复制JSON', clear: '清空',
    exp_title: '导出日志', exp_text: '文本格式', exp_text_desc: '可读文本，适合粘贴分享',
    exp_json: 'JSON格式', exp_json_desc: '结构化数据，适合程序分析',
    exp_csv: 'CSV格式', exp_csv_desc: '电子表格兼容格式',
    cancel: '取消',
    copied: '已复制到剪贴板', copy_failed: '复制失败',
    clear_title: '清空日志', clear_content: '确定清空所有日志吗？',
    expand_filter: '展开筛选栏'
  },
  en: {
    ok: 'OK', issues: 'issues',
    pause: 'Pause', live: 'Live', export: 'Export', filter: 'Filter', close: 'Close',
    all: 'All', errors: 'Errors', warnings: 'Warnings', network: 'Network',
    perf_tab: 'Perf', crash_tab: 'Crash', crumbs: 'Breadcrumbs',
    err: 'E', warn: 'W', net: 'N', perf: 'P', crumb: 'C',
    search_ph: 'Filter: tag, message, page, category...',
    d_id: 'ID', d_level: 'Level', d_cat: 'Category', d_tag: 'Tag',
    d_page: 'Page', d_time: 'Time', d_dur: 'Duration', d_status: 'Status', d_url: 'URL',
    stack: 'Stack Trace', crumb_trail: 'Breadcrumb Trail', snapshot_data: 'State Snapshot', extra_data: 'Extra Data',
    no_errors: 'No errors.', no_warns: 'No warnings.', no_crashes: 'No crashes.',
    no_logs: 'No logs.', no_crumbs: 'No breadcrumbs.',
    logs: 'logs', uptime: 'uptime',
    copy_text: 'Copy Text', copy_json: 'Copy JSON', clear: 'Clear',
    exp_title: 'Export Logs', exp_text: 'Text format', exp_text_desc: 'Human-readable, suitable for pasting',
    exp_json: 'JSON format', exp_json_desc: 'Structured data for AI analysis',
    exp_csv: 'CSV format', exp_csv_desc: 'Spreadsheet-compatible table',
    cancel: 'Cancel',
    copied: 'Copied to clipboard', copy_failed: 'Copy failed',
    clear_title: 'Clear Logs', clear_content: 'Clear all logs?',
    expand_filter: 'Expand Filters'
  }
}

export default {
  name: 'BRSViewer',
  data() {
    return {
      allLogs: [], tab: 0, expand: -1, searchText: '',
      showSearch: false, showExport: false, autoRefresh: true, tabsCollapsed: false,
      errCount: 0, wrnCount: 0, netCount: 0, perfCount: 0, crashCount: 0, crumbCount: 0,
      stats: { sessionMs: 0, device: {} },
      lang: 'zh'
    }
  },
  computed: {
    filtered() {
      var logs = this.allLogs.slice()
      if (this.tab === 1) { logs = logs.filter(l => l.level >= 4) }
      else if (this.tab === 2) { logs = logs.filter(l => l.level === 3) }
      else if (this.tab === 3) { logs = logs.filter(l => l.cat === 'NETWORK') }
      else if (this.tab === 4) { logs = logs.filter(l => l.cat === 'PERF') }
      else if (this.tab === 5) { logs = logs.filter(l => l.cat === 'CRASH') }
      if (this.searchText) {
        var s = this.searchText.toLowerCase()
        logs = logs.filter(l => (l.msg||'').toLowerCase().indexOf(s)>=0 || (l.tag||'').toLowerCase().indexOf(s)>=0 || (l.page||'').toLowerCase().indexOf(s)>=0 || (l.cat||'').toLowerCase().indexOf(s)>=0)
      }
      return logs
    },
    crumbTimeline() {
      var crumbs = []
      this.allLogs.forEach(l => {
        if (l.extra && l.extra.breadcrumbs) {
          l.extra.breadcrumbs.forEach(c => crumbs.push({ ts: c.ts||c.t||0, time: c.time||'', tag: c.tag||'', msg: c.msg||'', isError: l.level >= 4 }))
        }
      })
      this.allLogs.forEach(l => {
        if (l.tag && (l.tag.indexOf('life:')===0 || l.tag==='net:change')) crumbs.push({ ts: l.ts, time: l.time, tag: l.tag, msg: l.msg, isError: false })
      })
      crumbs.sort((a,b) => a.ts - b.ts)
      return crumbs.slice(-100)
    }
  },
  methods: {
    t(key) { return (T[this.lang] || T.zh)[key] || key },
    tabToggle(n) {
      if (this.tab === n) { this.tabsCollapsed = !this.tabsCollapsed }
      else { this.tab = n; this.tabsCollapsed = false }
    },
    selectTab(n) { this.tab = n; this.tabsCollapsed = false },
    tabLabel() {
      var labels = [this.t('all'), this.t('errors'), this.t('warnings'), this.t('network'), this.t('perf_tab'), this.t('crash_tab'), this.t('crumbs')]
      return labels[this.tab] || this.t('all')
    },
    detectLang() {
      var loc = (typeof navigator !== 'undefined' && navigator.language) || ''
      this.lang = String(loc).toLowerCase().startsWith('zh') ? 'zh' : 'en'
    },
    getBR() { return window.BugReport || null },
    refresh() {
      var BR = this.getBR()
      if (!BR) return
      this.allLogs = BR.query() || []
      this.errCount = BR.errCount()
      this.wrnCount = BR.wrnCount()
      this.netCount = (BR.query({cat:'NETWORK'})||[]).length
      this.perfCount = (BR.query({cat:'PERF'})||[]).length
      this.crashCount = (BR.query({cat:'CRASH'})||[]).length
      this.crumbCount = (BR.crumbs ? BR.crumbs().length : 0)
      this.allLogs.forEach(l => { if (l.extra && l.extra.breadcrumbs) this.crumbCount += l.extra.breadcrumbs.length })
      this.stats = BR.stats()
    },
    fmtTime(ts) { var d = new Date(ts), p = n => String(n).padStart(2,'0'); return p(d.getHours())+':'+p(d.getMinutes())+':'+p(d.getSeconds())+'.'+String(d.getMilliseconds()).padStart(3,'0') },
    fmtDur(ms) { if (!ms) return '0s'; var h=Math.floor(ms/3600000), m=Math.floor((ms%3600000)/60000), s=Math.floor((ms%60000)/1000); return (h?h+'h ':'')+(m?m+'m ':'')+s+'s' },
    fmtExtra(x) { try { return JSON.stringify(x, null, 2) } catch(e) { return String(x) } },
    hasOtherExtra(extra) { return Object.keys(extra).some(k => k !== 'breadcrumbs' && k !== 'snapshot') },
    doExport(format) {
      this.showExport = false
      var BR = this.getBR()
      if (!BR) return
      var text = BR.exportLogs(format)
      if (navigator.clipboard) { navigator.clipboard.writeText(text).then(() => alert(this.t('copied'))) }
      else { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta) }
    },
    doClear() { if (confirm(this.t('clear_content'))) { var BR = this.getBR(); if (BR) BR.clear(); this.refresh() } }
  },
  mounted() {
    this.detectLang()
    this.refresh()
    var BR = this.getBR()
    if (BR) {
      var vm = this
      this._unwatch = BR.watch(function() { if (vm.autoRefresh) vm.refresh() })
    }
  },
  beforeUnmount() { if (this._unwatch) this._unwatch() }
}
</script>

<style>
/* ============================================================
   BRS Log Viewer — Web/H5 Dark Theme
   ============================================================ */
.br-shell { --bg0: #0d1117; --bg1: #161b22; --bg2: #21262d; --fg0: #c9d1d9; --fg1: #8b949e; --fg2: #6e7681; --border: #30363d; --blue: #58a6ff; --red: #f85149; --orange: #d29922; --green: #3fb950; --purple: #a371f7; --cyan: #39d2c0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.5; color: var(--fg0); background: var(--bg0); display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
.br-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 6px 16px; background: var(--bg1); border-bottom: 1px solid var(--border); flex-shrink: 0; }
.br-tb-left  { display: flex; align-items: center; gap: 8px; }
.br-tb-title { font-weight: 800; font-size: 16px; color: #f0f6fc; letter-spacing: 1px; }
.br-tb-ver   { font-size: 10px; color: var(--fg2); background: var(--bg2); padding: 1px 6px; border-radius: 4px; }
.br-tb-stat  { font-size: 12px; color: var(--fg1); }
.br-tb-right { display: flex; gap: 4px; }
.br-dot { width: 8px; height: 8px; border-radius: 50%; }
.br-dot-ok  { background: var(--green); }
.br-dot-err { background: var(--red); box-shadow: 0 0 6px rgba(248,81,73,0.5); }

.br-collapsed-bar { display: flex; align-items: center; padding: 5px 16px; background: var(--bg1); border-bottom: 1px solid var(--border); cursor: pointer; flex-shrink: 0; }
.br-collapsed-bar:hover { background: var(--bg2); }
.br-collapsed-title { font-size: 12px; font-weight: 600; color: #f0f6fc; }
.br-collapsed-count { font-size: 10px; color: var(--fg2); margin-left: 8px; }
.br-collapsed-chev { font-size: 10px; color: var(--fg1); margin-left: auto; }

.br-btn { background: var(--bg2); border: 1px solid var(--border); border-radius: 4px; padding: 4px 12px; color: var(--fg0); font-size: 11px; cursor: pointer; }
.br-btn:hover { background: #30363d; }
.br-btn-sm { padding: 2px 8px; font-size: 10px; }
.br-btn-d { border-color: rgba(248,81,73,0.3); color: var(--red); }
.br-btn-d:hover { background: rgba(248,81,73,0.1); }
.br-stats { display: flex; gap: 14px; padding: 4px 16px; background: var(--bg1); border-bottom: 1px solid var(--border); font-family: 'SF Mono','Cascadia Code','Fira Code',monospace; font-size: 11px; flex-shrink: 0; }
.br-stat { color: var(--fg1); cursor: pointer; }
.br-stat-e { color: var(--red); } .br-stat-w { color: var(--orange); } .br-stat-n { color: var(--cyan); } .br-stat-p { color: var(--purple); } .br-stat-b { color: var(--green); }
.br-stat-s { color: var(--fg2); margin-left: auto; }
.br-filter { display: flex; gap: 8px; padding: 8px 16px; background: var(--bg1); border-bottom: 1px solid var(--border); }
.br-input { flex: 1; background: var(--bg0); border: 1px solid var(--border); border-radius: 4px; padding: 6px 12px; color: var(--fg0); font-size: 12px; font-family: monospace; outline: none; }
.br-input:focus { border-color: var(--blue); }
.br-tabs { display: flex; padding: 0 16px; background: var(--bg1); border-bottom: 1px solid var(--border); flex-shrink: 0; overflow-x: auto; }
.br-tab { padding: 8px 14px; font-size: 11px; color: var(--fg1); border-bottom: 2px solid transparent; cursor: pointer; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
.br-tab.on { color: #f0f6fc; border-bottom-color: var(--blue); }
.br-tab-e.on { border-bottom-color: var(--red); }
.br-tab-w.on { border-bottom-color: var(--orange); }
.br-badge { background: var(--bg2); padding: 1px 6px; border-radius: 8px; font-size: 10px; font-family: monospace; }
.br-badge-e { background: rgba(248,81,73,0.2); color: var(--red); }
.br-badge-w { background: rgba(210,153,34,0.2); color: var(--orange); }
.br-list { flex: 1; overflow-y: auto; font-family: 'SF Mono','Cascadia Code','Fira Code',monospace; }
.br-entry { border-bottom: 1px solid #161b22; cursor: pointer; }
.br-entry:hover { background: #161b22; }
.br-lv-4, .br-lv-5 { border-left: 3px solid var(--red); background: rgba(248,81,73,0.04); }
.br-lv-3 { border-left: 3px solid var(--orange); background: rgba(210,153,34,0.03); }
.br-lv-0, .br-lv-1 { opacity: 0.6; }
.br-row { display: flex; align-items: baseline; padding: 5px 12px; gap: 8px; font-size: 12px; }
.br-id { color: var(--fg2); font-size: 10px; min-width: 44px; flex-shrink: 0; }
.br-lv-badge { font-size: 10px; font-weight: 700; padding: 1px 5px; border-radius: 3px; color: #fff; min-width: 16px; text-align: center; flex-shrink: 0; }
.br-lv-bg-0,.br-lv-bg-1 { background: var(--bg2); color: var(--fg2); }
.br-lv-bg-2 { background: #1f6feb; }
.br-lv-bg-3 { background: #9e6a03; }
.br-lv-bg-4,.br-lv-bg-5 { background: #da3633; }
.br-time { color: var(--fg2); font-size: 11px; flex-shrink: 0; min-width: 80px; }
.br-cat { color: var(--blue); background: rgba(88,166,255,0.08); padding: 1px 6px; border-radius: 3px; font-size: 10px; flex-shrink: 0; }
.br-cat-CRASH { color: var(--red); background: rgba(248,81,73,0.1); }
.br-cat-NETWORK { color: var(--cyan); }
.br-cat-PERF { color: var(--purple); }
.br-cat-LIFECYCLE { color: var(--green); }
.br-msg { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--fg0); }
.br-chev { color: var(--fg2); font-size: 10px; flex-shrink: 0; }
.br-lv-E,.br-lv-F { color: var(--red); }
.br-lv-W { color: var(--orange); }
.br-lv-I { color: var(--green); }
.br-detail { padding: 10px 12px 16px 60px; border-top: 1px solid var(--border); font-size: 12px; }
.br-meta { width: 100%; border-collapse: collapse; }
.br-meta td { padding: 2px 0; font-size: 11px; }
.br-meta-k { color: var(--fg2); text-align: right; padding-right: 16px; min-width: 60px; white-space: nowrap; vertical-align: top; }
.br-msg-full { background: var(--bg0); border: 1px solid var(--border); border-radius: 4px; padding: 10px; font-size: 12px; line-height: 1.5; margin-top: 10px; white-space: pre-wrap; word-break: break-all; }
.br-stack { margin-top: 10px; }
.br-stack-hd { color: var(--red); font-size: 10px; font-weight: 600; text-transform: uppercase; margin-bottom: 6px; }
.br-stack-pre { background: var(--bg0); border: 1px solid var(--border); border-radius: 4px; padding: 10px; font-family: monospace; font-size: 10px; line-height: 1.4; color: var(--fg1); overflow-x: auto; white-space: pre-wrap; word-break: break-all; }
.br-section { margin-top: 10px; }
.br-section-hd { color: var(--cyan); font-size: 10px; font-weight: 600; text-transform: uppercase; margin-bottom: 6px; display: block; }
.br-timeline { padding: 12px 16px; }
.br-timeline-sm { padding: 6px 0; }
.br-tl-entry { display: flex; align-items: flex-start; position: relative; padding-bottom: 12px; }
.br-tl-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--fg2); flex-shrink: 0; margin-top: 4px; z-index: 1; }
.br-tl-dot-sm { width: 7px; height: 7px; }
.br-tl-dot-e { background: var(--red); box-shadow: 0 0 4px rgba(248,81,73,0.4); }
.br-tl-line { position: absolute; left: 4px; top: 14px; bottom: 0; width: 1px; background: var(--border); }
.br-tl-line-sm { left: 3px; top: 10px; }
.br-tl-body { margin-left: 12px; flex: 1; }
.br-tl-time { font-size: 10px; color: var(--fg2); font-family: monospace; }
.br-tl-tag { font-size: 11px; color: var(--blue); margin-left: 8px; }
.br-tl-msg { font-size: 11px; color: var(--fg1); display: block; margin-top: 2px; }
.br-empty { text-align: center; padding: 60px 20px; color: var(--fg2); font-size: 13px; }
.br-status { display: flex; align-items: center; gap: 8px; padding: 4px 16px; background: var(--blue); flex-shrink: 0; font-size: 11px; color: #fff; font-family: monospace; }
.br-status-r { margin-left: auto; display: flex; gap: 6px; }
.br-status .br-btn { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.2); color: #fff; }
.br-status .br-btn:hover { background: rgba(255,255,255,0.25); }
.br-status .br-btn-d { color: #ffb3b0; }
.br-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: flex-end; justify-content: center; z-index: 9999; }
.br-overlay-box { width: 100%; max-width: 400px; background: var(--bg1); border: 1px solid var(--border); border-radius: 8px 8px 0 0; padding: 24px; }
.br-overlay-hd { font-weight: 700; font-size: 14px; color: #f0f6fc; margin-bottom: 16px; text-align: center; }
.br-overlay-opt { padding: 14px 12px; border-radius: 6px; cursor: pointer; }
.br-overlay-opt:hover { background: var(--bg2); }
.br-overlay-label { display: block; font-size: 13px; font-weight: 600; color: var(--fg0); }
.br-overlay-desc  { display: block; font-size: 11px; color: var(--fg1); margin-top: 2px; }
.br-overlay-cancel { text-align: center; padding: 14px; color: var(--fg1); margin-top: 8px; cursor: pointer; font-size: 12px; }
</style>
