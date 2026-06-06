// BRS v3.0 — Breadcrumbs Test
var BR = require('../index.js');

var fail = 0; var pass = 0;
function t(name, test) {
  try { test(); pass++; console.log('PASS  ' + name); }
  catch(e) { fail++; console.log('FAIL  ' + name + '\n      ' + e.message); }
}

BR.destroy(); BR.init({ appName: 'crumbTest', appVersion: '1.0.0', persist: false });

// --- Breadcrumbs ---
t('crumb() adds a breadcrumb', function() {
  BR.crumb('test', 'hello');
  if (BR.crumbs().length !== 1) throw new Error('expected 1 crumb');
});

t('crumbs() returns array copy', function() {
  var c = BR.crumbs();
  c.push({}); // should not affect internal
  if (BR.crumbs().length !== 1) throw new Error('crumbs() should return copy');
});

t('FIFO: max 50 enforced', function() {
  BR.clearCrumbs();
  for (var i = 0; i < 60; i++) BR.crumb('step', '' + i);
  var c = BR.crumbs();
  if (c.length !== 50) throw new Error('expected 50, got ' + c.length);
  if (c[0].msg !== '10') throw new Error('first should be step 10, got ' + c[0].msg);
  if (c[49].msg !== '59') throw new Error('last should be step 59, got ' + c[49].msg);
});

t('clearCrumbs() empties queue', function() {
  BR.clearCrumbs();
  if (BR.crumbs().length !== 0) throw new Error('crumbs should be empty');
});

t('life.fg() auto-crumbs', function() {
  BR.clearCrumbs();
  BR.life.fg();
  var c = BR.crumbs();
  if (c.length !== 1) throw new Error('fg should auto-crumb, got ' + c.length);
  if (c[0].tag !== 'life:foreground') throw new Error('wrong tag: ' + c[0].tag);
});

t('life.bg() auto-crumbs', function() {
  BR.clearCrumbs();
  BR.life.bg();
  var c = BR.crumbs();
  if (c[0].tag !== 'life:background') throw new Error('wrong tag: ' + c[0].tag);
});

t('life.in_() auto-crumbs', function() {
  BR.clearCrumbs();
  BR.life.in_('pages/home');
  var c = BR.crumbs();
  if (c[0].tag !== 'life:page-in') throw new Error('wrong tag: ' + c[0].tag);
  if (c[0].msg !== 'pages/home') throw new Error('wrong msg: ' + c[0].msg);
});

t('life.out() auto-crumbs', function() {
  BR.clearCrumbs();
  BR.life.out('pages/home');
  var c = BR.crumbs();
  if (c[0].tag !== 'life:page-out') throw new Error('wrong tag: ' + c[0].tag);
});

t('FATAL crash injects breadcrumbs', function() {
  BR.clearCrumbs();
  BR.crumb('before-crash', 'did something');
  BR.crumb('before-crash2', 'did more');
  BR.clear(); // Clear logs but keep crumbs
  BR.crumb('final', 'last action');
  BR.f('crash', 'test crash');
  var logs = BR.query({ cat: 'CRASH' });
  if (logs.length === 0) throw new Error('no crash log');
  var extra = logs[0].extra;
  if (!extra) throw new Error('extra missing');
  if (!extra.breadcrumbs) throw new Error('breadcrumbs missing from crash log');
  if (extra.breadcrumbs.length !== 3) throw new Error('expected 3 crumbs in crash, got ' + extra.breadcrumbs.length);
});

console.log('\n' + pass + ' passed, ' + fail + ' failed. ' + (fail ? '❌' : '✅'));
process.exit(fail ? 1 : 0);
