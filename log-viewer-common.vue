<template>
  <view class="br-shell">
    <!-- Toolbar -->
    <view class="br-toolbar">
      <view class="br-tb-left">
        <text class="br-tb-title">BugReport</text>
        <view :class="['br-dot', errCount > 0 ? 'br-dot-err' : 'br-dot-ok']"></view>
        <text class="br-tb-stat">{{ errCount > 0 ? errCount + ' ' + t('status_issues') : t('status_ok') }}</text>
      </view>
      <view class="br-tb-right">
        <view class="br-btn" @tap="autoRefresh = !autoRefresh">
          <text>{{ autoRefresh ? t('btn_pause') : t('btn_live') }}</text>
        </view>
        <view class="br-btn" @tap="showExport = !showExport">
          <text>{{ t('btn_export') }}</text>
        </view>
        <view class="br-btn" @tap="showSearch = !showSearch">
          <text>{{ t('btn_filter') }}</text>
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
        :placeholder="t('search_placeholder')"
      />
      <view class="br-btn br-btn-sm" @tap="searchText=''; showSearch=false">
        <text>{{ t('btn_close') }}</text>
      </view>
    </view>

    <!-- Tabs -->
    <scroll-view class="br-tabs" scroll-x="true">
      <view :class="['br-tab', { on: tab===0 }]" @tap="tab=0">
        <text>{{ t('tab_all') }}</text>
        <text class="br-badge" v-if="allLogs.length">{{ allLogs.length }}</text>
      </view>
      <view :class="['br-tab br-tab-e', { on: tab===1 }]" @tap="tab=1">
        <text>{{ t('tab_errors') }}</text>
        <text class="br-badge br-badge-e" v-if="errCount">{{ errCount }}</text>
      </view>
      <view :class="['br-tab br-tab-w', { on: tab===2 }]" @tap="tab=2">
        <text>{{ t('tab_warnings') }}</text>
        <text class="br-badge br-badge-w" v-if="wrnCount">{{ wrnCount }}</text>
      </view>
      <view :class="['br-tab', { on: tab===3 }]" @tap="tab=3">
        <text>{{ t('tab_network') }}</text>
        <text class="br-badge" v-if="netCount">{{ netCount }}</text>
      </view>
      <view :class="['br-tab', { on: tab===4 }]" @tap="tab=4">
        <text>{{ t('tab_perf') }}</text>
        <text class="br-badge" v-if="perfCount">{{ perfCount }}</text>
      </view>
      <view :class="['br-tab', { on: tab===5 }]" @tap="tab=5">
        <text>{{ t('tab_crash') }}</text>
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
          <text :class="['br-lv-badge', 'br-lv-bg-' + log.level]">{{ log.levelLabel }}</text>
          <text class="br-time">{{ fmtTime(log.ts) }}</text>
          <text class="br-cat">{{ log.cat }}</text>
          <text class="br-msg">{{ log.msg || log.tag }}</text>
          <text class="br-chev">{{ expand === log.id ? '▲' : '▼' }}</text>
        </view>

        <!-- Expanded detail -->
        <view class="br-detail" v-if="expand === log.id">
          <view class="br-meta">
            <view class="br-meta-row"><text class="br-meta-k">{{ t('detail_id') }}</text><text class="br-meta-v">{{ log.id }}</text></view>
            <view class="br-meta-row"><text class="br-meta-k">{{ t('detail_level') }}</text><text class="br-meta-v">{{ log.levelName }}</text></view>
            <view class="br-meta-row"><text class="br-meta-k">{{ t('detail_category') }}</text><text class="br-meta-v">{{ log.cat }}</text></view>
            <view class="br-meta-row"><text class="br-meta-k">{{ t('detail_tag') }}</text><text class="br-meta-v">{{ log.tag }}</text></view>
            <view class="br-meta-row"><text class="br-meta-k">{{ t('detail_page') }}</text><text class="br-meta-v">{{ log.page }}</text></view>
            <view class="br-meta-row"><text class="br-meta-k">{{ t('detail_time') }}</text><text class="br-meta-v">{{ log.time }}</text></view>
            <view class="br-meta-row" v-if="log.extra"><text class="br-meta-k">{{ t('detail_data') }}</text><text class="br-meta-v br-meta-code">{{ fmtExtra(log.extra) }}</text></view>
          </view>
          <view class="br-msg-full" v-if="log.msg"><text>{{ log.msg }}</text></view>
          <view class="br-stack" v-if="log.stack">
            <text class="br-stack-hd">{{ t('stack_trace') }}</text>
            <view class="br-stack-pre"><text>{{ log.stack }}</text></view>
          </view>
        </view>
      </view>

      <view class="br-empty" v-if="filtered.length === 0">
        <text>{{ tab === 1 ? t('empty_errors') : tab === 2 ? t('empty_warnings') : t('empty_all') }}</text>
      </view>
    </scroll-view>

    <!-- Status bar -->
    <view class="br-status">
      <text>{{ allLogs.length }} {{ t('status_logs') }}</text>
      <text>|</text>
      <text>{{ t('status_uptime') }} {{ fmtDur(stats.sessionMs) }}</text>
      <text>|</text>
      <text>{{ stats.device ? stats.device.model : '' }}</text>
      <view class="br-status-r">
        <view class="br-btn br-btn-sm" @tap="doExport('text')"><text>{{ t('btn_copy_text') }}</text></view>
        <view class="br-btn br-btn-sm" @tap="doExport('json')"><text>{{ t('btn_copy_json') }}</text></view>
        <view class="br-btn br-btn-sm br-btn-d" @tap="doClear"><text>{{ t('btn_clear') }}</text></view>
      </view>
    </view>

    <!-- Export overlay -->
    <view class="br-overlay" v-if="showExport" @tap="showExport=false">
      <view class="br-overlay-box" @tap.stop>
        <text class="br-overlay-hd">{{ t('export_title') }}</text>
        <view class="br-overlay-opt" @tap="doExport('text')">
          <text class="br-overlay-label">{{ t('export_text_label') }}</text>
          <text class="br-overlay-desc">{{ t('export_text_desc') }}</text>
        </view>
        <view class="br-overlay-opt" @tap="doExport('json')">
          <text class="br-overlay-label">{{ t('export_json_label') }}</text>
          <text class="br-overlay-desc">{{ t('export_json_desc') }}</text>
        </view>
        <view class="br-overlay-opt" @tap="doExport('csv')">
          <text class="br-overlay-label">{{ t('export_csv_label') }}</text>
          <text class="br-overlay-desc">{{ t('export_csv_desc') }}</text>
        </view>
        <view class="br-overlay-cancel" @tap="showExport=false"><text>{{ t('export_cancel') }}</text></view>
      </view>
    </view>
  </view>
