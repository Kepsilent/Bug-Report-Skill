// ============================================================
// BugReport — Universal Logging Library v2.1
// ============================================================
// Zero dependencies · UMD · 12KB gzipped · MIT License
//
//   import BR from 'bugreport'
//   BR.init({ appName: 'MyApp' })
//   BR.e('tag', 'something went wrong')
//
// Platforms: uni-app / WeChat Mini Program / React Native / Capacitor / Browser / Node
// ============================================================

;(function (root, factory) {
  /* eslint-disable */
  if (typeof define === 'function' && define.amd) { define([], factory) }
  else if (typeof module === 'object' && module.exports) { var _exp = factory(); module.exports = _exp; root.BugReport = _exp }
  else { root.BugReport = factory() }
}(typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : this), function () {
  'use strict'

  // ---- Constants ----
  var LEVEL = Object.freeze({ VERBOSE: 0, DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4, FATAL: 5 })
  var LEVEL_LABEL = ['V', 'D', 'I', 'W', 'E', 'F']
  var LEVEL_NAME  = ['VERBOSE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']
  var CAT = {
    CRASH:     'CRASH',
    NETWORK:   'NETWORK',
    RENDER:    'RENDER',
    LIFECYCLE: 'LIFECYCLE',
    PERF:      'PERF',
    STORAGE:   'STORAGE',
    AUDIO:     'AUDIO',
    VIDEO:     'VIDEO',
    EVAL:      'EVAL',
    APP:       'APP',
    USER:      'USER',
    SYSTEM:    'SYSTEM'
  }

  var DEFAULT_MAX   = 500
  var STORAGE_KEY   = 'bugreport_logs'
  var STATS_KEY     = 'bugreport_stats'
  var PERSIST_MS    = 5000

  // ---- Internal State ----
  var _ok    = false
  var _cfg   = { maxLogs: DEFAULT_MAX, minLevel: 0, persist: true, captureGlobal: false, capturePromise: false, captureNetwork: true, appName: '', appVersion: '1.0.0' }
  var _logs  = []
  var _seq   = 0
  var _watch = []
  var _trace = {}
  var _dev   = {}
  var _adapt = { storage: null, device: null, page: null, net: null }
  var _timer = null
  var _stats = { errors: 0, warns: 0, fatals: 0, byCat: {}, byPage: {}, start: Date.now() }

  // ---- Adapters ----
  function adapter(type, impl) {
    _adapt[type] = typeof impl === 'function' ? { get: impl } : impl
  }

  function autoAdapt() {
    // uni-app
    if (typeof uni !== 'undefined') {
      adapter('device', function () {
        try { var i = uni.getSystemInfoSync(); return { model: i.model||'', brand: i.brand||'', system: i.osName||i.platform||'', osVer: i.osVersion||i.system||'', appVer: i.appVersion||_cfg.appVersion, appName: i.appName||_cfg.appName||'', w: i.windowWidth||0, h: i.windowHeight||0, dpr: i.pixelRatio||1, lang: i.language||'' } } catch(e) { return {} }
      })
      adapter('storage', {
        get: function(k) { try { return uni.getStorageSync(k) } catch(e) { return null } },
        set: function(k,v) { try { uni.setStorageSync(k,v) } catch(e) {} },
        del: function(k) { try { uni.removeStorageSync(k) } catch(e) {} }
      })
      adapter('page', function () {
        try { var p = getCurrentPages(); return p.length ? (p[p.length-1].route||'') : '' } catch(e) { return '' }
      })
      adapter('net', {
        type: function () {
          try {
            /* #ifdef APP-PLUS */
            if (typeof plus !== 'undefined') { var t = plus.networkinfo.getCurrentType(); return ['unknown','none','ethernet','wifi','2g','3g','4g','5g'][t]||'unknown' }
            /* #endif */
            return 'unknown'
          } catch(e) { return 'unknown' }
        },
        watch: function(cb) {
          try { if (typeof document !== 'undefined') document.addEventListener('netchange', function() { cb(_adapt.net.type()) }, false) } catch(e) {}
        }
      })
    }
    // WeChat Mini Program (standalone, not uni-app compiled)
    else if (typeof wx !== 'undefined' && wx.getSystemInfoSync && typeof uni === 'undefined') {
      adapter('device', function () {
        try { var i = wx.getSystemInfoSync(); return { model: i.model||'', brand: i.brand||'', system: 'wechat', osVer: i.system||'', appVer: _cfg.appVersion, appName: _cfg.appName||'', w: i.windowWidth||0, h: i.windowHeight||0, dpr: i.pixelRatio||1, lang: i.language||'' } } catch(e) { return {} }
      })
      adapter('storage', {
        get: function(k) { try { var v = wx.getStorageSync(k); return v ? JSON.parse(v) : null } catch(e) { return null } },
        set: function(k,v) { try { wx.setStorageSync(k, JSON.stringify(v)) } catch(e) {} },
        del: function(k) { try { wx.removeStorageSync(k) } catch(e) {} }
      })
      adapter('page', function () {
        try { var p = getCurrentPages(); return p.length ? (p[p.length-1].route||'') : '' } catch(e) { return '' }
      })
      adapter('net', {
        type: function () {
          var type = 'unknown'
          try {
            wx.getNetworkType({ success: function(res) { type = res.networkType || 'unknown' } })
          } catch(e) {}
          return type
        },
        watch: function(cb) {
          try { wx.onNetworkStatusChange(function(res) { _dev.netType = res.networkType; cb(res.networkType) }) } catch(e) {}
        }
      })
    }
    // React Native
    else if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
      adapter('device', function () {
        return { model: 'ReactNative', system: (navigator.platform||'android'), appVer: _cfg.appVersion, appName: _cfg.appName||'', w: 0, h: 0, dpr: 1, lang: '' }
      })
      var _rnMem = {}
      adapter('storage', { get: function(k) { return _rnMem[k]||null }, set: function(k,v) { _rnMem[k]=v }, del: function(k) { delete _rnMem[k] } })
      adapter('page', function () { return 'RN' })
    }
    // Browser / WebView (Capacitor, Cordova, etc.)
    else if (typeof window !== 'undefined') {
      adapter('device', function () {
        return { model: (navigator.userAgent||'').slice(0,100), system: navigator.platform||'web', appVer: _cfg.appVersion, appName: _cfg.appName||document.title||'', w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio||1, lang: navigator.language||'' }
      })
      adapter('storage', {
        get: function(k) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null } catch(e) { return null } },
        set: function(k,v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch(e) {} },
        del: function(k) { try { localStorage.removeItem(k) } catch(e) {} }
      })
      adapter('page', function () { return window.location.pathname })
    }
    // Node
    else if (typeof process !== 'undefined') {
      adapter('device', function () { return { model: 'node', system: process.platform, osVer: process.version } })
      var _mem = {}
      adapter('storage', {
        get: function(k) { return _mem[k]||null },
        set: function(k,v) { _mem[k]=v },
        del: function(k) { delete _mem[k] }
      })
    }
    // Fallback
    else {
      var _m2 = {}
      adapter('storage', { get: function(k) { return _m2[k]||null }, set: function(k,v) { _m2[k]=v }, del: function(k) { delete _m2[k] } })
      adapter('device', function () { return { model:'unknown' } })
      adapter('page', function () { return 'unknown' })
    }
  }

  // ---- Init ----
  function init(cfg) {
    if (_ok) return
    _ok = true
    if (cfg) for (var k in cfg) { if (cfg.hasOwnProperty(k)) _cfg[k] = cfg[k] }

    autoAdapt()

    if (_adapt.device) _dev = (_adapt.device.get ? _adapt.device.get() : _adapt.device()) || {}

    // restore
    if (_cfg.persist && _adapt.storage) {
      try { var s = _adapt.storage.get(STORAGE_KEY); if (Array.isArray(s)) _logs = s.slice(-_cfg.maxLogs); _seq = _logs.length } catch(e) { _logs = [] }
      try { var st = _adapt.storage.get(STATS_KEY); if (st) _stats = Object.assign(_stats, st) } catch(e) {}
    }

    _stats.start = Date.now()

    // global capture
    if (_cfg.captureGlobal) {
      try {
        if (typeof uni !== 'undefined' && uni.onError) {
          uni.onError(function(e) { _emit(LEVEL.FATAL, CAT.CRASH, 'JS Crash', String(e), '') })
        } else if (typeof window !== 'undefined') {
          window.addEventListener('error', function(e) { _emit(LEVEL.FATAL, CAT.CRASH, 'JS Crash', e.message||String(e.error), (e.error&&e.error.stack)||'') })
        }
      } catch(e) {}
    }
    if (_cfg.capturePromise) {
      try {
        if (typeof uni !== 'undefined' && uni.onUnhandledRejection) {
          uni.onUnhandledRejection(function(r) { var m=r&&r.reason; _emit(LEVEL.ERROR, CAT.CRASH, 'Unhandled Promise', m instanceof Error?m.message:String(m||''), m instanceof Error?m.stack:'') })
        } else if (typeof window !== 'undefined') {
          window.addEventListener('unhandledrejection', function(e) { _emit(LEVEL.ERROR, CAT.CRASH, 'Unhandled Promise', String(e.reason||''), (e.reason&&e.reason.stack)||'') })
        }
      } catch(e) {}
    }

    // network watch
    if (_adapt.net && _adapt.net.watch) {
      _adapt.net.watch(function(type) { _dev.netType = type; _emit(LEVEL.INFO, CAT.NETWORK, 'net:change', type) })
    }

    _dev.netType = _adapt.net && _adapt.net.type ? _adapt.net.type() : 'unknown'

    // auto-patch network
    if (_cfg.captureNetwork) _patchNetwork()

    _emit(LEVEL.INFO, CAT.APP, 'app:launch', 'BugReport v2.1 initialized')

    if (_cfg.persist) _timer = setInterval(_persist, PERSIST_MS)

    return { device: _dev, count: _logs.length }
  }

  // ---- Core ----
  function _emit(level, category, tag, message, stack, extra) {
    if (!_ok) init()
    if (level < _cfg.minLevel) return

    var now = Date.now()
    _seq++
    var log = {
      id:     _seq,
      time:   new Date(now).toISOString(),
      ts:     now,
      level:  level,
      tagL:   LEVEL_LABEL[level] || '?',
      tagN:   LEVEL_NAME[level] || '?',
      cat:    Object.values(CAT).indexOf(category)>=0 ? category : CAT.APP,
      tag:    String(tag||''),
      msg:    String(message||''),
      stack:  String(stack||''),
      page:   _adapt.page ? (_adapt.page.get ? _adapt.page.get() : _adapt.page()) : '',
      extra:  extra || null
    }

    _logs.push(log)
    while (_logs.length > _cfg.maxLogs) _logs.shift()

    if (level >= LEVEL.ERROR) _stats.errors++
    if (level === LEVEL.WARN) _stats.warns++
    if (level === LEVEL.FATAL) _stats.fatals++
    _stats.byCat[category] = (_stats.byCat[category]||0) + 1
    _stats.byPage[log.page] = (_stats.byPage[log.page]||0) + 1

    _notify(log)
    return log
  }

  function _notify(log) {
    if (!_watch.length) return
    setTimeout(function() { _watch.forEach(function(cb) { try { cb(log) } catch(e) {} }) }, 0)
  }

  // ---- Shortcuts ----
  function v(t,m,x) { return _emit(LEVEL.VERBOSE, CAT.APP, t, m, '', x) }
  function d(t,m,x) { return _emit(LEVEL.DEBUG,   CAT.APP, t, m, '', x) }
  function i(t,m,x) { return _emit(LEVEL.INFO,    CAT.APP, t, m, '', x) }
  function w(t,m,x) { return _emit(LEVEL.WARN,    CAT.APP, t, m, '', x) }
  function e(t,m,x) { return _emit(LEVEL.ERROR,   CAT.APP, t, m, '', x) }
  function f(t,m,x) { return _emit(LEVEL.FATAL,   CAT.CRASH, t, m, '', x) }

  // ---- Network ----
  var net = {
    req: function(method, url, status, dur, size) {
      var lvl = status >= 500 ? LEVEL.ERROR : status >= 400 ? LEVEL.WARN : dur > 10000 ? LEVEL.ERROR : dur > 3000 ? LEVEL.WARN : LEVEL.INFO
      return _emit(lvl, CAT.NETWORK, 'net:req', method + ' ' + String(url).slice(-80), '', { method:method, url:url, status:status, duration:dur, size:size||0 })
    },
    err: function(url, err) { return _emit(LEVEL.ERROR, CAT.NETWORK, 'net:err', String(err), '', { url:url }) },
    slow: function(url, ms) { return _emit(LEVEL.WARN, CAT.NETWORK, 'net:slow', ms+'ms '+String(url).slice(-80), '', { url:url, duration:ms }) },
    timeout: function(url, ms) { return _emit(LEVEL.ERROR, CAT.NETWORK, 'net:timeout', (ms||'?')+'ms', '', { url:url }) }
  }

  // ---- WeChat Mini Program Wrapper ----
  // wx.request cannot be monkey-patched (C++ binding), so provide a manual wrapper
  var wxWrap = {
    req: function(opts) {
      if (!opts || !opts.url) return
      var start = Date.now()
      var origSuccess = opts.success
      var origFail = opts.fail
      var origComplete = opts.complete
      opts.success = function(res) {
        var dur = Date.now() - start
        var size = 0
        try { size = JSON.stringify(res.data||'').length } catch(e) {}
        net.req(opts.method||'GET', opts.url, res.statusCode, dur, size)
        if (typeof origSuccess === 'function') origSuccess(res)
        if (typeof origComplete === 'function') origComplete(res)
      }
      opts.fail = function(err) {
        net.err(opts.url, err.errMsg||'wx.request failed')
        if (typeof origFail === 'function') origFail(err)
        if (typeof origComplete === 'function') origComplete(err)
      }
      wx.request(opts)
    },
    get: function(url, data, success, fail) {
      wxWrap.req({ url: url, method: 'GET', data: data, success: success, fail: fail })
    },
    post: function(url, data, success, fail) {
      wxWrap.req({ url: url, method: 'POST', data: data, success: success, fail: fail })
    }
  }

  // ---- Network Auto-Patch ----
  var _netFetchRef = null
  var _netXHROpenRef = null
  var _netXHRSendRef = null

  function _patchNetwork() {
    if (typeof window === 'undefined') return

    // --- fetch ---
    if (window.fetch && !window.fetch.__br_patched) {
      _netFetchRef = window.fetch
      window.fetch = function(input, init) {
        var url = ''
        var method = ((init && init.method) || 'GET').toUpperCase()
        try {
          if (typeof input === 'string') { url = input }
          else if (input && typeof input.url === 'string') { url = input.url; method = (input.method || method).toUpperCase() }
          else { url = String(input||'') }
        } catch(e) { url = String(input||'') }

        var start = Date.now()
        return _netFetchRef.call(this, input, init).then(function(resp) {
          var dur = Date.now() - start
          var size = 0
          try { var cl = resp.headers.get('content-length'); if (cl) size = parseInt(cl)||0 } catch(e) {}
          net.req(method, url, resp.status, dur, size)
          return resp
        }).catch(function(err) {
          net.err(url, err.message || String(err))
          throw err
        })
      }
      window.fetch.__br_patched = true
    }

    // --- XMLHttpRequest ---
    if (typeof XMLHttpRequest !== 'undefined' && !XMLHttpRequest.__br_patched) {
      _netXHROpenRef = XMLHttpRequest.prototype.open
      _netXHRSendRef = XMLHttpRequest.prototype.send
      XMLHttpRequest.prototype.open = function(method, url) {
        this.__br_method = method
        this.__br_url = url
        return _netXHROpenRef.apply(this, arguments)
      }
      XMLHttpRequest.prototype.send = function() {
        var self = this
        self.__br_start = Date.now()
        var onEnd = function() {
          var dur = Date.now() - (self.__br_start || Date.now())
          var size = 0
          try { var cl = self.getResponseHeader('content-length'); if (cl) size = parseInt(cl)||0 } catch(e) {}
          try { net.req(self.__br_method||'?', self.__br_url||'', self.status, dur, size) } catch(e) {}
        }
        self.addEventListener('loadend', onEnd)
        self.addEventListener('error', function() {
          try { net.err(self.__br_url||'', 'XHR Error') } catch(e) {}
        })
        self.addEventListener('timeout', function() {
          try { net.timeout(self.__br_url||'', Date.now() - (self.__br_start||Date.now())) } catch(e) {}
        })
        return _netXHRSendRef.apply(this, arguments)
      }
      XMLHttpRequest.__br_patched = true
    }
  }

  function _unpatchNetwork() {
    if (typeof window === 'undefined') return
    if (_netFetchRef) { window.fetch = _netFetchRef; _netFetchRef = null }
    if (_netXHROpenRef) { XMLHttpRequest.prototype.open = _netXHROpenRef; _netXHROpenRef = null }
    if (_netXHRSendRef) { XMLHttpRequest.prototype.send = _netXHRSendRef; _netXHRSendRef = null }
  }

  // ---- Performance ----
  var perf = {
    start: function(name) { _trace[name] = Date.now() },
    end: function(name, threshold) {
      var t = _trace[name]; if (!t) return -1; delete _trace[name]
      var ms = Date.now() - t
      var lvl = ms > (threshold||3000) ? LEVEL.WARN : LEVEL.INFO
      _emit(lvl, CAT.PERF, 'perf:'+name, ms+'ms', '', { duration:ms, threshold:threshold })
      return ms
    },
    mark: function(name, ms) { _emit(ms>3000?LEVEL.WARN:LEVEL.INFO, CAT.PERF, 'perf:'+name, ms+'ms', '', { duration:ms }) }
  }

  // ---- Lifecycle ----
  var life = {
    fg: function() { _emit(LEVEL.INFO, CAT.LIFECYCLE, 'life:foreground', '') },
    bg: function() { _emit(LEVEL.INFO, CAT.LIFECYCLE, 'life:background', '') },
    in_: function(p) { _emit(LEVEL.DEBUG, CAT.LIFECYCLE, 'life:page-in', p||'') },
    out: function(p) { _emit(LEVEL.DEBUG, CAT.LIFECYCLE, 'life:page-out', p||'') }
  }

  // ---- Watch ----
  function watch(cb) {
    if (typeof cb !== 'function') return function(){}
    _watch.push(cb)
    return function() { _watch = _watch.filter(function(w) { return w !== cb }) }
  }

  // ---- Query ----
  function query(f) {
    f = f || {}
    var r = _logs.slice()
    if (f.level  !== undefined) r = r.filter(function(l) { return l.level >= f.level })
    if (f.cat)    r = r.filter(function(l) { return l.cat === f.cat })
    if (f.page)   r = r.filter(function(l) { return l.page.indexOf(f.page)>=0 })
    if (f.tag)    r = r.filter(function(l) { return l.tag.indexOf(f.tag)>=0 })
    if (f.search) { var s = f.search.toLowerCase(); r = r.filter(function(l) { return (l.msg+l.tag+l.page+l.cat).toLowerCase().indexOf(s)>=0 }) }
    if (f.since)  r = r.filter(function(l) { return l.ts >= f.since })
    if (f.until)  r = r.filter(function(l) { return l.ts <= f.until })
    r.reverse()
    if (f.limit !== undefined && f.limit !== null) r = r.slice(0, f.limit)
    return r
  }

  function count(f)  { init(); return query(f).length }
  function errCount(){ init(); return _logs.filter(function(l){return l.level>=LEVEL.ERROR}).length }
  function wrnCount(){ init(); return _logs.filter(function(l){return l.level===LEVEL.WARN}).length }

  function stats() {
    init()
    return {
      total: _logs.length, errors: errCount(), warnings: wrnCount(),
      fatals: _stats.fatals, sessionMs: Date.now() - _stats.start,
      byCat: Object.assign({}, _stats.byCat), byPage: Object.assign({}, _stats.byPage),
      device: Object.assign({}, _dev)
    }
  }

  // ---- Export ----
  function exportLogs(format, f) {
    var logs = query(f)
    var dev = _dev

    if (format === 'csv') {
      var c = 'id,time,level,category,tag,message,page\n'
      logs.forEach(function(l) { c += [l.id, l.time, l.tagN, l.cat, l.tag, '"'+(l.msg||'').replace(/"/g,'""')+'"', l.page].join(',') + '\n' })
      return c
    }

    if (format === 'text') {
      var t  = 'BugReport Log Export\n'
      t += new Array(61).join('=') + '\n'
      t += 'Device:  ' + [dev.brand, dev.model].filter(Boolean).join(' ') + '\n'
      t += 'System:  ' + [dev.system, dev.osVer].filter(Boolean).join(' ') + '\n'
      t += 'App:     ' + [dev.appName, 'v'+dev.appVer].filter(Boolean).join(' ') + '\n'
      t += 'Export:  ' + new Date().toISOString() + '\n'
      t += 'Logs:    ' + logs.length + ' | Errors: ' + errCount() + ' | Warnings: ' + wrnCount() + '\n'
      t += new Array(61).join('=') + '\n\n'

      if (!logs.length) { t += 'No logs.\n'; return t }

      logs.forEach(function(l) {
        var icon = l.level >= LEVEL.ERROR ? '[E]' : l.level >= LEVEL.WARN ? '[W]' : l.level >= LEVEL.INFO ? '[I]' : '[D]'
        t += '#' + l.id + ' ' + icon + ' ' + l.time.slice(11,23) + ' ' + l.cat + ' ' + l.tag + '\n'
        t += '  page: ' + l.page + '\n'
        if (l.msg)   t += '  ' + l.msg + '\n'
        if (l.stack) t += '  stack: ' + l.stack.split('\n').slice(0,3).join('\n  > ') + '\n'
        if (l.extra) {
          try { t += '  data: ' + JSON.stringify(l.extra) + '\n' } catch(e) {}
        }
        t += '\n'
      })
      return t
    }

    // json
    return JSON.stringify({ exportedAt: new Date().toISOString(), device: dev, stats: stats(), filter: f, logs: logs }, null, 2)
  }

  function copyLogs(f) {
    var text = exportLogs('text', f)
    return new Promise(function(resolve) {
      if (typeof wx !== 'undefined' && wx.setClipboardData) {
        wx.setClipboardData({ data: text, success: function(){resolve(true)}, fail: function(){resolve(false)} })
      } else if (typeof uni !== 'undefined') {
        uni.setClipboardData({ data: text, success: function(){resolve(true)}, fail: function(){resolve(false)} })
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function(){resolve(true)}).catch(function(){resolve(false)})
      } else {
        resolve(false)
      }
    })
  }

  // ---- Persist ----
  function _persist() {
    if (!_cfg.persist || !_adapt.storage) return
    try {
      _adapt.storage.set(STORAGE_KEY, _logs.slice(-_cfg.maxLogs))
      _adapt.storage.set(STATS_KEY, { errors:_stats.errors, warns:_stats.warns, fatals:_stats.fatals, byCat:_stats.byCat, byPage:_stats.byPage })
    } catch(e) {}
  }

  function clear() {
    _logs=[]; _seq=0
    _stats.errors=0; _stats.warns=0; _stats.fatals=0; _stats.byCat={}; _stats.byPage={}
    try { if(_adapt.storage) { _adapt.storage.del(STORAGE_KEY); _adapt.storage.del(STATS_KEY) } } catch(e) {}
  }

  function flush() { _persist() }
  function destroy() { if(_timer){clearInterval(_timer);_timer=null}; _persist(); _watch=[]; _unpatchNetwork(); _ok = false }

  // ---- API ----
  return {
    // Constants
    LEVEL: LEVEL, LEVEL_LABEL: LEVEL_LABEL, LEVEL_NAME: LEVEL_NAME, CAT: CAT,
    // Init
    init: init, destroy: destroy, flush: flush, adapter: adapter,
    // Logging
    v: v, d: d, info: i, w: w, e: e, f: f,
    crash: function(t,m,s) { return _emit(LEVEL.FATAL, CAT.CRASH, t, m, s) },
    net: net, wx: wxWrap, perf: perf, life: life,
    // Query
    query: query, count: count, errCount: errCount, wrnCount: wrnCount, stats: stats,
    // Watch
    watch: watch,
    // Export
    exportLogs: exportLogs, copyLogs: copyLogs, clear: clear,
    // Device
    device: function() { init(); return Object.assign({}, _dev) }
  }
}))

var BugReport=(typeof globalThis!=="undefined"?globalThis:typeof window!=="undefined"?window:typeof global!=="undefined"?global:this).BugReport
export default BugReport
