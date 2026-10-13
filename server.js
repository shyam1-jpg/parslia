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

var reservedSlugs = { api: 1, js: 1, css: 1, data: 1, index: 1, pricing: 1, studio: 1, paid: 1, account: 1 };

function cleanSlug(value) {
  var slug = String(value || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (!/^[a-z0-9][a-z0-9-]{2,30}$/.test(slug)) return '';
  if (reservedSlugs[slug]) return '';
  return slug;
}

function publishedFile(slug) {
  var file = path.resolve(publishedDir, slug + '.html');
  if (path.dirname(file) !== path.resolve(publishedDir)) return '';
  return file;
}

function metaFile(slug) {
  return path.resolve(publishedDir, slug + '.json');
}

function readMeta(slug) {
  try {
    var parsed = JSON.parse(fs.readFileSync(metaFile(slug), 'utf8'));
    return { views: Number(parsed.views) || 0, name: parsed.name || '', slug: slug };
  } catch (err) {
    return { views: 0, name: '', slug: slug };
  }
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
  var published = url.pathname.match(/^\/p\/([a-z0-9][a-z0-9-]{2,30})$/);
  if (published && (req.method === 'GET' || req.method === 'HEAD')) {
    var slug = cleanSlug(published[1]);
    var appFile = slug && publishedFile(slug);
    if (!appFile || !fs.existsSync(appFile)) return send(res, 404, 'That published app is not on this server.');
    if (req.method === 'GET') {
      var seen = readMeta(slug);
      seen.views += 1;
      fs.mkdirSync(publishedDir, { recursive: true });
      fs.writeFileSync(metaFile(slug), JSON.stringify(seen));
    }
    return send(res, 200, fs.readFileSync(appFile), 'text/html; charset=utf-8');
  }

  if (url.pathname === '/api/stats' && req.method === 'GET') {
    var statsSlug = cleanSlug(url.searchParams.get('slug'));
    if (!statsSlug || !fs.existsSync(publishedFile(statsSlug))) {
      return send(res, 404, JSON.stringify({ error: 'missing' }), 'application/json; charset=utf-8');
    }
    return send(res, 200, JSON.stringify(readMeta(statsSlug)), 'application/json; charset=utf-8');
  }

  if (url.pathname === '/api/publish' && req.method === 'DELETE') {
    var drop = cleanSlug(url.searchParams.get('slug'));
    var dropFile = drop && publishedFile(drop);
    if (!dropFile || !fs.existsSync(dropFile)) {
      return send(res, 404, JSON.stringify({ error: 'missing' }), 'application/json; charset=utf-8');
    }
    fs.unlinkSync(dropFile);
    if (fs.existsSync(metaFile(drop))) fs.unlinkSync(metaFile(drop));
    return send(res, 200, JSON.stringify({ ok: true, slug: drop }), 'application/json; charset=utf-8');
  }

  if (url.pathname === '/api/publish' && req.method === 'POST') {
    readBody(req).then(function (raw) {
      var payload = JSON.parse(raw || '{}');
      var html = String(payload.html || '');
      if (!html || html.length > 1400000) return send(res, 400, JSON.stringify({ error: 'missing' }), 'application/json; charset=utf-8');
      var id = cleanSlug(payload.slug) || cleanSlug(Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4));
      if (!id) return send(res, 400, JSON.stringify({ error: 'slug' }), 'application/json; charset=utf-8');
      fs.mkdirSync(publishedDir, { recursive: true });
      var file = publishedFile(id);
      var replaced = fs.existsSync(file);
      var meta = readMeta(id);
      meta.name = String(payload.name || meta.name || '').slice(0, 80);
      fs.writeFileSync(file, html);
      fs.writeFileSync(metaFile(id), JSON.stringify(meta));
      send(res, 200, JSON.stringify({ id: id, url: '/p/' + id, views: meta.views, replaced: replaced }), 'application/json; charset=utf-8');
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
