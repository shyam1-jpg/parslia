const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const publishedDir = path.join(root, 'data', 'published');
const port = Number(process.env.PORT) || 8787;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json'
};

function send(res, status, body, type) {
  res.writeHead(status, { 'Content-Type': type || 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

function readBody(req) {
  return new Promise(function (resolve, reject) {
    var body = '';
    req.on('data', function (chunk) {
      body += chunk;
      if (body.length > 1500000) {
        reject(new Error('too big'));
        req.destroy();
      }
    });
    req.on('end', function () { resolve(body); });
    req.on('error', reject);
  });
}

function publicFile(urlPath) {
  var decoded = decodeURIComponent(urlPath.split('?')[0]);
  if (decoded === '/') decoded = '/index.html';
  var file = path.resolve(root, '.' + decoded);
  if (!file.startsWith(root + path.sep)) return '';
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return '';
  return file;
}

const server = http.createServer(function (req, res) {
  var url = new URL(req.url, 'http://127.0.0.1');
  var published = url.pathname.match(/^\/p\/([a-z0-9]{8,16})$/);
  if (published && req.method === 'GET') {
    var appFile = path.join(publishedDir, published[1] + '.html');
    if (!fs.existsSync(appFile)) return send(res, 404, 'That published app is not on this server.');
    return send(res, 200, fs.readFileSync(appFile), 'text/html; charset=utf-8');
  }

  if (url.pathname === '/api/publish' && req.method === 'POST') {
    readBody(req).then(function (raw) {
      var payload = JSON.parse(raw || '{}');
      var html = String(payload.html || '');
      if (!html || html.length > 1400000) return send(res, 400, JSON.stringify({ error: 'missing' }), 'application/json; charset=utf-8');
      fs.mkdirSync(publishedDir, { recursive: true });
      var id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
      fs.writeFileSync(path.join(publishedDir, id + '.html'), html);
      send(res, 200, JSON.stringify({ id: id, url: '/p/' + id }), 'application/json; charset=utf-8');
    }).catch(function () {
      send(res, 400, JSON.stringify({ error: 'bad' }), 'application/json; charset=utf-8');
    });
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
  var file = publicFile(url.pathname);
  if (!file) return send(res, 404, 'Not found');
  var body = fs.readFileSync(file);
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  res.end(req.method === 'HEAD' ? undefined : body);
});

if (require.main === module) {
  server.listen(port, '127.0.0.1', function () {
    console.log('Kiln: http://127.0.0.1:' + port);
  });
}

module.exports = { server: server, port: port };
