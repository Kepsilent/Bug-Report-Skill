<template>
  <view class="page">
    <text class="title">BRS v3.0 Test</text>
    <text class="status">{{ status }}</text>

    <view class="btns">
      <button @tap="runAll">▶ Run All Tests</button>
      <button @tap="testBasic">1. 基础日志</button>
      <button @tap="testNetwork">2. 网络拦截</button>
      <button @tap="testBreadcrumbs">3. 面包屑追踪</button>
      <button @tap="testSnapshot">4. 状态快照</button>
      <button @tap="testSanitizer">5. 隐私脱敏</button>
      <button @tap="testPerf">6. 性能追踪</button>
      <button @tap="testLifecycle">7. 生命周期</button>
      <button @tap="testQuery">8. 查询导出</button>
      <button @tap="testCrash">9. 崩溃注入</button>
      <button @tap="goViewer">📊 Open Log Viewer</button>
    </view>

    <view class="results">
      <text :class="r.pass ? 'pass' : 'fail'" v-for="(r, i) in results" :key="i">
        {{ r.pass ? '✅' : '❌' }} {{ r.name }}
      </text>
    </view>
  </view>
</template>

<script>
import BR from '../../utils/bug-report.js'

export default {
  data() { return { status: '', results: [] } },
  onLoad() {
    if (BR) { this.status = '✅ BRS loaded — ' + BR.stats().total + ' logs' }
    else { this.status = '❌ BRS NOT loaded' }
  },
  methods: {
    addResult(name, ok, detail) {
      this.results.push({ name: (ok ? '✅ ' : '❌ ') + name + (detail ? ' — ' + detail : ''), pass: ok })
    },
    t(name, fn) { try { fn(); return true } catch(e) { this.addResult(name, false, e.message); return false } },

    testBasic() {
      this.results = []
      this.addResult('init & device', !!BR.device().model)
      BR.v('test', 'verbose'); BR.d('test', 'debug'); BR.info('test', 'info'); BR.w('test', 'warn'); BR.e('test', 'error')
      const err = BR.query({ level: 4 })
      this.addResult('6-level logging (V→E)', err.length >= 1)
      const s = BR.stats()
      this.addResult('stats()', s.total > 0 && s.errors > 0)
      this.status = '✅ Basic: ' + this.results.filter(r=>r.pass).length + '/' + this.results.length
    },

    testNetwork() {
      this.results = []
      BR.net.req('GET', '/test/ok', 200, 120, 512)
      BR.net.req('POST', '/test/auth', 401, 80, 0)
      BR.net.req('PUT', '/test/slow', 200, 5000, 0)
      BR.net.err('/test/fail', 'Connection refused')
      BR.net.timeout('/test/timeout', 30000)
      const n = BR.query({ cat: 'NETWORK' })
      this.addResult('net.req 200 OK', n.some(l => l.extra && l.extra.status === 200))
      this.addResult('net.req 401 Warn', n.some(l => l.extra && l.extra.status === 401))
      this.addResult('net.err logged', n.some(l => l.tag === 'net:err'))
      this.addResult('net.timeout logged', n.some(l => l.tag === 'net:timeout'))
      this.status = '✅ Network: ' + this.results.filter(r=>r.pass).length + '/' + this.results.length
    },

    testBreadcrumbs() {
      this.results = []
      BR.clearCrumbs()
      BR.crumb('nav', 'clicked button A')
      BR.crumb('api', 'POST /order')
      BR.life.fg()
      BR.life.bg()
      const c = BR.crumbs()
      this.addResult('manual crumb() works', c.length >= 2)
      this.addResult('life.fg() auto-crumb', c.some(x => x.tag === 'life:foreground'))
      this.addResult('life.bg() auto-crumb', c.some(x => x.tag === 'life:background'))
      // FIFO test
      BR.clearCrumbs()
      for (let i=0; i<60; i++) BR.crumb('step', ''+i)
      const fifo = BR.crumbs()
      this.addResult('FIFO max 50', fifo.length === 50)
      this.addResult('FIFO oldest kicked', fifo[0].msg === '10')
      this.status = '✅ Breadcrumbs: ' + this.results.filter(r=>r.pass).length + '/' + this.results.length
    },

    testSnapshot() {
      this.results = []
      BR.clearSnapshot()
      BR.snapshot({ userId: 'u999', cart: 3, step: 'checkout' })
      const s = BR.getSnapshot()
      this.addResult('snapshot saved', s && s.userId === 'u999')
      BR.snapshot({ userId: 'u123' })
      this.addResult('snapshot overwrites', BR.getSnapshot().userId === 'u123' && !BR.getSnapshot().cart)
      BR.clearSnapshot()
      this.addResult('clearSnapshot()', BR.getSnapshot() === null)
      this.status = '✅ Snapshot: ' + this.results.filter(r=>r.pass).length + '/' + this.results.length
    },

    testSanitizer() {
      this.results = []
      const s1 = BR.sanitizer.sanitize({ password: 'hunter2', user: 'bob' })
      this.addResult('password → ***', s1.password === '***')
      this.addResult('non-sensitive ok', s1.user === 'bob')
      const s2 = BR.sanitizer.sanitize({ phone: '13812345678' })
      this.addResult('phone → ***', s2.phone === '***')
      const s3 = BR.sanitizer.sanitize({ email: 'alice@example.com' })
      this.addResult('email → ***', s3.email === '***')
      this.addResult('nested sanitize', BR.sanitizer.sanitize({ body: { password: 'x' } }).body.password === '***')
      this.status = '✅ Sanitizer: ' + this.results.filter(r=>r.pass).length + '/' + this.results.length
    },

    testPerf() {
      this.results = []
      BR.perf.start('loadData')
      var ms = BR.perf.end('loadData')
      this.addResult('start/end returns ms', ms >= 0)
      BR.perf.start('slowOp')
      var slowMs = BR.perf.end('slowOp', 1)
      this.addResult('threshold works', slowMs >= 0)
      BR.perf.mark('manual', 1500)
      this.addResult('mark() works', BR.query({ cat:'PERF' }).length > 0)
      this.status = '✅ Perf: ' + this.results.filter(r=>r.pass).length + '/' + this.results.length
    },

    testLifecycle() {
      this.results = []
      BR.life.fg()
      BR.life.bg()
      BR.life.in_('pages/test')
      BR.life.out('pages/test')
      const l = BR.query({ cat: 'LIFECYCLE' })
      this.addResult('fg logged', l.some(x => x.tag === 'life:foreground'))
      this.addResult('bg logged', l.some(x => x.tag === 'life:background'))
      this.addResult('page in logged', l.some(x => x.tag === 'life:page-in'))
      this.addResult('page out logged', l.some(x => x.tag === 'life:page-out'))
      this.status = '✅ Lifecycle: ' + this.results.filter(r=>r.pass).length + '/' + this.results.length
    },

    testQuery() {
      this.results = []
      const all = BR.query()
      const err = BR.query({ level: 4 })
      const net = BR.query({ cat: 'NETWORK' })
      const txt = BR.exportLogs('text')
      const json = BR.exportLogs('json')
      const csv = BR.exportLogs('csv')
      this.addResult('query all', all.length > 0)
      this.addResult('query level=4', err.every(l => l.level >= 4))
      this.addResult('query cat=NETWORK', net.every(l => l.cat === 'NETWORK'))
      this.addResult('export text', txt.includes('BRS Log Export'))
      this.addResult('export json', json.includes('"logs"'))
      this.addResult('export csv', csv.includes('id,time,level'))
      this.status = '✅ Query: ' + this.results.filter(r=>r.pass).length + '/' + this.results.length
    },

    testCrash() {
      this.results = []
      BR.clearCrumbs(); BR.clearSnapshot()
      BR.crumb('nav', 'clicked pay')
      BR.snapshot({ orderId: 'ORD-888', step: 'confirm' })
      BR.crumb('api', 'POST /pay')
      BR.f('crash', 'TypeError: pay is undefined')
      const crash = BR.query({ cat: 'CRASH' })[0]
      this.addResult('crash logged', !!crash)
      this.addResult('crash has breadcrumbs', !!(crash.extra && crash.extra.breadcrumbs && crash.extra.breadcrumbs.length > 0))
      this.addResult('crash has snapshot', !!(crash.extra && crash.extra.snapshot && crash.extra.snapshot.orderId === 'ORD-888'))
      this.status = '✅ Crash: ' + this.results.filter(r=>r.pass).length + '/' + this.results.length
    },

    runAll() {
      this.results = []
      this.testBasic(); this.testNetwork(); this.testBreadcrumbs()
      this.testSnapshot(); this.testSanitizer(); this.testPerf()
      this.testLifecycle(); this.testQuery(); this.testCrash()
      const p = this.results.filter(r=>r.pass).length
      this.status = '🎯 Total: ' + p + '/' + this.results.length + ' passed'
    },

    goViewer() { uni.navigateTo({ url: '/pages/debug-log/debug-log' }) }
  }
}
</script>

<style>
.page { padding: 20px; background: #0d1117; min-height: 100vh; color: #c9d1d9; }
.title { font-size: 24px; font-weight: bold; color: #f0f6fc; display: block; margin-bottom: 6px; }
.status { font-size: 13px; color: #3fb950; display: block; margin-bottom: 16px; }
.btns { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
button { background: #21262d; color: #c9d1d9; border: 1px solid #30363d; border-radius: 6px; padding: 8px 14px; font-size: 12px; }
.results { margin-top: 12px; }
.pass { color: #3fb950; display: block; font-size: 12px; margin: 2px 0; }
.fail { color: #f85149; display: block; font-size: 12px; margin: 2px 0; }
</style>
