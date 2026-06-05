<template>
  <view class="page">
    <text class="title">BugReport v2.1 Test</text>
    <text class="status" v-if="status">{{ status }}</text>

    <button @tap="runTest">Run All Tests</button>

    <view class="results">
      <text :class="r.pass ? 'pass' : 'fail'" v-for="(r, i) in results" :key="i">
        {{ r.pass ? '✅' : '❌' }} {{ r.name }}
      </text>
    </view>

    <button @tap="goViewer">Open Log Viewer</button>
  </view>
</template>

<script>
import BR from '../../utils/bug-report.js'

export default {
  data() {
    return { status: '', results: [] }
  },
  onLoad() {
    this.status = BR ? 'BugReport loaded' : 'BugReport NOT loaded'
  },
  methods: {
    runTest() {
      this.results = []
      const t = (n, fn) => { try { fn(); this.results.push({ name: n, pass: true }) } catch(e) { this.results.push({ name: n + ' — ' + e.message, pass: false }) } }

      t('init returns device', () => {
        const d = BR.device()
        if (!d || !d.model) throw new Error('no device')
      })
      t('e() produces error', () => {
        const l = BR.e('test', 'verify error')
        if (l.level !== 4) throw new Error('wrong level')
      })
      t('w() produces warn', () => {
        const l = BR.w('test', 'verify warn')
        if (l.level !== 3) throw new Error('wrong level')
      })
      t('info() produces info', () => {
        const l = BR.info('test', 'verify info')
        if (l.level !== 2) throw new Error('wrong level')
      })
      t('query() works', () => {
        const r = BR.query({ level: 4 })
        if (!Array.isArray(r)) throw new Error('not array')
      })
      t('stats() works', () => {
        const s = BR.stats()
        if (typeof s.total !== 'number') throw new Error('no total')
      })
      t('exportLogs(text)', () => {
        const t = BR.exportLogs('text')
        if (!t.includes('BugReport')) throw new Error('bad export')
      })
      t('net.req() works', () => {
        BR.net.req('GET', '/test', 200, 100, 0)
        const n = BR.query({ cat: 'NETWORK' })
        if (n.length === 0) throw new Error('no network log')
      })
      t('perf.start/end works', () => {
        BR.perf.start('test_perf')
        const ms = BR.perf.end('test_perf')
        if (ms < 0) throw new Error('perf failed')
      })
      t('life.fg/bg works', () => {
        BR.life.fg()
        BR.life.bg()
      })

      const pass = this.results.filter(r => r.pass).length
      this.status = pass + '/' + this.results.length + ' passed'
    },
    goViewer() {
      uni.navigateTo({ url: '/pages/debug-log/debug-log' })
    }
  }
}
</script>

<style>
.page { padding: 20px; background: #0d1117; min-height: 100vh; color: #c9d1d9; }
.title { font-size: 20px; font-weight: bold; color: #f0f6fc; display: block; margin-bottom: 10px; }
.status { font-size: 14px; color: #58a6ff; display: block; margin-bottom: 20px; }
button { background: #21262d; color: #c9d1d9; border: 1px solid #30363d; border-radius: 6px; padding: 10px 20px; margin: 8px 0; font-size: 14px; }
.results { margin: 16px 0; }
.pass { color: #3fb950; display: block; font-size: 12px; margin: 2px 0; }
.fail { color: #f85149; display: block; font-size: 12px; margin: 2px 0; }
</style>
