'use strict';

var ops = require('../js/food-ops.js');
var failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL: ' + msg);
  }
}

function close(actual, expected, msg) {
  assert(Math.abs(actual - expected) < 0.001, msg + ' (got ' + actual + ', expected ' + expected + ')');
}

var menu = ops.defaultMenu();
var at80 = ops.plan(menu, { guests: 80, jain: 0, ekadashi: 0, served: 80, budget: 3.2 });
close(at80.totals.cost, 54.56, 'menu cost at 80 guests');
close(at80.totals.perGuest, 0.68, 'cost per guest at 80');
var rice80 = at80.ingredients.filter(function (ing) { return ing.id === 'rice'; })[0];
close(rice80.required, 4.8, 'rice required at 80');
close(rice80.shortage, 0, 'rice shortage at 80');
assert(at80.shortages.length === 0, 'no shortages at 80 guests');

var at120 = ops.plan(menu, { guests: 120, served: 120, budget: 3.2 });
close(at120.totals.cost, 81.84, 'menu cost at 120 guests');
close(at120.totals.perGuest, 0.68, 'cost per guest stays linked');
var rice = at120.ingredients.filter(function (ing) { return ing.id === 'rice'; })[0];
close(rice.required, 7.2, 'rice required at 120');
close(rice.shortage, 1.2, 'rice shortage at 120');
assert(rice.orderQty === 2, 'rice order uses 2kg pack, got ' + rice.orderQty);
var carrot = at120.ingredients.filter(function (ing) { return ing.id === 'carrot'; })[0];
close(carrot.shortage, 0.8, 'carrot shortage at 120');
assert(carrot.orderQty === 1, 'carrot order qty');
var moong = at120.ingredients.filter(function (ing) { return ing.id === 'moong-dal'; })[0];
close(moong.required, 9, 'moong consolidated from soup and khichdi');
close(moong.shortage, 1, 'moong shortage at 120');
assert(moong.orderQty === 1, 'moong order qty');
assert(at120.recipes.every(function (recipe) { return recipe.produced === 120; }), 'production portions follow guest count');
assert(at120.allergens.indexOf('celery') !== -1, 'allergen roll-up includes celery');
assert(at80.totals.cost !== at120.totals.cost, 'guest change recalculates menu cost');

var blocked = ops.scaleRecipe(ops.recipeById('onion-pakora'), 80);
assert(blocked.blocked, 'onion pakora is blocked');
assert(ops.blockReason(ops.recipeById('onion-pakora')).indexOf('Onion') !== -1, 'block reason names onion');

var jain = ops.plan(menu, { guests: 80, jain: 10 });
assert(jain.warnings.some(function (w) { return w.indexOf('khichdi') !== -1; }), 'jain warning for carrot khichdi');
var ekadashi = ops.plan(menu, { guests: 80, ekadashi: 4 });
assert(ekadashi.warnings.some(function (w) { return w.indexOf('Ekadashi') !== -1; }), 'ekadashi warning');

var waste = ops.plan(menu, { guests: 120, served: 100 });
assert(waste.surplus === 20, 'surplus covers');
close(waste.wasteCost, 13.64, 'waste cost from the same per-guest cost');

if (failed) {
  console.error(failed + ' assertion(s) failed');
  process.exit(1);
}
console.log('food-ops tests passed');
