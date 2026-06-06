<template>
  <view class="br-shell">
    <!-- Toolbar -->
    <view class="br-toolbar">
      <view class="br-tb-left">
        <text class="br-tb-title">BRS</text>
        <text class="br-tb-ver">v3.0</text>
        <view :class="['br-dot', errCount > 0 ? 'br-dot-err' : 'br-dot-ok']"></view>
        <text class="br-tb-stat">{{ errCount > 0 ? errCount + ' ' + t('issues') : t('ok') }}</text>
      </view>
      <view class="br-tb-right">
        <view class="br-btn" @tap="autoRefresh = !autoRefresh">
          <text>{{ autoRefresh ? t('pause') : t('live') }}</text>
        </view>
        <view class="br-btn" @tap="showSearch = !showSearch">
          <text>{{ t('filter') }}</text>
        </view>
        <view class="br-btn" @tap="showExport = !showExport">
          <text>{{ t('export') }}</text>
        </view>
      </view>
    </view>

    <!-- Filter bar: always-visible toggle row + collapsible content below -->
    <view class="br-filter-bar">
      <!-- Always-visible toggle row -->
      <view class="br-toggle-row">
        <text class="br-toggle-title" v-if="tabsCollapsed">{{ tabLabel() }}</text>
        <text class="br-toggle-count" v-if="tabsCollapsed">{{ allLogs.length }} {{ t('logs') }}</text>
        <text class="br-toggle-count" v-if="!tabsCollapsed">{{ allLogs.length }} {{ t('logs') }}</text>
        <view class="br-toggle-btn" @tap="tabsCollapsed = !tabsCollapsed">
          <text>{{ tabsCollapsed ? '▼ ' + t('expand_filter') : '▲ ' + t('collapse_filter') }}</text>
        </view>
      </view>

      <!-- Collapsible: tabs + stats + search (only when expanded) -->
      <view v-show="!tabsCollapsed">
        <scroll-view class="br-tabs" scroll-x="true">
          <view :class="['br-tab', { on: tab===0 }]" @tap="tabToggle(0)">
            <text>{{ t('all') }}</text><text class="br-badge" v-if="allLogs.length">{{ allLogs.length }}</text>
          </view>
          <view :class="['br-tab br-tab-e', { on: tab===1 }]" @tap="selectTab(1)">
            <text>{{ t('errors') }}</text><text class="br-badge br-badge-e" v-if="errCount">{{ errCount }}</text>
          </view>
          <view :class="['br-tab br-tab-w', { on: tab===2 }]" @tap="selectTab(2)">
            <text>{{ t('warnings') }}</text><text class="br-badge br-badge-w" v-if="wrnCount">{{ wrnCount }}</text>
          </view>
          <view :class="['br-tab', { on: tab===3 }]" @tap="selectTab(3)">
            <text>{{ t('network') }}</text><text class="br-badge" v-if="netCount">{{ netCount }}</text>
          </view>
          <view :class="['br-tab', { on: tab===4 }]" @tap="selectTab(4)">
            <text>{{ t('perf_tab') }}</text><text class="br-badge" v-if="perfCount">{{ perfCount }}</text>
          </view>
          <view :class="['br-tab br-tab-e', { on: tab===5 }]" @tap="selectTab(5)">
            <text>{{ t('crash_tab') }}</text><text class="br-badge br-badge-e" v-if="crashCount">{{ crashCount }}</text>
          </view>
          <view :class="['br-tab', { on: tab===6 }]" @tap="selectTab(6)">
            <text>{{ t('crumbs') }}</text><text class="br-badge" v-if="crumbCount">{{ crumbCount }}</text>
          </view>
        </scroll-view>
        <view class="br-stats">
          <text class="br-stat br-stat-e" @tap="selectTab(1)">{{ t('err') }}:{{ errCount }}</text>
          <text class="br-stat br-stat-w" @tap="selectTab(2)">{{ t('warn') }}:{{ wrnCount }}</text>
          <text class="br-stat br-stat-n" @tap="selectTab(3)">{{ t('net') }}:{{ netCount }}</text>
          <text class="br-stat br-stat-p" @tap="selectTab(4)">{{ t('perf') }}:{{ perfCount }}</text>
          <text class="br-stat br-stat-b" @tap="selectTab(6)">{{ t('crumb') }}:{{ crumbCount }}</text>
          <text class="br-stat br-stat-s">{{ fmtDur(stats.sessionMs) }}</text>
        </view>
        <view class="br-filter" v-if="showSearch">
          <input class="br-input" v-model="searchText" :placeholder="t('search_ph')" />
          <view class="br-btn br-btn-sm" @tap="searchText=''; showSearch=false"><text>{{ t('close') }}</text></view>
        </view>
      </view>
    </view>

    <!-- Log list -->
    <scroll-view class="br-list" scroll-y="true">
      <!-- Timeline mode for breadcrumb tab -->
      <view v-if="tab === 6">
        <view class="br-timeline" v-if="crumbTimeline.length">
          <view class="br-tl-entry" v-for="(c, i) in crumbTimeline" :key="'c'+i">
            <view class="br-tl-dot" :class="c.isError ? 'br-tl-dot-e' : ''"></view>
            <view class="br-tl-line" v-if="i < crumbTimeline.length - 1"></view>
            <view class="br-tl-body">
              <text class="br-tl-time">{{ fmtTime(c.ts || c.t) }}</text>
              <text class="br-tl-tag">{{ c.tag }}</text>
              <text class="br-tl-msg">{{ c.msg }}</text>
            </view>
          </view>
        </view>
        <view class="br-empty" v-else><text>{{ t('no_crumbs') }}</text></view>
      </view>

      <!-- Normal log list -->
      <view v-else>
        <view v-for="log in filtered" :key="log.id" :class="['br-entry', 'br-lv-' + log.level]" @tap="expand = expand === log.id ? -1 : log.id">
          <!-- Row -->
          <view class="br-row">
            <text class="br-id">#{{ log.id }}</text>
            <text :class="['br-lv-badge', 'br-lv-bg-' + log.level]">{{ log.levelLabel }}</text>
            <text class="br-time">{{ fmtTime(log.ts) }}</text>
            <text class="br-cat" :class="'br-cat-' + (log.cat || '')">{{ log.cat }}</text>
            <text class="br-msg">{{ log.msg || log.tag }}</text>
            <text class="br-chev">{{ expand === log.id ? '▲' : '▼' }}</text>
          </view>

          <!-- Expanded detail -->
          <view class="br-detail" v-if="expand === log.id">
            <view class="br-meta">
              <view class="br-meta-row"><text class="br-meta-k">{{ t('d_id') }}</text><text class="br-meta-v">#{{ log.id }}</text></view>
              <view class="br-meta-row"><text class="br-meta-k">{{ t('d_level') }}</text><text class="br-meta-v" :class="'br-lv-' + log.levelLabel">{{ log.levelName }}</text></view>
              <view class="br-meta-row"><text class="br-meta-k">{{ t('d_cat') }}</text><text class="br-meta-v">{{ log.cat }}</text></view>
              <view class="br-meta-row"><text class="br-meta-k">{{ t('d_tag') }}</text><text class="br-meta-v">{{ log.tag }}</text></view>
              <view class="br-meta-row"><text class="br-meta-k">{{ t('d_page') }}</text><text class="br-meta-v">{{ log.page || '—' }}</text></view>
              <view class="br-meta-row"><text class="br-meta-k">{{ t('d_time') }}</text><text class="br-meta-v">{{ log.time }}</text></view>
              <view class="br-meta-row" v-if="log.extra && log.extra.duration != null"><text class="br-meta-k">{{ t('d_dur') }}</text><text class="br-meta-v">{{ log.extra.duration }}ms</text></view>
              <view class="br-meta-row" v-if="log.extra && log.extra.status != null"><text class="br-meta-k">{{ t('d_status') }}</text><text class="br-meta-v">{{ log.extra.status }}</text></view>
              <view class="br-meta-row" v-if="log.extra && log.extra.url != null"><text class="br-meta-k">{{ t('d_url') }}</text><text class="br-meta-v">{{ log.extra.url }}</text></view>
            </view>

            <!-- Full message -->
            <view class="br-msg-full" v-if="log.msg && log.msg !== log.tag"><text>{{ log.msg }}</text></view>

            <!-- Stack trace -->
            <view class="br-stack" v-if="log.stack">
              <text class="br-stack-hd">{{ t('stack') }}</text>
              <view class="br-stack-pre"><text>{{ log.stack }}</text></view>
            </view>

            <!-- Breadcrumbs in crash log -->
            <view class="br-section" v-if="log.extra && log.extra.breadcrumbs && log.extra.breadcrumbs.length">
              <text class="br-section-hd">{{ t('crumb_trail') }} ({{ log.extra.breadcrumbs.length }})</text>
              <view class="br-timeline br-timeline-sm">
                <view class="br-tl-entry" v-for="(c, i) in log.extra.breadcrumbs" :key="'bc'+i">
                  <view class="br-tl-dot br-tl-dot-sm"></view>
                  <view class="br-tl-line br-tl-line-sm" v-if="i < log.extra.breadcrumbs.length - 1"></view>
                  <view class="br-tl-body">
                    <text class="br-tl-tag">{{ c.tag }}</text>
                    <text class="br-tl-time" style="display:block;">{{ fmtTime(c.ts || c.t) }}</text>
                    <text class="br-tl-msg">{{ c.msg }}</text>
                  </view>
                </view>
              </view>
            </view>

            <!-- Snapshot in crash log -->
            <view class="br-section" v-if="log.extra && log.extra.snapshot">
              <text class="br-section-hd">{{ t('snapshot_data') }}</text>
              <view class="br-stack-pre"><text>{{ fmtExtra(log.extra.snapshot) }}</text></view>
            </view>

            <!-- Remaining extra keys (not breadcrumbs/snapshot) -->
            <view class="br-section" v-if="log.extra && hasOtherExtra(log.extra)">
              <text class="br-section-hd">{{ t('extra_data') }}</text>
              <view class="br-stack-pre"><text>{{ fmtExtra(log.extra) }}</text></view>
            </view>
          </view>
        </view>

        <view class="br-empty" v-if="filtered.length === 0">
          <text>{{ tab === 1 ? t('no_errors') : tab === 2 ? t('no_warns') : tab === 5 ? t('no_crashes') : t('no_logs') }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- Status bar -->
    <view class="br-status">
      <text>{{ allLogs.length }} {{ t('logs') }}</text>
      <text>|</text>
      <text>{{ t('uptime') }} {{ fmtDur(stats.sessionMs) }}</text>
      <text>|</text>
      <text>{{ stats.device ? (stats.device.brand + ' ' + stats.device.model) : '' }}</text>
      <view class="br-status-r">
        <view class="br-btn br-btn-sm" @tap="doExport('text')"><text>{{ t('copy_text') }}</text></view>
        <view class="br-btn br-btn-sm" @tap="doExport('json')"><text>{{ t('copy_json') }}</text></view>
        <view class="br-btn br-btn-sm br-btn-d" @tap="doClear"><text>{{ t('clear') }}</text></view>
      </view>
    </view>

    <!-- Export overlay -->
    <view class="br-overlay" v-if="showExport" @tap="showExport=false">
      <view class="br-overlay-box" @tap.stop>
        <text class="br-overlay-hd">{{ t('exp_title') }}</text>
        <view class="br-overlay-opt" @tap="doExport('text')">
          <text class="br-overlay-label">{{ t('exp_text') }}</text>
          <text class="br-overlay-desc">{{ t('exp_text_desc') }}</text>
        </view>
        <view class="br-overlay-opt" @tap="doExport('json')">
          <text class="br-overlay-label">{{ t('exp_json') }}</text>
          <text class="br-overlay-desc">{{ t('exp_json_desc') }}</text>
        </view>
        <view class="br-overlay-opt" @tap="doExport('csv')">
          <text class="br-overlay-label">{{ t('exp_csv') }}</text>
          <text class="br-overlay-desc">{{ t('exp_csv_desc') }}</text>
        </view>
        <view class="br-overlay-cancel" @tap="showExport=false"><text>{{ t('cancel') }}</text></view>
      </view>
    </view>
  </view>
</template>

<script>
// ============================================================
// BRS Log Viewer — uni-app Common Version (i18n: zh-CN / en)
// ============================================================
// Works on: H5 / WeChat Mini Program / Android APP-PLUS / iOS APP-PLUS

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
    stack: '堆栈追踪',
    crumb_trail: '面包屑追踪',
    snapshot_data: '状态快照',
    extra_data: '附加数据',
    no_errors: '暂无错误', no_warns: '暂无警告', no_crashes: '暂无崩溃',
    no_logs: '暂无日志', no_crumbs: '暂无面包屑数据',
    logs: '条日志', uptime: '运行时长',
    copy_text: '复制文本', copy_json: '复制JSON', clear: '清空',
    exp_title: '导出日志',
    exp_text: '文本格式', exp_text_desc: '可读文本，适合粘贴分享',
    exp_json: 'JSON格式', exp_json_desc: '结构化数据，适合程序分析',
    exp_csv: 'CSV格式', exp_csv_desc: '电子表格兼容格式',
    cancel: '取消',
    copied: '已复制到剪贴板', copy_failed: '复制失败',
    clear_title: '清空日志', clear_content: '确定清空所有日志吗？',
    expand_filter: '展开筛选栏',
    collapse_filter: '收起筛选栏'
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
    stack: 'Stack Trace',
    crumb_trail: 'Breadcrumb Trail',
    snapshot_data: 'State Snapshot',
    extra_data: 'Extra Data',
    no_errors: 'No errors.', no_warns: 'No warnings.', no_crashes: 'No crashes.',
    no_logs: 'No logs.', no_crumbs: 'No breadcrumbs.',
    logs: 'logs', uptime: 'uptime',
    copy_text: 'Copy Text', copy_json: 'Copy JSON', clear: 'Clear',
    exp_title: 'Export Logs',
    exp_text: 'Text format', exp_text_desc: 'Human-readable, suitable for pasting',
    exp_json: 'JSON format', exp_json_desc: 'Structured data for AI analysis',
    exp_csv: 'CSV format', exp_csv_desc: 'Spreadsheet-compatible table',
    cancel: 'Cancel',
    copied: 'Copied to clipboard', copy_failed: 'Copy failed',
    clear_title: 'Clear Logs', clear_content: 'Clear all logs?',
    expand_filter: 'Expand Filters',
    collapse_filter: 'Collapse Filters'
  }
}

