#!/usr/bin/env node
// ============================================================
// BRS MCP Server — Bug Report System Model Context Protocol
// ============================================================
// Zero dependencies · stdio JSON-RPC transport
//
// Usage:
//   node mcp-server.js --dir ./bugs/
//
// Tools:
//   - get_latest_crash   — return the most recent crash report
//   - search_logs        — search logs by level/cat/tag/time
// ============================================================

'use strict';

var fs = require('fs');
var path = require('path');

// ---- Config ----
var bugsDir = './bugs/';
var args = process.argv.slice(2);
var dirIdx = args.indexOf('--dir');
if (dirIdx >= 0 && args[dirIdx + 1]) bugsDir = args[dirIdx + 1];

// Ensure directory exists
if (!fs.existsSync(bugsDir)) fs.mkdirSync(bugsDir, { recursive: true });

// ---- Log file helpers ----
function listLogFiles() {
  try {
    return fs.readdirSync(bugsDir)
      .filter(function(f) { return f.endsWith('.json'); })
      .sort()
      .reverse();
  } catch(e) { return []; }
}

function loadAllLogs() {
  var all = [];
  listLogFiles().forEach(function(f) {
    try {
      var data = JSON.parse(fs.readFileSync(path.join(bugsDir, f), 'utf8'));
      if (Array.isArray(data.logs)) all = all.concat(data.logs);
      else if (Array.isArray(data)) all = all.concat(data);
    } catch(e) {}
  });
  return all;
}

function loadLatestCrash() {
  var all = loadAllLogs();
  var crashes = all.filter(function(l) { return l.level >= 5 || l.cat === 'CRASH'; });
  crashes.sort(function(a, b) { return b.ts - a.ts; });
  return crashes[0] || null;
}

// ---- JSON-RPC ----
var buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', function(chunk) {
  buffer += chunk;
  var lines = buffer.split('\n');
  buffer = lines.pop(); // incomplete line
  lines.forEach(function(line) {
    if (!line.trim()) return;
    try {
      var msg = JSON.parse(line);
      handleMessage(msg);
    } catch(e) {
      sendError(null, -32700, 'Parse error: ' + e.message);
    }
  });
});

process.stdin.on('end', function() {
  process.exit(0);
});

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

function sendResult(id, result) {
  send({ jsonrpc: '2.0', id: id, result: result });
}

function sendError(id, code, message) {
  send({ jsonrpc: '2.0', id: id, error: { code: code, message: message } });
}

// ---- Tool registry ----
var tools = [
  {
    name: 'get_latest_crash',
    description: 'Get the most recent crash report from the BRS logs. Returns structured crash data including stack trace, device info, breadcrumbs, and snapshot if available.',
    inputSchema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'search_logs',
    description: 'Search BRS logs by level, category, tag, keyword, or time range. Returns matching log entries.',
    inputSchema: {
      type: 'object',
      properties: {
        minLevel:    { type: 'integer', description: 'Minimum log level (0=VERBOSE, 1=DEBUG, 2=INFO, 3=WARN, 4=ERROR, 5=FATAL)' },
        cat:         { type: 'string',  description: 'Log category (CRASH, NETWORK, UI, PERF, BUSINESS, APP, SYSTEM, etc.)' },
        tag:         { type: 'string',  description: 'Partial tag match' },
        search:      { type: 'string',  description: 'Keyword search in message and tag' },
        since:       { type: 'integer', description: 'Unix timestamp (ms) filter - only logs after this time' },
        until:       { type: 'integer', description: 'Unix timestamp (ms) filter - only logs before this time' },
        limit:       { type: 'integer', description: 'Max results to return (default 100)' }
      }
    }
  }
];

// ---- Message handler ----
function handleMessage(msg) {
  var id = msg.id;

  if (msg.method === 'initialize') {
    return sendResult(id, {
      protocolVersion: '2024-11-05',
      serverInfo: { name: 'brs-mcp-server', version: '1.0.0' },
      capabilities: { tools: {} }
    });
  }

  if (msg.method === 'notifications/initialized') {
    return; // no response
  }

  if (msg.method === 'tools/list') {
    return sendResult(id, { tools: tools });
  }

  if (msg.method === 'tools/call') {
    var toolName = msg.params && msg.params.name;
    var args_ = msg.params && msg.params.arguments || {};

    if (toolName === 'get_latest_crash') {
      var crash = loadLatestCrash();
      if (!crash) {
        return sendResult(id, {
          content: [{ type: 'text', text: JSON.stringify({ found: false, message: 'No crashes found' }, null, 2) }]
        });
      }
      // Enrich with context
      var all = loadAllLogs();
      var context = all.filter(function(l) { return l.ts < crash.ts && l.ts > crash.ts - 30000; }).slice(-20);
      return sendResult(id, {
        content: [{ type: 'text', text: JSON.stringify({
          found: true,
          crash: crash,
          recentLogsBeforeCrash: context,
          breadcrumbs: (crash.extra && crash.extra.breadcrumbs) || [],
          snapshot: (crash.extra && crash.extra.snapshot) || null
        }, null, 2) }]
      });
    }

    if (toolName === 'search_logs') {
      var all = loadAllLogs();
      var filtered = all.slice();

      if (args_.minLevel !== undefined && args_.minLevel !== null) {
        filtered = filtered.filter(function(l) { return l.level >= args_.minLevel; });
      }
      if (args_.cat) {
        filtered = filtered.filter(function(l) { return l.cat === args_.cat; });
      }
      if (args_.tag) {
        filtered = filtered.filter(function(l) { return l.tag.indexOf(args_.tag) >= 0; });
      }
      if (args_.search) {
        var s = args_.search.toLowerCase();
        filtered = filtered.filter(function(l) { return (l.msg + l.tag + l.cat).toLowerCase().indexOf(s) >= 0; });
      }
      if (args_.since) {
        filtered = filtered.filter(function(l) { return l.ts >= args_.since; });
      }
      if (args_.until) {
        filtered = filtered.filter(function(l) { return l.ts <= args_.until; });
      }

      filtered.sort(function(a, b) { return b.ts - a.ts; });
      var limit = args_.limit || 100;
      if (limit > 0) filtered = filtered.slice(0, limit);

      return sendResult(id, {
        content: [{ type: 'text', text: JSON.stringify({
          count: filtered.length,
          total: all.length,
          logs: filtered
        }, null, 2) }]
      });
    }

    return sendError(id, -32601, 'Unknown tool: ' + toolName);
  }

  // Unknown method
  sendError(id, -32601, 'Unknown method: ' + msg.method);
}

// Log startup to stderr (not stdout — stdout is the protocol channel)
process.stderr.write('[BRS MCP Server] listening on stdio, bugs dir: ' + path.resolve(bugsDir) + '\n');
