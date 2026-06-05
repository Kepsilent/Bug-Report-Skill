// BugReport v2.1 — globalThis White Screen Fix Test
// Run: node test/globalThis-test.js
// Verifies the UMD root fix that prevented white screen on uni-app app-service.

'use strict'

let passed = 0
let failed = 0

function test(name, fn) { try { fn(); passed++; console.log('PASS  ' + name) } catch(e) { failed++; console.error('FAIL  ' + name + '\n      ' + e.message) } }

// Clear module cache to get fresh instances
delete require.cache[require.resolve('../index.js')]

// Test 1: BugReport accessible on globalThis
test('BugReport is defined on globalThis after require()', () => {
  const BR = require('../index.js')
  const g = typeof globalThis !== 'undefined' ? globalThis : global
  if (!g.BugReport) throw new Error('globalThis.BugReport not set after CJS require. UMD root fix may be broken.')
  if (typeof g.BugReport.init !== 'function') throw new Error('globalThis.BugReport.init is not a function')
})

// Test 2: init does not throw
test('BugReport.init() does not throw', () => {
  const g = typeof globalThis !== 'undefined' ? globalThis : global
  const BR = g.BugReport
  // Reset if already inited
  try { BR.destroy() } catch(e) {}
  try {
    BR.init({ appName: 'GlobalThisTest', persist: false, captureGlobal: false, capturePromise: false, captureNetwork: false })
  } catch (e) {
    throw new Error('init() threw: ' + e.message)
  }
})

// Test 3: CJS module.exports path
test('CJS module.exports path sets globalThis.BugReport', () => {
  delete require.cache[require.resolve('../index.js')]
  // Simulate strict mode where `this` is undefined
  // The UMD should fallback to globalThis
  const BR = require('../index.js')
  const g = typeof globalThis !== 'undefined' ? globalThis : global
  if (!g.BugReport) throw new Error('globalThis.BugReport is falsy after require(). CJS path may not set root.BugReport.')
  if (g.BugReport.LEVEL.FATAL !== 5) throw new Error('BugReport LEVEL constant mismatch')
})

console.log('')
if (failed === 0) {
  console.log('globalThis fix verified. ✅')
  process.exit(0)
} else {
  console.error(passed + ' passed, ' + failed + ' FAILED ❌')
  process.exit(1)
}
