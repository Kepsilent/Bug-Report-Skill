// BRS v3.0 — WeChat Mini Program Adapter Test
// Run: node test/wx-adapter-test.js
// Simulates WeChat Mini Program environment to verify BR.wx wrapper.

'use strict'

// Mock wx global object
const mockStorage = {}
globalThis.wx = {
  _requestCalls: [],
  _storageData: mockStorage,

  getSystemInfoSync() {
    return { model: 'iPhone 15', brand: 'Apple', system: 'iOS 18.0', version: '8.0.5', windowWidth: 390, windowHeight: 844, pixelRatio: 3, language: 'zh_CN' }
  },
  getStorageSync(k) { return mockStorage[k] || null },
  setStorageSync(k, v) { mockStorage[k] = v },
  removeStorageSync(k) { delete mockStorage[k] },

  request(opts) {
    this._requestCalls.push(opts)
    // Simulate async request
    setTimeout(() => {
      const res = { statusCode: 200, data: JSON.stringify({ ok: true }) }
      if (opts.success) opts.success(res)
      if (opts.complete) opts.complete(res)
    }, 1)
  },

  getNetworkType(opts) { if (opts && opts.success) opts.success({ networkType: 'wifi' }) },
  onNetworkStatusChange() {},
  setClipboardData(opts) { if (opts && opts.success) opts.success() },
  showToast() {}
}

// Mock getCurrentPages
globalThis.getCurrentPages = () => [{ route: 'pages/home/index' }]

let passed = 0
let failed = 0

function test(name, fn) { try { fn(); passed++; console.log('PASS  ' + name) } catch(e) { failed++; console.error('FAIL  ' + name + '\n      ' + e.message) } }

// Load BR — note: wx detection requires uni to NOT be defined
const BR = require('../index.js')

// Reset state
try { BR.destroy() } catch(e) {}

test('WeChat adapter: init() detects wx and returns device', () => {
  const result = BR.init({ appName: 'WxApp', persist: false, captureGlobal: false, capturePromise: false, captureNetwork: false })
  // Note: if uni IS defined in the environment, the uni-app adapter takes priority.
  // This test simulates pure WeChat environment.
  // The device model should come from wx.getSystemInfoSync
  if (!result || !result.device) throw new Error('init() did not return device')
})

test('WeChat adapter: BR.wx.req() wraps wx.request', () => {
  wx._requestCalls = []
  BR.wx.req({ url: 'https://api.test.com/data', method: 'GET', data: { id: 1 } })
  if (wx._requestCalls.length === 0) throw new Error('wx.request was not called')
  const call = wx._requestCalls[0]
  if (call.url !== 'https://api.test.com/data') throw new Error('url mismatch: ' + call.url)
  if (call.method !== 'GET') throw new Error('method mismatch: ' + call.method)
})

test('WeChat adapter: BR.wx.get() shorthand works', () => {
  wx._requestCalls = []
  BR.wx.get('https://api.test.com/items')
  if (wx._requestCalls.length === 0) throw new Error('wx.request was not called via wx.get()')
  const call = wx._requestCalls[0]
  if (call.method !== 'GET') throw new Error('expected GET, got ' + call.method)
})

test('WeChat adapter: BR.wx.post() shorthand works', () => {
  wx._requestCalls = []
  BR.wx.post('https://api.test.com/items', { name: 'test' })
  if (wx._requestCalls.length === 0) throw new Error('wx.request was not called via wx.post()')
  const call = wx._requestCalls[0]
  if (call.method !== 'POST') throw new Error('expected POST, got ' + call.method)
})

test('WeChat adapter: BR.wx.req() logs network on success', (done) => {
  BR.wx.req({
    url: 'https://api.test.com/verify',
    method: 'GET',
    success() {
      const netLogs = BR.query({ cat: 'NETWORK' })
      const found = netLogs.find(l => l.extra && l.extra.url === 'https://api.test.com/verify')
      if (!found) throw new Error('expected NETWORK log for wx.req()')
      if (found.level > 2) throw new Error('expected INFO level for 200 response, got ' + found.levelLabel)
    }
  })
  // Allow async to complete
  setTimeout(() => {
    try {
      const netLogs = BR.query({ cat: 'NETWORK' })
      if (netLogs.length > 0) {
        passed++; console.log('PASS  WeChat adapter: BR.wx.req() logs network on success')
      } else {
        failed++; console.error('FAIL  WeChat adapter: BR.wx.req() logs network on success\n      no NETWORK logs found')
      }
      finale()
    } catch(e) {
      failed++; console.error('FAIL  WeChat adapter: BR.wx.req() logs network on success\n      ' + e.message)
      finale()
    }
  }, 100)
})

function finale() {
  // Clean up
  delete globalThis.wx
  delete globalThis.getCurrentPages
  console.log('')
  if (failed === 0) {
    console.log('WeChat adapter verified. ✅')
    process.exit(0)
  } else {
    console.error(passed + ' passed, ' + failed + ' FAILED ❌')
    process.exit(1)
  }
}

// Set timeout for async tests
setTimeout(() => { console.error('Timeout!'); process.exit(1) }, 5000)