export default {
  name: 'BRSViewer',
  props: { bridge: { type: Object, default: null } },
  data() {
    return {
      allLogs: [], tab: 0, expand: -1, searchText: '',
      showSearch: false, showExport: false, autoRefresh: true, tabsCollapsed: true,
      errCount: 0, wrnCount: 0, netCount: 0, perfCount: 0, crashCount: 0, crumbCount: 0,
      stats: { sessionMs: 0, device: {} },
      lang: 'zh'
    }
  },
  computed: {
    filtered() {
      var logs = this.allLogs.slice()
      if (this.tab === 1) { logs = logs.filter(function(l) { return l.level >= 4 }) }
      else if (this.tab === 2) { logs = logs.filter(function(l) { return l.level === 3 }) }
      else if (this.tab === 3) { logs = logs.filter(function(l) { return l.cat === 'NETWORK' }) }
      else if (this.tab === 4) { logs = logs.filter(function(l) { return l.cat === 'PERF' }) }
      else if (this.tab === 5) { logs = logs.filter(function(l) { return l.cat === 'CRASH' }) }
      // tab 6 is breadcrumbs — handled separately in template
      if (this.searchText) {
        var s = this.searchText.toLowerCase()
        logs = logs.filter(function(l) {
          return (l.msg||'').toLowerCase().indexOf(s)>=0 ||
            (l.tag||'').toLowerCase().indexOf(s)>=0 ||
            (l.page||'').toLowerCase().indexOf(s)>=0 ||
            (l.cat||'').toLowerCase().indexOf(s)>=0
        })
      }
      return logs
    },
    // Aggregate all breadcrumbs from crash logs into a timeline
    crumbTimeline() {
      var crumbs = []
      var vm = this
      this.allLogs.forEach(function(l) {
        if (l.extra && l.extra.breadcrumbs && Array.isArray(l.extra.breadcrumbs)) {
          l.extra.breadcrumbs.forEach(function(c) {
            crumbs.push({
              ts: c.ts || c.t || 0,
              time: c.time || '',
              tag: c.tag || '',
              msg: c.msg || '',
              isError: l.level >= 4
            })
          })
        }
      })
      // Also add lifecycle crumbs from log tags
      this.allLogs.forEach(function(l) {
        if (l.tag && (l.tag.indexOf('life:') === 0 || l.tag === 'net:change')) {
          crumbs.push({
            ts: l.ts,
            time: l.time,
            tag: l.tag,
            msg: l.msg,
            isError: false
          })
        }
      })
      crumbs.sort(function(a, b) { return a.ts - b.ts })
      return crumbs.slice(-100)
    }
  },
  methods: {
    t: function(key) { return (T[this.lang] || T.zh)[key] || key },
    tabToggle: function(n) {
      if (this.tab === n) { this.tabsCollapsed = !this.tabsCollapsed }
      else { this.tab = n; this.tabsCollapsed = false }
    },
    selectTab: function(n) { this.tab = n; this.tabsCollapsed = false },
    tabLabel: function() {
      var labels = [this.t('all'), this.t('errors'), this.t('warnings'), this.t('network'), this.t('perf_tab'), this.t('crash_tab'), this.t('crumbs')]
      return labels[this.tab] || this.t('all')
    },
    detectLang: function() {
      var loc = ''
      // #ifdef APP-PLUS
      try { var info = uni.getSystemInfoSync(); if (info && info.language) loc = info.language } catch(e) {}
      // #endif
      // #ifdef MP-WEIXIN
      try { var wxInfo = wx.getSystemInfoSync(); if (wxInfo && wxInfo.language) loc = wxInfo.language } catch(e) {}
      // #endif
      // #ifdef H5
      loc = (typeof navigator !== 'undefined' && navigator.language) || ''
      // #endif
      this.lang = String(loc || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
    },
    getBR: function() {
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
    refresh: function() {
      var BR = this.getBR()
      if (!BR) return
      this.allLogs = BR.query() || []
      this.errCount = BR.errCount()
      this.wrnCount = BR.wrnCount()
      this.netCount = (BR.query({cat:'NETWORK'})||[]).length
      this.perfCount = (BR.query({cat:'PERF'})||[]).length
      this.crashCount = (BR.query({cat:'CRASH'})||[]).length
      this.crumbCount = (BR.crumbs ? BR.crumbs().length : 0)
      // Aggregate from crash logs too
      var vm = this
      this.allLogs.forEach(function(l) {
        if (l.extra && l.extra.breadcrumbs) vm.crumbCount += l.extra.breadcrumbs.length
      })
      this.stats = BR.stats()
    },
    fmtTime: function(ts) {
      var d = new Date(ts)
      var pad = function(n) { return String(n).padStart(2,'0') }
      return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + '.' + String(d.getMilliseconds()).padStart(3,'0')
    },
    fmtDur: function(ms) {
      if (!ms) return '0s'
      var h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000)
      return (h ? h+'h ' : '') + (m ? m+'m ' : '') + s + 's'
    },
    fmtExtra: function(x) {
      try { return JSON.stringify(x, null, 2) } catch(e) { return String(x) }
    },
    hasOtherExtra: function(extra) {
      var keys = Object.keys(extra)
      return keys.some(function(k) { return k !== 'breadcrumbs' && k !== 'snapshot' })
    },
    doExport: function(format) {
      this.showExport = false
      var BR = this.getBR()
      if (!BR) return
      var text = BR.exportLogs(format)
      var vm = this
      // #ifdef H5
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function() {
          if (typeof alert !== 'undefined') alert(vm.t('copied'))
        })
        return
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
    doClear: function() {
      var vm = this
      // #ifdef H5
      if (typeof confirm !== 'undefined' && !confirm(vm.t('clear_content'))) return
      vm._doClear()
      return
      // #endif
      // #ifndef H5
      uni.showModal({
        title: vm.t('clear_title'),
        content: vm.t('clear_content'),
        success: function(res) {
          if (!res.confirm) return
          vm._doClear()
        }
      })
      // #endif
    },
    _doClear: function() {
      var BR = this.getBR()
      if (BR) BR.clear()
      this.refresh()
    }
  },
  mounted: function() {
    this.detectLang()
    this.refresh()
    var BR = this.getBR()
    var vm = this
    if (BR) {
      this._unwatch = BR.watch(function() {
        if (vm.autoRefresh) vm.refresh()
      })
    }
  },
  beforeUnmount: function() {
    if (this._unwatch) this._unwatch()
  }
}
</script>

<style>
/* ============================================================
   BRS Log Viewer — Terminal/IDE Dark Theme
   Uni-app common: rpx · <view>/<text> · condition compile
   ============================================================ */
.br-shell {
  --bg0:    #0d1117; --bg1: #161b22; --bg2: #21262d;
  --fg0:    #c9d1d9; --fg1: #8b949e; --fg2: #6e7681;
  --border: #30363d;
  --blue:   #58a6ff; --red: #f85149; --orange: #d29922;
  --green:  #3fb950; --purple: #a371f7; --cyan: #39d2c0;
  font-size: 24rpx; line-height: 1.5; color: var(--fg0);
  background: var(--bg0); display: flex; flex-direction: column;
  height: 100vh; overflow: hidden;
}

/* Toolbar */
.br-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 16rpx 32rpx; background: var(--bg1); border-bottom: 1px solid var(--border); flex-shrink: 0; }
.br-tb-left  { display: flex; align-items: center; }
.br-tb-left > * { margin-right: 16rpx; }
.br-tb-title { font-weight: 800; font-size: 30rpx; color: #f0f6fc; letter-spacing: 2rpx; }
.br-tb-ver   { font-size: 20rpx; color: var(--fg2); background: var(--bg2); padding: 2rpx 10rpx; border-radius: 6rpx; }
.br-tb-stat  { font-size: 22rpx; color: var(--fg1); }
.br-tb-right { display: flex; }
.br-tb-right > * { margin-right: 12rpx; }
.br-tb-right > *:last-child { margin-right: 0; }

.br-dot { width: 16rpx; height: 16rpx; border-radius: 50%; }
.br-dot-ok  { background: var(--green); }
.br-dot-err { background: var(--red); box-shadow: 0 0 12rpx rgba(248,81,73,0.5); }

/* Filter header */
.br-filter-bar { flex-shrink: 0; }
.br-toggle-row { display: flex; align-items: center; padding: 0 32rpx; height: 72rpx; background: var(--bg1); border-bottom: 1px solid var(--border); }
.br-toggle-title { font-size: 24rpx; font-weight: 600; color: #f0f6fc; }
.br-toggle-count { font-size: 20rpx; color: var(--fg2); margin-left: 16rpx; flex: 1; }
.br-toggle-btn { flex-shrink: 0; padding: 8rpx 20rpx; color: var(--fg1); font-size: 20rpx; border: 1px solid var(--border); border-radius: 8rpx; background: var(--bg2); white-space: nowrap; }
.br-toggle-btn:active { background: var(--border); }

/* Buttons */
.br-btn { background: var(--bg2); border: 1px solid var(--border); border-radius: 8rpx; padding: 8rpx 24rpx; }
.br-btn:active { background: #30363d; }
.br-btn text { font-size: 22rpx; color: var(--fg0); }
.br-btn-sm { padding: 4rpx 16rpx; }
.br-btn-sm text { font-size: 20rpx; }
.br-btn-d { border-color: rgba(248,81,73,0.3); }
.br-btn-d text { color: var(--red); }
.br-btn-d:active { background: rgba(248,81,73,0.1); }

/* Stats */
.br-stats { display: flex; padding: 12rpx 32rpx; background: var(--bg1); border-bottom: 1px solid var(--border); font-family: monospace; font-size: 22rpx; }
.br-stats > * { margin-right: 28rpx; }
.br-stat { color: var(--fg1); }
.br-stat-e { color: var(--red); }
.br-stat-w { color: var(--orange); }
.br-stat-n { color: var(--cyan); }
.br-stat-p { color: var(--purple); }
.br-stat-b { color: var(--green); }
.br-stat-s { color: var(--fg2); margin-left: auto; }

/* Filter */
.br-filter { display: flex; padding: 16rpx 32rpx; background: var(--bg1); border-bottom: 1px solid var(--border); }
.br-input { flex: 1; background: var(--bg0); border: 1px solid var(--border); border-radius: 8rpx; padding: 12rpx 24rpx; color: var(--fg0); font-size: 24rpx; font-family: monospace; outline: none; margin-right: 16rpx; }
.br-input:focus { border-color: var(--blue); }

/* Tabs */
.br-tabs { display: flex; padding: 0 32rpx; background: var(--bg1); border-bottom: 1px solid var(--border); white-space: nowrap; align-items: center; }
.br-tab { padding: 20rpx 24rpx; font-size: 22rpx; color: var(--fg1); border-bottom: 4rpx solid transparent; white-space: nowrap; display: flex; align-items: center; }
.br-tab.on { color: #f0f6fc; border-bottom-color: var(--blue); }
.br-tab-e.on { border-bottom-color: var(--red); }
.br-tab-w.on { border-bottom-color: var(--orange); }
.br-badge { margin-left: 10rpx; background: var(--bg2); padding: 2rpx 12rpx; border-radius: 16rpx; font-size: 20rpx; font-family: monospace; }
.br-badge-e { background: rgba(248,81,73,0.2); color: var(--red); }
.br-badge-w { background: rgba(210,153,34,0.2); color: var(--orange); }

/* List */
.br-list { flex: 1; overflow-y: auto; font-family: monospace; }
.br-entry { border-bottom: 1px solid #161b22; }
.br-entry:active { background: #161b22; }
.br-lv-4, .br-lv-5 { border-left: 6rpx solid var(--red); background: rgba(248,81,73,0.04); }
.br-lv-3 { border-left: 6rpx solid var(--orange); background: rgba(210,153,34,0.03); }
.br-lv-2 { border-left: 6rpx solid transparent; }
.br-lv-0, .br-lv-1 { border-left: 6rpx solid transparent; opacity: 0.65; }

/* Row */
.br-row { display: flex; align-items: baseline; padding: 12rpx 24rpx; font-size: 24rpx; }
.br-row > * { margin-right: 14rpx; }
.br-id { color: var(--fg2); font-size: 20rpx; min-width: 80rpx; flex-shrink: 0; }
.br-lv-badge { font-size: 18rpx; font-weight: 700; padding: 2rpx 8rpx; border-radius: 4rpx; color: #fff; min-width: 28rpx; text-align: center; flex-shrink: 0; }
.br-lv-bg-0, .br-lv-bg-1 { background: var(--bg2); color: var(--fg2); }
.br-lv-bg-2 { background: #1f6feb; }
.br-lv-bg-3 { background: #9e6a03; }
.br-lv-bg-4, .br-lv-bg-5 { background: #da3633; }
.br-time { color: var(--fg2); font-size: 22rpx; flex-shrink: 0; min-width: 140rpx; }
.br-cat { color: var(--blue); background: rgba(88,166,255,0.08); padding: 2rpx 10rpx; border-radius: 6rpx; font-size: 20rpx; flex-shrink: 0; }
.br-cat-CRASH { color: var(--red); background: rgba(248,81,73,0.1); }
.br-cat-NETWORK { color: var(--cyan); }
.br-cat-PERF { color: var(--purple); }
.br-cat-LIFECYCLE { color: var(--green); }
.br-msg { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--fg0); }
.br-chev { color: var(--fg2); font-size: 16rpx; flex-shrink: 0; }

/* Level text colors */
.br-lv-E, .br-lv-ERROR, .br-lv-F, .br-lv-FATAL { color: var(--red); }
.br-lv-W, .br-lv-WARN { color: var(--orange); }
.br-lv-I, .br-lv-INFO { color: var(--green); }

/* Detail */
.br-detail { padding: 20rpx 24rpx 24rpx 100rpx; border-top: 1px solid var(--border); font-size: 24rpx; }
.br-meta-row { display: flex; padding: 4rpx 0; }
.br-meta-k { color: var(--fg2); text-align: right; min-width: 110rpx; font-size: 22rpx; margin-right: 24rpx; }
.br-meta-v { font-size: 22rpx; color: var(--fg0); }
.br-msg-full { background: var(--bg0); border: 1px solid var(--border); border-radius: 8rpx; padding: 20rpx; font-size: 24rpx; line-height: 1.5; margin-top: 16rpx; }
.br-msg-full text { white-space: pre-wrap; word-break: break-all; }

/* Stack */
.br-stack { margin-top: 16rpx; }
.br-stack-hd { color: var(--red); font-size: 20rpx; font-weight: 600; text-transform: uppercase; margin-bottom: 10rpx; }
.br-stack-pre { background: var(--bg0); border: 1px solid var(--border); border-radius: 8rpx; padding: 20rpx; font-family: monospace; font-size: 20rpx; line-height: 1.45; color: var(--fg1); }
.br-stack-pre text { white-space: pre-wrap; word-break: break-all; }

/* Section (breadcrumbs, snapshot in detail) */
.br-section { margin-top: 16rpx; }
.br-section-hd { color: var(--cyan); font-size: 20rpx; font-weight: 600; text-transform: uppercase; margin-bottom: 10rpx; display: block; }

/* Timeline */
.br-timeline { padding: 24rpx 32rpx; }
.br-timeline-sm { padding: 12rpx 0; }
.br-tl-entry { display: flex; align-items: flex-start; position: relative; padding-bottom: 20rpx; }
.br-tl-dot { width: 20rpx; height: 20rpx; border-radius: 50%; background: var(--fg2); flex-shrink: 0; margin-top: 6rpx; z-index: 1; }
.br-tl-dot-sm { width: 14rpx; height: 14rpx; }
.br-tl-dot-e { background: var(--red); box-shadow: 0 0 8rpx rgba(248,81,73,0.4); }
.br-tl-line { position: absolute; left: 9rpx; top: 26rpx; bottom: 0; width: 2rpx; background: var(--border); }
.br-tl-line-sm { left: 6rpx; top: 20rpx; }
.br-tl-body { margin-left: 20rpx; flex: 1; }
.br-tl-time { font-size: 20rpx; color: var(--fg2); font-family: monospace; }
.br-tl-tag { font-size: 22rpx; color: var(--blue); margin-left: 16rpx; }
.br-tl-msg { font-size: 22rpx; color: var(--fg1); display: block; margin-top: 4rpx; }

/* Empty */
.br-empty { text-align: center; padding: 120rpx 40rpx; color: var(--fg2); font-size: 26rpx; }

/* Status bar */
.br-status { display: flex; align-items: center; padding: 8rpx 32rpx; background: var(--blue); flex-shrink: 0; }
.br-status > * { margin-right: 20rpx; }
.br-status text { font-size: 22rpx; color: #fff; font-family: monospace; }
.br-status-r { margin-left: auto; display: flex; }
.br-status-r > * { margin-right: 12rpx; }
.br-status .br-btn { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.2); }
.br-status .br-btn text { color: #fff; }
.br-status .br-btn:active { background: rgba(255,255,255,0.25); }
.br-status .br-btn-d text { color: #ffb3b0; }

/* Overlay */
.br-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: flex-end; justify-content: center; z-index: 9999; }
.br-overlay-box { width: 100%; background: var(--bg1); border: 1px solid var(--border); border-radius: 16rpx 16rpx 0 0; padding: 48rpx; }
.br-overlay-hd { font-weight: 700; font-size: 28rpx; color: #f0f6fc; margin-bottom: 32rpx; text-align: center; }
.br-overlay-opt { padding: 28rpx 24rpx; border-radius: 12rpx; }
.br-overlay-opt:active { background: var(--bg2); }
.br-overlay-label { display: block; font-size: 26rpx; font-weight: 600; color: var(--fg0); }
.br-overlay-desc  { display: block; font-size: 22rpx; color: var(--fg1); margin-top: 4rpx; }
.br-overlay-cancel { text-align: center; padding: 28rpx; color: var(--fg1); margin-top: 16rpx; font-size: 24rpx; }

/* H5 font override */
/* #ifdef H5 */
.br-shell { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
.br-stats, .br-list, .br-input, .br-badge, .br-stack-pre, .br-status text { font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', 'Consolas', monospace; }
/* #endif */
</style>
