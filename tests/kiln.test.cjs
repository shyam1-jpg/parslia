const assert = require('assert');
const fs = require('fs');
const path = require('path');
const gen = require('../js/generator.js');
const wallet = require('../js/wallet.js');

function specFrom(html) {
  const match = html.match(/<script type="application\/json" id="kiln-spec">([\s\S]*?)<\/script>/);
  assert.ok(match, 'built html should carry its spec');
  return JSON.parse(match[1]);
}

function names(spec) {
  return spec.collections.map((collection) => collection.name);
}

const lighthouse = gen.parsePrompt('A lighthouse keeper app to log lamp oil, foghorn tests, weather, and supply boats');
assert.strictEqual(lighthouse.name, 'Lighthouse Keeper');
assert.deepStrictEqual(names(lighthouse), ['Lamp Oil', 'Foghorn Tests', 'Weather', 'Supply Boats']);
assert.strictEqual(gen.quote(lighthouse), 44);

const shop = gen.parsePrompt('A shop for Harbour Candle Co selling cedar candle, linen spray, and match tin');
assert.strictEqual(shop.name, 'Harbour Candle Co');
assert.strictEqual(shop.shop, true);
assert.deepStrictEqual(shop.products.map((product) => product.name), ['Cedar Candle', 'Linen Spray', 'Match Tin']);
assert.ok(names(shop).includes('Orders'));

const quiz = gen.parsePrompt('Quiz app for year 5 science about planets');
assert.strictEqual(quiz.name, 'Year 5 Science');
assert.strictEqual(quiz.quiz.topic, 'Planets');
assert.strictEqual(quiz.collections.length, 0);

const tram = gen.parsePrompt('An app for cataloguing vintage tram tickets in Lisbon');
assert.ok(/tram tickets/i.test(tram.name));
assert.ok(tram.collections.some((collection) => /tram tickets/i.test(collection.name)));

const plumbing = gen.parsePrompt('A client tracker for a plumbing company with jobs, quotes, and a contact form');
assert.strictEqual(plumbing.name, 'Plumbing Company');
assert.ok(names(plumbing).includes('Jobs'));
assert.ok(names(plumbing).includes('Quotes'));
assert.ok(names(plumbing).includes('Enquiries'));

const timer = gen.parsePrompt('A countdown timer for bread baking');
assert.ok(timer.tools.includes('timer'));
assert.strictEqual(timer.name, 'Bread Baking');

const todo = gen.parsePrompt('A todo app');
assert.ok(names(todo).includes('Tasks'));

const vague = gen.parsePrompt('build me something amazing');
assert.strictEqual(vague.vague, true);
assert.strictEqual(vague.name, 'New app');
assert.strictEqual(gen.quote(vague), 15);

const many = gen.parsePrompt('Log alpha, beta, gamma, delta, epsilon, zeta, eta, and theta');
assert.strictEqual(gen.quote(many), 60);
assert.strictEqual(gen.quote(many, { revision: true }), 12);

const hostile = gen.build('A shop for "<script>alert(1)</script>" selling pies');
assert.strictEqual(typeof hostile.html, 'string');
assert.ok(!hostile.html.includes('<script>alert(1)</script>'));
assert.ok(hostile.html.includes('\\u003cscript') || hostile.html.includes('&lt;script&gt;'));
const hostileSpec = specFrom(hostile.html);
assert.ok(hostileSpec.products.some((product) => product.name === 'Pies'));

const built = gen.build(lighthouse.source);
assert.ok(built.html.startsWith('<!DOCTYPE html>'));
assert.deepStrictEqual(specFrom(built.html).collections.map((collection) => collection.name), names(lighthouse));
assert.ok(built.screens.includes('Lamp Oil'));
assert.ok(built.screens.includes('Home'));

new Function(fs.readFileSync(path.join(__dirname, '../js/app-runtime.js'), 'utf8'));

const now = Date.UTC(2026, 0, 1);
let state = wallet.freshState();
assert.strictEqual(wallet.canBuild(state, 20, now).reason, 'subscribe');
assert.strictEqual(wallet.spend(state, 20, { name: 'X', html: '', prompt: 'x' }, now).error, 'subscribe');
assert.strictEqual(wallet.balance(state), 0);

state = wallet.subscribe(state, 'starter', now).state;
assert.strictEqual(wallet.balance(state), 80);
assert.strictEqual(wallet.canBuild(state, 44, now).ok, true);
assert.strictEqual(wallet.daysLeft(state, now), 30);

const spent = wallet.spend(state, 44, { name: 'Lighthouse Keeper', html: '<html></html>', prompt: 'lamp' }, now);
assert.strictEqual(spent.error, '');
assert.strictEqual(wallet.balance(spent.state), 36);
assert.strictEqual(spent.state.apps.length, 1);

assert.strictEqual(wallet.canBuild(spent.state, 20, now + 31 * wallet.DAY_MS).reason, 'subscribe');
assert.strictEqual(wallet.topUp(wallet.freshState(), 'top-100', now).error, 'subscribe');
const topped = wallet.topUp(state, 'top-100', now);
assert.strictEqual(wallet.balance(topped.state), 180);

const renewed = wallet.subscribe(state, 'studio', now + wallet.DAY_MS);
assert.strictEqual(renewed.state.subscription.until, now + 60 * wallet.DAY_MS);
assert.strictEqual(wallet.balance(renewed.state), 330);

const pending = { kind: 'plan', id: 'works' };
assert.strictEqual(wallet.completePending(wallet.freshState(), pending, { kind: 'plan', id: 'starter' }, now).error, 'missing');
assert.strictEqual(wallet.balance(wallet.completePending(wallet.freshState(), pending, { kind: 'plan', id: 'works' }, now).state), 700);

assert.strictEqual(gen.build('').spec.name, 'New app');

console.log('kiln tests passed');
