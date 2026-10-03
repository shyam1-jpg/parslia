/**
 * Parslia Food Operations — client-side menu scaling.
 * Sample catalogue only. Does not write SOP records, supplier orders, or labels.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ParsliaFoodOps = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var BANNED = ['onion', 'garlic', 'leek', 'spring onion', 'chive', 'egg'];

  function round3(n) {
    return Math.round((Number(n) + Number.EPSILON) * 1000) / 1000;
  }

  function round2(n) {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  }

  function money(n) {
    return round2(n).toFixed(2);
  }

  function isBannedName(name) {
    var n = String(name || '').toLowerCase();
    return BANNED.some(function (word) { return n.indexOf(word) !== -1; });
  }

  function ingredient(spec) {
    return {
      id: spec.id,
      name: spec.name,
      qty: spec.qty,
      unit: spec.unit,
      costPerUnit: spec.costPerUnit,
      stock: spec.stock,
      pack: spec.pack,
      supplier: spec.supplier,
      allergens: spec.allergens || []
    };
  }

  var CATALOGUE = [
    {
      id: 'yellow-moong-soup',
      name: 'Yellow moong soup',
      slot: 'Soup / Starter',
      station: 'Hot',
      portions: 10,
      jainSafe: true,
      ekadashiSafe: false,
      allergens: ['celery'],
      ingredients: [
        ingredient({ id: 'moong-dal', name: 'Yellow moong dal', qty: 0.5, unit: 'kg', costPerUnit: 2.4, stock: 8, pack: 1, supplier: 'Suma' }),
        ingredient({ id: 'ginger', name: 'Ginger', qty: 0.05, unit: 'kg', costPerUnit: 4, stock: 1, pack: 0.25, supplier: 'Brakes' }),
        ingredient({ id: 'turmeric', name: 'Turmeric', qty: 0.02, unit: 'kg', costPerUnit: 8, stock: 0.4, pack: 0.1, supplier: 'Suma' }),
        ingredient({ id: 'celery', name: 'Celery', qty: 0.05, unit: 'kg', costPerUnit: 3, stock: 2, pack: 0.5, supplier: 'Brakes', allergens: ['celery'] })
      ]
    },
    {
      id: 'veg-khichdi',
      name: 'Vegetable khichdi',
      slot: 'Main',
      station: 'Hot',
      portions: 10,
      jainSafe: false,
      ekadashiSafe: false,
      allergens: [],
      ingredients: [
        ingredient({ id: 'rice', name: 'Basmati rice', qty: 0.3, unit: 'kg', costPerUnit: 1.8, stock: 6, pack: 2, supplier: 'Suma' }),
        ingredient({ id: 'moong-dal', name: 'Yellow moong dal', qty: 0.25, unit: 'kg', costPerUnit: 2.4, stock: 8, pack: 1, supplier: 'Suma' }),
        ingredient({ id: 'carrot', name: 'Carrot', qty: 0.4, unit: 'kg', costPerUnit: 1.1, stock: 4, pack: 1, supplier: 'Brakes' }),
        ingredient({ id: 'cumin', name: 'Cumin seed', qty: 0.01, unit: 'kg', costPerUnit: 12, stock: 0.2, pack: 0.05, supplier: 'Suma' })
      ]
    },
    {
      id: 'jeera-rice',
      name: 'Jeera rice',
      slot: 'Carbohydrate / Side',
      station: 'Hot',
      portions: 10,
      jainSafe: true,
      ekadashiSafe: false,
      allergens: [],
      ingredients: [
        ingredient({ id: 'rice', name: 'Basmati rice', qty: 0.3, unit: 'kg', costPerUnit: 1.8, stock: 6, pack: 2, supplier: 'Suma' }),
        ingredient({ id: 'cumin', name: 'Cumin seed', qty: 0.01, unit: 'kg', costPerUnit: 12, stock: 0.2, pack: 0.05, supplier: 'Suma' })
      ]
    },
    {
      id: 'cucumber-salad',
      name: 'Cucumber salad',
      slot: 'Salad 1',
      station: 'Cold',
      portions: 10,
      jainSafe: true,
      ekadashiSafe: true,
      allergens: [],
      ingredients: [
        ingredient({ id: 'cucumber', name: 'Cucumber', qty: 0.5, unit: 'kg', costPerUnit: 1.6, stock: 8, pack: 1, supplier: 'Brakes' }),
        ingredient({ id: 'lemon', name: 'Lemon', qty: 0.1, unit: 'kg', costPerUnit: 2.5, stock: 2, pack: 0.5, supplier: 'Suma' })
      ]
    },
    {
      id: 'stewed-apple',
      name: 'Stewed apple',
      slot: 'Dessert',
      station: 'Dessert',
      portions: 10,
      jainSafe: true,
      ekadashiSafe: true,
      allergens: [],
      ingredients: [
        ingredient({ id: 'apple', name: 'Apple', qty: 0.8, unit: 'kg', costPerUnit: 2, stock: 12, pack: 2, supplier: 'Brakes' }),
        ingredient({ id: 'cinnamon', name: 'Cinnamon', qty: 0.005, unit: 'kg', costPerUnit: 20, stock: 0.1, pack: 0.02, supplier: 'Suma' })
      ]
    },
    {
      id: 'onion-pakora',
      name: 'Onion pakora',
      slot: 'Soup / Starter',
      station: 'Hot',
      portions: 10,
      jainSafe: false,
      ekadashiSafe: false,
      allergens: ['gluten'],
      ingredients: [
        ingredient({ id: 'onion', name: 'Onion', qty: 0.4, unit: 'kg', costPerUnit: 1.2, stock: 3, pack: 1, supplier: 'Brakes' }),
        ingredient({ id: 'gram-flour', name: 'Gram flour', qty: 0.2, unit: 'kg', costPerUnit: 1.9, stock: 2, pack: 1, supplier: 'Suma', allergens: ['gluten'] })
      ]
    }
  ];

  var DEFAULT_IDS = ['yellow-moong-soup', 'veg-khichdi', 'jeera-rice', 'cucumber-salad', 'stewed-apple'];

  function recipeById(id) {
    for (var i = 0; i < CATALOGUE.length; i++) {
      if (CATALOGUE[i].id === id) return CATALOGUE[i];
    }
    return null;
  }

  function recipeBlocked(recipe) {
    if (!recipe) return true;
    if (recipe.ingredients.some(function (ing) { return isBannedName(ing.name); })) return true;
    return false;
  }

  function blockReason(recipe) {
    if (!recipe) return 'Unknown recipe';
    var hit = [];
    recipe.ingredients.forEach(function (ing) {
      if (isBannedName(ing.name)) hit.push(ing.name);
    });
    if (!hit.length) return '';
    return 'Satvic house rule: ' + hit.join(', ') + ' is not used (no onion, garlic, leek, spring onion, chives, or egg).';
  }

  function defaultMenu() {
    return DEFAULT_IDS.slice();
  }

  function scaleRecipe(recipe, guests) {
    var covers = Math.max(0, Number(guests) || 0);
    var yieldPortions = recipe.portions > 0 ? recipe.portions : 1;
    var factor = covers / yieldPortions;
    var allergens = {};
    (recipe.allergens || []).forEach(function (a) { allergens[a] = true; });
    var cost = 0;
    var ingredients = recipe.ingredients.map(function (ing) {
      var required = round3(ing.qty * factor);
      var lineCost = round2(required * ing.costPerUnit);
      cost += lineCost;
      (ing.allergens || []).forEach(function (a) { allergens[a] = true; });
      return {
        id: ing.id,
        name: ing.name,
        unit: ing.unit,
        required: required,
        costPerUnit: ing.costPerUnit,
        lineCost: lineCost,
        stock: ing.stock,
        pack: ing.pack,
        supplier: ing.supplier,
        allergens: ing.allergens || []
      };
    });
    cost = round2(cost);
    return {
      id: recipe.id,
      name: recipe.name,
      slot: recipe.slot,
      station: recipe.station,
      portions: recipe.portions,
      jainSafe: !!recipe.jainSafe,
      ekadashiSafe: !!recipe.ekadashiSafe,
      produced: covers,
      factor: factor,
      blocked: recipeBlocked(recipe),
      blockReason: blockReason(recipe),
      allergens: Object.keys(allergens),
      ingredients: ingredients,
      cost: cost,
      costPerGuest: covers ? round2(cost / covers) : 0
    };
  }

  function consolidate(scaledRecipes) {
    var map = {};
    var order = [];
    scaledRecipes.forEach(function (recipe) {
      recipe.ingredients.forEach(function (ing) {
        if (!map[ing.id]) {
          map[ing.id] = {
            id: ing.id,
            name: ing.name,
            unit: ing.unit,
            required: 0,
            costPerUnit: ing.costPerUnit,
            stock: ing.stock,
            pack: ing.pack,
            supplier: ing.supplier,
            allergens: ing.allergens.slice(),
            dishes: []
          };
          order.push(ing.id);
        }
        map[ing.id].required = round3(map[ing.id].required + ing.required);
        if (map[ing.id].dishes.indexOf(recipe.name) === -1) map[ing.id].dishes.push(recipe.name);
      });
    });
    return order.map(function (id) {
      var ing = map[id];
      var shortage = round3(Math.max(0, ing.required - ing.stock));
      var packs = shortage > 0 && ing.pack > 0 ? Math.ceil((shortage / ing.pack) - 1e-9) : 0;
      var orderQty = round3(packs * ing.pack);
      return {
        id: ing.id,
        name: ing.name,
        unit: ing.unit,
        required: ing.required,
        stock: ing.stock,
        shortage: shortage,
        pack: ing.pack,
        packs: packs,
        orderQty: orderQty,
        orderCost: round2(orderQty * ing.costPerUnit),
        supplier: ing.supplier,
        allergens: ing.allergens,
        dishes: ing.dishes
      };
    });
  }

  function plan(menuIds, options) {
    var opts = options || {};
    var guests = Math.max(0, Math.round(Number(opts.guests) || 0));
    var jain = Math.max(0, Math.round(Number(opts.jain) || 0));
    var ekadashi = Math.max(0, Math.round(Number(opts.ekadashi) || 0));
    var served = opts.served == null || opts.served === '' ? guests : Math.max(0, Math.round(Number(opts.served) || 0));
    var budget = opts.budget == null || opts.budget === '' ? null : Number(opts.budget);
    var ids = (menuIds || []).filter(function (id, index, all) {
      return recipeById(id) && all.indexOf(id) === index;
    });
    var recipes = ids.map(function (id) { return scaleRecipe(recipeById(id), guests); });
    var ingredients = consolidate(recipes);
    var cost = round2(recipes.reduce(function (sum, recipe) { return sum + recipe.cost; }, 0));
    var perGuest = guests ? round2(cost / guests) : 0;
    var allergens = {};
    recipes.forEach(function (recipe) {
      recipe.allergens.forEach(function (a) { allergens[a] = true; });
    });
    var surplus = Math.max(0, guests - served);
    var wasteCost = guests ? round2((surplus / guests) * cost) : 0;
    var stations = {};
    recipes.forEach(function (recipe) {
      if (!stations[recipe.station]) stations[recipe.station] = [];
      stations[recipe.station].push(recipe);
    });
    var warnings = [];
    recipes.forEach(function (recipe) {
      if (recipe.blocked) warnings.push(recipe.name + ' breaks the satvic rule and should be removed.');
    });
    if (jain > 0) {
      recipes.filter(function (recipe) { return !recipe.jainSafe; }).forEach(function (recipe) {
        warnings.push(recipe.name + ' is not marked Jain-safe (' + jain + ' Jain portions requested).');
      });
    }
    if (ekadashi > 0) {
      recipes.filter(function (recipe) { return !recipe.ekadashiSafe; }).forEach(function (recipe) {
        warnings.push(recipe.name + ' is not an Ekadashi version (' + ekadashi + ' Ekadashi portions requested).');
      });
    }
    if (budget != null && isFinite(budget) && perGuest > budget) {
      warnings.push('Food cost £' + money(perGuest) + ' per guest is over the £' + money(budget) + ' budget.');
    }
    var shortages = ingredients.filter(function (ing) { return ing.shortage > 0; });
    return {
      guests: guests,
      jain: jain,
      ekadashi: ekadashi,
      served: served,
      budget: budget,
      recipes: recipes,
      ingredients: ingredients,
      stations: stations,
      allergens: Object.keys(allergens),
      shortages: shortages,
      warnings: warnings,
      surplus: surplus,
      wasteCost: wasteCost,
      totals: {
        cost: cost,
        perGuest: perGuest,
        dishes: recipes.length,
        orderCost: round2(ingredients.reduce(function (sum, ing) { return sum + ing.orderCost; }, 0))
      }
    };
  }

  return {
    BANNED: BANNED.slice(),
    CATALOGUE: CATALOGUE,
    recipeById: recipeById,
    recipeBlocked: recipeBlocked,
    blockReason: blockReason,
    defaultMenu: defaultMenu,
    scaleRecipe: scaleRecipe,
    consolidate: consolidate,
    plan: plan,
    money: money,
    round2: round2,
    round3: round3
  };
});
