const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { createServer } = require('../src/server/server');

function makeRequest(server, method, reqPath) {
  const addr = server.address();
  const port = addr.port;

  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port,
      path: reqPath,
      method
    };

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch {}
        resolve({ statusCode: res.statusCode, raw: data, json });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

test('Server - API endpoints and static file serving', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-server-test-'));
  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
    name: 'test-server-pkg',
    version: '1.0.0',
    dependencies: { 'express': '4.18.2' }
  }), 'utf8');

  const server = createServer(tmpDir);
  await new Promise(resolve => server.listen(0, resolve));

  try {
    // 1. GET /api/analysis
    const analysisRes = await makeRequest(server, 'GET', '/api/analysis');
    assert.strictEqual(analysisRes.statusCode, 200);
    assert.strictEqual(analysisRes.json.project.projectName, 'test-server-pkg');
    assert.ok(typeof analysisRes.json.health.healthScore === 'number');

    // 2. Static HTML serving
    const htmlRes = await makeRequest(server, 'GET', '/');
    assert.strictEqual(htmlRes.statusCode, 200);
    assert.ok(htmlRes.raw.includes('PackagePulse Studio'));

    // 3. Static CSS serving
    const cssRes = await makeRequest(server, 'GET', '/style.css');
    assert.strictEqual(cssRes.statusCode, 200);

    // 4. Path traversal protection
    const traversalRes = await makeRequest(server, 'GET', '/../../etc/passwd');
    assert.ok(traversalRes.statusCode === 404 || traversalRes.statusCode === 403);

  } finally {
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
