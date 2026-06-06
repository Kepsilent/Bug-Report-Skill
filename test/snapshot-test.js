// BRS v3.0 — Snapshot & Combined Crash Test
var BR = require('../index.js');

var fail = 0; var pass = 0;
function t(name, test) {
  try { test(); pass++; console.log('PASS  ' + name); }
  catch(e) { fail++; console.log('FAIL  ' + name + '\n      ' + e.message); }
}

BR.destroy(); BR.init({ appName: 'snapTest', appVersion: '1.0.0', persist: false });

// --- Snapshot ---
t('snapshot() saves data', function() {
  BR.snapshot({ userId: 'u123', cartItems: 3 });
  if (BR.getSnapshot() === null) throw new Error('snapshot should not be null');
  if (BR.getSnapshot().userId !== 'u123') throw new Error('wrong userId');
});

t('snapshot() overwrites on second call', function() {
  BR.snapshot({ userId: 'u456' });
  if (BR.getSnapshot().userId !== 'u456') throw new Error('snapshot not overwritten');
  if (BR.getSnapshot().cartItems) throw new Error('old data should be gone');
});

t('clearSnapshot() removes snapshot', function() {
  BR.clearSnapshot();
  if (BR.getSnapshot() !== null) throw new Error('snapshot should be null');
});

t('snapshot accepts null', function() {
  BR.snapshot(null);
  if (BR.getSnapshot() !== null) throw new Error('null snapshot should give null');
});

// --- Combined crash test ---
t('FATAL injects snapshot + breadcrumbs together', function() {
  BR.clearCrumbs();
  BR.clear();
  BR.crumb('nav', 'clicked checkout');
  BR.crumb('api', 'POST /order');
  BR.snapshot({ orderId: 'ORD-999', step: 'payment' });
  BR.crumb('life:foreground', '');

  BR.f('app', 'fatal crash in payment');

  var logs = BR.query({ cat: 'CRASH' });
  if (logs.length === 0) throw new Error('no crash log');
  var extra = logs[0].extra;
  if (!extra) throw new Error('extra missing');
  if (!extra.breadcrumbs) throw new Error('breadcrumbs missing');
  if (extra.breadcrumbs.length !== 3) throw new Error('expected 3 crumbs, got ' + extra.breadcrumbs.length);
  if (!extra.snapshot) throw new Error('snapshot missing');
  if (extra.snapshot.orderId !== 'ORD-999') throw new Error('wrong orderId in snapshot');
});

t('FATAL without snapshot does not inject snapshot field', function() {
  BR.clearCrumbs();
  BR.clear();
  BR.clearSnapshot();
  BR.f('app', 'crash with no snapshot');
  var logs = BR.query({ cat: 'CRASH' });
  var extra = logs[0].extra || {};
  if (extra.snapshot !== undefined) throw new Error('snapshot should not be present');
});

t('getSnapshot returns current value', function() {
  BR.snapshot({ test: 1 });
  var s = BR.getSnapshot();
  if (s.test !== 1) throw new Error('getSnapshot failed');
});

console.log('\n' + pass + ' passed, ' + fail + ' failed. ' + (fail ? '❌' : '✅'));
process.exit(fail ? 1 : 0);
