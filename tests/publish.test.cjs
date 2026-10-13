const assert = require('assert');
const http = require('http');
const { server } = require('../server.js');

function ask(port, method, path, body) {
  return new Promise(function (resolve, reject) {
    const req = http.request({
      hostname: '127.0.0.1',
      port: port,
      path: path,
      method: method,
      headers: body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {}
    }, function (res) {
      const chunks = [];
      res.on('data', function (chunk) { chunks.push(chunk); });
      res.on('end', function () {
        resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

server.listen(0, '127.0.0.1', async function () {
  const port = server.address().port;
  const html = '<!DOCTYPE html><title>Lamp</title><p>Lamp Oil</p>';
  try {
    const created = await ask(port, 'POST', '/api/publish', JSON.stringify({ name: 'Lamp', html: html, slug: 'harbour-lamp' }));
    assert.strictEqual(created.status, 200);
    const payload = JSON.parse(created.body);
    assert.strictEqual(payload.id, 'harbour-lamp');
    assert.strictEqual(payload.url, '/p/harbour-lamp');
    assert.strictEqual(payload.replaced, false);

    const reserved = await ask(port, 'POST', '/api/publish', JSON.stringify({ name: 'Nope', html: html, slug: 'studio' }));
    assert.strictEqual(reserved.status, 200);
    assert.notStrictEqual(JSON.parse(reserved.body).id, 'studio');

    const page = await ask(port, 'GET', '/p/harbour-lamp');
    assert.strictEqual(page.status, 200);
    assert.ok(page.body.includes('Lamp Oil'));

    const stats = await ask(port, 'GET', '/api/stats?slug=harbour-lamp');
    assert.strictEqual(JSON.parse(stats.body).views, 1);

    const again = await ask(port, 'POST', '/api/publish', JSON.stringify({ name: 'Lamp', html: html, slug: 'harbour-lamp' }));
    assert.strictEqual(JSON.parse(again.body).replaced, true);
    assert.strictEqual(JSON.parse(again.body).views, 1);

    const dropped = await ask(port, 'DELETE', '/api/publish?slug=harbour-lamp');
    assert.strictEqual(dropped.status, 200);
    const gone = await ask(port, 'GET', '/p/harbour-lamp');
    assert.strictEqual(gone.status, 404);
    console.log('publish tests passed');
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
