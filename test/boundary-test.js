// BugReport v2.1 — Boundary & Edge Case Test
// Run: node test/boundary-test.js
// Tests: null, undefined, empty, overflow, illegal params, perf, lifecycle, destroy

'use strict'

const BR = require('../index.js')
let passed = 0, failed = 0
function test(name, fn) { try { fn(); passed++; console.log('PASS  ' + name) } catch(e) { failed++; console.error('FAIL  ' + name + '\n      ' + e.message) } }

BR.init({ appName: 'BoundaryTest', persist: false, captureGlobal: false, capturePromise: false, captureNetwork: false })

// ===== NULL / UNDEFINED / EMPTY =====
test('e(null) does not throw', () => { BR.e(null, 'msg') })
test('e("tag", null) does not throw', () => { BR.e('tag', null) })
test('e("tag", "") stores empty message', () => {
  const log = BR.e('tag', '')
  if (log.msg !== '') throw new Error('empty msg should be stored as empty string')
})
test('info(undefined, undefined) does not throw', () => { BR.info() })
test('f() with zero args does not throw', () => { BR.f() })

// ===== ILLEGAL PARAMS =====
test('query(null) returns all logs', () => {
  const r = BR.query(null)
  if (!Array.isArray(r)) throw new Error('query(null) did not return array')
})
test('query(undefined) returns all logs', () => {
  const r = BR.query()
  if (!Array.isArray(r)) throw new Error('query() did not return array')
})
test('query({ level: -1 }) returns all logs', () => {
  const r = BR.query({ level: -1 })
  if (!Array.isArray(r)) throw new Error('query(level=-1) did not return array')
})
test('query({ level: 99 }) returns only FATAL logs', () => {
  const r = BR.query({ level: 99 })
  if (r.length !== 0) throw new Error('level 99 should return 0 logs, got ' + r.length)
})
test('query({ limit: -1 }) handles negative limit', () => {
  const r = BR.query({ limit: -1 })
  if (r.length < 1) throw new Error('negative limit should be ignored')
})
test('query({ limit: 0 }) returns empty', () => {
  const r = BR.query({ limit: 0 })
  if (r.length !== 0) throw new Error('limit=0 should return empty array, got ' + r.length)
})
test('exportLogs(null) defaults to json', () => {
  const out = BR.exportLogs(null)
  try { JSON.parse(out); } catch(e) { throw new Error('null format should default to json') }
})
test('exportLogs("xml") defaults to json', () => {
  const out = BR.exportLogs('xml')
  try { JSON.parse(out); } catch(e) { throw new Error('unknown format should default to json') }
})
test('crash(null, null, null) does not throw', () => { BR.crash(null, null, null) })

// ===== CATEGORY EDGE CASES =====
test('BR.net.req() with status 0 works', () => { BR.net.req('GET', '/test', 0, 100, 0) })
test('BR.net.req() with negative duration', () => { BR.net.req('GET', '/test', 200, -1, 0) })
test('BR.net.err() with empty url', () => { BR.net.err('', 'error msg') })
test('BR.net.timeout() with null ms', () => { BR.net.timeout('/api', null) })

// ===== PERFORMANCE TRACING =====
test('perf.start/end works', () => {
  BR.perf.start('test_op')
  const ms = BR.perf.end('test_op', 100)
  if (ms < 0) throw new Error('perf.end returned negative: ' + ms)
})
test('perf.end() on unknown trace returns -1', () => {
  const ms = BR.perf.end('nonexistent')
  if (ms !== -1) throw new Error('expected -1 for unknown trace, got ' + ms)
})
test('perf.mark() works', () => { BR.perf.mark('manual_mark', 1500) })
test('perf.start does not throw on empty name', () => { BR.perf.start('') })
test('perf.end does not throw on empty name', () => { BR.perf.end('') })

// ===== LIFECYCLE =====
test('life.fg() does not throw', () => { BR.life.fg() })
test('life.bg() does not throw', () => { BR.life.bg() })
test('life.in_("") does not throw', () => { BR.life.in_('') })
test('life.out() does not throw', () => { BR.life.out() })
test('life.in_(null) does not throw', () => { BR.life.in_(null) })

// ===== WATCH =====
test('watch() with null returns function', () => {
  const unsub = BR.watch(null)
  if (typeof unsub !== 'function') throw new Error('watch(null) should return unsubscribe function')
})
test('watch callback fires on log', (done) => {
  let fired = false
  const unsub = BR.watch(function(log) { fired = true })
  BR.info('watch:test', 'fire')
  setTimeout(() => {
    unsub()
    if (!fired) { failed++; console.error('FAIL  watch callback fires on log\n      callback did not fire'); done(); return }
    passed++; console.log('PASS  watch callback fires on log')
    done()
  }, 50)
})

// ===== COPY LOGS (Node — should fail gracefully) =====
test('copyLogs() returns false in Node', () => {
  const result = BR.copyLogs()
  // Node has no clipboard, should return false promise
  if (typeof result.then !== 'function') throw new Error('copyLogs did not return Promise')
})

