// BRS v3.0 — ESM Import Test
// Run: node test/esm-test.mjs
// Verifies that index.mjs works with ESM import syntax (Vite, Webpack, etc.)

import { createRequire } from 'module'

// The .mjs file uses export default, so we import from it
// Node.js requires .mjs extension or type:module for ESM
import BR from '../index.mjs'

let passed = 0
let failed = 0

function test(name, fn) { try { fn(); passed++; console.log('PASS  ' + name) } catch(e) { failed++; console.error('FAIL  ' + name + '\n      ' + e.message) } }

test('ESM import returns BugReport object', () => {
  if (!BR || typeof BR !== 'object') throw new Error('import did not return object, got: ' + typeof BR)
})

test('BR.init() works after ESM import', () => {
  try {
    const result = BR.init({ appName: 'ESMTest', persist: false, captureGlobal: false, capturePromise: false, captureNetwork: false })
    if (!result || !result.device) throw new Error('init() returned invalid result: ' + JSON.stringify(result))
  } catch (e) {
    throw new Error('init() threw: ' + e.message)
  }
})

test('BR.e() works after ESM import', () => {
  const log = BR.e('esm:test', 'ESM import verification')
  if (!log || log.level !== 4) throw new Error('e() did not produce ERROR log')
})

test('BR.exportLogs() works after ESM import', () => {
  const text = BR.exportLogs('text')
  if (!text || !text.includes('BugReport')) throw new Error('exportLogs() returned bad output')
})

test('Log entry uses correct level labels', () => {
  const log = BR.e('esm:labels', 'check labels')
  if (log.levelName !== 'ERROR') throw new Error('expected levelName=ERROR, got ' + log.levelName)
  if (log.levelLabel !== 'E') throw new Error('expected levelLabel=E, got ' + log.levelLabel)
  if (!log.time || !log.time.includes('T')) throw new Error('expected ISO time format, got: ' + log.time)
})

console.log('')
if (failed === 0) {
  console.log('ESM import verified. ✅')
  process.exit(0)
} else {
  console.error(passed + ' passed, ' + failed + ' FAILED ❌')
  process.exit(1)
}
