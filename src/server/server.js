/**
 * Zero-dependency HTTP server for PackagePulse Web Studio.
 * Runs on localhost:3012 with REST API and static asset serving.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const {
  analyzeProject,
  checkOutdatedBatch,
  calculateHealthScore
} = require('../core');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function isPathSafe(baseDir, targetPath) {
  const resolved = path.resolve(baseDir, targetPath);
  return resolved === baseDir || resolved.startsWith(baseDir + path.sep);
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(data));
}

function sendError(res, statusCode, message) {
  sendJson(res, statusCode, { error: message });
}

function createServer(targetDir = process.cwd()) {
  const uiDir = path.resolve(__dirname, '../ui');

  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // --- REST API ---

    if (pathname === '/api/analysis' && method === 'GET') {
      try {
        const projectData = analyzeProject(targetDir);
        const checkedDeps = await checkOutdatedBatch(projectData.dependencies);
        const healthReport = calculateHealthScore(checkedDeps);

        return sendJson(res, 200, {
          project: projectData,
          health: healthReport,
          dependencies: checkedDeps
        });
      } catch (err) {
        return sendError(res, 500, err.message);
      }
    }

    // --- STATIC ASSET SERVING ---

    if (method === 'GET') {
      let relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
      const filePath = path.resolve(uiDir, relativePath);

      if (!isPathSafe(uiDir, filePath)) {
        return sendError(res, 403, 'Forbidden');
      }

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    sendError(res, 405, 'Method Not Allowed');
  });

  return server;
}

function startServer(port = 3012, targetDir = process.cwd()) {
  const server = createServer(targetDir);
  server.listen(port, () => {
    const ansi = require('../cli/ansi');
    console.log(`\n💓 ${ansi.chalk.bold('PackagePulse Web Studio')} is live at:`);
    console.log(`   ${ansi.chalk.cyan(`http://localhost:${port}`)}\n`);
    console.log(`   Inspecting: ${targetDir}`);
    console.log(`   Press Ctrl+C to stop the server.\n`);
  });
  return server;
}

module.exports = {
  createServer,
  startServer
};
