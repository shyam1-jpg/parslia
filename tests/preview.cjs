// Local UI fixture only. Never deployed as an authentication bypass in site HTML.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.svg':'image/svg+xml','.jpg':'image/jpeg','.webmanifest':'application/manifest+json'};
http.createServer((req,res)=> {
  let pathname = decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const fixture = pathname === '/__preview__/dashboard';
  if (fixture) pathname='/pro-dashboard.html';
  const file = path.resolve(root, '.'+pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()) {res.writeHead(404);res.end('Not found');return;}
  let content=fs.readFileSync(file);
  if(fixture) {
    content=content.toString().replace('<head>','<head><base href="/">')
      .replace(/<script src="(?:https:\/\/www.gstatic.com\/firebasejs\/[^"<>]+|js\/(?:firebase-config|auth|activity)\.js)"><\/script>/g,'')
      .replace("navigator.serviceWorker.register('./sw.js')",'Promise.resolve()')
      .replace('Preview dashboard · live records not connected','Local UI preview · live records not connected');
  }
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(content);
}).listen(8766,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:8766/__preview__/dashboard'));
