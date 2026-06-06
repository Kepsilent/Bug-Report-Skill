// BRS v3.0 — MCP Server basic integration test
// Spawns mcp-server.js and sends initialize + tools/list JSON-RPC messages
var spawn = require('child_process').spawn;
var path = require('path');

var fail = 0; var pass = 0;
function t(name, test) {
  try { test(); pass++; console.log('PASS  ' + name); }
  catch(e) { fail++; console.log('FAIL  ' + name + '\n      ' + e.message); }
}

var serverPath = path.join(__dirname, '..', 'mcp-server.js');
var tmpDir = path.join(__dirname, '..', 'bugs');

// Create test crash log
var fs = require('fs');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
fs.writeFileSync(path.join(tmpDir, 'test-crash.json'), JSON.stringify({
  exportedAt: new Date().toISOString(),
  device: { model: 'test', brand: 'brs', system: 'node' },
  logs: [
    { id: 1, ts: Date.now() - 60000, time: new Date().toISOString(), level: 2, levelLabel: 'I', levelName: 'INFO', cat: 'APP', tag: 'app:launch', msg: 'BRS v3.0 initialized', stack: '', page: '', extra: null },
    { id: 2, ts: Date.now() - 1000, time: new Date().toISOString(), level: 5, levelLabel: 'F', levelName: 'FATAL', cat: 'CRASH', tag: 'crash', msg: 'NullPointerException', stack: 'at func (test.js:10)', page: 'pages/home', extra: { breadcrumbs: [{ t: Date.now()-2000, time: new Date().toISOString(), tag: 'nav', msg: 'clicked button' }], snapshot: { orderId: 'ORD-123' } } }
  ]
}, null, 2));

var child = spawn('node', [serverPath, '--dir', tmpDir], { stdio: ['pipe', 'pipe', 'pipe'] });

var responses = [];
var out = '';
child.stdout.on('data', function(d) { out += d.toString(); parseMessages(); });

function parseMessages() {
  var lines = out.split('\n');
  out = lines.pop();
  lines.forEach(function(line) {
    if (!line.trim()) return;
    try { var msg = JSON.parse(line); responses.push(msg); } catch(e) {}
  });
}

function send(msg, cb) {
  child.stdin.write(JSON.stringify(msg) + '\n');
  // Wait for response
  var check = setInterval(function() {
    var r = responses.find(function(r) { return r.id === msg.id; });
    if (r) { clearInterval(check); cb(r); }
  }, 50);
  setTimeout(function() { clearInterval(check); if (!responses.find(function(r) { return r.id === msg.id; })) cb(null); }, 3000);
}

var testId = 0;

send({ jsonrpc: '2.0', id: ++testId, method: 'initialize', params: {} }, function(r) {
  t('MCP initialize responds with serverInfo', function() {
    if (!r) throw new Error('no response');
    if (!r.result) throw new Error('no result');
    if (!r.result.serverInfo) throw new Error('no serverInfo');
    if (r.result.serverInfo.name !== 'brs-mcp-server') throw new Error('wrong name');
  });

  send({ jsonrpc: '2.0', id: ++testId, method: 'notifications/initialized', params: {} }, function() {});

  send({ jsonrpc: '2.0', id: ++testId, method: 'tools/list', params: {} }, function(r) {
    t('MCP tools/list returns 2 tools', function() {
      if (!r || !r.result) throw new Error('no result');
      if (!Array.isArray(r.result.tools)) throw new Error('no tools array');
      if (r.result.tools.length !== 2) throw new Error('expected 2 tools, got ' + r.result.tools.length);
    });

    send({ jsonrpc: '2.0', id: ++testId, method: 'tools/call', params: { name: 'get_latest_crash', arguments: {} } }, function(r) {
      t('MCP get_latest_crash finds test crash', function() {
        if (!r || !r.result) throw new Error('no result');
        var text = r.result.content[0].text;
        var data = JSON.parse(text);
        if (!data.found) throw new Error('crash not found');
        if (!data.crash) throw new Error('no crash data');
        if (!data.breadcrumbs || data.breadcrumbs.length === 0) throw new Error('no breadcrumbs');
        if (!data.snapshot) throw new Error('no snapshot');
      });

      send({ jsonrpc: '2.0', id: ++testId, method: 'tools/call', params: { name: 'search_logs', arguments: { minLevel: 4, limit: 5 } } }, function(r) {
        t('MCP search_logs filters by minLevel', function() {
          if (!r || !r.result) throw new Error('no result');
          var text = r.result.content[0].text;
          var data = JSON.parse(text);
          if (data.count < 1) throw new Error('expected at least 1 error log');
          if (data.logs[0].level < 4) throw new Error('filtered log should be ERROR+');
        });

        // Cleanup
        setTimeout(function() {
          child.kill();
          try { fs.unlinkSync(path.join(tmpDir, 'test-crash.json')); } catch(e) {}
          console.log('\n' + pass + ' passed, ' + fail + ' failed. ' + (fail ? '❌' : '✅'));
          process.exit(fail ? 1 : 0);
        }, 500);
      });
    });
  });
});