</template>

<script>
// BugReport Log Viewer — uni-app Common Version (i18n: zh-CN / en)
// Works on: H5 / WeChat Mini Program / Android APP-PLUS / iOS APP-PLUS

// ---- i18n ----
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
    copied: '已复制到剪贴板', copy_failed: '复制失败',
    dialog_clear_title: '清空日志', dialog_clear_content: '确定清空所有日志吗？'
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
    copied: 'Copied to clipboard', copy_failed: 'Copy failed',
    dialog_clear_title: 'Clear Logs', dialog_clear_content: 'Clear all logs?'
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
      var loc = ''
      // #ifdef APP-PLUS
      try { var i = uni.getSystemInfoSync(); if (i && i.language) loc = i.language } catch(e) {}
      // #endif
      // #ifdef MP-WEIXIN
      try { var w = wx.getSystemInfoSync(); if (w && w.language) loc = w.language } catch(e) {}
      // #endif
      // #ifdef H5
      loc = (typeof navigator !== 'undefined' && navigator.language) || ''
      // #endif
      this.lang = String(loc).toLowerCase().startsWith('zh') ? 'zh' : 'en'
    },
    getBR() {
      if (this.bridge) return this.bridge
      // #ifdef APP-PLUS
      if (typeof globalThis !== 'undefined' && globalThis.BugReport) return globalThis.BugReport
      try { return require('@/utils/bug-report.js') } catch(e) {}
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
      const vm = this
      // #ifdef H5
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function() { alert(vm.t('copied')) })
      }
      // #endif
      // #ifndef H5
      // #ifdef MP-WEIXIN
      if (typeof wx !== 'undefined' && wx.setClipboardData) {
        wx.setClipboardData({ data: text, success: function() { wx.showToast({ title: vm.t('copied') }) } })
        return
      }
      // #endif
      uni.setClipboardData({
        data: text,
        success: function() { uni.showToast({ title: vm.t('copied'), icon: 'none' }) },
        fail: function() { uni.showToast({ title: vm.t('copy_failed'), icon: 'none' }) }
      })
      // #endif
    },
    doClear() {
      var vm = this
      // #ifdef H5
      if (!confirm(vm.t('dialog_clear_content'))) return
      // #endif
      // #ifndef H5
      uni.showModal({
        title: vm.t('dialog_clear_title'),
        content: vm.t('dialog_clear_content'),
        success: function(res) {
          if (!res.confirm) return
          vm._doClear()
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
    this.detectLang()
    this.refresh()
    const BR = this.getBR()
    if (BR) {
      var vm = this
      this._unwatch = BR.watch(function() {
        if (vm.autoRefresh) vm.refresh()
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
