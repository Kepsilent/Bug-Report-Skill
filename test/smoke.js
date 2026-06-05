// BugReport v2.1 — Smoke Test (JS SDK)
// Run: node test/smoke.js
// Zero dependencies, tests all core APIs.

'use strict'

const path = require('path')
const BR = require(path.join(__dirname, '..', 'index.js'))

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    passed++
    console.log('PASS  [' + (passed + failed) + '/8] ' + name)
  } catch (e) {
    failed++
    console.error('FAIL  [' + (passed + failed) + '/8] ' + name)
    console.error('      ' + e.message)
  }
}

// 1. init
test('init() returns device info', () => {
  const result = BR.init({ appName: 'TestApp', appVersion: '2.1.0', persist: false, captureGlobal: false, capturePromise: false, captureNetwork: false })
  if (!result || typeof result.device !== 'object') throw new Error('init() did not return device info')
  if (result.device.model !== 'node') throw new Error('expected model=node, got ' + result.device.model)
})

// 2. error log
test('e() produces ERROR log', () => {
  const log = BR.e('test:api', 'something went wrong')
  if (!log || log.level !== 4) throw new Error('expected level=4, got ' + log.level)
  if (log.cat !== 'APP') throw new Error('expected cat=APP, got ' + log.cat)
})

// 3. warn log
test('w() produces WARN log', () => {
  const log = BR.w('test:memory', 'high usage')
  if (!log || log.level !== 3) throw new Error('expected level=3, got ' + log.level)
})

// 4. info log
test('info() produces INFO log', () => {
  const log = BR.info('test:page', 'home loaded')
  if (!log || log.level !== 2) throw new Error('expected level=2, got ' + log.level)
})

// 5. query filter
test('query() filters by level', () => {
  const errors = BR.query({ level: 4 })
  if (!Array.isArray(errors)) throw new Error('query() did not return array')
  if (errors.length === 0) throw new Error('expected at least 1 error log')
  const nonErrors = errors.filter(l => l.level < 4)
  if (nonErrors.length > 0) throw new Error('query(minLevel=4) returned non-error logs')
})

// 6. query by category
test('query() filters by category', () => {
  BR.net.req('POST', '/api/test', 500, 150, 0)
  const netLogs = BR.query({ cat: 'NETWORK' })
  if (netLogs.length === 0) throw new Error('expected NETWORK logs, got 0')
  if (netLogs[0].cat !== 'NETWORK') throw new Error('expected cat=NETWORK')
})

// 7. export text
test('exportLogs(text) produces formatted output', () => {
  const text = BR.exportLogs('text')
  if (typeof text !== 'string') throw new Error('export did not return string')
  if (!text.includes('BugReport Log Export')) throw new Error('missing header in text export')
  if (!text.includes('Device:')) throw new Error('missing device info in text export')
})

// 8. stats
test('stats() returns correct counts', () => {
  const s = BR.stats()
  if (typeof s.total !== 'number') throw new Error('stats.total missing')
  if (typeof s.errors !== 'number') throw new Error('stats.errors missing')
  if (typeof s.sessionMs !== 'number') throw new Error('stats.sessionMs missing')
  if (s.errors === 0) throw new Error('expected errors > 0')
})

// Summary
console.log('')
if (failed === 0) {
  console.log('All ' + passed + ' tests passed. ✅')
  process.exit(0)
} else {
  console.error(passed + ' passed, ' + failed + ' FAILED ❌')
  process.exit(1)
}
