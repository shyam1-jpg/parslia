const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('pro-dashboard.html');
const { normalise, search } = require('../js/dashboard-search.js');
const items = [
  {title:'KP-04 · Deep clean behind movable tables',group:'Forms & templates',keywords:'KP-04'},
  {title:'Lincat fryer',group:'Equipment guidance',keywords:'SOP'},
  {title:'The Vedānta Way',group:'Kitchen workspace',keywords:'retreat'}
];
test('search matches words, codes, case and accents', () => {
  assert.equal(search(items, 'kp-04')[0], items[0]);
  assert.equal(search(items, 'TABLES clean')[0], items[0]);
  assert.equal(search(items, '  FRYER ')[0], items[1]);
  assert.equal(search(items, 'vedanta')[0], items[2]);
  assert.equal(normalise('Vedānta'), 'vedanta');
});
test('empty, unmatched and HTML-like searches return no result', () => {
  for (const q of ['', '   ', 'nonexistent-plan', '<img src=x onerror=alert(1)>']) assert.deepEqual(search(items,q), []);
});
test('dashboard states data limitations without fabricated live figures', () => {
  assert.match(html, /Preview dashboard · live records not connected/);
  assert.match(html, /Source: not connected/);
  assert.doesNotMatch(html, /Ready with actions|94%|3\.2°C|−19°C|68°C|7 of 7 complete|8 complete|Food safety good|>Approved<|>Safe<|Saturday ·/);
  assert.doesNotMatch(html, /class="person"|class="staff"/);
  assert.match(html, /Role navigation buttons do not grant permissions/);
});
test('each dashboard KP code has a readable title', () => {
  const links = [...html.matchAll(/<a href="kitchen-sop-pack.html#KP-\d+">([^<]+)<\/a>/g)];
  assert.equal(links.length,22);
  links.forEach(m => assert.match(m[1], /^KP-\d+ · .{8,}/));
});
test('equipment summaries preserve draft and blocked-job warnings from source', () => {
  assert.match(html, /KP-11 emptying and cleaning remain blocked/);
  assert.match(html, /KP-08 live cleaning remains blocked/);
  assert.match(html, /Automatic chemical cleaning remains blocked/);
  assert.match(html, /portable single-zone hobs/);
  assert.doesNotMatch(html, /four-zone induction/);
  assert.match(html, />Open competency form →/);
});
const pages = ['pro-dashboard.html','auth.html','privacy.html','terms.html','support.html'];
test('local links and fragments resolve on every changed page', () => {
  for (const page of pages) {
    const text = read(page);
    for (const match of text.matchAll(/(?:href|src)="([^"<>]+)"/g)) {
      const href = match[1];
      if (/^(?:[a-z]+:|\/\/)/i.test(href) || href === '#') continue;
      const target = new URL(href.replaceAll('&amp;','&'), 'https://parslia.net/'+page);
      const file = target.pathname.slice(1) || 'index.html';
      assert.ok(fs.existsSync(path.join(root,file)), page+': '+href);
      if (target.hash) {
        const id = decodeURIComponent(target.hash.slice(1));
        assert.ok(read(file).includes('id="'+id+'"') || read(file).includes("id='"+id+"'"), page+': missing '+href);
      }
    }
  }
});
test('privacy, terms and help are real links and independent public documents', () => {
  const auth = read('auth.html');
  assert.doesNotMatch(auth, /linkPrivacy|linkTerms|Chef role unlocks/);
  for (const file of ['privacy.html','terms.html','support.html']) {
    assert.match(auth,new RegExp('href="'+file+'"'));
    assert.doesNotMatch(read(file), /<script/);
  }
  assert.match(read('privacy.html'), /retention periods.*need confirmation/);
});
test('new rota defaults contain role placeholders, blank shifts and retain restore logic', () => {
  const rota = read('digital-rota-compliance.html');
  const seed = JSON.parse(rota.match(/const staff=(\[.*\]);/)[1]);
  assert.equal(seed[0][0], 'Head Chef');
  assert.equal(seed[4][0], 'Kitchen Assistant');
  assert.equal(seed.length, 12);
  assert.ok(seed.every(row=>row[2].length===7 && row[2].every(v=>v==='')));
  assert.match(rota, /localStorage.getItem\("parslia-digital-rota"\)/);
});
test('all changed inline scripts and search/service worker scripts parse', () => {
  for(const file of [...pages,'digital-rota-compliance.html']) {
    for(const m of read(file).matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) if(m[1].trim()) new vm.Script(m[1],{filename:file});
  }
  for(const file of ['js/dashboard-search.js','sw.js']) new vm.Script(read(file),{filename:file});
});
function worker() {
  const handlers = {};
  const deleted = [];
  vm.runInNewContext(read('sw.js'), {
    self: { location: {origin:'https://parslia.net'}, addEventListener:(name,fn)=>handlers[name]=fn, clients:{claim:async()=>{}}, skipWaiting:async()=>{} },
    URL, caches: {keys:async()=>['parslia-core-v1','parslia-core-v2-clarity','unrelated-cache'],delete:async key=>deleted.push(key)}
  });
  return {handlers,deleted};
}
test('cache upgrade clears only old Parslia cache, not unrelated data', async()=> {
  const w=worker();let work;
  w.handlers.activate({waitUntil:p=>work=p});await work;
  assert.deepEqual(w.deleted,['parslia-core-v1']);
});
test('service worker ignores external services, private APIs and authenticated requests',()=> {
  const w=worker();
  for(const [url,method,hasAuth] of [['https://firestore.googleapis.com/test','GET',false],['https://parslia.net/api/profile','GET',false],['https://parslia.net/test','POST',false],['https://parslia.net/test','GET',true]]) {
    w.handlers.fetch({request:{url,method,headers:{has:()=>hasAuth}},respondWith:()=>assert.fail('Must not cache '+url)});
  }
});