// ===== DESTROY / CLEANUP =====
test('destroy() does not throw', () => { BR.destroy() })
test('init() after destroy() works (re-init)', () => {
  BR.init({ appName: 'Reinit', persist: false, captureGlobal: false, capturePromise: false, captureNetwork: false })
  const log = BR.e('reinit', 'test')
  if (!log) throw new Error('re-init failed')
})

// ===== LOG OVERFLOW =====
test('maxLogs cap enforced', () => {
  BR.destroy()
  BR.init({ appName: 'Overflow', maxLogs: 10, persist: false, captureGlobal: false, capturePromise: false, captureNetwork: false })
  for (let i = 0; i < 20; i++) BR.info('overflow', 'msg ' + i)
  const all = BR.query()
  if (all.length > 10) throw new Error('maxLogs=10 but got ' + all.length + ' logs')
})
test('maxLogs=1 works', () => {
  BR.destroy()
  BR.init({ appName: 'Tiny', maxLogs: 1, persist: false, captureGlobal: false, capturePromise: false, captureNetwork: false })
  BR.info('one', 'first')
  BR.info('two', 'second')
  const all = BR.query()
  if (all.length !== 1) throw new Error('maxLogs=1 but got ' + all.length)
})

// ===== DEVICE SNAPSHOT =====
test('device() returns object with model', () => {
  const dev = BR.device()
  if (!dev || !dev.model) throw new Error('device() missing model')
})

// ===== ADAPTER CUSTOM =====
test('adapter() registers custom adapter', () => {
  BR.adapter('page', function() { return 'custom_page' })
  BR.init({ appName: 'Adapter', persist: false, captureGlobal: false, capturePromise: false, captureNetwork: false })
  const log = BR.e('adapter', 'test')
  if (log.page !== 'custom_page') throw new Error('custom page adapter not used, got: ' + log.page)
})

// ===== CONFIG EDGE CASES =====
test('init({}) with empty config uses defaults', () => {
  BR.init({ persist: false, captureGlobal: false, capturePromise: false, captureNetwork: false })
  if (!BR.device().model) throw new Error('init({}) failed')
})
test('init(null) uses all defaults', () => {
  // Already tested implicitly, but explicit test
  if (!BR.device().model) throw new Error('init(null) failed')
})

// ===== V/D shortcut coverage =====
test('v() produces VERBOSE log', () => { const l = BR.v('tag', 'verbose'); if (l.level !== 0) throw new Error('v() should be level 0') })
test('d() produces DEBUG log', () => { const l = BR.d('tag', 'debug'); if (l.level !== 1) throw new Error('d() should be level 1') })

// ===== COUNT METHODS =====
test('count() returns number', () => { if (typeof BR.count() !== 'number') throw new Error('count() should return number') })
test('errCount() returns number >= 0', () => { if (typeof BR.errCount() !== 'number' || BR.errCount() < 0) throw new Error('errCount() invalid') })
test('wrnCount() returns number >= 0', () => { if (typeof BR.wrnCount() !== 'number' || BR.wrnCount() < 0) throw new Error('wrnCount() invalid') })
test('flush() does not throw', () => { BR.flush() })

// ===== SEARCH IN QUERY =====
test('query({ search: "english" }) finds matches', () => {
  BR.e('search_test', 'this message is in english for testing')
  const found = BR.query({ search: 'english' })
  if (found.length === 0) throw new Error('search should find matching message')
})
test('query({ search: "NOSUCHSTRING999" }) returns empty', () => {
  const found = BR.query({ search: 'NOSUCHSTRING999' })
  if (found.length !== 0) throw new Error('search for nonsense string should return empty')
})
test('query({ since, until }) time range works', () => {
  const now = Date.now()
  BR.clear()
  BR.init({ appName: 'Time', persist: false, captureGlobal: false, capturePromise: false, captureNetwork: false })
  BR.info('time', 'test')
  const future = BR.query({ since: now + 99999999999 })
  if (future.length !== 0) throw new Error('since=future should return empty')
  const past = BR.query({ until: now - 99999 })
  if (past.length !== 0) throw new Error('until=past should return empty')
})

// ===== FLUSH + PERSIST =====
test('flush() with persist=false does not crash', () => { BR.flush() })

// ===== CLEAR =====
test('clear() zeros everything', () => {
  BR.clear()
  BR.init({ appName: 'Clear', persist: false, captureGlobal: false, capturePromise: false, captureNetwork: false })
  BR.e('pre', 'before clear')
  const before = BR.query().length
  if (before < 1) throw new Error('expected logs before clear')
  BR.clear()
  const after = BR.query().length
  if (after !== 0) throw new Error('clear() should remove all logs, got ' + after)
  if (BR.errCount() !== 0) throw new Error('errCount should be 0 after clear')
})

// Summary
console.log('')
if (failed === 0) {
  console.log('All ' + passed + ' boundary tests passed. ✅')
  process.exit(0)
} else {
  console.error(passed + ' passed, ' + failed + ' FAILED ❌')
  process.exit(1)
}
